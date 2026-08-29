/**
 * Runnable checks for the "NZ Tech Pulse" assembly layer.
 * No live network or OpenAI calls are made.
 * Run with: `npx tsx lib/newsletter/pulse.test.ts`
 */

import assert from "node:assert";

import {
  assertNumbersVerbatim,
  buildPulse,
  evergreenPulse,
  extractNumberTokens,
  feedPageUrl,
  normaliseHeadline,
  PULSE_RSS_FEEDS,
  rssRelevanceRank,
  selectNewsBites,
  type PulseSourceData,
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

  console.log(`\nAll ${passed} checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
