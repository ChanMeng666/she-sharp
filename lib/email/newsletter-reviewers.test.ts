/**
 * Checks for the newsletter review-round roster.
 *
 * Run: `npx tsx lib/email/newsletter-reviewers.test.ts`
 *
 * Two properties are worth this much attention, and both have already failed in
 * this project in some form.
 *
 * The first is that a reviewer's mailbox must EXIST. Seven addresses the site
 * published for a year had never been created in Workspace, and the mistake was
 * invisible because sending *as* a non-existent address works fine — Resend
 * signs at the domain. A review round posted to a mailbox that hard-bounces
 * looks, from the sender's side, exactly like a review round that worked. So
 * every roster entry is cross-checked against `OWN_MAILBOXES`, which carries
 * the verdict of the 2026-08-23 delivery probe.
 *
 * The second is that an incomplete roster must REFUSE rather than shrink. The
 * roster deliberately names only the founder today, so a fallback of "use
 * whoever is on the list" would send a round billed as a joint staff review to
 * one person and report success. That is the shape of the two guards this repo
 * found on 2026-08-30 that had passed all year while gating nothing, so the
 * refusal is asserted here by handing the function the input it must refuse.
 */

import assert from "node:assert";

import { OWN_MAILBOXES } from "../../scripts/email/own-mailboxes";
import {
  founderEntry,
  NEWSLETTER_REVIEWERS,
  requireReviewRoundRecipients,
  reviewerAddress,
  reviewRoundEntries,
  RosterIncompleteError,
  rosterIsComplete,
  type NewsletterReviewer,
} from "./newsletter-reviewers";

let failures = 0;

/**
 * Runs one named check.
 *
 * @param name What is being asserted.
 * @param fn The assertion body.
 */
function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL - ${name}`);
    console.error(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

const missingLocals = new Set(
  OWN_MAILBOXES.filter((m) => m.expected === "missing").map((m) => m.local)
);
const knownLocals = new Set(OWN_MAILBOXES.map((m) => m.local));

check("every reviewer's mailbox is one the delivery probe found", () => {
  const bad = NEWSLETTER_REVIEWERS.filter((r) => missingLocals.has(r.local));
  assert.deepStrictEqual(
    bad.map((r) => r.local),
    [],
    "These local parts are marked `expected: \"missing\"` in scripts/email/own-mailboxes.ts. " +
      "They do not exist and hard-bounce, so mail to them is not a review — remove them."
  );
});

check("every reviewer's mailbox is recorded in OWN_MAILBOXES at all", () => {
  const unknown = NEWSLETTER_REVIEWERS.filter((r) => !knownLocals.has(r.local));
  assert.deepStrictEqual(
    unknown.map((r) => r.local),
    [],
    "An address that is not in OWN_MAILBOXES has never been probed, so nobody knows " +
      "whether it accepts mail. Add it there (and probe it) before adding it here."
  );
});

check("the roster names exactly one founder", () => {
  const founder = founderEntry();
  assert.strictEqual(founder.local, "mahsa");
  assert.strictEqual(founder.reviewer, true, "the founder must be on the review round");
});

check("no duplicate local parts", () => {
  const locals = NEWSLETTER_REVIEWERS.map((r) => r.local);
  assert.strictEqual(
    new Set(locals).size,
    locals.length,
    "A duplicated entry would mail one person twice and inflate the reviewer count."
  );
});

check("reviewerAddress builds on the one domain the organisation owns", () => {
  assert.strictEqual(reviewerAddress(founderEntry()), "mahsa@shesharp.org.nz");
});

check("founderEntry refuses a roster with no founder", () => {
  assert.throws(
    () => founderEntry([{ local: "x", role: "newsletter", reviewer: true, note: "" }]),
    /exactly one founder/
  );
});

check("founderEntry refuses a roster with two founders", () => {
  const two: NewsletterReviewer[] = [
    { local: "a", role: "founder", reviewer: true, note: "" },
    { local: "b", role: "founder", reviewer: true, note: "" },
  ];
  assert.throws(() => founderEntry(two), /found 2/);
});

// --- The refusal this file exists for ---------------------------------------

check("the roster is currently incomplete, and says so", () => {
  assert.strictEqual(
    rosterIsComplete(),
    false,
    "If this now passes, the maintainer has supplied the reviewers — good. Update " +
      "this assertion and the doc block in newsletter-reviewers.ts, and delete the " +
      "'--reviewers is required' wording from the skill's Step 6b."
  );
  assert.strictEqual(reviewRoundEntries().length, 1);
});

check("an incomplete roster REFUSES to stand in for a review round", () => {
  assert.throws(
    () => requireReviewRoundRecipients(null),
    (error: unknown) => {
      assert.ok(error instanceof RosterIncompleteError, "wrong error type");
      assert.match(error.message, /--reviewers/, "the refusal must say how to fix it");
      return true;
    },
    "With only the founder on the roster this MUST throw. Returning [mahsa@…] would " +
      "silently turn a joint staff review into one mailbox."
  );
});

check("an explicit --reviewers list is accepted, lowercased and deduplicated", () => {
  const out = requireReviewRoundRecipients([" A@X.com ", "b@y.com", "a@x.com"]);
  assert.deepStrictEqual(out, ["a@x.com", "b@y.com"]);
});

check("an empty --reviewers list is refused, not treated as absent", () => {
  assert.throws(() => requireReviewRoundRecipients(["  ", ""]), RosterIncompleteError);
});

check("a complete roster supplies the round itself, founder first", () => {
  const complete: NewsletterReviewer[] = [
    { local: "newsletter-lead", role: "newsletter", reviewer: true, note: "" },
    { local: "mahsa", role: "founder", reviewer: true, note: "" },
    { local: "not-on-the-round", role: "events", reviewer: false, note: "" },
  ];
  assert.strictEqual(rosterIsComplete(complete), true);
  assert.deepStrictEqual(requireReviewRoundRecipients(null, complete), [
    "mahsa@shesharp.org.nz",
    "newsletter-lead@shesharp.org.nz",
  ]);
});

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("Reviewer roster is consistent with the mailboxes that exist.");
