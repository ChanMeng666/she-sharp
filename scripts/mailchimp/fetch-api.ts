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
 *   npx tsx scripts/mailchimp/fetch-api.ts --export 2026-08-28-api \
 *     --include content,engagement,assets,templates,members,recipients,activity
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
  fetchEnvelopeForArchive,
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
 * - `activity`   per-recipient opens and clicks, one file per campaign.
 * - `content`    the newsletters themselves, as sent.
 * - `engagement` the five aggregate report breakdowns, per campaign.
 * - `assets`     the image library's metadata.
 * - `templates`  the 125 saved templates, and their default content.
 * - `members`    the audience itself, one file per status, FULL member objects.
 * - `recipients` who each campaign went to, and what they did with it.
 *
 * Three of them — `activity`, `members`, `recipients` — describe people by name
 * and address. They are opt-in for the COST, not for the sensitivity: the vault
 * is the vault whichever tiers ran, and the manifest states per file what each
 * one exposes. Deciding by flag which PII reaches a gitignored directory would
 * be a guard that reads like one and protects nothing.
 */
const INCLUDE_TIERS = [
  "activity",
  "content",
  "engagement",
  "assets",
  "templates",
  "members",
  "recipients",
] as const;

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
    {
      file: "customer-journeys.json",
      endpoint: "/customer-journeys/journeys",
      requests: 1,
      // The one thing `automations.json` explicitly does NOT settle. Its
      // manifest note says Customer Journeys live behind a different endpoint
      // and that the pull does not touch them. This is that endpoint, and the
      // answer is zero — so no mail leaves this account on a trigger of any
      // kind, classic automation or Journey.
      fetch: () => fetchRawForArchive("/customer-journeys/journeys", "journeys"),
    },
    {
      file: "account.json",
      endpoint: "/",
      requests: 1,
      // The account itself: plan, timezone, member-since, total subscribers,
      // and a postal `contact` block that is a street address. Read its
      // manifest note before quoting anything out of this file.
      fetch: () => fetchRawForArchive("/", undefined),
    },
    {
      file: "campaigns-all.json",
      endpoint: "/campaigns",
      requests: 1,
      // EVERY status, not just `sent`. The 2026-08-27 pull took the 180 sent
      // campaigns and nothing else, which silently dropped 32 drafts and 1
      // scheduled send — and a draft is the only remaining trace of a campaign
      // somebody wrote and decided not to send. Ordered by create_time, so this
      // reads as a history of the writing; `sent-campaigns.json` stays the
      // send-time-ordered view of what actually went out.
      fetch: () =>
        fetchRawForArchive("/campaigns", "campaigns", {
          sort_field: "create_time",
          sort_dir: "ASC",
        }),
    },
    {
      file: "authorized-apps.json",
      endpoint: "/authorized-apps",
      requests: 1,
      // Which third parties hold access to this account. Nothing else in the
      // archive records it, and after cancellation there is no way to ask: this
      // is the list of integrations that were connected when it closed.
      fetch: () => fetchRawForArchive("/authorized-apps", "apps"),
    },
    {
      file: "verified-domains.json",
      endpoint: "/verified-domains",
      requests: 1,
      // What this account was allowed to send AS. The counterpart to the DNS
      // and DMARC records in docs/deployment/EMAIL_AUTHENTICATION.md, from
      // Mailchimp's side of the same arrangement.
      fetch: () => fetchRawForArchive("/verified-domains", "domains"),
    },
    {
      file: "ecommerce-stores.json",
      endpoint: "/ecommerce/stores",
      requests: 1,
      fetch: () => fetchRawForArchive("/ecommerce/stores", "stores"),
    },
    {
      file: "connected-sites.json",
      endpoint: "/connected-sites",
      requests: 1,
      fetch: () => fetchRawForArchive("/connected-sites", "sites"),
    },
    {
      file: "batches.json",
      endpoint: "/batches",
      requests: 1,
      // The account's batch-operation history: who wrote to this audience in
      // bulk, when, and how many operations succeeded. The only record of
      // automated WRITES anywhere in this archive, which is otherwise entirely
      // a record of reads.
      fetch: () => fetchRawForArchive("/batches", "batches"),
    },
    {
      file: "batch-webhooks.json",
      endpoint: "/batch-webhooks",
      requests: 1,
      fetch: () => fetchRawForArchive("/batch-webhooks", "webhooks"),
    },
    {
      file: "conversations.json",
      endpoint: "/conversations",
      requests: 1,
      fetch: () => fetchRawForArchive("/conversations", "conversations"),
    },
    {
      file: "template-folders.json",
      endpoint: "/template-folders",
      requests: 1,
      fetch: () => fetchRawForArchive("/template-folders", "folders"),
    },
    {
      file: "campaign-folders.json",
      endpoint: "/campaign-folders",
      requests: 1,
      fetch: () => fetchRawForArchive("/campaign-folders", "folders"),
    },
    {
      file: "file-manager-folders.json",
      endpoint: "/file-manager/folders",
      requests: 1,
      fetch: () => fetchRawForArchive("/file-manager/folders", "folders"),
    },
    {
      file: "facebook-ads.json",
      endpoint: "/facebook-ads",
      requests: 1,
      fetch: () => fetchRawForArchive("/facebook-ads", "facebook_ads"),
    },
    {
      file: "list-abuse-reports.json",
      endpoint: "/lists/{listId}/abuse-reports",
      requests: 1,
      fetch: () => fetchRawForArchive(`/lists/${listId}/abuse-reports`, "abuse_reports"),
    },
    {
      file: "list-locations.json",
      endpoint: "/lists/{listId}/locations",
      requests: 1,
      fetch: () => fetchRawForArchive(`/lists/${listId}/locations`, "locations"),
    },
    {
      file: "list-surveys.json",
      endpoint: "/lists/{listId}/surveys",
      requests: 1,
      fetch: () => fetchRawForArchive(`/lists/${listId}/surveys`, "surveys"),
    },
  ];
}

/**
 * Every status a member of this audience can hold.
 *
 * All six, including the two that come back empty or nearly so. `pending` is 0
 * — nobody is mid-double-opt-in — and `archived` is 5 August-2020 test rows.
 * Both are findings on the same reasoning as the empty collections above:
 * after the account is gone, "we asked, and there were none" is only true if
 * somebody asked.
 *
 * `transactional` is the API's name for what the CSV export calls
 * `nonsubscribed`: contacts Mailchimp holds and may never market to. The two
 * words are the same 790 people, and the consent rules key off the concept
 * rather than the spelling — see
 * `.claude/skills/update-mailing-list/references/consent-rules.md`.
 */
const MEMBER_STATUSES = [
  "subscribed",
  "unsubscribed",
  "cleaned",
  "transactional",
  "pending",
  "archived",
] as const;

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
 * Everything Mailchimp still knows about who one campaign went to.
 *
 * The per-recipient counterpart to {@link fetchEngagement}, and the same shape
 * for the same reason: five views of one send, kept together, under named keys
 * holding the verbatim envelope.
 *
 * It is NOT a more detailed `activity/`. The two overlap on opens and disagree
 * on everything else, and each holds something the other cannot:
 * `email-activity` is the only place clicks and bounces appear against the same
 * recipient, and `sent-to` is the only place the recipients who did NOTHING
 * appear at all. A campaign sent to 653 people with 99 openers is 653 rows here
 * and 99 there, so an archive that kept only one of them would have lost 554
 * people from the record of a send they received.
 *
 * Fetched through {@link fetchEnvelopeForArchive} rather than with a capped
 * `count: 1000` — see that function for the 1,779-recipient send this account
 * holds, which a capped request would have stored 1,000 of.
 *
 * @param campaignId - The campaign id.
 * @returns The composite, ready to write.
 */
async function fetchRecipients(campaignId: string): Promise<Record<string, unknown>> {
  // Five at once, which the client's own gate (8 concurrent) admits without
  // queueing; each may itself page. Campaigns stay serial, as in
  // `fetchEngagement`, so responses are written as they arrive.
  const [sentTo, openDetails, unsubscribed, abuseReports, advice] = await Promise.all([
    fetchEnvelopeForArchive(`/reports/${campaignId}/sent-to`, "sent_to"),
    fetchEnvelopeForArchive(`/reports/${campaignId}/open-details`, "members"),
    fetchEnvelopeForArchive(`/reports/${campaignId}/unsubscribed`, "unsubscribes"),
    fetchEnvelopeForArchive(`/reports/${campaignId}/abuse-reports`, "abuse_reports"),
    fetchEnvelopeForArchive(`/reports/${campaignId}/advice`, "advice"),
  ]);

  return { sentTo, openDetails, unsubscribed, abuseReports, advice };
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

/**
 * The live counts the plan is costed from.
 *
 * Every field is a number this run went and asked for, never one written into
 * this file — see {@link printPlan} for the stale figure that made that rule.
 * A field is 0 or empty when its tier was not requested, which is safe because
 * only a requested tier's `cost` is ever called.
 */
interface LiveCounts {
  sentCampaigns: number;
  templates: number;
  membersByStatus: { status: string; total: number }[];
}

/** Cost and description of each opt-in tier, for the plan. */
const TIER_PLAN: Record<
  IncludeTier,
  {
    file: string;
    endpoint: string;
    /**
     * What the tier costs, and the sentence explaining how that was arrived at.
     *
     * A function rather than a per-campaign multiplier, because three of the
     * seven tiers are not priced per campaign at all: `assets` is one
     * collection, `templates` is one per saved template, and `members` is one
     * per PAGE per status. A single multiplier could only describe them by
     * lying about one of them.
     */
    cost: (counts: LiveCounts) => { requests: number; per: string };
  }
> = {
  activity: {
    file: "activity/<id>.json",
    endpoint: "/reports/{campaignId}/email-activity",
    cost: ({ sentCampaigns }) => ({
      requests: sentCampaigns,
      per: `1 per campaign x ${sentCampaigns}, plus a page per extra 1000 recipients`,
    }),
  },
  content: {
    file: "content/<id>.json",
    endpoint: "/campaigns/{campaignId}/content",
    cost: ({ sentCampaigns }) => ({
      requests: sentCampaigns,
      per: `1 per campaign x ${sentCampaigns}`,
    }),
  },
  engagement: {
    file: "engagement/<id>.json",
    endpoint:
      "/reports/{campaignId}/{click-details,domain-performance,locations,eepurl} + /campaigns/{campaignId}/send-checklist",
    cost: ({ sentCampaigns }) => ({
      requests: 5 * sentCampaigns,
      per: `5 per campaign x ${sentCampaigns}`,
    }),
  },
  assets: {
    file: "file-manager-files.json",
    endpoint: "/file-manager/files",
    cost: () => ({ requests: 1, per: "one paginated collection" }),
  },
  templates: {
    file: "templates.json + templates/<id>.json",
    endpoint: "/templates + /templates/{templateId}/default-content",
    cost: ({ templates }) => ({
      requests: 1 + templates,
      per: `1 for the list, then 1 per template x ${templates}, counted live just now`,
    }),
  },
  members: {
    file: "members/<status>.json",
    endpoint: "/lists/{listId}/members?status={status}",
    cost: ({ membersByStatus }) => ({
      // Pages, not statuses: 1,555 subscribed is two requests of 1000, and a
      // status with nobody in it still costs the one request that proves it.
      requests: membersByStatus.reduce(
        (total, row) => total + Math.max(1, Math.ceil(row.total / 1000)),
        0
      ),
      per: membersByStatus.map((row) => `${row.status} ${row.total}`).join(", "),
    }),
  },
  recipients: {
    file: "recipients/<id>.json",
    endpoint:
      "/reports/{campaignId}/{sent-to,open-details,unsubscribed,abuse-reports,advice}",
    cost: ({ sentCampaigns }) => ({
      requests: 5 * sentCampaigns,
      per: `5 per campaign x ${sentCampaigns}, plus a page per extra 1000 recipients`,
    }),
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
 * collection here is one request unless the account has grown past that. The
 * two tiers where it HAS grown past that — `activity` and `recipients`, on the
 * sends that reached more than 1000 people — say so in their own line rather
 * than quietly reading as exact.
 *
 * @param exportId - The export id.
 * @param dir - Where the files would go.
 * @param listId - The audience id that would be verified and pulled.
 * @param plan - The fixed files.
 * @param includes - The opt-in tiers requested.
 * @param counts - Live counts for the requested tiers.
 */
function printPlan(
  exportId: string,
  dir: string,
  listId: string,
  plan: PlannedFile[],
  includes: Set<IncludeTier>,
  counts: LiveCounts
): void {
  console.log(`Dry run — export ${exportId}`);
  console.log(`  vault      ${dir}`);
  console.log(`  audience   ${listId} (to be verified against GET /lists)`);
  console.log(`  campaigns  ${counts.sentCampaigns} sent, counted live just now`);
  console.log("");
  // Column width from the longest name actually being printed, not a
  // constant: `templates` writes two files and says so, which is 10 characters
  // past the 26 that fitted every filename before it existed.
  const names = [
    ...plan.map((item) => item.file),
    ...INCLUDE_TIERS.filter((tier) => includes.has(tier)).map((tier) => TIER_PLAN[tier].file),
  ];
  const width = Math.max(...names.map((name) => name.length));

  for (const item of plan) {
    console.log(`  ${item.file.padEnd(width)}  ${item.endpoint}`);
  }
  for (const tier of INCLUDE_TIERS) {
    if (includes.has(tier)) {
      console.log(`  ${TIER_PLAN[tier].file.padEnd(width)}  ${TIER_PLAN[tier].endpoint}`);
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
    const { requests, per } = TIER_PLAN[tier].cost(counts);
    console.log(`             ${tier.padEnd(13)} ${String(requests).padStart(4)}  (${per})`);
    total += requests;
  }
  // The four per-campaign tiers all need the sent-campaign list, which the real
  // run fetches once and reuses across however many of them were asked for.
  const perCampaignTiers: IncludeTier[] = ["activity", "content", "engagement", "recipients"];
  if (perCampaignTiers.some((tier) => includes.has(tier))) {
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

  /** Template ids, in the order `/templates` returns them. */
  const templateIds = async (): Promise<(string | number)[]> => {
    const rows = await fetchRawForArchive("/templates", "templates", {
      fields: "templates.id",
    });
    return Array.isArray(rows)
      ? rows.map((row) => (row as { id: string | number }).id)
      : [];
  };

  /**
   * How many members each status holds, without pulling any of them.
   *
   * `fields: total_items` makes each of these one cheap request that returns no
   * member at all — the projection is doing here exactly the job the `members`
   * tier deliberately refuses to do, and for the opposite reason: a plan needs
   * the count, and only the count.
   */
  const memberCounts = async (): Promise<{ status: string; total: number }[]> => {
    const rows: { status: string; total: number }[] = [];
    for (const status of MEMBER_STATUSES) {
      const envelope = (await fetchRawForArchive(`/lists/${listId}/members`, undefined, {
        status,
        count: 0,
        fields: "total_items",
      })) as { total_items?: number };
      rows.push({ status, total: envelope.total_items ?? 0 });
    }
    return rows;
  };

  if (dryRun) {
    // Only the counts a requested tier will actually be costed from are
    // fetched. A dry run that spends six requests projecting members for a run
    // that was never going to pull members is a dry run that lies about its own
    // cost in the other direction.
    const counts: LiveCounts = {
      // Unconditional: the plan's header line reports it whichever tiers were
      // asked for, and "how many sends does this account hold" is the first
      // thing somebody sizing an archival pull wants to know.
      sentCampaigns: (await sentCampaignIds()).length,
      templates: includes.has("templates") ? (await templateIds()).length : 0,
      membersByStatus: includes.has("members") ? await memberCounts() : [],
    };

    // Described rather than resolved: resolving would mean either creating the
    // directory or reimplementing `MAILCHIMP_VAULT_DIR`'s precedence a third
    // time, and a dry run writes nothing.
    printPlan(
      exportId,
      process.env.MAILCHIMP_VAULT_DIR?.trim() || `private/mailchimp/${exportId}/`,
      listId,
      plan,
      includes,
      counts
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

  // Fetched once and shared: four of the seven tiers walk the same list, and
  // asking for it four times would be four chances for it to differ.
  const campaignIds =
    includes.has("activity") ||
    includes.has("content") ||
    includes.has("engagement") ||
    includes.has("recipients")
      ? await sentCampaignIds()
      : [];

  /**
   * Walks a set of ids, writing one file each into a sub-directory, with
   * progress.
   *
   * Serial rather than parallel — the client's gate would queue the requests
   * anyway, and holding 180 responses in memory to write them at the end buys
   * nothing. Shared by every per-item tier so their progress output and their
   * failure behaviour cannot diverge.
   *
   * Takes the ids rather than closing over `campaignIds`, because `templates`
   * has the same shape over a different set: one request per id, one file per
   * id, named by the id. Specialising it to campaigns would have meant a second
   * near-identical loop whose progress reporting drifts from this one.
   */
  const perItem = async (
    label: string,
    subdir: string,
    noun: string,
    ids: readonly (string | number)[],
    fetchOne: (id: string) => Promise<unknown>
  ): Promise<void> => {
    console.log(`  ${label} for ${ids.length} ${noun}…`);
    let done = 0;
    let bytes = 0;
    for (const id of ids) {
      bytes += writeJson(dir, `${subdir}/${id}.json`, await fetchOne(String(id)));
      done += 1;
      if (done % 25 === 0 || done === ids.length) {
        console.log(`    ${done}/${ids.length}  ${bytes} bytes`);
      }
    }
  };

  if (includes.has("content")) {
    // The newsletters themselves, as sent: `plain_text`, `html` and
    // `archive_html`. This is the TEMPLATE, not a per-recipient render — the
    // recipient's name appears as the literal `*|FNAME|*` merge tag — which is
    // what makes twelve years of an organisation's own writing storable at all.
    await perItem("content", "content", "sent campaigns", campaignIds, (id) =>
      fetchRawForArchive(`/campaigns/${id}/content`, undefined)
    );
    endpoints.push("/campaigns/{campaignId}/content");
  }

  if (includes.has("engagement")) {
    await perItem("engagement", "engagement", "sent campaigns", campaignIds, async (id) => {
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
    await perItem("activity", "activity", "sent campaigns", campaignIds, (id) => getEmailActivity(id));
    endpoints.push("/reports/{campaignId}/email-activity");
  }

  if (includes.has("templates")) {
    // 125 saved templates, of which only 6 are `type: "user"` — the
    // organisation's own — and the other 119 are Mailchimp's stock `base` and
    // `gallery` designs. All 125 are pulled anyway: sorting them here would
    // put a judgement into the archive that the `type` field already states,
    // and `templates.json` carries it per row.
    const templates = await fetchRawForArchive("/templates", "templates");
    const bytes = writeJson(dir, "templates.json", templates);
    endpoints.push("/templates");
    const count = Array.isArray(templates) ? templates.length : 1;
    console.log(`  wrote ${"templates.json".padEnd(26)} ${`${count} items`.padStart(11)}  ${bytes} bytes`);

    // The default content of each, which for most of them is empty — see the
    // manifest note. Empty is still the answer, and after cancellation it is
    // the only answer anybody will be able to get.
    const ids = Array.isArray(templates)
      ? templates.map((row) => (row as { id: string | number }).id)
      : [];
    await perItem("templates", "templates", "templates", ids, (id) =>
      fetchRawForArchive(`/templates/${id}/default-content`, undefined)
    );
    endpoints.push("/templates/{templateId}/default-content");
  }

  if (includes.has("members")) {
    // THE AUDIENCE, and the deliberate opposite of `listMembers()`'s narrow
    // default: no `fields` projection, so every member object arrives whole —
    // `ip_signup`, `ip_opt`, `location`, `merge_fields`, `tags`, `stats`. That
    // is precisely the data the narrow default exists to keep out of reach, and
    // it is pulled here on purpose, because it is what the CSV export carries
    // and what stops existing when the account is cancelled. Do not add a
    // `fields` parameter to this call. The protection is that the file lands in
    // the gitignored vault classified `person-network`, never in
    // `lib/data/json/`.
    console.log(`  members for ${MEMBER_STATUSES.length} statuses…`);
    for (const status of MEMBER_STATUSES) {
      const rows = await fetchRawForArchive(`/lists/${listId}/members`, "members", { status });
      const bytes = writeJson(dir, `members/${status}.json`, rows);
      const count = Array.isArray(rows) ? rows.length : 1;
      console.log(`    ${status.padEnd(14)} ${`${count} members`.padStart(13)}  ${bytes} bytes`);
    }
    endpoints.push("/lists/{listId}/members?status={status}");
  }

  if (includes.has("recipients")) {
    await perItem("recipients", "recipients", "sent campaigns", campaignIds, async (id) => {
      const composite = await fetchRecipients(id);
      // These should never fire — `fetchEnvelopeForArchive` pages to
      // exhaustion. They are kept as the PROOF of that rather than as a
      // safety net: a silent cap is exactly how a recipient list goes from
      // 1,779 people to 1,000 and still looks complete.
      warnIfTruncated(`${id} sent-to`, composite.sentTo, "sent_to", truncated);
      warnIfTruncated(`${id} open-details`, composite.openDetails, "members", truncated);
      warnIfTruncated(`${id} unsubscribed`, composite.unsubscribed, "unsubscribes", truncated);
      return composite;
    });
    endpoints.push(
      "/reports/{campaignId}/sent-to",
      "/reports/{campaignId}/open-details",
      "/reports/{campaignId}/unsubscribed",
      "/reports/{campaignId}/abuse-reports",
      "/reports/{campaignId}/advice"
    );
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
  if (includes.has("activity") || includes.has("recipients")) {
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
