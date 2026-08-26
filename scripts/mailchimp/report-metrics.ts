/**
 * Computes the Mailchimp figures the H1 2026 funder report needs, and writes
 * them out as paste-ready Typst.
 *
 * The twin of `scripts/humanitix/report-metrics.ts`, and deliberately built the
 * same way: it PRINTS rather than edits. `report/data/report-data.typ` is the
 * report's single swap surface and every `v()` note is an editorial claim
 * somebody signs; a script that rewrote it would be asserting provenance on a
 * person's behalf. The output goes to `tmp/mailchimp/` for a human to read.
 *
 * It needs the vault. The committed archive (`lib/data/json/mailchimp/`) holds
 * whole-file aggregates — `byOptinYear` is per YEAR, so 2026 mixes the half-year
 * being reported with the six weeks after it. A half-year figure has to come
 * from the timestamps on the rows, which are never committed.
 *
 * Three things it derives that no other source in this repository can:
 *
 *   1. The H1 flow — joins, unsubscribes and hard-bounce removals — rather than
 *      the standing total. A list that grew and a list that shrank both report
 *      "1,560 subscribed" at the end of the period.
 *   2. The same flow month by month, which is what says whether the direction
 *      held or turned inside the period.
 *   3. Location coverage, stated with its own hole: 42% of subscribed contacts
 *      carry no country at all, so any geographic claim has to name that first.
 *
 * **It no longer derives the campaign counts, and the header used to be wrong
 * about them.** Until 2026-08-27 it inferred sends from `UNSUB_CAMPAIGN_TITLE`
 * and `CLEAN_CAMPAIGN_TITLE`: a campaign appeared only if at least one
 * recipient had left or bounced on it, so every count was a FLOOR — and this
 * file claimed to be "the only send evidence in reach of this repository".
 * Both statements are now false. `lib/data/json/mailchimp/campaigns.json` holds
 * all 180 sends with their opens, clicks and bounces, pulled from the API, and
 * it is a TOTAL. Quoting a floor into a funder report while the total sits one
 * directory away is exactly the failure this script exists to prevent, so the
 * campaign section below reads the committed archive and the inference is gone.
 *
 * Usage:
 *   npx tsx scripts/mailchimp/report-metrics.ts
 *   npx tsx scripts/mailchimp/report-metrics.ts --from 2026-01-01 --to 2026-06-30
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readCsv } from "./csv";
import { REPO_ROOT, argValue, vaultExists } from "./vault";
import { campaignsSentBetween, mailchimpCampaigns, mailchimpManifest } from "../../lib/data/mailchimp";

/** The four status files are a partition — no address appears in two of them. */
const STATUS_FILES = {
  subscribed: "subscribed_email_audience_export_1a10653875.csv",
  unsubscribed: "unsubscribed_email_audience_export_1a10653875.csv",
  cleaned: "cleaned_email_audience_export_1a10653875.csv",
  nonsubscribed: "nonsubscribed_email_audience_export_1a10653875.csv",
} as const;

function requireVault(exportId: string) {
  if (!vaultExists(exportId)) {
    console.error(
      `This script needs the raw export. Vault not found for ${exportId}.\n` +
        `  Set MAILCHIMP_VAULT_DIR or place the CSVs in private/mailchimp/${exportId}/.\n` +
        `  The committed archive holds per-YEAR aggregates only; a half-year figure\n` +
        `  has to be read off the row timestamps, which are never committed.`
    );
    process.exit(1);
  }
}

/**
 * Mailchimp writes `2026-04-14 09:12:33` — lexicographically ordered, so a
 * string compare against an ISO date is exact and needs no Date parsing.
 * An empty cell must never fall inside the window; hence the explicit guard.
 */
function within(value: string | undefined, from: string, to: string): boolean {
  const stamp = String(value ?? "").trim();
  if (!stamp) return false;
  return stamp >= from && stamp <= `${to} 23:59:59`;
}

function monthOf(value: string | undefined): string {
  return String(value ?? "").slice(0, 7);
}

function tally(values: string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const value of values) out.set(value, (out.get(value) ?? 0) + 1);
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const from = argValue(argv, "--from") ?? "2026-01-01";
  const to = argValue(argv, "--to") ?? "2026-06-30";
  // The newest MANUAL CSV export, not simply the newest export. `exports` is
  // append-only and its last entry has been an API pull since 2026-08-27; this
  // script reads four status CSVs out of whatever this names, and an API
  // directory holds none of them.
  const exportId =
    argValue(argv, "--export") ??
    mailchimpManifest.exports
      .filter((entry) => (entry.method ?? "manual-csv") === "manual-csv")
      .at(-1)?.exportId ??
    "";

  requireVault(exportId);

  const subscribed = readCsv(exportId, STATUS_FILES.subscribed);
  const unsubscribed = readCsv(exportId, STATUS_FILES.unsubscribed);
  const cleaned = readCsv(exportId, STATUS_FILES.cleaned);
  const nonsubscribed = readCsv(exportId, STATUS_FILES.nonsubscribed);

  const lines: string[] = [];
  const say = (text = "") => lines.push(text);
  const note = (text: string) => `"${text.replace(/"/g, '\\"')}"`;

  const source = `the Mailchimp audience export ${exportId} (private/mailchimp/${exportId}/, hashes in lib/data/json/mailchimp/manifest.json)`;

  say(`// Mailchimp figures for ${from} .. ${to}`);
  say(`// Generated by scripts/mailchimp/report-metrics.ts from export ${exportId}.`);
  say(`//`);
  say(`// PASTE, DO NOT PIPE. Every v() note is a claim somebody signs.`);
  say();

  // ── The standing list ──────────────────────────────────────────────────────
  const emailable = subscribed.length;
  const lifetime =
    subscribed.length + unsubscribed.length + cleaned.length + nonsubscribed.length;

  say("// ---- the standing list ----");
  say(`newsletter-subscribers: v(`);
  say(`  ${emailable},`);
  say(
    `  ${note(`Contacts in the She# Mailchimp audience with status "subscribed" — the people who may lawfully be emailed. Read at the export date, ${exportId}, not at ${to}: Mailchimp exports a snapshot of the present, and the status column carries no history. The audience holds ${lifetime} contacts in total; the other ${lifetime - emailable} unsubscribed, hard-bounced, or never subscribed, and are suppression-hashed in lib/data/json/email-suppression-hashes.json so no future import can re-add them. Source: ${source}.`)},`
  );
  say(`),`);
  say();

  // ── The half-year flow ─────────────────────────────────────────────────────
  //
  // Standing totals hide direction. A list that grew by 200 and a list that
  // shrank by 200 both report the same number on the last day of the period.
  const joined = subscribed.filter((row) => within(row["OPTIN_TIME"], from, to));
  const left = unsubscribed.filter((row) => within(row["UNSUB_TIME"], from, to));
  const bounced = cleaned.filter((row) => within(row["CLEAN_TIME"], from, to));
  const net = joined.length - left.length - bounced.length;

  say("// ---- the half-year flow ----");
  say(`newsletter-joined: v(`);
  say(`  ${joined.length},`);
  say(
    `  ${note(`Contacts whose OPTIN_TIME falls in ${from}..${to} and who were still subscribed at the export date. Source: ${source}.`)},`
  );
  say(`),`);
  say(`newsletter-unsubscribed: v(`);
  say(`  ${left.length},`);
  say(
    `  ${note(`Contacts whose UNSUB_TIME falls in ${from}..${to}. Source: ${source}.`)},`
  );
  say(`),`);
  say(`newsletter-bounced: v(`);
  say(`  ${bounced.length},`);
  say(
    `  ${note(`Contacts whose CLEAN_TIME falls in ${from}..${to} — addresses Mailchimp removed after a hard bounce. These are undeliverable mailboxes, not people choosing to leave. Source: ${source}.`)},`
  );
  say(`),`);
  say(`newsletter-net: v(`);
  say(`  ${net},`);
  say(
    `  ${note(`${joined.length} joined less ${left.length} unsubscribed and ${bounced.length} removed as undeliverable, ${from}..${to}. Source: ${source}.`)},`
  );
  say(`),`);
  say();

  say(`// joins by month:   ${[...tally(joined.map((r) => monthOf(r["OPTIN_TIME"]))).entries()].sort().map(([k, v]) => `${k}=${v}`).join(" ")}`);
  say(`// unsubs by month:  ${[...tally(left.map((r) => monthOf(r["UNSUB_TIME"]))).entries()].sort().map(([k, v]) => `${k}=${v}`).join(" ")}`);
  say(`// bounces by month: ${[...tally(bounced.map((r) => monthOf(r["CLEAN_TIME"]))).entries()].sort().map(([k, v]) => `${k}=${v}`).join(" ")}`);
  say();

  // ── Campaigns actually sent ────────────────────────────────────────────────
  //
  // From `campaigns.json`, which is the API's own record of every send. Two
  // things to keep straight before quoting any of this:
  //
  //   - A SEND is not an ISSUE. Two of the six newsletter sends in H1 2026 are
  //     second sends of an issue already sent that day. The script prints every
  //     send and counts sends; deciding what an "issue" is, is a person's job.
  //   - `campaignsSentBetween()` never returns a campaign sent to fewer than
  //     five people, because such a campaign is a description of those people.
  //     None of this account's four fall in a reporting half-year, but a period
  //     count built from it is a floor by construction all the same. The
  //     whole-account totals in `mailchimpCampaigns.totals` include them.
  const windowCampaigns = campaignsSentBetween(from, to);
  const isNewsletter = (title: string, subject: string) =>
    /newsletter/i.test(title) || /newsletter/i.test(subject);
  const newsletters = windowCampaigns.filter((campaign) =>
    isNewsletter(campaign.title, campaign.subjectLine)
  );
  const eventEmails = windowCampaigns.filter(
    (campaign) => !isNewsletter(campaign.title, campaign.subjectLine)
  );

  const sumOf = (
    list: typeof windowCampaigns,
    pick: (campaign: (typeof windowCampaigns)[number]) => number
  ) => list.reduce((total, campaign) => total + pick(campaign), 0);

  const windowSent = sumOf(windowCampaigns, (campaign) => campaign.emailsSent);
  const windowOpens = sumOf(windowCampaigns, (campaign) => campaign.uniqueOpens);
  const windowProxyExcluded = sumOf(
    windowCampaigns,
    (campaign) => campaign.proxyExcludedUniqueOpens
  );
  const windowClicks = sumOf(windowCampaigns, (campaign) => campaign.uniqueClicks);
  const rate = (part: number, whole: number) =>
    whole === 0 ? "0.0" : ((part / whole) * 100).toFixed(1);

  const campaignSource = `lib/data/json/mailchimp/campaigns.json, built by scripts/mailchimp/build-campaigns.ts from the Mailchimp API pull ${mailchimpCampaigns.metadata.exportId}`;

  say("// ---- campaigns actually sent in the window ----");
  say(`// Every send, from the API. Not a floor — see campaigns.json.`);
  say(`//`);
  say(`// Newsletter sends (${newsletters.length}):`);
  for (const campaign of newsletters) {
    say(`//   ${campaign.sentAt.slice(0, 10)}  ${campaign.emailsSent} sent  ${campaign.uniqueOpens} opened  ${campaign.title}`);
  }
  say(`// Event and campaign emails (${eventEmails.length}):`);
  for (const campaign of eventEmails) {
    say(`//   ${campaign.sentAt.slice(0, 10)}  ${campaign.emailsSent} sent  ${campaign.uniqueOpens} opened  ${campaign.title}`);
  }
  say();
  say(`newsletter-issues: v(`);
  say(`  ${newsletters.length},`);
  say(
    `  ${note(`Newsletter campaigns SENT between ${from} and ${to}: ${newsletters.map((campaign) => `${campaign.sentAt.slice(0, 10)} ${campaign.title}`).join("; ")}. This is a count of sends, not of distinct issues — check the list before calling it "issues", because a re-send of the same issue on the same day appears twice. Source: ${campaignSource}.`)},`
  );
  say(`),`);
  say(`event-email-campaigns: v(`);
  say(`  ${eventEmails.length},`);
  say(
    `  ${note(`Non-newsletter campaigns sent between ${from} and ${to}: ${eventEmails.map((campaign) => `${campaign.sentAt.slice(0, 10)} ${campaign.title}`).join("; ")}. Source: ${campaignSource}.`)},`
  );
  say(`),`);
  say(`newsletter-emails-sent: v(`);
  say(`  ${windowSent},`);
  say(
    `  ${note(`Emails Mailchimp attempted across all ${windowCampaigns.length} campaigns sent between ${from} and ${to}. It is a count of SENDS, not of people: the same subscriber is counted once per campaign. What Mailchimp attempted, not what was delivered — bounces come out of it. Source: ${campaignSource}.`)},`
  );
  say(`),`);
  say(`newsletter-open-rate: v(`);
  say(`  ${rate(windowOpens, windowSent)},`);
  say(
    `  ${note(`Unique opens as a percentage of emails sent, across the ${windowCampaigns.length} campaigns sent between ${from} and ${to} (${windowOpens} of ${windowSent}). Apple Mail Privacy Protection pre-fetches images and Mailchimp counts that as an open; excluding proxy opens gives ${rate(windowProxyExcluded, windowSent)}%, and any comparison with a pre-2022 figure must use the proxy-excluded series. ${windowClicks} recipients clicked (${rate(windowClicks, windowSent)}%). Source: ${campaignSource}.`)},`
  );
  say(`),`);
  say();

  // ── Location, stated with its hole ─────────────────────────────────────────
  const withCountry = subscribed.filter((row) => String(row["CC"] ?? "").trim());
  const countries = tally(
    withCountry.map((row) => String(row["CC"]).trim().toLowerCase())
  );
  const regions = tally(
    subscribed
      .map((row) => String(row["REGION"] ?? "").trim().toLowerCase())
      .filter(Boolean)
  );

  say("// ---- location ----");
  say(
    `// ${subscribed.length - withCountry.length} of ${subscribed.length} subscribed contacts (${Math.round(((subscribed.length - withCountry.length) / subscribed.length) * 100)}%) carry NO country.`
  );
  say(`// Any geographic claim must name that before it names a place.`);
  say(
    `// countries: ${[...countries].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}=${v}`).join(" ")}`
  );
  say(
    `// regions:   ${[...regions].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}=${v}`).join(" ")}`
  );
  say();

  const outDir = join(REPO_ROOT, "tmp", "mailchimp");
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, "report-data-suggestions.typ");
  writeFileSync(path, lines.join("\n") + "\n", "utf8");

  console.log(`Wrote ${path}`);
  console.log(`  window            ${from} .. ${to}`);
  console.log(`  emailable now     ${emailable}  (at export ${exportId})`);
  console.log(`  joined            ${joined.length}`);
  console.log(`  unsubscribed      ${left.length}`);
  console.log(`  bounced out       ${bounced.length}`);
  console.log(`  net               ${net}`);
  console.log(`  campaigns sent    ${windowCampaigns.length}  (${newsletters.length} newsletter, ${eventEmails.length} event)`);
  console.log(`  emails sent       ${windowSent}`);
  console.log(`  unique open rate  ${rate(windowOpens, windowSent)}%  (${rate(windowProxyExcluded, windowSent)}% proxy-excluded)`);
  console.log("\nNothing under report/ was written.");
}

main();
