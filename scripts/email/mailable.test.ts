/**
 * Checks for `selectMailable()` — the rule that decides who a send reaches.
 *
 * Run: `npx tsx scripts/email/mailable.test.ts`
 *
 * Worth testing at this level because both directions of error are silent and
 * expensive. Too strict and someone who legitimately re-subscribed this morning
 * gets a confirmation email, sees "you're on the list", and then never receives
 * anything — invisible from the outside and undetectable without this check.
 * Too loose and a suppressed address is mailed, against an account-wide 0.08%
 * complaint ceiling that takes password resets down with it.
 */

import assert from "node:assert";

import {
  isTerminal,
  selectMailable,
  type CommittedEntry,
  type OptoutRow,
  type SubscriberCandidate,
} from "./mailable";

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

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

/** Builds a subscriber fixture. */
function sub(
  emailHash: string,
  confirmedAt: Date | null,
  email = "person@example.com"
): SubscriberCandidate {
  return { email, firstName: null, lastName: null, emailHash, confirmedAt };
}

/** Builds a runtime opt-out fixture. */
function optout(emailHash: string, reason: string, createdAt: Date): OptoutRow {
  return { emailHash, stream: "all", reason, createdAt };
}

/** Builds a committed-register fixture. */
function entry(hash: string, reason: string, at: string): CommittedEntry {
  return { hash, reason, at };
}

const OLD = new Date("2024-01-01T00:00:00.000Z");
const NEW = new Date("2026-08-01T00:00:00.000Z");

// ---------------------------------------------------------------------------
// The clean cases
// ---------------------------------------------------------------------------

check("a subscriber on neither register is mailable", () => {
  const result = selectMailable([sub(HASH_A, NEW)], [], []);
  assert.strictEqual(result.mailable.length, 1);
  assert.strictEqual(result.excluded.length, 0);
  assert.strictEqual(result.returned.length, 0);
});

check("a runtime opt-out with no later confirmation is excluded", () => {
  const result = selectMailable([sub(HASH_A, OLD)], [optout(HASH_A, "one-click", NEW)], []);
  assert.strictEqual(result.mailable.length, 0);
  assert.strictEqual(result.excluded[0].reason, "one-click");
});

check("a committed-register hit with no later confirmation is excluded", () => {
  const result = selectMailable(
    [sub(HASH_A, OLD)],
    [],
    [entry(HASH_A, "mailchimp-unsubscribed", NEW.toISOString())]
  );
  assert.strictEqual(result.mailable.length, 0);
  assert.strictEqual(result.excluded[0].reason, "mailchimp-unsubscribed");
});

// ---------------------------------------------------------------------------
// Re-subscription — the rule consent-rules.md requires
// ---------------------------------------------------------------------------

check("confirming AFTER an unsubscribe puts them back on the list", () => {
  // "The only way back onto the list is the person themselves, through the
  // website form." If this fails, that route is broken and nothing says so.
  const result = selectMailable([sub(HASH_A, NEW)], [optout(HASH_A, "one-click", OLD)], []);
  assert.strictEqual(result.mailable.length, 1, "the newer deliberate act must win");
  assert.strictEqual(result.returned.length, 1);
  assert.match(result.returned[0].reason, /re-subscribed after one-click/);
});

check("confirming after a Mailchimp-era unsubscribe also counts", () => {
  const result = selectMailable(
    [sub(HASH_A, NEW)],
    [],
    [entry(HASH_A, "mailchimp-unsubscribed", OLD.toISOString())]
  );
  assert.strictEqual(result.mailable.length, 1);
  assert.strictEqual(result.returned.length, 1);
});

check("confirming after a hard bounce counts — they may have fixed the mailbox", () => {
  const result = selectMailable([sub(HASH_A, NEW)], [optout(HASH_A, "bounce", OLD)], []);
  assert.strictEqual(result.mailable.length, 1);
});

check("confirming BEFORE the suppression does not resurrect them", () => {
  const result = selectMailable([sub(HASH_A, OLD)], [optout(HASH_A, "one-click", NEW)], []);
  assert.strictEqual(result.mailable.length, 0, "an older confirmation must not win");
});

check("a row with no confirmation never outranks a suppression", () => {
  // Treating null as "now" would mail the whole Mailchimp suppression list on
  // the first import.
  const result = selectMailable([sub(HASH_A, null)], [optout(HASH_A, "one-click", OLD)], []);
  assert.strictEqual(result.mailable.length, 0);
  assert.strictEqual(result.excluded.length, 1);
});

check("a Mailchimp-era confirmation does not outrank a later suppression", () => {
  // Imported rows DO carry a confirmedAt — every row in the export has a
  // CONFIRM_TIME — so this is the live interaction, not a hypothetical. Someone
  // who confirmed in 2023 and unsubscribed in 2026 must stay off the list; only
  // a confirmation NEWER than the suppression means they came back.
  const confirmed2023 = new Date("2023-05-01T00:00:00.000Z");
  const suppressed2026 = new Date("2026-08-17T00:00:00.000Z");
  const result = selectMailable(
    [sub(HASH_A, confirmed2023)],
    [optout(HASH_A, "one-click", suppressed2026)],
    []
  );
  assert.strictEqual(result.mailable.length, 0, "an older confirmation must not resurrect them");
  assert.strictEqual(result.returned.length, 0);
});

// ---------------------------------------------------------------------------
// Complaints are terminal
// ---------------------------------------------------------------------------

check("a complaint is never reversed, even by a newer confirmation", () => {
  const result = selectMailable([sub(HASH_A, NEW)], [optout(HASH_A, "complaint", OLD)], []);
  assert.strictEqual(result.mailable.length, 0, "a complaint must survive re-subscription");
  assert.strictEqual(result.returned.length, 0);
  assert.match(result.excluded[0].reason, /terminal/);
});

check("a complaint in the committed register is terminal too", () => {
  const result = selectMailable(
    [sub(HASH_A, NEW)],
    [],
    [entry(HASH_A, "complained", OLD.toISOString())]
  );
  assert.strictEqual(result.mailable.length, 0);
});

check("isTerminal matches free-text reasons that mention a complaint", () => {
  assert.ok(isTerminal("complaint"));
  assert.ok(isTerminal("complained"));
  assert.ok(isTerminal("mailchimp-complaint"));
  assert.ok(isTerminal("Spam Complaint"));
  assert.ok(!isTerminal("one-click"));
  assert.ok(!isTerminal("bounce"));
  assert.ok(!isTerminal("mailchimp-unsubscribed"));
});

// ---------------------------------------------------------------------------
// Hygiene
// ---------------------------------------------------------------------------

check("hash comparison is case-insensitive on both sides", () => {
  const result = selectMailable(
    [sub(HASH_A.toUpperCase(), OLD)],
    [optout(HASH_A.toLowerCase(), "one-click", NEW)],
    []
  );
  assert.strictEqual(result.mailable.length, 0, "a case mismatch must not leak a send");
});

check("exclusions carry hashes, never addresses", () => {
  const result = selectMailable(
    [sub(HASH_A, OLD, "real.person@example.com")],
    [optout(HASH_A, "one-click", NEW)],
    []
  );
  const serialized = JSON.stringify(result.excluded);
  assert.ok(!serialized.includes("real.person"), "exclusion reports must be PII-free");
  assert.ok(serialized.includes(HASH_A));
});

check("mixed lists partition without loss", () => {
  const result = selectMailable(
    [sub(HASH_A, NEW), sub(HASH_B, OLD)],
    [optout(HASH_B, "one-click", NEW)],
    []
  );
  assert.strictEqual(result.mailable.length + result.excluded.length, 2);
  assert.strictEqual(result.mailable[0].emailHash, HASH_A);
});

// ---------------------------------------------------------------------------

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All mailable checks passed.");
