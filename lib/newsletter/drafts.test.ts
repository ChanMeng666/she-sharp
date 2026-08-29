/**
 * Runnable checks for the issue lifecycle-status store.
 *
 * Only the graceful-degradation contract is asserted, because that is the part
 * a caller relies on and the part no other test covers: `drafts.ts` must return
 * false/null rather than throw when Upstash is unconfigured, so a local session
 * with no Redis can still run the approve path end to end.
 *
 * The draft-staging half of this file's coverage (`saveDraft`/`getDraft`/
 * `hasDraft`) was deleted with those functions when the newsletter stopped
 * being generated in the cloud.
 *
 * Run with: `npx tsx lib/newsletter/drafts.test.ts`
 */

import assert from "node:assert";

import { getStatus, markStatus } from "./drafts";

let passed = 0;
async function check(label: string, fn: () => Promise<void>): Promise<void> {
  await fn();
  passed++;
  console.log(`  ok - ${label}`);
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
  console.log("1. drafts.ts degradation (no Redis):");

  if (redisConfigured()) {
    console.log("  skip - real Upstash env present; not exercising degradation path");
  } else {
    await check("markStatus returns false without Redis", async () => {
      assert.strictEqual(await markStatus("2026-07", { status: "approved" }), false);
    });
    await check("getStatus returns null without Redis", async () => {
      assert.strictEqual(await getStatus("2026-07"), null);
    });
  }

  console.log(`\nAll ${passed} checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
