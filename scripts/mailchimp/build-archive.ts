/**
 * Regenerates `lib/data/json/mailchimp/aggregates.json` and `tags.json`.
 *
 * The whole point of this script is that a 3,689-row file of names, addresses,
 * phone numbers and sign-up IPs goes in, and only counts come out. Nothing that
 * identifies a person may reach the two files it writes — not an address, not a
 * hash of one, not a domain so rare that it names somebody.
 *
 * GENERATED. Rebuilt wholesale; never hand-edited. The judgement files it reads
 * — `tag-rules.json` and `crosswalk.json` — are AUTHORED, and this script never
 * writes them, so a regeneration cannot overwrite a decision a person made.
 *
 * Deterministic by construction: every map is emitted sorted, and no timestamp
 * is written. Building twice in a row must produce identical bytes, which is
 * what `--check` after a build proves.
 *
 * Usage:
 *   npx tsx scripts/mailchimp/build-archive.ts --export 2026-08-17 --check
 *   npx tsx scripts/mailchimp/build-archive.ts --export 2026-08-17
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  canonicalOrganisationId,
  humanitixOrganisations,
  isPersonalName,
  personNameKey,
} from "../../lib/data/humanitix";
import type {
  MailchimpAggregates,
  MailchimpCount,
  MailchimpManifest,
  MailchimpStatus,
  MailchimpTag,
  MailchimpTagKind,
  MailchimpTagRule,
  MailchimpTagRules,
  MailchimpTags,
} from "../../types/mailchimp";
import { normalizeEmail, parseTagCell, readCsv, yearOf, type CsvRow } from "./csv";
import { ARCHIVE_DIR, argValue } from "./vault";

/**
 * Minimum contacts before a bucket is named in the committed output.
 *
 * Five, matching the Humanitix archive's `minTickets`. A domain or an employer
 * with one or two people behind it is a re-identification vector: "the sole
 * contact at `<a small consultancy>.co.nz`" is a person, however aggregate the
 * surrounding file looks.
 */
const K_FLOOR = 5;

/** How many buckets to name once the floor has been applied. */
const TOP_N = 40;

/** The status files, in the order they are reported. */
const STATUS_ORDER: MailchimpStatus[] = [
  "subscribed",
  "unsubscribed",
  "nonsubscribed",
  "cleaned",
];

interface LoadedRow {
  status: MailchimpStatus;
  row: CsvRow;
  /** Tags parsed out of the cell. */
  tags: string[];
  /** True when the TAGS cell failed the CSV round-trip check. */
  tagCellMalformed: boolean;
}

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(ARCHIVE_DIR, name), "utf8")) as T;
}

/**
 * Serialises a generated file.
 *
 * CRLF, matching `lib/data/json/humanitix/` and the rest of `lib/data/json/`.
 * This repository is worked on with `core.autocrlf=true`, so git checks these
 * files out with CRLF on Windows; rendering LF here would make every rebuild
 * look like a whole-file rewrite.
 */
function render(value: unknown): string {
  return (JSON.stringify(value, null, 2) + "\n").replace(/\n/g, "\r\n");
}

/** Reads one status file out of the vault, parsing and vetting its TAGS cells. */
function loadStatus(exportId: string, manifest: MailchimpManifest, status: MailchimpStatus): LoadedRow[] {
  const entry = manifest.exports.find((item) => item.exportId === exportId);
  if (!entry) throw new Error(`Manifest has no export ${exportId}. Run manifest.ts --append first.`);

  const file = entry.files.find((item) => item.status === status);
  if (!file) throw new Error(`Export ${exportId} has no ${status} file.`);

  return readCsv(exportId, file.file).map((row) => {
    const { tags, malformed } = parseTagCell(row["TAGS"]);
    return { status, row, tags, tagCellMalformed: malformed };
  });
}

/** Sorts a count map into a stable, largest-first list. */
function toCounts(map: Map<string, number>, floor = 0): MailchimpCount[] {
  return [...map.entries()]
    .filter(([, contacts]) => contacts >= floor)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"))
    .map(([key, contacts]) => ({ key, contacts }));
}

function bump(map: Map<string, number>, key: string | null | undefined): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

/**
 * Classifies a tag against the authored rules.
 *
 * @returns The kind, or null when no rule matches — which is a build failure,
 *   not a default. A tag nobody has classified is a tag nobody has looked at.
 */
function classifyTag(tag: string, rules: MailchimpTagRule[]): MailchimpTagKind | null {
  for (const rule of rules) {
    const matched =
      rule.match === "prefix"
        ? tag.startsWith(rule.pattern)
        : rule.match === "exact"
          ? tag === rule.pattern
          : rule.match === "contains"
            ? tag.includes(rule.pattern)
            : new RegExp(rule.pattern).test(tag);
    if (matched) return rule.kind;
  }
  return null;
}

function buildTags(rows: LoadedRow[], rules: MailchimpTagRules, exportId: string): MailchimpTags {
  const total = new Map<string, number>();
  const fromMalformed = new Map<string, number>();
  const byStatus = new Map<string, Map<string, number>>();

  for (const { status, tags, tagCellMalformed } of rows) {
    // A contact carrying the same tag twice is counted once: the unit is
    // contacts, not tag applications.
    for (const tag of new Set(tags)) {
      bump(total, tag);
      if (tagCellMalformed) bump(fromMalformed, tag);
      if (!byStatus.has(tag)) byStatus.set(tag, new Map());
      bump(byStatus.get(tag)!, status);
    }
  }

  const unmatched: string[] = [];
  const tags: MailchimpTag[] = [...total.keys()]
    .sort((a, b) => a.localeCompare(b, "en"))
    .map((tag) => {
      const contacts = total.get(tag)!;
      const malformedOnly = (fromMalformed.get(tag) ?? 0) === contacts;

      let kind: MailchimpTagKind;
      if (malformedOnly) {
        kind = "fragment";
      } else {
        const resolved = classifyTag(tag, rules.rules);
        if (!resolved) {
          unmatched.push(tag);
          kind = "label";
        } else {
          kind = resolved;
        }
      }

      const statuses = Object.fromEntries(
        STATUS_ORDER.filter((status) => byStatus.get(tag)!.has(status)).map((status) => [
          status,
          byStatus.get(tag)!.get(status)!,
        ])
      );

      return { tag, kind, contacts, byStatus: statuses, fromMalformedCellOnly: malformedOnly };
    });

  if (unmatched.length > 0) {
    throw new Error(
      `${unmatched.length} tag(s) match no rule in tag-rules.json:\n` +
        unmatched.map((tag) => `    ${JSON.stringify(tag)}`).join("\n") +
        `\n  Add a rule for each. There is no catch-all on purpose: an unclassified tag\n` +
        `  is one nobody has looked at, and bucketing it silently is how that stays true.`
    );
  }

  return {
    metadata: {
      generatedBy: "scripts/mailchimp/build-archive.ts",
      exportId,
      note: "GENERATED — do not hand-edit. Classification rules live in tag-rules.json, which IS hand-authored and is never written by the builder. `contacts` counts CONTACTS, not tag applications: a contact carrying a tag twice is counted once. Tags of kind `fragment` are artefacts of Mailchimp's own broken quoting and were never applied by anyone.",
    },
    distinct: tags.length,
    distinctReal: tags.filter((tag) => tag.kind !== "fragment").length,
    tags,
  };
}

function buildAggregates(rows: LoadedRow[], tags: MailchimpTags, exportId: string): MailchimpAggregates {
  const byStatus = new Map<string, number>();
  const optinYear = new Map<string, number>();
  const changedYear = new Map<string, number>();
  const rating = new Map<string, number>();
  const unsubReason = new Map<string, number>();
  const countries = new Map<string, number>();
  const regions = new Map<string, number>();
  const domains = new Map<string, number>();
  const orgs = new Map<string, number>();

  const emails = new Set<string>();
  const optins: string[] = [];
  let orgAnswered = 0;
  let orgNullish = 0;
  let orgPersonalName = 0;
  let tagged = 0;
  let malformedCells = 0;

  // The set of names present in the export, so an employer string that is
  // really somebody's own name can be recognised. Same trap as Humanitix,
  // where six people typed their own name into the Company box.
  const personNames = new Set(
    rows.map(({ row }) => personNameKey(row["First Name"] ?? "", row["Last Name"] ?? ""))
  );
  personNames.delete("");

  for (const { status, row, tags: rowTags, tagCellMalformed } of rows) {
    bump(byStatus, status);
    if (tagCellMalformed) malformedCells++;
    if (rowTags.length > 0) tagged++;

    const email = normalizeEmail(row["Email Address"]);
    if (email) {
      emails.add(email);
      const domain = email.split("@").pop();
      bump(domains, domain);
    }

    const optin = yearOf(row["OPTIN_TIME"]);
    if (optin) {
      bump(optinYear, optin);
      optins.push((row["OPTIN_TIME"] ?? "").trim());
    }
    bump(changedYear, yearOf(row["LAST_CHANGED"]));
    bump(rating, (row["MEMBER_RATING"] ?? "").trim() || "unrated");

    if (status === "unsubscribed") {
      bump(unsubReason, (row["UNSUB_REASON"] ?? "").trim() || "not given");
    }

    bump(countries, (row["CC"] ?? "").trim().toLowerCase() || null);
    bump(regions, (row["REGION"] ?? "").trim().toLowerCase() || null);

    const employer = (row["Organisation/Institute"] ?? "").trim();
    if (employer) {
      const id = canonicalOrganisationId(employer);
      if (!id) {
        orgNullish++;
      } else if (isPersonalName(employer, personNames)) {
        // Their own name, not an employer. Counted so the suppression is
        // visible, never named — this is exactly the column that would print a
        // real person's name into a funder report if read raw.
        orgPersonalName++;
      } else {
        orgAnswered++;
        bump(orgs, id);
      }
    }
  }

  const orgLabel = (id: string): string =>
    humanitixOrganisations.canonical.find((entry) => entry.id === id)?.name ?? id;

  const domainsAll = toCounts(domains);
  const orgsAll = toCounts(orgs);
  const subscribedRows = rows.filter((item) => item.status === "subscribed");

  const withOptinIp = subscribedRows.filter((item) => (item.row["OPTIN_IP"] ?? "").trim()).length;
  const withConfirmIp = subscribedRows.filter((item) => (item.row["CONFIRM_IP"] ?? "").trim()).length;
  const optinEqualsConfirm = subscribedRows.filter(
    (item) => (item.row["OPTIN_TIME"] ?? "").trim() === (item.row["CONFIRM_TIME"] ?? "").trim()
  ).length;
  const kindOf = new Map(tags.tags.map((tag) => [tag.tag, tag.kind]));
  const eventOrTicketOnly = subscribedRows.filter(
    (item) =>
      item.tags.length > 0 &&
      item.tags.every((tag) => {
        const kind = kindOf.get(tag);
        return kind === "event" || kind === "ticket-type" || kind === "campaign-segment";
      })
  ).length;
  const untaggedSubscribed = subscribedRows.filter((item) => item.tags.length === 0).length;

  const cleaned = byStatus.get("cleaned") ?? 0;

  // Contacts carrying at least one tag of each kind — NOT distinct tags of that
  // kind. The two differ by an order of magnitude (106 ticket-type tags, ~2,000
  // people holding one) and the useful question is how much of the audience a
  // kind reaches.
  const byKind = new Map<string, number>();
  for (const { tags: rowTags } of rows) {
    const kinds = new Set(rowTags.map((tag) => kindOf.get(tag)).filter(Boolean) as string[]);
    for (const kind of kinds) bump(byKind, kind);
  }

  // Sorted once, then read from both ends. Doing it inline would leave the
  // second read depending on the first call having mutated the array.
  const optinsSorted = [...optins].sort();

  return {
    metadata: {
      generatedBy: "scripts/mailchimp/build-archive.ts",
      exportId,
      definitionsDoc: "docs/development/MAILCHIMP_ARCHIVE.md#metric-definitions",
      personHash:
        "None written. Addresses are lowercased and put in a Set to count distinct people, then discarded. Not even a hash is committed: 3,689 unsalted sha256 digests of email addresses are trivially reversible by anyone holding a candidate address list, and every count below survives without them. The one place a hash of a She Sharp address is legitimately committed is lib/data/json/email-suppression-hashes.json, where it answers a question that cannot be answered any other way.",
    },
    totals: {
      contacts: emails.size,
      contactsPerMailchimpUi: emails.size - cleaned,
      subscribed: byStatus.get("subscribed") ?? 0,
      suppressed: rows.length - (byStatus.get("subscribed") ?? 0),
      distinctTags: tags.distinctReal,
      distinctDomains: domains.size,
      firstOptin: optinsSorted[0] ?? "",
      lastOptin: optinsSorted[optinsSorted.length - 1] ?? "",
    },
    byStatus: STATUS_ORDER.map((status) => ({ key: status, contacts: byStatus.get(status) ?? 0 })),
    byOptinYear: toCounts(optinYear).sort((a, b) => a.key.localeCompare(b.key)),
    byLastChangedYear: toCounts(changedYear).sort((a, b) => a.key.localeCompare(b.key)),
    memberRating: toCounts(rating).sort((a, b) => a.key.localeCompare(b.key)),
    unsubReasons: toCounts(unsubReason),
    geo: {
      countries: toCounts(countries, K_FLOOR),
      regions: toCounts(regions, K_FLOOR),
    },
    domains: {
      floor: K_FLOOR,
      distinct: domains.size,
      belowFloor: domainsAll.filter((entry) => entry.contacts < K_FLOOR).length,
      top: domainsAll.filter((entry) => entry.contacts >= K_FLOOR).slice(0, TOP_N),
    },
    organisations: {
      floor: K_FLOOR,
      rowsAnswered: orgAnswered,
      rowsNullish: orgNullish + orgPersonalName,
      distinctCanonical: orgs.size,
      top: orgsAll
        .filter((entry) => entry.contacts >= K_FLOOR)
        .slice(0, TOP_N)
        .map((entry) => ({ ...entry, label: orgLabel(entry.key) })),
    },
    tagCoverage: {
      tagged,
      untagged: rows.length - tagged,
      byKind: toCounts(byKind),
    },
    consentSignals: {
      subscribed: subscribedRows.length,
      withOptinIp,
      optinEqualsConfirm,
      withConfirmIp,
      taggedEventOrTicketOnly: eventOrTicketOnly,
      untagged: untaggedSubscribed,
      caveat:
        "Counts, not a verdict. CONFIRM_IP is empty for every contact in the export and OPTIN_TIME equals CONFIRM_TIME for the large majority, which is the signature of a single-opt-in import rather than a confirmed double opt-in. That does not make the consent invalid — Mailchimp records a single opt-in this way too — but it does mean this export cannot be cited as evidence of double opt-in. The gate on any send remains .claude/skills/update-mailing-list/references/consent-rules.md.",
    },
    caveats: [
      `Mailchimp's own dashboard reports ${emails.size - cleaned} contacts, this archive ${emails.size}. Both are right: the UI figure EXCLUDES the ${cleaned} cleaned (hard-bounced) contacts.`,
      `Only ${byStatus.get("subscribed") ?? 0} of the ${emails.size} may be emailed. The other ${rows.length - (byStatus.get("subscribed") ?? 0)} left, bounced, or never subscribed, and are recorded as hashes in lib/data/json/email-suppression-hashes.json so no future import can re-add them.`,
      `The record starts at ${optinsSorted[0]?.slice(0, 10) ?? "?"}. She Sharp was founded in 2014; anything earlier is not in this data, and one tag (Techweek 2018) refers to an occasion that predates the earliest opt-in because it was applied retrospectively.`,
      "A `Ticket Type:` or `Event:` tag records a ticket list pasted into Mailchimp, not a scanned check-in. Humanitix is authoritative for attendance.",
      `${malformedCells} of the tag cells are malformed: Mailchimp truncates a tag at 100 characters and does not re-close the quote when the cut lands mid-tag, which corrupts the rest of that cell. The ${tags.distinct - tags.distinctReal} resulting strings are marked kind "fragment" in tags.json and were never applied by anyone.`,
      "byOptinYear is sign-ups per year, not list size in that year. Subtracting departures is not possible from this export: an unsubscribe records when someone left, not which year's cohort they were in.",
      "byLastChangedYear is not engagement. A bulk tag operation moves LAST_CHANGED for thousands of contacts who did nothing at all.",
      `Domains and employers below ${K_FLOOR} contacts are counted but never named — a bucket of one is a person.`,
    ],
  };
}

function main() {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const check = argv.includes("--check") || argv.includes("--dry-run");

  if (!exportId) {
    console.error(
      "Usage: npx tsx scripts/mailchimp/build-archive.ts --export <YYYY-MM-DD> [--check]"
    );
    process.exit(1);
  }

  const manifest = loadJson<MailchimpManifest>("manifest.json");
  const rules = loadJson<MailchimpTagRules>("tag-rules.json");

  const rows = STATUS_ORDER.flatMap((status) => loadStatus(exportId, manifest, status));
  const tags = buildTags(rows, rules, exportId);
  const aggregates = buildAggregates(rows, tags, exportId);

  const outputs: [string, unknown][] = [
    ["aggregates.json", aggregates],
    ["tags.json", tags],
  ];

  let changed = 0;
  for (const [name, value] of outputs) {
    const path = join(ARCHIVE_DIR, name);
    const next = render(value);
    const current = existsSync(path) ? readFileSync(path, "utf8") : null;

    if (current === next) {
      console.log(`  unchanged - ${name}`);
      continue;
    }
    changed++;
    if (check) {
      console.log(
        `  WOULD CHANGE - ${name} (${current === null ? "new file" : `${current.length} → ${next.length} bytes`})`
      );
      continue;
    }
    writeFileSync(path, next, "utf8");
    console.log(`  wrote - ${name}`);
  }

  console.log("");
  console.log(
    `${rows.length} contact rows · ${tags.distinct} distinct tag strings (${tags.distinctReal} real, ${tags.distinct - tags.distinctReal} export artefacts)`
  );
  console.log(
    check
      ? changed === 0
        ? "ok - the committed archive already matches the vault"
        : `${changed} file(s) would change. Re-run without --check to write them.`
      : changed === 0
        ? "ok - nothing to write"
        : `${changed} file(s) written.`
  );
}

main();
