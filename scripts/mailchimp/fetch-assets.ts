/**
 * Downloads the Mailchimp gallery images an API pull only inventoried.
 *
 * `fetch-api.ts --include assets` writes `file-manager-files.json`, which is
 * metadata: id, name, type, size, dimensions, upload date and a public CDN URL.
 * It is deliberately not the images, because 677 files at 547 MB is a decision
 * somebody takes on purpose rather than a side effect of asking for an export.
 *
 * This is that decision, made separately. It matters because the account is
 * being cancelled: those CDN URLs stop resolving when it closes, and the
 * inventory then describes 547 MB of the organisation's own artwork that no
 * longer exists anywhere.
 *
 * The URLs are public — no key is sent, and none is needed. That is also why
 * this script cannot leak anything: it reads a committed inventory and fetches
 * public files.
 *
 * Resumable by design. A file already on disk at its recorded byte size is
 * skipped, so an interrupted run continues rather than starting again, and a
 * truncated file is re-fetched rather than trusted.
 *
 * Usage:
 *   MAILCHIMP_VAULT_DIR=…/she-sharp-slack-archive/mailchimp/2026-08-28-api  *     npx tsx scripts/mailchimp/fetch-assets.ts --export 2026-08-28-api [--dry-run]
 */

import "dotenv/config";
import { mkdirSync, writeFileSync, existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { argValue, resolveVaultDir } from "./vault";

/** One row of `file-manager-files.json`, narrowed to what a download needs. */
interface GalleryFile {
  id: number;
  name: string;
  type: string;
  size: number;
  full_size_url: string;
}

/** Concurrent downloads. The CDN is not the API and has no published cap; six
 * is enough to saturate a home connection without looking like a scrape. */
const MAX_CONCURRENT = 6;

/**
 * A filename that is safe on Windows and still recognisable to a human.
 *
 * The id goes first because Mailchimp's gallery allows duplicate names — the
 * same poster uploaded twice is two files with one name — and a collision here
 * would silently drop one of them.
 *
 * @param file - The gallery row.
 * @returns A collision-free filename.
 */
function safeName(file: GalleryFile): string {
  const cleaned = file.name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${file.id}-${cleaned || "untitled"}`;
}

/**
 * Downloads one file unless a complete copy is already there.
 *
 * @param file - The gallery row.
 * @param dir - The assets directory.
 * @returns What happened, for the tally.
 */
async function download(file: GalleryFile, dir: string): Promise<"skipped" | "written" | "failed"> {
  const target = join(dir, safeName(file));
  if (existsSync(target) && statSync(target).size === file.size) return "skipped";

  try {
    const res = await fetch(file.full_size_url);
    if (!res.ok) {
      console.log(`  ! ${file.id} HTTP ${res.status}`);
      return "failed";
    }
    const body = Buffer.from(await res.arrayBuffer());
    writeFileSync(target, body);
    return "written";
  } catch {
    console.log(`  ! ${file.id} network error`);
    return "failed";
  }
}

async function main(): Promise<void> {
  const exportId = argValue(process.argv, "--export");
  if (!exportId) {
    console.error("Usage: npx tsx scripts/mailchimp/fetch-assets.ts --export <exportId> [--dry-run]");
    process.exit(1);
  }
  const dryRun = process.argv.includes("--dry-run");
  const vault = resolveVaultDir(exportId);
  const inventoryPath = join(vault, "file-manager-files.json");
  if (!existsSync(inventoryPath)) {
    console.error(
      `No file-manager-files.json in ${vault}.
` +
        `  Run: npx tsx scripts/mailchimp/fetch-api.ts --export ${exportId} --include assets`
    );
    process.exit(1);
  }

  const raw: unknown = JSON.parse(readFileSync(inventoryPath, "utf8"));
  const files = (Array.isArray(raw) ? raw : []) as GalleryFile[];
  const total = files.reduce((a, f) => a + (f.size || 0), 0);
  const dir = join(vault, "assets");

  console.log(`gallery inventory: ${files.length} files, ${(total / 1024 / 1024).toFixed(1)} MB`);
  console.log(`target: ${dir}`);
  if (dryRun) {
    console.log("--dry-run: nothing downloaded.");
    return;
  }

  mkdirSync(dir, { recursive: true });
  let written = 0, skipped = 0, failed = 0, done = 0;

  const queue = [...files];
  const workers = Array.from({ length: MAX_CONCURRENT }, async () => {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      const outcome = await download(next, dir);
      if (outcome === "written") written += 1;
      else if (outcome === "skipped") skipped += 1;
      else failed += 1;
      done += 1;
      if (done % 50 === 0 || done === files.length) {
        console.log(`  ${done}/${files.length}  written ${written}  skipped ${skipped}  failed ${failed}`);
      }
    }
  });
  await Promise.all(workers);

  console.log(`written ${written}, already present ${skipped}, failed ${failed}`);
  if (failed > 0) {
    console.log("Re-run to retry the failures; complete files are skipped.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
