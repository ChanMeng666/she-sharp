/**
 * Imports the people who ticked a marketing opt-in on a registration form into
 * `newsletter_subscribers` — route 2 of `consent-rules.md`.
 *
 * **The gap this closes, and why it was left open on purpose.** Until now only
 * two paths could write into the consent record: the website's own double
 * opt-in form, and `import-mailchimp-subscribers.ts`, which is shaped to one
 * frozen Mailchimp export and refuses anything else. Routes 2, 3 and 4 of
 * `consent-rules.md` had none, and `update-mailing-list`'s Step 6 said so in
 * capitals rather than letting anyone improvise an `INSERT`. Improvising was
 * the thing to prevent: the table is the organisation's marketing-consent
 * record, and a row written by a terminal one-liner is a row nobody can defend.
 * So the gap stayed open until a route could be closed deliberately. This is
 * that route, and only that route — **routes 3 (a paper sign-in sheet) and 4
 * (someone asked in writing) still have no tool, and are still one person at a
 * time.**
 *
 * **The immediate case is Humanitix.** Its checkout carries a built-in,
 * uneditable opt-in — `organiserMailListOptIn`, a boolean on the `Order`
 * schema — whose wording is fixed: *"Keep me updated on the latest news,
 * events, and exclusive offers from the event host"*. The answer is recorded
 * per order and reaches us as a "marketing opt-in" column in the console's
 * **reports → orders → Export CSV**. Nothing here is Humanitix-specific
 * beyond that default wording, which `--question` replaces.
 *
 * **It reads a recipients file, not a CSV.** `normalize-recipients.ts` already
 * detects the opt-in column by meaning, drops refunded orders, duplicates and
 * malformed addresses, applies the committed suppression register, and — under
 * `--for-import` — refuses to run without a recorded consent source and date,
 * and without an opt-in column at all. Re-implementing any of that here would
 * give the repo two answers to "which rows may be imported", and the two would
 * drift. So the flow is:
 *
 *   export CSV → normalize-recipients.ts (detect) → normalize-recipients.ts
 *   --map --for-import → tmp/emails/recipients-<key>.json → this script
 *
 * What this script does NOT inherit from that file is the consent sentence. A
 * free-text `--consent-source` can be typed as "Humanitix opt-in" and satisfy
 * every check in the system; route 2 requires the question, the event and the
 * date, so those are flags here and the sentence is composed from them.
 *
 * Safety, matching `import-mailchimp-subscribers.ts` shape for shape:
 *
 * - **Dry run is the default.** Writing requires `--apply`, spelled out.
 * - **No opt-in column is an outright refusal**, quoting the rule — the second
 *   of two gates. `--for-import` refuses such a file as well (since
 *   2026-08-30; before that its row filter only fired when an opt-in column had
 *   been mapped, so a file with none passed through whole, reporting
 *   `Excluded 0`). That gate is not enough on its own: a recipients file can
 *   reach here without having been through `--for-import`, so this script
 *   re-checks the column and every row's cell for itself.
 * - **Both do-not-contact registers are consulted**: the committed hash file
 *   and the runtime `email_optouts` table. An import can never resurrect
 *   somebody who left.
 * - **`confirmedAt` is null on every row.** These people ticked a box on
 *   somebody else's checkout; they never clicked a confirmation link of ours.
 * - **`consentDate` is the order's own completion date**, per row, read from
 *   the export. Never the import date.
 * - **No address is ever printed.** Counts and truncated hashes only, so the
 *   output is safe in a plan block, a PR or Slack.
 * - **It sends no email and calls no API.** Its only input is a file a human
 *   exported.
 *
 * Usage:
 *   npx tsx scripts/email/import-optin-subscribers.ts tmp/emails/recipients-<key>.json \
 *     --event-name "…" --event-date YYYY-MM-DD \
 *     [--question "…"] [--form "…"] [--date-column "…"] [--limit <n>] [--apply]
 */

import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

import {
  asRecipientsFile,
  composeConsentSource,
  countReasons,
  DEFAULT_FORM_NAME,
  HUMANITIX_OPTIN_QUESTION,
  OptinImportError,
  planOptinImport,
  resolveColumns,
  type PlannedRow,
} from "./optin-rows";
import { hashEmail, loadSuppressionHashes } from "./suppression";

/** How many hashes to show in the preview. */
const PREVIEW = 10;

/** Rows per insert. Neon throttles bursts, so writes are chunked and serial. */
const CHUNK = 200;

/** Flags that consume the next argv entry — everything else is positional. */
const VALUE_FLAGS = new Set([
  "--event-name",
  "--event-date",
  "--question",
  "--form",
  "--date-column",
  "--limit",
]);

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
  return value !== undefined && !value.startsWith("--") ? value : null;
}

/** The first argument that is neither a flag nor a flag's value. */
function readPositional(argv: string[]): string | null {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (VALUE_FLAGS.has(arg)) {
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) continue;
    return arg;
  }
  return null;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  const inputPath = readPositional(argv);
  if (!inputPath) {
    fail(
      "no recipients file given.",
      "Usage: npx tsx scripts/email/import-optin-subscribers.ts <recipients-*.json> \\",
      '  --event-name "…" --event-date YYYY-MM-DD [--apply]'
    );
  }

  const eventName = readOption(argv, "--event-name");
  const eventDate = readOption(argv, "--event-date");
  if (!eventName || !eventDate) {
    fail(
      "--event-name and --event-date are both required.",
      "Route 2 consent is recorded as the exact question text, the event name and",
      "the event date. A row that cannot name the event it came from cannot answer",
      '"why is this person on our list?" — see consent-rules.md.',
      "",
      'Example: --event-name "Les Mills: Tech in Fitness" --event-date 2026-09-03'
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    fail(`--event-date must be YYYY-MM-DD (got "${eventDate}").`);
  }

  const question = readOption(argv, "--question") ?? HUMANITIX_OPTIN_QUESTION;
  const form = readOption(argv, "--form") ?? DEFAULT_FORM_NAME;
  const dateColumn = readOption(argv, "--date-column");
  const apply = argv.includes("--apply");

  const limitRaw = readOption(argv, "--limit");
  const limit = limitRaw === null ? null : Number(limitRaw);
  if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
    fail(`--limit must be a positive integer (got "${limitRaw}").`);
  }

  // ---- read -------------------------------------------------------------
  const resolved = resolve(inputPath);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(resolved, "utf8"));
  } catch (error) {
    fail(
      `could not read ${resolved} as JSON.`,
      error instanceof Error ? error.message : String(error)
    );
  }

  // Every refusal happens here, before a database module is even loaded.
  let file, consentSource, columns;
  try {
    file = asRecipientsFile(parsed);
    consentSource = composeConsentSource({ form, question, eventName, eventDate });
    columns = resolveColumns(file, dateColumn);
  } catch (error) {
    if (error instanceof OptinImportError) fail(...error.lines);
    throw error;
  }

  // ---- registers --------------------------------------------------------
  //
  // The database modules are imported here rather than at the top of the file
  // on purpose. `lib/db/drizzle.ts` throws at import time when POSTGRES_URL is
  // unset, and on a machine that has run `vercel env pull` it points at
  // production. Every refusal above therefore runs — and can be demonstrated,
  // and tested — without a database being reachable, let alone touched.
  const { client, db } = await import("../../lib/db/drizzle");
  const { newsletterSubscribers } = await import("../../lib/db/schema");
  const { listOptouts } = await import("../../lib/email/optouts");

  const suppressed = loadSuppressionHashes();
  const committedCount = suppressed.size;
  // The runtime table catches anyone who unsubscribed, bounced or complained
  // since the committed register was last synced — which is exactly the person
  // a freshly-exported attendee list is most likely to contain.
  const optouts = await listOptouts();
  for (const row of optouts) suppressed.add(row.emailHash.toLowerCase());

  const existing = new Set(
    (await db.select({ emailHash: newsletterSubscribers.emailHash }).from(newsletterSubscribers))
      .map((row) => row.emailHash.toLowerCase())
  );

  // ---- plan -------------------------------------------------------------
  // `resolveColumns()` already ran above, so this cannot throw for want of a
  // column; it re-resolves them internally and re-checks the opt-in cell on
  // every row.
  const plan = planOptinImport({
    file,
    consentSource,
    dateColumn,
    suppressed,
    existing,
    hashEmail,
  });

  const selected = limit === null ? plan.rows : plan.rows.slice(0, limit);

  // ---- report -----------------------------------------------------------
  console.log("");
  console.log("  Registration opt-in import (consent-rules.md route 2)");
  console.log("  -----------------------------------------------------");
  console.log(`  File                  ${basename(resolved)}`);
  console.log(`  Opt-in column         "${columns.optInColumn}"`);
  console.log(`  Consent date from     "${columns.dateColumn}" (each order's own date)`);
  console.log(`  Consent source        ${plan.consentSource}`);
  console.log(`  confirmedAt           null on every row — nobody clicked our link`);
  console.log(`  Rows in file          ${file.recipients.length}`);
  for (const entry of countReasons(plan.dropped)) {
    console.log(`  Held back             ${entry.count} × ${entry.reason}`);
  }
  console.log(`  Suppression register  ${committedCount} committed + ${optouts.length} runtime opt-out(s)`);
  console.log(`  Already in the table  ${existing.size}`);
  console.log(`  WOULD IMPORT          ${selected.length}`);
  if (limit !== null && plan.rows.length > selected.length) {
    console.log(`                        (--limit ${limit}; ${plan.rows.length - selected.length} left for a later run)`);
  }

  if (plan.dropped.length > 0) {
    console.log("");
    console.log("  A sample of what was held back (hashes only):");
    for (const row of plan.dropped.slice(0, PREVIEW)) {
      console.log(`    ${row.emailHash.slice(0, 12)}…  ${row.reason}`);
    }
  }
  console.log("");

  if (!apply) {
    console.log("  DRY RUN — nothing was written.");
    console.log("  Re-run with --apply to write these rows.");
    console.log("");
    await client.end();
    return;
  }

  if (selected.length === 0) {
    console.log("  Nothing to write.");
    console.log("");
    await client.end();
    return;
  }

  // ---- write ------------------------------------------------------------
  const now = new Date();
  let written = 0;
  for (let start = 0; start < selected.length; start += CHUNK) {
    const chunk = selected.slice(start, start + CHUNK).map((row: PlannedRow) => ({
      ...row,
      confirmToken: null,
      confirmSentAt: null,
      confirmExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    }));

    await db
      .insert(newsletterSubscribers)
      .values(chunk)
      .onConflictDoNothing({ target: newsletterSubscribers.emailHash });
    written += chunk.length;
    console.log(`  written ${written}/${selected.length}`);
  }

  const total = await db
    .select({ emailHash: newsletterSubscribers.emailHash })
    .from(newsletterSubscribers);
  console.log("");
  console.log(`  Import complete. newsletter_subscribers now holds ${total.length} row(s).`);
  console.log("  Next: npx tsx scripts/email/suppression.ts reconcile");
  console.log("");
  await client.end();
}

main().catch((error) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
