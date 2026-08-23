/**
 * Checks for the DMARC-era sending hardening.
 *
 * Run: npx tsx lib/email/hardening.test.ts
 *
 * These cover the three pieces whose failure modes are invisible in a preview
 * and expensive in production: a From that loses DMARC alignment (silently
 * discarded once the domain reaches p=reject), an unsubscribe token that can be
 * forged (unsubscribing a third party) or that leaks the address, and a webhook
 * that accepts an unsigned payload (letting anyone suppress a recipient).
 *
 * No database and no network — everything here is pure.
 */

import { createHmac } from "node:crypto";

process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret-not-a-real-key";

import { runEmailGates } from "./gates";
import { hashEmail } from "./hash";
import type { MessageSpec } from "./message";
import { getSenderIdentity, isApprovedSender } from "./senders";
import { buildUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribe-token";
import { verifySvixSignature } from "./webhook-verify";

let failures = 0;

/** Records one assertion and keeps going, so one break does not hide the rest. */
function check(label: string, ok: boolean): void {
  console.log(`  ${ok ? "ok" : "FAIL"} - ${label}`);
  if (!ok) failures++;
}

// --- Unsubscribe tokens ----------------------------------------------------

const EMAIL = "someone@example.com";
const token = buildUnsubscribeToken(EMAIL);

check("token round-trips to the email hash", verifyUnsubscribeToken(token) === hashEmail(EMAIL));
check("token carries the hash, not the address", !!token && !token.includes("someone"));
check("tampered signature is rejected", verifyUnsubscribeToken(`${token!.slice(0, -3)}aaa`) === null);
check("tampered hash is rejected", verifyUnsubscribeToken(`AAAA.${token!.split(".")[1]}`) === null);
check("missing token is rejected", verifyUnsubscribeToken(null) === null);
check("token without a separator is rejected", verifyUnsubscribeToken("garbage") === null);

process.env.EMAIL_UNSUBSCRIBE_SECRET = "";
check("no secret degrades to no token rather than a broken one", buildUnsubscribeToken(EMAIL) === null);
process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret-not-a-real-key";

// --- List-Unsubscribe headers ----------------------------------------------
// buildStreamHeaders is private to service.ts, and importing service.ts pulls in
// the database client. Assert the contract on the same inputs instead: the URL
// is always offered, the mailto only when explicitly configured to a verified
// address (an unverified one bounces, which is worse than offering none).

/** Mirrors buildStreamHeaders' List-Unsubscribe assembly. */
function listUnsubscribe(url: string, mailto?: string): string {
  return mailto ? `<${url}>, <mailto:${mailto}>` : `<${url}>`;
}

const UNSUB_URL = "https://www.shesharp.org.nz/api/email/unsubscribe?t=abc";
check("one-click URL alone is the default (no unverified mailto)", listUnsubscribe(UNSUB_URL) === `<${UNSUB_URL}>`);
check("no mailto: appears unless one is configured", !listUnsubscribe(UNSUB_URL).includes("mailto:"));
// A fixture, not a recommendation: unsub@ was probed on 2026-08-23 and does not
// exist, which is why EMAIL_UNSUBSCRIBE_MAILTO stays unset. This checks the
// header assembly for the day a real mailbox is created.
check("a configured mailto is appended, not substituted", listUnsubscribe(UNSUB_URL, "unsub@shesharp.org.nz") === `<${UNSUB_URL}>, <mailto:unsub@shesharp.org.nz>`);

// --- Sender identities -----------------------------------------------------

// The newsletter has gone out from newsletter@ via Mailchimp for years; keeping
// that identity across the move to Resend is the whole deliverability argument.
check("marketing sends from newsletter@ (Mailchimp continuity)", getSenderIdentity("marketing").from === "She Sharp <newsletter@shesharp.org.nz>");
// The From keeps the Mailchimp identity; the Reply-To must not. newsletter@
// accepts mail but nobody on the team had its password as of August 2026, so a
// subscriber pressing Reply was writing into a mailbox no one opens.
check("marketing Reply-To is a monitored inbox, not newsletter@", getSenderIdentity("marketing").replyTo === "info@shesharp.org.nz");
check("info@ is the approved sender for 1:1 mail", isApprovedSender("She Sharp <info@shesharp.org.nz>"));
check("transactional sends from noreply@", getSenderIdentity("transactional").from.includes("noreply@shesharp.org.nz"));
check("every stream sets a Reply-To", (["transactional", "notification", "marketing", "internal"] as const).every((s) => getSenderIdentity(s).replyTo.length > 0));

process.env.EMAIL_FROM = "She Sharp <custom@shesharp.org.nz>";
check("EMAIL_FROM overrides the transactional From", getSenderIdentity("transactional").from.includes("custom@"));
check("EMAIL_FROM does NOT reach marketing (the noreply@ newsletter bug)", getSenderIdentity("marketing").from.includes("newsletter@"));
delete process.env.EMAIL_FROM;

check("a lookalike domain is not an approved sender", !isApprovedSender("She Sharp <info@shesharp.co.nz>"));
check("an approved sender is recognised with a display name", isApprovedSender("She Sharp <info@shesharp.org.nz>"));

// Every Reply-To must be a mailbox somebody actually opens. Passing the
// domain check only proves the address is spelled on the right domain; eight
// addresses that passed it turned out never to have been created. The set
// below is the one the 2026-08-23 delivery probe confirmed.
const MONITORED = ["info", "mentoring", "industry", "events", "website"].map((local) => `${local}@shesharp.org.nz`);
check("no stream replies into newsletter@", (["transactional", "notification", "marketing", "internal"] as const).every((s) => getSenderIdentity(s).replyTo !== "newsletter@shesharp.org.nz"));
check("every Reply-To is a monitored mailbox", (["transactional", "notification", "marketing", "internal"] as const).every((s) => MONITORED.includes(getSenderIdentity(s).replyTo)));

// --- Gates -----------------------------------------------------------------

/** A minimal spec that passes every gate, for one-field-at-a-time mutation. */
function spec(overrides: Partial<MessageSpec> = {}): MessageSpec {
  return {
    key: "gate-test",
    engine: "layout",
    category: "transactional",
    from: "She Sharp <info@shesharp.org.nz>",
    replyTo: "mentoring@shesharp.org.nz",
    subject: "Short subject",
    title: "Hello",
    blocks: [{ type: "paragraph", text: "Body copy." }],
    ...overrides,
  };
}

const HTML = `<html><body><a href="https://www.shesharp.org.nz/x">x</a></body></html>`;

/** Every gate id raised for a spec, failures and warnings alike. */
function gateIds(candidate: MessageSpec): string[] {
  const report = runEmailGates(HTML, "x", candidate, { mode: "broadcast" });
  return [...report.failures, ...report.warnings].map((gate) => gate.id);
}

check("a clean spec passes", runEmailGates(HTML, "x", spec(), { mode: "broadcast" }).ok);
check("a lookalike From domain is blocked", gateIds(spec({ from: "She Sharp <info@shesharp.co.nz>" })).includes("from-identity"));
// hello@ specifically, because it was a real From in this repo until the
// delivery probe showed the mailbox had never existed. This is the regression.
check("the retired hello@ is blocked as a sender", gateIds(spec({ from: "She Sharp <hello@shesharp.org.nz>" })).includes("from-identity"));
check("an unapproved local-part is blocked", gateIds(spec({ from: "She Sharp <random@shesharp.org.nz>" })).includes("from-identity"));
check("from-identity blocks rather than warns", runEmailGates(HTML, "x", spec({ from: "info@shesharp.co.nz" }), { mode: "broadcast" }).failures.some((f) => f.id === "from-identity"));
check("an external Reply-To is blocked", gateIds(spec({ replyTo: "volunteer@gmail.com" })).includes("reply-to-domain"));
check("a tag value with a space is blocked", gateIds(spec({ tags: [{ name: "stream", value: "event promo!" }] })).includes("tag-charset"));
check("a valid tag value is allowed", !gateIds(spec({ tags: [{ name: "stream", value: "marketing" }] })).includes("tag-charset"));
check("noreply@ with no Reply-To warns", gateIds(spec({ from: "She Sharp <noreply@shesharp.org.nz>", replyTo: undefined })).includes("no-reply-path"));

// --- Svix webhook signatures -----------------------------------------------

const SECRET = `whsec_${Buffer.from("a-test-signing-key").toString("base64")}`;
const BODY = JSON.stringify({ type: "email.bounced" });
const SVIX_ID = "msg_test";
const NOW = String(Math.floor(Date.now() / 1000));
const SIGNATURE = createHmac("sha256", Buffer.from(SECRET.replace(/^whsec_/, ""), "base64"))
  .update(`${SVIX_ID}.${NOW}.${BODY}`)
  .digest("base64");

check("a valid signature is accepted", verifySvixSignature(BODY, { id: SVIX_ID, timestamp: NOW, signature: `v1,${SIGNATURE}` }, SECRET));
check("one valid signature among several is accepted (secret rotation)", verifySvixSignature(BODY, { id: SVIX_ID, timestamp: NOW, signature: `v1,bogus v1,${SIGNATURE}` }, SECRET));
check("a forged signature is rejected", !verifySvixSignature(BODY, { id: SVIX_ID, timestamp: NOW, signature: "v1,AAAA" }, SECRET));
check("a mutated body is rejected", !verifySvixSignature(`${BODY} `, { id: SVIX_ID, timestamp: NOW, signature: `v1,${SIGNATURE}` }, SECRET));
check("a replayed old timestamp is rejected", !verifySvixSignature(BODY, { id: SVIX_ID, timestamp: String(Number(NOW) - 3600), signature: `v1,${SIGNATURE}` }, SECRET));
check("an unconfigured secret rejects everything", !verifySvixSignature(BODY, { id: SVIX_ID, timestamp: NOW, signature: `v1,${SIGNATURE}` }, undefined));
check("missing svix headers are rejected", !verifySvixSignature(BODY, { id: null, timestamp: NOW, signature: `v1,${SIGNATURE}` }, SECRET));

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log("\nAll email hardening checks passed.");
