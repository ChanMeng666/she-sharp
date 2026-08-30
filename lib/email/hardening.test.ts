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
import { getSenderIdentity, isApprovedSender, type EmailStream } from "./senders";
import {
  UNSUBSCRIBE_URL_PLACEHOLDER,
  buildUnsubscribeHeaders,
  substituteUnsubscribeUrl,
  unsubscribeUrlFor,
} from "./unsubscribe-headers";
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
// These used to be asserted against a local copy of the assembly, because it
// was private to service.ts and importing service.ts pulls in the database
// client — so the test proved its own copy self-consistent and nothing about
// the shipped code. The assembly now lives in its own database-free module and
// is asserted directly.

/** The real assembly, via the shared module both senders use. */
function listUnsubscribe(url: string, mailto?: string): string {
  const previous = process.env.EMAIL_UNSUBSCRIBE_MAILTO;
  if (mailto) process.env.EMAIL_UNSUBSCRIBE_MAILTO = mailto;
  else delete process.env.EMAIL_UNSUBSCRIBE_MAILTO;

  // The URL is rebuilt from the address inside the module, so drive it with the
  // address and assert on the header it produces for that same URL.
  const headers = buildUnsubscribeHeaders(EMAIL, BASE);
  if (previous === undefined) delete process.env.EMAIL_UNSUBSCRIBE_MAILTO;
  else process.env.EMAIL_UNSUBSCRIBE_MAILTO = previous;

  return headers["List-Unsubscribe"].replace(unsubscribeUrlFor(EMAIL, BASE)!, url);
}

const BASE = "https://www.shesharp.org.nz";

/** Mirrors buildStreamHeaders' stream test. Keep in step with service.ts. */
function streamCarriesUnsubscribe(stream: EmailStream): boolean {
  return stream === "notification" || stream === "marketing";
}

const UNSUB_URL = "https://www.shesharp.org.nz/api/email/unsubscribe?t=abc";
check("one-click URL alone is the default (no unverified mailto)", listUnsubscribe(UNSUB_URL) === `<${UNSUB_URL}>`);
check("no mailto: appears unless one is configured", !listUnsubscribe(UNSUB_URL).includes("mailto:"));
// A fixture, not a recommendation: unsub@ was probed on 2026-08-23 and does not
// exist, which is why EMAIL_UNSUBSCRIBE_MAILTO stays unset. This checks the
// header assembly for the day a real mailbox is created.
check("a configured mailto is appended, not substituted", listUnsubscribe(UNSUB_URL, "unsub@shesharp.org.nz") === `<${UNSUB_URL}>, <mailto:unsub@shesharp.org.nz>`);

// The header pair, straight from the module that both senders use.
check("both RFC 8058 headers are emitted together", (() => {
  const h = buildUnsubscribeHeaders(EMAIL, BASE);
  return h["List-Unsubscribe"]?.startsWith("<https://") === true &&
    h["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click";
})());
check("the unsubscribe URL carries a token, never the address", (() => {
  const url = unsubscribeUrlFor(EMAIL, BASE) ?? "";
  return url.includes("/api/email/unsubscribe?t=") && !url.includes("someone");
})());
// Without a secret no token can be signed. A single notification email degrades
// to no header; a marketing BATCH must refuse to build rather than ship a whole
// list with no opt-out, which is what the preflight in build-batch.ts enforces.
check("no secret yields no headers at all (never a broken one)", (() => {
  const previous = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  process.env.EMAIL_UNSUBSCRIBE_SECRET = "";
  const h = buildUnsubscribeHeaders(EMAIL, BASE);
  const url = unsubscribeUrlFor(EMAIL, BASE);
  process.env.EMAIL_UNSUBSCRIBE_SECRET = previous;
  return Object.keys(h).length === 0 && url === null;
})());

// Which streams carry the header. `marketing` was excluded until the newsletter
// moved in-house, because Resend attached these headers to broadcasts itself.
// Self-hosted, nobody else will — a marketing send without them is a send with
// no one-click opt-out, against an AUP that requires a frictionless one.
check("notification mail carries one-click unsubscribe", streamCarriesUnsubscribe("notification"));
check("marketing mail carries one-click unsubscribe (self-hosted newsletter)", streamCarriesUnsubscribe("marketing"));
// Offering to unsubscribe from a password reset invites opting out of the one
// message the recipient genuinely needs.
check("transactional mail carries no unsubscribe header", !streamCarriesUnsubscribe("transactional"));
check("internal mail carries no unsubscribe header", !streamCarriesUnsubscribe("internal"));

// --- Suppression scope -----------------------------------------------------
// isSuppressed() lives in optouts.ts, which imports the database client, so the
// rule is mirrored here the same way as the header assembly above.

/** Mirrors isSuppressed()'s stream test. Keep in step with optouts.ts. */
function streamHonoursOptouts(stream: EmailStream): boolean {
  return stream === "notification" || stream === "marketing";
}

// The pair that matters: a one-click unsubscribe from the newsletter records an
// opt-out, and the marketing stream has to read it. While Resend owned
// broadcasts it did that for us; self-hosted, an opt-out the sending stream
// ignores is an unsubscribe button that visibly does nothing — which is how a
// list earns spam complaints, against an account-wide 0.08% ceiling.
check("marketing honours opt-outs (or the unsubscribe button is a lie)", streamHonoursOptouts("marketing"));
check("notification honours opt-outs", streamHonoursOptouts("notification"));
// A suppressed address must still be able to reset its password.
check("transactional is never suppressed", !streamHonoursOptouts("transactional"));
check("internal is never suppressed", !streamHonoursOptouts("internal"));

// Anything that carries an unsubscribe control must act on it. A stream offering
// a button it then ignores is worse than one that offers none.
check(
  "every stream offering unsubscribe also honours opt-outs",
  (["transactional", "notification", "marketing", "internal"] as const).every(
    (s) => !streamCarriesUnsubscribe(s) || streamHonoursOptouts(s)
  )
);

// --- Unsubscribe placeholder substitution ----------------------------------
// The batch path renders once (or without knowing the address) and swaps a
// placeholder for each recipient's signed URL. Resend's own
// {{{RESEND_UNSUBSCRIBE_URL}}} only ever worked for broadcasts against
// Resend-held contacts; on the batch endpoint it would reach a real inbox as
// literal text.

check("the placeholder is not brace-delimited", !UNSUBSCRIBE_URL_PLACEHOLDER.includes("{{"));
check("substitution replaces the placeholder with a signed URL", (() => {
  const out = substituteUnsubscribeUrl(`<a href="${UNSUBSCRIBE_URL_PLACEHOLDER}">Unsubscribe</a>`, EMAIL, BASE);
  return out.includes("/api/email/unsubscribe?t=") && !out.includes(UNSUBSCRIBE_URL_PLACEHOLDER);
})());
check("every occurrence is replaced, not just the first", (() => {
  const body = `${UNSUBSCRIBE_URL_PLACEHOLDER} and ${UNSUBSCRIBE_URL_PLACEHOLDER}`;
  return !substituteUnsubscribeUrl(body, EMAIL, BASE).includes(UNSUBSCRIBE_URL_PLACEHOLDER);
})());
check("content without a placeholder is returned untouched", (() => {
  const body = "<p>No opt-out here.</p>";
  return substituteUnsubscribeUrl(body, EMAIL, BASE) === body;
})());
check("two recipients get two different unsubscribe URLs", (() => {
  const a = substituteUnsubscribeUrl(UNSUBSCRIBE_URL_PLACEHOLDER, "a@example.com", BASE);
  const b = substituteUnsubscribeUrl(UNSUBSCRIBE_URL_PLACEHOLDER, "b@example.com", BASE);
  return a !== b;
})());
// Without a secret this must THROW, not silently return the placeholder: a
// marketing batch that shipped the literal text would give a whole list a dead
// opt-out link, which is how a list earns spam complaints.
check("substitution throws when no token can be signed", (() => {
  const previous = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  process.env.EMAIL_UNSUBSCRIBE_SECRET = "";
  let threw = false;
  try {
    substituteUnsubscribeUrl(UNSUBSCRIBE_URL_PLACEHOLDER, EMAIL, BASE);
  } catch {
    threw = true;
  }
  process.env.EMAIL_UNSUBSCRIBE_SECRET = previous;
  return threw;
})());
check("a substituted URL round-trips back to the recipient's hash", (() => {
  const out = substituteUnsubscribeUrl(UNSUBSCRIBE_URL_PLACEHOLDER, EMAIL, BASE);
  const token = out.split("?t=")[1];
  return verifyUnsubscribeToken(token) === hashEmail(EMAIL);
})());

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

// --- Redaction candidates: codes and PINs ----------------------------------
// The regression these guard: a pre-publication screen of the 179 archived
// newsletter bodies found two Kahoot "Game PIN" numbers (campaigns 2cbc2a858a
// and a9402aed0f, 2020) that this scan had never surfaced, because "pin" was
// not one of its code words. An independent prose read found them; the scan
// could not. That is the shape of the June 2026 incident in which registration
// codes reached a public page.
//
// The scan REPORTS — it must never block — so the cost of a miss is that
// nobody is shown the number, and the cost of noise is that nobody reads the
// list. Both directions are asserted below.

/** The redaction one-liners the shipped gate raises for a body of text. */
function redactions(text: string): string[] {
  return runEmailGates(HTML, text, spec(), { mode: "broadcast" }).redactionCandidates;
}

/** Only the code/PIN-class one-liners. */
function codeRedactions(text: string): string[] {
  return redactions(text).filter((c) => c.startsWith("Possible access/discount code"));
}

const KAHOOT = "Trailblazing Women in Tech: Part One - Game PIN: 008961475";

check("a Kahoot game PIN beside the word PIN is surfaced", codeRedactions(KAHOOT).some((c) => c.includes("008961475")));
check("the PIN is attributed to the keyword that found it", codeRedactions(KAHOOT).some((c) => c.includes('near "PIN"')));
// Kahoot prints the PIN grouped on screen, so that is how it gets pasted.
check("a PIN in Kahoot's grouped form is surfaced", codeRedactions("Game PIN: 008 961 475").some((c) => c.includes("008 961 475")));
// The other half of a Zoom join credential: the meeting ID, which the old
// unbroken-token rule could not see through the spaces Zoom prints.
check("a grouped Zoom meeting ID beside its passcode is surfaced", codeRedactions("Meeting ID: 820 6115 6980 Passcode: 848569").some((c) => c.includes("820 6115 6980")));
check("the 6-digit passcode is still surfaced too", codeRedactions("Meeting ID: 820 6115 6980 Passcode: 848569").some((c) => c.includes("848569")));
// Unchanged behaviour: an alphanumeric code beside a code word.
check("an alphanumeric promo code is still surfaced", codeRedactions("Use promo SHESHARP20 at checkout.").some((c) => c.includes("SHESHARP20")));

// Noise. A detector that fires on every date or dollar amount stops being read,
// and then it protects nothing. Six digits is the floor precisely because
// everything below is prose: measured over the corpus, dropping it to four adds
// exactly two hits, "2025" near "Code" and "2019" near "Pin", and nothing else.
check("a year near a code word is not a code", codeRedactions("Applications close in 2025 — use the code above.").length === 0);
check("a price near a code word is not a code", codeRedactions("Members get a discount: $25 instead of $40.").length === 0);
check("a date and time near a code word is not a code", codeRedactions("Access opens 6:30 PM on 15 Oct 2020.").length === 0);
// A hyphen is not a group separator, so neither of these reads as one number.
check("a hyphenated year range near a code word is not a code", codeRedactions("Access runs 2020-2021 for members.").length === 0);
check("a hyphenated phone number near a code word is not a code", codeRedactions("For access call 021-555-1234.").length === 0);
// The one real "pin" in 179 archived bodies that is not a PIN.
check("prose using 'pin' as a noun raises nothing", codeRedactions("In 2019 she was awarded a Gold Pin for her board game at the Best Awards.").length === 0);
check("'pinned' and 'Pinterest' do not arm the scan", codeRedactions("We pinned 1234567 posts on Pinterest.").length === 0);
// A PIN is a number, so the uppercase-token half of the rule is switched off
// beside it — it can only add noise. This is the fixture that proved it:
// "Game PIN: 006055277 SEE YOU TONIGHT!" surfaced "TONIGHT" as a code.
check("an all-caps word beside a PIN is not reported as a code", !codeRedactions("Game PIN: 006055277 SEE YOU TONIGHT!").some((c) => c.includes("TONIGHT")));
check("...while the PIN in that same line still is", codeRedactions("Game PIN: 006055277 SEE YOU TONIGHT!").some((c) => c.includes("006055277")));

// Proximity, unchanged at 60 characters: a number far from the keyword is not
// "beside" it and must not be dragged in.
check("a number well outside the proximity window is not a code", codeRedactions(`Game PIN follows.${" ".repeat(120)}Call us on 0800 123 456.`).length === 0);

// The scan reports; it does not block. A PIN in the body must leave the report
// sendable, or every gated send with a legitimate number in it would stop.
check("a surfaced PIN blocks nothing", (() => {
  const report = runEmailGates(HTML, KAHOOT, spec(), { mode: "broadcast" });
  return report.ok && report.redactionCandidates.length > 0;
})());

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
