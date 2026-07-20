/**
 * Runnable checks for the newsletter AI generation + draft-staging layer.
 * No live OpenAI or Redis calls are made.
 * Run with: `npx tsx lib/newsletter/generate.test.ts`
 */

import assert from "node:assert";

import { assembleAutoData } from "./assemble";
import { buildEditorialPrompt, emptyEditorialStub } from "./generate";
import { getIssue } from "./issues-registry";
import { editorialSchema } from "./schema";
import { getDraft, hasDraft, saveDraft } from "./drafts";

let passed = 0;
function check(label: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve(fn()).then(() => {
    passed++;
    console.log(`  ok - ${label}`);
  });
}

/** True when this machine has real Upstash creds (skip degradation asserts then). */
function redisConfigured(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_TOKEN ||
        process.env.UPSTASH_REDIS_REST_TOKEN ||
        process.env.KV_REST_API_TOKEN)
  );
}

async function main(): Promise<void> {
  const auto = assembleAutoData(2026, 7);

  // 1. The no-AI stub is always schema-valid.
  console.log("1. emptyEditorialStub:");
  await check("output parses against editorialSchema", () => {
    editorialSchema.parse(emptyEditorialStub(auto));
  });
  await check("primaryCta points at the first upcoming event", () => {
    const stub = emptyEditorialStub(auto);
    const first = auto.upcomingEvents[0];
    assert.ok(first, "fixture should have an upcoming event");
    assert.strictEqual(
      stub.primaryCta.href,
      first.registrationUrl ?? first.url,
      "CTA href must be the first upcoming event's registration/page URL"
    );
  });
  await check("spotlight and photoOfTheMonth are null", () => {
    const stub = emptyEditorialStub(auto);
    assert.strictEqual(stub.spotlight, null);
    assert.strictEqual(stub.photoOfTheMonth, null);
  });
  await check("one event blurb per recap event, keyed by slug", () => {
    const stub = emptyEditorialStub(auto);
    assert.strictEqual(
      Object.keys(stub.eventBlurbs).length,
      auto.recapEvents.length
    );
    for (const event of auto.recapEvents) {
      assert.ok(stub.eventBlurbs[event.slug], `missing blurb for ${event.slug}`);
    }
  });

  // 2. The prompt builder feeds the model the month and the event titles.
  console.log("2. buildEditorialPrompt:");
  await check("includes the month name and year", () => {
    const prompt = buildEditorialPrompt({ year: 2026, month: 7, auto });
    assert.ok(prompt.includes("July 2026"), "prompt should name the month");
  });
  await check("includes every recap and upcoming event title", () => {
    const prompt = buildEditorialPrompt({ year: 2026, month: 7, auto });
    for (const event of [...auto.recapEvents, ...auto.upcomingEvents]) {
      assert.ok(
        prompt.includes(event.title),
        `prompt should mention event title: ${event.title}`
      );
    }
  });

  // 3. drafts.ts degrades gracefully when Redis is unconfigured.
  console.log("3. drafts.ts degradation (no Redis):");
  if (redisConfigured()) {
    console.log("  skip - real Upstash env present; not exercising degradation path");
  } else {
    const issue = getIssue("2026-07");
    assert.ok(issue, "fixture issue 2026-07 must load");
    await check("saveDraft returns false without Redis", async () => {
      assert.strictEqual(await saveDraft(issue!), false);
    });
    await check("getDraft returns null without Redis", async () => {
      assert.strictEqual(await getDraft("2026-07"), null);
    });
    await check("hasDraft returns false without Redis", async () => {
      assert.strictEqual(await hasDraft("2026-07"), false);
    });
  }

  console.log(`\nAll ${passed} checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
