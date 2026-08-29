/**
 * "NZ Tech Pulse" — the monthly NZ tech-industry data section of the newsletter.
 *
 * The section is deliberately anti-hallucination: any number shown to readers is
 * copied VERBATIM from a fetched source, never computed or invented by the model.
 * The pipeline is:
 *
 *   1. `fetchPulseSources()` — best-effort network reads (SEEK NZ employment
 *      report + NZ tech RSS feeds + the HRD NZ article sitemap). Every fetch is
 *      time-boxed and swallowed to null/[] on failure so this layer can never
 *      throw, and the three legs settle independently.
 *   2. `buildPulse()` — an OpenAI `gpt-4o-mini` pass that phrases a hero stat and
 *      up to three news bites from the fetched payloads, followed by a
 *      programmatic assertion, PER ITEM, that every displayed number appears
 *      verbatim in that item's own source text and that its URL is one we
 *      actually fetched. An item failing either check is dropped, never
 *      repaired — two sourced items beat three where one is invented.
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
    /** Short teaser shown TO THE MODEL — kept small because the pool is a dozen items. */
    snippet: string;
    /**
     * The fullest text we hold for this item, used ONLY by the verbatim-number
     * guard. One feed (The Conversation) ships whole articles, so verifying
     * against the same 500 characters the model was shown would throw away the
     * evidence that lets a real statistic survive. A number the model could not
     * have seen still had to come from this article to appear here, so checking
     * against more of it is strictly better attribution, not a loophole.
     */
    sourceText: string;
  }[];
}

// --- Fetch configuration -----------------------------------------------------

/** Per-request wall-clock budget; sites that hang must not stall the cron. */
const FETCH_TIMEOUT_MS = 8000;

/** Some sites 403 the default fetch UA, so present a realistic browser one. */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/**
 * Attribution for anything quoted from the SEEK report. One constant because it
 * is printed twice now — under the hero stat and, when the model uses it, beside
 * a news item — and the two must never read as different publications.
 */
const SEEK_SOURCE_LABEL = "SEEK NZ Employment Report";

/** SEEK NZ monthly employment report listing (primary + mirror host). */
const SEEK_LISTING_URLS = [
  "https://www.seek.co.nz/about/news/category/seek-employment-reports",
  "https://nz.seek.com/about/news/category/seek-employment-reports",
];

/** One configured feed. `pages` is opt-in per entry — see `feedPageUrl()`. */
export interface PulseFeed {
  /** The feed URL. Page 1 is fetched exactly as written. */
  url: string;
  /** Attribution printed beside the item in the email; a subscriber reads this. */
  source: string;
  /**
   * How many pages to request, via WordPress's `?paged=N`. Omit (or 1) for a
   * feed that does not support it — which is most of them. Only raise it for a
   * feed whose window is too short for a MONTHLY newsletter, and only after
   * checking that page 2 actually returns different items on that host.
   */
  pages?: number;
}

/**
 * NZ tech news RSS feeds — the ONE place a feed is added or removed.
 *
 * `url` is the feed; `source` is the attribution printed beside the item;
 * `pages` is the opt-in paging depth. Nothing else in this module names a feed
 * — items are merged, ranked and de-duplicated by host — so growing this list
 * is a one-constant change. That is deliberate: the candidate feeds are being
 * verified separately and must be droppable in here without a refactor.
 *
 * Keep the per-entry comment saying what a feed is expected to yield, and note
 * its retention. **Retention, not publish rate, is what starves this section**:
 * a feed that holds ten items is a one-hour window if the publisher posts ten
 * times an hour, and a monthly cron then sees only the hour before it fired.
 * That — not the ranking or the prompt — is why the news list has always been
 * thin. A feed with a short window either needs `pages` or is not worth a slot.
 *
 * A longer list is cheap: every feed page is fetched CONCURRENTLY in one
 * `Promise.allSettled`, each under the same `FETCH_TIMEOUT_MS` abort, so the
 * whole RSS leg costs about one timeout whether it is 2 requests or 15 — only
 * the socket count grows.
 */
export const PULSE_RSS_FEEDS: readonly PulseFeed[] = [
  // --- The women-in-tech leg -------------------------------------------------
  //
  // The only NZ publisher that exists to write about women in tech, and the one
  // whose items are close to 100% on-mission. Low volume is the POINT: 1.19
  // posts a month over 7.5 years, and page 1 alone spans ~5 months, so a monthly
  // run never misses one. Paging it buys nothing a monthly newsletter can use.
  { url: "https://techwomen.nz/feed/", source: "TechWomen NZ" },

  // --- The NZ industry leg ---------------------------------------------------
  //
  // Formerly NZTech; `nztech.org.nz/feed/` 308s here, so the new host is
  // hardcoded. ~12 posts a month of which 3–5 are usable — the rest are member
  // AGM notices. The ONLY feed in this list where page 1 misses the month:
  // measured cumulative reach is p1 = 16 days, p2 = 44, p3 = 63. Hence `pages`.
  { url: "https://technewzealand.org.nz/feed/", source: "Tech New Zealand", pages: 3 },

  // Ecosystem, events and AI policy; ~2.5 posts a month, rarely women-specific.
  // Page 1 spans ~5 months.
  { url: "https://aiforum.org.nz/feed/", source: "AI Forum NZ" },

  // --- Depth, and the one feed that ships whole articles ----------------------
  //
  // ~24-day window, about one relevant NZ piece a month — but its
  // `contentSnippet` is the FULL article (measured at 9,060 characters), which
  // is far more text for `assertNumbersVerbatim` to verify a statistic against
  // than a teaser. CC BY-ND and built for republication.
  { url: "https://theconversation.com/nz/articles.atom", source: "The Conversation NZ" },

  // --- Tech hiring commentary ------------------------------------------------
  //
  // A recruiter's blog, so read it as commentary and NEVER as a data source.
  // Only ~0.6 posts a month, but page 1 spans ~14 months, so it costs one
  // request and occasionally carries the only NZ tech-hiring piece of the month.
  { url: "https://absoluteit.co.nz/feed/", source: "Absolute IT" },

  // --- General NZ tech trade press -------------------------------------------
  //
  // Kept as a long shot, and deliberately ONE feed rather than two. IT Brief was
  // dropped: its feed holds roughly ONE HOUR of stories, and the TechDay network
  // publishes the same pool across six sibling desks (60 titles across them were
  // only 43 unique), so a second feed bought duplicates rather than reach.
  // TechDay's own window is about a day — still nearly blind to a monthly run,
  // which is why it now sorts below everything above it.
  { url: "https://techday.co.nz/feed", source: "TechDay NZ" },

  // NOT here, on purpose, so nobody adds it back: **RNZ**. It publishes exactly
  // the right stories, and its robots.txt names `anthropic-ai` and
  // `ChatGPT-User` and disallows them. The generic `*` rule does permit a plain
  // fetch — but this module does not merely read a feed, it passes the text to
  // an LLM to be summarised, which is the use RNZ explicitly refused. A charity
  // should not be hunting for the technically-permitted reading of a
  // publisher's "no". Its 2.3-day window means a monthly run would nearly
  // always have missed the story anyway.
  //
  // Also not here: hcamag (HRD New Zealand). It is fetched through its SITEMAP,
  // not a feed — see `fetchHrdItems()`. Its Atom feed holds five days, and
  // `?page=`/`?paged=`/`?offset=` all return HTTP 200 with the identical 30
  // items, so paging code against it looks like it works and does not.
];

/**
 * Recency window for an item, in days — an EDITORIAL parameter, not a
 * safety limit, and the one to turn when the section reads stale or reads thin.
 *
 * It used to be inert: against a one-hour feed nothing could ever be older than
 * the window. Against the longer-window feeds this list is growing towards
 * (months, not hours) it binds hard and is the difference between a news
 * section and an archive trawl. 35 days covers "since the last issue" for a
 * monthly newsletter with a few days of slack; a value nearer 60 is the obvious
 * alternative if a month's feeds cannot fill three items.
 */
const RSS_MAX_AGE_DAYS = 35;

/**
 * The same window, widened for items that rank as women/diversity news.
 *
 * Not a preference — a measured fix for the one slot that could not fill.
 * TechWomen NZ is the only NZ publisher writing about women in tech and posts
 * 1.19 times a month, so at 35 days a *specifically* women-in-tech story lands
 * in roughly **62%** of months. At 90 days that becomes roughly **92%**, and it
 * costs nothing: page 1 of that feed already spans about five months, so the
 * items are fetched either way and the narrower window was simply discarding
 * them.
 *
 * Deliberately NOT applied to the HRD sitemap leg. That source already yields
 * ~2.8 women/gender/pay-equity articles a month and filled every one of the
 * seven months measured, so widening it would add no coverage and would spend
 * the article-fetch budget re-reading older stories.
 *
 * Three months is the outer edge of what still reads as news rather than as an
 * archive trawl, which is why this is 90 and not 180.
 *
 * **It is a fallback, not a default.** A stale women item survives only when
 * there is no current one — see `dropStaleWomenItemsWhenFreshOnesExist()`. A
 * monthly newsletter's news section is about the month; the reach-back exists
 * for the month when the one on-mission publisher was quiet, not to compete
 * with today's stories.
 */
const WOMEN_MAX_AGE_DAYS = 90;

/** Rank returned by {@link rssRelevanceRank} for women/diversity items. */
const WOMEN_RANK = 0;

/**
 * Hard ceiling on pages per feed, whatever an entry asks for. A mistyped
 * `pages: 50` should cost a clamp, not fifty outbound requests from a cron.
 *
 * Read it as "enough for a monthly newsletter", NOT "the whole archive": a
 * paged feed can run to a hundred posts and several years, and five pages will
 * not exhaust one. That is correct — this section wants the last month or two,
 * and `RSS_MAX_AGE_DAYS` discards the rest anyway.
 */
const MAX_FEED_PAGES = 5;

/**
 * How many combined RSS items to keep. Three are shown and the model has to
 * find a SPREAD of topics inside this pool, so it is deliberately larger than
 * the 8 it held while only one item was ever chosen: across several feeds,
 * eight slots are easily eight retellings of the week's single biggest story.
 */
const RSS_TOP_N = 12;

/**
 * Most items taken from any one feed before the merge. A prolific feed publishes
 * many times a day and would otherwise own every slot in the pool — the same
 * monotony the editorial mix rule exists to prevent, arriving one layer earlier.
 */
const RSS_MAX_PER_FEED = 6;

/**
 * Relevance tiers for ranking RSS titles, ordered by what this newsletter is
 * FOR. Lower rank sorts to the front.
 *
 * Until 2026-08 tier 0 was "an Auckland angle" and women/diversity sat at tier
 * 1, which meant a story about anything in Auckland outranked a story about
 * women in tech. For a women-in-STEM newsletter that is backwards: Auckland is
 * where we meet, the mission is what we publish. Auckland is still ranked, just
 * below the two things a subscriber opened the email to read. Do not swap these
 * back without writing a reason here.
 */
/** Tier 0: women, gender and inclusion — the reason the newsletter exists. */
const RSS_WOMEN =
  /women|woman|wāhine|wahine|girls|gender|diversity|inclusion|equity|mentor/i;
/** Tier 1: the job market — hiring, skills and pay; the news a reader can act
 * on this month. "intern" is bounded so it does not match "internet". */
const RSS_JOBS =
  /\bjob|hiring|\bhires?\b|employ|recruit|skills|upskill|workforce|salar|wages|pay gap|graduate|\bintern(ships?|s)?\b|redundan|lay-?offs?|career|talent/i;
/** Tier 2: an Auckland/Tāmaki Makaurau angle (places, campuses, local companies). */
const RSS_AUCKLAND =
  /Auckland|Tāmaki Makaurau|Tamaki Makaurau|\bAUT\b|University of Auckland|\bCBD\b|Wynyard Quarter|Grid ?AKL|GridAKL|\bXero\b|\bHalter\b|Seequent|Vend|Timely|Dawn Aerospace/i;
/** Tier 3: the NZ tech industry generally — an NZ marker, or an industry topic.
 * AI is word-bounded so it does not match substrings like "again" or "campaign". */
const RSS_INDUSTRY = /New Zealand|Aotearoa|\bNZ\b|Kiwi|\bAI\b|startup|funding/i;

/**
 * Topic vocabulary for an HRD NZ **slug**, kept here with the RSS tiers so all
 * of this module's topic matching reads in one place rather than drifting into
 * two dialects.
 *
 * It runs against a URL slug, not a headline, which is why it is a separate
 * constant: the delimiter is a hyphen, so the words are already separated and
 * `\b` would be the wrong tool. `ai` is bounded by `(^|-)…(-|$)` for exactly
 * the reason `\bintern(ships?|s)?\b` is bounded in `RSS_JOBS` — an unbounded
 * `ai-` matches inside `thai-`, `chair-`, `repair-` and turns an unrelated
 * article into a candidate. `pay-gap` is spelled with its hyphen because that
 * is how it appears in a slug.
 *
 * `equity` is here because the researched word list did not have it and the
 * unit tests caught that the list therefore MISSED
 * `psa-scrapping-pay-equity-cost-new-zealand-135-billion-in-growth` — one of
 * the two articles cited as evidence that this source was worth building. NZ
 * writes "pay equity" at least as often as "pay gap". It is also already
 * tier-0 vocabulary in `RSS_WOMEN`, so the two lists now agree.
 *
 * This is the WHOLE efficiency argument for the sitemap source: hcamag slugs
 * read as titles ("ai-tools-create-workforce-imbalance-risk-for-employers"), so
 * a month's ~260 articles are cut to a handful of candidates before a single
 * article page is requested.
 */
const HRD_SLUG_TOPICAL =
  /women|gender|diversity|pay-gap|equity|hiring|talent|salary|skills|(^|-)ai(-|$)|graduate|career/;

/**
 * Ranks an RSS item title: 0 = women / diversity, 1 = jobs / hiring / skills,
 * 2 = an Auckland angle, 3 = the NZ tech industry generally, 4 = everything
 * else. Tiers 0-3 are also read as an item's "topic" by the mix rule in
 * `selectNewsBites()`. Exported so the ordering can be unit-tested without
 * touching the network.
 */
export function rssRelevanceRank(title: string): number {
  if (RSS_WOMEN.test(title)) return 0;
  if (RSS_JOBS.test(title)) return 1;
  if (RSS_AUCKLAND.test(title)) return 2;
  if (RSS_INDUSTRY.test(title)) return 3;
  return 4;
}

/** Cap on extracted article body length fed to the model. */
const ARTICLE_TEXT_CAP = 6000;

/**
 * Teaser length shown to the model per news item. Small on purpose: a dozen
 * items go into one prompt, and one feed ships whole 9,000-character articles.
 */
const SNIPPET_MODEL_CHARS = 500;

/** Text retained per item for the verbatim-number guard. See `sourceText`. */
const SNIPPET_VERIFY_CHARS = 4000;

/**
 * Least item text worth sending to the model. Some feeds carry a title and a
 * link and nothing else; there is nothing to summarise and nothing to verify a
 * number against, so such an item can only ever be dropped later. Low enough to
 * keep a genuinely short teaser, high enough to exclude a text-less feed.
 */
const MIN_ITEM_TEXT_CHARS = 40;

/**
 * URL for page N of a feed. Page 1 is the feed URL exactly as configured; later
 * pages get WordPress's `?paged=N`. This is why paging is a PER-ENTRY flag and
 * not a global setting: the parameter is honoured on the WordPress feeds and is
 * meaningless — or an error page — elsewhere, so it must be opted into per host.
 * Any query string the feed URL already carries is preserved. Exported for the
 * unit tests, which must not reach a network to check URL construction.
 */
export function feedPageUrl(url: string, page: number): string {
  if (page <= 1) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("paged", String(page));
    return parsed.toString();
  } catch {
    return url; // an unparsable URL will fail the fetch anyway
  }
}

/**
 * Normalises a headline so the same story republished elsewhere collapses to one
 * key: lowercased, a trailing "| Section Name" suffix removed, punctuation
 * dropped and whitespace collapsed. Used for cross-post removal in the fetched
 * pool — one mechanism, not two, so there is a single definition of "the same
 * story". Falls back to the punctuation-stripped original if the suffix rule
 * would leave nothing.
 */
export function normaliseHeadline(title: string): string {
  const strip = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const withoutSuffix = strip(title.replace(/\s*\|\s*[^|]*$/u, ""));
  return withoutSuffix || strip(title);
}

/** Keeps undated items rather than losing them; drops anything past the window. */
function withinAgeWindow(isoDate: string | null, cutoff: number): boolean {
  if (!isoDate) return true;
  const stamp = Date.parse(isoDate);
  return Number.isNaN(stamp) || stamp >= cutoff;
}

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
 * Reads the configured RSS feeds (following `pages` where an entry declares
 * it) and returns the recent items with usable text, capped per feed. Every
 * request is settled independently, so a dead feed or a dead page costs only
 * itself. Cross-source de-duplication, ranking and the pool cap belong to
 * `mergeNewsItems()`, because the HRD sitemap source needs the same treatment.
 *
 * Wall clock: all feed pages go out in ONE round of concurrent requests, each
 * under `FETCH_TIMEOUT_MS`, so this leg is ~8s whether it issues 2 requests or
 * the ~15 a 6-10 feed list with paging would.
 */
async function fetchRssItems(): Promise<PulseSourceData["newsItems"]> {
  // Fetch the XML ourselves (with our timeout + Accept) and hand it to the
  // parser as a string — parser.parseURL sends an Accept the feeds reject (406).
  const parser = new Parser();

  const cutoff = Date.now() - RSS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const womenCutoff = Date.now() - WOMEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  // One flat list of (feed, page) requests. Paging must not cost one timeout
  // per page, so pages are fanned out beside the feeds rather than walked.
  const requests = PULSE_RSS_FEEDS.flatMap((feed, feedIndex) => {
    const pages = Math.min(Math.max(Math.trunc(feed.pages ?? 1), 1), MAX_FEED_PAGES);
    return Array.from({ length: pages }, (_, i) => ({ feed, feedIndex, page: i + 1 }));
  });

  const settled = await Promise.allSettled(
    requests.map(async ({ feed, page }) => {
      const xml = await fetchText(feedPageUrl(feed.url, page), FEED_ACCEPT);
      if (!xml) return [];
      const parsed = await parser.parseString(xml);
      return (parsed.items ?? []).map((item) => {
        const text = (item.contentSnippet ?? item.content ?? "")
          .replace(/\s+/g, " ")
          .trim();
        return {
          title: (item.title ?? "").trim(),
          url: (item.link ?? "").trim(),
          source: feed.source,
          isoDate: item.isoDate ?? null,
          snippet: text.slice(0, SNIPPET_MODEL_CHARS),
          sourceText: text.slice(0, SNIPPET_VERIFY_CHARS),
        };
      });
    })
  );

  // Regroup by feed and page: the requests finished in network order, but a
  // feed's own order is publication order and the per-feed cap depends on it.
  const pagesByFeed: PulseSourceData["newsItems"][][] = PULSE_RSS_FEEDS.map(() => []);
  settled.forEach((result, index) => {
    const { feedIndex, page } = requests[index];
    pagesByFeed[feedIndex][page - 1] = result.status === "fulfilled" ? result.value : [];
  });

  const all = pagesByFeed.flatMap((pages) => {
    const seenInFeed = new Set<string>();
    return pages
      .flat() // page 1, then 2, … i.e. still newest-first
      .filter((item) => item.title && item.url)
      // A feed that ships a title and nothing else cannot be summarised and
      // cannot have a number verified against it, so it would spend one of
      // three slots on an item the guard was always going to drop. Skip it
      // here rather than pay a model call to find out.
      .filter((item) => item.sourceText.length >= MIN_ITEM_TEXT_CHARS)
      // Women/diversity items get the wider window — see WOMEN_MAX_AGE_DAYS.
      .filter((item) =>
        withinAgeWindow(
          item.isoDate,
          rssRelevanceRank(item.title) === WOMEN_RANK ? womenCutoff : cutoff
        )
      )
      .filter((item) => {
        // Pages overlap when a publisher posts mid-fetch; same story, same feed.
        if (seenInFeed.has(item.url)) return false;
        seenInFeed.add(item.url);
        return true;
      })
      // Feeds publish newest-first, so this keeps a feed's most recent items
      // and stops one busy publisher filling the whole pool on its own.
      .slice(0, RSS_MAX_PER_FEED);
  });

  return all;
}

/**
 * Cross-post removal, ranking and the pool cap — the one place a list of
 * candidate news items becomes THE pool, whatever source produced it.
 *
 * It was the tail of `fetchRssItems()` until the HRD sitemap source arrived.
 * Lifting it out is what stops a second source needing a second copy of "the
 * same story", "in mission order" and "how many we keep": a story reaching us
 * from both an RSS feed and hcamag must collapse to one item, and an HRD item
 * must be ranked against the RSS ones rather than appended after them.
 *
 * Earlier lists win a tie, so pass them in source-priority order.
 *
 * Some NZ organisations republish each other's articles under their own domain
 * with an identical headline and date, so a URL comparison sees two different
 * items and the section can end up running one story twice — the most visible
 * failure a three-item list has. Exported so the merge can be unit-tested
 * without a network.
 */
export function mergeNewsItems(
  lists: readonly PulseSourceData["newsItems"][]
): PulseSourceData["newsItems"] {
  const deduped: PulseSourceData["newsItems"] = [];
  const seenHeadlines = new Set<string>();
  const seenUrls = new Set<string>();
  for (const item of lists.flat()) {
    const headline = normaliseHeadline(item.title);
    if (seenUrls.has(item.url) || seenHeadlines.has(headline)) continue;
    seenUrls.add(item.url);
    seenHeadlines.add(headline);
    deduped.push(item);
  }

  // Women/diversity first, then the job market, then Auckland, then general NZ
  // industry; newest first within each tier. See `rssRelevanceRank`.
  deduped.sort((a, b) => {
    const relA = rssRelevanceRank(a.title);
    const relB = rssRelevanceRank(b.title);
    if (relA !== relB) return relA - relB;
    const dateA = a.isoDate ? Date.parse(a.isoDate) : 0;
    const dateB = b.isoDate ? Date.parse(b.isoDate) : 0;
    return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
  });

  return deduped.slice(0, RSS_TOP_N);
}

// --- HRD New Zealand (hcamag.com) sitemap source -----------------------------
//
// WHY A SITEMAP AND NOT A FEED. HRD NZ is the best available source of NZ
// job-market and hiring news for women in tech — the last 60 days alone carried
// "new-zealands-gender-pay-gap-sitting-at-53" and
// "psa-scrapping-pay-equity-cost-new-zealand-135-billion-in-growth" — but its
// Atom feed holds FIVE DAYS. A cron that fires once a month therefore sees one
// sixth of the month and reaches maybe two of the 8-15 usable items, by luck of
// timing. The per-year sitemap holds the whole year in one request: measured
// 2026-08-29, `/nz/sitemaps/articles/2026/` returned HTTP 200,
// `application/xml`, ~176 KB, 948 entries with `<lastmod>`, spanning 2026-01-05
// to 2026-08-28, of which 260 fell in the last 60 days.
//
// TWO TRAPS, BOTH ALREADY PAID FOR — do not rediscover them:
//
//  1. PAGING ON HCAMAG IS A SILENT NO-OP. `?page=2`, `?paged=2`, `?p=2`,
//     `?offset=30` and `?limit=100` all return HTTP 200 with the IDENTICAL 30
//     items. That is worse than a 404, because paging code looks like it works.
//     So hcamag must NEVER be added to `PULSE_RSS_FEEDS` with a `pages` value.
//     There are no category feeds either — `/nz/feed`, `/nz/atom` and
//     `/nz/specialisation/*/rss` are all 404.
//  2. THE SITEMAP IS PER-YEAR. On 5 January `/2027/` holds four days, and this
//     section would silently starve every January. `needsPreviousYearSitemap()`
//     handles it, derived from the fetched data rather than from a date.
//
// ROBOTS. The sitemaps are advertised in `robots.txt`; the only `Disallow` for
// `*` that touches NZ is `/nz/business-news/`, and `Claude-User` is allowed
// explicitly. These articles live under `/nz/news/` and `/nz/specialisation/`.
// `HRD_DISALLOWED_PATH` keeps the crawl honest even if a business-news URL ever
// appears in this sitemap.

/** Attribution printed beside an hcamag item; a subscriber reads this. */
const HRD_SOURCE_LABEL = "HRD New Zealand";

/** Per-year article sitemap; the year is appended with a trailing slash. */
const HRD_SITEMAP_BASE = "https://www.hcamag.com/nz/sitemaps/articles/";

/** The one path `robots.txt` disallows for `*` on the NZ edition. */
const HRD_DISALLOWED_PATH = "/nz/business-news/";

/**
 * How many surviving candidates get their article page fetched.
 *
 * This is a MONTHLY CRON, not a crawler. A month yields roughly 260 hcamag
 * articles and ~117 survive the slug filter; fetching those would be 117
 * outbound requests to one publisher for a three-item news list. Six is chosen
 * to match `RSS_MAX_PER_FEED` for the second reason too: the merged pool holds
 * `RSS_TOP_N` items, and one prolific publisher must not own it.
 */
const HRD_MAX_ARTICLE_FETCHES = 6;

/** One `<url>` entry from the sitemap. */
export interface SitemapEntry {
  loc: string;
  lastmod: string;
}

/**
 * Parses `<loc>` + `<lastmod>` pairs out of a sitemap, in document order.
 *
 * Regex rather than cheerio because a sitemap is flat, machine-generated XML
 * and this runs over ~176 KB on a cron; an entry missing either element is
 * skipped rather than half-kept, since an undated entry can never be shown to
 * satisfy the recency window. Exported so parsing is testable without a
 * network. hcamag's `<lastmod>` is date-only ("2026-08-28"), which `Date.parse`
 * reads as UTC midnight — a few hours' skew against Pacific/Auckland that is
 * immaterial against a 35-day window.
 */
export function parseSitemapEntries(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const urlBlocks = xml.match(/<url\b[\s\S]*?<\/url>/g) ?? [];
  for (const block of urlBlocks) {
    const loc = block.match(/<loc>\s*([\s\S]*?)\s*<\/loc>/)?.[1];
    const lastmod = block.match(/<lastmod>\s*([\s\S]*?)\s*<\/lastmod>/)?.[1];
    if (!loc || !lastmod) continue;
    entries.push({ loc, lastmod });
  }
  return entries;
}

/** The article sitemap URL for one calendar year. */
export function hrdSitemapUrl(year: number): string {
  return `${HRD_SITEMAP_BASE}${year}/`;
}

/**
 * Whether the previous year's sitemap must also be fetched, decided from the
 * DATA rather than from the calendar.
 *
 * True when the year's sitemap does not reach back as far as the recency
 * cutoff — i.e. its oldest entry is still newer than the cutoff — or when it
 * yielded nothing at all (1 January, before the year's first article, the file
 * may not exist yet). Eleven months of the year the oldest entry is from
 * January and this is false, so the second request is never made.
 *
 * A date-based `if (month === 0)` would be a bug that only appears in January,
 * which is precisely the kind nobody connects to this code when it fires.
 */
export function needsPreviousYearSitemap(
  entries: readonly SitemapEntry[],
  cutoff: number
): boolean {
  if (entries.length === 0) return true;
  let oldest = Infinity;
  for (const entry of entries) {
    const stamp = Date.parse(entry.lastmod);
    if (!Number.isNaN(stamp) && stamp < oldest) oldest = stamp;
  }
  // No parsable date anywhere is as uninformative as no entries at all.
  if (oldest === Infinity) return true;
  return oldest > cutoff;
}

/**
 * The article slug from an hcamag URL: the last path segment that is not the
 * numeric article id, e.g.
 * `/nz/news/general/ai-tools-create-workforce-imbalance-risk/587819`
 * → `ai-tools-create-workforce-imbalance-risk`. Returns "" for a URL that will
 * not parse or carries no slug.
 */
export function hrdSlugFromUrl(url: string): string {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return "";
  }
  const segments = path.split("/").filter(Boolean);
  // The trailing segment is the numeric article id on every measured URL.
  if (segments.length > 1 && /^\d+$/.test(segments[segments.length - 1])) {
    segments.pop();
  }
  return (segments.pop() ?? "").toLowerCase();
}

/** Whether an hcamag URL's slug carries a topic this newsletter is about. */
export function hrdSlugIsTopical(url: string): boolean {
  return HRD_SLUG_TOPICAL.test(hrdSlugFromUrl(url));
}

/**
 * A slug read back as a rough headline, so `rssRelevanceRank()` can order the
 * candidates by the SAME mission tiers the merged pool is sorted by. hcamag
 * slugs are near-verbatim titles, which is what makes this sound: ranking here
 * decides which handful of articles is worth spending a request on.
 */
function hrdSlugAsTitle(slug: string): string {
  return slug.replace(/-/g, " ");
}

/**
 * Cuts a year (or two) of sitemap entries down to the few article pages worth
 * fetching: inside the recency window, not under a disallowed path, slug says
 * it is on topic, then ranked by the newsletter's own tiers (newest first
 * inside a tier) and capped at `HRD_MAX_ARTICLE_FETCHES`.
 *
 * Every filter here is applied BEFORE any article is requested — that is the
 * whole point of the source. Exported so the window, the filter and the cap can
 * be tested with no network.
 */
export function selectHrdCandidates(
  entries: readonly SitemapEntry[],
  cutoff: number
): SitemapEntry[] {
  const seen = new Set<string>();
  return entries
    .filter((entry) => !entry.loc.includes(HRD_DISALLOWED_PATH))
    .filter((entry) => {
      // Unlike the RSS path, an undated entry is DROPPED rather than kept: a
      // sitemap covers a whole year, so "keep it, we cannot date it" would let
      // an eight-month-old article into a monthly newsletter.
      const stamp = Date.parse(entry.lastmod);
      return !Number.isNaN(stamp) && stamp >= cutoff;
    })
    .filter((entry) => hrdSlugIsTopical(entry.loc))
    .filter((entry) => {
      // Two years of sitemaps can overlap on a re-published article.
      if (seen.has(entry.loc)) return false;
      seen.add(entry.loc);
      return true;
    })
    .sort((a, b) => {
      const relA = rssRelevanceRank(hrdSlugAsTitle(hrdSlugFromUrl(a.loc)));
      const relB = rssRelevanceRank(hrdSlugAsTitle(hrdSlugFromUrl(b.loc)));
      if (relA !== relB) return relA - relB;
      return Date.parse(b.lastmod) - Date.parse(a.lastmod);
    })
    .slice(0, HRD_MAX_ARTICLE_FETCHES);
}

/** What an hcamag article page yields once its `og:` tags are read. */
export interface HrdArticleMeta {
  ogTitle: string;
  ogDescription: string;
  bodyText: string;
}

/**
 * Reads `og:title` and `og:description` from an article page, plus the body
 * text the existing article extractor produces.
 *
 * hcamag pages are server-rendered and clean, and both tags are present on
 * every measured article — a ready-made headline and a ready-made one-sentence
 * summary, so no body-scraping heuristic has to guess at either.
 */
export function extractHrdArticleMeta(html: string): HrdArticleMeta {
  const $ = cheerio.load(html);
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() ?? "";
  const ogDescription =
    $('meta[property="og:description"]').attr("content")?.trim() ?? "";
  return { ogTitle, ogDescription, bodyText: extractArticle(html).text };
}

/**
 * Maps one sitemap entry plus its article metadata into the shared news-item
 * shape. Returns null when the page carried NEITHER `og:` tag — there would be
 * nothing to summarise and nothing to verify a number against, and the item
 * could only ever be dropped further down, so it is not worth a slot.
 *
 * ON `og:description`, AND WHY IT IS NOT PRINTED VERBATIM.
 *
 * `og:description` is the publisher's own one-sentence summary, written for
 * exactly this purpose, so the tempting move is to render it as the news bite
 * directly: perfect accuracy, zero model risk. It is deliberately NOT done.
 * Two reasons, in this order.
 *
 * First, attribution. Printing a publisher's sentence verbatim under a headline
 * of our own is republishing their copy, not summarising it, and the section
 * gives a source label and a link — not a quotation mark. Every other item in
 * the list is our own sentence about someone else's reporting; one item that is
 * silently theirs is the kind of inconsistency nobody notices until a publisher
 * does.
 *
 * Second, voice and mix. The model is not decoration here: it re-angles an item
 * towards women in tech, names an Auckland connection when the source states
 * one, and chooses a SPREAD of three topics. An item that arrives pre-written
 * opts out of all of that and reads as a pasted teaser beside two edited ones.
 *
 * The accuracy the direct route would have bought is bought instead by the
 * guards, which are unchanged and which this item passes exactly like an RSS
 * one: its URL must be one we fetched, and every number in the drafted title
 * and summary must appear verbatim in the text below. So `og:description`
 * becomes the model's `snippet`, and `sourceText` is that description followed
 * by the article body — the same reasoning as the full-article RSS feed, where
 * verifying against more retrieved text is strictly better attribution, since a
 * number the model could not even see still had to come from this article.
 */
export function buildHrdNewsItem(
  entry: SitemapEntry,
  meta: HrdArticleMeta
): PulseSourceData["newsItems"][number] | null {
  if (!meta.ogTitle && !meta.ogDescription) return null;

  const title = meta.ogTitle || hrdSlugAsTitle(hrdSlugFromUrl(entry.loc));
  if (!title) return null;

  const summaryFirst = [meta.ogDescription, meta.bodyText]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // The same minimum the RSS path applies: an item with a headline and almost
  // no text cannot be summarised and cannot have a number verified against it,
  // so it would spend one of three slots on something the guards were always
  // going to drop.
  if (summaryFirst.length < MIN_ITEM_TEXT_CHARS) return null;

  return {
    title,
    url: entry.loc,
    source: HRD_SOURCE_LABEL,
    // A real publication date from `<lastmod>`, so the item carries a dateline
    // like any other rather than a guessed one.
    isoDate: new Date(entry.lastmod).toISOString(),
    snippet: (meta.ogDescription || summaryFirst).slice(0, SNIPPET_MODEL_CHARS),
    sourceText: summaryFirst.slice(0, SNIPPET_VERIFY_CHARS),
  };
}

/**
 * The HRD NZ leg: one sitemap request (rarely two), a slug filter, then at most
 * `HRD_MAX_ARTICLE_FETCHES` article pages fetched CONCURRENTLY.
 *
 * Wall clock, worst case: the two sitemap requests are necessarily sequential
 * (the second is only made when the first says the year is too short), so
 * 2 × `FETCH_TIMEOUT_MS`, plus one concurrent round of article fetches at
 * `FETCH_TIMEOUT_MS` — about 24s, and 8s in the ordinary case where the
 * sitemap covers the window and the articles answer promptly. Never throws:
 * every failure degrades to fewer items, and the whole leg is settled beside
 * the others in `fetchPulseSources()`, so a slow hcamag cannot stall the run.
 */
async function fetchHrdItems(): Promise<PulseSourceData["newsItems"]> {
  const cutoff = Date.now() - RSS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const year = new Date().getUTCFullYear();

  const currentXml = await fetchText(hrdSitemapUrl(year), FEED_ACCEPT);
  const entries = currentXml ? parseSitemapEntries(currentXml) : [];

  // Trap 2: in the first weeks of a year this year's file holds only days.
  if (needsPreviousYearSitemap(entries, cutoff)) {
    const previousXml = await fetchText(hrdSitemapUrl(year - 1), FEED_ACCEPT);
    if (previousXml) entries.push(...parseSitemapEntries(previousXml));
  }

  const candidates = selectHrdCandidates(entries, cutoff);
  if (candidates.length === 0) return [];

  const settled = await Promise.allSettled(
    candidates.map(async (entry) => {
      const html = await fetchText(entry.loc);
      if (!html) return null;
      return buildHrdNewsItem(entry, extractHrdArticleMeta(html));
    })
  );

  return settled.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : []
  );
}

/**
 * Gathers all pulse source payloads in parallel. Never throws; any component
 * that fails comes back as null / an empty array so the caller can degrade.
 *
 * Worst-case wall clock is STILL ~32s, and is still set by the SEEK leg, which
 * is necessarily sequential: up to two candidate hosts × (listing + article),
 * each capped at `FETCH_TIMEOUT_MS`. The RSS leg runs beside it and costs ~8s
 * no matter how many feeds or pages it issues, because they all go out at once.
 * The HRD leg also runs beside them at ~24s worst case (up to two sequential
 * sitemap requests, then one concurrent round of article fetches), which is
 * inside the SEEK leg's budget. So neither adding feeds nor adding this source
 * moves the number; only a leg that could exceed 4 × `FETCH_TIMEOUT_MS` would.
 *
 * Each leg is settled independently, so a hanging hcamag, a dead feed and a
 * missing SEEK report each cost only their own items.
 */
export async function fetchPulseSources(): Promise<PulseSourceData> {
  const [seek, rss, hrd] = await Promise.allSettled([
    fetchSeekArticle(),
    fetchRssItems(),
    fetchHrdItems(),
  ]);

  const rssItems = rss.status === "fulfilled" ? rss.value : [];
  const hrdItems = hrd.status === "fulfilled" ? hrd.value : [];

  return {
    seekArticle: seek.status === "fulfilled" ? seek.value : null,
    // RSS first so an RSS entry wins a cross-post tie, matching the "earlier
    // list wins" rule and keeping the pre-existing ordering stable; ranking
    // then judges every item on its topic, whichever source produced it.
    newsItems: dropStaleWomenItemsWhenFreshOnesExist(mergeNewsItems([rssItems, hrdItems])),
  };
}

/**
 * Removes women/diversity items older than the normal window, unless they are
 * all there is.
 *
 * `WOMEN_MAX_AGE_DAYS` lets a women/diversity item in at up to 90 days, which
 * lifts the fill rate for a *specifically* women-in-tech story from ~62% of
 * months to ~92%. That is worth having in the month when TechWomen NZ was
 * quiet — and actively wrong in the month when it was not, because a monthly
 * newsletter's news section is supposed to be about the month. Measured on
 * 2026-08-29 the pool held twelve items aged 1 to 24 days, plus exactly one at
 * 75 days that the wider window admitted: a June newsletter digest competing
 * with five current women's stories.
 *
 * So the wide window is a **fallback, not a default**. If any women/diversity
 * item falls inside the normal window, the older ones are dropped; only when
 * there are none does the reach-back apply. Everything else is already filtered
 * to the normal window upstream, so this function only ever sees the exception.
 *
 * @param items The merged pool, newest-first within each source.
 * @returns The pool with stale women items removed when fresh ones exist.
 */
export function dropStaleWomenItemsWhenFreshOnesExist(
  items: PulseSourceData["newsItems"]
): PulseSourceData["newsItems"] {
  const cutoff = Date.now() - RSS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const isWomenItem = (item: PulseSourceData["newsItems"][number]) =>
    rssRelevanceRank(item.title) === WOMEN_RANK;

  const hasFreshWomenItem = items.some(
    (item) => isWomenItem(item) && withinAgeWindow(item.isoDate, cutoff)
  );
  if (!hasFreshWomenItem) return items;

  return items.filter((item) => !isWomenItem(item) || withinAgeWindow(item.isoDate, cutoff));
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
  // A label naming a PERIOD, not a judgement. This entry read "the lowest on
  // record" for a year after it stopped being true — Stats NZ published the
  // June 2026 quarter on 2026-08-26 at 5.3% — and because the label carried no
  // date, nothing about it looked stale to a reader or to the next editor. The
  // rendered headline sits under a big number in a real newsletter, so a
  // superlative here is a claim; a quarter is a fact. Keep the period.
  "gender-pay-gap": { value: "5.3%", label: "NZ gender pay gap, June 2026 quarter" },
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

/**
 * One drafted news item. The model writes only the words; `sourceLabel` and the
 * dateline are attached later from OUR fetched item, so a story can never be
 * credited to a publication that did not run it.
 */
const modelNewsItemSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  url: z.string().url(),
});

/** Shape the model must return (attribution is filled in by us, not the model). */
const modelPulseSchema = z.object({
  heroStat: z
    .object({
      value: z.string().min(1),
      label: z.string().min(1),
      context: z.string().min(1),
    })
    .nullable(),
  /**
   * Up to three news items. Deliberately UNBOUNDED here and trimmed after
   * validation: a `.max(3)` would fail the whole parse over a fourth item and
   * burn a retry on something we can simply drop. `nullish` because a model
   * with no usable items may answer `null` as readily as `[]`.
   */
  newsBites: z.array(modelNewsItemSchema).nullish(),
});

type ModelPulse = z.infer<typeof modelPulseSchema>;

/** Max items rendered in the news list; mirrors `newsBites.max(3)` in the schema. */
const MAX_NEWS_BITES = 3;

/** One rendered news item, as the editorial schema defines it. */
type PulseNewsItem = NonNullable<NonNullable<Pulse>["newsBites"]>[number];

const PULSE_SYSTEM_PROMPT = `You are the data editor of She Sharp's monthly newsletter, writing a short "NZ Tech Pulse" section for a New Zealand women-in-tech community based in Auckland (Tāmaki Makaurau), where She Sharp runs its in-person events. Voice: warm, plain English, New Zealand spelling.

ABSOLUTE ANTI-HALLUCINATION RULES — these override everything:
- Every number you write MUST be copied character-for-character from the source text provided. Never compute, round, estimate, combine, or invent a number. If a number is not present verbatim in the source, do not write any number.
- Only use facts stated in the provided source text. Do not add outside knowledge.
- For a news item, you MUST use one of the exact URLs given — one of the news articles, or the SEEK report's own URL; never invent or modify a URL. Every number in that item's title and summary must appear in THAT source's own text — not in another source's.
- Writing fewer items is always better than stretching one. Two well-sourced items beat three where one is guesswork.

EDITORIAL MIX (the section reads as a list, so the items must not be three angles on one story):
- Aim for a spread of three: one thing useful to women in tech, one about the job market or hiring, and one about the New Zealand tech industry generally.
- That spread is a preference, NOT a quota, and the order of priority when it cannot be met is: (1) three items each worth a reader's minute, (2) the spread, (3) fewer items. So if the women-in-tech candidates include two strong stories and the only industry candidates are vendor product announcements, take BOTH women stories — this newsletter is read by women in tech, and a second story they will actually read beats a third slot filled with a press release. Do not leave a slot empty while a strong on-mission story goes unused.
- Write fewer than three only when fewer than three are genuinely worth reading. Padding is worse than a short section.
- Never use two items from the same article, and avoid two that would leave a reader thinking they had read the same story twice.

LOCAL PREFERENCE (never overrides the rules above):
- When two candidates are equally relevant, prefer the one with an Auckland / Tāmaki Makaurau connection (a local venue, campus, or company).
- If a chosen news item has an Auckland angle stated in its own text, mention that connection in the summary. If it does not, do not add one.

Return a SINGLE JSON object and nothing else, matching:
{
  "heroStat": { "value": string, "label": string, "context": string } | null,
  "newsBites": [ { "title": string, "summary": string, "url": string } ]
}

- heroStat: pick ONE VERBATIM number from the SEEK employment report text. Prefer a number about technology, ICT, software, AI, digital skills, or women/gender if one is present; otherwise choose the most striking overall. "value" is that exact number as written (e.g. "5.2%", "12,000"). "label" is a short phrase (≤8 words) naming what it measures. "context" is one sentence of plain-English framing; any number inside it must also be verbatim from the source. You may add an Auckland framing to the context ONLY if the source text itself mentions Auckland — otherwise keep it as written (SEEK is a nationwide report, and that is fine). If no SEEK text is provided, return heroStat: null.
- Every "title" must be a headline a reader would stop on, never the source document's own name. This matters most for the SEEK report, whose article title is literally "SEEK NZ Employment Report - <Month>" — that is a filing label, not a story. Say what the numbers mean for someone reading: "If you shelved a job search, take it back off the shelf" is a headline; "SEEK NZ Employment Report - July" is not.
- The SEEK employment report is ALSO eligible as ONE of the news items, using its own exact URL. It is the only job-market DATA source available — the news feeds carry industry stories, not employment figures — so it is usually the right choice for the job-market leg of the mix. Two rules: use AT MOST ONE item from the SEEK report, and do NOT build that item on the same number you used for the hero stat. Choose a different figure from the report, or write no SEEK item at all.
- newsBites: choose UP TO THREE news items following the editorial mix above, ordered most interesting first. For each: "title" is a short headline of your own (it may re-angle the original, but it must not add a fact the article does not state), "summary" is at most two sentences, and "url" is that item's exact URL. Do not write a source name — we attach it ourselves. If the item's text names an Auckland location, campus, or company, name it in the summary. If no news items are provided, return newsBites: [].

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

NZ tech news items (choose up to three for the news list; use each one's exact url):
${news.length ? JSON.stringify(news, null, 2) : "(none available)"}
${
  seek
    ? `\nThe SEEK report above is ALSO eligible as ONE news item — its exact url is ${seek.url}. Quote a different figure from it than the one you used for the hero stat.`
    : ""
}
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

/** A fetched news item, keyed by URL so a draft can be checked against its own source. */
type FetchedNewsItem = PulseSourceData["newsItems"][number];

/** Host of a URL, lowercased and without `www.`; "" if the URL will not parse. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * NZ-style short dateline, e.g. "28 Jul". Formatted in Pacific/Auckland rather
 * than the server's zone so a Vercel box in UTC and a laptop in NZDT print the
 * same day — the same drift that once moved event JSON-LD dates by one.
 */
const DATELINE_FORMAT = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  timeZone: "Pacific/Auckland",
});

/** Formats an item's own publication date; null when it has none or it is unparsable. */
function datelineFor(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const stamp = Date.parse(isoDate);
  if (Number.isNaN(stamp)) return null;
  return DATELINE_FORMAT.format(new Date(stamp));
}

/**
 * Turns the model's drafted news list into the items that may be rendered.
 *
 * Every item must pass BOTH guards or it is DROPPED — never repaired, never
 * waved through:
 *   1. its `url` must be one of the URLs we actually fetched, and
 *   2. every number in its title and summary must appear verbatim in THAT
 *      item's own fetched text.
 *
 * Partial success is success: three drafts can yield three items, one item, or
 * none. The section shrinks; it never fabricates. `CONTENT_RULES.md` exists
 * because numbers reached the public that nobody could source, so two sourced
 * items beat three where one carries an invented statistic.
 *
 * Guard 2 checks the item's OWN text rather than the pooled corpus of every
 * fetched item: a number that is real but belongs to a different story is a
 * mis-attribution, and the link printed beside it would not support it. That is
 * stricter than the single-bite version this replaces, deliberately.
 *
 * Attribution and the dateline come from our fetched item, not from the model.
 *
 * `opts.seekUrl` / `opts.heroValue` cover the one case the guards cannot see:
 * the SEEK report is both the hero stat's source and an eligible news item, so
 * a bite built on the hero's own figure would print the same number twice.
 *
 * The mix rule is the cheap half of "not three angles on one story": at most one
 * item per (publication, topic tier) pair is preferred, and the rest are kept as
 * spares rather than discarded — a monotonous news month should still get three
 * items, it just gets the repeats last. Human curation is the real backstop.
 *
 * Exported so the drop rules can be unit-tested with no network and no API key.
 */
export function selectNewsBites(
  drafted: readonly { title: string; summary: string; url: string }[],
  fetched: ReadonlyMap<string, FetchedNewsItem>,
  opts: {
    seekUrl?: string | null;
    heroValue?: string | null;
    /**
     * Called once per dropped item, with the reason.
     *
     * Every drop below is a silent `continue`, and silence is the wrong default
     * here: a two-item Pulse is a legitimate outcome when the month is thin,
     * and it is also what a guard rejecting a good story looks like. Those need
     * different responses from whoever is curating the issue — accept it, or go
     * and find out why a verified source failed verification — and from the
     * outside they are indistinguishable. Optional so the pure function stays
     * testable without a logger.
     */
    onDrop?: (url: string, reason: string) => void;
  } = {}
): PulseNewsItem[] {
  const drop = (url: string, reason: string) => opts.onDrop?.(url, reason);
  const preferred: PulseNewsItem[] = [];
  const spares: PulseNewsItem[] = [];
  const seenUrls = new Set<string>();
  const seenHeadlines = new Set<string>();
  const seenAngles = new Set<string>();

  for (const draft of drafted) {
    const source = fetched.get(draft.url);
    if (!source) {
      drop(draft.url, "url was not one we fetched (invented, edited or hallucinated)");
      continue;
    }
    if (seenUrls.has(draft.url)) {
      drop(draft.url, "the same article twice");
      continue;
    }
    // Same normalisation as the fetch-layer cross-post removal, so "the same
    // story" means one thing in this file. Cross-posts are already gone from the
    // pool; this catches a pair that reached the model anyway.
    const headline = normaliseHeadline(source.title);
    if (seenHeadlines.has(headline)) {
      drop(draft.url, "same headline as an item already kept (cross-post)");
      continue;
    }

    const draftText = `${draft.title} ${draft.summary}`;

    // The SEEK report is ONE candidate with ONE url, so the de-duplication
    // above already caps it at a single item — the section cannot become three
    // readings of one report. What that does not catch is the report being
    // quoted twice in the same section: once as the hero stat, once as a bite
    // built on the same figure. A number repeated a few lines apart reads as an
    // editing mistake, so the bite goes and the hero keeps the number.
    //
    // Deliberately limited to the SEEK item. An RSS story that happens to cite
    // the same figure is a second publication corroborating it, which is worth
    // printing, not a duplicate.
    if (opts.seekUrl && opts.heroValue && draft.url === opts.seekUrl) {
      if (draftText.includes(opts.heroValue)) {
        drop(draft.url, "repeats the hero stat figure " + opts.heroValue);
        continue;
      }
    }

    const ownText = `${source.title} ${source.sourceText}`;
    const numbers = assertNumbersVerbatim(draftText, ownText);
    if (!numbers.ok) {
      drop(draft.url, "numbers not verbatim in the source: " + numbers.offending.join(", "));
      continue;
    }

    seenUrls.add(draft.url);
    seenHeadlines.add(headline);
    const dateLabel = datelineFor(source.isoDate);
    const item: PulseNewsItem = {
      title: draft.title,
      summary: draft.summary,
      sourceLabel: source.source,
      url: draft.url,
      // Omit the key entirely rather than emit null: the schema makes it optional.
      ...(dateLabel ? { dateLabel } : {}),
    };

    const angle = `${hostOf(draft.url)}::${rssRelevanceRank(source.title)}`;
    if (seenAngles.has(angle)) {
      spares.push(item);
      continue;
    }
    seenAngles.add(angle);
    preferred.push(item);
  }

  return [...preferred, ...spares].slice(0, MAX_NEWS_BITES);
}

/**
 * Assembles the pulse section for one issue from fetched sources.
 *
 * Flow: with no API key or no usable sources, returns the evergreen pulse. Else
 * it asks the model for a hero stat + up to three news items, asserts every
 * displayed number is verbatim from the matching source (retrying once with the
 * error), and drops or falls back any component that still fails its check — so
 * a fabricated number can never reach a reader.
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

  // Corpora for the verbatim guard: hero numbers must be in the SEEK text; each
  // news item's numbers must be in that item's own text, which is why the news
  // side is a URL-keyed map rather than one pooled string.
  const seekCorpus = sources.seekArticle?.text ?? "";

  /**
   * The SEEK report is a news candidate as well as the hero stat's source.
   *
   * **This is not a widening of the URL guard, and the distinction is the one a
   * future reader will collapse.** The guard says the model may only cite a
   * document THIS PROCESS DOWNLOADED. The SEEK article is fetched, parsed and
   * quoted on every run; putting it in the candidate map lets the model cite a
   * source that was already retrieved and already verified. It cannot reach
   * anything new, and the invariant is untouched: every URL that survives into
   * `newsBites` is a URL we fetched, and every number in it is checked verbatim
   * against that document's own text, exactly as for an RSS item.
   *
   * Why it earns its place: SEEK's monthly report is the only NZ JOB-MARKET
   * DATA source in the pipeline — the tech feeds carry industry stories and
   * commentary, not employment figures — and the job market is one of the three
   * legs of the editorial mix. July 2026's strongest hand-written item ("tech
   * job ads up 9.9% on a year ago, Auckland up 5.0%, all ads up 0.2%") came
   * from this report and was unreachable to the generator until now.
   */
  const seekCandidate: FetchedNewsItem | null = sources.seekArticle
    ? {
        title: sources.seekArticle.title,
        url: sources.seekArticle.url,
        source: SEEK_SOURCE_LABEL,
        // The report covers a period rather than carrying a publication instant
        // we can trust, so it ships with no dateline rather than a guessed one.
        isoDate: null,
        // The model already receives the full report in its own prompt block;
        // repeating it inside the news list would only inflate the prompt.
        snippet: "",
        sourceText: sources.seekArticle.text,
      }
    : null;

  const newsByUrl = new Map(sources.newsItems.map((item) => [item.url, item]));
  if (seekCandidate) newsByUrl.set(seekCandidate.url, seekCandidate);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: PULSE_SYSTEM_PROMPT },
    { role: "user", content: buildModelUserPrompt(sources, opts.monthLabel) },
  ];

  let model: ModelPulse | null = null;

  try {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const { parsed, raw, error } = await callModel(messages);

      if (parsed) {
        const problems = validateModelPulse(parsed, { seekCorpus, newsByUrl });
        if (problems.length === 0) {
          model = parsed;
          break;
        }
        messages.push({ role: "assistant", content: raw });
        messages.push({
          role: "user",
          content: `Your output broke the anti-hallucination rules:\n${problems.join(
            "\n"
          )}\nReturn a corrected JSON object. Every number must appear verbatim in the source text of the item it belongs to; drop any number you cannot copy exactly, and drop any news item you cannot support — returning fewer items is correct.`,
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

  const heroStat = heroValid
    ? {
        value: model!.heroStat!.value,
        label: model!.heroStat!.label,
        context: model!.heroStat!.context,
        sourceLabel: SEEK_SOURCE_LABEL,
        sourceUrl: sources.seekArticle!.url,
      }
    : heroStatFromFact(
        NZ_TECH_NUMERIC_FACTS[wrap(monthIndex, NZ_TECH_NUMERIC_FACTS.length)]
      );

  // The hero stat is settled first so a SEEK-sourced bite can be checked
  // against the figure the section is already leading with.
  const proposed = model?.newsBites ?? [];
  const newsBites = selectNewsBites(proposed, newsByUrl, {
    seekUrl: seekCandidate?.url ?? null,
    heroValue: heroStat.value,
    // Say what was rejected and why. A short Pulse is a legitimate outcome and
    // is also what a guard eating a good story looks like; whoever is curating
    // the issue has to be able to tell those apart, and until this logged
    // nothing they could not.
    onDrop: (url, reason) => console.warn(`[pulse] dropped ${url} — ${reason}`),
  });
  if (proposed.length !== newsBites.length) {
    console.warn(
      `[pulse] kept ${newsBites.length} of ${proposed.length} proposed news item(s)`
    );
  }

  const didYouKnow = evergreenDidYouKnow(monthIndex, heroStat.sourceUrl);

  const pulse: Pulse = {
    heroStat,
    /**
     * Deliberately left null: the generator now emits `newsBites` ONLY.
     *
     * The renderer already prefers the array and falls back to this key for the
     * issues generated before the array existed (2026-06, -07, -08 all carry
     * it), so nothing about older issues changes. Writing the first item into
     * both fields would put two copies of one truth in every new issue JSON:
     * hand-edit one and the other silently disagrees, and emptying `newsBites`
     * during editing would resurrect a stale legacy item instead of showing
     * nothing. One field owns the news list.
     */
    newsBite: null,
    /**
     * `[]` rather than an omitted key when nothing survives validation. Both
     * render identically (the renderer treats empty and absent the same), but
     * an explicit empty array records that we looked and found nothing usable,
     * and keeps the shape of every generated issue identical so a diff between
     * two months is about content rather than which keys exist.
     */
    newsBites,
    didYouKnow,
  };

  // Final guard: the assembled section must satisfy the real schema.
  const validated = editorialSchema.shape.pulse.safeParse(pulse);
  return validated.success ? validated.data : evergreenPulse(monthIndex);
}

/**
 * Collects human-readable verbatim/URL violations for a model draft, item by
 * item. Feeding the item index back to the model is what lets a retry drop one
 * bad bite and keep the others, instead of rewriting the whole list.
 */
function validateModelPulse(
  model: ModelPulse,
  corpora: { seekCorpus: string; newsByUrl: ReadonlyMap<string, FetchedNewsItem> }
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

  const bites = model.newsBites ?? [];

  if (bites.length > MAX_NEWS_BITES) {
    problems.push(
      `newsBites has ${bites.length} items; keep at most ${MAX_NEWS_BITES}, the best ones`
    );
  }

  bites.forEach((bite, index) => {
    const source = corpora.newsByUrl.get(bite.url);
    if (!source) {
      problems.push(
        `newsBites[${index}].url is not one of the provided article URLs — drop that item`
      );
      return;
    }
    const check = assertNumbersVerbatim(
      `${bite.title} ${bite.summary}`,
      `${source.title} ${source.sourceText}`
    );
    if (!check.ok) {
      problems.push(
        `newsBites[${index}] uses numbers not present verbatim in that article's own text: ${check.offending.join(
          ", "
        )}`
      );
    }
  });

  const urls = bites.map((bite) => bite.url);
  if (new Set(urls).size !== urls.length) {
    problems.push("newsBites reuses the same article twice — each item needs its own");
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
