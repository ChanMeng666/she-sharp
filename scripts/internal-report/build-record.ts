/**
 * build-record.ts — the data behind the internal record report.
 *
 * She Sharp's outward-facing numbers are chosen; this one is counted. The
 * report at `report-internal/` (now in NZ-SheSharp/she-sharp-reports) exists
 * so the team can see what the systems
 * actually recorded between 2019 and now, including the parts nobody would put
 * in a funding application, and this script is the only thing that puts a
 * number into it.
 *
 * WHY A GENERATOR AND NOT A HAND-WRITTEN DATA FILE. The funder report keeps its
 * figures in `report/data/report-data.typ`, each one hand-placed with a note
 * somebody signs, because it carries about ninety numbers and every one is a
 * claim to a third party. This report carries several hundred, almost all of
 * them one cell in a year-by-year series, and a series that is typed by hand
 * rots the moment a newer export lands. So the contract is inverted: nothing
 * here is typed, everything is derived, and re-running this script against a
 * newer export is the whole of the update procedure.
 *
 * WHAT NEEDS THE VAULT AND WHY. The committed archives under
 * `lib/data/json/{humanitix,mailchimp}/` are aggregates. They can say how many
 * contacts joined the list in 2023; they cannot say how many of the people at
 * a 2024 event had been to one before, or how the emailable list moved in each
 * year, because both questions need per-person rows and per-row timestamps that
 * are deliberately never committed. Those live in the gitignored vault. The
 * OUTPUT of this script is counts only and is safe to commit — no address, no
 * name, no IP, no access code, not even a hash.
 *
 * Run:
 *   npx tsx scripts/internal-report/build-record.ts
 *   npx tsx scripts/internal-report/build-record.ts --out somewhere/else.json
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { readCsv as readHumanitixCsv, parseDmyToIso } from "../humanitix/csv";
import { readCsv as readMailchimpCsv } from "../mailchimp/csv";
import {
  REPO_ROOT,
  argValue,
  vaultExists as humanitixVaultExists,
} from "../humanitix/vault";
import { vaultExists as mailchimpVaultExists } from "../mailchimp/vault";
import { humanitixAggregates, humanitixManifest } from "../../lib/data/humanitix";
import { mailchimpAggregates, mailchimpManifest } from "../../lib/data/mailchimp";
import { getAllEvents, getEventsHeldCount, parseDateString } from "../../lib/data/events";
import { scrollingSponsorLogos, tieredSponsors } from "../../lib/data/sponsors";
import { teamMembers } from "../../lib/data/team";
import { globalStats } from "../../lib/data/stats";

/** The four Mailchimp status files. Together they partition the audience. */
const MAILCHIMP_FILES = {
  subscribed: "subscribed_email_audience_export_1a10653875.csv",
  unsubscribed: "unsubscribed_email_audience_export_1a10653875.csv",
  cleaned: "cleaned_email_audience_export_1a10653875.csv",
} as const;

/**
 * Annual returns filed with Charities Services, charity CC57025.
 *
 * The only figures in this file that are not derived from a repository
 * artefact: they are a public record held by a third party, read from the
 * register's Annual Returns tab in a browser on 2026-08-24. There is no
 * accounting export in this repository and no API, so they are transcribed —
 * which is why each row carries the date the return was submitted, so a reader
 * can check any of them against the register in about a minute.
 *
 * The 2019 financial year is absent deliberately: the charity was granted an
 * exemption from filing for the year ending 30 June 2019 under s43 of the
 * Charities Act. The balance date moved to 31 December after FY2020.
 */
const FILED_RETURNS = [
  { yearEnded: "2020-06-30", submitted: "2020-11-10", income: 6660, expenditure: 2864 },
  { yearEnded: "2021-12-31", submitted: "2021-12-29", income: 13100, expenditure: 5741 },
  { yearEnded: "2022-12-31", submitted: "2022-12-22", income: 49325, expenditure: 10331 },
  { yearEnded: "2023-12-31", submitted: "2023-12-31", income: 98917, expenditure: 44815 },
  { yearEnded: "2024-12-31", submitted: "2025-02-05", income: 102674, expenditure: 38771 },
  { yearEnded: "2025-12-31", submitted: "2026-06-25", income: 40825, expenditure: 25335 },
];

/**
 * The 2026 mentorship cycle, read from the live Neon production database on
 * 2026-08-01 and corroborated by the programme's own weekly Slack digest, whose
 * last post inside the period (2026-06-29) reports the same figures.
 *
 * Not derived like everything else in this file, because the platform is four
 * months old and nothing exports it. Two independent sources agreeing on the
 * zero is why it is stated as a fact rather than as a gap: `pairings` and
 * `meetings` are empty tables, not unmeasured ones.
 */
const MENTORSHIP_2026 = {
  mentorsOnboarded: 26,
  mentorsBatchImported: 25,
  menteeSubmissions: 11,
  waitingQueue: 10,
  mentorProfiles: 23,
  activeMentorRoles: 24,
  pairings: 0,
  meetings: 0,
  intakePaused: "2026-06-19",
  note:
    "25 of the 26 mentors were confirmed offline and imported in a single batch " +
    "on 2026-03-19. They are onboarded, never applied — reading the figure as " +
    "inbound demand overstates it several times over.",
};

/**
 * Email campaign performance, February 2025 to July 2026.
 *
 * SECOND-HAND, AND THE ONLY SECOND-HAND SERIES IN THIS FILE. Every other figure
 * here is derived from an export this repository holds. These 38 rows are
 * transcribed from `She_Sharp_Campaign_Performance_Report_Jan2025-Feb2026_v0.1.docx`,
 * prepared by Prasanth Pavithran from the Mailchimp campaign report — a report
 * that was requested for the archive on 2026-08-17 and never arrived, so this
 * is the only copy of it the organisation has.
 *
 * IT WAS CHECKED BEFORE IT WAS TRUSTED, four ways:
 *
 *   · The recipient column sums to 60,648, exactly the total the document
 *     states, and its stated averages reproduce as RECIPIENT-WEIGHTED means
 *     (open 28.91 against 28.9 stated) rather than as unweighted ones.
 *   · Ten campaign send dates fall on exactly the day this repository had
 *     already derived independently, from the campaign each unsubscribe and
 *     bounce is recorded against. Ten out of ten, to the day.
 *   · Its recipient counts track the mailing list's reconstructed size: 1,709
 *     to 1,717 across late 2025 against 1,716 reconstructed at that year end,
 *     and 1,560 on the last send, which is the subscriber count in the
 *     2026-08-17 export to the person.
 *   · Its worst unsubscribe outlier, Newsletter - April 2026 at 1.95%, is the
 *     same campaign the raw export attributes 35 unsubscribes to — the single
 *     worst month in the audience record.
 *
 * Replace this with a direct Mailchimp campaign export the moment one exists.
 * A transcription that has been checked four ways is still a transcription.
 *
 * WHAT IT DOES NOT SUPPORT. The source document reads a downward trend in 2026
 * opens. The rows do not carry it: 2025 averages 28.89% and 2026 averages
 * 28.43%, a difference of less than half a point across 38 sends. The claim
 * rests on two low sends read against a range rather than against a mean. What
 * IS in the data is the last three sends of the window, all in July 2026, at
 * 19.8%, 13.9% and 19.0% — recent, and too few to call a trend.
 */
export interface EmailCampaign {
  date: string;
  name: string;
  recipients: number;
  openRate: number;
  clickRate: number;
  /** Every campaign in the source reports $0 attributed revenue; see the report page. */
  unsubRate: number;
}

const EMAIL_CAMPAIGNS: EmailCampaign[] = [
  { date: "2025-02-28", name: "She Sharp Newsletter - February 2025", recipients: 1586, openRate: 32.47, clickRate: 3.22, unsubRate: 0.69 },
  { date: "2025-03-03", name: "Join Us to #AccelerateAction for Women in STEM - IWD 2025", recipients: 1573, openRate: 21.93, clickRate: 2.48, unsubRate: 0.38 },
  { date: "2025-03-25", name: "She Sharp Newsletter - March 2025", recipients: 1564, openRate: 34.65, clickRate: 3.26, unsubRate: 0.58 },
  { date: "2025-03-25", name: "Join the #IAmRemarkable online workshop this April", recipients: 1559, openRate: 29.83, clickRate: 2.12, unsubRate: 0.06 },
  { date: "2025-05-06", name: "She Sharp Newsletter - April 2025", recipients: 1545, openRate: 36.76, clickRate: 2.72, unsubRate: 0.32 },
  { date: "2025-05-08", name: "She Sharp x MYOB - Tech That Matches Your Vibe", recipients: 1543, openRate: 24.24, clickRate: 2.40, unsubRate: 0.19 },
  { date: "2025-05-28", name: "She Sharp Newsletter - May 2025", recipients: 1534, openRate: 35.33, clickRate: 2.28, unsubRate: 0.07 },
  { date: "2025-06-29", name: "She Sharp Newsletter - June 2025", recipients: 1626, openRate: 34.50, clickRate: 3.08, unsubRate: 0.31 },
  { date: "2025-07-04", name: "She Sharp x Tech Babes NZ - THRIVE: Your Career, Your Story", recipients: 1622, openRate: 26.82, clickRate: 2.22, unsubRate: 0.18 },
  { date: "2025-07-14", name: "Got Questions? Live Hackathon Q&A", recipients: 1619, openRate: 28.66, clickRate: 2.29, unsubRate: 0.49 },
  { date: "2025-07-31", name: "She Sharp Newsletter - July 2025", recipients: 1609, openRate: 33.25, clickRate: 2.05, unsubRate: 0.37 },
  { date: "2025-08-17", name: "SheSharp x Fonterra: Business and Technology Transformation", recipients: 1598, openRate: 25.41, clickRate: 3.13, unsubRate: 0.19 },
  { date: "2025-08-27", name: "SheSharp x Fonterra: Business and Technology Transformation (copy 01)", recipients: 1600, openRate: 26.56, clickRate: 1.25, unsubRate: 0.31 },
  { date: "2025-08-31", name: "She Sharp Newsletter - August 2025", recipients: 1594, openRate: 36.14, clickRate: 1.13, unsubRate: 0.31 },
  { date: "2025-09-06", name: "SheSharp x Secure Code Warrior x Xero - Cybersecurity Workshop", recipients: 1591, openRate: 23.88, clickRate: 2.26, unsubRate: 0.25 },
  { date: "2025-09-16", name: "SheSharp x Secure Code Warrior x Xero - Cybersecurity Workshop", recipients: 1605, openRate: 21.12, clickRate: 1.06, unsubRate: 0.06 },
  { date: "2025-09-30", name: "Newsletter - September 2025", recipients: 1598, openRate: 34.54, clickRate: 1.00, unsubRate: 0.25 },
  { date: "2025-10-17", name: "SheSharp x Secure Code Warrior x Xero - Cybersecurity Workshop", recipients: 1722, openRate: 25.38, clickRate: 1.63, unsubRate: 0.12 },
  { date: "2025-10-17", name: "SheSharp x Vector: Future-Ready (erratum)", recipients: 1721, openRate: 23.59, clickRate: 0.99, unsubRate: 0.23 },
  { date: "2025-10-31", name: "Newsletter - October 2025", recipients: 1717, openRate: 25.39, clickRate: 0.82, unsubRate: 0.35 },
  { date: "2025-11-01", name: "SheSharp x Vector: Future-Ready EDM #2", recipients: 1713, openRate: 24.64, clickRate: 1.93, unsubRate: 0.12 },
  { date: "2025-11-09", name: "SheSharp x HCLTech (Dunedin Event) EDM#1", recipients: 1711, openRate: 26.77, clickRate: 3.33, unsubRate: 0.47 },
  { date: "2025-12-24", name: "Newsletter - December 2025", recipients: 1709, openRate: 32.59, clickRate: 1.11, unsubRate: 0.88 },
  { date: "2026-02-14", name: "SheSharp x academyEX IWD Email#1", recipients: 1675, openRate: 27.22, clickRate: 3.76, unsubRate: 0.18 },
  { date: "2026-02-24", name: "SheSharp x IWD EDM#2", recipients: 1667, openRate: 24.90, clickRate: 1.56, unsubRate: 0.24 },
  { date: "2026-03-02", name: "Newsletter - March 2026", recipients: 1669, openRate: 44.46, clickRate: 1.62, unsubRate: 0.36 },
  { date: "2026-03-21", name: "SheSharp x MetLifeCare Mind Coach April Event Email #1", recipients: 1654, openRate: 32.83, clickRate: 2.06, unsubRate: 0.36 },
  { date: "2026-03-30", name: "SheSharp x MetLifeCare EDM#2", recipients: 1641, openRate: 24.19, clickRate: 2.13, unsubRate: 0.30 },
  { date: "2026-04-13", name: "Newsletter - April 2026", recipients: 1638, openRate: 49.45, clickRate: 1.77, unsubRate: 1.95 },
  { date: "2026-04-13", name: "Newsletter - April 2026", recipients: 1618, openRate: 33.50, clickRate: 1.67, unsubRate: 0.19 },
  { date: "2026-04-25", name: "SheSharp x AUT LinkedIn Event EDM #1", recipients: 1607, openRate: 19.48, clickRate: 1.74, unsubRate: 0.19 },
  { date: "2026-05-04", name: "SheSharp x AUT LinkedIn Event EDM #2", recipients: 1601, openRate: 19.99, clickRate: 1.00, unsubRate: 0.19 },
  { date: "2026-05-31", name: "May Month Newsletter", recipients: 1595, openRate: 33.61, clickRate: 1.88, unsubRate: 0.69 },
  { date: "2026-06-23", name: "She Sharp Newsletter - June 2026", recipients: 1578, openRate: 33.21, clickRate: 2.03, unsubRate: 0.25 },
  { date: "2026-06-23", name: "She Sharp Newsletter - June 2026", recipients: 1574, openRate: 30.94, clickRate: 2.03, unsubRate: 0.38 },
  { date: "2026-07-04", name: "SheSharp x MYOB Event EDM #1", recipients: 1569, openRate: 19.82, clickRate: 2.42, unsubRate: 0.19 },
  { date: "2026-07-07", name: "Resend: SheSharp x MYOB Event EDM #1", recipients: 743, openRate: 13.86, clickRate: 1.48, unsubRate: 0.40 },
  { date: "2026-07-14", name: "She Sharp x MYOB EDM #2-setB", recipients: 1560, openRate: 19.04, clickRate: 2.24, unsubRate: 0.06 },
];

const REGISTER_URL = "https://register.charities.govt.nz/Charity/CC57025";

function requireVaults(humanitixExport: string, mailchimpExport: string) {
  const missing: string[] = [];
  if (!humanitixVaultExists(humanitixExport)) missing.push(`private/humanitix/${humanitixExport}/`);
  if (!mailchimpVaultExists(mailchimpExport)) missing.push(`private/mailchimp/${mailchimpExport}/`);
  if (missing.length === 0) return;
  console.error(
    "This script needs both raw exports. Missing:\n" +
      missing.map((m) => `  ${m}`).join("\n") +
      "\n\nThe committed archives hold aggregates only. Retention (how many people at\n" +
      "an event had been to one before) and the year-by-year list flow both need\n" +
      "per-person rows, which are never committed. Set HUMANITIX_VAULT_DIR /\n" +
      "MAILCHIMP_VAULT_DIR, or point them at the she-sharp-slack-archive copies."
  );
  process.exit(1);
}

/** Lowercased address, buyer address as fallback — the identity rule used across scripts/. */
function attendeeIdentity(row: Record<string, string>): string {
  return String(row["Email"] || row["Buyer email"] || "").trim().toLowerCase();
}

function yearOfIso(value: string): string {
  return String(value ?? "").slice(0, 4);
}

/**
 * Where `record.json` goes now that the report that reads it is a separate repo.
 *
 * `report-internal/` moved to NZ-SheSharp/she-sharp-reports on 2026-09-01, but
 * this generator stayed: building the record means reconciling what the WEBSITE
 * claims against what Humanitix and Mailchimp RECORDED, so it needs the live
 * `lib/data/{events,sponsors,team,stats}` modules as well as the archives.
 * Forking those four would let the internal record disagree with the website,
 * which is worse than having no internal record.
 *
 * So the direction is: this repo produces the data, the other repo sets it. Same
 * shape as HUMANITIX_VAULT_DIR / MAILCHIMP_VAULT_DIR — an explicit variable,
 * then a sibling checkout, then a failure that names what to set.
 */
function defaultOutPath(): string {
  const explicit = process.env.SHESHARP_REPORTS_DIR;
  const candidate =
    explicit ?? path.resolve(REPO_ROOT, "..", "she-sharp-reports");

  if (!existsSync(path.join(candidate, "report-internal"))) {
    throw new Error(
      `Cannot find the she-sharp-reports checkout.
` +
        `Looked in: ${candidate}
` +
        `Set SHESHARP_REPORTS_DIR to it, or pass --out <file> to write the ` +
        `record somewhere else. The report project that reads this file moved ` +
        `to NZ-SheSharp/she-sharp-reports on 2026-09-01.`,
    );
  }
  return path.join(candidate, "report-internal", "data", "record.json");
}

function main() {
  const argv = process.argv.slice(2);
  const humanitixExport = humanitixManifest.exports.at(-1)?.exportId ?? "";
  const mailchimpExport = mailchimpManifest.exports.at(-1)?.exportId ?? "";
  const outPath = argValue(argv, "--out") ?? defaultOutPath();

  requireVaults(humanitixExport, mailchimpExport);

  // ── The event register — every event, ticketed or not ─────────────────────
  //
  // 96 held against 62 ticketed instances. The gap is not an error: events
  // before 2020 predate the ticketing account entirely, and expos, panels and
  // anything sold by a host partner never touched it. It is the single most
  // important thing to understand before reading any attendance figure here.
  const now = new Date("2026-12-31");
  const registerByYear = new Map<string, number>();
  for (const event of getAllEvents()) {
    const raw = (event as unknown as { date?: string }).date;
    const parsed = raw ? parseDateString(raw) : null;
    if (!parsed || Number.isNaN(parsed.getTime()) || parsed > now) continue;
    const year = String(parsed.getFullYear());
    registerByYear.set(year, (registerByYear.get(year) ?? 0) + 1);
  }

  // ── Ticketed events, per year, with retention ─────────────────────────────
  const spineFile = humanitixManifest.exports
    .find((e) => e.exportId === humanitixExport)
    ?.files.find((f) => f.role === "spine");
  if (!spineFile) throw new Error(`No spine file recorded for export ${humanitixExport}`);
  const spine = readHumanitixCsv(humanitixExport, spineFile.file);

  /** First event date each person appears at, across the whole archive. */
  const firstSeen = new Map<string, string>();
  for (const row of spine) {
    const id = attendeeIdentity(row);
    if (!id) continue;
    const date = parseDmyToIso(row["Event date"] ?? "");
    if (!date) continue;
    const seen = firstSeen.get(id);
    if (!seen || date < seen) firstSeen.set(id, date);
  }

  const peopleByYear = new Map<string, Set<string>>();
  for (const row of spine) {
    const id = attendeeIdentity(row);
    const year = yearOfIso(parseDmyToIso(row["Event date"] ?? ""));
    if (!id || !year) continue;
    if (!peopleByYear.has(year)) peopleByYear.set(year, new Set());
    peopleByYear.get(year)!.add(id);
  }

  const ticketedByYear = humanitixAggregates.byYear.map((y) => {
    const year = String(y.year);
    const people = peopleByYear.get(year) ?? new Set<string>();
    let firstTimers = 0;
    for (const id of people) if (yearOfIso(firstSeen.get(id) ?? "") === year) firstTimers++;
    return {
      year: y.year,
      instances: y.instances,
      registered: y.registered,
      people: people.size,
      newPeople: firstTimers,
      returningPeople: people.size - firstTimers,
      checkedIn: y.checkedIn,
      checkInDataPresent: y.checkInDataPresent,
      checkInRate: y.checkInRate,
      earnings: y.earnings,
      registerEvents: registerByYear.get(year) ?? 0,
    };
  });

  // ── The mailing list, year by year ────────────────────────────────────────
  //
  // Reconstructed, not recorded. Mailchimp exports a snapshot of the present:
  // one row per contact carrying the moment they joined, the moment they left,
  // and the moment a bounce removed them. Replaying those three timestamps
  // rebuilds the position at each year end. Contacts who never subscribed are
  // excluded — they were never emailable and counting them as joins would
  // inflate every year.
  const subscribed = readMailchimpCsv(mailchimpExport, MAILCHIMP_FILES.subscribed);
  const unsubscribed = readMailchimpCsv(mailchimpExport, MAILCHIMP_FILES.unsubscribed);
  const cleaned = readMailchimpCsv(mailchimpExport, MAILCHIMP_FILES.cleaned);

  const joined = new Map<string, number>();
  const left = new Map<string, number>();
  const bounced = new Map<string, number>();
  const bump = (m: Map<string, number>, y: string) => {
    if (y) m.set(y, (m.get(y) ?? 0) + 1);
  };
  for (const set of [subscribed, unsubscribed, cleaned])
    for (const row of set) bump(joined, yearOfIso(row["OPTIN_TIME"] ?? ""));
  for (const row of unsubscribed) bump(left, yearOfIso(row["UNSUB_TIME"] ?? ""));
  for (const row of cleaned) bump(bounced, yearOfIso(row["CLEAN_TIME"] ?? ""));

  const listYears = [...new Set([...joined.keys(), ...left.keys(), ...bounced.keys()])].sort();
  let running = 0;
  const listByYear = listYears.map((year) => {
    const j = joined.get(year) ?? 0;
    const u = left.get(year) ?? 0;
    const b = bounced.get(year) ?? 0;
    running += j - u - b;
    return { year: Number(year), joined: j, unsubscribed: u, bounced: b, net: j - u - b, emailableAtYearEnd: running };
  });

  // The replay should land on the export's own subscriber count. It lands one
  // short: a single contact carries no OPTIN_TIME, so it never enters the
  // series. Stated rather than silently absorbed — a reconstruction that
  // reconciles to within one row is trustworthy; one that is quietly forced is
  // not.
  const reconciliation = {
    replayed: running,
    actual: subscribed.length,
    difference: subscribed.length - running,
    note:
      "The replay ends one contact short of the export's own subscriber count. " +
      "One contact carries no OPTIN_TIME and therefore never joins the series. " +
      "Nothing is adjusted to close the gap.",
  };

  const record = {
    metadata: {
      generatedBy: "scripts/internal-report/build-record.ts",
      generatedFor: "report-internal/ — She Sharp internal record report",
      humanitixExport,
      mailchimpExport,
      filedReturnsReadAt: "2026-08-24",
      registerUrl: REGISTER_URL,
      note:
        "GENERATED — do not hand-edit. Counts only: no address, name, IP or code " +
        "appears here or can be recovered from it. Re-run against a newer export " +
        "to refresh; that is the whole update procedure.",
    },

    // What each system knows, and from when. Read this before any number.
    coverage: [
      { source: "Event register (lib/data/json/)", from: "2014", to: "2026", holds: "Every event, ticketed or not. Attendance only where a ticketing record exists." },
      { source: "Humanitix ticketing", from: "2020-03", to: "2026-09", holds: "Registrations, check-ins, earnings, employer answers. 62 of the 96 events held." },
      { source: "Mailchimp audience", from: "2019-07", to: "2026-08", holds: "Joins, departures, bounces. No campaign open or click data was exportable." },
      { source: "Charities Register CC57025", from: "FY2020", to: "FY2025", holds: "Filed income and expenditure. FY2026 will not be filed until 2027." },
      { source: "Member platform (Neon)", from: "2026-03", to: "2026-08", holds: "Accounts, roles, profiles, mentorship queue. Four months old." },
    ],

    events: {
      registerHeld: getEventsHeldCount(),
      registerByYear: [...registerByYear.entries()]
        .map(([year, events]) => ({ year: Number(year), events }))
        .sort((a, b) => a.year - b.year),
      ticketedInstances: humanitixAggregates.totals.instances,
      byYear: ticketedByYear,
    },

    people: {
      unique: humanitixAggregates.people.uniquePeople,
      repeatDistribution: humanitixAggregates.people.repeatDistribution,
      maxInstancesPerPerson: humanitixAggregates.people.maxInstancesPerPerson,
      caveat: humanitixAggregates.people.caveat,
    },

    checkIn: {
      instances: humanitixAggregates.checkInCoverage.instances,
      withCheckIns: humanitixAggregates.checkInCoverage.withCheckIns,
      withZeroCheckIns: humanitixAggregates.checkInCoverage.withZeroCheckIns,
      firstScanned: humanitixAggregates.checkInCoverage.firstInstanceWithCheckIns,
    },

    list: {
      contacts: mailchimpAggregates.totals.contacts,
      subscribed: mailchimpAggregates.totals.subscribed,
      suppressed: mailchimpAggregates.totals.suppressed,
      byStatus: mailchimpAggregates.byStatus,
      byYear: listByYear,
      reconciliation,
    },

    finance: {
      filed: FILED_RETURNS,
      ticketing: humanitixAggregates.byYear.map((y) => ({ year: y.year, earnings: y.earnings })),
      ticketingLifetime: humanitixAggregates.totals.earnings,
      payouts: humanitixAggregates.totals.payouts,
    },

    // The outward figures, beside what the registers hold. Every `claimed`
    // value is read from lib/data/stats.ts at build time, so this page cannot
    // drift from what the website actually publishes.
    claims: [
      {
        claim: "Members",
        claimed: globalStats.members.current,
        recorded: humanitixAggregates.people.uniquePeople,
        recordedLabel: "distinct people who ever registered for a ticketed event, 2020 onward",
        alsoRecorded: mailchimpAggregates.totals.contacts,
        alsoRecordedLabel: "contacts in the mailing audience, of which " + mailchimpAggregates.totals.subscribed + " may be emailed",
      },
      {
        claim: "Sponsors",
        claimed: globalStats.sponsors.current,
        recorded: scrollingSponsorLogos.length,
        recordedLabel: "organisations on the cumulative logo wall",
        alsoRecorded: tieredSponsors.length,
        alsoRecordedLabel: "sponsors carrying a tier in the register",
      },
      {
        claim: "Events since 2014",
        claimed: globalStats.events.total,
        recorded: getEventsHeldCount(),
        recordedLabel: "events on the register dated on or before today",
        alsoRecorded: humanitixAggregates.totals.instances,
        alsoRecordedLabel: "of them with a ticketing record",
      },
      {
        claim: "Mentors",
        claimed: globalStats.mentorship.mentors,
        recorded: 26,
        recordedLabel: "mentor records created in the 2026 cycle, 25 of them a single batch import",
        alsoRecorded: 0,
        alsoRecordedLabel: "active pairings, on both the database and the programme's own weekly digest",
      },
      {
        claim: "Mentees",
        claimed: globalStats.mentorship.mentees,
        recorded: 11,
        recordedLabel: "mentee submissions in the 2026 cycle",
        alsoRecorded: 10,
        alsoRecordedLabel: "still in the waiting queue",
      },
    ],

    email: {
      campaigns: EMAIL_CAMPAIGNS,
      totalRecipients: EMAIL_CAMPAIGNS.reduce((a, c) => a + c.recipients, 0),
      byYear: [...new Set(EMAIL_CAMPAIGNS.map((c) => c.date.slice(0, 4)))]
        .sort()
        .map((year) => {
          const rows = EMAIL_CAMPAIGNS.filter((c) => c.date.startsWith(year));
          const sent = rows.reduce((a, c) => a + c.recipients, 0);
          // Recipient-weighted, matching how the source document computes its
          // own averages. An unweighted mean would let a 743-recipient resend
          // count for as much as a full send.
          const weighted = (pick: (c: EmailCampaign) => number) =>
            Math.round((rows.reduce((a, c) => a + pick(c) * c.recipients, 0) / sent) * 100) / 100;
          return {
            year: Number(year),
            campaigns: rows.length,
            recipients: sent,
            openRate: weighted((c) => c.openRate),
            clickRate: weighted((c) => c.clickRate),
            unsubRate: weighted((c) => c.unsubRate),
          };
        }),
      attributedRevenue: 0,
      source:
        "She_Sharp_Campaign_Performance_Report_Jan2025-Feb2026_v0.1.docx, " +
        "prepared by Prasanth Pavithran from the Mailchimp campaign report. " +
        "Transcribed and cross-checked; see the header of build-record.ts.",
    },

    mentorship: MENTORSHIP_2026,

    team: { size: teamMembers.length },
  };

  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n", "utf8");

  console.log(`Wrote ${outPath}`);
  console.log(`  events held        ${record.events.registerHeld} (${record.events.ticketedInstances} ticketed)`);
  console.log(`  distinct people    ${record.people.unique}`);
  console.log(`  emailable now      ${record.list.subscribed} of ${record.list.contacts}`);
  console.log(`  list replay        ${reconciliation.replayed} vs ${reconciliation.actual} actual`);
  console.log(`  filed returns      ${FILED_RETURNS.length} years, FY2020..FY2025`);
}

main();
