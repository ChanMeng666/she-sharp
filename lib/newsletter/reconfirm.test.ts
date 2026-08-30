/**
 * Checks for the newsletter re-confirmation path.
 *
 * Run: `npx tsx lib/newsletter/reconfirm.test.ts`
 *
 * No database and no network. Everything asserted here is either a pure rule or
 * a pure string transform, and both were extracted from their callers so they
 * could be checked without one.
 *
 * The organising idea is that a guard is not verified until it has been broken,
 * so every check below hands the thing it guards the input it is supposed to
 * refuse: a forged token, a token minted for the other endpoint, a complainer,
 * an unsubscribed row, a row that is on a do-not-contact register while still
 * reading `subscribed`, and a second press of the same link.
 */

import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Both token modules read this at call time, so it must be set before the first
// build. A real secret is never needed: the assertions are about the scheme.
process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret-not-a-real-key";

import { hashEmail } from "../email/hash";
import { buildUnsubscribeToken, verifyUnsubscribeToken } from "../email/unsubscribe-token";
import { appendReconfirmSentence, decideReconfirm } from "./reconfirm";
import { buildReconfirmToken, verifyReconfirmToken } from "./reconfirm-token";
import {
  RECONFIRM_URL_PLACEHOLDER,
  reconfirmUrlFor,
  substituteReconfirmUrl,
} from "./reconfirm-link";
import { getIssue } from "./issues-registry";
import { renderNewsletter } from "./render";
import { newsletterIssueSchema, type NewsletterIssueData } from "./schema";
import type { SubscriberStatus } from "./subscribers";

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

const EMAIL = "someone@example.com";
const BASE = "https://www.shesharp.org.nz";
const ISSUE = "2026-09";

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

check("a token round-trips to the recipient's email hash", () => {
  const token = buildReconfirmToken(EMAIL);
  assert.ok(token, "expected a token");
  assert.strictEqual(verifyReconfirmToken(token), hashEmail(EMAIL));
});

check("a token carries the hash, never the address", () => {
  const token = buildReconfirmToken(EMAIL);
  assert.ok(token && !token.includes("someone"), "the address must not appear in the token");
});

check("a tampered signature is rejected", () => {
  const token = buildReconfirmToken(EMAIL)!;
  assert.strictEqual(verifyReconfirmToken(`${token.slice(0, -3)}aaa`), null);
});

check("a tampered hash is rejected", () => {
  const token = buildReconfirmToken(EMAIL)!;
  assert.strictEqual(verifyReconfirmToken(`AAAA.${token.split(".")[1]}`), null);
});

check("a hash swapped for another address's is rejected", () => {
  // The forgery this actually defends against: take your own valid token, keep
  // its signature, and put somebody else's hash in front of it.
  const mine = buildReconfirmToken(EMAIL)!;
  const theirHash = Buffer.from(hashEmail("someone-else@example.com"), "hex").toString(
    "base64url"
  );
  assert.strictEqual(verifyReconfirmToken(`${theirHash}.${mine.split(".")[1]}`), null);
});

check("a missing or shapeless token is rejected", () => {
  assert.strictEqual(verifyReconfirmToken(null), null);
  assert.strictEqual(verifyReconfirmToken(undefined), null);
  assert.strictEqual(verifyReconfirmToken(""), null);
  assert.strictEqual(verifyReconfirmToken("garbage"), null);
  assert.strictEqual(verifyReconfirmToken("a.b.c"), null);
});

// The domain-separation check, and the reason this module is not just a call to
// buildUnsubscribeToken(). An unsubscribe URL is published in every message's
// List-Unsubscribe header, so it reaches providers, gateways and archives that
// never see the body. If the two schemes agreed, a scraped unsubscribe URL could
// be POSTed here to manufacture consent evidence for that address.
check("an unsubscribe token is not a valid re-confirmation token", () => {
  const unsubscribe = buildUnsubscribeToken(EMAIL);
  assert.ok(unsubscribe, "expected an unsubscribe token");
  assert.strictEqual(verifyUnsubscribeToken(unsubscribe), hashEmail(EMAIL));
  assert.strictEqual(
    verifyReconfirmToken(unsubscribe),
    null,
    "an unsubscribe token must not re-confirm anybody"
  );
});

check("a re-confirmation token is not a valid unsubscribe token", () => {
  const reconfirm = buildReconfirmToken(EMAIL);
  assert.strictEqual(
    verifyUnsubscribeToken(reconfirm),
    null,
    "the two schemes must not be interchangeable in either direction"
  );
});

check("no secret degrades to no token rather than a forgeable one", () => {
  const previous = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  process.env.EMAIL_UNSUBSCRIBE_SECRET = "";
  try {
    assert.strictEqual(buildReconfirmToken(EMAIL), null);
    assert.strictEqual(verifyReconfirmToken("anything.atall"), null);
  } finally {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = previous;
  }
});

check("a token signed with a different secret is rejected", () => {
  const token = buildReconfirmToken(EMAIL)!;
  const previous = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  process.env.EMAIL_UNSUBSCRIBE_SECRET = "a-different-secret";
  try {
    assert.strictEqual(verifyReconfirmToken(token), null);
  } finally {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = previous;
  }
});

// ---------------------------------------------------------------------------
// The rule
// ---------------------------------------------------------------------------

/** The happy path, which every refusal below is one mutation away from. */
const MAILABLE = {
  currentStatus: "subscribed" as SubscriberStatus,
  optoutReason: null,
  registerSuppressed: false,
};

check("a currently-subscribed, unsuppressed row may re-confirm", () => {
  assert.deepStrictEqual(decideReconfirm(MAILABLE), { decision: "reconfirm" });
});

check("a spam complaint is terminal, from either store", () => {
  assert.deepStrictEqual(
    decideReconfirm({ ...MAILABLE, currentStatus: "complained" }),
    { decision: "refuse", reason: "not-subscribed" }
  );
  // The nastier shape: the row still reads `subscribed` because the two stores
  // have drifted, and only `email_optouts` knows about the complaint.
  assert.deepStrictEqual(
    decideReconfirm({ ...MAILABLE, optoutReason: "complaint" }),
    { decision: "refuse", reason: "runtime-suppressed" }
  );
});

check("an unsubscribed or bounced row is not silently re-admitted", () => {
  for (const status of ["unsubscribed", "bounced"] as SubscriberStatus[]) {
    assert.deepStrictEqual(
      decideReconfirm({ ...MAILABLE, currentStatus: status }),
      { decision: "refuse", reason: "not-subscribed" },
      `${status} must be refused — the way back is the subscribe form, and only that`
    );
  }
});

check("a pending row cannot skip its double opt-in through this route", () => {
  assert.deepStrictEqual(decideReconfirm({ ...MAILABLE, currentStatus: "pending" }), {
    decision: "refuse",
    reason: "not-subscribed",
  });
});

check("an address with no row cannot be created by re-confirming", () => {
  for (const missing of [null, undefined]) {
    assert.deepStrictEqual(decideReconfirm({ ...MAILABLE, currentStatus: missing }), {
      decision: "refuse",
      reason: "no-row",
    });
  }
});

check("any runtime opt-out reason refuses, not only a complaint", () => {
  for (const reason of ["one-click", "bounce", "manual", "complaint"]) {
    assert.strictEqual(
      decideReconfirm({ ...MAILABLE, optoutReason: reason }).decision,
      "refuse",
      `${reason}: a row that is subscribed AND opted out is drift, and drift must ` +
        "never be resolved in the direction of mailing somebody"
    );
  }
});

// THE resurrection edge. `selectMailable()` re-admits a suppressed subscriber
// whose `confirmedAt` is later than the suppression covering them, and this
// route writes `confirmedAt = now`, which is later than everything. The sequence
// is ordinary: the issue goes out on the 1st, they unsubscribe in Mailchimp on
// the 3rd, `suppression.ts pull-mailchimp` stamps the register on the 5th — the
// table's `status` never moves, because the pull writes the register, not the
// table — and they press the button in that same open email on the 6th.
check("a row on the committed register cannot re-confirm its way back", () => {
  assert.deepStrictEqual(
    decideReconfirm({ ...MAILABLE, registerSuppressed: true }),
    { decision: "refuse", reason: "register-suppressed" },
    "this is the whole resurrection edge: status is still `subscribed`, and only " +
      "the committed register knows they have gone"
  );
});

check("the rule refuses everything that is not exactly one mailable shape", () => {
  // Exhaustive over the cross product, so a later branch cannot be added that
  // says yes to something the three conditions above should have caught.
  const statuses: (SubscriberStatus | null)[] = [
    null,
    "pending",
    "subscribed",
    "unsubscribed",
    "bounced",
    "complained",
  ];
  for (const status of statuses) {
    for (const optout of [null, "one-click", "bounce", "complaint", "manual"]) {
      for (const suppressed of [false, true]) {
        const expected =
          status === "subscribed" && optout === null && suppressed === false
            ? "reconfirm"
            : "refuse";
        assert.strictEqual(
          decideReconfirm({
            currentStatus: status,
            optoutReason: optout,
            registerSuppressed: suppressed,
          }).decision,
          expected,
          `status=${status} optout=${optout} suppressed=${suppressed}`
        );
      }
    }
  }
});

// The invariant the strictness buys, stated as a test rather than as a comment.
// `selectMailable()` excludes anyone on a register unless their existing
// `confirmedAt` already outranks it; this rule excludes anyone on a register
// full stop. So the set of addresses this route will write to is a subset of the
// set that is already mailable, which is what makes "it cannot make a
// non-mailable address mailable" true by construction rather than by review.
check("re-confirmation is refused for every input selectMailable would exclude", () => {
  const suppressedInEitherStore = [
    { ...MAILABLE, optoutReason: "one-click" },
    { ...MAILABLE, optoutReason: "complaint" },
    { ...MAILABLE, registerSuppressed: true },
    { ...MAILABLE, optoutReason: "bounce", registerSuppressed: true },
  ];
  for (const context of suppressedInEitherStore) {
    assert.strictEqual(decideReconfirm(context).decision, "refuse");
  }
});

// ---------------------------------------------------------------------------
// The consent sentence
// ---------------------------------------------------------------------------

const MAILCHIMP_PROVENANCE =
  "Mailchimp audience export 2026-08-17, CONFIRM_TIME 2019-04-02T09:11:00Z";

check("the original provenance survives a re-confirmation", () => {
  const next = appendReconfirmSentence(
    MAILCHIMP_PROVENANCE,
    ISSUE,
    new Date("2026-09-06T21:30:00Z")
  );
  assert.ok(next, "expected a new sentence");
  assert.ok(
    next.startsWith(MAILCHIMP_PROVENANCE),
    "overwriting the origin would answer 'why is this person on our list?' less " +
      "completely than before"
  );
});

check("the sentence names the act, the issue and the date", () => {
  const next = appendReconfirmSentence(
    MAILCHIMP_PROVENANCE,
    ISSUE,
    new Date("2026-09-06T21:30:00Z")
  )!;
  assert.match(next, /Re-confirmed by the subscriber/);
  assert.match(next, /2026-09 newsletter/);
  assert.match(next, /on 2026-09-06/);
  assert.match(next, /\/newsletter\/reconfirm/);
});

check("a second press from the same issue appends nothing", () => {
  const first = appendReconfirmSentence(MAILCHIMP_PROVENANCE, ISSUE, new Date())!;
  assert.strictEqual(
    appendReconfirmSentence(first, ISSUE, new Date()),
    null,
    "a repeat press must not grow the column without bound"
  );
});

check("a press from a later issue is recorded as its own act", () => {
  const first = appendReconfirmSentence(MAILCHIMP_PROVENANCE, "2026-09", new Date())!;
  const second = appendReconfirmSentence(first, "2026-10", new Date());
  assert.ok(second, "a different issue is a different act and must be recorded");
  assert.match(second, /\[reconfirm:2026-09\]/);
  assert.match(second, /\[reconfirm:2026-10\]/);
});

check("a link with no issue is recorded honestly rather than attributed", () => {
  const next = appendReconfirmSentence(MAILCHIMP_PROVENANCE, null, new Date())!;
  assert.match(next, /did not identify its issue/);
  assert.ok(!/\[reconfirm:20/.test(next.split("|")[1] ?? ""), "must not invent an issue id");
});

// ---------------------------------------------------------------------------
// The link that ships in the newsletter
// ---------------------------------------------------------------------------

check("the placeholder is not brace-delimited", () => {
  // `gateMergeTags` fails any unknown {{…}} / {{{…}}} tag, and a marketing send
  // that cannot pass the gates cannot ship.
  assert.ok(!RECONFIRM_URL_PLACEHOLDER.includes("{{"));
  assert.ok(!RECONFIRM_URL_PLACEHOLDER.includes("}}"));
});

check("the URL uses ?t=, which the secret scanner tolerates", () => {
  // `gateSecrets` fails a body containing `?token=` on the assumption it is a
  // leaked credential. Naming the parameter `token` would block every send.
  const url = reconfirmUrlFor(EMAIL, BASE, ISSUE)!;
  assert.ok(url.includes("?t="), url);
  assert.ok(!/[?&]token=/.test(url), "?token= would fail gateSecrets");
});

check("the URL points at the page, not the API", () => {
  const url = reconfirmUrlFor(EMAIL, BASE, ISSUE)!;
  assert.ok(url.startsWith(`${BASE}/newsletter/reconfirm?`), url);
  assert.ok(!url.includes("/api/"), "a link scanner must reach a page, not a write route");
});

check("the URL carries the issue and no address", () => {
  const url = reconfirmUrlFor(EMAIL, BASE, ISSUE)!;
  assert.ok(url.includes(`&i=${ISSUE}`), url);
  assert.ok(!url.includes("someone"), "the address must never travel in the URL");
});

check("substitution replaces every occurrence with a signed URL", () => {
  const body = `${RECONFIRM_URL_PLACEHOLDER} and again ${RECONFIRM_URL_PLACEHOLDER}`;
  const out = substituteReconfirmUrl(body, EMAIL, BASE, ISSUE);
  assert.ok(!out.includes(RECONFIRM_URL_PLACEHOLDER));
  assert.strictEqual(out.split("/newsletter/reconfirm?t=").length - 1, 2);
});

check("content without a placeholder is returned untouched", () => {
  const body = "<p>No ask in this issue.</p>";
  assert.strictEqual(substituteReconfirmUrl(body, EMAIL, BASE, ISSUE), body);
});

check("two recipients get two different links", () => {
  const a = substituteReconfirmUrl(RECONFIRM_URL_PLACEHOLDER, "a@example.com", BASE, ISSUE);
  const b = substituteReconfirmUrl(RECONFIRM_URL_PLACEHOLDER, "b@example.com", BASE, ISSUE);
  assert.notStrictEqual(a, b);
});

check("a substituted URL round-trips back to that recipient's hash", () => {
  const out = substituteReconfirmUrl(RECONFIRM_URL_PLACEHOLDER, EMAIL, BASE, ISSUE);
  const token = out.split("?t=")[1].split("&")[0];
  assert.strictEqual(verifyReconfirmToken(token), hashEmail(EMAIL));
});

check("substitution throws when no token can be signed", () => {
  const previous = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  process.env.EMAIL_UNSUBSCRIBE_SECRET = "";
  try {
    assert.throws(() =>
      substituteReconfirmUrl(RECONFIRM_URL_PLACEHOLDER, EMAIL, BASE, ISSUE)
    );
  } finally {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = previous;
  }
});

// ---------------------------------------------------------------------------
// Source-level invariants
// ---------------------------------------------------------------------------

const reconfirmSource = readFileSync(
  fileURLToPath(new URL("./reconfirm.ts", import.meta.url)),
  "utf8"
);

check("the write never touches `source`", () => {
  // `source` names the route the person arrived by. A re-confirmation is not a
  // new arrival but fresh evidence about an existing one, so rewriting it would
  // erase how they actually got onto the list — leaving a record that answers
  // "why is this person on our list?" with only the later half of the truth.
  const setBlock = reconfirmSource.slice(
    reconfirmSource.indexOf(".update(newsletterSubscribers)")
  );
  assert.ok(
    !/^\s*source:/m.test(setBlock),
    "the UPDATE must not assign `source`"
  );
});

check("the write re-asserts `subscribed` in its WHERE", () => {
  // Not belt-and-braces: a one-click unsubscribe arriving between the read and
  // the write has to win, and that is exactly the race where losing is worst.
  assert.ok(
    /eq\(newsletterSubscribers\.status, "subscribed"\)/.test(reconfirmSource),
    "the guarded UPDATE is what makes the read-then-write safe"
  );
});

const routeSource = readFileSync(
  fileURLToPath(new URL("../../app/api/newsletter/reconfirm/route.ts", import.meta.url)),
  "utf8"
);

check("the endpoint exports no GET handler", () => {
  // The single most important property of this route. A GET would let corporate
  // link scanners stamp `confirmedAt` on behalf of people who never pressed
  // anything, fabricating the evidence the whole feature exists to collect.
  assert.ok(/export async function POST/.test(routeSource), "expected a POST handler");
  assert.ok(
    !/export (async )?function GET/.test(routeSource),
    "a GET handler on this route would manufacture consent"
  );
});

// ---------------------------------------------------------------------------
// The block in the newsletter itself
// ---------------------------------------------------------------------------

/**
 * Runs one named async check.
 *
 * @param name What is being asserted.
 * @param fn The assertion body.
 */
async function checkAsync(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL - ${name}`);
    console.error(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** A real committed issue, with the ask switched on. */
function issueWithAsk(askToReconfirm: boolean): NewsletterIssueData {
  const issue = getIssue("2026-08");
  assert.ok(issue, "expected the 2026-08 issue to be registered");
  return newsletterIssueSchema.parse({
    ...issue,
    editorial: { ...issue.editorial, askToReconfirm },
  });
}

/** The render checks, which are the only async ones. */
async function main(): Promise<void> {
  await checkAsync("the ask renders in broadcast mode when the issue opts in", async () => {
  const broadcast = await renderNewsletter(issueWithAsk(true), "broadcast");
  assert.ok(
    broadcast.html.includes(RECONFIRM_URL_PLACEHOLDER),
    "broadcast html must carry the placeholder for the send path to substitute"
  );
  assert.ok(
    broadcast.text.includes(RECONFIRM_URL_PLACEHOLDER),
    "the plain-text part must carry it too — react-email writes the raw href there, " +
      "so substituting only the HTML would ship literal text to plain-text readers"
  );
});

  await checkAsync("an issue that does not opt in carries no ask at all", async () => {
  const broadcast = await renderNewsletter(issueWithAsk(false), "broadcast");
  assert.ok(!broadcast.html.includes(RECONFIRM_URL_PLACEHOLDER));
  assert.ok(!broadcast.text.includes(RECONFIRM_URL_PLACEHOLDER));
});

  await checkAsync("preview mode omits the ask entirely", async () => {
  // The on-site archive at /resources/newsletters/<issue> serves the preview
  // render to anybody. A live token cannot exist there, and an inert
  // "confirm my subscription" button on a public page is a consent control that
  // does nothing — worse than an honest absence.
  const preview = await renderNewsletter(issueWithAsk(true), "preview");
  assert.ok(!preview.html.includes(RECONFIRM_URL_PLACEHOLDER));
  assert.ok(!preview.html.includes("Yes, keep sending it"));
});
}

// ---------------------------------------------------------------------------

main().then(() => {
  console.log("");
  if (failures > 0) {
    console.error(`${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("All re-confirmation checks passed.");
});
