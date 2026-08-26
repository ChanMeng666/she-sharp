/**
 * Regenerates `lib/data/json/mailchimp/campaigns.json` from an API export.
 *
 * What goes in is 2.7 MB of verbatim Mailchimp API responses; what comes out is
 * counts, plus the two labels every campaign already publishes to the world on
 * `us3.campaign-archive.com` — its title and its subject line. Nothing that
 * identifies a recipient may reach the file this script writes, and unlike
 * `build-archive.ts` the risk here is not the rows but the free text: a subject
 * line is the one field in this pipeline a human typed, and humans type
 * addresses into subject lines. So the two regexes CI greps the committed
 * archive with are re-run here, over every label, before anything is written.
 * Failing in two seconds locally beats failing red on a PR once the string is
 * already in git history.
 *
 * Deliberately a SEPARATE script from `build-archive.ts` rather than another
 * output of it. That one's `--export` names a manual CSV export session
 * (`2026-08-17`); this one's names an API pull (`2026-08-27-api`). One flag
 * meaning two things, silently reading the wrong directory, is how a build
 * "succeeds" against data it was never pointed at.
 *
 * GENERATED. Rebuilt wholesale; never hand-edited. Deterministic by
 * construction — everything is sorted and no timestamp is written into the
 * payload — which is what `--check` immediately after a build proves.
 *
 * Usage:
 *   npx tsx scripts/mailchimp/build-campaigns.ts --export 2026-08-27-api --check
 *   npx tsx scripts/mailchimp/build-campaigns.ts --export 2026-08-27-api
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type {
  MailchimpCampaign,
  MailchimpCampaigns,
  MailchimpCampaignYear,
  MailchimpGrowthPoint,
  MailchimpManifest,
} from "../../types/mailchimp";
import { ARCHIVE_DIR, argValue, readVaultFile } from "./vault";

/**
 * Minimum recipients before a campaign is named in the committed output.
 *
 * Five, the same floor `aggregates.domains` and `aggregates.organisations`
 * apply, and applied for the same reason rather than for symmetry: a send to
 * fewer than five people is a description of those people. It is also, in this
 * account, exactly the shape that gets titled after somebody — the four
 * campaigns below the floor here are Zoom links sent to one named speaker and a
 * test send, and two of their titles carry a person's name.
 */
const K_FLOOR = 5;

/**
 * The endpoint each input file is the response to.
 *
 * Files are located by ENDPOINT, not by filename. The manifest records the
 * endpoint as an API file's provenance — it is the only statement of what the
 * numbers inside are counts of — and a filename is just what the fetcher chose
 * to call it. Matching on the endpoint means a renamed file fails loudly here
 * instead of being missed.
 */
const CAMPAIGNS_ENDPOINT = "/campaigns?status=sent";
const REPORTS_ENDPOINT = "/reports";
const GROWTH_ENDPOINT_SUFFIX = "/growth-history";

// --- The raw API shapes, narrowed to what is read ---------------------------
//
// Hand-written rather than imported from `lib/mailchimp/client.ts`: that module
// maps snake_case to camelCase and deliberately projects a subset of fields,
// and this script reads the response as it sits on disk. Declaring only the
// fields actually used also documents, by omission, everything being dropped —
// `from_name` and `reply_to` above all, which carry the organisation's own
// mailboxes and are stripped by never being named here.

interface RawCampaign {
  id: string;
  type: string;
  status: string;
  emails_sent: number;
  send_time: string;
  settings: { subject_line?: string; title?: string };
}

interface RawReport {
  id: string;
  emails_sent: number;
  send_time: string;
  abuse_reports: number;
  unsubscribed: number;
  bounces: { hard_bounces: number; soft_bounces: number };
  opens: { opens_total: number; unique_opens: number; proxy_excluded_unique_opens: number };
  clicks: { clicks_total: number; unique_clicks: number; unique_subscriber_clicks: number };
}

interface RawGrowthPoint {
  month: string;
  subscribed: number;
  unsubscribed: number;
  cleaned: number;
}

/**
 * Field names that would mean a person, not a count, had reached the archive.
 *
 * A COPY of the set in `lib/data/mailchimp.test.ts`, on purpose: the test is
 * the gate, and a builder that imported the gate's own list could not fail
 * before the gate does. Duplicating it means the two must be kept in step by
 * hand, which is the cheap half of a bargain whose expensive half is a person's
 * address reaching a public repository.
 *
 * `emails` is the entry that matters here. This file emits `emailsSent`, one
 * keystroke away from it, and a careless rename to `emails` would put a
 * forbidden key into a file whose every value is a legitimate count.
 */
const FORBIDDEN_KEYS = new Set([
  "email",
  "emails",
  "emailAddress",
  "emailHash",
  "mobile",
  "phone",
  "firstName",
  "lastName",
  "address",
  "birthday",
  "dob",
  "dateOfBirth",
  "ip",
  "optinIp",
  "confirmIp",
  "secondaryEmail",
  "leid",
  "euid",
]);

/** The leak guard's own patterns, copied for the same reason as the key list. */
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const IPV4 = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

/**
 * Serialises a generated file.
 *
 * CRLF, matching `build-archive.ts` and the rest of `lib/data/json/`. This
 * repository is worked on with `core.autocrlf=true`, so rendering LF here would
 * make every rebuild look like a whole-file rewrite.
 */
function render(value: unknown): string {
  return (JSON.stringify(value, null, 2) + "\n").replace(/\n/g, "\r\n");
}

function loadArchiveJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(ARCHIVE_DIR, name), "utf8")) as T;
}

/**
 * Locates one file of an API export and parses it.
 *
 * @param exportId - The export id, which names the vault directory.
 * @param manifest - The committed manifest.
 * @param match - Predicate over the recorded endpoint.
 * @param what - Human name of the endpoint, for the error message.
 * @returns The parsed response.
 * @throws When the export is absent, is not an API pull, or has no such file.
 */
function loadApiFile<T>(
  exportId: string,
  manifest: MailchimpManifest,
  match: (endpoint: string) => boolean,
  what: string
): T {
  const entry = manifest.exports.find((item) => item.exportId === exportId);
  if (!entry) {
    throw new Error(`Manifest has no export ${exportId}. Run manifest.ts --append first.`);
  }
  // An export id that resolves to a CSV session would read five files of
  // addresses and find no JSON — a confusing failure for what is really "you
  // passed the wrong kind of export id".
  if (entry.method !== "api-v3") {
    throw new Error(
      `Export ${exportId} is a ${entry.method ?? "manual-csv"} export. ` +
        `build-campaigns.ts needs an API pull (method "api-v3"); ` +
        `build-archive.ts is the script for a CSV export.`
    );
  }

  const file = entry.files.find((item) => match(item.endpoint ?? ""));
  if (!file) throw new Error(`Export ${exportId} has no file for ${what}.`);

  return JSON.parse(readVaultFile(exportId, file.file)) as T;
}

/**
 * Fails the build when a label carries something that must never be committed.
 *
 * Names the campaign id and NOT the offending string: an error message ends up
 * in a terminal, a CI log and often a pasted issue, so echoing the address back
 * would leak it to three more places while reporting that it must not leak.
 * The id is enough to find the row in the vault.
 */
function assertLabelIsSafe(id: string, field: string, value: string): void {
  if (EMAIL.test(value)) {
    throw new Error(
      `Campaign ${id}: ${field} contains something shaped like an email address. ` +
        `It is not printed here on purpose. Read the row in the vault, and if the ` +
        `label genuinely needs an address in it, the label cannot be committed.`
    );
  }
  if (IPV4.test(value)) {
    throw new Error(
      `Campaign ${id}: ${field} contains something shaped like an IP address. ` +
        `Not printed here on purpose — read the row in the vault.`
    );
  }
}

/**
 * Fails the build if any emitted key is one the leak guard forbids.
 *
 * Walks the finished payload rather than checking the mapper, because the
 * mapper is what a future edit changes. Cheap, and it catches the rename that
 * looks harmless in a diff.
 */
function assertNoForbiddenKeys(node: unknown, path = "$"): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  if (!node || typeof node !== "object") return;

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key) || key.toLowerCase() === "leid" || key.toLowerCase() === "euid") {
      throw new Error(
        `${path}.${key} is a key the archive leak guard forbids. ` +
          `Note that "emailsSent" is legal and "emails" is not.`
      );
    }
    assertNoForbiddenKeys(value, `${path}.${key}`);
  }
}

/**
 * Guards the year bucketing against a timezone reading.
 *
 * `send_time` is UTC and She Sharp is UTC+12/+13, so a send in the last hours
 * of 31 December UTC falls in the NEXT year in Auckland, and `bySendYear` would
 * then depend on who read it. No send in this account is anywhere near a
 * boundary — the closest is weeks away — so rather than inventing a timezone
 * conversion whose correctness nobody can check, this asserts the ambiguity
 * does not arise. If it ever does, the fix is a decision about which calendar
 * the report means, not a silent `getFullYear()`.
 */
function assertNoYearBoundaryAmbiguity(sends: { id: string; sentAt: string }[]): void {
  const NZ_MAX_OFFSET_HOURS = 13;
  for (const send of sends) {
    const time = Date.parse(send.sentAt);
    const year = new Date(time).getUTCFullYear();
    const yearEnd = Date.UTC(year + 1, 0, 1);
    const yearStart = Date.UTC(year, 0, 1);
    const hoursToEnd = (yearEnd - time) / 3_600_000;
    const hoursFromStart = (time - yearStart) / 3_600_000;
    if (hoursToEnd <= NZ_MAX_OFFSET_HOURS || hoursFromStart <= NZ_MAX_OFFSET_HOURS) {
      throw new Error(
        `Campaign ${send.id} was sent at ${send.sentAt}, within ${NZ_MAX_OFFSET_HOURS}h of a ` +
          `UTC year boundary. bySendYear buckets by the UTC year; in New Zealand this send is ` +
          `in the other year. Decide which calendar the report means before rebuilding.`
      );
    }
  }
}

/** Joins one campaign to its report and maps both to counts. */
function toCampaign(raw: RawCampaign, report: RawReport): MailchimpCampaign {
  const title = (raw.settings.title ?? "").trim();
  const subjectLine = (raw.settings.subject_line ?? "").trim();
  assertLabelIsSafe(raw.id, "title", title);
  assertLabelIsSafe(raw.id, "subjectLine", subjectLine);

  return {
    id: raw.id,
    sentAt: report.send_time,
    title,
    subjectLine,
    // Mailchimp's own name for this is `emails_sent`. Kept as `emailsSent`
    // rather than `sends` because it is what Mailchimp ATTEMPTED, not what was
    // delivered — the bounces below come out of it.
    emailsSent: report.emails_sent,
    uniqueOpens: report.opens.unique_opens,
    proxyExcludedUniqueOpens: report.opens.proxy_excluded_unique_opens,
    opensTotal: report.opens.opens_total,
    // `clicks.unique_subscriber_clicks`, NOT `clicks.unique_clicks`. Mailchimp's
    // `unique_clicks` counts unique clicks per LINK summed over links, so a
    // two-recipient campaign in this account reports 3 of them, and the one
    // variate campaign reports 0 while 47 people clicked. Only
    // `unique_subscriber_clicks` is a count of people, which is what makes it
    // the analogue of `unique_opens` and the only one that can be divided by
    // `emailsSent` to get a rate.
    uniqueClicks: report.clicks.unique_subscriber_clicks,
    clicksTotal: report.clicks.clicks_total,
    hardBounces: report.bounces.hard_bounces,
    softBounces: report.bounces.soft_bounces,
    unsubscribed: report.unsubscribed,
    abuseReports: report.abuse_reports,
  };
}

function main() {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const check = argv.includes("--check") || argv.includes("--dry-run");

  if (!exportId) {
    console.error(
      "Usage: npx tsx scripts/mailchimp/build-campaigns.ts --export <YYYY-MM-DD-api> [--check]"
    );
    process.exit(1);
  }

  const manifest = loadArchiveJson<MailchimpManifest>("manifest.json");

  const rawCampaigns = loadApiFile<RawCampaign[]>(
    exportId,
    manifest,
    (endpoint) => endpoint === CAMPAIGNS_ENDPOINT,
    CAMPAIGNS_ENDPOINT
  );
  const rawReports = loadApiFile<RawReport[]>(
    exportId,
    manifest,
    (endpoint) => endpoint === REPORTS_ENDPOINT,
    REPORTS_ENDPOINT
  );
  const rawGrowth = loadApiFile<RawGrowthPoint[]>(
    exportId,
    manifest,
    (endpoint) => endpoint.endsWith(GROWTH_ENDPOINT_SUFFIX),
    GROWTH_ENDPOINT_SUFFIX
  );

  // --- Join ----------------------------------------------------------------
  //
  // `/campaigns?status=sent` and `/reports` are two views of the same set and
  // are pulled minutes apart. If they ever disagree about which campaigns exist,
  // the pull raced a send and the numbers below would silently describe a
  // different set from the labels. Fail instead.
  const reportsById = new Map(rawReports.map((report) => [report.id, report]));
  const missingReport = rawCampaigns.filter((campaign) => !reportsById.has(campaign.id));
  if (missingReport.length > 0) {
    throw new Error(
      `${missingReport.length} sent campaign(s) have no report: ` +
        `${missingReport.map((campaign) => campaign.id).join(", ")}`
    );
  }
  const campaignIds = new Set(rawCampaigns.map((campaign) => campaign.id));
  const orphanReports = rawReports.filter((report) => !campaignIds.has(report.id));
  if (orphanReports.length > 0) {
    throw new Error(
      `${orphanReports.length} report(s) have no sent campaign: ` +
        `${orphanReports.map((report) => report.id).join(", ")}`
    );
  }

  for (const campaign of rawCampaigns) {
    const report = reportsById.get(campaign.id)!;
    if (report.emails_sent !== campaign.emails_sent) {
      throw new Error(
        `Campaign ${campaign.id}: /campaigns says ${campaign.emails_sent} sent, ` +
          `/reports says ${report.emails_sent}.`
      );
    }
    if (report.send_time !== campaign.send_time) {
      throw new Error(
        `Campaign ${campaign.id}: the two endpoints disagree on the send time ` +
          `(${campaign.send_time} vs ${report.send_time}).`
      );
    }
  }

  const all = rawCampaigns
    .map((campaign) => toCampaign(campaign, reportsById.get(campaign.id)!))
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id.localeCompare(b.id, "en"));

  assertNoYearBoundaryAmbiguity(all);

  // --- The floor -----------------------------------------------------------
  //
  // Three buckets, reported as three numbers rather than one filtered list.
  // `unsent` is a campaign Mailchimp calls sent that reached nobody; it is zero
  // in this account, and the field exists so that a future rebuild where it is
  // not zero cannot be mistaken for campaigns quietly dropped by the floor.
  const unsent = all.filter((campaign) => campaign.emailsSent === 0);
  const belowFloor = all.filter(
    (campaign) => campaign.emailsSent > 0 && campaign.emailsSent < K_FLOOR
  );
  const sent = all.filter((campaign) => campaign.emailsSent >= K_FLOOR);

  // --- Totals --------------------------------------------------------------
  //
  // Over every campaign that reached at least one person, INCLUDING the ones
  // below the floor. A total is not a re-identification vector — suppressing
  // those four sends from the totals would only make the account's real reach
  // look smaller than it was, which is the opposite of what the floor is for.
  const counted = all.filter((campaign) => campaign.emailsSent > 0);
  const sumOf = (pick: (campaign: MailchimpCampaign) => number) =>
    counted.reduce((total, campaign) => total + pick(campaign), 0);

  const totals = {
    campaignsSent: counted.length,
    emailsSent: sumOf((campaign) => campaign.emailsSent),
    uniqueOpens: sumOf((campaign) => campaign.uniqueOpens),
    proxyExcludedUniqueOpens: sumOf((campaign) => campaign.proxyExcludedUniqueOpens),
    opensTotal: sumOf((campaign) => campaign.opensTotal),
    uniqueClicks: sumOf((campaign) => campaign.uniqueClicks),
    clicksTotal: sumOf((campaign) => campaign.clicksTotal),
    hardBounces: sumOf((campaign) => campaign.hardBounces),
    softBounces: sumOf((campaign) => campaign.softBounces),
    unsubscribed: sumOf((campaign) => campaign.unsubscribed),
    abuseReports: sumOf((campaign) => campaign.abuseReports),
    firstSend: counted[0]?.sentAt ?? "",
    lastSend: counted.at(-1)?.sentAt ?? "",
  };

  // --- Per year ------------------------------------------------------------
  const years = new Map<string, MailchimpCampaignYear>();
  for (const campaign of counted) {
    const year = campaign.sentAt.slice(0, 4);
    const bucket = years.get(year) ?? {
      year,
      campaigns: 0,
      emailsSent: 0,
      uniqueOpens: 0,
      proxyExcludedUniqueOpens: 0,
      uniqueClicks: 0,
      unsubscribed: 0,
    };
    bucket.campaigns += 1;
    bucket.emailsSent += campaign.emailsSent;
    bucket.uniqueOpens += campaign.uniqueOpens;
    bucket.proxyExcludedUniqueOpens += campaign.proxyExcludedUniqueOpens;
    bucket.uniqueClicks += campaign.uniqueClicks;
    bucket.unsubscribed += campaign.unsubscribed;
    years.set(year, bucket);
  }
  const bySendYear = [...years.values()].sort((a, b) => a.year.localeCompare(b.year, "en"));

  // --- The list-size series ------------------------------------------------
  //
  // Three fields out of the twelve Mailchimp returns. `existing`, `imports` and
  // `optins` — the documented "growth" fields, and the obvious ones to reach
  // for — are hard ZERO in all 86 months of this account, so they are dropped
  // rather than emitted: a committed zero is worse than an absent field,
  // because a zero gets charted.
  const growth: MailchimpGrowthPoint[] = rawGrowth
    .map((point) => ({
      month: point.month,
      subscribed: point.subscribed,
      unsubscribed: point.unsubscribed,
      cleaned: point.cleaned,
    }))
    .sort((a, b) => a.month.localeCompare(b.month, "en"));

  const peak = growth.reduce((best, point) => (point.subscribed > best.subscribed ? point : best));

  const payload: MailchimpCampaigns = {
    metadata: {
      generatedBy: "scripts/mailchimp/build-campaigns.ts",
      exportId,
      definitionsDoc: "docs/development/MAILCHIMP_ARCHIVE.md",
      labels:
        "title and subjectLine are the only free text here. Both are already " +
        "published: every campaign's subject line appears on the public archive " +
        "at us3.campaign-archive.com. The builder re-runs the CI leak guard's " +
        "own email and IP patterns over both before writing.",
    },
    totals,
    campaigns: {
      floor: K_FLOOR,
      distinct: all.length,
      unsent: unsent.length,
      belowFloor: belowFloor.length,
      sent,
    },
    bySendYear,
    growth,
    caveats: [
      `${totals.campaignsSent} campaigns were sent from this account between ` +
        `${totals.firstSend.slice(0, 10)} and ${totals.lastSend.slice(0, 10)}. ` +
        `GET /lists reports campaignCount 215, which counts drafts and deleted ` +
        `campaigns as well; 209 appears in older notes here and was a UI reading ` +
        `of the same thing. Neither is a count of sends.`,
      "growth[].subscribed is a STOCK, not a flow: subscribed members at the " +
        "END of that month. The series is not monotonic — it peaks at " +
        `${peak.subscribed} in ${peak.month} and stands at ` +
        `${growth.at(-1)?.subscribed} in ${growth.at(-1)?.month}. The list has ` +
        "been shrinking through 2026.",
      "Open rates cannot be compared across 2021. Apple Mail Privacy Protection " +
        "pre-fetches images, which Mailchimp counts as an open. " +
        "proxyExcludedUniqueOpens is Mailchimp's own correction and equals " +
        "uniqueOpens exactly for every campaign sent before 2022, because there " +
        "was nothing to exclude yet.",
      "uniqueClicks counts PEOPLE (Mailchimp's unique_subscriber_clicks). Its " +
        "field named unique_clicks counts unique clicks per link and can exceed " +
        "the number of recipients; it is not committed here.",
      `Campaigns sent to fewer than ${K_FLOOR} people are counted in belowFloor ` +
        "and in totals, but never named. A send to one or two people describes " +
        "those people, and such campaigns are usually titled after them.",
      "emailsSent is what Mailchimp attempted, not what arrived. The bounces " +
        "come out of it.",
      "This file says nothing about who opened or clicked. Per-recipient " +
        "activity is a separate export and is not in this repository — see the " +
        "per-campaign-recipient-activity gap in manifest.json.",
    ],
  };

  assertNoForbiddenKeys(payload);

  const path = join(ARCHIVE_DIR, "campaigns.json");
  const next = render(payload);
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;

  let changed = 0;
  if (current === next) {
    console.log("  unchanged - campaigns.json");
  } else {
    changed = 1;
    if (check) {
      console.log(
        `  WOULD CHANGE - campaigns.json (${current === null ? "new file" : `${current.length} → ${next.length} bytes`})`
      );
    } else {
      writeFileSync(path, next, "utf8");
      console.log("  wrote - campaigns.json");
    }
  }

  const openRate = (totals.uniqueOpens / totals.emailsSent) * 100;
  const proxyExcludedRate = (totals.proxyExcludedUniqueOpens / totals.emailsSent) * 100;
  const clickRate = (totals.uniqueClicks / totals.emailsSent) * 100;

  console.log("");
  console.log(
    `${all.length} campaigns (${sent.length} named, ${belowFloor.length} below the floor of ${K_FLOOR}, ${unsent.length} reached nobody)`
  );
  console.log(
    `${totals.emailsSent.toLocaleString("en-NZ")} emails sent · ${openRate.toFixed(1)}% unique open (${proxyExcludedRate.toFixed(1)}% proxy-excluded) · ${clickRate.toFixed(2)}% unique click`
  );
  console.log(
    `list size ${growth[0].subscribed} in ${growth[0].month} → peak ${peak.subscribed} in ${peak.month} → ${growth.at(-1)?.subscribed} in ${growth.at(-1)?.month}`
  );
  console.log(
    check
      ? changed === 0
        ? "ok - the committed archive already matches the vault"
        : "1 file would change. Re-run without --check to write it."
      : changed === 0
        ? "ok - nothing to write"
        : "1 file written."
  );
}

main();
