/**
 * Compares a normalized recipient file against the LIVE Resend roster and says,
 * per address, what would actually happen on import.
 *
 * This is the read-only rehearsal that has to happen before anyone runs
 * `resend contacts imports create`. Resend's import is a fire-and-forget async
 * job with no batch undo: once 300 addresses land, the only way back is 300
 * `contacts delete` calls. So the question "who is genuinely new, and who is
 * someone we already agreed never to email again?" must be answered BEFORE the
 * job starts, not from the import's own counts afterwards.
 *
 * The categories are deliberately not symmetrical. `new` is the only group an
 * import may create. `unsubscribed` is the group that makes this script exist:
 * a contact who opted out is invisible in a fresh event CSV — the CSV has no
 * idea they unsubscribed — and `--on-conflict upsert` would happily resurrect
 * them. Resend is the only place that memory lives, so we ask it every time.
 *
 * Every address is masked (`j****@gmail.com`) in both the human and the --json
 * output. A roster diff is routinely pasted into Slack or a plan block, and a
 * plaintext list of subscriber addresses does not belong in either.
 *
 * Usage:
 *   npx tsx .claude/skills/update-mailing-list/scripts/diff-roster.ts \
 *     --recipients tmp/emails/recipients-<key>.json \
 *     [--segment-id <uuid>] [--json]
 *
 * Flags:
 *   --recipients   Path to a recipients-<key>.json written by
 *                  `scripts/email/normalize-recipients.ts --map …`. Required.
 *   --segment-id   Also fetch that segment's membership, so the report can
 *                  separate "already a contact" from "already in THIS segment".
 *                  Without it, `alreadyInSegment` is always empty.
 *   --json         Emit the machine-readable report instead of the prose one.
 *                  Addresses stay masked.
 *
 * Output (--json):
 *   { recipientsFile, key, tier, consentSource, consentDate, restrictedTo,
 *     segmentId,
 *     resend: { contacts, subscribed, segmentMembers },
 *     new: Entry[], alreadyPresent: Entry[], unsubscribed: Entry[],
 *     alreadyInSegment: Entry[], suppressed: Entry[],
 *     counts: { recipients, new, alreadyPresent, unsubscribed,
 *               alreadyInSegment, suppressed, importable } }
 *   where Entry = { email (masked), name, contactId? }.
 *
 * `counts.importable` is the number this run would legitimately add: `new`
 * minus anything also suppressed. It is the single number to quote in the plan
 * block.
 *
 * Exit codes: 0 on a clean report (even one with zero importable rows), 1 on a
 * usage error, an unreadable recipients file, or an unusable `resend` CLI.
 */

import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { hashEmail, loadSuppressionHashes } from "../../../../scripts/email/suppression";
import type { AudienceTier } from "../../../../lib/email/audience";
import { describeTier } from "../../../../lib/email/audience";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

/** One row of a recipients-<key>.json file (see normalize-recipients.ts). */
interface Recipient {
  email: string;
  firstName: string | null;
  lastName: string | null;
  fields?: Record<string, string>;
}

/** The subset of recipients-<key>.json this script reads. */
interface RecipientsFile {
  key: string;
  source: string;
  tier: AudienceTier;
  consentSource: string | null;
  consentDate: string | null;
  /**
   * The narrowing filter `normalize-recipients.ts --restrict-to-hashes` applied,
   * when one was used. Optional because every file written before that flag
   * existed simply has no such key.
   */
  restrictedTo?: { path: string; hashes: number } | null;
  recipients: Recipient[];
}

/** A Resend contact as returned by `resend contacts list --json`. */
interface ResendContact {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  unsubscribed?: boolean;
}

/** Envelope shared by every paginated `resend … list --json` response. */
interface ResendList<T> {
  data?: T[];
  has_more?: boolean;
}

/** One classified row, safe to print or paste anywhere. */
interface Entry {
  /** Masked address — never the real one. */
  email: string;
  /** Display name from the CSV, or "(no name)". */
  name: string;
  /** Resend contact id, when the address already exists there. */
  contactId?: string;
}

interface Report {
  recipientsFile: string;
  key: string;
  tier: AudienceTier;
  consentSource: string | null;
  consentDate: string | null;
  restrictedTo: { path: string; hashes: number } | null;
  segmentId: string | null;
  resend: { contacts: number; subscribed: number; segmentMembers: number | null };
  new: Entry[];
  alreadyPresent: Entry[];
  unsubscribed: Entry[];
  alreadyInSegment: Entry[];
  suppressed: Entry[];
  counts: {
    recipients: number;
    new: number;
    alreadyPresent: number;
    unsubscribed: number;
    alreadyInSegment: number;
    suppressed: number;
    importable: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fail(message: string, ...details: string[]): never {
  console.error(`Error: ${message}`);
  for (const line of details) console.error(line);
  process.exit(1);
}

/**
 * Masks an address for display: first character, then the domain.
 *
 * Matches `scripts/email/audience-report.ts` so the two reports look alike.
 *
 * @param email Raw address.
 * @returns e.g. `j****@gmail.com`.
 */
function mask(email: string): string {
  const value = email.trim();
  if (value.length === 0) return "(none)";
  const at = value.lastIndexOf("@");
  if (at <= 0) return `${value[0]}****`;
  return `${value[0]}****${value.slice(at)}`;
}

/** Normalizes an address the same way every other email script does. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Builds the printable name for a recipient. */
function displayName(recipient: Recipient): string {
  const parts = [recipient.firstName, recipient.lastName].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0
  );
  return parts.length > 0 ? parts.join(" ") : "(no name)";
}

/** Reads `--flag value`, erroring if the value is missing or is another flag. */
function readOption(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) fail(`${flag} requires a value.`);
  return value;
}

// ---------------------------------------------------------------------------
// Resend CLI
// ---------------------------------------------------------------------------

/** Page size — the CLI caps `--limit` at 100. */
const PAGE_SIZE = 100;

/**
 * Runs one `resend` subcommand and parses its JSON envelope.
 *
 * @param args Subcommand and flags, e.g. `["contacts", "list", "--json"]`.
 * @returns The parsed envelope.
 * @throws Error with an actionable message when the CLI is missing or errored.
 */
async function resendJson<T>(args: string[]): Promise<ResendList<T>> {
  try {
    const { stdout } = await execFileAsync("resend", args, {
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    });
    return JSON.parse(stdout) as ResendList<T>;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error(
        "the `resend` CLI is not on PATH.\n" +
          "  Install it with `npm i -g resend-cli`, then run `resend login` and\n" +
          "  `resend whoami` to confirm the key is saved. Without it there is no way\n" +
          "  to know who is already on the list, so this script will not guess."
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `resend ${args.join(" ")} failed: ${message}\n` +
        "  If this says auth_error, run `resend login` and retry."
    );
  }
}

/**
 * Pages through a `resend … list` command until `has_more` is false.
 *
 * The CLI's cursor is a contact id passed as `--after`, and the default page
 * size is 10 — a roster of any size is silently truncated without this loop.
 *
 * @param args Base subcommand, e.g. `["contacts", "list"]`.
 * @returns Every row across all pages, in CLI order.
 */
async function resendListAll(args: string[]): Promise<ResendContact[]> {
  const rows: ResendContact[] = [];
  let after: string | null = null;

  // Bounded so a server that never clears has_more cannot spin forever.
  for (let page = 0; page < 200; page += 1) {
    const paged = [...args, "--limit", String(PAGE_SIZE), "--json"];
    if (after) paged.push("--after", after);

    const envelope = await resendJson<ResendContact>(paged);
    const data = envelope.data ?? [];
    rows.push(...data);
    if (envelope.has_more !== true || data.length === 0) break;
    after = data[data.length - 1].id;
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Reading the recipients file
// ---------------------------------------------------------------------------

/**
 * Loads and shape-checks a recipients file.
 *
 * @param path Path as given on the command line.
 * @returns The parsed file.
 */
function readRecipientsFile(path: string): RecipientsFile {
  const resolved = resolve(path);
  let raw: string;
  try {
    raw = readFileSync(resolved, "utf8");
  } catch {
    fail(
      `could not read ${resolved}`,
      "",
      "This file is produced by:",
      "  npx tsx scripts/email/normalize-recipients.ts <input.csv> --key <k> --map \"…\"",
      "Run that first, then point --recipients at tmp/emails/recipients-<key>.json."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`${resolved} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as RecipientsFile).recipients)
  ) {
    fail(
      `${resolved} does not look like a recipients file.`,
      'It must be an object with a "recipients" array — the output of normalize-recipients.ts.'
    );
  }

  return parsed as RecipientsFile;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

/**
 * Sorts every recipient into exactly one primary bucket, plus flags.
 *
 * Precedence is unsubscribed → suppressed → already present → new, because the
 * strongest signal is the one that must be reported. A recipient can also
 * appear in `alreadyInSegment`, which is a refinement of `alreadyPresent`
 * rather than a bucket of its own.
 *
 * @param recipients Rows from the recipients file.
 * @param contacts Every Resend contact.
 * @param segmentMembers Contact ids in the target segment, or null when no
 *   `--segment-id` was given.
 * @returns The classified buckets.
 */
function classify(
  recipients: Recipient[],
  contacts: ResendContact[],
  segmentMembers: Set<string> | null
): Pick<Report, "new" | "alreadyPresent" | "unsubscribed" | "alreadyInSegment" | "suppressed"> {
  const byEmail = new Map<string, ResendContact>();
  for (const contact of contacts) byEmail.set(normalizeEmail(contact.email), contact);

  const suppressedHashes = loadSuppressionHashes();

  const buckets = {
    new: [] as Entry[],
    alreadyPresent: [] as Entry[],
    unsubscribed: [] as Entry[],
    alreadyInSegment: [] as Entry[],
    suppressed: [] as Entry[],
  };

  for (const recipient of recipients) {
    const email = normalizeEmail(recipient.email);
    const contact = byEmail.get(email);
    const entry: Entry = { email: mask(email), name: displayName(recipient) };
    if (contact) entry.contactId = contact.id;

    if (suppressedHashes.has(hashEmail(email))) {
      buckets.suppressed.push(entry);
    }

    if (contact && contact.unsubscribed === true) {
      buckets.unsubscribed.push(entry);
      continue;
    }

    if (contact) {
      buckets.alreadyPresent.push(entry);
      if (segmentMembers && segmentMembers.has(contact.id)) {
        buckets.alreadyInSegment.push(entry);
      }
      continue;
    }

    // Suppressed-and-absent still counts as "not importable", but it is
    // reported under `suppressed` only — putting it in `new` would invite
    // someone to import it.
    if (!suppressedHashes.has(hashEmail(email))) {
      buckets.new.push(entry);
    }
  }

  return buckets;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** Prints up to `limit` entries, then an overflow line. */
function printEntries(entries: Entry[], limit: number): void {
  for (const entry of entries.slice(0, limit)) {
    console.log(`    ${entry.email.padEnd(28)} ${entry.name}`);
  }
  if (entries.length > limit) console.log(`    … and ${entries.length - limit} more`);
}

/** How many addresses are listed per bucket before collapsing. */
const SAMPLE_LIMIT = 10;

function printReport(report: Report): void {
  console.log("");
  console.log(`Roster diff — ${report.key}`);
  console.log("===================================");
  console.log(`  Recipients file  ${report.recipientsFile}`);
  console.log(`  Audience         ${describeTier(report.tier)}`);
  console.log(
    `  Consent          ${
      report.consentSource
        ? `${report.consentSource} (${report.consentDate})`
        : "NOT RECORDED — this file may not be imported"
    }`
  );
  if (report.restrictedTo) {
    // Without this line the plan block reads "412 recipients" with no
    // explanation of where the other 1,148 went, and an unexplained drop in a
    // consent-sensitive report is the kind of thing a reader has to assume the
    // worst about.
    console.log(
      `  Restricted to    ${report.restrictedTo.hashes} hash(es) — ${report.counts.recipients} row(s) survived`
    );
    console.log(`                   ${report.restrictedTo.path}`);
    console.log("                   (a send-order filter over an already-consented list, not a consent source)");
  }
  console.log(
    `  Resend now       ${report.resend.contacts} contact(s), ${report.resend.subscribed} still subscribed`
  );
  if (report.segmentId) {
    console.log(
      `  Segment          ${report.segmentId} — ${report.resend.segmentMembers ?? 0} member(s)`
    );
  }
  console.log("===================================");

  console.log("");
  console.log(`NEW — not in Resend, would be created (${report.counts.new})`);
  printEntries(report.new, SAMPLE_LIMIT);
  if (report.new.length === 0) console.log("    (none)");

  console.log("");
  console.log(`ALREADY PRESENT — subscribed contacts (${report.counts.alreadyPresent})`);
  printEntries(report.alreadyPresent, SAMPLE_LIMIT);
  if (report.alreadyPresent.length === 0) console.log("    (none)");

  if (report.segmentId) {
    console.log("");
    console.log(`ALREADY IN SEGMENT (${report.counts.alreadyInSegment})`);
    printEntries(report.alreadyInSegment, SAMPLE_LIMIT);
    if (report.alreadyInSegment.length === 0) console.log("    (none)");
  }

  console.log("");
  console.log(`UNSUBSCRIBED — MUST NOT be re-added (${report.counts.unsubscribed})`);
  printEntries(report.unsubscribed, SAMPLE_LIMIT);
  if (report.unsubscribed.length === 0) console.log("    (none)");

  console.log("");
  console.log(`SUPPRESSED — on the do-not-contact register (${report.counts.suppressed})`);
  printEntries(report.suppressed, SAMPLE_LIMIT);
  if (report.suppressed.length === 0) console.log("    (none)");

  console.log("");
  console.log("Conclusion");
  console.log("===================================");
  console.log(`  Importable now:  ${report.counts.importable} address(es).`);
  if (report.counts.unsubscribed > 0) {
    console.log(
      `  ${report.counts.unsubscribed} unsubscribed address(es) are in this file. They are EXCLUDED here,`
    );
    console.log(
      "  but `--on-conflict upsert` would resurrect them — remove those rows from the CSV"
    );
    console.log("  before importing, or import with the diff's own list, not the raw file.");
  }
  if (report.counts.importable === 0) {
    console.log("  Nothing to import. Do not run `contacts imports create`.");
  }
  console.log("===================================");
  console.log("");
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  const recipientsPath = readOption(argv, "--recipients");
  if (!recipientsPath) {
    fail(
      "--recipients is required.",
      "",
      "Usage:",
      "  npx tsx .claude/skills/update-mailing-list/scripts/diff-roster.ts \\",
      "    --recipients tmp/emails/recipients-<key>.json [--segment-id <uuid>] [--json]"
    );
  }

  const segmentId = readOption(argv, "--segment-id");
  const asJson = argv.includes("--json");

  const file = readRecipientsFile(recipientsPath);

  const contacts = await resendListAll(["contacts", "list"]);
  let segmentMembers: Set<string> | null = null;
  if (segmentId) {
    const members = await resendListAll(["segments", "contacts", segmentId]);
    segmentMembers = new Set(members.map((member) => member.id));
  }

  const buckets = classify(file.recipients, contacts, segmentMembers);

  const report: Report = {
    recipientsFile: resolve(recipientsPath),
    key: file.key,
    tier: file.tier,
    consentSource: file.consentSource,
    consentDate: file.consentDate,
    restrictedTo: file.restrictedTo ?? null,
    segmentId,
    resend: {
      contacts: contacts.length,
      subscribed: contacts.filter((contact) => contact.unsubscribed !== true).length,
      segmentMembers: segmentMembers ? segmentMembers.size : null,
    },
    ...buckets,
    counts: {
      recipients: file.recipients.length,
      new: buckets.new.length,
      alreadyPresent: buckets.alreadyPresent.length,
      unsubscribed: buckets.unsubscribed.length,
      alreadyInSegment: buckets.alreadyInSegment.length,
      suppressed: buckets.suppressed.length,
      // `new` already excludes suppressed-and-absent rows, so it IS the
      // importable count — no second subtraction.
      importable: buckets.new.length,
    },
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  printReport(report);
}

/**
 * Refuses to run, and says why.
 *
 * This script diffs a recipient file against the LIVE RESEND roster, and Resend
 * is no longer where the mailing list lives — `newsletter_subscribers` is. Left
 * running it would query an account holding zero contacts and report every row
 * as new: a confidently wrong answer, of exactly the shape that causes a bad
 * import. It has not been repointed at the database because the import path
 * itself is not built yet; this guard comes off when that lands.
 *
 * The body below is left intact rather than deleted, because most of it — the
 * bucketing, the masking, the report — is what the database version will need.
 *
 * A tool that cannot be right should not be allowed to look right.
 */
function refuseOutOfService(): never {
  console.error("diff-roster.ts is out of service.");
  console.error("");
  console.error("  It compares against the Resend contact roster, but the mailing list now");
  console.error("  lives in the newsletter_subscribers table. Against Resend it would report");
  console.error("  every single address as new, because Resend holds none of them.");
  console.error("");
  console.error("  To see who is actually subscribed:");
  console.error("    npx tsx scripts/email/inspect-subscribers.ts");
  console.error("    npx tsx scripts/email/suppression.ts reconcile");
  console.error("");
  console.error("  Importing the Mailchimp list is not built yet. Stop here and say so.");
  process.exit(1);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  refuseOutOfService();
  void main().catch((error: unknown) => {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
