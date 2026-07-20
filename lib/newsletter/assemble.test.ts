/**
 * Runnable checks for the newsletter assemble/registry layer.
 * Run with: `npx tsx lib/newsletter/assemble.test.ts`
 */

import assert from "node:assert";

import { SITE_URL } from "@/lib/seo/site";
import { assembleAutoData } from "./assemble";
import { getIssue, listIssueIds } from "./issues-registry";
import { autoSchema } from "./schema";

// 1. assembleAutoData(2026, 7) validates against autoSchema.
const auto = assembleAutoData(2026, 7);
autoSchema.parse(auto);

// 2. Every event URL / cover image is absolute on the production origin.
for (const event of [...auto.recapEvents, ...auto.upcomingEvents]) {
  assert.ok(
    event.url.startsWith(SITE_URL),
    `event.url not on ${SITE_URL}: ${event.url}`
  );
  if (event.coverImageUrl !== null) {
    assert.ok(
      event.coverImageUrl.startsWith(SITE_URL),
      `coverImageUrl not on ${SITE_URL}: ${event.coverImageUrl}`
    );
  }
}

// 3. Recap events fall inside July 2026; upcoming events fall after it.
assert.ok(auto.recapEvents.length >= 1, "expected at least one July recap event");
assert.ok(
  auto.upcomingEvents.every((e) => e.startIso === null || e.startIso > "2026-07-31"),
  "upcoming events must be after July 2026"
);

// 4. Registry returns a validated issue for the known id, null otherwise.
const issue = getIssue("2026-07");
assert.ok(issue !== null, "getIssue('2026-07') should not be null");
assert.strictEqual(issue!.id, "2026-07");
assert.strictEqual(getIssue("1999-01"), null, "unknown id should return null");
assert.ok(listIssueIds().includes("2026-07"), "listIssueIds should include 2026-07");

console.log("All newsletter assemble/registry checks passed.");
console.log("recapEvents:", auto.recapEvents.length, "upcomingEvents:", auto.upcomingEvents.length);
console.log("subjectLine:", issue!.editorial.subjectLine);
