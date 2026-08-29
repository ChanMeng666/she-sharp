/**
 * Runnable checks for the "NZ Tech Pulse" assembly layer.
 * No live network or OpenAI calls are made.
 * Run with: `npx tsx lib/newsletter/pulse.test.ts`
 */

import assert from "node:assert";

import {
  assertNumbersVerbatim,
  buildHrdNewsItem,
  buildPulse,
  dropStaleWomenItemsWhenFreshOnesExist,
  evergreenPulse,
  extractHrdArticleMeta,
  extractNumberTokens,
  feedPageUrl,
  hrdSitemapUrl,
  hrdSlugFromUrl,
  hrdSlugIsTopical,
  mergeNewsItems,
  needsPreviousYearSitemap,
  normaliseHeadline,
  parseSitemapEntries,
  PULSE_MODEL,
  PULSE_RSS_FEEDS,
  pulseModel,
  pulsePreflightLines,
  rssRelevanceRank,
  selectHrdCandidates,
  selectNewsBites,
  type PulseSourceData,
  type SitemapEntry,
} from "./pulse";
import {
  AUCKLAND_FACTS,
  NZ_WIDE_FACTS,
  NZ_TECH_FACTS,
} from "../data/nz-tech-facts";
import { editorialSchema } from "./schema";

/** The pulse slice of the editorial schema, reused to validate assembled output. */
const pulseSchema = editorialSchema.shape.pulse;

// --- Fixtures for the news-list checks --------------------------------------
// Four fetched items standing in for an RSS pull: two from one publication on
// different topics, one from another, and one undated. Every number a draft is
// allowed to use appears verbatim in the snippet of ITS OWN item.

const FETCHED: PulseSourceData["newsItems"] = [
  {
    title: "Women in tech summit fills Auckland venue",
    url: "https://itbrief.co.nz/story/women-in-tech-summit",
    source: "IT Brief NZ",
    isoDate: "2026-07-28T02:00:00.000Z",
    snippet: "About 240 people came to the summit at AUT, organisers said.",
    // Deliberately longer than the teaser: the guard reads this, the model
    // reads `snippet`. One real feed ships whole articles.
    sourceText:
      "About 240 people came to the summit at AUT, organisers said. " +
      "The group now has 1,100 members nationally.",
  },
  {
    title: "Tech job ads lift across the country",
    url: "https://techday.co.nz/story/tech-job-ads-lift",
    source: "TechDay NZ",
    isoDate: "2026-07-20T02:00:00.000Z",
    snippet: "Tech job ads rose 9.9% on a year ago, against 0.2% for all ads.",
    sourceText: "Tech job ads rose 9.9% on a year ago, against 0.2% for all ads.",
  },
  {
    title: "Kiwi startup raises funding for its platform",
    url: "https://itbrief.co.nz/story/kiwi-startup-raises",
    source: "IT Brief NZ",
    isoDate: null,
    snippet: "The round totalled $12 million, the company confirmed.",
    sourceText: "The round totalled $12 million, the company confirmed.",
  },
  {
    title: "Women engineers group opens 2027 nominations",
    url: "https://itbrief.co.nz/story/women-engineers-nominations",
    source: "IT Brief NZ",
    isoDate: "2026-07-15T02:00:00.000Z",
    snippet: "Nominations close in September, the group said.",
    sourceText: "Nominations close in September, the group said.",
  },
];

const FETCHED_BY_URL = new Map(FETCHED.map((item) => [item.url, item]));

/** A faithful draft of item 0 — note the deliberately wrong source claim. */
const DRAFT_WOMEN = {
  title: "A room full of women in tech, in Auckland",
  summary: "About 240 people filled the AUT venue for the summit.",
  url: "https://itbrief.co.nz/story/women-in-tech-summit",
  sourceLabel: "Some Other Publication",
};

/** A faithful draft of item 1. */
const DRAFT_JOBS = {
  title: "If you shelved a job search, take it back off the shelf",
  summary: "Tech job ads rose 9.9% on a year ago while all ads managed 0.2%.",
  url: "https://techday.co.nz/story/tech-job-ads-lift",
};

/** A faithful draft of item 2 (the undated one). */
const DRAFT_INDUSTRY = {
  title: "A Kiwi platform lands its round",
  summary: "The round totalled $12 million.",
  url: "https://itbrief.co.nz/story/kiwi-startup-raises",
};

/** A second women-tier item from the SAME publication — the near-duplicate case. */
const DRAFT_WOMEN_TWO = {
  title: "Nominations open for the women engineers awards",
  summary: "Nominations close in September.",
  url: "https://itbrief.co.nz/story/women-engineers-nominations",
};

/** What the stubbed model returns on its next call; swapped per check. */
let stubbedPayload: unknown = null;

/**
 * ONE stub function object, reused for every stubbed check. The OpenAI SDK
 * captures `globalThis.fetch` when the client is CONSTRUCTED, and `pulse.ts`
 * caches that client for the process — so installing a fresh closure per check
 * silently leaves the second check talking to the first check's stub. Reading a
 * mutable payload from a stable function is what makes the swap take effect.
 */
const stubFetch = (async () =>
  new Response(
    JSON.stringify({
      id: "chatcmpl-test",
      object: "chat.completion",
      created: 0,
      model: "gpt-4o-mini",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: JSON.stringify(stubbedPayload) },
          finish_reason: "stop",
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  )) as typeof globalThis.fetch;

/**
 * The SEEK report as `buildPulse` offers it to the news selector: fetched and
 * parsed like any other source, with no dateline (the report covers a period)
 * and no teaser (the model receives the report in its own prompt block).
 */
const SEEK_URL = "https://nz.seek.com/about/news/article/seek-nz-employment-report-june26";

const SEEK_CANDIDATE: PulseSourceData["newsItems"][number] = {
  title: "SEEK NZ Employment Report - June 2026",
  url: SEEK_URL,
  source: "SEEK NZ Employment Report",
  isoDate: null,
  snippet: "",
  sourceText:
    "Job ads mentioning AI skills are up 107.3% year on year. Tech job ads rose " +
    "9.9% on a year ago, with Auckland up 5.0%, while ads nationally rose 0.2% in June.",
};

/** The candidate pool as `buildPulse` builds it: RSS items plus the SEEK report. */
const FETCHED_WITH_SEEK = new Map([...FETCHED_BY_URL, [SEEK_URL, SEEK_CANDIDATE]]);

/** A faithful job-market draft built on the SEEK report — July 2026's best item. */
const DRAFT_SEEK = {
  title: "If you shelved a job search, take it back off the shelf",
  summary:
    "Tech job ads rose 9.9% on a year ago and Auckland is up 5.0%, while ads " +
    "nationally rose just 0.2% in June.",
  url: SEEK_URL,
};

// --- Fixtures for the HRD NZ sitemap source ---------------------------------
// A miniature of the real `/nz/sitemaps/articles/2026/`, copied from the live
// file on 2026-08-29 (948 entries, newest first, date-only `<lastmod>`) and cut
// to one representative of every case the selection rules have to decide.

/** "Now" for every dated check below, so none of them rot. */
const HRD_NOW = Date.parse("2026-08-29T00:00:00.000Z");
/** The same 35-day recency window the fetch layer applies. */
const HRD_CUTOFF = HRD_NOW - 35 * 24 * 60 * 60 * 1000;

const HRD_PAY_GAP_URL =
  "https://www.hcamag.com/nz/specialisation/diversity-inclusion/new-zealands-gender-pay-gap-sitting-at-53/587457";
const HRD_AI_TOOLS_URL =
  "https://www.hcamag.com/nz/news/general/ai-tools-create-workforce-imbalance-risk-for-employers-report-warns/587819";

const HRD_SITEMAP_XML = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${HRD_PAY_GAP_URL}</loc>
    <lastmod>2026-08-25</lastmod>
  </url>
  <url>
    <loc>${HRD_AI_TOOLS_URL}</loc>
    <lastmod>2026-08-28</lastmod>
  </url>
  <url>
    <loc>https://www.hcamag.com/nz/news/general/whats-fobo-and-why-are-so-many-workers-afraid-of-it/587910</loc>
    <lastmod>2026-08-28</lastmod>
  </url>
  <url>
    <loc>https://www.hcamag.com/nz/business-news/hiring-managers-share-their-talent-plans/587900</loc>
    <lastmod>2026-08-28</lastmod>
  </url>
  <url>
    <loc>https://www.hcamag.com/nz/news/general/women-in-leadership-programme-opens/500001</loc>
    <lastmod>2026-01-20</lastmod>
  </url>
  <url>
    <loc>https://www.hcamag.com/nz/news/general/undated-entry-about-hiring/500002</loc>
  </url>
</urlset>`;

/** One real article page, reduced to the parts the extractor reads. */
const HRD_ARTICLE_HTML = `<!doctype html><html><head>
<meta property="og:title" content="New Zealand's gender pay gap sitting at 5.3%" />
<meta property="og:description" content="Concerns raised as gender pay gap 'remained largely unchanged,' according to Stats NZ" />
</head><body><article><p>The gender pay gap was 5.3% in the June 2026 quarter,
Stats NZ said, having been 8.6% a decade earlier.</p></article></body></html>`;

/** The same page with the `og:` tags stripped — nothing to summarise or verify. */
const HRD_ARTICLE_HTML_NO_OG = `<!doctype html><html><head><title>Untagged</title></head>
<body><article><p>A short piece with no open-graph metadata at all, but enough
body text that a length rule alone would let it through.</p></article></body></html>`;

/**
 * Runs `fn` with the model stubbed to answer `payload`, so `buildPulse`
 * exercises its real parse → validate → select path with no network call and no
 * API key. Restores `fetch` and the environment afterwards.
 */
async function withStubbedModel<T>(payload: unknown, fn: () => Promise<T>): Promise<T> {
  const realFetch = globalThis.fetch;
  const realKey = process.env.OPENAI_API_KEY;
  stubbedPayload = payload;
  process.env.OPENAI_API_KEY = "test-key-not-used";
  globalThis.fetch = stubFetch;
  try {
    return await fn();
  } finally {
    globalThis.fetch = realFetch;
    stubbedPayload = null;
    if (realKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = realKey;
  }
}

let passed = 0;
function check(label: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve(fn()).then(() => {
    passed++;
    console.log(`  ok - ${label}`);
  });
}

async function main(): Promise<void> {
  // 1. evergreenPulse is schema-valid for every month index.
  console.log("1. evergreenPulse:");
  await check("validates against the pulse schema for all 12 months", () => {
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const pulse = evergreenPulse(monthIndex);
      pulseSchema.parse(pulse);
      if (!pulse) throw new Error(`pulse missing for month ${monthIndex}`);
      assert.strictEqual(pulse.newsBite, null, "evergreen pulse never has a news bite");
      assert.ok(pulse.didYouKnow, "evergreen pulse has a did-you-know fact");
      // The hero fact and the did-you-know fact must be different sources.
      assert.notStrictEqual(
        pulse.heroStat.sourceUrl,
        pulse.didYouKnow!.sourceUrl,
        "hero and did-you-know should not be the same source"
      );
    }
  });
  await check("hero stat value is verbatim inside its own context sentence", () => {
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const pulse = evergreenPulse(monthIndex);
      if (!pulse) throw new Error(`pulse missing for month ${monthIndex}`);
      assert.ok(
        pulse.heroStat.context.includes(pulse.heroStat.value),
        `value "${pulse.heroStat.value}" must appear in its context`
      );
    }
  });
  await check("rotates the hero stat across months", () => {
    const values = new Set(
      Array.from({ length: 12 }, (_, i) => evergreenPulse(i)!.heroStat.value)
    );
    assert.ok(values.size > 1, "hero stat should vary by month");
  });

  // 2. assertNumbersVerbatim guards against invented numbers.
  console.log("2. assertNumbersVerbatim:");
  await check("catches an invented number", () => {
    const corpus = "The NZ gender pay gap fell to 5.2% this quarter.";
    const invented = "The gap plunged to 42% this year, down 18%.";
    const result = assertNumbersVerbatim(invented, corpus);
    assert.strictEqual(result.ok, false, "should flag fabricated numbers");
    assert.ok(result.offending.includes("42%"), "42% is not in the corpus");
    assert.ok(result.offending.includes("18%"), "18% is not in the corpus");
  });
  await check("passes numbers copied verbatim from the corpus", () => {
    const corpus = "Filled jobs rose 1.2% and the gap sits at 5.2%.";
    const faithful = "Filled jobs rose 1.2%, with the gap at 5.2%.";
    const result = assertNumbersVerbatim(faithful, corpus);
    assert.strictEqual(result.ok, true, "faithful numbers should pass");
    assert.deepStrictEqual(result.offending, []);
  });
  await check("ignores single-digit tokens like '1 in 5'", () => {
    // Standalone single digits are ordinary English, not statistics to police.
    const result = assertNumbersVerbatim("about 1 in 5 people", "no numbers here at all");
    assert.strictEqual(result.ok, true, "single digits are not flagged");
  });
  await check("extractNumberTokens finds multi-char number tokens", () => {
    assert.deepStrictEqual(
      extractNumberTokens("up 5.2% from 12,000 in Q2"),
      ["5.2%", "12,000", "2"]
    );
  });

  // 3. buildPulse falls back to evergreen when there are no sources (no network).
  console.log("3. buildPulse fallback (no sources, no live calls):");
  await check("null sources yield the evergreen pulse", async () => {
    const emptySources: PulseSourceData = { seekArticle: null, newsItems: [] };
    const pulse = await buildPulse(emptySources, { monthLabel: "July 2026" });
    pulseSchema.parse(pulse);
    // "July" → month index 6; must equal the deterministic evergreen pulse.
    assert.deepStrictEqual(pulse, evergreenPulse(6));
  });
  await check("unknown month label still produces a valid pulse", async () => {
    const emptySources: PulseSourceData = { seekArticle: null, newsItems: [] };
    const pulse = await buildPulse(emptySources, { monthLabel: "Smarch 2026" });
    pulseSchema.parse(pulse);
    assert.deepStrictEqual(pulse, evergreenPulse(0));
  });

  // 4. Auckland facts are well-formed and reachable as hero stats.
  console.log("4. Auckland facts:");
  await check("every Auckland fact has an id, text, label and valid URL", () => {
    assert.ok(AUCKLAND_FACTS.length >= 4, "expected at least 4 Auckland facts");
    for (const fact of AUCKLAND_FACTS) {
      assert.ok(fact.id, "fact has an id");
      assert.ok(fact.text.length > 0, "fact has text");
      assert.ok(fact.sourceLabel.length > 0, "fact has a source label");
      // Throws on an invalid URL.
      new URL(fact.sourceUrl);
      // Every Auckland fact is part of the flat union.
      assert.ok(
        NZ_TECH_FACTS.some((f) => f.id === fact.id),
        `${fact.id} should be in NZ_TECH_FACTS`
      );
    }
  });
  await check("an Auckland numeric fact surfaces as a hero stat, value in context", () => {
    const aucklandTexts = new Set(AUCKLAND_FACTS.map((f) => f.text));
    let sawAuckland = false;
    for (let monthIndex = 0; monthIndex < 24; monthIndex++) {
      const pulse = evergreenPulse(monthIndex)!;
      // The verbatim invariant must hold for the Auckland facts too.
      assert.ok(
        pulse.heroStat.context.includes(pulse.heroStat.value),
        `value "${pulse.heroStat.value}" must appear in its context`
      );
      if (aucklandTexts.has(pulse.heroStat.context)) sawAuckland = true;
    }
    assert.ok(sawAuckland, "an Auckland fact should be a hero stat within 24 months");
  });

  // 5. didYouKnow rotation biases toward Auckland on odd months, NZ on even.
  console.log("5. didYouKnow rotation bias:");
  await check("rotation covers both pools deterministically across 24 months", () => {
    const aucklandUrls = new Set(AUCKLAND_FACTS.map((f) => f.sourceUrl));
    const nzWideUrls = new Set(NZ_WIDE_FACTS.map((f) => f.sourceUrl));
    let aucklandPicks = 0;
    let nzWidePicks = 0;

    for (let monthIndex = 0; monthIndex < 24; monthIndex++) {
      const dyk = evergreenPulse(monthIndex)!.didYouKnow!;
      if (monthIndex % 2 !== 0) {
        assert.ok(
          aucklandUrls.has(dyk.sourceUrl),
          `odd month ${monthIndex} should draw an Auckland fact (got ${dyk.sourceUrl})`
        );
        aucklandPicks++;
      } else {
        assert.ok(
          nzWideUrls.has(dyk.sourceUrl),
          `even month ${monthIndex} should draw an NZ-wide fact (got ${dyk.sourceUrl})`
        );
        nzWidePicks++;
      }
    }
    assert.ok(aucklandPicks > 0 && nzWidePicks > 0, "both pools are exercised");
  });

  // 6. RSS relevance ranks the newsletter's own purpose first.
  console.log("6. rssRelevanceRank:");
  await check("a women-in-tech title outranks an Auckland one", () => {
    // The regression this order was changed to fix (2026-08): while Auckland was
    // tier 0, ANY Auckland story outranked ANY story about women in tech, in a
    // newsletter whose whole subject is women in STEM.
    const women = rssRelevanceRank("Women in tech leaders meet to set 2027 targets");
    const auckland = rssRelevanceRank("Xero expands its Auckland office");
    assert.ok(women < auckland, "a women-in-tech item must sort ahead of an Auckland one");
  });
  await check("a job-market title outranks an Auckland one", () => {
    const jobs = rssRelevanceRank("Tech hiring picks up as skills shortage eases");
    const auckland = rssRelevanceRank("Xero expands its Auckland office");
    assert.ok(jobs < auckland, "a hiring item must sort ahead of a general Auckland one");
  });
  await check("an Auckland title still outranks a generic NZ title", () => {
    const auckland = rssRelevanceRank("AUT opens new tech hub in Auckland CBD");
    const generalNz = rssRelevanceRank("New Zealand broadband rollout continues");
    assert.ok(auckland < generalNz, "Auckland item should sort ahead of general NZ");
  });
  await check("tiers order women < jobs < Auckland < NZ industry < unrelated", () => {
    assert.strictEqual(rssRelevanceRank("Women in AI leadership summit"), 0);
    assert.strictEqual(rssRelevanceRank("Tech hiring picks up across the motu"), 1);
    assert.strictEqual(rssRelevanceRank("Xero expands its Auckland office"), 2);
    assert.strictEqual(rssRelevanceRank("Aotearoa exports software abroad"), 3);
    assert.strictEqual(rssRelevanceRank("Global chip prices rise again"), 4);
  });
  await check("'intern' is bounded so it does not match 'internet'", () => {
    // A bare "internet" story is not job-market news; the boundary is the reason.
    assert.strictEqual(rssRelevanceRank("Internet speeds improve overseas"), 4);
    assert.strictEqual(rssRelevanceRank("Summer internships open for applications"), 1);
  });
  await check("a bare 'AI' match is not treated as an on-mission item", () => {
    // A live fetch put six of eight items in the women/diversity tier purely
    // because their titles said "AI". The top tier must mean what it says.
    assert.notStrictEqual(
      rssRelevanceRank("AI adoption accelerates across NZ businesses"),
      0,
      "an AI story is industry news, not a women-in-tech story"
    );
    assert.strictEqual(rssRelevanceRank("AI adoption accelerates across NZ businesses"), 3);
    assert.strictEqual(rssRelevanceRank("Women lead new AI research group"), 0);
  });

  // 7. The feed list is a drop-in configuration constant.
  console.log("7. PULSE_RSS_FEEDS:");
  await check("every feed entry is a well-formed https url with a source label", () => {
    assert.ok(PULSE_RSS_FEEDS.length > 0, "expected at least one feed");
    const seen = new Set<string>();
    for (const feed of PULSE_RSS_FEEDS) {
      const parsed = new URL(feed.url); // throws on an invalid URL
      assert.strictEqual(parsed.protocol, "https:", `${feed.url} must be https`);
      assert.ok(feed.source.trim().length > 0, `${feed.url} needs a source label`);
      assert.ok(!seen.has(feed.url), `${feed.url} is listed twice`);
      seen.add(feed.url);
      if (feed.pages !== undefined) {
        assert.ok(
          Number.isInteger(feed.pages) && feed.pages >= 1,
          `${feed.url}: pages must be a whole number of pages`
        );
      }
    }
  });
  await check("feedPageUrl leaves page 1 alone and adds ?paged= after that", () => {
    assert.strictEqual(
      feedPageUrl("https://example.org/feed/", 1),
      "https://example.org/feed/",
      "page 1 is the feed exactly as configured"
    );
    assert.strictEqual(
      feedPageUrl("https://example.org/feed/", 3),
      "https://example.org/feed/?paged=3"
    );
    assert.strictEqual(
      feedPageUrl("https://example.org/feed/?cat=7", 2),
      "https://example.org/feed/?cat=7&paged=2",
      "an existing query string survives"
    );
  });

  // 7b. Cross-post detection — one normalisation, used by both layers.
  console.log("7b. normaliseHeadline:");
  await check("the same story republished under another domain collapses to one key", () => {
    // Measured: NZ organisations cross-post each other's articles with an
    // identical headline at a different URL, so URL comparison sees two items.
    const a = "Celebrating ShadowTech26 and building resilience together | August Newsletter";
    const b = "Celebrating ShadowTech26 and building resilience together";
    assert.strictEqual(normaliseHeadline(a), normaliseHeadline(b));
  });
  await check("different stories keep different keys", () => {
    assert.notStrictEqual(
      normaliseHeadline("Tech hiring lifts in July"),
      normaliseHeadline("Tech hiring falls in July")
    );
  });
  await check("punctuation and case do not change the key", () => {
    assert.strictEqual(
      normaliseHeadline("Women in Tech: the 2026 Report!"),
      normaliseHeadline("women in tech  the 2026 report")
    );
  });
  await check("a title that is only a suffix still yields a key", () => {
    assert.ok(normaliseHeadline("| August Newsletter").length > 0);
  });

  // 8. selectNewsBites — the drop rules, with no network and no API key.
  console.log("8. selectNewsBites drop rules:");
  await check("three valid drafts produce three items", () => {
    const bites = selectNewsBites(
      [DRAFT_WOMEN, DRAFT_JOBS, DRAFT_INDUSTRY],
      FETCHED_BY_URL
    );
    assert.strictEqual(bites.length, 3, "all three should survive");
    assert.deepStrictEqual(
      bites.map((bite) => bite.url),
      [DRAFT_WOMEN.url, DRAFT_JOBS.url, DRAFT_INDUSTRY.url],
      "order follows the model's own ranking"
    );
  });
  await check("attribution and dateline come from our source, not the model", () => {
    const [women, , industry] = selectNewsBites(
      [DRAFT_WOMEN, DRAFT_JOBS, DRAFT_INDUSTRY],
      FETCHED_BY_URL
    );
    // The draft claimed a different publication; the fetched item wins.
    assert.strictEqual(women.sourceLabel, "IT Brief NZ");
    assert.strictEqual(women.dateLabel, "28 Jul", "dateline formatted in NZ time");
    // An item with no publication date simply carries no dateline.
    assert.strictEqual(industry.dateLabel, undefined, "undated item has no dateLabel");
  });
  await check("an item whose URL was never fetched is dropped, others survive", () => {
    const invented = { ...DRAFT_WOMEN, url: "https://example.com/never-fetched" };
    const bites = selectNewsBites([DRAFT_JOBS, invented, DRAFT_INDUSTRY], FETCHED_BY_URL);
    assert.deepStrictEqual(
      bites.map((bite) => bite.url),
      [DRAFT_JOBS.url, DRAFT_INDUSTRY.url],
      "only the invented URL is dropped"
    );
  });
  await check("an item with a number absent from its source is dropped, others survive", () => {
    const fabricated = {
      ...DRAFT_WOMEN,
      summary: "Attendance jumped 87% on last year's summit.",
    };
    const bites = selectNewsBites([fabricated, DRAFT_JOBS, DRAFT_INDUSTRY], FETCHED_BY_URL);
    assert.deepStrictEqual(
      bites.map((bite) => bite.url),
      [DRAFT_JOBS.url, DRAFT_INDUSTRY.url],
      "the fabricated statistic takes its item with it"
    );
  });
  await check("a fabricated number in the TITLE is dropped too", () => {
    const fabricated = { ...DRAFT_JOBS, title: "Tech hiring lifts 42% in a month" };
    const bites = selectNewsBites([fabricated, DRAFT_INDUSTRY], FETCHED_BY_URL);
    assert.deepStrictEqual(bites.map((bite) => bite.url), [DRAFT_INDUSTRY.url]);
  });
  await check("a number from the item's fuller text verifies, not just the teaser", () => {
    // The model sees `snippet`; the guard reads `sourceText`. One feed ships
    // whole articles, and truncating the check to the teaser would drop
    // perfectly sourced statistics.
    const deeper = { ...DRAFT_WOMEN, summary: "The group now has 1,100 members." };
    const bites = selectNewsBites([deeper], FETCHED_BY_URL);
    assert.strictEqual(bites.length, 1, "a number further into the article is still sourced");
  });
  await check("a real number belonging to a DIFFERENT article is dropped", () => {
    // 9.9% is genuine, but it is the hiring story's number. Printed under the
    // summit's link it would be a mis-attribution the source could not support.
    const crossed = { ...DRAFT_WOMEN, summary: "The summit heard hiring rose 9.9%." };
    const bites = selectNewsBites([crossed, DRAFT_JOBS], FETCHED_BY_URL);
    assert.deepStrictEqual(bites.map((bite) => bite.url), [DRAFT_JOBS.url]);
  });
  await check("zero valid drafts produce an empty list, never a fabrication", () => {
    const bites = selectNewsBites(
      [
        { ...DRAFT_WOMEN, url: "https://example.com/nope" },
        { ...DRAFT_JOBS, summary: "Ads rose 61.4% overnight." },
      ],
      FETCHED_BY_URL
    );
    assert.deepStrictEqual(bites, [], "an empty array, not a filler item");
  });
  await check("an empty draft list produces an empty list", () => {
    assert.deepStrictEqual(selectNewsBites([], FETCHED_BY_URL), []);
  });
  await check("the same article twice yields one item", () => {
    const bites = selectNewsBites([DRAFT_JOBS, { ...DRAFT_JOBS }], FETCHED_BY_URL);
    assert.strictEqual(bites.length, 1, "one article, one item");
  });
  await check("a same-publication same-topic repeat is demoted, not deleted", () => {
    // DRAFT_WOMEN and DRAFT_WOMEN_TWO share a host and a topic tier, so the
    // mixed item sorts ahead of the repeat — but the repeat still ships.
    const bites = selectNewsBites(
      [DRAFT_WOMEN, DRAFT_WOMEN_TWO, DRAFT_JOBS],
      FETCHED_BY_URL
    );
    assert.deepStrictEqual(
      bites.map((bite) => bite.url),
      [DRAFT_WOMEN.url, DRAFT_JOBS.url, DRAFT_WOMEN_TWO.url],
      "the differently-angled item is promoted above the near-duplicate"
    );
  });
  await check("never returns more than three items", () => {
    const bites = selectNewsBites(
      [DRAFT_WOMEN, DRAFT_JOBS, DRAFT_INDUSTRY, DRAFT_WOMEN_TWO],
      FETCHED_BY_URL
    );
    assert.strictEqual(bites.length, 3, "the schema caps the list at three");
  });
  await check("selected items satisfy the rendered pulse schema", () => {
    const bites = selectNewsBites(
      [DRAFT_WOMEN, DRAFT_JOBS, DRAFT_INDUSTRY],
      FETCHED_BY_URL
    );
    pulseSchema.parse({
      ...evergreenPulse(6),
      newsBites: bites,
    });
  });

  // 8b. The SEEK report as a news item — a source we already fetch, not a
  // relaxation of the "URL must be one we retrieved" guard.
  console.log("8b. SEEK-sourced news bites:");
  await check("a SEEK-sourced bite survives and is attributed to the report", () => {
    const bites = selectNewsBites([DRAFT_SEEK, DRAFT_WOMEN], FETCHED_WITH_SEEK, {
      seekUrl: SEEK_URL,
      heroValue: "107.3%",
    });
    assert.strictEqual(bites.length, 2, "both items survive");
    // Found by URL, not by position: since the deterministic sort landed, the
    // draft order no longer decides where an item appears — see 8c.
    const seek = bites.find((bite) => bite.url === SEEK_URL);
    assert.ok(seek, "the SEEK-sourced bite survives");
    assert.strictEqual(seek.sourceLabel, "SEEK NZ Employment Report");
    assert.strictEqual(seek.dateLabel, undefined, "the report ships no dateline");
  });
  await check("the URL guard still binds: a SEEK-looking URL we did not fetch is dropped", () => {
    // The guard is unchanged — SEEK is allowed because it IS fetched, not
    // because anything about seek.co.nz is trusted.
    const lookalike = {
      ...DRAFT_SEEK,
      url: "https://nz.seek.com/about/news/article/seek-nz-employment-report-may26",
    };
    const bites = selectNewsBites([lookalike, DRAFT_WOMEN], FETCHED_WITH_SEEK, {
      seekUrl: SEEK_URL,
      heroValue: "107.3%",
    });
    assert.deepStrictEqual(bites.map((bite) => bite.url), [DRAFT_WOMEN.url]);
  });
  await check("a SEEK bite with a number absent from the report is dropped, others survive", () => {
    const fabricated = { ...DRAFT_SEEK, summary: "Tech job ads rose 31.4% on a year ago." };
    const bites = selectNewsBites([fabricated, DRAFT_WOMEN, DRAFT_JOBS], FETCHED_WITH_SEEK, {
      seekUrl: SEEK_URL,
      heroValue: "107.3%",
    });
    assert.deepStrictEqual(
      bites.map((bite) => bite.url),
      [DRAFT_WOMEN.url, DRAFT_JOBS.url],
      "the invented figure takes its item with it"
    );
  });
  await check("a SEEK bite repeating the hero stat's number is dropped", () => {
    // The hero stat leads the section with this figure; repeating it a few
    // lines down reads as an editing mistake, so the bite goes.
    const echo = {
      ...DRAFT_SEEK,
      summary: "Job ads mentioning AI skills are up 107.3% year on year.",
    };
    const bites = selectNewsBites([echo, DRAFT_WOMEN], FETCHED_WITH_SEEK, {
      seekUrl: SEEK_URL,
      heroValue: "107.3%",
    });
    assert.deepStrictEqual(bites.map((bite) => bite.url), [DRAFT_WOMEN.url]);
  });
  await check("an RSS bite citing the same number as the hero stat is KEPT", () => {
    // A second publication corroborating the figure is worth printing; the
    // no-repeat rule is deliberately limited to the hero's own source.
    const bites = selectNewsBites([DRAFT_JOBS], FETCHED_WITH_SEEK, {
      seekUrl: SEEK_URL,
      heroValue: "9.9%",
    });
    assert.strictEqual(bites.length, 1, "corroboration is not duplication");
  });
  await check("the SEEK report can supply at most one item", () => {
    const second = { ...DRAFT_SEEK, title: "Another read of the same report" };
    const bites = selectNewsBites([DRAFT_SEEK, second, DRAFT_WOMEN], FETCHED_WITH_SEEK, {
      seekUrl: SEEK_URL,
      heroValue: "107.3%",
    });
    // Membership, not position: the order is settled separately by the
    // deterministic sort in 8c, and asserting it here would only re-test that.
    assert.deepStrictEqual(
      [...bites.map((bite) => bite.url)].sort(),
      [DRAFT_WOMEN.url, SEEK_URL].sort(),
      "one report, one item"
    );
  });

  // 9. buildPulse end-to-end over a stubbed model response (still no network).
  console.log("9. buildPulse news list (stubbed model, no network):");
  await check("emits newsBites and leaves the legacy newsBite null", async () => {
    const pulse = await withStubbedModel(
      {
        heroStat: null,
        newsBites: [DRAFT_WOMEN, DRAFT_JOBS, DRAFT_INDUSTRY],
      },
      () => buildPulse({ seekArticle: null, newsItems: FETCHED }, { monthLabel: "July 2026" })
    );
    pulseSchema.parse(pulse);
    assert.ok(pulse, "pulse present");
    assert.strictEqual(pulse!.newsBite, null, "legacy single bite stays null");
    assert.strictEqual(pulse!.newsBites?.length, 3, "three items in the list");
    // No SEEK article was supplied, so the hero stat falls back to evergreen.
    assert.strictEqual(pulse!.heroStat.sourceLabel.length > 0, true);
  });
  await check("a SEEK-sourced bite reaches the output beside a SEEK hero stat", async () => {
    // End to end: `buildPulse` is where the SEEK article becomes a news
    // candidate, so the helper checks above cannot prove this wiring.
    const pulse = await withStubbedModel(
      {
        heroStat: {
          value: "107.3%",
          label: "more NZ job ads mention AI skills",
          context: "Job ads mentioning AI skills are up 107.3% year on year.",
        },
        newsBites: [DRAFT_SEEK, DRAFT_WOMEN],
      },
      () =>
        buildPulse(
          {
            seekArticle: {
              title: SEEK_CANDIDATE.title,
              url: SEEK_URL,
              text: SEEK_CANDIDATE.sourceText,
            },
            newsItems: FETCHED,
          },
          { monthLabel: "July 2026" }
        )
    );
    pulseSchema.parse(pulse);
    assert.strictEqual(pulse!.heroStat.value, "107.3%", "hero stat comes from SEEK");
    assert.strictEqual(pulse!.heroStat.sourceUrl, SEEK_URL);
    // Membership, not position — the order is 8c's business.
    assert.deepStrictEqual(
      [...(pulse!.newsBites ?? [])].map((bite) => bite.url).sort(),
      [DRAFT_WOMEN.url, SEEK_URL].sort(),
      "the job-market bite is sourced from the report we already fetched"
    );
    assert.strictEqual(
      pulse!.newsBites?.find((bite) => bite.url === SEEK_URL)?.sourceLabel,
      "SEEK NZ Employment Report"
    );
    assert.strictEqual(pulse!.newsBite, null);
  });
  await check("a model list of one invented URL degrades to an empty list", async () => {
    const pulse = await withStubbedModel(
      {
        heroStat: null,
        newsBites: [{ ...DRAFT_WOMEN, url: "https://example.com/invented" }],
      },
      () => buildPulse({ seekArticle: null, newsItems: FETCHED }, { monthLabel: "July 2026" })
    );
    pulseSchema.parse(pulse);
    assert.deepStrictEqual(pulse!.newsBites, [], "degraded, not fabricated");
    assert.strictEqual(pulse!.newsBite, null);
  });

  // 10. The HRD NZ sitemap source. No network: every check runs against the
  // fixtures above, which were copied from the live files on 2026-08-29.
  console.log("10. HRD sitemap parsing:");
  await check("parses <loc> + <lastmod> pairs in document order", () => {
    const entries = parseSitemapEntries(HRD_SITEMAP_XML);
    assert.strictEqual(entries[0].loc, HRD_PAY_GAP_URL);
    assert.strictEqual(entries[0].lastmod, "2026-08-25");
    assert.strictEqual(entries[1].loc, HRD_AI_TOOLS_URL);
    assert.strictEqual(entries[1].lastmod, "2026-08-28");
  });
  await check("an entry with no <lastmod> is skipped, not half-kept", () => {
    // A sitemap spans a whole year, so an undated entry can never be shown to
    // satisfy the recency window — unlike an RSS item, which is kept.
    const entries = parseSitemapEntries(HRD_SITEMAP_XML);
    assert.strictEqual(entries.length, 5, "six <url> blocks, one of them undated");
    assert.ok(
      !entries.some((entry) => entry.loc.includes("undated-entry")),
      "the undated entry must not survive parsing"
    );
  });
  await check("the <urlset> wrapper is not mistaken for a <url> entry", () => {
    // `<url\b` is what stops `<urlset ...>` opening a bogus block.
    assert.deepStrictEqual(parseSitemapEntries("<urlset><!-- empty --></urlset>"), []);
  });
  await check("junk and an empty document parse to nothing rather than throwing", () => {
    assert.deepStrictEqual(parseSitemapEntries(""), []);
    assert.deepStrictEqual(parseSitemapEntries("<html><body>404</body></html>"), []);
  });
  await check("the sitemap URL is the per-year path", () => {
    assert.strictEqual(
      hrdSitemapUrl(2026),
      "https://www.hcamag.com/nz/sitemaps/articles/2026/"
    );
  });

  console.log("10b. HRD slug filter (runs BEFORE any article is fetched):");
  await check("the slug is the last path segment before the numeric article id", () => {
    assert.strictEqual(
      hrdSlugFromUrl(HRD_AI_TOOLS_URL),
      "ai-tools-create-workforce-imbalance-risk-for-employers-report-warns"
    );
    assert.strictEqual(hrdSlugFromUrl("not a url"), "");
  });
  await check("keeps the on-mission slugs the section exists for", () => {
    for (const url of [
      HRD_PAY_GAP_URL,
      HRD_AI_TOOLS_URL,
      "https://www.hcamag.com/nz/news/general/women-remain-underrepresented-in-ai-roles-despite-jobs-boom/586604",
      "https://www.hcamag.com/nz/news/general/psa-scrapping-pay-equity-cost-new-zealand-135-billion-in-growth/1",
      "https://www.hcamag.com/nz/news/general/graduate-hiring-lifts-this-summer/2",
      "https://www.hcamag.com/nz/news/general/what-a-tech-salary-looks-like-now/3",
    ]) {
      assert.ok(hrdSlugIsTopical(url), `${hrdSlugFromUrl(url)} should be kept`);
    }
  });
  await check("rejects the slugs that are not this newsletter's subject", () => {
    for (const url of [
      "https://www.hcamag.com/nz/news/general/whats-fobo-and-why-are-so-many-workers-afraid-of-it/587910",
      "https://www.hcamag.com/nz/specialisation/employment-law/rigid-drug-and-alcohol-policy-costs-employer-25k/587790",
      "https://www.hcamag.com/nz/news/general/most-workers-dont-trust-their-leaders/587815",
    ]) {
      assert.ok(!hrdSlugIsTopical(url), `${hrdSlugFromUrl(url)} should be rejected`);
    }
  });
  await check("'ai' is bounded so it cannot match inside an unrelated word", () => {
    // The same trap `\bintern(ships?|s)?\b` was bounded for. In a slug the
    // delimiter is a hyphen, so the bound is `(^|-)ai(-|$)`, not `\b`.
    assert.ok(
      !hrdSlugIsTopical("https://www.hcamag.com/nz/news/general/workers-afraid-of-change/1"),
      "'afraid' must not read as an AI story"
    );
    assert.ok(
      !hrdSlugIsTopical("https://www.hcamag.com/nz/news/general/thai-restaurant-wage-case/2"),
      "'thai' must not read as an AI story"
    );
    assert.ok(
      !hrdSlugIsTopical("https://www.hcamag.com/nz/news/general/repair-shop-dispute/3"),
      "'repair' must not read as an AI story"
    );
    assert.ok(
      hrdSlugIsTopical("https://www.hcamag.com/nz/news/general/ai-reshapes-early-careers/4"),
      "a leading 'ai-' is a real match"
    );
    assert.ok(
      hrdSlugIsTopical("https://www.hcamag.com/nz/news/general/how-employers-use-ai/5"),
      "a trailing '-ai' is a real match"
    );
  });

  console.log("10c. HRD candidate selection:");
  await check("keeps the recent topical entries and drops the rest", () => {
    const candidates = selectHrdCandidates(
      parseSitemapEntries(HRD_SITEMAP_XML),
      HRD_CUTOFF
    );
    assert.deepStrictEqual(
      candidates.map((entry) => entry.loc),
      [HRD_PAY_GAP_URL, HRD_AI_TOOLS_URL],
      "gender first (tier 0), then the hiring story (tier 1)"
    );
  });
  await check("an entry outside the recency window is dropped", () => {
    // The January "women in leadership" entry is squarely on topic; it is seven
    // months old, and a sitemap holds a whole year, so the window must bind.
    const candidates = selectHrdCandidates(
      parseSitemapEntries(HRD_SITEMAP_XML),
      HRD_CUTOFF
    );
    assert.ok(
      !candidates.some((entry) => entry.loc.includes("women-in-leadership")),
      "an on-topic but stale entry must not reach the pool"
    );
  });
  await check("a /nz/business-news/ entry is never fetched, topical or not", () => {
    // The one path robots.txt disallows for `*` on the NZ edition. Its slug
    // says "hiring" and "talent", so only the path rule can be keeping it out.
    const url = "https://www.hcamag.com/nz/business-news/hiring-managers-share-their-talent-plans/587900";
    assert.ok(hrdSlugIsTopical(url), "the slug alone would have kept it");
    const candidates = selectHrdCandidates(
      parseSitemapEntries(HRD_SITEMAP_XML),
      HRD_CUTOFF
    );
    assert.ok(
      !candidates.some((entry) => entry.loc.includes("/nz/business-news/")),
      "robots.txt disallows this path"
    );
  });
  await check("the article-fetch cap holds against a month of candidates", () => {
    // ~117 slugs survive the filter in a real 60-day window. This is a monthly
    // cron, not a crawler, so only a handful may become outbound requests.
    const many: SitemapEntry[] = Array.from({ length: 40 }, (_, i) => ({
      loc: `https://www.hcamag.com/nz/news/general/hiring-and-talent-story-${i}/${600000 + i}`,
      lastmod: "2026-08-20",
    }));
    const candidates = selectHrdCandidates(many, HRD_CUTOFF);
    assert.strictEqual(candidates.length, 6, "at most six article pages are fetched");
  });
  await check("the same article in two sitemaps is only fetched once", () => {
    const twice = [
      ...parseSitemapEntries(HRD_SITEMAP_XML),
      ...parseSitemapEntries(HRD_SITEMAP_XML),
    ];
    const candidates = selectHrdCandidates(twice, HRD_CUTOFF);
    assert.strictEqual(new Set(candidates.map((e) => e.loc)).size, candidates.length);
  });

  console.log("10d. The January boundary (the bug that would fire once a year):");
  await check("a year that does not reach the cutoff pulls the previous year", () => {
    // On 5 January 2027 the /2027/ sitemap holds four days. Without this the
    // section starves every January, and nobody connects it to this code.
    const january: SitemapEntry[] = [
      { loc: "https://www.hcamag.com/nz/news/general/hiring-outlook-2027/700003", lastmod: "2027-01-05" },
      { loc: "https://www.hcamag.com/nz/news/general/talent-plans-for-the-year/700001", lastmod: "2027-01-02" },
    ];
    const januaryCutoff = Date.parse("2027-01-05T00:00:00.000Z") - 35 * 24 * 60 * 60 * 1000;
    assert.strictEqual(
      needsPreviousYearSitemap(january, januaryCutoff),
      true,
      "the oldest entry is newer than the cutoff, so the year is too short"
    );
  });
  await check("a year that already covers the window does not", () => {
    // Eleven months of the year the second request is never made.
    const entries = parseSitemapEntries(HRD_SITEMAP_XML);
    assert.strictEqual(needsPreviousYearSitemap(entries, HRD_CUTOFF), false);
  });
  await check("an empty or unparsable sitemap also pulls the previous year", () => {
    // 1 January, before the year's first article: the file may not exist yet.
    assert.strictEqual(needsPreviousYearSitemap([], HRD_CUTOFF), true);
    assert.strictEqual(
      needsPreviousYearSitemap([{ loc: "https://x/y/1", lastmod: "not a date" }], HRD_CUTOFF),
      true
    );
  });

  console.log("10e. HRD article metadata:");
  await check("reads og:title and og:description off the article page", () => {
    const meta = extractHrdArticleMeta(HRD_ARTICLE_HTML);
    assert.strictEqual(meta.ogTitle, "New Zealand's gender pay gap sitting at 5.3%");
    assert.ok(meta.ogDescription.startsWith("Concerns raised as gender pay gap"));
    assert.ok(meta.bodyText.includes("8.6%"), "the body is kept for the number guard");
  });
  await check("an article with neither og: tag is skipped, not sent to the model", () => {
    const entry: SitemapEntry = { loc: HRD_PAY_GAP_URL, lastmod: "2026-08-25" };
    const meta = extractHrdArticleMeta(HRD_ARTICLE_HTML_NO_OG);
    assert.strictEqual(meta.ogTitle, "", "no og:title on this page");
    assert.strictEqual(meta.ogDescription, "", "no og:description either");
    assert.strictEqual(
      buildHrdNewsItem(entry, meta),
      null,
      "nothing to summarise and nothing to verify a number against"
    );
  });
  await check("an item is built from og:description plus the article body", () => {
    const entry: SitemapEntry = { loc: HRD_PAY_GAP_URL, lastmod: "2026-08-25" };
    const item = buildHrdNewsItem(entry, extractHrdArticleMeta(HRD_ARTICLE_HTML));
    assert.ok(item, "the item is built");
    assert.strictEqual(item!.source, "HRD New Zealand");
    assert.strictEqual(item!.url, HRD_PAY_GAP_URL);
    assert.strictEqual(item!.isoDate, "2026-08-25T00:00:00.000Z", "a real date from <lastmod>");
    // The model gets the publisher's own sentence and writes its own summary
    // from it; the guard reads that sentence AND the body, so a number deeper
    // in the article still verifies.
    assert.ok(item!.snippet.startsWith("Concerns raised"), "og:description is the teaser");
    assert.ok(item!.sourceText.includes("8.6%"), "the body backs the number guard");
  });

  console.log("10f. A sitemap item through the existing guards, unchanged:");
  await check("a faithful draft survives and is attributed to HRD with a dateline", () => {
    const entry: SitemapEntry = { loc: HRD_PAY_GAP_URL, lastmod: "2026-08-25" };
    const item = buildHrdNewsItem(entry, extractHrdArticleMeta(HRD_ARTICLE_HTML))!;
    const bites = selectNewsBites(
      [
        {
          title: "The gender pay gap barely moved",
          summary: "Stats NZ put the gap at 5.3% in the June 2026 quarter.",
          url: HRD_PAY_GAP_URL,
        },
      ],
      new Map([[item.url, item]])
    );
    assert.strictEqual(bites.length, 1);
    assert.strictEqual(bites[0].sourceLabel, "HRD New Zealand", "attribution is ours, not the model's");
    assert.strictEqual(bites[0].dateLabel, "25 Aug", "dateline formatted in NZ time");
  });
  await check("the verbatim-number guard still drops a fabricated HRD figure", () => {
    const entry: SitemapEntry = { loc: HRD_PAY_GAP_URL, lastmod: "2026-08-25" };
    const item = buildHrdNewsItem(entry, extractHrdArticleMeta(HRD_ARTICLE_HTML))!;
    const bites = selectNewsBites(
      [
        {
          title: "The gender pay gap barely moved",
          summary: "Stats NZ put the gap at 4.1% in the June quarter.",
          url: HRD_PAY_GAP_URL,
        },
      ],
      new Map([[item.url, item]])
    );
    assert.deepStrictEqual(bites, [], "4.1% is in no source we fetched");
  });
  await check("the URL guard still binds on an hcamag URL we did not fetch", () => {
    const entry: SitemapEntry = { loc: HRD_PAY_GAP_URL, lastmod: "2026-08-25" };
    const item = buildHrdNewsItem(entry, extractHrdArticleMeta(HRD_ARTICLE_HTML))!;
    const bites = selectNewsBites(
      [
        {
          title: "The gender pay gap barely moved",
          summary: "Stats NZ put the gap at 5.3% in the June 2026 quarter.",
          url: "https://www.hcamag.com/nz/news/general/some-other-article/999999",
        },
      ],
      new Map([[item.url, item]])
    );
    assert.deepStrictEqual(bites, [], "a plausible hcamag URL is still not one we retrieved");
  });

  console.log("10g. mergeNewsItems — one pool, whatever source produced it:");
  await check("an HRD item outranks a generic RSS item on mission tier", () => {
    const entry: SitemapEntry = { loc: HRD_PAY_GAP_URL, lastmod: "2026-08-25" };
    const hrd = buildHrdNewsItem(entry, extractHrdArticleMeta(HRD_ARTICLE_HTML))!;
    // FETCHED[2] is the undated startup-funding item — tier 3.
    const merged = mergeNewsItems([[FETCHED[2]], [hrd]]);
    assert.strictEqual(
      merged[0].url,
      HRD_PAY_GAP_URL,
      "a gender item sorts ahead of general industry news even though it was passed second"
    );
  });
  await check("the same story from both sources collapses to one item", () => {
    const cross: PulseSourceData["newsItems"][number] = {
      ...FETCHED[0],
      url: "https://www.hcamag.com/nz/news/general/women-in-tech-summit-fills-auckland-venue/1",
      source: "HRD New Zealand",
    };
    const merged = mergeNewsItems([[FETCHED[0]], [cross]]);
    assert.strictEqual(merged.length, 1, "one story, one item");
    assert.strictEqual(merged[0].source, "IT Brief NZ", "the earlier list wins the tie");
  });
  await check("merging never returns more than the pool cap", () => {
    const many: PulseSourceData["newsItems"] = Array.from({ length: 30 }, (_, i) => ({
      ...FETCHED[1],
      title: `Tech job ads lift across the country ${i}`,
      url: `https://techday.co.nz/story/tech-job-ads-lift-${i}`,
    }));
    assert.strictEqual(mergeNewsItems([many]).length, 12);
  });

  // --- The wide women's window is a FALLBACK, not a default -------------------
  //
  // Measured 2026-08-29 against the live pool: twelve items aged 1 to 24 days,
  // plus exactly one at 75 days that `WOMEN_MAX_AGE_DAYS` had admitted — a June
  // newsletter digest competing with five current women's stories. A monthly
  // newsletter's news section is about the month, so the reach-back has to
  // apply only when the month genuinely produced nothing.
  console.log("\n11. the 90-day women's window only applies when nothing is fresh:");

  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
  const womenItem = (title: string, days: number): PulseSourceData["newsItems"][number] => ({
    ...FETCHED[0],
    title,
    url: `https://techwomen.nz/${days}`,
    isoDate: daysAgo(days),
  });
  const otherItem: PulseSourceData["newsItems"][number] = {
    ...FETCHED[1],
    title: "Tech job ads lift across the country",
    url: "https://techday.co.nz/story/other",
    isoDate: daysAgo(3),
  };

  await check("a stale women item is dropped when a fresh one exists", () => {
    const stale = womenItem("Women in tech: a June newsletter round-up", 75);
    const kept = dropStaleWomenItemsWhenFreshOnesExist([
      womenItem("Women in tech leadership hits a new high", 5),
      stale,
      otherItem,
    ]);
    assert.strictEqual(kept.length, 2, "the 75-day women item goes");
    assert.ok(!kept.some((item) => item.url === stale.url), "and it is the stale one that went");
  });

  await check("a stale women item SURVIVES when it is the only one", () => {
    const kept = dropStaleWomenItemsWhenFreshOnesExist([
      womenItem("Women in tech: a June newsletter round-up", 75),
      otherItem,
    ]);
    assert.strictEqual(kept.length, 2, "nothing is dropped when no fresher women item exists");
  });

  await check("the rule never removes a non-women item", () => {
    const oldOther = { ...otherItem, url: "https://techday.co.nz/story/old", isoDate: daysAgo(200) };
    const kept = dropStaleWomenItemsWhenFreshOnesExist([
      womenItem("Women in tech leadership hits a new high", 5),
      oldOther,
    ]);
    assert.strictEqual(kept.length, 2, "only women items are ever subject to it");
  });

  // 8c. Deterministic ordering.
  //
  // The measured problem: three runs of the generator against the same month
  // and the same sources returned the middle two items in two different orders.
  // The model now chooses WHICH stories; the sort chooses the order.
  console.log("8c. Deterministic ordering:");

  await check("items are ordered by relevance tier, then recency", () => {
    // Deliberately handed to the selector in the WRONG order.
    const bites = selectNewsBites(
      [DRAFT_INDUSTRY, DRAFT_JOBS, DRAFT_WOMEN],
      FETCHED_BY_URL,
    );
    assert.deepStrictEqual(
      bites.map((bite) => bite.url),
      [
        DRAFT_WOMEN.url, // tier 0 (women), 28 Jul
        DRAFT_JOBS.url, // tier 1 (job market), 20 Jul
        DRAFT_INDUSTRY.url, // tier 3 (industry), undated
      ],
      "the draft order must not survive into the section",
    );
  });

  await check("the same three drafts in any order produce the same section", () => {
    const orders = [
      [DRAFT_WOMEN, DRAFT_JOBS, DRAFT_INDUSTRY],
      [DRAFT_INDUSTRY, DRAFT_WOMEN, DRAFT_JOBS],
      [DRAFT_JOBS, DRAFT_INDUSTRY, DRAFT_WOMEN],
    ];
    const results = orders.map((drafts) =>
      selectNewsBites(drafts, FETCHED_BY_URL).map((bite) => bite.url),
    );
    assert.deepStrictEqual(results[1], results[0], "permutation 2 matches permutation 1");
    assert.deepStrictEqual(results[2], results[0], "permutation 3 matches permutation 1");
  });

  await check("an undated item sorts to the end of its tier, not the front", () => {
    // Both are tier 1 (the SEEK report's title matches "Employment"); the SEEK
    // report ships without a publication instant, and no date is not evidence
    // of freshness.
    const bites = selectNewsBites([DRAFT_SEEK, DRAFT_JOBS], FETCHED_WITH_SEEK);
    assert.deepStrictEqual(
      bites.map((bite) => bite.url),
      [DRAFT_JOBS.url, SEEK_URL],
    );
  });

  await check("the mix rule still decides membership, and spares still come last", () => {
    // The near-duplicate is a second IT Brief women item. It is kept — a
    // monotonous news month should still get three items — but it must never
    // sort above a differently-angled story just because its tier is lower.
    const bites = selectNewsBites(
      [DRAFT_WOMEN_TWO, DRAFT_WOMEN, DRAFT_JOBS],
      FETCHED_BY_URL,
    );
    assert.deepStrictEqual(
      bites.map((bite) => bite.url),
      [DRAFT_WOMEN.url, DRAFT_JOBS.url, DRAFT_WOMEN_TWO.url],
    );
  });

  await check("which of two same-angle items is preferred does not depend on draft order", () => {
    // Both are IT Brief women items, so they compete for one slot in the mix.
    // Before the partition was ranked, whichever the model happened to list
    // first led the section — the same variance as the sort, one step earlier.
    const orders = [
      [DRAFT_WOMEN_TWO, DRAFT_WOMEN, DRAFT_JOBS],
      [DRAFT_WOMEN, DRAFT_WOMEN_TWO, DRAFT_JOBS],
      [DRAFT_JOBS, DRAFT_WOMEN_TWO, DRAFT_WOMEN],
    ];
    for (const drafts of orders) {
      assert.deepStrictEqual(
        selectNewsBites(drafts, FETCHED_BY_URL).map((bite) => bite.url),
        [DRAFT_WOMEN.url, DRAFT_JOBS.url, DRAFT_WOMEN_TWO.url],
        "the more recent women item leads whichever order it arrived in",
      );
    }
  });

  // 8d. The model is pinned, and says so.
  console.log("8d. Model pinning:");

  await check("OPENAI_MODEL is ignored here, loudly", () => {
    const before = process.env.OPENAI_MODEL;
    try {
      process.env.OPENAI_MODEL = "gpt-4.1-mini";
      const { model, notes } = pulseModel();
      assert.strictEqual(model, PULSE_MODEL, "the shared override does not change the Pulse");
      assert.ok(
        notes.some((note) => note.includes("IGNORED")),
        "and the operator is told, rather than left to wonder",
      );
    } finally {
      if (before === undefined) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = before;
    }
  });

  await check("PULSE_OPENAI_MODEL is the deliberate, this-call-only escape hatch", () => {
    const before = process.env.PULSE_OPENAI_MODEL;
    try {
      process.env.PULSE_OPENAI_MODEL = "gpt-4.1";
      const { model, notes } = pulseModel();
      assert.strictEqual(model, "gpt-4.1");
      assert.ok(notes.some((note) => note.includes("overrides the pin")), "and it is reported");
    } finally {
      if (before === undefined) delete process.env.PULSE_OPENAI_MODEL;
      else process.env.PULSE_OPENAI_MODEL = before;
    }
  });

  await check("with no override, the pinned model is used and nothing is warned about", () => {
    const beforeShared = process.env.OPENAI_MODEL;
    const beforeOwn = process.env.PULSE_OPENAI_MODEL;
    try {
      delete process.env.OPENAI_MODEL;
      delete process.env.PULSE_OPENAI_MODEL;
      const { model, notes } = pulseModel();
      assert.strictEqual(model, PULSE_MODEL);
      assert.deepStrictEqual(notes, []);
    } finally {
      if (beforeShared !== undefined) process.env.OPENAI_MODEL = beforeShared;
      if (beforeOwn !== undefined) process.env.PULSE_OPENAI_MODEL = beforeOwn;
    }
  });

  // 8e. The preflight tells an operator what they are about to get.
  console.log("8e. Preflight:");

  await check("a missing API key is called out, with what happens instead", () => {
    const before = process.env.OPENAI_API_KEY;
    try {
      delete process.env.OPENAI_API_KEY;
      const text = pulsePreflightLines().join("\n");
      assert.ok(text.includes("OPENAI_API_KEY: MISSING"), "the key is reported as missing");
      assert.ok(text.includes("EVERGREEN"), "and the consequence is spelled out");
    } finally {
      if (before === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = before;
    }
  });

  await check("every configured feed is listed", () => {
    const text = pulsePreflightLines().join("\n");
    for (const feed of PULSE_RSS_FEEDS) {
      assert.ok(text.includes(feed.url), `${feed.source} is listed`);
    }
    assert.ok(text.includes("hcamag.com"), "the HRD sitemap leg is listed too");
    assert.ok(text.includes("seek"), "and the SEEK report");
  });

  await check("the key itself is never printed", () => {
    const before = process.env.OPENAI_API_KEY;
    try {
      process.env.OPENAI_API_KEY = "sk-do-not-print-me";
      assert.ok(!pulsePreflightLines().join("\n").includes("sk-do-not-print-me"));
    } finally {
      if (before === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = before;
    }
  });

  console.log(`\nAll ${passed} checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
