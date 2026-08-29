/**
 * Runnable checks for the no-AI editorial stub.
 *
 * These assertions moved here from `generate.test.ts` when the AI drafting pass
 * was deleted: the stub outlived the generator and is now the starting point
 * `scripts/newsletter/new-issue.ts` writes, so it is the thing that has to stay
 * schema-valid.
 *
 * No network calls are made. Run with:
 *   npx tsx lib/newsletter/editorial-stub.test.ts
 */

import assert from "node:assert";

import { assembleAutoData } from "./assemble";
import { emptyEditorialStub } from "./editorial-stub";
import { editorialSchema } from "./schema";

let passed = 0;
function check(label: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ok - ${label}`);
}

const auto = assembleAutoData(2026, 7);

console.log("1. emptyEditorialStub:");

check("output parses against editorialSchema", () => {
  editorialSchema.parse(emptyEditorialStub(auto));
});

check("primaryCta points at the first upcoming event", () => {
  const stub = emptyEditorialStub(auto);
  const first = auto.upcomingEvents[0];
  assert.ok(first, "fixture should have an upcoming event");
  assert.strictEqual(
    stub.primaryCta.href,
    first.registrationUrl ?? first.url,
    "CTA href must be the first upcoming event's registration/page URL"
  );
});

check("photoOfTheMonth is null (a human picks it)", () => {
  assert.strictEqual(emptyEditorialStub(auto).photoOfTheMonth, null);
});

check("headline is null (promotion is a human curation call)", () => {
  assert.strictEqual(emptyEditorialStub(auto).headline, null);
});

check("the three opportunity hrefs are the canonical ones, in order", () => {
  const stub = emptyEditorialStub(auto);
  assert.deepStrictEqual(
    stub.opportunities.map((o) => o.href),
    [
      "https://www.shesharp.org.nz/mentorship/mentor",
      "https://www.shesharp.org.nz/join-our-team",
      "https://www.shesharp.org.nz/donate",
    ]
  );
});

check("a stray legacy spotlight key still parses and is dropped", () => {
  // Old fixtures carry `spotlight` — editorialSchema is not .strict(), so it
  // must parse and silently strip the removed field.
  const withStray = {
    ...emptyEditorialStub(auto),
    spotlight: { name: "Legacy Person", role: "Mentee" },
  };
  const parsed = editorialSchema.parse(withStray);
  assert.ok(!("spotlight" in parsed), "stray spotlight key must be stripped, not retained");
});

check("pulse is populated from the evergreen pool (no live calls)", () => {
  // Every month index yields a schema-valid, evergreen (newsBite === null) pulse.
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const stub = emptyEditorialStub(auto, monthIndex);
    assert.ok(stub.pulse, `pulse should be present for month ${monthIndex}`);
    assert.strictEqual(stub.pulse.newsBite, null, "evergreen pulse has no news bite");
    assert.ok(stub.pulse.heroStat.value.length > 0, "hero stat has a value");
    editorialSchema.parse(stub);
  }
});

check("one event blurb per recap event, keyed by slug", () => {
  const stub = emptyEditorialStub(auto);
  assert.strictEqual(Object.keys(stub.eventBlurbs).length, auto.recapEvents.length);
  for (const event of auto.recapEvents) {
    assert.ok(stub.eventBlurbs[event.slug], `missing blurb for ${event.slug}`);
  }
});

console.log(`\nAll ${passed} checks passed.`);
