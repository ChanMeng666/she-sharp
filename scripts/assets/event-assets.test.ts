/**
 * Adversarial tests for event asset ownership.
 *
 * `resolveOwner()` decides which event a file belongs to, and the whole
 * per-event-folder migration is generated from its answers. A wrong answer here
 * does not fail loudly — it silently files a photo under the wrong event, and
 * the CI gate still passes because the path resolves.
 *
 * The cases below are drawn from the six real slug-prefix collisions in the
 * merged event list, not from invented examples. `her-waka` is a proper prefix
 * of three dated siblings, and `she-storytellers-series` of
 * `she-storytellers-series-2-0` which has its own archive folder on disk.
 *
 * Run: npx tsx scripts/assets/event-assets.test.ts
 */

import assert from "node:assert";
import { resolveOwner, plannedPath, eventSlugs } from "./event-assets";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

function owner(p: string): string | null {
  return resolveOwner(p)?.slug ?? null;
}
function rest(p: string): string | null {
  return resolveOwner(p)?.rest ?? null;
}

check("the merged event list is the slug source", () => {
  const slugs = eventSlugs();
  assert.ok(slugs.length >= 97, `expected >= 97 slugs, got ${slugs.length}`);
  assert.equal(new Set(slugs).size, slugs.length, "slugs must be unique");
  assert.ok(slugs.includes("her-waka"));
  assert.ok(slugs.includes("her-waka-june-2026"));
});

// --- longest-prefix matching, all six real collisions -----------------------

check("her-waka does not shadow its dated siblings", () => {
  assert.equal(owner("/img/events/her-waka-june-2026-cover.webp"), "her-waka-june-2026");
  assert.equal(owner("/img/events/her-waka-may-2026-paula-gair.jpg"), "her-waka-may-2026");
  assert.equal(owner("/img/events/her-waka-april-2026-chan-meng.png"), "her-waka-april-2026");
});

check("bare her-waka files still resolve to her-waka", () => {
  assert.equal(owner("/img/events/her-waka-chan-meng.webp"), "her-waka");
  assert.equal(owner("/img/events/her-waka-cover.webp"), "her-waka");
  assert.equal(owner("/img/events/her-waka-abe-naus.jpg"), "her-waka");
});

check("she-storytellers-series does not shadow series-2-0", () => {
  assert.equal(owner("/img/events/archive/she-storytellers-series-2-0/1.webp"), "she-storytellers-series-2-0");
});

check("ai-for-the-environment-hackathon-festival does not shadow the 2024 edition", () => {
  assert.equal(owner("/img/events/ai-for-the-environment-hackathon-festival-2024-x.jpg"),
    "ai-for-the-environment-hackathon-festival-2024");
});

check("she-sharp-techweek does not shadow envision-the-future", () => {
  assert.equal(owner("/img/events/she-sharp-techweek-envision-the-future-cover.webp"),
    "she-sharp-techweek-envision-the-future");
});

// --- the three aliases ------------------------------------------------------

check("iwd-2026 alias resolves to the 53-character slug", () => {
  assert.equal(owner("/img/events/iwd-2026-banner.webp"),
    "she-sharp-and-academyex-international-womens-day-2026");
  assert.equal(rest("/img/events/iwd-2026-ana-ivanovic-tongue.jpg"), "ana-ivanovic-tongue.jpg");
});

check("the venue-and-date alias resolves to the topic slug", () => {
  assert.equal(owner("/img/events/event-aut-linkedin-15-may-2026-stuart-little.jpg"),
    "making-linkedin-work-for-you-with-stuart-little");
});

check("the 2024 hackathon poster resolves to its event", () => {
  assert.equal(owner("/img/events/ai-hackathon-2024-problems-to-solve-poster.jpg"),
    "ai-for-the-environment-hackathon-festival-2024");
});

// --- both layouts, and the archive special case -----------------------------

check("already-nested paths resolve to the same owner", () => {
  assert.equal(owner("/img/events/her-waka/chan-meng.webp"), "her-waka");
  assert.equal(rest("/img/events/her-waka/chan-meng.webp"), "chan-meng.webp");
});

check("archive/<slug>/N.webp attributes to the slug, not to 'archive'", () => {
  const r = resolveOwner("/img/events/archive/her-waka-june-2026/1.webp");
  assert.equal(r?.slug, "her-waka-june-2026");
  assert.equal(r?.rest, "archive/1.webp");
});

check("a long flat name keeps its whole remainder", () => {
  const p = "/img/events/aotearoa-ai-hackathon-festival-2026-team-kpi-kaitiaki-positive-impact.webp";
  assert.equal(owner(p), "aotearoa-ai-hackathon-festival-2026");
  assert.equal(rest(p), "team-kpi-kaitiaki-positive-impact.webp");
});

// --- refusals ---------------------------------------------------------------

check("an unowned file resolves to null rather than guessing", () => {
  assert.equal(resolveOwner("/img/events/no-such-event-cover.webp"), null);
});

check("paths outside /img/events/ are not owned", () => {
  assert.equal(resolveOwner("/img/team/Chan.webp"), null);
  assert.equal(resolveOwner("/img/sponsors/myob.svg"), null);
  assert.equal(resolveOwner("/img/scraped/photos/x.jpg"), null);
});

// --- plannedPath ------------------------------------------------------------

check("plannedPath moves a flat file into its event folder", () => {
  assert.equal(plannedPath("/img/events/her-waka-june-2026-cover.webp"),
    "/img/events/her-waka-june-2026/cover.webp");
  assert.equal(plannedPath("/img/events/iwd-2026-banner.webp"),
    "/img/events/she-sharp-and-academyex-international-womens-day-2026/banner.webp");
});

check("plannedPath re-parents the harvested archive under its event", () => {
  assert.equal(plannedPath("/img/events/archive/her-waka-june-2026/1.webp"),
    "/img/events/her-waka-june-2026/archive/1.webp");
});

check("plannedPath is idempotent — running the migration twice is a no-op", () => {
  for (const p of [
    "/img/events/her-waka-june-2026-cover.webp",
    "/img/events/archive/her-waka-june-2026/1.webp",
    "/img/events/iwd-2026-banner.webp",
    "/img/events/aotearoa-ai-hackathon-festival-2026-photo-1.webp",
  ]) {
    const once = plannedPath(p);
    assert.ok(once, `${p} should plan somewhere`);
    assert.equal(plannedPath(once), once, `not idempotent for ${p}`);
  }
});

console.log(`\n${passed} checks passed.`);
