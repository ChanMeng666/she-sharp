/**
 * AI editorial drafting for a monthly newsletter issue.
 *
 * Turns the machine-owned `auto` snapshot (see `assemble.ts`) into the
 * human-owned `editorial` block: subject line, founder note, recap intro,
 * per-event blurbs, the single primary CTA, evergreen opportunities, and a
 * sponsor thank-you. The draft is written ONCE and then human-edited, so this
 * only ever produces a starting point.
 *
 * The model is direct OpenAI `gpt-4o-mini` (matching `lib/matching`), asked for
 * a JSON object validated against `editorialSchema`. When `OPENAI_API_KEY` is
 * unset the generator degrades to a deterministic stub so the cron keeps
 * running instead of dying.
 */

import OpenAI from "openai";

import { editorialSchema, type IssueAuto, type IssueEditorial } from "./schema";

/** Canonical evergreen get-involved links (absolute — email needs absolute URLs). */
const MENTOR_URL = "https://www.shesharp.org.nz/mentorship/mentor";
const VOLUNTEER_URL = "https://www.shesharp.org.nz/join-our-team";
const DONATE_URL = "https://www.shesharp.org.nz/donate";

/** Fixed order of the three evergreen opportunities (hrefs are non-negotiable). */
const OPPORTUNITY_HREFS = [MENTOR_URL, VOLUNTEER_URL, DONATE_URL] as const;

/** Deterministic evergreen opportunities used by the no-AI stub. */
const EVERGREEN_OPPORTUNITIES: IssueEditorial["opportunities"] = [
  {
    title: "Become a mentor",
    body: "Share your experience with a woman finding her feet in STEM. Our mentorship programme pairs you with a mentee and gives you the structure to make it count.",
    href: MENTOR_URL,
  },
  {
    title: "Volunteer with us",
    body: "Every event runs on people who lend a hand. Help out behind the scenes, grow your network, and see the community from the inside.",
    href: VOLUNTEER_URL,
  },
  {
    title: "Support She Sharp",
    body: "Our events are free because people back them. A donation of any size keeps the doors open for the next wave of women in tech.",
    href: DONATE_URL,
  },
];

/** Lazily-initialised OpenAI client (mirrors `lib/matching/openai-service.ts`). */
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/** English month name for a 1-12 month number (deterministic, locale-fixed). */
function monthName(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" });
}

/**
 * System prompt: who She Sharp is, the voice, and the exact JSON contract the
 * model must satisfy. Kept as a named export so tests / reviewers can inspect it.
 */
export const EDITORIAL_SYSTEM_PROMPT = `You are the editor of She Sharp's monthly email newsletter.

She Sharp is a New Zealand non-profit bridging the gender gap in STEM. It runs free community events, a mentorship programme, and a welcoming network for women and gender-diverse people in tech. Your voice is warm, inclusive, and encouraging — a real community member writing to friends, never corporate marketing speak. Use plain English and short sentences. Use New Zealand spelling (organise, programme, colour). Greeting with "Kia ora" is welcome.

Return a SINGLE JSON object and nothing else. It must match this exact shape and rules:

- subjectLine: string, at most 50 characters. Punchy and specific to THIS month's highlights. At most one emoji, and only if it feels natural.
- previewText: string, at most 120 characters. Written as the subject line's payoff companion — it must complement the subject and must NOT repeat its words.
- founderNote: an object { heading, bodyMd, signature }.
    heading: a short warm title, e.g. "A note from the team".
    bodyMd: 2-3 short warm paragraphs (markdown — paragraphs and links only) that reference this month's ACTUAL highlights from the data below. Never begin bodyMd with a greeting or salutation ("Hi ...", "Kia ora ...") — the email template already injects a personalized greeting directly above it.
    signature: exactly "The She Sharp Team".
- spotlight: always null (a human picks the person later).
- photoOfTheMonth: always null (a human picks it later).
- recapIntro: 1-2 sentences introducing last month's recap.
- eventBlurbs: an object keyed by each recap event's slug, each value one lively single sentence about that event. Exactly one entry per recap event and no others. If there are no recap events, return an empty object.
- primaryCta: an object { label, href }. label is at most 40 characters and imperative. Choose THE single most important action from the upcoming events: use that event's registrationUrl if it has one, otherwise its url. If there are no upcoming events, use ${MENTOR_URL} with a fitting label.
- opportunities: exactly three entries, in this order — mentor, volunteer, donate — each { title, body, href } with fresh, non-repetitive copy:
    1. href ${MENTOR_URL} (become a mentor)
    2. href ${VOLUNTEER_URL} (volunteer with us)
    3. href ${DONATE_URL} (support / donate)
- sponsorThanks: 1-2 warm sentences. Thank the sponsors or host venues of this month's events by name if any appear in the data, otherwise give a general thank-you to supporters. Never null.

Return only the JSON object.`;

/**
 * Builds the user prompt for one issue: the month label plus a compact JSON of
 * the recap/upcoming events the model needs (sponsors are not carried on
 * AutoEvent, so they are omitted). Exported so tests can assert its contents.
 */
export function buildEditorialPrompt(opts: {
  year: number;
  month: number;
  auto: IssueAuto;
}): string {
  const { year, month, auto } = opts;
  const label = `${monthName(year, month)} ${year}`;

  const compact = {
    month: label,
    stats: auto.stats,
    recapEvents: auto.recapEvents.map((e) => ({
      slug: e.slug,
      title: e.title,
      dateLabel: e.dateLabel,
      locationLabel: e.locationLabel,
      shortDescription: e.shortDescription,
    })),
    upcomingEvents: auto.upcomingEvents.map((e) => ({
      slug: e.slug,
      title: e.title,
      dateLabel: e.dateLabel,
      locationLabel: e.locationLabel,
      url: e.url,
      registrationUrl: e.registrationUrl,
      shortDescription: e.shortDescription,
    })),
  };

  return `Write the She Sharp newsletter for ${label}.

Data for this issue (JSON):
${JSON.stringify(compact, null, 2)}

Remember: return ONLY the JSON object described in your instructions.`;
}

/** Parses a model response as JSON, tolerating stray prose around the object. */
function extractJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

/**
 * Applies the non-negotiable post-processing rules on top of a schema-valid
 * model draft: spotlight/photo are always human-picked (forced null), and the
 * three opportunity hrefs are pinned to the canonical evergreen URLs in order.
 */
function finalizeEditorial(draft: IssueEditorial): IssueEditorial {
  const opportunities =
    draft.opportunities.length === OPPORTUNITY_HREFS.length
      ? draft.opportunities.map((o, i) => ({ ...o, href: OPPORTUNITY_HREFS[i] }))
      : EVERGREEN_OPPORTUNITIES;

  return {
    ...draft,
    spotlight: null,
    photoOfTheMonth: null,
    opportunities,
  };
}

/**
 * Generates the AI editorial draft for an issue month from its auto snapshot.
 *
 * Uses `gpt-4o-mini` (respecting an `OPENAI_MODEL` override) at temperature
 * ~0.6, and retries once — feeding the zod validation error back into the
 * conversation — before throwing. Falls back to `emptyEditorialStub` when
 * `OPENAI_API_KEY` is unset so callers degrade gracefully.
 */
export async function generateEditorial(opts: {
  year: number;
  month: number;
  auto: IssueAuto;
}): Promise<IssueEditorial> {
  if (!process.env.OPENAI_API_KEY) {
    return emptyEditorialStub(opts.auto);
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const openai = getOpenAI();

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: EDITORIAL_SYSTEM_PROMPT },
    { role: "user", content: buildEditorialPrompt(opts) },
  ];

  let lastError = "";
  const MAX_ATTEMPTS = 2;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = editorialSchema.safeParse(extractJson(content));
    if (parsed.success) {
      return finalizeEditorial(parsed.data);
    }

    lastError = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");

    // Feed the failure back so the retry can correct exactly what was wrong.
    messages.push({ role: "assistant", content });
    messages.push({
      role: "user",
      content: `That JSON failed validation:\n${lastError}\n\nReturn a corrected JSON object that fixes every issue above. Return only the JSON object.`,
    });
  }

  throw new Error(
    `generateEditorial: model output failed schema validation after ${MAX_ATTEMPTS} attempts — ${lastError}`
  );
}

/**
 * Deterministic, no-AI editorial fallback used when `OPENAI_API_KEY` is unset.
 * Copy is generic but valid; the primary CTA points at the first upcoming event
 * (its registration link if present, else its page), or the mentor sign-up when
 * there are no upcoming events.
 */
export function emptyEditorialStub(auto: IssueAuto): IssueEditorial {
  const firstUpcoming = auto.upcomingEvents[0] ?? null;

  const primaryCta = firstUpcoming
    ? {
        label: "See what's on",
        href: firstUpcoming.registrationUrl ?? firstUpcoming.url,
      }
    : { label: "Become a mentor", href: MENTOR_URL };

  const eventBlurbs: Record<string, string> = {};
  for (const event of auto.recapEvents) {
    eventBlurbs[event.slug] =
      `${event.title} brought our community together — thank you to everyone who came along.`;
  }

  return {
    subjectLine: "Your She Sharp community update",
    previewText:
      "A look back at recent events, plus upcoming ways to connect, learn, and get involved with women in STEM.",
    founderNote: {
      heading: "A note from the team",
      bodyMd:
        "Kia ora,\n\nThank you for being part of the She Sharp community. Here is a quick round-up of what we have been up to and what is coming next.\n\nWe would love to see you at an upcoming event, and there are always ways to get more involved — as a mentor, a volunteer, or a supporter.",
      signature: "The She Sharp Team",
    },
    spotlight: null,
    photoOfTheMonth: null,
    recapIntro: "Here is a look back at what our community got up to recently.",
    eventBlurbs,
    primaryCta,
    opportunities: EVERGREEN_OPPORTUNITIES,
    sponsorThanks:
      "A heartfelt thank you to the sponsors, host venues, and volunteers who make our events possible. This community would not exist without you.",
  };
}
