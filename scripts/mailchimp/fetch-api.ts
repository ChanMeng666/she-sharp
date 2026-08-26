/**
 * Pulls the Mailchimp account's campaign, report and growth data into the vault.
 *
 * This is the substitute for the account-level export ZIP that was triggered on
 * 2026-08-17 and never arrived (`knownGaps[].report = "account-export-zip"`).
 * Everything it fetches is something the status-partitioned CSV export cannot
 * contain: a CSV export is a snapshot of *who is on the list*, and these are
 * the endpoints that say *how the list behaved* — the month-by-month audience
 * size, the campaigns that went out, and what each one achieved.
 *
 * The files land in the gitignored vault, never in `lib/data/json/mailchimp/`.
 * The one thing this script writes into the repository is a new append-only
 * `exports[]` entry in `manifest.json`, which records each file's sha256, the
 * endpoint it is the response to, and how much of a person it exposes — so the
 * pull stays auditable on CI, where the data itself can never be.
 *
 * Usage:
 *   npx tsx scripts/mailchimp/fetch-api.ts --export 2026-08-27-api
 *   npx tsx scripts/mailchimp/fetch-api.ts --export 2026-08-27-api --dry-run
 *   npx tsx scripts/mailchimp/fetch-api.ts --export 2026-08-27-api --include activity
 *
 * Environment: `MAILCHIMP_API_KEY` (required), `MAILCHIMP_LIST_ID` (or
 * `--list-id`), `MAILCHIMP_SERVER_PREFIX` (only for a key with no `-dc`
 * suffix), `MAILCHIMP_VAULT_DIR` (only to point at the private archive repo).
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  getEmailActivity,
  fetchRawForArchive,
  getLists,
  listCampaigns,
} from "../../lib/mailchimp/client";
import { appendExportEntry, buildApiExportEntry } from "./manifest";
import { argValue, ensureVaultDir } from "./vault";

/**
 * The export id, and why it is not the CSV export's id.
 *
 * `<YYYY-MM-DD>-api`, with the vault flat at `private/mailchimp/<exportId>/`
 * and **no `api/` folder nested inside a CSV export's directory**. Three
 * reasons, all of which bite silently:
 *
 * 1. `resolveVaultDir()` maps one exportId to one directory, and
 *    `MAILCHIMP_VAULT_DIR` overrides that whole directory. Nesting would make
 *    the override able to point at the CSVs or at the JSON, never both — so
 *    running against the private archive repo would half-work.
 * 2. `manifest.ts --append` dedupes on `exportId`. Sharing an id with the CSV
 *    export would not merge the two, it would clobber the CSV entry, and with
 *    it the only record of five files nobody can re-download.
 * 3. It is what "a Mailchimp export is a SNAPSHOT" already means everywhere
 *    else in this archive: two independent readings, taken at different
 *    moments, each independently hashable. A pull is not an addendum to the
 *    August download; it is its own snapshot of a different question.
 */
const EXPORT_ID_PATTERN = /^\d{4}-\d{2}-\d{2}-api$/;

/** What the pull fetches, in the order it fetches it. */
interface PlannedFile {
  /** Path relative to the export directory, forward slashes. */
  file: string;
  /** Endpoint template, for the plan and for `api.endpoints`. */
  endpoint: string;
  /** Minimum requests this costs. Paged endpoints may cost more. */
  requests: number;
  fetch: () => Promise<unknown>;
}

/**
 * Serialises one response into the vault.
 *
 * **LF, not CRLF.** `manifest.ts` renders CRLF because its output is committed
 * and this repository is worked on with `core.autocrlf=true`, so LF there would
 * make every rebuild look like a whole-file rewrite. Vault files are gitignored
 * and git never touches them, so none of that applies — and LF keeps the sha256
 * identical whichever machine ran the pull, which is the whole point of putting
 * a hash in the manifest.
 *
 * @param dir - The export directory.
 * @param relativePath - Path within it, forward slashes.
 * @param value - The response to write.
 * @returns Bytes written.
 */
function writeJson(dir: string, relativePath: string, value: unknown): number {
  const path = join(dir, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  const body = JSON.stringify(value, null, 2) + "\n";
  writeFileSync(path, body, "utf8");
  return Buffer.byteLength(body, "utf8");
}

/**
 * Builds the fixed part of the plan.
 *
 * `lists.json` is fetched even though only one audience matters. It is the
 * evidence for *why* that list id was the audience — the question a reader asks
 * a year later when a number does not match the dashboard — and it is one
 * request.
 *
 * The campaigns file is `sent-campaigns.json` and NOT `campaigns.json`:
 * `lib/data/json/README.md` records that `humanitix/` and `mailchimp/` already
 * carry same-named files, so a bare-filename grep returns two unrelated
 * subsystems. A committed `mailchimp/campaigns.json` is coming; this is not it,
 * and it should not be mistaken for it.
 *
 * @param listId - The verified audience id.
 * @returns The files to fetch and write, in order.
 */
function planFixedFiles(listId: string): PlannedFile[] {
  return [
    {
      file: "lists.json",
      endpoint: "/lists",
      requests: 1,
      fetch: () => fetchRawForArchive("/lists", "lists"),
    },
    {
      file: "list.json",
      endpoint: "/lists/{listId}",
      requests: 1,
      fetch: () => fetchRawForArchive(`/lists/${listId}`, undefined),
    },
    {
      file: "growth-history.json",
      endpoint: "/lists/{listId}/growth-history",
      requests: 1,
      // Ascending, so the file reads as a series rather than needing a sort
      // before anybody can look at it.
      fetch: () =>
        fetchRawForArchive(`/lists/${listId}/growth-history`, "history", {
          sort_field: "month",
          sort_dir: "ASC",
        }),
    },
    {
      file: "sent-campaigns.json",
      endpoint: "/campaigns?status=sent",
      requests: 1,
      fetch: () =>
        fetchRawForArchive("/campaigns", "campaigns", {
          status: "sent",
          sort_field: "send_time",
          sort_dir: "ASC",
        }),
    },
    {
      file: "reports.json",
      endpoint: "/reports",
      requests: 1,
      fetch: () => fetchRawForArchive("/reports", "reports"),
    },
  ];
}

/**
 * The API host the key's own data-centre suffix resolves to.
 *
 * Mirrors `resolveServerPrefix()` inside `lib/mailchimp/client.ts`, which is
 * private to that module. Duplicated deliberately and kept to two lines: this
 * one only has to RECORD which shard was talked to, and importing a resolver
 * would mean exporting configuration plumbing from a client whose whole job is
 * to keep it inside.
 *
 * @param apiKey - The raw key, `<32 hex>-<dc>`.
 * @returns The base URL, with no credential in it.
 */
function resolveBaseUrl(apiKey: string): string {
  const explicit = process.env.MAILCHIMP_SERVER_PREFIX?.trim();
  const suffix = explicit || apiKey.slice(apiKey.lastIndexOf("-") + 1);
  return `https://${suffix.toLowerCase()}.api.mailchimp.com/3.0`;
}

/**
 * Prints the plan and what it would cost, then writes nothing.
 *
 * The request count is a floor: `paginate()` in the client asks for 1000 rows a
 * page, so every collection here is one request unless the account has grown
 * past that, and `--include activity` costs at least one request per sent
 * campaign — which is not knowable without first fetching the campaigns.
 *
 * @param exportId - The export id.
 * @param dir - Where the files would go.
 * @param listId - The audience id that would be verified and pulled.
 * @param plan - The fixed files.
 * @param includeActivity - Whether per-recipient activity was asked for.
 */
function printPlan(
  exportId: string,
  dir: string,
  listId: string,
  plan: PlannedFile[],
  includeActivity: boolean
): void {
  console.log(`Dry run — export ${exportId}`);
  console.log(`  vault      ${dir}`);
  console.log(`  audience   ${listId} (to be verified against GET /lists)`);
  console.log("");
  for (const item of plan) {
    console.log(`  ${item.file.padEnd(22)} ${item.endpoint}`);
  }
  if (includeActivity) {
    console.log(`  ${"activity/<id>.json".padEnd(22)} /reports/{campaignId}/email-activity`);
  }

  const fixed = plan.reduce((total, item) => total + item.requests, 0);
  console.log("");
  console.log(`  requests   ${fixed} minimum for the files above`);
  if (includeActivity) {
    console.log(
      "             plus at least one per sent campaign — 209 campaigns at the\n" +
        "             2026-08-17 reading, so roughly 214 requests in total."
    );
  }
  console.log("");
  console.log("Nothing was written. Drop --dry-run to run it.");
}

/**
 * Confirms the audience exists on this account before anything is written.
 *
 * A wrong list id does not fail — Mailchimp answers with another audience's
 * numbers, or a 404 that reads like a permissions problem. The check is against
 * `GET /lists` rather than `GET /lists/{id}` so that the refusal can name what
 * the account actually holds, which is the only message that shortens the
 * debugging.
 *
 * @param listId - The id to verify.
 * @param lists - Every audience on the account.
 * @throws When the id is not one of them.
 */
function verifyAudience(
  listId: string,
  lists: { id: string; name: string; memberCount: number }[]
): void {
  if (lists.some((list) => list.id === listId)) return;

  const found = lists.length
    ? lists.map((list) => `    ${list.id}  ${list.name} (${list.memberCount} members)`).join("\n")
    : "    (the account has no audiences at all)";

  throw new Error(
    `The account does not hold an audience with id ${listId}.\n` +
      `  GET /lists returned:\n${found}\n` +
      "  Fix MAILCHIMP_LIST_ID (or --list-id) rather than pulling another audience's numbers."
  );
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const dryRun = argv.includes("--dry-run");
  const includeActivity = argValue(argv, "--include") === "activity";

  if (!exportId || !EXPORT_ID_PATTERN.test(exportId)) {
    console.error(
      "Usage: npx tsx scripts/mailchimp/fetch-api.ts --export <YYYY-MM-DD>-api " +
        "[--list-id <id>] [--include activity] [--dry-run]\n" +
        "  The -api suffix is required: an API pull is its own snapshot and must not\n" +
        "  share an exportId with a CSV export, which --append would then clobber."
    );
    process.exit(1);
  }

  // Checked here rather than left to the client's own error, and checked even
  // on a dry run: the question a dry run answers is "would the real run work",
  // and a plan printed on a machine with no key answers it wrongly.
  const apiKey = process.env.MAILCHIMP_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "MAILCHIMP_API_KEY is not set. Add it to .env (Mailchimp → Account → Extras → API keys)."
    );
    process.exit(1);
    return;
  }

  const listId = argValue(argv, "--list-id") ?? process.env.MAILCHIMP_LIST_ID?.trim();
  if (!listId) {
    console.error(
      "No audience id. Set MAILCHIMP_LIST_ID in .env, or pass --list-id <id>."
    );
    process.exit(1);
  }

  const plan = planFixedFiles(listId);

  if (dryRun) {
    // Described rather than resolved: resolving would mean either creating the
    // directory or reimplementing `MAILCHIMP_VAULT_DIR`'s precedence a third
    // time, and a dry run writes nothing.
    printPlan(
      exportId,
      process.env.MAILCHIMP_VAULT_DIR?.trim() || `private/mailchimp/${exportId}/`,
      listId,
      plan,
      includeActivity
    );
    return;
  }

  const dir = ensureVaultDir(exportId);

  // The audience is verified first, and separately from the plan, so that a
  // wrong id costs one request and leaves no half-written vault directory.
  const lists = await getLists();
  verifyAudience(listId, lists);
  console.log(`ok - audience ${listId} verified against GET /lists (${lists.length} on the account)`);

  const endpoints: string[] = [];
  for (const item of plan) {
    const body = await item.fetch();
    const bytes = writeJson(dir, item.file, body);
    endpoints.push(item.endpoint);
    const count = Array.isArray(body) ? `${body.length} items` : "1 item";
    console.log(`  wrote ${item.file.padEnd(22)} ${count.padStart(11)}  ${bytes} bytes`);
  }

  if (includeActivity) {
    // Opt-in because it is ~209 requests against the heaviest endpoint in the
    // API, and because these are the only person-shaped files in the pull: one
    // row per recipient, keyed by their address. Serial rather than parallel —
    // the client's gate would queue them anyway, and holding 209 activity
    // responses in memory to write them at the end buys nothing.
    const campaigns = await listCampaigns({ status: "sent", fields: ["campaigns.id"] });
    console.log(`  activity for ${campaigns.length} sent campaigns…`);

    let done = 0;
    for (const campaign of campaigns) {
      const activity = await getEmailActivity(campaign.id);
      writeJson(dir, `activity/${campaign.id}.json`, activity);
      done += 1;
      if (done % 25 === 0 || done === campaigns.length) {
        console.log(`    ${done}/${campaigns.length}`);
      }
    }
    endpoints.push("/reports/{campaignId}/email-activity");
  }

  const entry = buildApiExportEntry(exportId, {
    // The shard the key's own suffix resolved to. No key, ever — see the
    // `api` field's doc comment in types/mailchimp.ts.
    baseUrl: resolveBaseUrl(apiKey),
    listId,
    endpoints,
  });
  appendExportEntry(entry);

  console.log("");
  console.log(`Recorded export ${exportId}: ${entry.fileCount} files in lib/data/json/mailchimp/manifest.json`);
  console.log("");
  console.log("Now close what this pull supplied, if anything:");
  console.log(
    `  npx tsx scripts/mailchimp/manifest.ts --close-gap account-export-zip --closed-by ${exportId}`
  );
  if (includeActivity) {
    console.log(
      `  npx tsx scripts/mailchimp/manifest.ts --close-gap per-campaign-recipient-activity --closed-by ${exportId}`
    );
  }
}

main().catch((error: unknown) => {
  // One line, no stack: every failure this script can hit is a configuration
  // or an account fact, and a stack trace buries the sentence that says which.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
