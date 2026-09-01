/**
 * Checks for the placement → consent-sentence mapping.
 *
 * Run: `npx tsx lib/newsletter/placements.test.ts`
 *
 * `consentSourceForPlacement()` decides what
 * `newsletter_subscribers.consent_source` says, and that column is the sentence
 * She Sharp would have to stand behind if a recipient asked why they were
 * mailed. It is the kind of string that reads like copy and gets "tidied" —
 * so the properties that make it an audit record are asserted here rather than
 * left to a reviewer to notice.
 *
 * No database and no network: the function is pure, which is the whole reason
 * the rule lives in a function instead of inline in the route.
 */

import assert from "node:assert";

import {
  NEWSLETTER_PLACEMENTS,
  consentSourceForPlacement,
  type NewsletterPlacement,
} from "./placements";

/** The exact string the route wrote before placements existed. */
const ORIGINAL = "Website newsletter subscribe form";

let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL - ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

check("a request naming no placement gets the original sentence verbatim", () => {
  // Every row already on the list with source = 'website-form' carries this
  // string. A cached older bundle still POSTs without a placement, and its row
  // must be indistinguishable from the ones written before this file existed.
  assert.strictEqual(consentSourceForPlacement(), ORIGINAL);
  assert.strictEqual(consentSourceForPlacement(undefined), ORIGINAL);
});

check("the dedicated sign-up page keeps the original sentence too", () => {
  // `newsletter-page` IS the form the original string was written for. Giving
  // it new wording would split one form's history across two sentences for no
  // reason anybody reading the column later could reconstruct.
  assert.strictEqual(consentSourceForPlacement("newsletter-page"), ORIGINAL);
});

check("every placement has a non-empty sentence", () => {
  for (const placement of NEWSLETTER_PLACEMENTS) {
    const sentence = consentSourceForPlacement(placement);
    assert.ok(
      typeof sentence === "string" && sentence.trim().length > 0,
      `${placement} has no consent sentence`
    );
  }
});

check("no two placements share a sentence", () => {
  // Two placements with the same wording make the column unable to answer the
  // question it exists for. `newsletter-page` is the deliberate alias of the
  // no-placement default, and that is a value, not a second placement.
  const seen = new Map<string, NewsletterPlacement>();
  for (const placement of NEWSLETTER_PLACEMENTS) {
    const sentence = consentSourceForPlacement(placement);
    const other = seen.get(sentence);
    assert.ok(
      other === undefined,
      `${placement} and ${other} both write "${sentence}"`
    );
    seen.set(sentence, placement);
  }
});

check("every sentence names the act, not just the place", () => {
  // A consent record reading only "site footer" invites a later reader to
  // guess. Each one has to say a person used a sign-up form on the website,
  // because that — not the surface — is what they actually did.
  for (const placement of NEWSLETTER_PLACEMENTS) {
    const sentence = consentSourceForPlacement(placement);
    assert.ok(
      /^Website newsletter s(ubscribe|ignup) form/.test(sentence),
      `${placement} writes "${sentence}", which does not name the act`
    );
  }
});

check("no sentence claims something the visitor did not do", () => {
  // The feedback placement is the trap. Somebody reaches that form from the
  // post-event feedback confirmation, and the sentence must say they used a
  // sign-up form on that page — never that giving feedback, registering,
  // donating or attending was itself the opt-in. See consent-rules.md.
  const forbidden = /\b(attend|registrat|register|donat|ticket|imported|purchas)/i;
  for (const placement of NEWSLETTER_PLACEMENTS) {
    const sentence = consentSourceForPlacement(placement);
    assert.ok(
      !forbidden.test(sentence),
      `${placement} writes "${sentence}", which implies an act that is not consent`
    );
  }
});

check("the placement list is what the API validates against", () => {
  // The zod enum in `app/api/newsletter/subscribe/route.ts` is built from this
  // array, so a placement added to the type but missing here would be accepted
  // by the route and then have no sentence to write.
  assert.ok(NEWSLETTER_PLACEMENTS.length > 0);
  assert.strictEqual(
    new Set<string>(NEWSLETTER_PLACEMENTS).size,
    NEWSLETTER_PLACEMENTS.length,
    "the placement list has a duplicate member"
  );
});

if (failures > 0) {
  console.error(`\n${failures} placement check(s) failed.`);
  process.exit(1);
}

console.log("\nAll placement checks passed.");
