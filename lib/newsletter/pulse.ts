/**
 * "NZ Tech Pulse" — the monthly NZ tech-industry data section of the newsletter.
 *
 * The section is deliberately anti-hallucination: any number shown to readers is
 * copied VERBATIM from a fetched source, never computed or invented by the model.
 * The pipeline is:
 *
 *   1. `fetchPulseSources()` — best-effort network reads (SEEK NZ employment
 *      report + NZ tech RSS feeds). Every fetch is time-boxed and swallowed to
 *      null/[] on failure so this layer can never throw.
 *   2. `buildPulse()` — an OpenAI `gpt-4o-mini` pass that phrases a hero stat and
 *      one news bite from the fetched payloads, followed by a programmatic
 *      assertion that every displayed number appears verbatim in the source text.
 *   3. Fallback ladder: fresh fetched data → evergreen fact pool → `null`
 *      (section omitted). A model-invented number NEVER reaches a reader.
 *
 * See `lib/data/nz-tech-facts.ts` for the evergreen pool.
 */

import * as cheerio from "cheerio";
import OpenAI from "openai";
import Parser from "rss-parser";
import { z } from "zod";

import {
  AUCKLAND_FACTS,
  NZ_TECH_FACTS,
  NZ_TECH_NUMERIC_FACTS,
  NZ_WIDE_FACTS,
  type NzTechFact,
} from "@/lib/data/nz-tech-facts";
import { globalStats } from "@/lib/data/stats";
import { editorialSchema, type IssueEditorial } from "./schema";

/** The rendered pulse shape (nullable), reused for validating assembled output. */
type Pulse = IssueEditorial["pulse"];

/** Raw source payloads gathered for one issue (any part may be missing). */
export interface PulseSourceData {
  seekArticle: { title: string; url: string; text: string } | null;
  newsItems: {
    title: string;
    url: string;
    source: string;
    isoDate: string | null;
    snippet: string;
  }[];
}

// --- Fetch configuration -----------------------------------------------------

/** Per-request wall-clock budget; sites that hang must not stall the cron. */
const FETCH_TIMEOUT_MS = 8000;

/** Some sites 403 the default fetch UA, so present a realistic browser one. */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** SEEK NZ monthly employment report listing (primary + mirror host). */
const SEEK_LISTING_URLS = [
  "https://www.seek.co.nz/about/news/category/seek-employment-reports",
  "https://nz.seek.com/about/news/category/seek-employment-reports",
];

/** NZ tech news RSS feeds. */
const RSS_FEED_URLS = [
  { url: "https://itbrief.co.nz/feed", source: "IT Brief NZ" },
  { url: "https://techday.co.nz/feed", source: "TechDay NZ" },
];

/** Only surface RSS items published within this many days. */
const RSS_MAX_AGE_DAYS = 35;

/** How many combined RSS items to keep. */
const RSS_TOP_N = 8;

/**
 * Local-first relevance tiers for ranking RSS titles. She Sharp is an in-person
 * Auckland community, so an Auckland story always outranks a generic NZ one.
 * Lower rank sorts to the front.
 */
/** Tier 0: an Auckland/Tāmaki Makaurau angle (places, campuses, local companies). */
const RSS_AUCKLAND =
  /Auckland|Tāmaki Makaurau|Tamaki Makaurau|\bAUT\b|University of Auckland|\bCBD\b|Wynyard Quarter|Grid ?AKL|GridAKL|\bXero\b|\bHalter\b|Seequent|Vend|Timely|Dawn Aerospace/i;
/** Tier 1: women / diversity / AI / skills — She Sharp's mission topics.
 * AI is word-bounded so it does not match substrings like "again" or "campaign". */
const RSS_TOPICAL =
  /women|diversity|inclusion|\bAI\b|skills|hiring|startup|funding|mentor/i;
/** Tier 2: anything New Zealand-wide (still preferred over unrelated items). */
const RSS_NZ = /New Zealand|Aotearoa|\bNZ\b|Kiwi/i;

/**
 * Ranks an RSS item title by local relevance: 0 = Auckland angle, 1 = women /
 * diversity / AI / skills topic, 2 = general NZ, 3 = everything else. Exported so
 * the ordering can be unit-tested without touching the network.
 */
export function rssRelevanceRank(title: string): number {
  if (RSS_AUCKLAND.test(title)) return 0;
  if (RSS_TOPICAL.test(title)) return 1;
  if (RSS_NZ.test(title)) return 2;
  return 3;
}

/** Cap on extracted article body length fed to the model. */
const ARTICLE_TEXT_CAP = 6000;

// --- Network helpers ---------------------------------------------------------

/**
 * Fetches a URL as text with an abort-based timeout and a realistic UA. Returns
 * null on any failure (timeout, non-2xx, network error) — never throws. The
 * `accept` header is caller-tunable: some feed CDNs 406 anything that is not a
 * generous XML-friendly Accept.
 */
async function fetchText(
  url: string,
  accept = "text/html,application/xhtml+xml"
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: accept },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Accept header that the NZ tech feed CDNs return 200 for (they 406 otherwise). */
const FEED_ACCEPT = "application/rss+xml, application/xml, text/xml, */*";

/**
 * Reads the SEEK employment-reports listing, follows the newest article link,
 * and extracts its title + main body text. Tries each candidate host in turn.
 */
async function fetchSeekArticle(): Promise<PulseSourceData["seekArticle"]> {
  for (const listingUrl of SEEK_LISTING_URLS) {
    const listingHtml = await fetchText(listingUrl);
    if (!listingHtml) continue;

    const origin = new URL(listingUrl).origin;
    const articleUrl = findNewestArticleLink(listingHtml, origin);
    if (!articleUrl) continue;

    const articleHtml = await fetchText(articleUrl);
    if (!articleHtml) continue;

    const { title, text } = extractArticle(articleHtml);
    if (!text) continue;

    return { title: title || "SEEK NZ Employment Report", url: articleUrl, text };
  }
  return null;
}

/**
 * Picks the newest article link from a SEEK listing page: the first anchor whose
 * href points into `/about/news/` but is not itself a category index page.
 */
function findNewestArticleLink(html: string, origin: string): string | null {
  const $ = cheerio.load(html);
  const seen = new Set<string>();

  for (const el of $("a[href]").toArray()) {
    const href = $(el).attr("href");
    if (!href) continue;
    if (!href.includes("/about/news/")) continue;
    if (href.includes("/category/")) continue;

    let absolute: string;
    try {
      absolute = new URL(href, origin).toString();
    } catch {
      continue;
    }
    // The listing renders newest-first; return the first real article we meet.
    if (seen.has(absolute)) continue;
    seen.add(absolute);
    return absolute;
  }
  return null;
}

/** Strips chrome from an article page and returns its title + collapsed body text. */
function extractArticle(html: string): { title: string; text: string } {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, header, footer, form, aside").remove();

  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("h1").first().text().trim() ||
    $("title").text().trim();

  const container = $("article").first();
  const raw = (container.length ? container : $("main").length ? $("main") : $("body"))
    .text()
    .replace(/\s+/g, " ")
    .trim();

  return { title, text: raw.slice(0, ARTICLE_TEXT_CAP) };
}

/**
 * Reads the configured RSS feeds, keeps recent items, sorts topical matches to
 * the front, and returns the combined top N. Each feed failure is isolated.
 */
async function fetchRssItems(): Promise<PulseSourceData["newsItems"]> {
  // Fetch the XML ourselves (with our timeout + Accept) and hand it to the
  // parser as a string — parser.parseURL sends an Accept the feeds reject (406).
  const parser = new Parser();

  const cutoff = Date.now() - RSS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  const perFeed = await Promise.allSettled(
    RSS_FEED_URLS.map(async ({ url, source }) => {
      const xml = await fetchText(url, FEED_ACCEPT);
      if (!xml) return [];
      const feed = await parser.parseString(xml);
      return (feed.items ?? []).map((item) => ({
        title: (item.title ?? "").trim(),
        url: (item.link ?? "").trim(),
        source,
        isoDate: item.isoDate ?? null,
        snippet: (item.contentSnippet ?? item.content ?? "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500),
      }));
    })
  );

  const all = perFeed
    .filter(
      (r): r is PromiseFulfilledResult<PulseSourceData["newsItems"]> =>
        r.status === "fulfilled"
    )
    .flatMap((r) => r.value)
    .filter((item) => item.title && item.url)
    .filter((item) => {
      if (!item.isoDate) return true; // keep undated items rather than lose them
      const t = Date.parse(item.isoDate);
      return Number.isNaN(t) || t >= cutoff;
    });

  // Auckland-relevant titles first, then topical, then general NZ; newest first
  // within each tier.
  all.sort((a, b) => {
    const relA = rssRelevanceRank(a.title);
    const relB = rssRelevanceRank(b.title);
    if (relA !== relB) return relA - relB;
    const dateA = a.isoDate ? Date.parse(a.isoDate) : 0;
    const dateB = b.isoDate ? Date.parse(b.isoDate) : 0;
    return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
  });

  return all.slice(0, RSS_TOP_N);
}

/**
 * Gathers all pulse source payloads in parallel. Never throws; any component
 * that fails comes back as null / an empty array so the caller can degrade.
 */
export async function fetchPulseSources(): Promise<PulseSourceData> {
  const [seek, rss] = await Promise.allSettled([
    fetchSeekArticle(),
    fetchRssItems(),
  ]);

  return {
    seekArticle: seek.status === "fulfilled" ? seek.value : null,
    newsItems: rss.status === "fulfilled" ? rss.value : [],
  };
}

// --- Verbatim-number guard ---------------------------------------------------

/** Matches a number token: a digit run optionally carrying commas, dots or %. */
const NUMBER_TOKEN = /\d[\d,.%]*/g;

/**
 * Extracts every number-like token from a piece of text, with trailing sentence
 * punctuation stripped (so "18%." → "18%" and "12,000." → "12,000", while the
 * internal dot of "5.2%" is preserved).
 */
export function extractNumberTokens(text: string): string[] {
  return (text.match(NUMBER_TOKEN) ?? [])
    .map((token) => token.replace(/[.,]+$/, ""))
    .filter((token) => token.length > 0);
}

/**
 * Verifies that every meaningful number in `generated` appears verbatim in
 * `sourceCorpus`. Single-character digit tokens (e.g. the "1" and "5" in
 * "1 in 5") are ignored — they are ordinary English and too noisy to police;
 * the rule targets fabricated statistics (≥2 chars, e.g. "5.2%", "29%").
 */
export function assertNumbersVerbatim(
  generated: string,
  sourceCorpus: string,
  opts: { minLen?: number } = {}
): { ok: boolean; offending: string[] } {
  const minLen = opts.minLen ?? 2;
  const offending = extractNumberTokens(generated)
    .filter((token) => token.length >= minLen)
    .filter((token) => !sourceCorpus.includes(token));
  return { ok: offending.length === 0, offending: [...new Set(offending)] };
}

// --- Evergreen fallback ------------------------------------------------------

/**
 * Display framing for each numeric evergreen fact used as a hero stat. `value`
 * is always a verbatim substring of the fact's own text; `context` is the full
 * fact so the number remains attributable and self-verifying.
 */
const HERO_STAT_FRAMING: Record<string, { value: string; label: string }> = {
  "women-it-roles-29": { value: "29%", label: "of NZ professional IT roles are held by women" },
  "girls-stem-career-interest": {
    value: "1 in 20",
    label: "Kiwi girls consider a high-paid STEM career",
  },
  "gender-pay-gap-52": { value: "5.2%", label: "NZ gender pay gap — the lowest on record" },
  "tech-roles-immigration-55": {
    value: "55%",
    label: "of new NZ tech roles are filled through immigration",
  },
  // Kept in lockstep with the fact's own text via globalStats, so `value`
  // stays a verbatim substring of it.
  "she-sharp-growth": {
    value: `${globalStats.members.current}+`,
    label: "She Sharp members since 2014",
  },
  // Auckland — She Sharp's in-person home city.
  "auckland-tech-gdp-54": {
    value: "54%",
    label: "of NZ's tech-sector GDP is generated in Auckland",
  },
  "auckland-top-companies-60": {
    value: "60%",
    label: "of NZ's top 200 tech companies call Auckland home",
  },
  "auckland-tin200-exports-59": {
    value: "59%",
    label: "of NZ's TIN200 tech exports come from Auckland",
  },
  "aut-women-in-tech-30": {
    value: "30+",
    label: "AUT Women in Tech events since 2022",
  },
};

/** Non-negative modulo, so negative month indexes still rotate sanely. */
function wrap(index: number, length: number): number {
  return ((index % length) + length) % length;
}

/** Builds a hero-stat object from an evergreen numeric fact. */
function heroStatFromFact(fact: NzTechFact): NonNullable<Pulse>["heroStat"] {
  const framing = HERO_STAT_FRAMING[fact.id];
  const value = framing?.value ?? extractNumberTokens(fact.text)[0] ?? fact.text;
  return {
    value,
    label: framing?.label ?? "NZ women in tech, by the numbers",
    context: fact.text,
    sourceLabel: fact.sourceLabel,
    sourceUrl: fact.sourceUrl,
  };
}

/**
 * Deterministic, network-free pulse built entirely from the evergreen pool.
 * Rotates the hero stat through the numeric facts by month index and pairs it
 * with a different "did you know" fact; `newsBite` is always null.
 */
export function evergreenPulse(monthIndex: number): Pulse {
  const heroFact =
    NZ_TECH_NUMERIC_FACTS[wrap(monthIndex, NZ_TECH_NUMERIC_FACTS.length)];
  const heroStat = heroStatFromFact(heroFact);

  return {
    heroStat,
    newsBite: null,
    // Skip any fact sharing the hero's source so the two lines cite distinct sources.
    didYouKnow: evergreenDidYouKnow(monthIndex, heroFact.sourceUrl),
  };
}

/**
 * Picks the evergreen "did you know" fact, skipping the hero fact's source.
 *
 * Rotation is biased so roughly every other month feels local: odd month indexes
 * draw from the Auckland pool, even ones from the NZ-wide pool (deterministic,
 * with wraparound). Each pool has several distinct sources, so excluding the
 * hero's URL never empties it — but a cross-pool then whole-pool fallback keeps
 * this total.
 */
function evergreenDidYouKnow(
  monthIndex: number,
  excludeSourceUrl: string | null
): NonNullable<Pulse>["didYouKnow"] {
  const auckland = monthIndex % 2 !== 0;
  const primary = auckland ? AUCKLAND_FACTS : NZ_WIDE_FACTS;
  const secondary = auckland ? NZ_WIDE_FACTS : AUCKLAND_FACTS;

  const usable = (list: readonly NzTechFact[]) =>
    list.filter((fact) => fact.sourceUrl !== excludeSourceUrl);

  const pool =
    usable(primary).length > 0
      ? usable(primary)
      : usable(secondary).length > 0
        ? usable(secondary)
        : NZ_TECH_FACTS;

  const fact = pool[wrap(monthIndex, pool.length)];
  return { text: fact.text, sourceLabel: fact.sourceLabel, sourceUrl: fact.sourceUrl };
}

// --- Model generation --------------------------------------------------------

/** Lazily-initialised OpenAI client (mirrors `generate.ts`). */
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/** Shape the model must return (attribution is filled in by us, not the model). */
const modelPulseSchema = z.object({
  heroStat: z
    .object({
      value: z.string().min(1),
      label: z.string().min(1),
      context: z.string().min(1),
    })
    .nullable(),
  newsBite: z
    .object({
      title: z.string().min(1),
      summary: z.string().min(1),
      url: z.string().url(),
      sourceLabel: z.string().min(1),
    })
    .nullable(),
});

type ModelPulse = z.infer<typeof modelPulseSchema>;

const PULSE_SYSTEM_PROMPT = `You are the data editor of She Sharp's monthly newsletter, writing a short "NZ Tech Pulse" section for a New Zealand women-in-tech community based in Auckland (Tāmaki Makaurau), where She Sharp runs its in-person events. Voice: warm, plain English, New Zealand spelling.

ABSOLUTE ANTI-HALLUCINATION RULES — these override everything:
- Every number you write MUST be copied character-for-character from the source text provided. Never compute, round, estimate, combine, or invent a number. If a number is not present verbatim in the source, do not write any number.
- Only use facts stated in the provided source text. Do not add outside knowledge.
- For the news bite, you MUST use one of the exact article URLs given; never invent or modify a URL.

LOCAL PREFERENCE (never overrides the rules above):
- When two candidates are equally relevant, prefer the one with an Auckland / Tāmaki Makaurau connection (a local venue, campus, or company).
- If the chosen news item has an Auckland angle stated in its own text, mention that connection in the summary. If it does not, do not add one.

Return a SINGLE JSON object and nothing else, matching:
{
  "heroStat": { "value": string, "label": string, "context": string } | null,
  "newsBite": { "title": string, "summary": string, "url": string, "sourceLabel": string } | null
}

- heroStat: pick ONE VERBATIM number from the SEEK employment report text. Prefer a number about technology, ICT, software, AI, digital skills, or women/gender if one is present; otherwise choose the most striking overall. "value" is that exact number as written (e.g. "5.2%", "12,000"). "label" is a short phrase (≤8 words) naming what it measures. "context" is one sentence of plain-English framing; any number inside it must also be verbatim from the source. You may add an Auckland framing to the context ONLY if the source text itself mentions Auckland — otherwise keep it as written (SEEK is a nationwide report, and that is fine). If no SEEK text is provided, return heroStat: null.
- newsBite: choose ONE news item most relevant to women in tech or the NZ tech industry, preferring an Auckland-connected story when two are equally relevant. "title" echoes the item's headline, "summary" is at most two sentences, "url" is that item's exact URL, "sourceLabel" is that item's source. If the item's text names an Auckland location, campus, or company, name it in the summary. If no news items are provided, return newsBite: null.

Return only the JSON object.`;

/** Tolerant JSON extraction (mirrors `generate.ts`). */
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

/** Builds the literal source payload the model reasons over. */
function buildModelUserPrompt(sources: PulseSourceData, monthLabel: string): string {
  const seek = sources.seekArticle
    ? { title: sources.seekArticle.title, url: sources.seekArticle.url, text: sources.seekArticle.text }
    : null;

  const news = sources.newsItems.map((item) => ({
    title: item.title,
    url: item.url,
    source: item.source,
    snippet: item.snippet,
  }));

  return `Month: ${monthLabel}

SEEK NZ employment report (source text — numbers must be copied verbatim):
${seek ? JSON.stringify(seek, null, 2) : "(none available)"}

NZ tech news items (choose at most one for the news bite; use its exact url):
${news.length ? JSON.stringify(news, null, 2) : "(none available)"}

Return ONLY the JSON object described in your instructions.`;
}

/**
 * Runs the model once, parsing + schema-validating the response. Returns null on
 * unparseable / invalid output so the caller can retry or fall back.
 */
async function callModel(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<{ parsed: ModelPulse | null; raw: string; error: string }> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await getOpenAI().chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const result = modelPulseSchema.safeParse(extractJson(raw));
  if (result.success) return { parsed: result.data, raw, error: "" };
  const error = result.error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
  return { parsed: null, raw, error };
}

/**
 * Assembles the pulse section for one issue from fetched sources.
 *
 * Flow: with no API key or no usable sources, returns the evergreen pulse. Else
 * it asks the model for a hero stat + news bite, asserts every displayed number
 * is verbatim from the source corpus (retrying once with the error), and drops
 * or falls back any component that still fails its check — so a fabricated
 * number can never reach a reader.
 */
export async function buildPulse(
  sources: PulseSourceData,
  opts: { monthLabel: string }
): Promise<Pulse> {
  const monthIndex = monthIndexFromLabel(opts.monthLabel);
  const haveSeek = Boolean(sources.seekArticle);
  const haveNews = sources.newsItems.length > 0;

  if (!process.env.OPENAI_API_KEY || (!haveSeek && !haveNews)) {
    return evergreenPulse(monthIndex);
  }

  // Corpora for the verbatim guard: hero numbers must be in the SEEK text; news
  // numbers must be in the news items' own text.
  const seekCorpus = sources.seekArticle?.text ?? "";
  const newsCorpus = sources.newsItems
    .map((item) => `${item.title} ${item.snippet}`)
    .join("\n");
  const newsUrls = new Set(sources.newsItems.map((item) => item.url));

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: PULSE_SYSTEM_PROMPT },
    { role: "user", content: buildModelUserPrompt(sources, opts.monthLabel) },
  ];

  let model: ModelPulse | null = null;

  try {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const { parsed, raw, error } = await callModel(messages);

      if (parsed) {
        const problems = validateModelPulse(parsed, { seekCorpus, newsCorpus, newsUrls });
        if (problems.length === 0) {
          model = parsed;
          break;
        }
        messages.push({ role: "assistant", content: raw });
        messages.push({
          role: "user",
          content: `Your output broke the anti-hallucination rules:\n${problems.join(
            "\n"
          )}\nReturn a corrected JSON object. Every number must appear verbatim in the provided source text; drop any number you cannot copy exactly.`,
        });
        continue;
      }

      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content: `That JSON failed validation:\n${error}\nReturn a corrected JSON object only.`,
      });
    }
  } catch (err) {
    console.error("[pulse] model generation failed:", err);
    return evergreenPulse(monthIndex);
  }

  // After the retry loop, drop any component still failing its verbatim check
  // and substitute the evergreen fallback where needed.
  const heroValid =
    model?.heroStat &&
    haveSeek &&
    assertNumbersVerbatim(
      `${model.heroStat.value} ${model.heroStat.context}`,
      seekCorpus
    ).ok;

  const newsValid =
    model?.newsBite &&
    newsUrls.has(model.newsBite.url) &&
    assertNumbersVerbatim(model.newsBite.summary, newsCorpus).ok;

  const heroStat = heroValid
    ? {
        value: model!.heroStat!.value,
        label: model!.heroStat!.label,
        context: model!.heroStat!.context,
        sourceLabel: "SEEK NZ Employment Report",
        sourceUrl: sources.seekArticle!.url,
      }
    : heroStatFromFact(
        NZ_TECH_NUMERIC_FACTS[wrap(monthIndex, NZ_TECH_NUMERIC_FACTS.length)]
      );

  const newsBite = newsValid
    ? {
        title: model!.newsBite!.title,
        summary: model!.newsBite!.summary,
        sourceLabel: model!.newsBite!.sourceLabel,
        url: model!.newsBite!.url,
      }
    : null;

  const didYouKnow = evergreenDidYouKnow(monthIndex, heroStat.sourceUrl);

  const pulse: Pulse = { heroStat, newsBite, didYouKnow };

  // Final guard: the assembled section must satisfy the real schema.
  const validated = editorialSchema.shape.pulse.safeParse(pulse);
  return validated.success ? validated.data : evergreenPulse(monthIndex);
}

/** Collects human-readable verbatim/URL violations for a model draft. */
function validateModelPulse(
  model: ModelPulse,
  corpora: { seekCorpus: string; newsCorpus: string; newsUrls: Set<string> }
): string[] {
  const problems: string[] = [];

  if (model.heroStat) {
    const check = assertNumbersVerbatim(
      `${model.heroStat.value} ${model.heroStat.context}`,
      corpora.seekCorpus
    );
    if (!check.ok) {
      problems.push(
        `heroStat contains numbers not present verbatim in the SEEK text: ${check.offending.join(
          ", "
        )}`
      );
    }
  }

  if (model.newsBite) {
    if (!corpora.newsUrls.has(model.newsBite.url)) {
      problems.push(`newsBite.url is not one of the provided article URLs`);
    }
    const check = assertNumbersVerbatim(model.newsBite.summary, corpora.newsCorpus);
    if (!check.ok) {
      problems.push(
        `newsBite.summary contains numbers not present verbatim in the source: ${check.offending.join(
          ", "
        )}`
      );
    }
  }

  return problems;
}

/** English month names, index 0-11. */
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Derives a 0-11 month index from a "Month YYYY" label (defaults to 0). */
function monthIndexFromLabel(label: string): number {
  const name = label.trim().split(/\s+/)[0];
  const index = MONTH_NAMES.findIndex(
    (month) => month.toLowerCase() === name.toLowerCase()
  );
  return index >= 0 ? index : 0;
}
