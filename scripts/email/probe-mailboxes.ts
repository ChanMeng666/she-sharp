/**
 * Answers "does this She Sharp mailbox exist?" by sending to it and reading
 * the result back.
 *
 * The organisation publishes addresses on its contact page, its policy pages
 * and inside the notice on every event page. Whether those addresses were ever
 * created in Google Workspace is not knowable from this repository, and in
 * August 2026 it turned out that nine of them never had been: `hello@`,
 * `conduct@`, `security@`, `support@`, `privacy@`, `accessibility@`, `legal@`,
 * `unsub@` and `workshops@` all hard-bounced. They had been invented by page
 * templates in 2025 and printed ever since. On 2026-08-13 an external
 * correspondent reported through the contact form that mail to She Sharp had
 * bounced back — she did not name the address, so treat that as the symptom
 * that prompted this rather than as one of the nine.
 *
 * Mail for `shesharp.org.nz` is hosted on Google Workspace, which rejects an
 * unknown recipient at SMTP time with a 550. So sending one message per
 * candidate and reading Resend's `last_event` is a definitive existence test,
 * and it is not a loopback: Resend delivers to `aspmx.l.google.com` exactly
 * like any outside sender would.
 *
 * **This tests delivery, not attention.** `newsletter@` accepts mail and
 * nobody on the team has its password; a `delivered` verdict says an address
 * exists, never that a human opens it. Who reads what is recorded, with its
 * evidence, in `docs/development/EMAIL_ADDRESSES.md`.
 *
 * **The falsification condition:** if every address comes back `delivered`,
 * the probe has proved nothing — that is what a Google Workspace catch-all
 * ("Default routing") looks like from outside, and the answer then has to come
 * from `admin.google.com`. The expected column below is the control: if a
 * known-live address bounces, or a known-dead one delivers, distrust the run.
 *
 * It deliberately does not use `lib/email/service.ts`. `sendEmail()` returns a
 * boolean and drops the Resend id this script must poll, it reads the
 * suppression table (so it opens a database connection), and in development
 * with no API key it writes a file to `tmp/` and reports success — a probe
 * that reports "sent" without sending is the exact failure being investigated.
 *
 * Two things to know before rerunning it. Resend keeps its own suppression
 * list, so a repeat send to an address that has already hard-bounced may be
 * dropped without producing a fresh event; treat a second run as advisory.
 *
 * And in production the bounce webhook (`app/api/webhooks/resend/route.ts`)
 * turns every hard bounce into an `email_optouts` row keyed on the address
 * hash. That is correct for the runtime table and a useful second record of
 * this run, but those rows must never reach the committed do-not-contact
 * register — She Sharp cannot opt out of its own mail.
 * `scripts/email/suppression.ts sync` skips them by hash, using the same list
 * this script probes (`./own-mailboxes`), and says how many it skipped. That
 * guard is why this paragraph is a description rather than an instruction: the
 * first run of this probe created nine such rows, and a plain sync afterwards
 * would have written nine of the organisation's own addresses into the
 * register permanently.
 *
 * Usage:
 *   RESEND_API_KEY=... npx tsx scripts/email/probe-mailboxes.ts            # dry run
 *   RESEND_API_KEY=... npx tsx scripts/email/probe-mailboxes.ts --send
 *   RESEND_API_KEY=... npx tsx scripts/email/probe-mailboxes.ts --send --include-personal
 */

import { Resend } from "resend";
import { SENDING_DOMAIN, getSenderIdentity } from "../../lib/email/senders";
import {
  OWN_MAILBOXES,
  type MailboxExpectation,
} from "./own-mailboxes";

/** Resend statuses that mean the answer has not arrived yet. */
const PENDING = new Set(["queued", "scheduled", "sent"]);

const POLL_INTERVAL_MS = 10_000;
const POLL_DEADLINE_MS = 3 * 60_000;

const USAGE =
  "Usage: RESEND_API_KEY=... npx tsx scripts/email/probe-mailboxes.ts [--send] [--include-personal]";

function body(address: string): string {
  return [
    "This is an automated delivery check.",
    "",
    "She Sharp is confirming which @shesharp.org.nz mailboxes are live, so that",
    "the addresses printed on the website are ones somebody actually receives.",
    "",
    `Address probed: ${address}`,
    "",
    "No action is needed. Please ignore or delete this message.",
    "",
    "-- She Sharp website",
  ].join("\n");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => !["--send", "--include-personal"].includes(a));
  if (unknown.length > 0) {
    console.error(`Error: unrecognised argument ${unknown[0]}.\n${USAGE}`);
    process.exit(1);
  }

  const send = args.includes("--send");
  const includePersonal = args.includes("--include-personal");
  const candidates = OWN_MAILBOXES.filter((c) => includePersonal || !c.personal);

  // The From must be an approved sender or the identity gate's premise breaks.
  // `internal` is the right stream: this is mail to She Sharp's own mailboxes.
  const { from } = getSenderIdentity("internal");
  const replyTo = `website@${SENDING_DOMAIN}`;

  console.log(`From:     ${from}`);
  console.log(`Reply-To: ${replyTo}`);
  console.log(`Probing:  ${candidates.length} address(es)\n`);

  if (!send) {
    for (const c of candidates) {
      const address = `${c.local}@${SENDING_DOMAIN}`;
      console.log(`  ${address.padEnd(34)} expect ${c.expected.padEnd(8)} ${c.note}`);
    }
    console.log("\nDry run — nothing sent. Re-run with --send.");
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error(`Error: RESEND_API_KEY is not set.\n${USAGE}`);
    process.exit(1);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const sent: { address: string; id: string; expected: MailboxExpectation }[] = [];
  for (const c of candidates) {
    const address = `${c.local}@${SENDING_DOMAIN}`;
    const { data, error } = await resend.emails.send({
      from,
      to: address,
      replyTo,
      subject: `Mailbox delivery check (automated) - ${c.local}@`,
      text: body(address),
    });
    if (error || !data?.id) {
      console.error(`  send failed for ${address}: ${error?.message ?? "no id returned"}`);
      continue;
    }
    sent.push({ address, id: data.id, expected: c.expected });
  }

  console.log(`Sent ${sent.length} message(s). Polling for outcomes...\n`);

  const outcomes = new Map<string, string>();
  const started = Date.now();
  while (outcomes.size < sent.length && Date.now() - started < POLL_DEADLINE_MS) {
    await sleep(POLL_INTERVAL_MS);
    for (const s of sent) {
      if (outcomes.has(s.address)) continue;
      const { data } = await resend.emails.get(s.id);
      const event = data?.last_event;
      if (event && !PENDING.has(event)) outcomes.set(s.address, event);
    }
  }

  let surprises = 0;
  console.log("address                             last_event   verdict    expected");
  console.log("----------------------------------------------------------------------");
  for (const s of sent) {
    const event = outcomes.get(s.address) ?? "(no answer)";
    const verdict =
      event === "bounced" ? "MISSING" : event === "(no answer)" ? "UNKNOWN" : "EXISTS";
    const matches =
      (verdict === "MISSING" && s.expected === "missing") ||
      (verdict === "EXISTS" && s.expected === "exists");
    if (!matches) surprises += 1;
    console.log(
      `${s.address.padEnd(35)} ${event.padEnd(12)} ${verdict.padEnd(10)} ${s.expected}${matches ? "" : "   <-- CHANGED"}`
    );
  }

  console.log("");
  if (outcomes.size === sent.length && [...outcomes.values()].every((e) => e !== "bounced")) {
    console.log(
      "WARNING: nothing bounced. Either every address now exists, or Google\n" +
        "Workspace has Default routing (a catch-all) turned on, in which case this\n" +
        "run proves nothing. Check admin.google.com before trusting it."
    );
  }
  console.log(
    surprises === 0
      ? "No change since the 2026-08-23 run."
      : `${surprises} address(es) changed since 2026-08-23 — update docs/development/EMAIL_ADDRESSES.md.`
  );
  console.log("\nReminder: `delivered` means the mailbox exists, not that anyone reads it.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
