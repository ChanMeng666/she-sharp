/**
 * Apply image renames from the audit report (M0-D executor).
 *
 * Reads scripts/audit-report.json (produced by audit-event-images.ts),
 * performs copy-then-update-then-delete for each rename proposal:
 *   1. Copy old file to new path (both exist).
 *   2. Update matching references in lib/data/json/events-custom.json,
 *      scoped per event (shared files get per-event copies).
 *   3. Delete original files that are no longer referenced.
 *
 * Idempotent across runs — safe to re-run; skips files already moved.
 *
 * Usage:
 *   npx tsx scripts/apply-image-renames.ts --dry-run   (default, no changes)
 *   npx tsx scripts/apply-image-renames.ts --apply     (execute)
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { mkdirSync } from "fs";

const REPO_ROOT = process.cwd();
const REPORT_PATH = join(REPO_ROOT, "scripts", "audit-report.json");
const EVENTS_JSON_PATH = join(REPO_ROOT, "lib", "data", "json", "events-custom.json");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const DRY_RUN = !APPLY;

type RenameEntry = {
  old: string;
  new: string;
  referencingEventSlugs: string[];
  confidence: "high" | "medium" | "low";
  note?: string;
};

type AuditReport = {
  rename_map: RenameEntry[];
};

function abs(publicPath: string): string {
  return join(REPO_ROOT, "public", publicPath.replace(/^\//, ""));
}

function loadReport(): AuditReport {
  if (!existsSync(REPORT_PATH)) {
    console.error(`Missing report: ${REPORT_PATH}`);
    console.error(`Run \`npx tsx scripts/audit-event-images.ts\` first.`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(REPORT_PATH, "utf8"));
}

function copyAll(renames: RenameEntry[]): void {
  console.log(`\n[1/3] Copying ${renames.length} files (old → new)`);
  for (const r of renames) {
    const oldAbs = abs(r.old);
    const newAbs = abs(r.new);

    if (existsSync(newAbs)) {
      console.log(`  ○ skip (already exists): ${r.new}`);
      continue;
    }
    if (!existsSync(oldAbs)) {
      console.error(`  ✗ missing source: ${r.old}`);
      process.exit(1);
    }
    if (DRY_RUN) {
      console.log(`  ● would copy: ${r.old} → ${r.new}`);
    } else {
      mkdirSync(dirname(newAbs), { recursive: true });
      copyFileSync(oldAbs, newAbs);
      console.log(`  ● copied:    ${r.old} → ${r.new}`);
    }
  }
}

function updateReferences(renames: RenameEntry[]): void {
  console.log(`\n[2/3] Updating references in events-custom.json`);

  // Build lookup: "slug::oldPath" → newPath (slug-scoped so shared files split correctly)
  const lookup = new Map<string, string>();
  for (const r of renames) {
    for (const slug of r.referencingEventSlugs) {
      lookup.set(`${slug}::${r.old}`, r.new);
    }
  }

  const data = JSON.parse(readFileSync(EVENTS_JSON_PATH, "utf8"));
  let replacements = 0;

  const walk = (node: unknown, eventSlug: string): unknown => {
    if (typeof node === "string") {
      if (node.startsWith("/img/")) {
        const hit = lookup.get(`${eventSlug}::${node}`);
        if (hit && hit !== node) {
          replacements++;
          console.log(`  ● [${eventSlug}] ${node} → ${hit}`);
          return hit;
        }
      }
      return node;
    }
    if (Array.isArray(node)) return node.map(x => walk(x, eventSlug));
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        out[k] = walk(v, eventSlug);
      }
      return out;
    }
    return node;
  };

  if (Array.isArray(data.events)) {
    data.events = data.events.map((ev: { slug: string }) => walk(ev, ev.slug));
  }

  console.log(`  ${replacements} JSON references updated`);

  if (!DRY_RUN) {
    // preserve trailing newline style
    const text = JSON.stringify(data, null, 2) + "\n";
    writeFileSync(EVENTS_JSON_PATH, text, "utf8");
  }
}

function deleteOriginals(renames: RenameEntry[]): void {
  console.log(`\n[3/3] Deleting original files (now unreferenced)`);

  // Unique set of old paths to delete (shared files appear multiple times in rename_map)
  const oldPaths = new Set(renames.map(r => r.old));
  const newPaths = new Set(renames.map(r => r.new));
  let deleted = 0;

  for (const oldPath of oldPaths) {
    if (newPaths.has(oldPath)) {
      console.log(`  ○ skip (also a target): ${oldPath}`);
      continue;
    }
    const oldAbs = abs(oldPath);
    if (!existsSync(oldAbs)) {
      console.log(`  ○ already removed: ${oldPath}`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  ● would delete: ${oldPath}`);
    } else {
      unlinkSync(oldAbs);
      console.log(`  ● deleted: ${oldPath}`);
    }
    deleted++;
  }

  console.log(`  ${deleted} original files ${DRY_RUN ? "would be" : ""} deleted`);
}

function main() {
  const report = loadReport();
  const renames = report.rename_map;

  console.log("═".repeat(72));
  console.log(`  APPLY IMAGE RENAMES  ${DRY_RUN ? "(DRY RUN — pass --apply to execute)" : "(APPLYING)"}`);
  console.log("═".repeat(72));
  console.log(`  ${renames.length} rename proposals in audit-report.json`);

  copyAll(renames);
  updateReferences(renames);
  deleteOriginals(renames);

  console.log(`\n${DRY_RUN ? "Dry run complete." : "All renames applied."}`);
  if (!DRY_RUN) {
    console.log(`Now run: npx tsx scripts/verify-image-paths.ts`);
  }
}

main();
