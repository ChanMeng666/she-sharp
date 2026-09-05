/**
 * Move the stored user uploads off Cloudinary and onto the organisation's own
 * Vercel Blob store, and rewrite the database columns that point at them.
 *
 * WHY THIS EXISTS
 * ---------------
 * `/api/upload/photo` and `/api/upload/cv` wrote to Cloudinary until
 * 2026-09-06. That Cloudinary account was personal, not the charity's, and is
 * being handed back — every URL it serves is on borrowed time, and when the
 * account goes the profile photographs and CVs go with it. The routes now write
 * to Blob; this script rehosts what the routes wrote before the switch.
 *
 * It is a ONE-WAY, ONE-TIME job. Once every column reads zero Cloudinary URLs
 * the script has nothing left to do, and the `res.cloudinary.com` entry in
 * `next.config.ts` can be deleted.
 *
 * WHAT IT TOUCHES
 * ---------------
 * Exactly five columns — the five that hold an upload URL. Verified against
 * production on 2026-09-05, 41 rows between them:
 *
 *   mentor_profiles.photo_url                 9
 *   mentee_profiles.photo_url                10
 *   mentor_form_submissions.photo_url         9
 *   mentee_form_submissions.photo_url        11
 *   volunteer_form_submissions.cv_url         2
 *
 * A row is CANDIDATE only if its value is a `res.cloudinary.com` URL. Anything
 * else — null, a Blob URL from a post-switch upload, a Gravatar, a hand-pasted
 * link — is counted and left exactly as it is. That is what makes the script
 * idempotent: a second run finds no candidates and writes nothing.
 *
 * SAFETY
 * ------
 * - `--dry-run` is the DEFAULT. Nothing downloads, nothing uploads, nothing is
 *   written unless `--apply` is passed.
 * - Cloudinary objects are never deleted. The source stays put until the
 *   account is closed, so a bad run can be re-run rather than recovered from.
 * - Each row is written immediately after its own upload succeeds, rather than
 *   batching at the end: an interrupted run then leaves a consistent database
 *   whose remaining rows are simply still candidates.
 *
 * Usage:
 *   npx tsx scripts/assets/migrate-cloudinary-to-blob.ts            # dry run
 *   npx tsx scripts/assets/migrate-cloudinary-to-blob.ts --apply    # do it
 *
 *   --apply       Download, upload and rewrite. Without it, plan only.
 *   --limit <n>   Process at most n candidate rows (per run, across columns).
 *
 * Environment:
 *   POSTGRES_URL           read from `.env` via dotenv, as every script here is.
 *   BLOB_READ_WRITE_TOKEN  read from `.env`, falling back to `.env.local`.
 *
 * Output:
 *   A per-column before/after count, then a summary. Exit code 1 on any failure.
 */

import "dotenv/config";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import { db, client } from "@/lib/db/drizzle";
import {
  menteeFormSubmissions,
  menteeProfiles,
  mentorFormSubmissions,
  mentorProfiles,
  volunteerFormSubmissions,
} from "@/lib/db/schema";
import { CV_PREFIX, PHOTO_PREFIX, emailStem } from "@/lib/blob/uploads";

/** Host every legacy upload URL is served from. */
const CLOUDINARY_HOST = "res.cloudinary.com";

/** One migratable column, and how to name the object it will become. */
interface ColumnSpec {
  /** Label used in the report; the real table/column names. */
  label: string;
  table: PgTable;
  /** The URL column being rewritten. */
  urlColumn: PgColumn;
  /** Drizzle property name of that column, for the UPDATE `set`. */
  field: "photoUrl" | "cvUrl";
  /** Primary key, for the targeted UPDATE. */
  idColumn: PgColumn;
  /** Column carrying the applicant's email, for the object path stem. */
  emailColumn: PgColumn | null;
  /** Blob prefix the rehosted object lands under. */
  prefix: string;
  /** Sub-folder under the prefix, mirroring the upload routes' layout. */
  kind: string | null;
}

/**
 * The five columns, in a fixed order so two runs report identically.
 *
 * `*_profiles` carry no email of their own — the email lives on `users` — so
 * their stem falls back to the row id. The stem is a filing convenience, not an
 * identifier anything reads back, so a mismatch between the two shapes is
 * harmless; what matters is that the object is traceable to its row.
 */
const COLUMNS: ColumnSpec[] = [
  {
    label: "mentor_profiles.photo_url",
    table: mentorProfiles,
    urlColumn: mentorProfiles.photoUrl,
    field: "photoUrl",
    idColumn: mentorProfiles.id,
    emailColumn: null,
    prefix: PHOTO_PREFIX,
    kind: "mentor",
  },
  {
    label: "mentee_profiles.photo_url",
    table: menteeProfiles,
    urlColumn: menteeProfiles.photoUrl,
    field: "photoUrl",
    idColumn: menteeProfiles.id,
    emailColumn: null,
    prefix: PHOTO_PREFIX,
    kind: "mentee",
  },
  {
    label: "mentor_form_submissions.photo_url",
    table: mentorFormSubmissions,
    urlColumn: mentorFormSubmissions.photoUrl,
    field: "photoUrl",
    idColumn: mentorFormSubmissions.id,
    emailColumn: mentorFormSubmissions.email,
    prefix: PHOTO_PREFIX,
    kind: "mentor",
  },
  {
    label: "mentee_form_submissions.photo_url",
    table: menteeFormSubmissions,
    urlColumn: menteeFormSubmissions.photoUrl,
    field: "photoUrl",
    idColumn: menteeFormSubmissions.id,
    emailColumn: menteeFormSubmissions.email,
    prefix: PHOTO_PREFIX,
    kind: "mentee",
  },
  {
    label: "volunteer_form_submissions.cv_url",
    table: volunteerFormSubmissions,
    urlColumn: volunteerFormSubmissions.cvUrl,
    field: "cvUrl",
    idColumn: volunteerFormSubmissions.id,
    emailColumn: volunteerFormSubmissions.email,
    prefix: CV_PREFIX,
    kind: null,
  },
];

interface Args {
  apply: boolean;
  limit: number | null;
}

function parseArgs(argv: string[]): Args {
  let apply = false;
  let limit: number | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--apply") apply = true;
    else if (arg === "--dry-run") apply = false;
    else if (arg === "--limit") {
      const raw = argv[++i];
      const n = Number(raw);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`--limit expects a positive integer, got "${raw ?? ""}"`);
      }
      limit = n;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return { apply, limit };
}

/**
 * Populate `process.env` from `.env.local` for keys not already set.
 *
 * `import "dotenv/config"` reads `.env`, not `.env.local` — that is the Next.js
 * dev server's file — but `BLOB_READ_WRITE_TOKEN` lives there.
 * `scripts/mailchimp/rehost-archive-images.ts` does this the same way for the
 * same reason.
 */
function loadLocalEnv(keys: string[]): void {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length === 0) return;
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!missing.includes(key) || process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

/**
 * Whether a stored value is a Cloudinary URL this script should rehost.
 *
 * Host-based, not substring-based: a value merely containing the word
 * "cloudinary" (a filename, say) is not a Cloudinary asset, and treating it as
 * one would send the script off to download something that is not there.
 */
function isCloudinaryUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    const url = new URL(value);
    return url.hostname.toLowerCase() === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

/** Whether a stored value already points at a Vercel Blob object. */
function isBlobUrl(value: unknown): boolean {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    return new URL(value).hostname.toLowerCase().endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Extension for the rehosted object, taken from the Cloudinary URL and checked
 * against the response's own content type.
 *
 * Blob infers `Content-Type` from the pathname when none is supplied, and a CV
 * filed as `.jpg` would then be served as an image and refuse to open. Where
 * the two disagree the content type wins, because it is what Cloudinary
 * actually stored.
 */
function extensionFor(url: string, contentType: string | null): string {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
  };
  const normalised = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (byType[normalised]) return byType[normalised];
  const fromPath = new URL(url).pathname.split(".").pop()?.toLowerCase() ?? "";
  if (/^[a-z0-9]{2,5}$/.test(fromPath)) return fromPath === "jpeg" ? "jpg" : fromPath;
  return "bin";
}

interface ColumnReport {
  label: string;
  total: number;
  cloudinaryBefore: number;
  blobBefore: number;
  otherBefore: number;
  migrated: number;
  failed: number;
}

async function migrateColumn(
  spec: ColumnSpec,
  args: Args,
  token: string | undefined,
  budget: { remaining: number | null }
): Promise<ColumnReport> {
  const selection: Record<string, PgColumn> = {
    id: spec.idColumn,
    url: spec.urlColumn,
  };
  if (spec.emailColumn) selection.email = spec.emailColumn;

  const rows = (await db.select(selection).from(spec.table)) as unknown as {
    id: number;
    url: string | null;
    email?: string | null;
  }[];

  const report: ColumnReport = {
    label: spec.label,
    total: rows.length,
    cloudinaryBefore: 0,
    blobBefore: 0,
    otherBefore: 0,
    migrated: 0,
    failed: 0,
  };

  const candidates: typeof rows = [];
  for (const row of rows) {
    if (isCloudinaryUrl(row.url)) {
      report.cloudinaryBefore++;
      candidates.push(row);
    } else if (isBlobUrl(row.url)) {
      report.blobBefore++;
    } else if (row.url) {
      report.otherBefore++;
    }
  }

  console.log(
    `${spec.label.padEnd(38)} rows=${String(report.total).padStart(4)}  ` +
      `cloudinary=${String(report.cloudinaryBefore).padStart(3)}  ` +
      `blob=${String(report.blobBefore).padStart(3)}  ` +
      `other=${String(report.otherBefore).padStart(3)}`
  );

  for (const row of candidates) {
    if (budget.remaining !== null && budget.remaining <= 0) break;
    const sourceUrl = row.url as string;
    const stem = spec.emailColumn ? emailStem(row.email) : `id-${row.id}`;

    if (!args.apply) {
      console.log(`  [plan] #${row.id}  ${sourceUrl}`);
      continue;
    }

    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`GET ${response.status} ${response.statusText}`);
      }
      const contentType = response.headers.get("content-type");
      const body = Buffer.from(await response.arrayBuffer());
      const extension = extensionFor(sourceUrl, contentType);
      const folder = spec.kind ? `${spec.prefix}/${spec.kind}` : spec.prefix;
      const pathname = `${folder}/${stem}.${extension}`;

      // addRandomSuffix: true, for the same reason the upload routes use it —
      // these are personal documents, a public Blob URL is readable by anyone
      // holding it exactly as the Cloudinary URL was, and the unguessable
      // suffix is what keeps that parity rather than a downgrade. It also
      // means a re-run can never collide with an object a previous run wrote.
      const uploaded = await put(pathname, body, {
        access: "public",
        addRandomSuffix: true,
        contentType: contentType?.split(";")[0]?.trim() || undefined,
        token,
      });

      await db
        .update(spec.table)
        .set({ [spec.field]: uploaded.url })
        .where(eq(spec.idColumn, row.id));

      report.migrated++;
      if (budget.remaining !== null) budget.remaining--;
      console.log(`  [done] #${row.id}  ${body.byteLength} bytes → ${uploaded.url}`);
    } catch (error) {
      report.failed++;
      console.error(
        `  [FAIL] #${row.id}  ${sourceUrl}\n         ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return report;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  loadLocalEnv(["BLOB_READ_WRITE_TOKEN"]);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (args.apply && !token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set, and .env.local does not carry it.\n" +
        "Pull it rather than inventing one:\n" +
        "  vercel env pull .env.local"
    );
  }

  console.log(
    args.apply
      ? "Migrating Cloudinary uploads to Vercel Blob (--apply: WRITING).\n"
      : "Dry run — nothing will be downloaded, uploaded or written. Pass --apply to do it.\n"
  );
  console.log("BEFORE");

  const budget = { remaining: args.limit };
  const reports: ColumnReport[] = [];
  // Serial, not Promise.all: Neon throttles concurrent connection attempts, and
  // five parallel selects on a cold pool is exactly the burst that trips it.
  for (const spec of COLUMNS) {
    reports.push(await migrateColumn(spec, args, token, budget));
  }

  console.log("\nAFTER");
  let migrated = 0;
  let failed = 0;
  let remaining = 0;
  for (const r of reports) {
    const left = r.cloudinaryBefore - r.migrated;
    migrated += r.migrated;
    failed += r.failed;
    remaining += left;
    console.log(
      `${r.label.padEnd(38)} cloudinary ${String(r.cloudinaryBefore).padStart(3)} → ` +
        `${String(left).padStart(3)}   blob ${String(r.blobBefore).padStart(3)} → ` +
        `${String(r.blobBefore + r.migrated).padStart(3)}`
    );
  }

  console.log("");
  console.log(`Migrated  ${migrated}`);
  console.log(`Failed    ${failed}`);
  console.log(`Remaining ${remaining}`);
  if (!args.apply) {
    console.log("\nPlan only. Re-run with --apply to download, upload and rewrite.");
  } else if (remaining === 0 && failed === 0) {
    console.log(
      "\nNothing left on Cloudinary. The `res.cloudinary.com` entry in " +
        "next.config.ts can now be deleted."
    );
  }

  await client.end();
  if (failed > 0) process.exit(1);
}

void main().catch(async (error: unknown) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  await client.end().catch(() => undefined);
  process.exit(1);
});
