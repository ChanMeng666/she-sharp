/**
 * OpenAI-powered extraction: converts a free-form /event command and
 * channel context into a validated EventPatch.
 *
 * Uses responses.create() with structured outputs (json_schema mode) so
 * the model output is constrained to EventPatch shape. A final Zod pass
 * guards against any divergence.
 */

import OpenAI from "openai";

import { InvalidPatchError } from "./errors";
import { EventPatchSchema, type ValidatedEventPatch } from "./schema";
import { conventionsBlock } from "./conventions";
import type { ExtractionContext } from "./types";

const MODEL = "gpt-4.1-mini-2025-04-14";

let client: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  client = new OpenAI({ apiKey });
  return client;
}

/**
 * JSON Schema for structured output — a loose mirror of EventPatchSchema
 * that satisfies OpenAI's strict-mode requirements.
 */
// Non-strict schema: OpenAI strict mode requires additionalProperties: false
// on every object, but our `fields` and `event` properties intentionally hold
// arbitrary EventV3 subfields whose shape the model can pick freely. We rely
// on Zod validation (EventPatchSchema) to guarantee structural correctness
// after receiving the output.
const RESPONSE_JSON_SCHEMA = {
  name: "EventPatch",
  strict: false,
  schema: {
    type: "object",
    properties: {
      op: { type: "string", enum: ["update", "create", "clarify"] },
      eventSlug: { type: "string" },
      summary: { type: "string" },
      fields: { type: "object" },
      event: { type: "object" },
      imageChecklist: {
        type: "array",
        items: {
          type: "object",
          properties: {
            path: { type: "string" },
            description: { type: "string" },
            alreadyExists: { type: "boolean" },
          },
          required: ["path", "description"],
        },
      },
      question: { type: "string" },
    },
    required: ["op"],
  },
} as const;

function systemPrompt(context: ExtractionContext): string {
  return `You are the She Sharp Event Bot. You help an admin update the events JSON
file for the She Sharp website from Slack. You produce STRUCTURED operations
(EventPatch) that will be applied to lib/data/json/events-custom.json.

Your operation options:
- op="update": modify fields on an existing event. Set eventSlug to the slug
  of the event being modified, and put only the changing fields in "fields".
  "fields" is deep-merged into the event, so use NESTED paths (e.g.
  {"detailPageData": {"galleryUrl": "..."}}), NOT flat keys at the event root.
  Leave "event" as an empty object and "question" as an empty string.
- op="create": create a new event. Populate "event" with as much of the
  EventV3 structure as you can. Leave "eventSlug" empty, "fields" as empty
  object, and "question" as empty string.
- op="clarify": when the admin's request is ambiguous or you are not
  confident which event they mean. Populate "question" with your clarifying
  question. Leave the other fields empty / empty string / empty object.

CRITICAL SCHEMA CONSISTENCY RULES — must obey all four:
1. REUSE EXISTING FIELD NAMES. Never invent synonym field names. The summary
   below lists each event's existing URL slots. If you want to attach a
   Google Photos album, use "galleryUrl" (the established name). Do NOT
   create "photosUrl", "googlePhotosUrl", "gphotos", or similar.
2. FILL EMPTY SLOTS FIRST. If an event already has a matching field set to
   "" or [], fill that field — do not add a new sibling field next to it.
3. RESPECT NESTING. URL and content fields (galleryUrl, registrationUrl,
   humanitixUrl, humanitixId, photos, images, speakers, sponsors, location,
   specialSections, coverImage, fullDescription, etc.) live INSIDE
   "detailPageData" on each event, not at the event root. Event-root fields
   are only: id, slug, title, date, coverImage, detailPageUrl,
   shortDescription, attendees, checkedIn, detailPageData.
4. KNOWN URL CONVENTIONS (use these names verbatim, inside detailPageData):
   - galleryUrl → Google Photos album / recap gallery link
   - registrationUrl → ticket / RSVP page
   - humanitixUrl → Humanitix event page
   - humanitixId → Humanitix event ID (string)
   - url → event detail page URL on shesharp.org.nz

Always include a concise "summary" (≤ 80 chars) for the preview UI, e.g.
"Add speaker Danubi Paim to IWD 2026".

CRITICAL NO-FABRICATION RULE:
Never invent concrete values. URLs (Google Photos links, registration links,
social media), dates, people's names, job titles, sponsor names, image paths,
and any other factual field MUST come verbatim from either the admin's /event
command or the channel messages quoted below. If a value is not present in
either source, you MUST NOT fill it in — return op="clarify" with a specific
question naming the missing value (e.g. "What is the Google Photos URL for
this event? I couldn't find one in the channel."). Do NOT use placeholder
tokens like "updated-url", "TBD", "example.com", or "…" as values. Do NOT
paraphrase a URL the admin referenced without pasting it — if you don't have
the exact string, ask.

CHANNEL-FIRST MODE:
When the admin's /event text is empty or very short (e.g. just
"summarize this channel"), treat the channel messages as the primary source
of truth. Identify which existing event this channel is about (match on
channel name, topic, and message content against the events array below),
then propose an update that reflects concrete new facts from the messages —
added speakers, changed venue, posted recap links, finalised run-sheet,
etc. Skip fields you don't have direct channel evidence for.

${context.conventions}

Sponsor inventory (canonical logos at /img/sponsors/<slug>.svg):
${context.sponsorInventory.join(", ") || "(none)"}

Current events-custom.json events array (summary):
${context.currentEventsJson}

Channel name: ${context.channelName}
Channel topic: ${context.channelTopic || "(none)"}

Recent channel messages (oldest first):
${context.channelMessages.slice(0, 12000) || "(none)"}

Admin's /event command: "${context.userCommand}"

If the admin's command does not name a specific event and the channel messages
don't point to a clear single event, return op="clarify". Otherwise match the
channel context to one existing event (prefer exact title matches in channel
topic/name over inferred matches).
`.trim();
}

export async function extractEventPatch(ctx: ExtractionContext): Promise<ValidatedEventPatch> {
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt(ctx) },
      { role: "user", content: ctx.userCommand },
    ],
    response_format: { type: "json_schema", json_schema: RESPONSE_JSON_SCHEMA },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new InvalidPatchError("empty response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InvalidPatchError("response is not valid JSON");
  }

  // The model is required by schema to return all top-level keys; collapse
  // unused ones so EventPatchSchema.discriminatedUnion accepts the result.
  const collapsed = collapseByOp(parsed as Record<string, unknown>);

  const result = EventPatchSchema.safeParse(collapsed);
  if (!result.success) {
    throw new InvalidPatchError(result.error.issues.map((i) => i.message).join("; "));
  }
  return result.data;
}

function collapseByOp(raw: Record<string, unknown>): unknown {
  switch (raw.op) {
    case "update":
      return {
        op: "update",
        eventSlug: raw.eventSlug,
        summary: raw.summary,
        fields: raw.fields ?? {},
        imageChecklist: raw.imageChecklist ?? [],
      };
    case "create":
      return {
        op: "create",
        summary: raw.summary,
        event: raw.event ?? {},
        imageChecklist: raw.imageChecklist ?? [],
      };
    case "clarify":
      return { op: "clarify", question: raw.question };
    default:
      return raw;
  }
}

/**
 * Produce a compact summary of the events JSON for the system prompt
 * context. Full JSON is too large; we send slug + title + status plus a
 * per-event snapshot of the URL slots so the model can see which fields
 * already exist (and which are empty, i.e. available to fill) without
 * inventing synonym names.
 */
export function summariseEventsForPrompt(eventsJsonText: string): string {
  try {
    const data = JSON.parse(eventsJsonText) as {
      events?: Array<{
        slug: string;
        title: string;
        date: string;
        detailPageData?: Record<string, unknown>;
      }>;
    };
    const events = data.events ?? [];
    const URL_SLOTS = ["galleryUrl", "registrationUrl", "humanitixUrl", "humanitixId", "url"];
    return events
      .map((e) => {
        const d = e.detailPageData ?? {};
        const status = typeof d.status === "string" ? d.status : "unknown";
        const slotLines = URL_SLOTS.map((slot) => {
          const v = d[slot];
          if (v === undefined) return `    ${slot}: (not present)`;
          if (v === "" || (Array.isArray(v) && v.length === 0)) return `    ${slot}: (empty — available to fill)`;
          return `    ${slot}: set`;
        }).join("\n");
        return `- slug="${e.slug}" title="${e.title}" date="${e.date}" status="${status}"\n${slotLines}`;
      })
      .join("\n");
  } catch {
    return "(could not parse events-custom.json)";
  }
}
