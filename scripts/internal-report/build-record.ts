/**
 * build-record.ts — the data behind the internal record report.
 *
 * She Sharp's outward-facing numbers are chosen; this one is counted. The
 * report at `report-internal/` exists so the team can see what the systems
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
import { mkdirSync, writeFileSync } from "node:fs";
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

function main() {
  const argv = process.argv.slice(2);
  const humanitixExport = humanitixManifest.exports.at(-1)?.exportId ?? "";
  const mailchimpExport = mailchimpManifest.exports.at(-1)?.exportId ?? "";
  const outPath =
    argValue(argv, "--out") ??
    path.join(REPO_ROOT, "report-internal", "data", "record.json");

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
