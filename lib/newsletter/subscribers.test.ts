/**
 * Checks for the newsletter subscriber list.
 *
 * Run: `npx tsx lib/newsletter/subscribers.test.ts`
 *
 * No database and no network. The rules worth testing are the decisions, not the
 * SQL — `decideSubscribe()` and `shouldApplyExit()` were extracted from their
 * calling functions precisely so they could be checked here, because both are
 * expensive to get wrong in *both* directions: too strict and the only
 * legitimate way back onto the list silently stops working; too loose and
 * someone who filed a spam complaint gets mailed again, against an
 * account-wide 0.08% ceiling.
 */

import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { hashEmail } from "../email/hash";
import {
  CONFIRM_TTL_DAYS,
  confirmExpiry,
  decideSubscribe,
  mintToken,
  normalizeEmail,
  shouldApplyExit,
  type SubscriberStatus,
} from "./subscribers";

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

// ---------------------------------------------------------------------------
// Address normalization
// ---------------------------------------------------------------------------

check("normalizeEmail agrees with hashEmail on the same input", () => {
  for (const raw of ["  Sarah@Example.COM ", "sarah@example.com", "SARAH@EXAMPLE.COM"]) {
    assert.strictEqual(
      hashEmail(raw),
      hashEmail(normalizeEmail(raw)),
      `normalizeEmail must be a no-op under hashEmail for ${JSON.stringify(raw)}`
    );
  }
});

check("normalizeEmail collapses case and surrounding space to one row key", () => {
  const variants = ["  Sarah@Example.COM ", "sarah@example.com", "\tSARAH@example.com\n"];
  const normalized = new Set(variants.map(normalizeEmail));
  assert.strictEqual(normalized.size, 1, "all variants must normalize to one address");
  assert.strictEqual([...normalized][0], "sarah@example.com");
});

check("normalizeEmail does NOT strip Gmail dots or plus-tags", () => {
  // Deliberate: hashEmail does not either, and a subscriber table that silently
  // merged a+tag@ with a@ would unsubscribe the wrong address.
  assert.notStrictEqual(
    normalizeEmail("s.arah+news@gmail.com"),
    normalizeEmail("sarah@gmail.com")
  );
});

// ---------------------------------------------------------------------------
// decideSubscribe — who may join, and who may come back
// ---------------------------------------------------------------------------

check("a brand-new address proceeds", () => {
  assert.strictEqual(decideSubscribe(null, null), "proceed");
  assert.strictEqual(decideSubscribe(undefined, undefined), "proceed");
});

check("an address already subscribed is reported, not re-tokenised", () => {
  assert.strictEqual(decideSubscribe(null, "subscribed"), "already-subscribed");
});

check("a pending address proceeds, so the token can be replaced", () => {
  assert.strictEqual(decideSubscribe(null, "pending"), "proceed");
});

check("someone who unsubscribed may return through the form", () => {
  // consent-rules.md: "The only way back onto the list is the person
  // themselves, through the website form." Blocking here would break the one
  // route the rules actually permit.
  assert.strictEqual(decideSubscribe("one-click", "unsubscribed"), "proceed");
  assert.strictEqual(decideSubscribe(null, "unsubscribed"), "proceed");
});

check("someone whose address hard-bounced may return through the form", () => {
  // They may have fixed the mailbox. Their own deliberate act is evidence.
  assert.strictEqual(decideSubscribe("bounce", "bounced"), "proceed");
});

check("a spam complaint is terminal, by every route", () => {
  const statuses: (SubscriberStatus | null)[] = [
    null,
    "pending",
    "subscribed",
    "unsubscribed",
    "bounced",
    "complained",
  ];
  for (const status of statuses) {
    assert.strictEqual(
      decideSubscribe("complaint", status),
      "blocked",
      `a complaint must block regardless of row status (${status})`
    );
  }
  // …and from the subscriber row alone, even with no opt-out record.
  assert.strictEqual(decideSubscribe(null, "complained"), "blocked");
});

check("blocked is returned without a reason", () => {
  // The public endpoint must answer identically for a known and an unknown
  // address, or it becomes an address-enumeration oracle. The decision type
  // carries no reason, which is what makes that hard to get wrong downstream.
  const decision = decideSubscribe("complaint", "complained");
  assert.strictEqual(decision, "blocked");
  assert.strictEqual(typeof decision, "string");
});

// ---------------------------------------------------------------------------
// shouldApplyExit — idempotency and the terminal state
// ---------------------------------------------------------------------------

check("a live subscriber can be unsubscribed, bounced or marked complained", () => {
  assert.strictEqual(shouldApplyExit("subscribed", "unsubscribed"), true);
  assert.strictEqual(shouldApplyExit("subscribed", "bounced"), true);
  assert.strictEqual(shouldApplyExit("subscribed", "complained"), true);
});

check("a repeated exit event is a no-op", () => {
  // Providers retry the RFC 8058 POST and Resend retries webhooks. A repeat must
  // not overwrite the timestamp that says when the person actually left.
  assert.strictEqual(shouldApplyExit("unsubscribed", "unsubscribed"), false);
  assert.strictEqual(shouldApplyExit("bounced", "bounced"), false);
  assert.strictEqual(shouldApplyExit("complained", "complained"), false);
});

check("nothing downgrades a complaint", () => {
  assert.strictEqual(shouldApplyExit("complained", "unsubscribed"), false);
  assert.strictEqual(shouldApplyExit("complained", "bounced"), false);
});

check("a complaint overrides a previous unsubscribe or bounce", () => {
  // The reason we hold must be the strongest signal received, because it is what
  // decides whether they can ever come back.
  assert.strictEqual(shouldApplyExit("unsubscribed", "complained"), true);
  assert.strictEqual(shouldApplyExit("bounced", "complained"), true);
});

check("an unconfirmed row can still exit", () => {
  // A pending address can hard-bounce on the confirmation email itself.
  assert.strictEqual(shouldApplyExit("pending", "bounced"), true);
});

// ---------------------------------------------------------------------------
// Confirmation tokens
// ---------------------------------------------------------------------------

check("tokens are unguessable, unique and URL-safe", () => {
  const tokens = new Set<string>();
  for (let i = 0; i < 500; i += 1) tokens.add(mintToken());
  assert.strictEqual(tokens.size, 500, "minted tokens must not collide");

  for (const token of tokens) {
    assert.match(token, /^[A-Za-z0-9_-]+$/, "token must be base64url");
    assert.ok(token.length >= 40, `token too short: ${token.length}`);
    assert.ok(token.length <= 64, `token must fit varchar(64): ${token.length}`);
  }
});

check("a token is not derivable from the address", () => {
  // The whole reason the stateless unsubscribe token is not reused for
  // confirmation: that one IS a deterministic function of the address, so it
  // never expires and can be replayed forever. A confirmation must evidence a
  // deliberate act at a point in time.
  const a = mintToken();
  const b = mintToken();
  assert.notStrictEqual(a, b, "two mints for the same person must differ");
});

check("confirmation expires seven days out", () => {
  const from = new Date("2026-08-29T10:00:00.000Z");
  const expires = confirmExpiry(from);
  const days = (expires.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  assert.strictEqual(days, CONFIRM_TTL_DAYS);
  assert.strictEqual(days, 7);
  assert.ok(expires > from, "expiry must be in the future");
});

check("confirmExpiry does not mutate the date it is given", () => {
  const from = new Date("2026-08-29T10:00:00.000Z");
  const before = from.getTime();
  confirmExpiry(from);
  assert.strictEqual(from.getTime(), before);
});

// ---------------------------------------------------------------------------
// Enumeration order
//
// The file header says the rules worth testing are the decisions, not the SQL.
// This is the one exception, and it earns it: on 2026-08-30, 1,545 of the
// mailable rows were found to carry the SAME `created_at`, because they all
// arrived in one import. `ORDER BY created_at` was therefore one tie group
// spanning almost the whole list, so `recipients-from-db.ts --limit 50` — the
// documented way to ramp a first send — could name a different fifty people on
// every run. The defect was invisible in every decision function above and
// invisible in code review, because the ORDER BY was right there and looked
// total. What is asserted here is the property, not the query: every bulk
// enumeration sorts by the shared LIST_ORDER, and LIST_ORDER ends in a unique
// column. Reading the source is the only way to check that without a database.
// ---------------------------------------------------------------------------

const subscribersSource = readFileSync(
  fileURLToPath(new URL("./subscribers.ts", import.meta.url)),
  "utf8"
);

check("LIST_ORDER ends in a unique column, so the sort is total", () => {
  const match = subscribersSource.match(/const LIST_ORDER = \[([^\]]*)\]/);
  assert.ok(match, "LIST_ORDER is not declared in subscribers.ts");
  const columns = match[1].split(",").map((c) => c.trim()).filter(Boolean);
  assert.deepStrictEqual(columns, [
    "newsletterSubscribers.createdAt",
    "newsletterSubscribers.id",
  ]);
});

check("every bulk enumeration sorts by LIST_ORDER, not by one column", () => {
  const orderBys = subscribersSource.match(/\.orderBy\([^)]*\)/g) ?? [];
  assert.ok(orderBys.length >= 2, "expected the two bulk enumerations to sort");
  for (const call of orderBys) {
    assert.strictEqual(
      call,
      ".orderBy(...LIST_ORDER)",
      `${call} sorts on its own terms; a second enumeration with a partial ` +
        "order is exactly the defect LIST_ORDER exists to prevent"
    );
  }
});

// ---------------------------------------------------------------------------

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All subscriber checks passed.");
