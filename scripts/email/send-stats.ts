/**
 * Reports what happened to one tagged send, against the limits that can close
 * the account.
 *
 * This is the read side of the `email_events` table. It exists because Resend's
 * Acceptable Use Policy sets an **account-wide complaint ceiling of 0.08%** —
 * about 1.25 complaints on a 1,545-recipient newsletter — and breaching it means
 * the account "may be shut down without warning", which would take password
 * resets and donation receipts down with the newsletter. Before this existed
 * there was no denominator anywhere in the codebase: complaints arrived one at a
 * time, suppressed one address each, and nothing could say what fraction of a
 * send they were.
 *
 * What it will not do:
 *  - **Print an address.** Counts and truncated hashes only, so the output can
 *    go straight into a plan block, a PR or Slack.
 *  - **Compare open rates across the Apple Mail Privacy Protection boundary.**
 *    Mailchimp's history reports two unique-open series that are identical for
 *    every campaign before 2022 and diverge after it, so the baseline below
 *    prints both and names the break. Picking one and staying on it is the
 *    caller's job; this at least refuses to hide the choice.
 *  - **Distinguish a hard bounce from a soft one.** `email_events` stores
 *    Resend's event type, and `email.bounced` covers both, so the bounce rate
 *    printed here is an **upper bound** on the hard-bounce rate. An upper bound
 *    fails loudly rather than passing quietly, which is the right direction for
 *    a limit, but it is not the same number and is labelled as such.
 *
 * Usage:
 *   npx tsx scripts/email/send-stats.ts --tag newsletter:2026-08 [--json]
 *
 * Flags:
 *   --tag    The issue tag stored on the events, exactly as
 *            `scripts/newsletter/build-newsletter-batch.ts` stamped it
 *            ("newsletter:<YYYY-MM>"). Bare "2026-08" is accepted and prefixed.
 *   --json   Machine-readable summary instead of prose.
 */

import "dotenv/config";

import { mailchimpCampaigns } from "../../lib/data/mailchimp";
import { client } from "../../lib/db/drizzle";
import { countEventsByTag, listIssueTags } from "../../lib/email/events";

/**
 * Resend's AUP ceilings, as percentages.
 *
 * `COMPLAINT_CEILING` is account-wide, not per-send: transactional volume
 * dilutes the denominator Resend actually measures, so a send that passes here
 * has not proved the account is safe — it has only proved this send is not the
 * thing that breaks it.
 */
const COMPLAINT_CEILING = 0.08;
const BOUNCE_CEILING = 4;

/**
 * This repo's own, stricter trigger, from `docs/deployment/EMAIL_AUTHENTICATION.md`.
 *
 * Printed alongside the AUP figure because passing Resend's limit while
 * tripping our own is a real state, and the document says that state is meant
 * to start a conversation about splitting the sending domain.
 */
const HOUSE_COMPLAINT_TRIGGER = 0.1;
const HOUSE_BOUNCE_TRIGGER = 2;

interface Args {
  tag: string;
  json: boolean;
}

/** Prints an error and exits. */
function fail(...lines: string[]): never {
  console.error(`Error: ${lines[0]}`);
  for (const line of lines.slice(1)) console.error(`  ${line}`);
  process.exit(1);
}

/** Reads a flag's value from argv. */
function readOption(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

/** Parses and validates the command line. */
function parseArgs(argv: string[]): Args {
  const raw = readOption(argv, "--tag");
  if (!raw) {
    fail(
      "--tag is required.",
      'The issue tag stored on the events, e.g. --tag newsletter:2026-08',
      "Run with a tag you have sent; the script lists known tags when one is unknown."
    );
  }
  // A bare "2026-08" is what a person types; the stored value carries the
  // prefix, and a silent zero would look exactly like a send nobody opened.
  const tag = raw.includes(":") ? raw : `newsletter:${raw}`;
  return { tag, json: argv.includes("--json") };
}

/** Formats a percentage to two decimals, or "—" when there is no denominator. */
function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${((numerator / denominator) * 100).toFixed(3)}%`;
}

/** PASS/OVER against a ceiling, with the ceiling restated so it is auditable. */
function verdict(numerator: number, denominator: number, ceiling: number): string {
  if (denominator === 0) return "no data";
  const rate = (numerator / denominator) * 100;
  return `${rate <= ceiling ? "PASS" : "OVER"} (limit ${ceiling}%)`;
}

/**
 * The pre-migration Mailchimp baseline, and the boundary it must not be read
 * across.
 *
 * The two unique-open series are equal for every campaign sent before Apple Mail
 * Privacy Protection started pre-fetching images; the first year in which they
 * differ is computed here rather than hardcoded, so the caveat cannot drift away
 * from the data it describes.
 */
function mailchimpBaseline() {
  const totals = mailchimpCampaigns.totals;
  const firstDivergentYear =
    mailchimpCampaigns.bySendYear.find(
      (year) => year.uniqueOpens !== year.proxyExcludedUniqueOpens
    )?.year ?? null;

  return {
    campaignsSent: totals.campaignsSent,
    emailsSent: totals.emailsSent,
    uniqueOpenRate: (totals.uniqueOpens / totals.emailsSent) * 100,
    proxyExcludedUniqueOpenRate:
      (totals.proxyExcludedUniqueOpens / totals.emailsSent) * 100,
    uniqueClickRate: (totals.uniqueClicks / totals.emailsSent) * 100,
    complaintRate: (totals.abuseReports / totals.emailsSent) * 100,
    hardBounceRate: (totals.hardBounces / totals.emailsSent) * 100,
    firstDivergentYear,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const counts = await countEventsByTag(args.tag);
  const people = (type: string) => counts.find((row) => row.type === type)?.people ?? 0;
  const events = (type: string) => counts.find((row) => row.type === type)?.events ?? 0;

  const sent = people("email.sent");
  const delivered = people("email.delivered");
  const opened = people("email.opened");
  const clicked = people("email.clicked");
  const bounced = people("email.bounced");
  const complained = people("email.complained");
  const failed = people("email.failed");

  /**
   * Complaints are measured against what actually arrived.
   *
   * A message that bounced could not be reported as spam, so including it in
   * the denominator would flatter the rate. `delivered` is the honest base;
   * `sent` stands in only while delivered events are absent — which they will be
   * until the `email.delivered` event is ticked on the webhook endpoint.
   */
  const base = delivered > 0 ? delivered : sent;
  const baseLabel = delivered > 0 ? "delivered" : "sent";

  const baseline = mailchimpBaseline();

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          tag: args.tag,
          counts: {
            sent,
            delivered,
            opened,
            clicked,
            bounced,
            complained,
            failed,
            openEvents: events("email.opened"),
            clickEvents: events("email.clicked"),
          },
          rates: {
            base,
            baseLabel,
            complaintPct: base === 0 ? null : (complained / base) * 100,
            complaintCeilingPct: COMPLAINT_CEILING,
            complaintVerdict: verdict(complained, base, COMPLAINT_CEILING),
            bounceUpperBoundPct: sent === 0 ? null : (bounced / sent) * 100,
            bounceCeilingPct: BOUNCE_CEILING,
            bounceVerdict: verdict(bounced, sent, BOUNCE_CEILING),
            houseComplaintTriggerPct: HOUSE_COMPLAINT_TRIGGER,
            houseBounceTriggerPct: HOUSE_BOUNCE_TRIGGER,
            uniqueOpenPct: base === 0 ? null : (opened / base) * 100,
            uniqueClickPct: base === 0 ? null : (clicked / base) * 100,
          },
          mailchimpBaseline: baseline,
          caveats: [
            "email.bounced covers hard and transient bounces, so the bounce rate is an upper bound on the hard-bounce rate.",
            `Mailchimp's two unique-open series are equal before ${baseline.firstDivergentYear ?? "the Apple MPP boundary"} and diverge after it; pick one series and stay on it.`,
            "The Resend complaint ceiling is account-wide, not per-send.",
          ],
        },
        null,
        2
      )
    );
    await client.end();
    return;
  }

  console.log("");
  console.log(`  Send: ${args.tag}`);
  console.log("");

  if (counts.length === 0) {
    console.log("  No events stored for this tag.");
    console.log("");
    console.log("  That is not the same as a send nobody opened. Check, in order:");
    console.log("    1. the tag spelling — known tags with events are listed below;");
    console.log("    2. that the Resend webhook endpoint has the sent/delivered/");
    console.log("       opened/clicked events ticked;");
    console.log("    3. that open and click tracking is enabled on the sending domain.");
    const known = await listIssueTags();
    console.log("");
    if (known.length === 0) {
      console.log("  No tagged events have ever been stored.");
    } else {
      console.log("  Tags with stored events:");
      for (const row of known) console.log(`    ${row.issueTag}  (${row.events} events)`);
    }
    console.log("");
    await client.end();
    return;
  }

  console.log(`  Sent             ${sent}`);
  console.log(`  Delivered        ${delivered}`);
  console.log(`  Failed           ${failed}`);
  console.log(`  Opened           ${opened}  (${events("email.opened")} open events)`);
  console.log(`  Clicked          ${clicked}  (${events("email.clicked")} click events)`);
  console.log(`  Bounced          ${bounced}`);
  console.log(`  Complained       ${complained}`);
  console.log("");
  console.log(`  Rates are over ${base} ${baseLabel} recipients, counting people not events.`);
  console.log("");
  console.log(
    `  Complaint rate   ${pct(complained, base)}   ${verdict(complained, base, COMPLAINT_CEILING)}`
  );
  console.log(
    `                   Resend's ceiling is account-wide; our own trigger is ${HOUSE_COMPLAINT_TRIGGER}%.`
  );
  console.log(
    `  Bounce rate      ${pct(bounced, sent)}   ${verdict(bounced, sent, BOUNCE_CEILING)}`
  );
  console.log(
    `                   UPPER BOUND on the hard-bounce rate: email.bounced covers`
  );
  console.log(
    `                   transient bounces too. Our own trigger is ${HOUSE_BOUNCE_TRIGGER}%.`
  );
  console.log("");
  console.log(`  Unique open      ${pct(opened, base)}`);
  console.log(`  Unique click     ${pct(clicked, base)}`);
  console.log("");
  console.log("  Mailchimp baseline, for context only:");
  console.log(
    `    ${baseline.campaignsSent} sends, ${baseline.emailsSent.toLocaleString("en-NZ")} emails, 2019-2026.`
  );
  console.log(`    Unique open  ${baseline.uniqueOpenRate.toFixed(1)}%  as Mailchimp reported it`);
  console.log(
    `                 ${baseline.proxyExcludedUniqueOpenRate.toFixed(1)}%  with Apple's proxy opens excluded`
  );
  console.log(`    Unique click ${baseline.uniqueClickRate.toFixed(1)}%`);
  console.log(`    Complaints   ${baseline.complaintRate.toFixed(3)}%`);
  console.log("");
  console.log(
    `    The two open figures are IDENTICAL for every campaign before ${baseline.firstDivergentYear ?? "the boundary"}`
  );
  console.log(
    "    and diverge after it, because Apple Mail Privacy Protection pre-fetches"
  );
  console.log(
    "    images and registers opens nobody performed. Pick one series and stay on"
  );
  console.log(
    "    it; a comparison that crosses the break is measuring Apple, not readers."
  );
  console.log("");

  await client.end();
}

main().catch((error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
