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
 * Two things it will not do:
 *  - **Print an address.** Counts and truncated hashes only, so the output can
 *    go straight into a plan block, a PR or Slack.
 *  - **Hand the reader a boundary year for Apple Mail Privacy Protection.**
 *    Mailchimp reports two unique-open series and the baseline prints both, with
 *    the caveat in words. It deliberately does not name the year they first
 *    differ: that difference is one open in 8,811, a precise number that
 *    misleads, while the gap that would change a decision opens up later and
 *    gradually. The honest instruction is "pick one series and stay on it", and
 *    that is what it prints.
 *
 * Hard and transient bounces are reported **separately**, which is why
 * `email_events.bounce_type` exists. A ramped first send produces routine
 * transient bounces — full mailboxes, greylisting — and folding them into the
 * hard-bounce rate would report OVER against the house 2% trigger on a send
 * that is entirely healthy. A monitor that cries wolf on its first outing is one
 * nobody reads by the third batch.
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
import { countBouncesByTag, countEventsByTag, listIssueTags } from "../../lib/email/events";

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
 * The pre-migration Mailchimp baseline, for context only.
 *
 * Both unique-open series are returned and neither is presented as *the* number.
 * They were effectively identical while Apple Mail Privacy Protection did not
 * exist and separate materially once it did, so the corrected series is the one
 * to compare a self-hosted send against — and a comparison has to pick one
 * series and stay on it either way.
 *
 * No boundary year is computed. Any single year would be a precise-looking
 * answer to a question that does not have one: the series first differ by a
 * rounding error and only diverge meaningfully later.
 */
function mailchimpBaseline() {
  const totals = mailchimpCampaigns.totals;

  return {
    campaignsSent: totals.campaignsSent,
    emailsSent: totals.emailsSent,
    uniqueOpenRate: (totals.uniqueOpens / totals.emailsSent) * 100,
    proxyExcludedUniqueOpenRate:
      (totals.proxyExcludedUniqueOpens / totals.emailsSent) * 100,
    uniqueClickRate: (totals.uniqueClicks / totals.emailsSent) * 100,
    complaintRate: (totals.abuseReports / totals.emailsSent) * 100,
    hardBounceRate: (totals.hardBounces / totals.emailsSent) * 100,
    softBounceRate: (totals.softBounces / totals.emailsSent) * 100,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const counts = await countEventsByTag(args.tag);
  // Serial, not Promise.all: Neon throttles concurrent connection attempts.
  const bounces = await countBouncesByTag(args.tag);
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
   * Whether opens and clicks were measured at all.
   *
   * Open and click tracking is OFF on the sending domain by decision
   * (`docs/deployment/EMAIL_AUTHENTICATION.md` → "Open and click tracking"), and
   * neither event can fire without it. So a send with deliveries and no
   * engagement events was not ignored — it was not measured, and the two are
   * different findings. Reporting the first as `0%` is a precise number that
   * misleads, and the misreading is expensive: somebody watching a ramp sees a
   * 0% open rate, concludes the mail is landing in spam, and halts a send that
   * is healthy.
   *
   * Inferred rather than queried on purpose: this is a database report, and
   * making it fail when the network is down — or when Resend's API is — to
   * annotate a caveat would trade a working tool for a footnote.
   */
  const engagementMeasured = !(opened === 0 && clicked === 0);

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
            hardBounced: bounces.hard,
            transientBounced: bounces.transient,
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
            hardBouncePct: sent === 0 ? null : (bounces.hard / sent) * 100,
            transientBouncePct: sent === 0 ? null : (bounces.transient / sent) * 100,
            hardBounceCeilingPct: BOUNCE_CEILING,
            hardBounceVerdict: verdict(bounces.hard, sent, BOUNCE_CEILING),
            houseComplaintTriggerPct: HOUSE_COMPLAINT_TRIGGER,
            houseBounceTriggerPct: HOUSE_BOUNCE_TRIGGER,
            // `null` already means "cannot be computed" here, so an unmeasured
            // engagement rate uses it rather than reporting a measured-looking
            // zero. `engagementMeasured` lets a consumer tell the two nulls
            // apart: no recipients, versus tracking switched off.
            engagementMeasured,
            uniqueOpenPct: base === 0 || !engagementMeasured ? null : (opened / base) * 100,
            uniqueClickPct: base === 0 || !engagementMeasured ? null : (clicked / base) * 100,
          },
          mailchimpBaseline: baseline,
          caveats: [
            "Transient bounces (full mailbox, greylist) are excluded from the hard-bounce rate and reported separately; they are not suppressed either, so the two agree.",
            "A bounce whose type Resend did not give counts as hard, matching what suppression does.",
            "Mailchimp's corrected unique-open series is the one to compare against. The two series were effectively identical before Apple Mail Privacy Protection existed and separate materially afterwards; pick one and stay on it.",
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
  console.log(`  Bounced          ${bounced}  (${bounces.hard} hard, ${bounces.transient} transient)`);
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
    `  Hard bounce      ${pct(bounces.hard, sent)}   ${verdict(bounces.hard, sent, BOUNCE_CEILING)}`
  );
  console.log(
    `                   Permanent bounces only, over ${sent} sent. Our own trigger is ${HOUSE_BOUNCE_TRIGGER}%.`
  );
  console.log(
    `                   A bounce Resend gave no type for counts here, matching`
  );
  console.log(`                   what suppression does.`);
  console.log(`  Transient bounce ${pct(bounces.transient, sent)}   (not a ceiling)`);
  console.log(
    `                   Full mailboxes and greylisting. Routine on a ramped send,`
  );
  console.log(
    `                   excluded from the rate above, and not suppressed either.`
  );
  console.log("");
  // See `engagementMeasured` above for why a zero is withheld rather than shown.
  if (base > 0 && !engagementMeasured) {
    console.log("  Unique open      not measured");
    console.log("  Unique click     not measured");
    console.log("                   No open or click events were stored. Unless tracking");
    console.log("                   has been enabled since, neither can fire — this is a");
    console.log("                   0 that means 'not measured', not 'nobody opened'.");
    console.log("                   Delivery, bounces and complaints above need no");
    console.log("                   tracking and ARE measured.");
  } else {
    console.log(`  Unique open      ${pct(opened, base)}`);
    console.log(`  Unique click     ${pct(clicked, base)}`);
  }
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
  console.log(
    `    Bounces      ${baseline.hardBounceRate.toFixed(1)}% hard, ${baseline.softBounceRate.toFixed(1)}% soft`
  );
  console.log("");
  console.log(
    "    Compare against the corrected figure. Apple Mail Privacy Protection"
  );
  console.log(
    "    pre-fetches images and registers opens nobody performed: the two series"
  );
  console.log(
    "    were effectively identical before it existed and separate materially"
  );
  console.log(
    "    afterwards. Pick one series and stay on it — a comparison that mixes"
  );
  console.log("    them is measuring Apple, not readers.");
  console.log("");

  await client.end();
}

main().catch((error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
