/**
 * Checks that every outgoing email names a desk, and that every desk is a
 * mailbox somebody reads.
 *
 *   npx tsx lib/email/reply-to.test.ts
 *
 * No database and no network — it reads `reply-to.ts`, `senders.ts` and the
 * source of the sending modules as text. `lib/email/hardening.test.ts` cannot
 * be in CI because reaching `service.ts` pulls in `lib/db/drizzle.ts`, which
 * throws at module load without a connection string; this file deliberately
 * imports neither.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { EMAIL_PURPOSES, allReplyToAddresses, replyToForPurpose } from "./reply-to";
import { SENDERS, SENDING_DOMAIN } from "./senders";

let failures = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`  not ok - ${name}`);
    console.error(`    ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mailboxes a reply must never be routed to.
 *
 * Taken from `docs/development/EMAIL_ADDRESSES.md`: the retired table, and the
 * "real but nobody is known to read it" table. `newsletter@` is on this list
 * for the reason `senders.ts` records — it was the marketing Reply-To until the
 * August 2026 audit, and nobody on the team had its password.
 */
const UNREADABLE_MAILBOXES = [
  "noreply",
  "newsletter",
  "marketing",
  "governance",
  "finance",
  "podcast",
  "admin",
  "hello",
  "conduct",
  "security",
  "support",
  "privacy",
  "accessibility",
  "legal",
  "unsub",
  "workshops",
];

/** The modules that actually hand a message to `sendEmail()`. */
const SENDING_MODULES = [
  "lib/email/service.ts",
  "lib/email/mentorship-emails.ts",
  "lib/email/recruitment-emails.ts",
  "lib/matching/email-service.ts",
  "scripts/newsletter/send-test.ts",
];

// -------------------------------------------------------------------- the map

check("every purpose resolves to a shesharp.org.nz mailbox", () => {
  for (const purpose of EMAIL_PURPOSES) {
    const address = replyToForPurpose(purpose);
    assert.match(address, /^[a-z]+@shesharp\.org\.nz$/, `${purpose} -> ${address}`);
    assert.ok(address.endsWith(`@${SENDING_DOMAIN}`), purpose);
  }
});

check("no purpose routes replies to an unread or retired mailbox", () => {
  // The failure this catches has happened twice: `newsletter@` as the marketing
  // Reply-To, and `mentoring@` for every transactional message. Both looked
  // fine in review — the address existed and was on the right domain.
  for (const address of allReplyToAddresses()) {
    const local = address.split("@")[0];
    assert.ok(
      !UNREADABLE_MAILBOXES.includes(local),
      `${address} is on the do-not-route list in EMAIL_ADDRESSES.md`
    );
  }
});

check("the mentorship mailbox is used only for mentorship", () => {
  // The 2026-09-01 defect in one assertion: `mentoring@` is the mentorship
  // lead's own contact address, so anything else landing there is somebody's
  // reply that nobody owns.
  const mentorship = `mentoring@${SENDING_DOMAIN}`;
  for (const purpose of EMAIL_PURPOSES) {
    const isMentorship = purpose === "mentorship";
    assert.equal(
      replyToForPurpose(purpose) === mentorship,
      isMentorship,
      `${purpose} should ${isMentorship ? "" : "not "}reply to ${mentorship}`
    );
  }
});

check("a newsletter reply does not go to the mentorship desk", () => {
  // Named separately because it is the one a subscriber hits: "please take me
  // off this list", typed as a reply to the confirmation email.
  assert.notEqual(replyToForPurpose("newsletter"), `mentoring@${SENDING_DOMAIN}`);
  assert.equal(replyToForPurpose("newsletter"), `info@${SENDING_DOMAIN}`);
});

// ------------------------------------------------------------ stream fallback

check("no stream falls back to a specialist or unread mailbox", () => {
  // A stream's Reply-To is only reached by a message that named no purpose, so
  // it has to be the desk that can take anything.
  for (const [stream, identity] of Object.entries(SENDERS)) {
    const local = identity.replyTo.split("@")[0];
    assert.ok(
      !UNREADABLE_MAILBOXES.includes(local),
      `${stream} falls back to ${identity.replyTo}`
    );
    assert.ok(
      identity.replyTo === `info@${SENDING_DOMAIN}` ||
        identity.replyTo === `website@${SENDING_DOMAIN}`,
      `${stream} falls back to ${identity.replyTo}, which is a specialist desk`
    );
  }
});

check("no From is ever used as a Reply-To", () => {
  // `senders.ts` requires a Reply-To to be a monitored mailbox, and `gates.ts`
  // fails a send from noreply@ with none.
  for (const identity of Object.values(SENDERS)) {
    assert.ok(!identity.replyTo.startsWith("noreply@"), identity.stream);
  }
});

// ------------------------------------------------------------- the call sites

check("every sendEmail() call names a desk", () => {
  // Source-level, deliberately. It cannot tell whether a purpose is the RIGHT
  // one — a human reading the diff does that — but it can tell that somebody
  // chose, which is the half that gets forgotten. Without this, a sender added
  // next year silently inherits the stream fallback, which is exactly how both
  // previous defects arrived.
  const root = join(__dirname, "..", "..");
  const missing: string[] = [];

  for (const relative of SENDING_MODULES) {
    const source = readFileSync(join(root, relative), "utf8");
    const lines = source.split("\n");
    lines.forEach((line, index) => {
      if (!line.includes("sendEmail({")) return;
      // The options object ends within a handful of lines of the call in every
      // sender here; read a generous window rather than parsing TypeScript.
      const window = lines.slice(index, index + 14).join("\n");
      if (!/\bpurpose:\s*["']/.test(window) && !/\breplyTo:\s*/.test(window)) {
        missing.push(`${relative}:${index + 1}`);
      }
    });
  }

  assert.deepEqual(
    missing,
    [],
    `these sendEmail() calls name no purpose and no replyTo:\n  ${missing.join("\n  ")}`
  );
});

check("the scan is looking at real call sites", () => {
  // A source scan that matches nothing passes silently, which is the shape of
  // every check in this repo that turned out to be gating nothing. Assert it
  // found the calls it is supposed to be checking.
  const root = join(__dirname, "..", "..");
  const found = SENDING_MODULES.reduce((total, relative) => {
    const source = readFileSync(join(root, relative), "utf8");
    return total + (source.match(/sendEmail\(\{/g)?.length ?? 0);
  }, 0);
  assert.ok(found >= 20, `expected the sending modules to hold 20+ calls, found ${found}`);
});

check("every purpose is used by at least one sender", () => {
  // A purpose nothing sends is a desk nobody was assigned — either a sender is
  // missing or the purpose should not exist. `events` is the deliberate
  // exception: registrant mail is composed in Humanitix, not here.
  const root = join(__dirname, "..", "..");
  const source = SENDING_MODULES.map((relative) =>
    readFileSync(join(root, relative), "utf8")
  ).join("\n");

  const unused = EMAIL_PURPOSES.filter(
    (purpose) => !source.includes(`purpose: '${purpose}'`) && !source.includes(`purpose: "${purpose}"`)
  );
  assert.deepEqual(unused, ["events"], `unexpected unused purposes: ${unused.join(", ")}`);
});

console.log(
  failures === 0 ? "\nAll reply-to checks passed." : `\n${failures} check(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
