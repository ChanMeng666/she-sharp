/**
 * Builds and verifies `lib/data/json/mailchimp/manifest.json`.
 *
 * The manifest is the reason the archive can be trusted on a machine that does
 * not hold the raw data — which is every machine except the one that ran the
 * export, and every CI run. It records, per raw file, which subscription status
 * it holds, its sha256, its shape, how much of a person it exposes, and what it
 * is authoritative for. It also records what is MISSING: on 2026-08-17 the
 * account-level ZIP was triggered and had not arrived, and that fact would
 * become invisible the moment the download folder was tidied up.
 *
 * It is append-only across exports. A re-export adds an `exports[]` entry; old
 * entries are never rewritten, so an earlier export's hashes stay auditable
 * long after its vault directory is gone. That matters more here than for
 * Humanitix: a Mailchimp export is a **snapshot**, so an old entry is the only
 * evidence of a contact who has since been deleted from the account.
 *
 * Usage:
 *   npx tsx scripts/mailchimp/manifest.ts --export 2026-08-17 --append
 *   npx tsx scripts/mailchimp/manifest.ts --export 2026-08-17            # verify
 *   npx tsx scripts/mailchimp/manifest.ts --export 2026-08-28-api --assets
 *   npx tsx scripts/mailchimp/manifest.ts --close-gap <report> --closed-by <exportId>
 *
 * It is also imported: `scripts/mailchimp/fetch-api.ts` builds its own entry
 * with {@link buildApiExportEntry} and writes it with {@link appendExportEntry},
 * so `main()` runs only when this file is the entry point.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import type {
  MailchimpImageClass,
  MailchimpManifest,
  MailchimpManifestExport,
  MailchimpManifestFile,
  MailchimpPiiClass,
} from "../../types/mailchimp";
import { readCsv, readCsvHeader } from "./csv";
import {
  ARCHIVE_DIR,
  argValue,
  fileBytes,
  listVaultAssets,
  listVaultCsvs,
  listVaultFiles,
  resolveVaultDir,
  sha256File,
  vaultFilePath,
} from "./vault";

const MANIFEST_PATH = join(ARCHIVE_DIR, "manifest.json");

const PII_CLASSES: Record<MailchimpPiiClass, string> = {
  none: "No personal data of any kind.",
  aggregate: "Counts and totals only; no row describes one person.",
  "email-only": "Email addresses, with no other identifying attribute.",
  "person-identifying": "Name, email or phone — enough to identify someone.",
  "person-sensitive":
    "Identity plus attributes a person would not expect published: street address, date of birth, employer, and the tags saying which events they came through.",
  "person-network":
    "Network and location metadata: the IP address a person signed up from, their timezone, country and region. An IP plus a timestamp is a location record for the moment someone joined a women-in-tech mailing list, which is not what any of them thought they were giving.",
};

/**
 * Classifies one vault file.
 *
 * Driven by the filename prefix, because Mailchimp names an audience export by
 * status and that prefix is stable across exports — only the trailing hash,
 * which identifies the export job, changes. The PII class and role are
 * judgements, so they are stated here in one place rather than inferred.
 */
function classify(
  file: string
): Omit<MailchimpManifestFile, "file" | "exportedAt" | "bytes" | "sha256" | "rows" | "columns"> {
  const lower = file.toLowerCase();

  if (lower.startsWith("subscribed_")) {
    return {
      report: "audience",
      scope: "audience:She#",
      status: "subscribed",
      hasHeaderRow: true,
      piiClass: "person-network",
      role: "spine",
      redundantWith: null,
      note: "THE LIST. Contacts subscribed at export time — the only file that may ever be imported into Resend, and then only through /update-mailing-list. Authoritative for list size, the tag vocabulary's live half, and every consent signal.",
    };
  }

  if (lower.startsWith("unsubscribed_")) {
    return {
      report: "audience",
      scope: "audience:She#",
      status: "unsubscribed",
      hasHeaderRow: true,
      piiClass: "person-network",
      role: "primary",
      redundantWith: null,
      note: "People who left, with the campaign that prompted it and, for about half, a reason. Feeds the suppression register. A later export showing one of them subscribed again is a new decision by that person; a later file is never a newer permission on its own.",
    };
  }

  if (lower.startsWith("nonsubscribed_")) {
    return {
      report: "audience",
      scope: "audience:She#",
      status: "nonsubscribed",
      hasHeaderRow: true,
      piiClass: "person-network",
      role: "primary",
      redundantWith: null,
      note: "Contacts who NEVER subscribed — transactional-only records Mailchimp holds but may not market to. Not a lapse in consent; an absence of it. Feeds the suppression register.",
    };
  }

  if (lower.startsWith("cleaned_")) {
    return {
      report: "audience",
      scope: "audience:She#",
      status: "cleaned",
      hasHeaderRow: true,
      piiClass: "person-network",
      role: "primary",
      redundantWith: null,
      note: "Hard-bounced addresses, with the campaign that bounced them. `cleaned` is Mailchimp's word for dead. EXCLUDED from the contact count Mailchimp's own UI reports, which is why the dashboard says 3,145 and the files total 3,689.",
    };
  }

  if (lower.startsWith("archived_export")) {
    return {
      report: "archived",
      scope: "audience:She#",
      status: "archived",
      hasHeaderRow: true,
      piiClass: "none",
      role: "reference",
      redundantWith: null,
      note: "Archived contacts. All five are August 2020 test rows (`@getnada.com`, `Test Name`) — kept so that 'we checked, and there was nothing here' is recorded rather than reasoned about again later. Feeds nothing.",
    };
  }

  throw new Error(
    `Unclassified vault file: ${file}\n` +
      `  Add a rule to classify() rather than letting it into the manifest unlabelled.`
  );
}

/** Data rows and column count. Every Mailchimp export carries a header row. */
function measure(exportId: string, file: string) {
  return {
    rows: readCsv(exportId, file).length,
    columns: readCsvHeader(exportId, file).length,
  };
}

/**
 * Where the raw files live, written so a committed manifest stays portable.
 *
 * Three cases. Inside `private/`, it is the gitignored in-repo cache and the
 * path is repo-relative. Inside another git repository — the normal case, now
 * that the private archive repo is the master copy — it is that repository's
 * own directory name plus the path within it, so the entry reads the same on
 * every machine and says WHICH archive rather than which laptop. Anywhere else
 * the path is recorded verbatim, because a manifest that quietly rewrites a
 * path it does not understand is worse than one that admits where the files
 * were.
 *
 * The failure being avoided is an absolute Windows path in a committed file:
 * `D:/github_repository/…` is true on exactly one machine, silently wrong
 * everywhere else, and leaks a local filesystem layout into a public
 * repository. The previous test — `dir.includes("private") ? … : dir` — fell
 * into the `: dir` branch for every run against the archive repo.
 *
 * The twin of `portableVaultPath` in `scripts/humanitix/manifest.ts`, and
 * deliberately not shared with it, for the same reason the two vault modules
 * are not shared: the one thing that must never be got wrong is which
 * subsystem's directory the PII is in, and that is the only thing a shared
 * version would be parameterised on.
 *
 * @param dir - The resolved vault directory.
 * @param exportId - The export it belongs to.
 * @returns A path suitable for committing.
 */
export function portableVaultPath(dir: string, exportId: string): string {
  const norm = dir.split("\\").join("/");
  if (norm.includes("/private/")) return `private/mailchimp/${exportId}/`;

  const parts = norm.split("/");
  // Deepest first, so a repository nested inside another names the inner one.
  for (let i = parts.length - 1; i > 0; i -= 1) {
    if (existsSync(parts.slice(0, i).concat(".git").join("/"))) {
      return parts.slice(i - 1).join("/") + "/";
    }
  }
  return norm.endsWith("/") ? norm : `${norm}/`;
}

/**
 * Refuses to build a CSV entry for a directory holding an API pull.
 *
 * `--append` and `fetch-api.ts` write to the SAME `exports[]` array keyed on
 * the same `exportId`, and {@link appendExportEntry} replaces a matching entry
 * rather than merging it. So `manifest.ts --export 2026-08-28-api --append`,
 * one keystroke from the command that built it, hands `buildExportEntry` a
 * directory full of JSON: `classify()` never runs because there are no CSVs,
 * and a complete `method: "api-v3"` entry — its `api` block, its endpoint list,
 * every file and hash — is silently overwritten with `files: []`.
 *
 * That is not a hypothetical. It happened on the Humanitix side on 2026-08-28
 * and was only noticed because an unrelated assertion about the spine happened
 * to fail. An empty entry is worse than no entry: it reads as "this export was
 * recorded and contained nothing".
 *
 * @param exportId - The export being appended.
 * @throws When the directory holds JSON and no CSV.
 */
function refuseApiVault(exportId: string): void {
  if (listVaultCsvs(exportId).length > 0) return;
  if (listVaultFiles(exportId, ".json").length === 0) return;

  throw new Error(
    `Export ${exportId} is an API pull, not a CSV export.\n` +
      `  ${resolveVaultDir(exportId)}\n` +
      "  holds .json responses and no .csv, so --append would record an EMPTY\n" +
      "  entry over whatever is in the manifest for this exportId.\n" +
      "  Rebuild it with the tool that wrote it instead:\n" +
      `    npx tsx scripts/mailchimp/fetch-api.ts --export ${exportId} --include <tiers>`
  );
}

function buildExportEntry(exportId: string): MailchimpManifestExport {
  const dir = resolveVaultDir(exportId);
  refuseApiVault(exportId);
  const files = listVaultCsvs(exportId);

  const entries: MailchimpManifestFile[] = files.map((file) => {
    const classified = classify(file);
    const path = vaultFilePath(exportId, file);
    const { rows, columns } = measure(exportId, file);
    return {
      file,
      ...classified,
      // Mailchimp does not stamp the export moment into the filename the way
      // Humanitix does — the hex suffix identifies the export job, not its
      // time. The session date is all the filenames can honestly support.
      exportedAt: exportId,
      bytes: fileBytes(path),
      sha256: sha256File(path),
      rows,
      columns,
    };
  });

  return {
    exportId,
    source:
      "Mailchimp → Audience → All contacts → Export Contacts (one file per status), plus Audience → Archived contacts → Export",
    exportedAtLocal: `${exportId}T21:00:00`,
    timezone: "Pacific/Auckland",
    vaultPath: portableVaultPath(dir, exportId),
    fileCount: entries.length,
    files: entries,
  };
}

// ---------------------------------------------------------------------------
// API pulls
// ---------------------------------------------------------------------------

/** What `classifyApiFile` decides, before the measured fields are added. */
type ApiFileFacts = Pick<
  MailchimpManifestFile,
  "report" | "scope" | "endpoint" | "piiClass" | "role" | "redundantWith" | "note"
>;

/**
 * Classifies one JSON file written by `fetch-api.ts`.
 *
 * The twin of {@link classify}, kept separate for the same reason
 * {@link buildApiExportEntry} is: a CSV is identified by the status in its
 * filename and a JSON response by the endpoint it came from, and those are two
 * different provenance stories rather than one with a parameter.
 *
 * The endpoint is concrete, not templated, because per file it is the ONLY
 * statement of what the numbers inside are counts of — `/lists/<id>` and
 * `/lists/<other>/growth-history` are different claims, and a reader holding
 * one file should not have to consult `api.listId` to know which they have.
 *
 * @param relativePath - Path relative to the export directory, forward slashes.
 * @param listId - The verified audience id, for the audience-scoped endpoints.
 * @returns The file's provenance and PII judgements.
 * @throws When the file is not one this pull is known to write.
 */
export function classifyApiFile(relativePath: string, listId: string): ApiFileFacts {
  switch (relativePath) {
    case "account.json":
      return {
        report: "account",
        scope: "account",
        endpoint: "/",
        // Checked on 2026-08-28, not assumed. No natural person is NAMED —
        // `first_name`/`last_name` hold "She"/"Sharp" and `email` is the
        // newsletter role address. What the file does carry is `contact`, a
        // full street address in Henderson, Auckland, filed under
        // `company: "She Sharp"`. It appears nowhere in this repository and
        // nowhere on the public site; it is a residential address that a
        // charity is registered at, which is to say it is somebody's home
        // filed under an organisation's name. Classified by what it exposes
        // rather than by whose name is on it.
        piiClass: "person-sensitive",
        role: "primary",
        redundantWith: null,
        note: "The account itself: plan type, first payment, industry, timezone, member-since, last login, and `total_subscribers` — which is 3,151 and is Mailchimp's OWN figure, excluding the cleaned, so it is the dashboard number and NOT the 3,706 the members/ files total. Also `industry_stats`, which are Mailchimp's non-profit-sector benchmarks and describe other people's accounts, not this one. The `contact` block is a residential street address; it may be quoted to the charity's own officers and MUST NOT be republished, and it is the reason this file is person-sensitive despite naming nobody.",
      };

    case "campaigns-all.json":
      return {
        report: "campaigns-all",
        scope: "account",
        endpoint: "/campaigns",
        // Stronger than `sent-campaigns.json`'s `email-only`, and the
        // difference is entirely in the 33 rows that file does not have. The
        // 180 sent rows carry `from_name` values that are role labels or a
        // bare first name; one DRAFT carries a person's full name against
        // their work address, which is an identification the sent set never
        // makes. Scanned across all 213 rows, not sampled.
        piiClass: "person-identifying",
        role: "primary",
        redundantWith: "sent-campaigns.json",
        note: "All 213 campaigns at every status — 180 `sent`, 32 `save` (drafts) and 1 `schedule`. The 33 unsent ones exist ONLY here: a draft is the last trace of a campaign somebody wrote and decided not to send, and no report, archive URL or CSV records it. Ordered by create_time, so it reads as a history of the writing rather than of the sending. Supersedes sent-campaigns.json as a superset; that file is kept because it is the send-time-ordered view and the one the committed campaigns.json is built from. Sender identity is verbatim here: `settings.from_name` holds one person's full name on a single draft and `settings.reply_to` a personal Gmail on 7 rows (1 sent, 6 drafts). `emails_sent` is 0 on every unsent row — that is what unsent means, not a failed send.",
      };

    case "authorized-apps.json":
      return {
        report: "authorized-apps",
        scope: "account",
        endpoint: "/authorized-apps",
        // Scanned: no address anywhere, and the only person-shaped field,
        // `users`, holds the organisation's own Mailchimp username.
        piiClass: "none",
        role: "primary",
        redundantWith: null,
        note: "The 4 third-party applications holding OAuth access to this account, with the description each of them presented at authorisation. SECURITY-RELEVANT and recorded nowhere else: one of them is the Humanitix integration that writes registrants into the audience without anybody touching Mailchimp, which is why every count in this archive is a reading at pull time. Names the apps, NOT their credentials — a token appears nowhere in the API — so revoking them is still a dashboard job that has to happen before the account closes.",
      };

    case "verified-domains.json":
      return {
        report: "verified-domains",
        scope: "account",
        endpoint: "/verified-domains",
        // One row carries `verification_email`, a She Sharp role address. The
        // other is gmail.com with the field empty.
        piiClass: "email-only",
        role: "primary",
        redundantWith: null,
        note: "The 2 domains this account was permitted to send AS, with `verified`, `authenticated` and `is_free_email_provider` per row. Mailchimp's side of the arrangement documented from the DNS side in docs/deployment/EMAIL_AUTHENTICATION.md, and the evidence for which of the historic from-addresses were actually authenticated. `authenticated: false` on a verified domain means the address was confirmed by clicking a link, NOT that DKIM was set up for it.",
      };

    case "ecommerce-stores.json":
      return {
        report: "ecommerce-stores",
        scope: "account",
        endpoint: "/ecommerce/stores",
        // Each of the 3 stores is NAMED after a person — the same person,
        // with a currency suffix — beside a She Sharp role address. A full
        // name plus an address is an identification, whoever it belongs to.
        // `phone` and `address` are present as fields and empty in all 3.
        piiClass: "person-identifying",
        role: "reference",
        redundantWith: null,
        note: "3 ecommerce stores, which is a surprise on a non-profit newsletter account and is the finding. All 3 are artefacts of connected integrations rather than a shop: no platform, no domain, no orders, empty addresses, and `money_format` NZD. Two of the ids share a prefix with the third's, so they are the same connection re-registered. Each store's `name` is a natural person's full name, which is what makes this file person-identifying; the `email_address` on each is a She Sharp role address. Evidence that ecommerce tracking existed, NOT evidence that anything was ever sold.",
      };

    case "connected-sites.json":
      return {
        report: "connected-sites",
        scope: "account",
        endpoint: "/connected-sites",
        // Scanned: domains, timestamps and a tracking script. No address, no
        // name, no visitor.
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        note: "The 4 websites carrying (or registered to carry) the Mailchimp tracking script, with the exact `<script>` fragment for each and an `is_pixel_enabled` flag. Records that the OLD shesharp.co.nz domain was connected in 2020 and updated as recently as 2026-08-17. Describes SITES, never visitors: no browsing data is in the API. `is_pixel_enabled: false` on a site means the connection exists and the pixel is off, which is a different thing from the site not being connected.",
      };

    case "batches.json":
      return {
        report: "batches",
        scope: "account",
        endpoint: "/batches",
        // No person appears: ids, statuses, operation counts, timestamps. The
        // caveat in the note is about a CREDENTIAL, not about PII, and the
        // vocabulary here has no class for that — types/mailchimp.ts drops
        // Humanitix's `access-secret` deliberately — so it is stated in the
        // note where a reader will actually meet it.
        piiClass: "none",
        role: "primary",
        redundantWith: null,
        note: "The 21 batch operations ever run against this account: how many operations each carried, how many errored, and when. The ONLY record of automated WRITES in an archive that is otherwise entirely a record of reads — the most recent ran 222 operations on 2026-08-26. CAUTION: `response_body_url` is a PRE-SIGNED AWS S3 URL carrying a temporary credential, and it points at a tarball of the per-operation API responses, which for a member batch is member data. It expires, so it is not a durable link and must not be treated as one; it is also the reason this file should not be pasted anywhere the vault's own rules do not reach. The results themselves are NOT downloaded by this pull.",
      };

    case "batch-webhooks.json":
      return {
        report: "batch-webhooks",
        scope: "account",
        endpoint: "/batch-webhooks",
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        note: "EMPTY, and stored because empty is the finding. No endpoint is notified when a batch operation finishes, so the 21 batches in batches.json told nothing outside Mailchimp that they had run. `items: 0` means there are none, NOT that the pull failed. The audience-event twin of this question is webhooks.json, and it is also empty.",
      };

    case "conversations.json":
      return {
        report: "conversations",
        scope: "account",
        endpoint: "/conversations",
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        note: "EMPTY. Nobody's REPLY to a campaign was ever captured into Mailchimp's conversations inbox, so no correspondence with a subscriber is held on the account and none is lost when it closes. `items: 0` is the evidence, not a failed request. Replies went to the reply-to addresses instead, which are named in campaigns-all.json and whose mailboxes are outside this archive entirely.",
      };

    case "template-folders.json":
      return {
        report: "template-folders",
        scope: "account",
        endpoint: "/template-folders",
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        note: "EMPTY. The 125 templates are unfoldered, so `templates.json` is the whole organisation of them and no grouping is lost. `items: 0` means there are none.",
      };

    case "campaign-folders.json":
      return {
        report: "campaign-folders",
        scope: "account",
        endpoint: "/campaign-folders",
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        note: "EMPTY. The 213 campaigns are unfoldered — every `settings.folder_id` in campaigns-all.json is blank — so no grouping a person applied is lost. `items: 0` means there are none.",
      };

    case "file-manager-folders.json":
      return {
        report: "file-manager-folders",
        scope: "account",
        endpoint: "/file-manager/folders",
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        note: "EMPTY. The image gallery is flat: all 677 files in file-manager-files.json sit at the top level, so their `folder_id` carries no meaning and nothing has to be reconstructed. `items: 0` means there are none.",
      };

    case "facebook-ads.json":
      return {
        report: "facebook-ads",
        scope: "account",
        endpoint: "/facebook-ads",
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        note: "EMPTY. No Facebook or Instagram ad was ever run through this account, so no paid-social spend or audience is held here and none dies with it. `items: 0` means there are none, NOT that the pull failed or that the account lacked permission — the endpoint answered 200.",
      };

    case "customer-journeys.json":
      return {
        report: "customer-journeys",
        scope: "account",
        endpoint: "/customer-journeys/journeys",
        piiClass: "none",
        role: "primary",
        redundantWith: null,
        note: "EMPTY, and it closes the one thing automations.json explicitly did not. That file's note said it covered classic automations only and that Customer Journeys sat behind an endpoint the pull did not touch; this is that endpoint, and the answer is zero. Taken together the two settle it completely: NO mail leaves this account on a trigger of any kind, so cancelling it silences nothing that is still running. `items: 0` is the evidence.",
      };

    case "list-abuse-reports.json":
      return {
        report: "list-abuse-reports",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/abuse-reports`,
        // Four rows, four real personal email addresses at consumer domains,
        // each against a campaign id and a date. `merge_fields` is not
        // returned by this endpoint, so it stops short of person-sensitive.
        piiClass: "person-identifying",
        role: "primary",
        redundantWith: null,
        note: "The 4 spam complaints in the account's whole history: who complained, about which campaign, and when. Every row is a real personal address at a consumer domain. Read it as a SUPPRESSION obligation and nothing else — a complaint is the strongest possible refusal of consent, and these four addresses must never be imported into Resend or any successor regardless of what any other file says about them. The aggregate `abuseReports` column in reports.json is the same four events counted; this is the only place they are attributed.",
      };

    case "list-locations.json":
      return {
        report: "list-locations",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/locations`,
        piiClass: "aggregate",
        role: "reference",
        redundantWith: null,
        note: "The audience by country: 28 rows of `country`, `cc`, `percent` and `total`. Aggregate by construction — Mailchimp reports the country, never the member. Derived from the same geolocation that fills `location` on a member object, so it covers only the subset Mailchimp could place, and the percentages are of THAT subset rather than of the audience. A country with 1 contact is still listed, which is the one place this file edges toward describing somebody.",
      };

    case "list-surveys.json":
      return {
        report: "list-surveys",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/surveys`,
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        note: "EMPTY. No Mailchimp survey was ever created against this audience, so no survey responses are held on the account and no question anybody answered is lost. She Sharp's own feedback form is unrelated and lives in this repository — see docs/development/EVENT_FEEDBACK.md. `items: 0` means there are none.",
      };

    case "templates.json":
      return {
        report: "templates",
        scope: "account",
        endpoint: "/templates",
        // Scanned all 125 rows: no address of any kind. The only
        // person-shaped fields, `created_by` and `edited_by`, hold three
        // values — the organisation's own account name, an empty string, and
        // one two-initial name.
        piiClass: "none",
        role: "primary",
        redundantWith: null,
        note: "All 125 saved templates: name, type, category, created/edited dates and by whom, and whether each is drag-and-drop. Only 6 are `type: \"user\"` — the organisation's own designs, including the newsletter template in use in 2026 — and the other 119 are Mailchimp's stock `base` (40) and `gallery` (79) designs, which are not She Sharp's work and are kept only so the 6 can be identified by contrast. METADATA ONLY: `GET /templates/{id}` returns no HTML at all, so this file names the templates without preserving any of them. What it is NOT is a copy of the newsletter design — see templates/ for how little of that is recoverable.",
      };

    case "lists.json":
      return {
        report: "lists",
        scope: "account",
        endpoint: "/lists",
        // `email-only`, not `aggregate`: the verbatim payload carries
        // `campaign_defaults.from_email`, which on this account is a founder's
        // personal Gmail rather than a role address. Everything else in the
        // file is counts. See the `list.json` case for the general trap.
        piiClass: "email-only",
        role: "reference",
        // The pulled audience appears here too. Recorded as redundant rather
        // than dropped: this file is the EVIDENCE that the id in `api.listId`
        // was the only audience on the account, which is the question a reader
        // asks a year later when a number does not match the dashboard.
        redundantWith: "list.json",
        note: "Every audience on the account, with Mailchimp's own summary stats. Authoritative for 'which audiences existed at pull time', which is why it is kept even though only one of them matters. Its stats are a reading at pull time, not a history.",
      };

    case "list.json":
      return {
        report: "list",
        scope: "audience:She#",
        endpoint: `/lists/${listId}`,
        // THE TRAP THAT APPLIES TO EVERY FILE IN AN API PULL. `lib/mailchimp/
        // client.ts` maps sender identity away, and it is tempting to reason
        // from that to "no address reaches the vault" — but `fetchRawForArchive`
        // exists precisely to go around the mappers, so a mapper's guarantee
        // says nothing at all about a file written verbatim. Checked on
        // 2026-08-27: `campaign_defaults.from_email` is a personal Gmail.
        piiClass: "email-only",
        role: "primary",
        redundantWith: null,
        note: "The She# audience as Mailchimp held it at pull time: member, unsubscribe and cleaned counts, campaign count, open and click rate. A SNAPSHOT — the Humanitix integration adds contacts between pulls, so this disagrees with an older export by design. Carries ONE address, `campaign_defaults.from_email`, which is a founder's personal Gmail and not a role address; `contact` is the charity's own postal details, not a person's.",
      };

    case "growth-history.json":
      return {
        report: "growth-history",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/growth-history`,
        piiClass: "aggregate",
        role: "primary",
        redundantWith: null,
        note: "Month-by-month audience growth: `existing` is subscribed members at each month's end, i.e. the list-size-over-time series a status-partitioned CSV export cannot contain. `imports` and `optins` are that month's additions by route, NOT a consent record.",
      };

    case "sent-campaigns.json":
      return {
        report: "sent-campaigns",
        scope: "account",
        endpoint: "/campaigns?status=sent",
        // Was `none`, on the reasoning that `mapCampaign()` drops `from_name`
        // and `reply_to`. That reasoning does not hold for a VERBATIM file:
        // this one is written by `fetchRawForArchive`, which bypasses the
        // mapper by design, and every one of the 180 rows carries
        // `settings.reply_to`. Corrected 2026-08-27 after scanning the file
        // rather than the code that was believed to have produced it.
        piiClass: "email-only",
        role: "primary",
        redundantWith: null,
        note: "Every campaign that actually went out: subject line, send time, recipient count, archive URL. Account-scoped because /campaigns filters by status, not by audience; the account has one audience, so in practice they coincide. `emailsSent` is what Mailchimp attempted, not what was delivered — see reports.json for bounces. Carries `settings.reply_to` on all 180 rows: seven distinct values, six of them She Sharp role addresses and one (a single April-2026 campaign) a founder's personal Gmail. NOT the campaign body — that is content/.",
      };

    case "reports.json":
      return {
        report: "reports",
        scope: "account",
        endpoint: "/reports",
        piiClass: "aggregate",
        role: "primary",
        redundantWith: null,
        note: "Per-campaign aggregate performance: sends, opens, clicks, bounces, unsubscribes, abuse reports. This is the campaign-level statistics the account ZIP was going to supply. Open rate is unreliable after Apple Mail Privacy Protection (2021) and must not be compared across that boundary.",
      };

    case "segments.json":
      return {
        report: "segments",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/segments`,
        piiClass: "aggregate",
        role: "primary",
        redundantWith: null,
        note: "All 237 segments: 214 of type `static` — which is what Mailchimp calls a TAG — and 23 of type `campaign_static`, the frozen recipient set of a past send. Each row carries a name and a member_count and NO members, so this names the audience's structure without describing anybody in it. It does NOT contradict the saved-segments gap: `saved` means a dynamic, rule-based segment, and there are still zero of those. Authoritative for the tag vocabulary INCLUDING tags nobody now carries, which the CSV export cannot show because it only lists tags against live contacts.",
      };

    case "merge-fields.json":
      return {
        report: "merge-fields",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/merge-fields`,
        piiClass: "none",
        role: "primary",
        redundantWith: null,
        note: "The seven merge-field DEFINITIONS — tag, name, type, required, default, public. The schema of the audience, not a single value from it: this is what the columns in a CSV export mean, and it is what a Resend import would have to map onto. No contact data of any kind.",
      };

    case "signup-forms.json":
      return {
        report: "signup-forms",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/signup-forms`,
        piiClass: "none",
        role: "primary",
        redundantWith: null,
        note: "The hosted signup form's own design: header, field contents, styles and public URL. This is the WORDING PEOPLE AGREED TO when they joined — the thing knownGaps said could only be screenshotted before the account closed. It is the form as it stands at pull time, NOT as it stood when any particular person signed up, so it is evidence of the current opt-in text and not a per-person consent record.",
      };

    case "list-activity.json":
      return {
        report: "list-activity",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/activity`,
        piiClass: "aggregate",
        role: "primary",
        redundantWith: null,
        note: "Daily aggregate list activity — sends, opens, clicks, subscribes, unsubscribes per DAY, 2,054 days from 2019-07-15 to the pull. The daily resolution growth-history.json only has monthly. Counts of events, never who: no row identifies anybody. A day missing from the series is a day Mailchimp recorded nothing, not a day of zeroes.",
      };

    case "clients.json":
      return {
        report: "clients",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/clients`,
        piiClass: "aggregate",
        role: "reference",
        redundantWith: null,
        note: "The 16 email clients subscribers read with, with a member count each. Aggregate by construction — Mailchimp reports the client, never the reader. Derived from open tracking, so it describes only the subset who loaded images, and it is skewed by Apple Mail Privacy Protection the same way open rate is.",
      };

    case "interest-categories.json":
      return {
        report: "interest-categories",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/interest-categories`,
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        // Empty, and that is the point — see `planFixedFiles()` in fetch-api.ts.
        note: "EMPTY, and stored because empty is the finding. The audience has no interest groups, so every preference a subscriber ever expressed is expressed as a tag and nothing is hiding in a second structure. `items: 0` here means the account holds none, NOT that the pull failed.",
      };

    case "webhooks.json":
      return {
        report: "webhooks",
        scope: "audience:She#",
        endpoint: `/lists/${listId}/webhooks`,
        piiClass: "none",
        role: "reference",
        redundantWith: null,
        note: "EMPTY. No webhook forwards this audience's subscribe, unsubscribe or profile events anywhere, so no third system holds a shadow copy fed by Mailchimp. `items: 0` means there are none, NOT that the pull failed. Worth re-reading before the account is closed: a webhook added later is a data flow that would outlive it.",
      };

    case "automations.json":
      return {
        report: "automations",
        scope: "account",
        endpoint: "/automations",
        piiClass: "none",
        role: "primary",
        redundantWith: null,
        note: "EMPTY. No classic automation workflow exists on the account, so no mail goes out on a trigger nobody is watching. This settles half of the `automations-forms-landing-pages` gap, which recorded automations as unexportable — they are exportable, there are simply none. It does NOT cover Customer Journeys, which Mailchimp exposes through a different endpoint and this pull does not touch.",
      };

    case "landing-pages.json":
      return {
        report: "landing-pages",
        scope: "account",
        endpoint: "/landing-pages",
        piiClass: "none",
        role: "primary",
        redundantWith: null,
        note: "EMPTY. The account has no landing pages, so nothing published under a Mailchimp URL disappears when it closes. Settles the other half of the `automations-forms-landing-pages` gap. `items: 0` is the evidence, not a failed request.",
      };

    case "file-manager-files.json":
      return {
        report: "file-manager",
        scope: "account",
        endpoint: "/file-manager/files",
        // Checked rather than assumed: across all 677 rows the only
        // person-shaped field, `created_by`, holds exactly two values — the
        // organisation's own account name and one two-initial name. No
        // address, no IP, no recipient.
        piiClass: "none",
        role: "primary",
        redundantWith: null,
        note: "The 677 images in the Mailchimp gallery: name, type, size, dimensions, upload date and public gallery URL. METADATA ONLY — the pull does not download the images, and the URLs stop resolving when the account closes, so this is an inventory of what would be lost rather than a copy of it. `created_by` is the Mailchimp user's display name, and across all 677 rows holds only the organisation's own account name and one two-initial name.",
      };

    default: {
      const activity = /^activity\/([A-Za-z0-9]+)\.json$/.exec(relativePath);
      if (activity) {
        return {
          report: "email-activity",
          scope: `campaign:${activity[1]}`,
          endpoint: `/reports/${activity[1]}/email-activity`,
          // The only person-shaped file in the pull: one row per recipient,
          // keyed by their address. IP addresses are excluded at the request
          // AND dropped by the client's mapper, so this is `person-identifying`
          // rather than `person-network`.
          piiClass: "person-identifying",
          role: "primary",
          redundantWith: null,
          note: "Per-recipient opens, clicks and bounces for one campaign. NEVER commit, and never derive a segment from it without re-reading the consent rules — being an opener is not a subscription. IP addresses are absent by design.",
        };
      }

      const content = /^content\/([A-Za-z0-9]+)\.json$/.exec(relativePath);
      if (content) {
        return {
          report: "campaign-content",
          scope: `campaign:${content[1]}`,
          endpoint: `/campaigns/${content[1]}/content`,
          // Assumed `none` from a five-campaign sample; scanning all 180 said
          // otherwise. No RECIPIENT is exposed — that half of the assumption
          // held, the reader is always the unexpanded `*|FNAME|*` merge tag —
          // but the newsletters name speakers and organisers in prose, and 22
          // of the 180 print a non-She-Sharp address in the body. A sample is
          // not a scan.
          piiClass: "person-identifying",
          role: "primary",
          redundantWith: null,
          note: "One newsletter as it was sent — `plain_text`, `html` and `archive_html`. Twelve years of the organisation's own writing, and the ONLY copy of it outside Mailchimp: `sent-campaigns.json` has the subject line and an archive_url, and that URL dies with the account. It is the TEMPLATE, not a per-recipient render: the reader appears only as `*|FNAME|*`, so no subscriber is identifiable here and this is NOT a substitute for activity/. What it does carry is the people it was written about — named speakers with bios, employers and photographs — and, in 22 of the 180 issues, a contact address that is not a She Sharp role address: one volunteer's private Hotmail account, printed as a `mailto:` in 14 issues, plus an organisational Gmail in 7 and a partner's careers@ in 1. Public-by-intent, every word of it, which is a reason it may be quoted and NOT a reason it may be committed.",
        };
      }

      const engagement = /^engagement\/([A-Za-z0-9]+)\.json$/.exec(relativePath);
      if (engagement) {
        return {
          report: "campaign-engagement",
          scope: `campaign:${engagement[1]}`,
          // Five responses in one file, so the endpoint is five endpoints. The
          // alternative — five files per campaign, 900 of them — would put the
          // provenance in the filename at the cost of a directory nobody opens.
          endpoint:
            `/reports/${engagement[1]}/click-details + /reports/${engagement[1]}/domain-performance + ` +
            `/reports/${engagement[1]}/locations + /reports/${engagement[1]}/eepurl + ` +
            `/campaigns/${engagement[1]}/send-checklist`,
          // Four of the five sub-responses are pure aggregate. The fifth is
          // not: `sendChecklist` quotes the campaign's own from-address back in
          // prose ("All replies for this campaign will be sent to …"), which
          // for one of the 180 is a personal Gmail. One sentence in one item
          // decides the class for the whole file.
          piiClass: "email-only",
          role: "primary",
          redundantWith: null,
          note: "Five aggregate breakdowns of one send, each under its own key holding the verbatim envelope: `clickDetails` (clicks per URL), `domainPerformance` (delivery and opens per recipient DOMAIN, e.g. gmail.com), `locations` (opens per country/region), `eepurl` (the shortlink and its social referrers), `sendChecklist` (Mailchimp's own pre-send warnings). No RECIPIENT appears anywhere: every count is a total, and domainPerformance names the mail provider, never the mailbox. The only address in the file is the SENDER's, quoted inside a sendChecklist item — a She Sharp role address in 179 of the 180, a founder's personal Gmail in one. `items: 1` because the file is a composite object, not a collection; each envelope's own `total_items` is the count that means something, and it is also the evidence that nothing was truncated. NOT per-recipient detail — that is activity/, and it is a different PII class.",
        };
      }

      const template = /^templates\/(\d+)\.json$/.exec(relativePath);
      if (template) {
        return {
          report: "template-default-content",
          scope: `template:${template[1]}`,
          endpoint: `/templates/${template[1]}/default-content`,
          piiClass: "none",
          role: "reference",
          redundantWith: null,
          note: "The default content of one saved template, section by section. MOSTLY EMPTY, and that is the finding rather than a failure: of the 6 templates that are the organisation's own, 4 return `sections: {}` — including BOTH current newsletter templates — and only the two oldest return anything. Mailchimp's Marketing API v3 exposes no way to read a template's HTML, so the design of the newsletter people have received since 2023 is NOT recoverable from this archive by any endpoint, and it is lost when the account closes unless somebody exports it by hand from the dashboard. What IS preserved is the rendered result: content/<campaignId>.json holds the full HTML of every issue as it went out, which is the same design with the copy poured in. The sections that do come back are Mailchimp's own stock boilerplate on `base` templates, not She Sharp's writing.",
        };
      }

      const members = /^members\/(subscribed|unsubscribed|cleaned|transactional|pending|archived)\.json$/.exec(
        relativePath
      );
      if (members) {
        return {
          report: "members",
          scope: "audience:She#",
          endpoint: `/lists/${listId}/members?status=${members[1]}`,
          // THE AUDIENCE, whole. Confirmed on a live row, not assumed:
          // `ip_opt` is a real IP address, `location` carries latitude,
          // longitude, timezone and region, and `merge_fields` carries FNAME,
          // LNAME, ADDRESS, PHONE and BIRTHDAY. That is the same class the
          // CSV files get, which is right — this is the same data by another
          // route.
          piiClass: "person-network",
          role: members[1] === "subscribed" ? "spine" : "primary",
          redundantWith: null,
          note: "Every member at one subscription status, as FULL member objects — the deliberate opposite of `listMembers()`'s narrow default, because this is the last reading anybody will ever be able to take. Carries `ip_signup` and `ip_opt`, `location` (latitude, longitude, timezone, region), `merge_fields` (name, street address, phone, birthday), `tags`, `stats`, `member_rating`, `source` and `unsubscribe_reason`. The API's `transactional` is the CSV export's `nonsubscribed` — the same 790 contacts who reached the audience through the Humanitix integration and opted in to nothing; `pending` is 0 and `archived` is 5 August-2020 test rows. NEVER commit any of it, and never import any status but `subscribed`, and that only through /update-mailing-list. `id` is the md5 of the lowercased address, which reverses trivially against a candidate list, so it is not an anonymisation. A count here disagreeing with a CSV export is not an error: the integration adds contacts between readings.",
        };
      }

      const recipients = /^recipients\/([A-Za-z0-9]+)\.json$/.exec(relativePath);
      if (recipients) {
        return {
          report: "campaign-recipients",
          scope: `campaign:${recipients[1]}`,
          endpoint:
            `/reports/${recipients[1]}/sent-to + /reports/${recipients[1]}/open-details + ` +
            `/reports/${recipients[1]}/unsubscribed + /reports/${recipients[1]}/abuse-reports + ` +
            `/reports/${recipients[1]}/advice`,
          // Stronger than activity/'s `person-identifying`, and the reason is
          // one field: `sent-to` and `unsubscribed` rows carry `merge_fields`,
          // so a recipient arrives with whatever name, street address, phone
          // and birthday the audience holds for them. activity/ carries the
          // address alone.
          piiClass: "person-sensitive",
          role: "primary",
          redundantWith: null,
          note: "Who one campaign went to and what they did with it, as five verbatim envelopes under named keys: `sentTo` (every recipient, opened or not), `openDetails` (the openers, with per-open timestamps and the envelope's own `total_opens` / `total_proxy_excluded_opens`), `unsubscribed` (who left through this send, with their reason), `abuseReports` (who marked it spam), `advice` (Mailchimp's boilerplate coaching, no person in it). NOT a fuller activity/ — the two disagree: `sentTo` is the ONLY place the recipients who did nothing appear, and activity/ is the only place CLICKS and BOUNCES appear against a recipient. A 653-recipient send with 99 openers is 653 rows here and 99 there. Person-sensitive rather than person-identifying because `sentTo` and `unsubscribed` rows carry `merge_fields`. `items: 1` because the file is a composite object; each envelope's `total_items` is the count that means something, and the arrays are complete — they are paged to exhaustion rather than capped at 1000, which matters on the 1,779-recipient send. Being sent a campaign is NOT consent; re-read the consent rules before deriving any segment from it.",
        };
      }

      throw new Error(
        `Unclassified API vault file: ${relativePath}\n` +
          `  Add a case to classifyApiFile() rather than letting it into the manifest unlabelled.`
      );
    }
  }
}

/**
 * The moment this ran, as local wall-clock plus the zone it is wall-clock in.
 *
 * @returns `exportedAtLocal` and `timezone`, ready to spread into an entry.
 */
function localTimestamp(): { exportedAtLocal: string; timezone: string } {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    exportedAtLocal:
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
      `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    // Named rather than assumed: the CSV entries say Pacific/Auckland because
    // that is where somebody sat; a pull can be run from anywhere.
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}

/**
 * Counts what one JSON response holds.
 *
 * A single-resource response (`/lists/{id}`) is one item. `0` would read as
 * "the pull returned nothing", which is a different — and false — claim.
 *
 * @param path - Absolute path to the JSON file.
 * @returns The collection length, or 1 for a single resource.
 */
function measureApiFile(path: string): number {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  return Array.isArray(parsed) ? parsed.length : 1;
}

/**
 * Builds the `exports[]` entry for an API pull.
 *
 * Deliberately NOT a parameterisation of {@link buildExportEntry}. That one
 * hardcodes a `source` describing a sequence of dashboard clicks, an
 * `exportedAtLocal` of `${exportId}T21:00:00` (the evening somebody sat down to
 * download files), and `classify()`'s filename-prefix rules. None of the three
 * means anything for a pull that ran at a known instant against known
 * endpoints, and threading a flag through all of them would leave one function
 * telling two stories.
 *
 * @param exportId - The export id, `<YYYY-MM-DD>-api`. Names the vault directory.
 * @param api - The verified audience, the shard the key resolved to, and the
 *   endpoint templates touched. No key and no address, ever.
 * @returns The entry, ready for {@link appendExportEntry}.
 */
export function buildApiExportEntry(
  exportId: string,
  api: { baseUrl: string; listId: string; endpoints: string[] }
): MailchimpManifestExport {
  const dir = resolveVaultDir(exportId);
  const files = listVaultFiles(exportId, ".json");

  const entries: MailchimpManifestFile[] = files.map((file) => {
    const path = vaultFilePath(exportId, file);
    const facts = classifyApiFile(file, api.listId);
    // Written out field by field rather than spread, so the rendered manifest
    // keeps the same reading order as a CSV entry: what the file is, then what
    // it holds, then how much of a person it exposes, then its measurements.
    return {
      file,
      report: facts.report,
      scope: facts.scope,
      // An API response is scoped by endpoint, not by subscription status —
      // `/lists/{id}/growth-history` has no status at all, and inventing one
      // would make the entry claim something the data does not support.
      status: "n/a",
      format: "json",
      endpoint: facts.endpoint,
      piiClass: facts.piiClass,
      role: facts.role,
      redundantWith: facts.redundantWith,
      note: facts.note,
      // `hasHeaderRow`, `rows` and `columns` are deliberately absent rather
      // than false/0: they are CSV shape, and a JSON document does not have
      // them. `rows: 0` would read as "the pull returned nothing".
      //
      // The date, not the whole export id: `exportedAt` is a date everywhere
      // else in the manifest, and `2026-08-27-api` is not one.
      exportedAt: exportId.slice(0, 10),
      bytes: fileBytes(path),
      sha256: sha256File(path),
      items: measureApiFile(path),
    };
  });

  // Binary rows are carried through, not rebuilt. This function reads only the
  // `.json` responses, and `appendExportEntry` REPLACES an entry by exportId —
  // so without this, re-running `fetch-api.ts` after a network failure (the
  // exact case its resumability exists for) would silently delete every asset
  // hash recorded by `--assets`, with no error and no diff anyone would read as
  // a loss. It is `refuseApiVault`'s documented failure running the other way.
  const carried = carriedBinaryRows(exportId);
  if (carried.length > 0) {
    console.log(`  carried forward ${carried.length} recorded asset row(s)`);
  }

  return {
    exportId,
    source:
      "Mailchimp Marketing API v3, pulled by scripts/mailchimp/fetch-api.ts. The audience id was verified against GET /lists rather than trusted from the environment.",
    // A pull knows the instant it ran, unlike a CSV session whose filenames
    // carry only an export-job hash. Recorded to the second because here the
    // precision is measured rather than guessed — and built from LOCAL
    // calendar fields with the machine's own zone beside it, because a
    // `toISOString()` slice on a New Zealand evening records yesterday.
    ...localTimestamp(),
    vaultPath: portableVaultPath(dir, exportId),
    fileCount: entries.length + carried.length,
    method: "api-v3",
    api,
    files: [...entries, ...carried],
  };
}

// ---------------------------------------------------------------------------
// Images — the gallery, and what the campaign bodies referenced from elsewhere
// ---------------------------------------------------------------------------

/**
 * One image row of the vault's `campaign-images.json`.
 *
 * Written by `scripts/mailchimp/campaign-images.ts`, which is the only thing
 * that knows how a URL in a twelve-year-old newsletter maps to a file on disk.
 * This module reads its output rather than re-deriving it, so the crosswalk has
 * exactly one implementation.
 */
interface CrosswalkFile {
  file: string;
  sha256: string;
  bytes: number;
  references: number;
  host?: string;
  classification?: MailchimpImageClass;
}

/** The vault's crosswalk, or a message naming the script that writes it. */
function readCrosswalk(exportId: string): { gallery: CrosswalkFile[]; downloaded: CrosswalkFile[] } {
  const path = join(resolveVaultDir(exportId), "campaign-images.json");
  if (!existsSync(path)) {
    throw new Error(
      `No campaign-images.json in the vault for ${exportId}.\n` +
        `  ${path}\n` +
        "  It is what says which image each campaign body pointed at, and this\n" +
        "  manifest records only what that file measured. Build it first:\n" +
        `    npx tsx scripts/mailchimp/campaign-images.ts --export ${exportId}`
    );
  }

  const parsed = JSON.parse(readFileSync(path, "utf8")) as {
    galleryFiles?: CrosswalkFile[];
    downloadedFiles?: CrosswalkFile[];
  };
  return { gallery: parsed.galleryFiles ?? [], downloaded: parsed.downloadedFiles ?? [] };
}

/**
 * The prose for one image row.
 *
 * Five short templates rather than the paragraph-length notes the JSON rows
 * carry: there are over seven hundred of these, and note prose is what decides
 * whether this file grows by 400 KB or by a megabyte.
 */
function classifyAssetFile(
  relativePath: string,
  record: CrosswalkFile
): Pick<MailchimpManifestFile, "report" | "scope" | "piiClass" | "role" | "redundantWith" | "note"> {
  const imageClass: MailchimpImageClass =
    record.classification ?? (relativePath.startsWith("assets/") ? "gallery-original" : "third-party");

  const shared = {
    scope: "account",
    // An image of a poster or a room. No address, no IP, no code. Faces appear
    // in some of them, which is a publication question for the re-host and not
    // a classification question for this file.
    piiClass: "none" as const,
  };

  switch (imageClass) {
    case "gallery-original":
      return {
        ...shared,
        report: "gallery-image",
        role: record.references > 0 ? "primary" : "reference",
        redundantWith: "file-manager-files.json",
        note:
          record.references > 0
            ? `Gallery image, referenced ${record.references} time(s) by the sent campaigns.`
            : "Gallery image no surviving campaign references. Kept: the account is being closed and this is the only copy.",
      };
    case "mailchimp-chrome":
      return {
        ...shared,
        report: "campaign-image",
        role: "reference",
        redundantWith: null,
        note: "Mailchimp's own template furniture (a social icon or badge), not She Sharp's work. Archived so a past issue still renders; drop it when re-hosting.",
      };
    case "content-not-in-gallery":
      return {
        ...shared,
        report: "campaign-image",
        role: "primary",
        redundantWith: null,
        note: "On a Mailchimp host, referenced by a campaign, and absent from the file-manager inventory — so the gallery pull alone would not have saved it. Dies with the account.",
      };
    case "third-party":
      return {
        ...shared,
        report: "campaign-image",
        role: "reference",
        redundantWith: null,
        note: "Hosted by a third party, not by Mailchimp. Closing the account does not remove it, but the third party can — and one already has.",
      };
    default:
      throw new Error(
        `Unclassified image class for ${relativePath}: ${String(imageClass)}\n` +
          "  Add a case to classifyAssetFile() rather than letting it into the manifest unlabelled."
      );
  }
}

/**
 * The binary rows for one export, measured on disk and described by the crosswalk.
 *
 * Cross-checks both directions on purpose. A file on disk with no crosswalk row
 * is the unclassified case and throws; a crosswalk row with no file on disk
 * means an interrupted download, and recording its hash would assert we hold
 * something we do not.
 */
export function buildAssetFileRows(exportId: string): MailchimpManifestFile[] {
  const crosswalk = readCrosswalk(exportId);
  const described = new Map<string, CrosswalkFile>();
  for (const record of [...crosswalk.gallery, ...crosswalk.downloaded]) {
    described.set(record.file, record);
  }

  const onDisk = [...listVaultAssets(exportId, "assets"), ...listVaultAssets(exportId, "campaign-images")];
  const missing = [...described.keys()].filter((file) => !onDisk.includes(file));
  if (missing.length > 0) {
    throw new Error(
      `${missing.length} file(s) in campaign-images.json are not in the vault, e.g. ${missing[0]}.\n` +
        `  Re-run: npx tsx scripts/mailchimp/campaign-images.ts --export ${exportId}`
    );
  }

  return onDisk.map((file) => {
    const record = described.get(file);
    if (!record) {
      throw new Error(
        `Image in the vault with no crosswalk row: ${file}\n` +
          `  Re-run: npx tsx scripts/mailchimp/campaign-images.ts --export ${exportId}`
      );
    }

    const path = vaultFilePath(exportId, file);
    const facts = classifyAssetFile(file, record);
    return {
      file,
      report: facts.report,
      scope: facts.scope,
      status: "n/a",
      format: "binary",
      // No `endpoint`: an image is not the response to one. No `hasHeaderRow`,
      // `rows` or `columns`: those are CSV shape.
      piiClass: facts.piiClass,
      role: facts.role,
      redundantWith: facts.redundantWith,
      note: facts.note,
      exportedAt: exportId.slice(0, 10),
      bytes: fileBytes(path),
      sha256: sha256File(path),
      // One file is one image. `0` would read as "the pull returned nothing".
      items: 1,
      // The host, never the URL — see MailchimpManifestFile.sourceHost.
      sourceHost:
        record.host ?? (file.startsWith("assets/") ? "gallery.mailchimp.com" : "(unrecorded)"),
      imageClass: record.classification ?? "gallery-original",
      referencedBy: record.references,
    } satisfies MailchimpManifestFile;
  });
}

/** The binary rows already recorded for an export, for carrying forward. */
function carriedBinaryRows(exportId: string): MailchimpManifestFile[] {
  const entry = loadManifest()?.exports.find((item) => item.exportId === exportId);
  return (entry?.files ?? []).filter((file) => file.format === "binary");
}

/**
 * Merges the image rows into an existing API entry.
 *
 * Never `--append`. That path is the CSV builder, and `refuseApiVault` exists
 * because handing it an API directory silently overwrites a complete entry with
 * `files: []`. This one reads the entry that is there, replaces only its binary
 * rows, and writes back through the single write path.
 */
export function mergeAssetRows(exportId: string): MailchimpManifestFile[] {
  const manifest = loadManifest();
  if (!manifest) throw new Error(`No manifest at ${MANIFEST_PATH}. Run with --append first.`);

  const entry = manifest.exports.find((item) => item.exportId === exportId);
  if (!entry) {
    throw new Error(
      `Manifest has no export ${exportId}.\n` +
        "  Images belong to the pull that inventoried them; record the pull first."
    );
  }
  if (entry.method !== "api-v3") {
    throw new Error(
      `Export ${exportId} is not an API pull.\n` +
        "  The gallery inventory comes from /file-manager/files, which only an API pull reaches."
    );
  }

  const rows = buildAssetFileRows(exportId);
  const kept = entry.files.filter((file) => file.format !== "binary");
  appendExportEntry({ ...entry, fileCount: kept.length + rows.length, files: [...kept, ...rows] });
  return rows;
}

/**
 * Refuses to file one export's images under another export's name.
 *
 * `resolveVaultDir` honours `MAILCHIMP_VAULT_DIR` regardless of `--export`.
 * Every read-only script survives that mismatch; this one writes rows into a
 * committed file keyed on the id it was told.
 */
function assertVaultMatchesExport(exportId: string): void {
  const vault = resolveVaultDir(exportId);
  if (basename(vault) === exportId) return;
  throw new Error(
    `MAILCHIMP_VAULT_DIR points at ${basename(vault)} but --export says ${exportId}.\n` +
      `  ${vault}\n` +
      "  These must agree before anything is written into the committed manifest."
  );
}

const KNOWN_GAPS: MailchimpManifest["knownGaps"] = [
  {
    report: "account-export-zip",
    scope: "account",
    claimedExported: true,
    present: false,
    reason:
      "Triggered on 2026-08-17 via Settings → Manage my data → Export data, with all 8 categories ticked (Emails, Audiences, Reports, Templates, Gallery, Events, Appointments, Ecommerce) and range = All data. Mailchimp emails a download link to the organisation's newsletter mailbox (named in docs/development/EMAIL_ADDRESSES.md — no address is written into this file, because the leak guard that keeps 3,689 real addresses out of it does not get an exception) and may take up to 24 hours. It had not arrived when this manifest was first written.",
    impact:
      "Campaign-level statistics for the 209 campaigns — sends, opens, clicks, bounces per campaign — exist only inside it. Without it this archive can say who was on the list but nothing about how the list behaved.",
    action:
      "Collect the link from the newsletter mailbox and add it as mailchimp/<date>-account/ in the private repo, then a second exports[] entry here. NOTE: Mailchimp allows one account export per 24 hours, so a link left to expire costs another day.",
    blocks: [
      "campaign send/open/click/bounce statistics",
      "the historical audience-size series",
      "template and landing-page content",
    ],
  },
  {
    report: "per-campaign-recipient-activity",
    scope: "per-campaign",
    claimedExported: false,
    present: false,
    reason:
      "Mailchimp exports per-recipient open and click detail one campaign at a time — 209 manual operations. Skipped by decision on 2026-08-17.",
    impact:
      "No per-person engagement history. This is what would be needed to build the 'most engaged recent openers' sub-segment the Resend migration runbook recommends sending to first.",
    action:
      "Only if the ramped first send is judged to need it. The campaign-level summaries in the account ZIP are the cheaper substitute.",
    blocks: ["a recent-openers segment for the first Resend broadcast"],
  },
  {
    report: "saved-segments",
    scope: "audience:She#",
    claimedExported: false,
    present: false,
    reason:
      "There are none to export. The account has 214 tags and zero saved segments.",
    impact:
      "None. All of the audience's structure is in the TAGS column, which is exported in full.",
    action: "None.",
  },
  {
    report: "automations-forms-landing-pages",
    scope: "account",
    claimedExported: false,
    present: false,
    reason:
      "Mailchimp's export does not include automation workflows, signup-form designs, or landing-page and website content. No export option produces them.",
    impact:
      "If the account is closed, the design of the signup form that collected most of this consent is lost, and with it the wording people agreed to.",
    action:
      "Screenshot or save them by hand BEFORE the Mailchimp account is closed. An export taken afterwards will not bring them back.",
    blocks: ["the exact opt-in wording shown on the website signup form"],
  },
];

/**
 * Serialises a generated file.
 *
 * CRLF, matching `lib/data/json/humanitix/` and the rest of `lib/data/json/`.
 * This repository is worked on with `core.autocrlf=true`, so git checks these
 * files out with CRLF on Windows; rendering LF here would make every rebuild
 * look like a whole-file rewrite.
 */
function render(manifest: MailchimpManifest): string {
  return (JSON.stringify(manifest, null, 2) + "\n").replace(/\n/g, "\r\n");
}

const METADATA_NOTE =
  "Provenance for the raw Mailchimp audience exports. The raw CSVs are never committed (see /private/ in .gitignore); this file exists so their provenance stays auditable when the data itself is not present, which is the normal case and always the case on CI. Unlike a ticketing report, a Mailchimp export is a SNAPSHOT of subscription status — so an old exports[] entry is not superseded by a newer one, it is the only remaining evidence of anyone deleted from the account since.";

function loadManifest(): MailchimpManifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as MailchimpManifest;
}

/**
 * Adds one export entry to the manifest and writes it back.
 *
 * Append-only in the sense that matters: other entries are carried through
 * untouched and `knownGaps` is preserved as it stands on disk. Re-running the
 * same `exportId` replaces only that entry, which is what makes a pull safe to
 * repeat after a failure part-way through.
 *
 * @param entry - The entry to add, from `buildExportEntry` or
 *   {@link buildApiExportEntry}.
 */
export function appendExportEntry(entry: MailchimpManifestExport): void {
  const existing = loadManifest();
  const others = (existing?.exports ?? []).filter(
    (item) => item.exportId !== entry.exportId
  );

  const manifest: MailchimpManifest = {
    metadata: {
      note: METADATA_NOTE,
      vaultEnvVar: "MAILCHIMP_VAULT_DIR",
      piiClasses: PII_CLASSES,
    },
    exports: [...others, entry].sort((a, b) => a.exportId.localeCompare(b.exportId)),
    knownGaps: existing?.knownGaps ?? KNOWN_GAPS,
  };

  writeFileSync(MANIFEST_PATH, render(manifest), "utf8");
}

/**
 * Annotates one known gap as closed, changing nothing else about it.
 *
 * The only sanctioned way to edit a gap. `KNOWN_GAPS` above is unreachable once
 * a manifest exists (`existing?.knownGaps ?? KNOWN_GAPS`), so without this the
 * only way to record that a gap had been filled was to hand-edit a file the
 * docs call GENERATED — and a hand edit is exactly how `impact` and `action`
 * get tidied away, leaving the archive looking as though nothing was ever
 * missing.
 *
 * Note what it does NOT do: `present` stays as it was. A gap recorded as
 * exported-but-absent is still absent; something else supplied what it held.
 *
 * @param report - The `knownGaps[].report` to annotate.
 * @param closedBy - The `exportId` that supplied what was missing.
 */
export function closeGap(report: string, closedBy: string): void {
  const manifest = loadManifest();
  if (!manifest) {
    throw new Error(`No manifest at ${MANIFEST_PATH}. Run with --append first.`);
  }

  const gap = manifest.knownGaps.find((item) => item.report === report);
  if (!gap) {
    throw new Error(
      `No known gap named ${report}.\n  Gaps: ${manifest.knownGaps.map((item) => item.report).join(", ")}`
    );
  }
  if (!manifest.exports.some((item) => item.exportId === closedBy)) {
    throw new Error(
      `No export ${closedBy} in the manifest — a gap may only be closed by an export that is recorded.`
    );
  }

  gap.closedBy = closedBy;
  gap.closedAt = localTimestamp().exportedAtLocal.slice(0, 10);

  writeFileSync(MANIFEST_PATH, render(manifest), "utf8");
  console.log(`Closed gap ${report} — closedBy ${closedBy}, closedAt ${gap.closedAt}`);
  console.log(`  present stays ${JSON.stringify(gap.present)}; impact and action are unchanged.`);
}

/** One line per file, in whichever shape the file actually has. */
function printEntry(entry: MailchimpManifestExport): void {
  console.log(`Wrote ${MANIFEST_PATH}\n  export ${entry.exportId}: ${entry.fileCount} files`);
  for (const file of entry.files) {
    const size =
      (file.format ?? "csv") === "csv"
        ? `${String(file.rows).padStart(5)} rows `
        : `${String(file.items).padStart(5)} items`;
    console.log(`    ${file.role.padEnd(9)} ${size}  ${file.status.padEnd(14)} ${file.file}`);
  }
}

function main() {
  const argv = process.argv.slice(2);
  const exportId = argValue(argv, "--export");
  const append = argv.includes("--append");
  const assets = argv.includes("--assets");
  const verifyAssets = argv.includes("--verify-assets");
  const gapToClose = argValue(argv, "--close-gap");

  if (gapToClose) {
    const closedBy = argValue(argv, "--closed-by");
    if (!closedBy) {
      console.error(
        "Usage: npx tsx scripts/mailchimp/manifest.ts --close-gap <report> --closed-by <exportId>"
      );
      process.exit(1);
    }
    try {
      closeGap(gapToClose, closedBy);
    } catch (error) {
      // Every failure here is a typo in one of the two arguments, and the
      // message already names the valid values. A stack trace pushes it off
      // the screen.
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    return;
  }

  if (!exportId) {
    console.error(
      "Usage: npx tsx scripts/mailchimp/manifest.ts --export <YYYY-MM-DD> [--append]\n" +
        "       npx tsx scripts/mailchimp/manifest.ts --export <id>-api --assets\n" +
        "       npx tsx scripts/mailchimp/manifest.ts --close-gap <report> --closed-by <exportId>"
    );
    process.exit(1);
  }

  if (assets) {
    try {
      assertVaultMatchesExport(exportId);
      const rows = mergeAssetRows(exportId);
      const byClass = new Map<string, number>();
      for (const row of rows) {
        const key = row.imageClass ?? "(none)";
        byClass.set(key, (byClass.get(key) ?? 0) + 1);
      }
      const bytes = rows.reduce((sum, row) => sum + row.bytes, 0);
      console.log(`${exportId}: recorded ${rows.length} image(s), ${(bytes / 1024 / 1024).toFixed(1)} MB`);
      for (const [key, count] of [...byClass].sort()) console.log(`  ${key.padEnd(24)} ${count}`);
      const unused = rows.filter((row) => row.referencedBy === 0).length;
      console.log(`  referenced by no campaign  ${unused}`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    return;
  }

  if (append) {
    try {
      const entry = buildExportEntry(exportId);
      appendExportEntry(entry);
      printEntry(entry);
    } catch (error) {
      // Same one-line treatment as --close-gap, and for a sharper reason: the
      // failure this path now has is `refuseApiVault`, whose whole value is a
      // five-line message saying which tool to use instead. A stack trace
      // pushes that message off the screen.
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    return;
  }

  // Verify mode: every recorded file must still hash to what it hashed to.
  const manifest = loadManifest();
  if (!manifest) {
    console.error(`No manifest at ${MANIFEST_PATH}. Run with --append first.`);
    process.exit(1);
  }
  const entry = manifest.exports.find((item) => item.exportId === exportId);
  if (!entry) {
    console.error(`Manifest has no export ${exportId}.`);
    process.exit(1);
  }

  // Binary rows are skipped unless asked for. Re-hashing 550 MB and printing
  // 1,400 `ok -` lines on every verify is how a check stops being run.
  const toVerify = verifyAssets
    ? entry.files
    : entry.files.filter((file) => file.format !== "binary");
  const skipped = entry.files.length - toVerify.length;
  if (skipped > 0) {
    console.log(`  (skipping ${skipped} image(s) — pass --verify-assets to include them)`);
  }

  let failures = 0;
  for (const file of toVerify) {
    const path = vaultFilePath(exportId, file.file);
    if (!existsSync(path)) {
      failures++;
      console.error(`  FAIL - missing from the vault: ${file.file}`);
      continue;
    }
    const hash = sha256File(path);
    if (hash !== file.sha256) {
      failures++;
      console.error(
        `  FAIL - sha256 changed: ${file.file}\n    manifest ${file.sha256}\n    on disk  ${hash}`
      );
      continue;
    }
    console.log(`  ok - ${file.file}`);
  }

  console.log(
    failures === 0
      ? `\nok - all ${toVerify.length} files match the manifest`
      : `\n${failures} file(s) do not match the manifest`
  );
  process.exit(failures === 0 ? 0 : 1);
}

// Guarded so `fetch-api.ts` can import `buildApiExportEntry` and
// `appendExportEntry` without this file's CLI running as a side effect.
if (require.main === module) main();
