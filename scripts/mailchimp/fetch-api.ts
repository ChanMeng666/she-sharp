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
 *   npx tsx scripts/mailchimp/fetch-api.ts --export 2026-08-27-api --include content,engagement,assets
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

/**
 * The opt-in tiers, and why each one is opt-in rather than always pulled.
 *
 * Every tier here costs at least one request per sent campaign, so the cheapest
 * honest description of the default pull is "a dozen requests"; adding any of
 * these makes it hundreds. They are otherwise unrelated to each other — a run
 * may ask for any combination, comma-separated.
 *
 * - `activity`   per-recipient opens and clicks. The ONLY person-shaped tier.
 * - `content`    the newsletters themselves, as sent.
 * - `engagement` the five aggregate report breakdowns, per campaign.
 * - `assets`     the image library's metadata.
 */
const INCLUDE_TIERS = ["activity", "content", "engagement", "assets"] as const;

type IncludeTier = (typeof INCLUDE_TIERS)[number];

/**
 * Parses `--include a,b,c` into a set, refusing anything unrecognised.
 *
 * Refusing rather than ignoring is the point. The previous form of this flag
 * was `argValue(argv, "--include") === "activity"`, so `--include Activity` or
 * `--include activity,content` both read as false and the run went ahead
 * looking successful while fetching nothing extra — a silently smaller archive,
 * which is the failure this whole subsystem exists to prevent.
 *
 * @param raw - The flag's value, or undefined when it was not passed.
 * @returns The requested tiers.
 * @throws When a value is not one of {@link INCLUDE_TIERS}.
 */
function parseIncludes(raw: string | undefined): Set<IncludeTier> {
  const tiers = new Set<IncludeTier>();
  if (!raw) return tiers;

  for (const part of raw.split(",")) {
    const name = part.trim();
    if (!name) continue;
    if (!(INCLUDE_TIERS as readonly string[]).includes(name)) {
      throw new Error(
        `Unknown --include value: ${name}\n` +
          `  Valid tiers: ${INCLUDE_TIERS.join(", ")} (comma-separated, combinable).`
      );
    }
    tiers.add(name as IncludeTier);
  }
  return tiers;
}

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
 * The nine files after `reports.json` are here rather than behind a flag
 * because each is exactly one request, and four of them are expected to come
 * back EMPTY. An empty array is the deliverable in those four cases:
 * `manifest.json`'s `automations-forms-landing-pages` gap says automations,
 * forms and landing pages "can only be screenshotted", and until something
 * asks the account how many there are, "there are none" is a belief rather
 * than a finding. Writing the empty response settles it, and the sha256 makes
 * the settlement auditable a year later.
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
    {
      file: "segments.json",
      endpoint: "/lists/{listId}/segments",
      requests: 1,
      fetch: () => fetchRawForArchive(`/lists/${listId}/segments`, "segments"),
    },
    {
      file: "merge-fields.json",
      endpoint: "/lists/{listId}/merge-fields",
      requests: 1,
      fetch: () => fetchRawForArchive(`/lists/${listId}/merge-fields`, "merge_fields"),
    },
    {
      file: "signup-forms.json",
      endpoint: "/lists/{listId}/signup-forms",
      requests: 1,
      fetch: () => fetchRawForArchive(`/lists/${listId}/signup-forms`, "signup_forms"),
    },
    {
      file: "list-activity.json",
      endpoint: "/lists/{listId}/activity",
      // 2,054 days at the 2026-08-27 reading, so three pages of 1000 rather
      // than the one request the other entries cost. Verified live that the
      // endpoint honours `offset`: pages 0/1/2 returned 2,054 DISTINCT days,
      // 2026-08-26 back to 2019-07-15. Some Mailchimp collections ignore
      // `offset` and re-serve page one, which `paginate()` would turn into
      // duplicate rows and a plausible-looking file.
      requests: 3,
      fetch: () => fetchRawForArchive(`/lists/${listId}/activity`, "activity"),
    },
    {
      file: "clients.json",
      endpoint: "/lists/{listId}/clients",
      requests: 1,
      fetch: () => fetchRawForArchive(`/lists/${listId}/clients`, "clients"),
    },
    {
      file: "interest-categories.json",
      endpoint: "/lists/{listId}/interest-categories",
      requests: 1,
      fetch: () => fetchRawForArchive(`/lists/${listId}/interest-categories`, "categories"),
    },
    {
      file: "webhooks.json",
      endpoint: "/lists/{listId}/webhooks",
      requests: 1,
      fetch: () => fetchRawForArchive(`/lists/${listId}/webhooks`, "webhooks"),
    },
    {
      file: "automations.json",
      endpoint: "/automations",
      requests: 1,
      fetch: () => fetchRawForArchive("/automations", "automations"),
    },
    {
      file: "landing-pages.json",
      endpoint: "/landing-pages",
      requests: 1,
      fetch: () => fetchRawForArchive("/landing-pages", "landing_pages"),
    },
  ];
}

/**
 * The five aggregate breakdowns Mailchimp keeps for one sent campaign.
 *
 * One file per campaign rather than five, because they are five views of the
 * same send and a reader wants them together — and because 900 files in one
 * directory is a directory nobody opens.
 *
 * Each value is the **whole envelope**, not the rows inside it, which is the
 * one place this script departs from `planFixedFiles()`'s
 * array-of-verbatim-rows shape. Two of the envelopes carry a figure that has no
 * row to live on — `domain-performance.total_sent` is the denominator every
 * percentage in that file is computed against, and `eepurl.eepurl` is the
 * shortlink itself — and all five carry `total_items`, which is what lets
 * {@link warnIfTruncated} prove afterwards that nothing was cut off.
 *
 * `count: 1000` is Mailchimp's maximum. Its DEFAULT is 10, and that is the trap
 * this parameter exists for: the busiest campaign in the account has 50 clicked
 * URLs, so a defaulted request would have stored the top ten and a `total_items`
 * of 50 sitting beside them, looking complete to anything that did not compare
 * the two numbers.
 *
 * @param campaignId - The campaign id.
 * @returns The composite, ready to write.
 */
async function fetchEngagement(campaignId: string): Promise<Record<string, unknown>> {
  const whole = (path: string) => fetchRawForArchive(path, undefined, { count: 1000 });

  // Five requests at once, which the client's own gate (8 concurrent) admits
  // without queueing. Campaigns stay serial so responses are written as they
  // arrive rather than held in memory 180 at a time.
  const [clickDetails, domainPerformance, locations, eepurl, sendChecklist] = await Promise.all([
    whole(`/reports/${campaignId}/click-details`),
    whole(`/reports/${campaignId}/domain-performance`),
    whole(`/reports/${campaignId}/locations`),
    whole(`/reports/${campaignId}/eepurl`),
    whole(`/campaigns/${campaignId}/send-checklist`),
  ]);

  return { clickDetails, domainPerformance, locations, eepurl, sendChecklist };
}

/**
 * Reports a sub-response whose `total_items` exceeds the rows it came with.
 *
 * The archive's promise is that a stored file is the complete answer, and the
 * only way a `count`-capped endpoint breaks that promise is silently. Collected
 * and printed at the end rather than thrown: one truncated breakdown out of 900
 * should not discard the other 899, and the file on disk still carries the
 * `total_items` that proves what happened.
 *
 * @param label - What was fetched, for the message.
 * @param body - The envelope.
 * @param key - The envelope property holding the rows.
 * @param into - Accumulator for the warnings.
 */
function warnIfTruncated(
  label: string,
  body: unknown,
  key: string,
  into: string[]
): void {
  if (!body || typeof body !== "object") return;
  const envelope = body as Record<string, unknown>;
  const rows = envelope[key];
  const total = envelope.total_items;
  if (!Array.isArray(rows) || typeof total !== "number") return;
  if (rows.length < total) {
    into.push(`${label}: stored ${rows.length} of ${total} — the response was capped.`);
  }
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

/** Per-campaign cost and description of each opt-in tier, for the plan. */
const TIER_PLAN: Record<
  IncludeTier,
  { file: string; endpoint: string; requestsPerCampaign: number }
> = {
  activity: {
    file: "activity/<id>.json",
    endpoint: "/reports/{campaignId}/email-activity",
    requestsPerCampaign: 1,
  },
  content: {
    file: "content/<id>.json",
    endpoint: "/campaigns/{campaignId}/content",
    requestsPerCampaign: 1,
  },
  engagement: {
    file: "engagement/<id>.json",
    endpoint:
      "/reports/{campaignId}/{click-details,domain-performance,locations,eepurl} + /campaigns/{campaignId}/send-checklist",
    requestsPerCampaign: 5,
  },
  assets: {
    file: "file-manager-files.json",
    endpoint: "/file-manager/files",
    requestsPerCampaign: 0,
  },
};

/**
 * Prints the plan and what it would cost, then writes nothing.
 *
 * The per-campaign tiers are costed from a live count of sent campaigns rather
 * than from a number written into this file. The previous version said "209
 * campaigns at the 2026-08-17 reading, so roughly 214 requests"; the account
 * holds 180 sent campaigns, and the difference is the whole reason a dry run
 * exists — it is asked *how big is this*, and a stale answer to that is worse
 * than none. One projected request buys the real figure.
 *
 * The count is still a floor: `paginate()` asks for 1000 rows a page, so every
 * collection here is one request unless the account has grown past that.
 *
 * @param exportId - The export id.
 * @param dir - Where the files would go.
 * @param listId - The audience id that would be verified and pulled.
 * @param plan - The fixed files.
 * @param includes - The opt-in tiers requested.
 * @param sentCampaigns - How many sent campaigns the account holds, live.
 */
function printPlan(
  exportId: string,
  dir: string,
  listId: string,
  plan: PlannedFile[],
  includes: Set<IncludeTier>,
  sentCampaigns: number
): void {
  console.log(`Dry run — export ${exportId}`);
  console.log(`  vault      ${dir}`);
  console.log(`  audience   ${listId} (to be verified against GET /lists)`);
  console.log(`  campaigns  ${sentCampaigns} sent, counted live just now`);
  console.log("");
  for (const item of plan) {
    console.log(`  ${item.file.padEnd(26)} ${item.endpoint}`);
  }
  for (const tier of INCLUDE_TIERS) {
    if (includes.has(tier)) {
      console.log(`  ${TIER_PLAN[tier].file.padEnd(26)} ${TIER_PLAN[tier].endpoint}`);
    }
  }

  // +1 for the `GET /lists` the real run makes before writing anything. It is
  // counted here rather than left out because a plan that undercounts by one
  // is a plan somebody stops trusting to be exact.
  const fixed = plan.reduce((total, item) => total + item.requests, 0) + 1;
  console.log("");
  console.log(
    `  requests   always      ${String(fixed).padStart(4)}  (${plan.length} files in ${fixed - 1} requests, plus 1 to verify the audience)`
  );

  let total = fixed;
  for (const tier of INCLUDE_TIERS) {
    if (!includes.has(tier)) continue;
    const { requestsPerCampaign } = TIER_PLAN[tier];
    // `assets` is a single paginated collection, so it is costed as one page
    // rather than per campaign — 677 files at the 2026-08-27 reading, well
    // inside one page of 1000.
    const cost = requestsPerCampaign === 0 ? 1 : requestsPerCampaign * sentCampaigns;
    const per =
      requestsPerCampaign === 0
        ? "one paginated collection"
        : `${requestsPerCampaign} per campaign x ${sentCampaigns}`;
    console.log(`             ${tier.padEnd(13)} ${String(cost).padStart(4)}  (${per})`);
    total += cost;
  }
  // The per-campaign tiers all need the sent-campaign list, which the real run
  // fetches once and reuses across however many of them were asked for.
  if (includes.size > 0) {
    console.log(`             ${"campaign list".padEnd(13)} ${String(1).padStart(4)}  (fetched once, shared by the per-campaign tiers)`);
    total += 1;
  }
  console.log(`             ${"TOTAL".padEnd(13)} ${String(total).padStart(4)}`);
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
  const includes = parseIncludes(argValue(argv, "--include"));

  if (!exportId || !EXPORT_ID_PATTERN.test(exportId)) {
    console.error(
      "Usage: npx tsx scripts/mailchimp/fetch-api.ts --export <YYYY-MM-DD>-api " +
        `[--list-id <id>] [--include ${INCLUDE_TIERS.join("|")}] [--dry-run]\n` +
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

  // The id projection, used by the dry run to cost the per-campaign tiers and
  // by the real run to drive them. Named once so the two cannot drift into
  // costing one set of campaigns and fetching another.
  const sentCampaignIds = () =>
    listCampaigns({ status: "sent", fields: ["campaigns.id"] }).then((rows) =>
      rows.map((row) => row.id)
    );

  if (dryRun) {
    // Described rather than resolved: resolving would mean either creating the
    // directory or reimplementing `MAILCHIMP_VAULT_DIR`'s precedence a third
    // time, and a dry run writes nothing.
    printPlan(
      exportId,
      process.env.MAILCHIMP_VAULT_DIR?.trim() || `private/mailchimp/${exportId}/`,
      listId,
      plan,
      includes,
      (await sentCampaignIds()).length
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
  const truncated: string[] = [];

  for (const item of plan) {
    const body = await item.fetch();
    const bytes = writeJson(dir, item.file, body);
    endpoints.push(item.endpoint);
    const count = Array.isArray(body) ? `${body.length} items` : "1 item";
    console.log(`  wrote ${item.file.padEnd(26)} ${count.padStart(11)}  ${bytes} bytes`);
  }

  if (includes.has("assets")) {
    // The image library: 677 gallery entries at the 2026-08-27 reading, with
    // the public `full_size_url` of every image ever put in a Mailchimp
    // campaign. Metadata only — the images themselves are not downloaded, and
    // the URLs remain reachable only for as long as the account exists.
    const files = await fetchRawForArchive("/file-manager/files", "files");
    const bytes = writeJson(dir, "file-manager-files.json", files);
    endpoints.push("/file-manager/files");
    const count = Array.isArray(files) ? files.length : 1;
    console.log(`  wrote ${"file-manager-files.json".padEnd(26)} ${`${count} items`.padStart(11)}  ${bytes} bytes`);
  }

  // Fetched once and shared: three of the four tiers walk the same list, and
  // asking for it three times would be three chances for it to differ.
  const campaignIds =
    includes.has("activity") || includes.has("content") || includes.has("engagement")
      ? await sentCampaignIds()
      : [];

  /**
   * Walks the sent campaigns, writing one file each, with progress.
   *
   * Serial rather than parallel across campaigns — the client's gate would
   * queue them anyway, and holding 180 responses in memory to write them at
   * the end buys nothing. Shared by the three per-campaign tiers so their
   * progress output and their failure behaviour cannot diverge.
   */
  const perCampaign = async (
    label: string,
    subdir: string,
    fetchOne: (campaignId: string) => Promise<unknown>
  ): Promise<void> => {
    console.log(`  ${label} for ${campaignIds.length} sent campaigns…`);
    let done = 0;
    let bytes = 0;
    for (const campaignId of campaignIds) {
      bytes += writeJson(dir, `${subdir}/${campaignId}.json`, await fetchOne(campaignId));
      done += 1;
      if (done % 25 === 0 || done === campaignIds.length) {
        console.log(`    ${done}/${campaignIds.length}  ${bytes} bytes`);
      }
    }
  };

  if (includes.has("content")) {
    // The newsletters themselves, as sent: `plain_text`, `html` and
    // `archive_html`. This is the TEMPLATE, not a per-recipient render — the
    // recipient's name appears as the literal `*|FNAME|*` merge tag — which is
    // what makes twelve years of an organisation's own writing storable at all.
    await perCampaign("content", "content", (id) =>
      fetchRawForArchive(`/campaigns/${id}/content`, undefined)
    );
    endpoints.push("/campaigns/{campaignId}/content");
  }

  if (includes.has("engagement")) {
    await perCampaign("engagement", "engagement", async (id) => {
      const composite = await fetchEngagement(id);
      warnIfTruncated(`${id} click-details`, composite.clickDetails, "urls_clicked", truncated);
      warnIfTruncated(`${id} domain-performance`, composite.domainPerformance, "domains", truncated);
      warnIfTruncated(`${id} locations`, composite.locations, "locations", truncated);
      return composite;
    });
    endpoints.push(
      "/reports/{campaignId}/click-details",
      "/reports/{campaignId}/domain-performance",
      "/reports/{campaignId}/locations",
      "/reports/{campaignId}/eepurl",
      "/campaigns/{campaignId}/send-checklist"
    );
  }

  if (includes.has("activity")) {
    // The only person-shaped tier: one row per recipient, keyed by their
    // address. Pulled through the mapped accessor rather than
    // `fetchRawForArchive`, because that accessor's `ip` exclusion is the guard
    // keeping read-location records out of the vault — see the doc comment on
    // `fetchRawForArchive` for why going verbatim here would be wrong.
    await perCampaign("activity", "activity", (id) => getEmailActivity(id));
    endpoints.push("/reports/{campaignId}/email-activity");
  }

  if (truncated.length > 0) {
    console.log("");
    console.log(`  ${truncated.length} response(s) came back capped — the stored file is INCOMPLETE:`);
    for (const line of truncated) console.log(`    ${line}`);
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
  if (includes.has("activity")) {
    console.log(
      `  npx tsx scripts/mailchimp/manifest.ts --close-gap per-campaign-recipient-activity --closed-by ${exportId}`
    );
  }
  // `saved-segments` and `automations-forms-landing-pages` are settled by the
  // always-pulled files, not by a tier: `segments.json` is the account's own
  // answer about saved segments, and the three empty collections plus
  // `signup-forms.json` are the answer about automations, forms and landing
  // pages. Both gaps were reasoned about rather than asked; now they are asked.
  console.log(
    `  npx tsx scripts/mailchimp/manifest.ts --close-gap saved-segments --closed-by ${exportId}`
  );
  console.log(
    `  npx tsx scripts/mailchimp/manifest.ts --close-gap automations-forms-landing-pages --closed-by ${exportId}`
  );
}

main().catch((error: unknown) => {
  // One line, no stack: every failure this script can hit is a configuration
  // or an account fact, and a stack trace buries the sentence that says which.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
