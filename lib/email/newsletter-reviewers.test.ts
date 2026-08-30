/**
 * Checks for the newsletter review-round roster and its local address file.
 *
 * Run: `npx tsx lib/email/newsletter-reviewers.test.ts`
 *
 * The roster is split: names and roles are committed here, addresses live in a
 * gitignored `reviewers.local.json`. That split creates one new way to get it
 * wrong — a local file that has fallen behind the committed roster — and one
 * property this file exists to prove, in line with CLAUDE.md's rule that a
 * guard is not verified until you have broken the thing it guards:
 *
 *   A committed reviewer with no address must make the round REFUSE, by name.
 *
 * Silently dropping them would look exactly like a round that reached
 * everybody, and the person most likely to be missing from a stale local file
 * is the founder — whose approval is the next stage of the chain.
 *
 * The second property is the `OWN_MAILBOXES` cross-check and, just as
 * important, its LIMIT. Seven `@shesharp.org.nz` addresses this project
 * published for a year had never been created, and sending *as* a non-existent
 * address works fine, so a dead on-domain reviewer is invisible from the
 * sender's side. But that registry only knows She Sharp's own mailboxes, and
 * most reviewers hold personal off-domain ones — so the check must apply to
 * on-domain addresses and must NOT apply to the rest. Both halves are asserted;
 * a check that rejected every Gmail would pass a naive test just as happily.
 *
 * No real address appears in this file. Fixtures use `example.com` /
 * `example.edu`, and the on-domain fixtures reuse local parts already recorded
 * in `OWN_MAILBOXES`.
 */

import assert from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { OWN_MAILBOXES } from "../../scripts/email/own-mailboxes";
import {
  assertAddressUsable,
  defaultReviewRound,
  founderEntry,
  loadReviewerAddresses,
  NEWSLETTER_REVIEWERS,
  resolveRequestedRound,
  resolveReviewRound,
  ReviewerAddressError,
  type Reviewer,
  type ReviewerAddressBook,
} from "./newsletter-reviewers";

/** Repo root, resolved from this file so the run is cwd-independent. */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

const dir = mkdtempSync(join(tmpdir(), "she-sharp-reviewers-test-"));

/** A two-person roster: the founder plus one newsletter reviewer. */
const ROSTER: Reviewer[] = [
  { id: "founder-x", name: "A Founder", role: "founder", newsletterReviewer: true, note: "" },
  { id: "news-y", name: "A Newsletter Person", role: "newsletter", newsletterReviewer: true, note: "" },
  { id: "mkt-z", name: "A Marketing Person", role: "marketing", newsletterReviewer: false, note: "" },
];

const book = (addresses: Record<string, string[]>): ReviewerAddressBook => ({
  version: 1,
  addresses,
});

const FULL = book({
  "founder-x": ["founder@example.com", "founder@example.edu"],
  "news-y": ["news@example.com"],
});

// ---------------------------------------------------------------------------
// The committed half
// ---------------------------------------------------------------------------

check("the roster names exactly one founder", () => {
  const founder = founderEntry();
  assert.strictEqual(founder.id, "mahsa");
  assert.strictEqual(founder.newsletterReviewer, true, "the founder must be on the round");
});

check("no committed roster entry carries an email address", () => {
  // The whole point of the split. A `@` anywhere in the committed roster means
  // somebody has put an address back where it cannot be removed.
  const serialised = JSON.stringify(NEWSLETTER_REVIEWERS);
  assert.ok(!serialised.includes("@"), `an address leaked into the committed roster: ${serialised}`);
});

check("no duplicate reviewer ids", () => {
  const ids = NEWSLETTER_REVIEWERS.map((r) => r.id);
  assert.strictEqual(
    new Set(ids).size,
    ids.length,
    "ids key the local address files on every machine; a duplicate silently merges two people"
  );
});

check("the REAL roster's default round is 4 people: the founder + the newsletter team", () => {
  const round = defaultReviewRound();
  assert.deepStrictEqual(
    round.map((r) => r.id),
    ["mahsa", "lesley", "tharaneetharan", "chan"],
    "founder first, then the newsletter team"
  );
  assert.deepStrictEqual(
    round.map((r) => r.role),
    ["founder", "newsletter", "newsletter", "newsletter"]
  );
});

check("marketing and events are on the roster but NOT on the round", () => {
  const off = NEWSLETTER_REVIEWERS.filter((r) => !r.newsletterReviewer);
  assert.deepStrictEqual(
    off.map((r) => r.id).sort(),
    ["len", "marriane", "nikita", "sara"],
    "recorded so a future marketing or events send needs no code change"
  );
  // Named explicitly because she holds two addresses and is a Marketing Lead,
  // which is exactly the shape somebody would mistake for a reviewer.
  const sara = NEWSLETTER_REVIEWERS.find((r) => r.id === "sara");
  assert.strictEqual(sara?.newsletterReviewer, false, "Sara Ghafoor is deliberately off the round");
});

check("every reviewer's name matches lib/data/team.ts exactly", () => {
  // team.ts is the spelling authority. A roster name that drifts from it is a
  // person misnamed in an internal record, and nothing else would catch it.
  const teamSource = readFileSync(join(REPO_ROOT, "lib", "data", "team.ts"), "utf8");
  for (const reviewer of NEWSLETTER_REVIEWERS) {
    assert.ok(
      teamSource.includes(`name: "${reviewer.name}"`),
      `"${reviewer.name}" does not appear in lib/data/team.ts — check the spelling there`
    );
  }
});

check("the default round is the founder plus the newsletter team, founder first", () => {
  const round = defaultReviewRound(ROSTER);
  assert.deepStrictEqual(
    round.map((r) => r.id),
    ["founder-x", "news-y"],
    "marketing and events are on the roster but not on the default round"
  );
});

check("founderEntry refuses a roster with no founder, or two", () => {
  assert.throws(
    () => founderEntry([{ id: "x", name: "X", role: "newsletter", newsletterReviewer: true, note: "" }]),
    /exactly one founder/
  );
  assert.throws(
    () =>
      founderEntry([
        { id: "a", name: "A", role: "founder", newsletterReviewer: true, note: "" },
        { id: "b", name: "B", role: "founder", newsletterReviewer: true, note: "" },
      ]),
    /found 2/
  );
});

// ---------------------------------------------------------------------------
// BREAK: a stale local file
// ---------------------------------------------------------------------------

check("BREAK: a committed reviewer with no address makes the round refuse, BY NAME", () => {
  const stale = book({ "founder-x": ["founder@example.com"] });
  assert.throws(
    () => resolveReviewRound(stale, ROSTER),
    (error: unknown) => {
      assert.ok(error instanceof ReviewerAddressError, "wrong error type");
      assert.match(error.message, /news-y/, "the refusal must name the id");
      assert.match(error.message, /A Newsletter Person/, "the refusal must name the person");
      assert.match(error.message, /Refusing to send a partial round/);
      return true;
    }
  );
});

check("BREAK: the FOUNDER missing from the local file is refused, not skipped", () => {
  // The specific omission nobody would notice: her approval is the next stage,
  // so a round that quietly excluded her would still get "approved".
  const noFounder = book({ "news-y": ["news@example.com"] });
  assert.throws(
    () => resolveReviewRound(noFounder, ROSTER),
    (error: unknown) => {
      assert.ok(error instanceof ReviewerAddressError);
      assert.match(error.message, /A Founder/);
      return true;
    }
  );
});

check("BREAK: an entry present but empty counts as no address", () => {
  const empty = book({ "founder-x": ["founder@example.com"], "news-y": [] });
  assert.throws(() => resolveReviewRound(empty, ROSTER), /news-y/);
});

check("BREAK: a missing local file refuses rather than falling back", () => {
  assert.throws(
    () => loadReviewerAddresses(join(dir, "does-not-exist.json")),
    (error: unknown) => {
      assert.ok(error instanceof ReviewerAddressError);
      assert.match(error.message, /No reviewer address file/);
      assert.match(error.message, /gitignored/, "it must say not to commit the file it asks for");
      return true;
    }
  );
  // And the same through the top-level entry point: no explicit list, no file.
  assert.throws(
    () => resolveRequestedRound(null, null, ROSTER),
    ReviewerAddressError,
    "with no --reviewers and no readable address file this must refuse, never send to a subset"
  );
});

check("BREAK: a corrupt local file refuses", () => {
  const path = join(dir, "corrupt.json");
  writeFileSync(path, "{ not json");
  assert.throws(() => loadReviewerAddresses(path), /not valid JSON/);

  const wrongShape = join(dir, "wrong-shape.json");
  writeFileSync(wrongShape, JSON.stringify({ version: 1, reviewers: {} }));
  assert.throws(() => loadReviewerAddresses(wrongShape), /"addresses" object/);
});

// ---------------------------------------------------------------------------
// The OWN_MAILBOXES cross-check, and its limit
// ---------------------------------------------------------------------------

const retired = OWN_MAILBOXES.filter((m) => m.expected === "missing").map((m) => m.local);

check("BREAK: an on-domain address the probe found MISSING is refused", () => {
  assert.ok(retired.length > 0, "the registry should still record the retired mailboxes");
  const dead = `${retired[0]}@shesharp.org.nz`;
  assert.throws(
    () => assertAddressUsable(dead, "someone"),
    (error: unknown) => {
      assert.ok(error instanceof ReviewerAddressError);
      assert.match(error.message, /does not exist and hard-bounces/);
      return true;
    }
  );
  // …and through the resolver, not just the helper.
  assert.throws(
    () => resolveReviewRound(book({ "founder-x": [dead], "news-y": ["news@example.com"] }), ROSTER),
    /hard-bounces/
  );
});

check("BREAK: an on-domain address absent from OWN_MAILBOXES entirely is refused", () => {
  assert.throws(
    () => assertAddressUsable("never-probed@shesharp.org.nz", "someone"),
    /not recorded in OWN_MAILBOXES/
  );
});

check("an on-domain address the probe found is accepted", () => {
  assertAddressUsable("mahsa@shesharp.org.nz", "the founder");
});

check("THE LIMIT: an off-domain address is accepted WITHOUT an OWN_MAILBOXES lookup", () => {
  // If this ever starts throwing, the cross-check has been widened to addresses
  // it cannot speak about, and every real reviewer — who holds a personal
  // Gmail, Hotmail or university address — would be rejected.
  for (const address of [
    "someone@gmail.com",
    "someone@hotmail.com",
    "someone@aut.ac.nz",
    // A local part that is retired on OUR domain must still be fine elsewhere:
    // the registry speaks about one domain, and this address is not on it.
    `${retired[0]}@example.com`,
  ]) {
    assert.doesNotThrow(() => assertAddressUsable(address, "a reviewer"), `rejected ${address}`);
  }
});

check("a malformed address is refused whatever the domain", () => {
  assert.throws(() => assertAddressUsable("not-an-address", "someone"), /not a valid email address/);
});

// ---------------------------------------------------------------------------
// A resolved round
// ---------------------------------------------------------------------------

check("a complete round resolves, founder first, with people and addresses separate", () => {
  const round = resolveReviewRound(FULL, ROSTER);
  assert.strictEqual(round.peopleCount, 2, "two PEOPLE");
  assert.strictEqual(round.addresses.length, 3, "three ADDRESSES — the founder holds two");
  assert.deepStrictEqual(round.addresses, [
    "founder@example.com",
    "founder@example.edu",
    "news@example.com",
  ]);
  assert.deepStrictEqual(
    round.people.map((p) => p.reviewer.id),
    ["founder-x", "news-y"]
  );
});

check("one person with two addresses is one person, not two", () => {
  // The reason the type maps a person to a LIST: the founder holding an
  // organisational and an academic mailbox must not read as two reviewers.
  const round = resolveReviewRound(FULL, ROSTER);
  assert.notStrictEqual(
    round.peopleCount,
    round.addresses.length,
    "this fixture exists precisely so the two counts differ"
  );
});

check("addresses are deduplicated and lowercased on load", () => {
  const path = join(dir, "dupes.json");
  writeFileSync(
    path,
    JSON.stringify({
      version: 1,
      addresses: {
        "founder-x": [" Founder@Example.COM ", "founder@example.com"],
        "news-y": ["news@example.com"],
      },
    })
  );
  const loaded = loadReviewerAddresses(path);
  const round = resolveReviewRound(loaded, ROSTER);
  assert.deepStrictEqual(round.addresses, ["founder@example.com", "news@example.com"]);
});

check("an explicit --reviewers list is still checked against OWN_MAILBOXES on-domain", () => {
  const dead = `${retired[0]}@shesharp.org.nz`;
  assert.throws(() => resolveRequestedRound([dead], null, ROSTER), /hard-bounces/);
  const ok = resolveRequestedRound([" A@Example.com ", "b@example.com", "a@example.com"], null, ROSTER);
  assert.deepStrictEqual(ok.addresses, ["a@example.com", "b@example.com"]);
  assert.strictEqual(ok.peopleCount, 2);
});

check("an empty --reviewers list is refused, not treated as absent", () => {
  assert.throws(() => resolveRequestedRound(["  ", ""], null, ROSTER), ReviewerAddressError);
});

check("BREAK: a round that resolves to the founder ALONE is refused", () => {
  // Not a joint review — it shows the issue to nobody but the person whose
  // approval is the next stage. This is the state the committed roster is in
  // today, so it is also the state the August issue will hit first.
  const onlyFounder: Reviewer[] = [
    { id: "founder-x", name: "A Founder", role: "founder", newsletterReviewer: true, note: "" },
  ];
  assert.throws(
    () => resolveReviewRound(book({ "founder-x": ["founder@example.com"] }), onlyFounder),
    (error: unknown) => {
      assert.ok(error instanceof ReviewerAddressError);
      assert.match(error.message, /not a joint review/);
      assert.match(error.message, /--reviewers/, "the refusal must say how to proceed");
      return true;
    }
  );
  // The real roster is no longer in that state — the newsletter team's names
  // landed on 2026-08-30 — but a local file holding only the founder still is,
  // because the other three are then unaddressed rather than absent.
  assert.throws(
    () => resolveReviewRound(book({ mahsa: ["mahsa@shesharp.org.nz"] })),
    /Refusing to send a partial round/
  );
});

check("a roster with nobody on the round refuses rather than sending to nobody", () => {
  const nobody: Reviewer[] = [
    { id: "a", name: "A", role: "founder", newsletterReviewer: false, note: "" },
  ];
  assert.throws(() => resolveReviewRound(book({}), nobody), /no default review round/);
});

rmSync(dir, { recursive: true, force: true });

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("The reviewer roster refuses every incomplete state it was handed.");
