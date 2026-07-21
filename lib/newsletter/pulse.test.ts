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
  rssRelevanceRank,
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

  // 6. RSS relevance ranks Auckland titles ahead of generic NZ ones.
  console.log("6. rssRelevanceRank:");
  await check("an Auckland title outranks a generic NZ title", () => {
    const auckland = rssRelevanceRank("AUT opens new tech hub in Auckland CBD");
    const generalNz = rssRelevanceRank("New Zealand broadband rollout continues");
    assert.ok(auckland < generalNz, "Auckland item should sort ahead of general NZ");
  });
  await check("tiers order Auckland < topical < general NZ < unrelated", () => {
    assert.strictEqual(rssRelevanceRank("Xero expands its Auckland office"), 0);
    assert.strictEqual(rssRelevanceRank("Women in AI leadership summit"), 1);
    assert.strictEqual(rssRelevanceRank("Aotearoa exports software abroad"), 2);
    assert.strictEqual(rssRelevanceRank("Global chip prices rise again"), 3);
  });

  console.log(`\nAll ${passed} checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
