/**
 * Plans an asset move. Reads the repo; writes nothing but the plan file.
 *
 * The move is split into a planner and an applier on purpose. The planner is
 * the reviewable artefact — a JSON file that says exactly which 170-odd files
 * change name and which source lines change with them — and it can be read,
 * diffed and argued about while the working tree is still untouched. The
 * applier does no thinking.
 *
 * Usage:
 *   npx tsx scripts/assets/plan-move.ts --scope events
 *   npx tsx scripts/assets/plan-move.ts --scope scraped --out tmp/scraped.json
 *
 * Exits non-zero if any file in scope has no destination, because a partial
 * plan applied in full is how half a folder ends up orphaned.
 */

import { readdirSync, writeFileSync, mkdirSync } from "fs";
import { join, relative, dirname, isAbsolute } from "path";

import { collectReferences, groupByPath, REPO_ROOT } from "./refs";
import { plannedPath } from "./event-assets";

export type Scope = "events" | "scraped";

export type FileMove = { from: string; to: string };
export type RefRewrite = { path: string; newPath: string; sources: string[] };
export type Unmatched = { path: string; reason: string };

export type MovePlan = {
  scope: Scope;
  files: FileMove[];
  refs: RefRewrite[];
  unmatched: Unmatched[];
};

/** Where each scope's files live, site-relative. */
const SCOPE_ROOTS: Record<Scope, string> = {
  events: "/img/events/",
  scraped: "/img/scraped/",
};

/** Basenames that are not assets. Re-filing images leaves them where they are;
 *  renaming a whole directory takes them along. */
const NON_ASSET_FILES = new Set(["README.md", "index.ts"]);

/** Every file under a site-relative directory, as site-relative paths. */
function listUnder(siteDir: string, includeNonAssets: boolean): string[] {
  const publicDir = join(REPO_ROOT, "public");
  const root = join(publicDir, siteDir.replace(/^\//, ""));
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (includeNonAssets || !NON_ASSET_FILES.has(entry.name)) {
        out.push(`/${relative(publicDir, full).split("\\").join("/")}`);
      }
    }
  };
  walk(root);
  return out.sort((a, b) => a.localeCompare(b));
}

/**
 * The scraped rename is a literal prefix swap, not an ownership question.
 *
 * `public/img/scraped/` is the Webflow-era harvest of the previous site; the
 * name describes how the files arrived rather than what they are, and nothing
 * about the 903 files inside changes.
 */
function scrapedTarget(sitePath: string): string {
  return sitePath.replace(/^\/img\/scraped\//, "/img/legacy-site/");
}

export function buildPlan(scope: Scope): MovePlan {
  const target = scope === "events" ? plannedPath : scrapedTarget;

  const files: FileMove[] = [];
  const unmatched: Unmatched[] = [];
  const moves = new Map<string, string>();
  const claimedBy = new Map<string, string>();

  // A directory rename takes the README with it; re-filing images does not.
  for (const sitePath of listUnder(SCOPE_ROOTS[scope], scope === "scraped")) {
    const to = target(sitePath);
    if (!to) {
      unmatched.push({ path: sitePath, reason: "no event owns this file" });
      continue;
    }
    const collision = claimedBy.get(to);
    if (collision) {
      unmatched.push({ path: sitePath, reason: `would overwrite ${collision} at ${to}` });
      continue;
    }
    claimedBy.set(to, sitePath);
    moves.set(sitePath, to);
    if (to !== sitePath) {
      files.push({ from: `public${sitePath}`, to: `public${to}` });
    }
  }

  // References are grouped by path so the applier rewrites each source file
  // once; the source list is kept because it is what a reviewer reads.
  const refs: RefRewrite[] = [];
  let dangling = 0;
  for (const [path, group] of groupByPath(collectReferences())) {
    if (!path.startsWith(SCOPE_ROOTS[scope])) continue;
    const newPath = moves.get(path);
    if (!newPath) {
      dangling += 1;
      continue;
    }
    if (newPath === path) continue;
    refs.push({
      path,
      newPath,
      sources: [...new Set(group.map((ref) => ref.source))].sort((a, b) => a.localeCompare(b)),
    });
  }
  refs.sort((a, b) => a.path.localeCompare(b.path));

  if (dangling > 0) {
    console.log(
      `  note: ${dangling} referenced path${dangling === 1 ? " is" : "s are"} not on disk and will not be rewritten.`
    );
  }

  return { scope, files, refs, unmatched };
}

function parseArgs(argv: string[]): { scope: Scope; out: string | null } {
  let scope: Scope = "events";
  let out: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--scope") {
      const value = argv[i + 1];
      if (value !== "events" && value !== "scraped") {
        throw new Error(`--scope must be "events" or "scraped", got ${value ?? "nothing"}`);
      }
      scope = value;
      i += 1;
    } else if (argv[i] === "--out") {
      out = argv[i + 1] ?? null;
      if (!out) throw new Error("--out needs a file path");
      i += 1;
    } else {
      throw new Error(`unknown argument: ${argv[i]}`);
    }
  }
  return { scope, out };
}

function main() {
  const { scope, out } = parseArgs(process.argv.slice(2));
  console.log(`▶ planning scope "${scope}"`);
  const plan = buildPlan(scope);

  const sourceFiles = new Set(plan.refs.flatMap((ref) => ref.sources.map((s) => s.split(":")[0])));
  console.log(`  ${plan.files.length} files to move`);
  console.log(`  ${plan.refs.length} referenced paths to rewrite across ${sourceFiles.size} source files`);
  console.log(`  ${plan.unmatched.length} unmatched`);

  if (out) {
    const abs = isAbsolute(out) ? out : join(REPO_ROOT, out);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
    console.log(`  written to ${out}`);
  }

  if (plan.unmatched.length > 0) {
    console.error(`\n✗ ${plan.unmatched.length} file${plan.unmatched.length === 1 ? "" : "s"} with no destination:`);
    for (const entry of plan.unmatched) console.error(`  ${entry.path} — ${entry.reason}`);
    console.error("\nThe plan is incomplete; applying it would leave these behind.");
    process.exit(1);
  }

  console.log("✓ every file in scope has exactly one destination.");
  process.exit(0);
}

main();
