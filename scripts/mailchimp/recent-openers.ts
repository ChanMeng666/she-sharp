/**
 * Computes the "recent openers" ramp cohort as a set of hashed addresses.
 *
 * ## What this is, and what it is emphatically not
 *
 * **This is a send-order filter. It is not a consent source.**
 *
 * Everyone this script can possibly output is already in the `subscribed`
 * audience CSV — route 1 of
 * `.claude/skills/update-mailing-list/references/consent-rules.md`, with their
 * own `OPTIN_TIME` preserved in the 2026-08-17 export archive. What the hash set
 * does is **narrow** those 1,560 people down to the few hundred who actually
 * read something recently, so the first Resend broadcast warms a brand-new
 * sending domain on the people least likely to mark it as spam.
 *
 * `consent-rules.md` governs **widening** a list — who may be added, and on what
 * evidence. **Narrowing an already-consented list needs no permission and grants
 * none.** Picking 412 of 1,560 to email first is a deliverability decision, in
 * the same family as sending on a Tuesday.
 *
 * The hard rule that follows, and the reason the intersection below is not
 * optional: **the openers set may never justify importing anybody who is not on
 * the `subscribed` spine.** A `nonsubscribed` contact who opened a transactional
 * mail is still Tier 3 and may not be emailed. An `unsubscribed` contact who
 * opened an old newsletter is permanently out, and an open is not a change of
 * mind. Engagement is evidence that a person exists and reads email; it has
 * never been evidence that they agreed to hear from us.
 *
 * ## Why the intersection runs before anything is written
 *
 * The set is built from opens, then intersected with the `subscribed` CSV, and
 * only then serialised. Doing it in that order makes the output a subset of the
 * consented list **by construction** — so even a careless use of
 * `normalize-recipients.ts --restrict-to-hashes` downstream cannot widen
 * anything, because the widest thing this file can possibly say is "some of the
 * people you already had".
 *
 * ## Why hashes and not addresses
 *
 * The output holds `hashEmail()` digests only. Per-recipient open data is the
 * most sensitive thing in the Mailchimp account — it says who reads what — and
 * it must not come to rest on disk as a list of addresses. A hash answers the
 * only question the ramp list is ever asked ("is this row in the warm cohort?")
 * while carrying no PII. Nothing here prints or writes an address.
 *
 * Usage:
 *   npx tsx scripts/mailchimp/recent-openers.ts --export 2026-08-27-api \
 *     --subscribed-export 2026-08-17 --since 2026-02-27 \
 *     [--min-opens 1] [--out tmp/mailchimp/recent-openers.json]
 *
 * Flags:
 *   --export             Export id of the API pull holding `activity/`, written
 *                        by `scripts/mailchimp/fetch-api.ts --include activity`.
 *   --subscribed-export  Export id of the CSV vault holding
 *                        `subscribed_email_audience_export_*.csv` — the
 *                        consented spine every opener must also appear in.
 *   --since              ISO date (YYYY-MM-DD). Opens before it are ignored.
 *   --min-opens          Minimum opens inside the window (default 1).
 *   --out                Output path (default tmp/mailchimp/recent-openers.json).
 *                        `tmp/` is gitignored; keep it that way.
 *
 * Output JSON:
 *   { generatedBy, generatedAt, exportId, subscribedExportId, since, minOpens,
 *     campaignsScanned, openers, droppedNotSubscribed, hashes }
 *
 * `openers` is a COUNT and `hashes` are digests — there is no address field, by
 * design. `droppedNotSubscribed` is the number of recent openers the
 * intersection refused: people who read our mail but are not on the consented
 * list. That number is the compliance-relevant one, and it is reported precisely
 * so nobody is tempted to go looking for who they were.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import { parse } from "csv-parse/sync";

import { DEFAULT_VAULT_ROOT, REPO_ROOT, argValue } from "./vault";
import { hashEmail } from "../../lib/email/hash";

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

/**
 * The subset of one campaign's email-activity file this reads.
 *
 * Both spellings of the address key are accepted, and that is not laziness.
 * `fetch-api.ts` currently writes what `getEmailActivity()` returns — a bare
 * array of camelCased `{ emailId, emailAddress, activity }` — while the
 * underlying `GET /reports/{id}/email-activity` response is snake_cased under
 * an `emails` key. Reading only one of the two would make this script silently
 * produce an empty cohort the day the vault format is normalised in either
 * direction, and an empty cohort looks exactly like a correct one.
 *
 * Declared locally rather than imported from `lib/mailchimp/client.ts`: every
 * field is optional here because the file on disk is whatever was written, and
 * a narrow local type keeps the failure mode "this campaign contributed
 * nothing" instead of a cast that pretends a missing key is present.
 */
interface ActivityEvent {
  action?: string;
  timestamp?: string;
  type?: string;
  url?: string;
}

interface ActivityRecord {
  email_id?: string;
  emailId?: string;
  email_address?: string;
  emailAddress?: string;
  activity?: ActivityEvent[];
}

interface ActivityResponse {
  emails?: ActivityRecord[];
}

interface Output {
  generatedBy: string;
  generatedAt: string;
  exportId: string;
  subscribedExportId: string;
  since: string;
  minOpens: number;
  campaignsScanned: number;
  openers: number;
  droppedNotSubscribed: number;
  hashes: string[];
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
 * Resolves the vault directory for one export id.
 *
 * `MAILCHIMP_VAULT_DIR` names exactly ONE export's directory, and this script
 * reads two — the API pull and the CSV spine. Honouring the override blindly
 * would point both at the same folder and quietly intersect a set with itself,
 * which is the one failure that would look like success. So the override is
 * honoured only when it actually names the export being asked for.
 *
 * @param exportId Export id as given on the command line.
 * @returns Absolute directory path; existence is the caller's problem, because
 *   each caller has a better error message than a generic one.
 */
function exportDir(exportId: string): string {
  const override = process.env.MAILCHIMP_VAULT_DIR?.trim();
  if (override && basename(resolve(override)) === exportId) return resolve(override);
  return join(DEFAULT_VAULT_ROOT, exportId);
}

/** Normalizes an address the same way `hashEmail()` does, so the two agree. */
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Pulls the per-recipient records out of one activity file.
 *
 * Accepts the verbatim response (`{ emails: [...] }`), a bare array of records
 * (what `fetch-api.ts` writes today), or an array of pages of either — a
 * paginated fetch may reasonably write any of them, and guessing wrong here
 * would silently produce an empty cohort rather than an error.
 */
function recordsIn(parsed: unknown): ActivityRecord[] {
  if (Array.isArray(parsed)) return parsed.flatMap((page) => recordsIn(page));
  if (typeof parsed !== "object" || parsed === null) return [];

  const emails = (parsed as ActivityResponse).emails;
  if (Array.isArray(emails)) return emails;

  const record = parsed as ActivityRecord;
  if (typeof record.email_address === "string" || typeof record.emailAddress === "string") {
    return [record];
  }
  return [];
}

// ---------------------------------------------------------------------------
// The two inputs
// ---------------------------------------------------------------------------

/**
 * Counts qualifying opens per address across every campaign in the vault.
 *
 * @param activityDir Directory of `<campaignId>.json` files.
 * @param sinceMs Epoch ms; opens strictly before it do not count.
 * @returns Open counts keyed by normalized address, and how many files were read.
 */
function countOpens(
  activityDir: string,
  sinceMs: number
): { opens: Map<string, number>; campaignsScanned: number } {
  const files = readdirSync(activityDir)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, "en"));

  if (files.length === 0) {
    fail(
      `no campaign activity files in ${activityDir}`,
      "",
      "Expected one <campaignId>.json per campaign, written by:",
      "  npx tsx scripts/mailchimp/fetch-api.ts --export <id> --include activity"
    );
  }

  const opens = new Map<string, number>();

  for (const file of files) {
    const path = join(activityDir, file);
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      // Loud, not skipped: a truncated download would otherwise shrink the
      // cohort, and a smaller ramp list looks exactly like a correct one.
      fail(`${path} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

    for (const record of recordsIn(parsed)) {
      const email = normalizeEmail(record.email_address ?? record.emailAddress ?? "");
      if (email.length === 0 || !Array.isArray(record.activity)) continue;

      let hits = 0;
      for (const event of record.activity) {
        if ((event.action ?? "").trim().toLowerCase() !== "open") continue;
        const at = Date.parse(event.timestamp ?? "");
        if (Number.isNaN(at) || at < sinceMs) continue;
        hits += 1;
      }
      if (hits > 0) opens.set(email, (opens.get(email) ?? 0) + hits);
    }
  }

  return { opens, campaignsScanned: files.length };
}

/**
 * Loads the consented spine: every address in the `subscribed` export CSV.
 *
 * This is the set membership test that makes the output safe. It is read from
 * the CSV rather than from `lib/data/json/mailchimp/` because the committed
 * archive holds aggregates only — it has counts, never addresses, which is the
 * whole point of it.
 *
 * @param exportId Export id of the CSV vault.
 * @returns Normalized addresses of every subscribed contact.
 */
function loadSubscribedSpine(exportId: string): Set<string> {
  const dir = exportDir(exportId);
  if (!existsSync(dir)) {
    fail(
      `subscribed-export vault not found at ${dir}`,
      "",
      "The raw CSVs are never committed. Restore them from the private",
      "`she-sharp-slack-archive` repo (mailchimp/<export-id>/), or point",
      "MAILCHIMP_VAULT_DIR at that directory — see docs/development/MAILCHIMP_ARCHIVE.md."
    );
  }

  const file = readdirSync(dir).find((name) =>
    /^subscribed_email_audience_export_.*\.csv$/i.test(name)
  );
  if (!file) {
    fail(
      `no subscribed_email_audience_export_*.csv in ${dir}`,
      "",
      "Without the consented spine there is nothing to intersect against, and an",
      "un-intersected openers set is not safe to write — so this stops here."
    );
  }

  const rows = parse(readFileSync(join(dir, file), "utf8"), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
    trim: false,
  }) as Record<string, string>[];

  const spine = new Set<string>();
  for (const row of rows) {
    // Mailchimp's header is "Email Address"; matched loosely so a re-export
    // that changes the casing does not silently produce an empty spine.
    const key = Object.keys(row).find(
      (name) => name.trim().toLowerCase().replace(/[^a-z]/g, "") === "emailaddress"
    );
    const email = normalizeEmail(key ? row[key] ?? "" : "");
    if (email.length > 0) spine.add(email);
  }

  if (spine.size === 0) {
    fail(
      `${join(dir, file)} yielded no addresses — it has no "Email Address" column.`,
      "An empty spine would intersect to an empty cohort, which reads as success."
    );
  }
  return spine;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main(): void {
  const argv = process.argv.slice(2);

  const exportId = argValue(argv, "--export");
  const subscribedExportId = argValue(argv, "--subscribed-export");
  const since = argValue(argv, "--since");
  if (!exportId || !subscribedExportId || !since) {
    fail(
      "--export, --subscribed-export and --since are all required.",
      "",
      "Usage:",
      "  npx tsx scripts/mailchimp/recent-openers.ts --export <api-export-id> \\",
      "    --subscribed-export <csv-export-id> --since YYYY-MM-DD \\",
      "    [--min-opens 1] [--out tmp/mailchimp/recent-openers.json]"
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    fail(`--since must be YYYY-MM-DD (got "${since}").`);
  }

  // Read as UTC midnight. Mailchimp stamps activity with an offset, so a NZ
  // reader is up to 13 hours out at the window edge — which does not matter:
  // "did this person read something in the last six months" is not a question
  // whose answer turns on one evening.
  const sinceMs = Date.parse(`${since}T00:00:00Z`);
  if (Number.isNaN(sinceMs)) fail(`--since "${since}" is not a real date.`);

  const minOpensRaw = argValue(argv, "--min-opens");
  const minOpens = minOpensRaw === undefined ? 1 : Number(minOpensRaw);
  if (!Number.isInteger(minOpens) || minOpens < 1) {
    fail(`--min-opens must be a whole number of 1 or more (got "${minOpensRaw}").`);
  }

  const outPath = resolve(
    argValue(argv, "--out") ?? join(REPO_ROOT, "tmp", "mailchimp", "recent-openers.json")
  );

  const activityDir = join(exportDir(exportId), "activity");
  if (!existsSync(activityDir)) {
    fail(
      `no email-activity vault at ${activityDir}`,
      "",
      "That directory holds one <campaignId>.json per campaign and is written by:",
      "  npx tsx scripts/mailchimp/fetch-api.ts --export " + exportId + " --include activity",
      "which needs MAILCHIMP_API_KEY. Nothing can be computed without it."
    );
  }

  const { opens, campaignsScanned } = countOpens(activityDir, sinceMs);

  // THE INTERSECTION. Everything above this line is engagement data, which
  // grants nothing. Everything below is a subset of the consented list.
  const spine = loadSubscribedSpine(subscribedExportId);

  const hashes: string[] = [];
  let droppedNotSubscribed = 0;
  for (const [email, count] of opens) {
    if (count < minOpens) continue;
    if (!spine.has(email)) {
      droppedNotSubscribed += 1;
      continue;
    }
    hashes.push(hashEmail(email));
  }
  // Sorted so the file is byte-stable across runs and its order carries no
  // trace of who opened first.
  hashes.sort();

  const result: Output = {
    generatedBy: "scripts/mailchimp/recent-openers.ts",
    generatedAt: new Date().toISOString(),
    exportId,
    subscribedExportId,
    since,
    minOpens,
    campaignsScanned,
    openers: hashes.length,
    droppedNotSubscribed,
    hashes,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  console.log(`Wrote ${outPath}`);
  console.log("");
  // 25 clears the longest label, `Opened since YYYY-MM-DD`, with a gap.
  const row = (label: string, value: string): string => `  ${label.padEnd(25)}${value}`;
  console.log(row("Campaigns scanned", String(campaignsScanned)));
  console.log(row(`Opened since ${since}`, String(opens.size)));
  console.log(row("Subscribed spine", String(spine.size)));
  console.log(row("Recent openers", `${hashes.length}  (>= ${minOpens} open(s), hashed)`));
  console.log(row("Dropped, not on spine", String(droppedNotSubscribed)));
  console.log("");
  if (hashes.length === 0) {
    // Not an error here — an empty cohort is a real answer, and the downstream
    // flag refuses an empty filter rather than silently sending to nobody.
    console.log("No openers survived the intersection. Widen --since, lower --min-opens, or");
    console.log("check that --subscribed-export names the right vault. Do NOT pass this file");
    console.log("to --restrict-to-hashes; it will (correctly) be rejected as empty.");
    console.log("");
  }
  console.log("This is a send-order filter over an already-consented list, not a consent");
  console.log("source. It may narrow an import; it may never widen one.");
  console.log("");
  console.log("Next:");
  console.log("  npx tsx scripts/email/normalize-recipients.ts <subscribed.local.csv> \\");
  console.log(`    --key <k> --map "email=Email Address" --restrict-to-hashes "${outPath}"`);
}

main();
