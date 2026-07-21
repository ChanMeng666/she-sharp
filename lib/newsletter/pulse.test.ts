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
  type PulseSourceData,
} from "./pulse";
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

  console.log(`\nAll ${passed} checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
