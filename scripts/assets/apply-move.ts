/**
 * Applies a plan from `plan-move.ts`. Dry-run unless told otherwise.
 *
 *   npx tsx scripts/assets/apply-move.ts --plan tmp/events.json
 *   npx tsx scripts/assets/apply-move.ts --plan tmp/events.json --apply
 *
 * Two rules that are not obvious and that the repo has been bitten by:
 *
 * Every source file is edited as TEXT. `lib/data/json/shesharp_events_v3.json`
 * in particular must never be JSON.parse'd and re-stringified — it is CRLF and
 * hand-formatted, `scripts/data/json-format.ts` cannot round-trip it, and one
 * of its image paths is the third field of a "|"-delimited string that no
 * structural rewrite would find anyway. A substring substitution touches no
 * byte outside the path, so line endings and formatting survive untouched.
 *
 * Only the site form is substituted, because the repo form contains it:
 * replacing "/img/events/x.webp" inside "public/img/events/x.webp" produces
 * exactly the repo form of the new path. Longest paths go first so a path that
 * happens to be a prefix of another cannot eat it.
 */

import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync, writeFileSync } from "fs";
import { dirname, isAbsolute, join } from "path";

import { PROTECTED_SOURCES, REPO_ROOT } from "./refs";
import type { MovePlan } from "./plan-move";

function parseArgs(argv: string[]): { plan: string; apply: boolean } {
  let plan: string | null = null;
  let apply = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--plan") {
      plan = argv[i + 1] ?? null;
      if (!plan) throw new Error("--plan needs a file path");
      i += 1;
    } else if (argv[i] === "--apply") {
      apply = true;
    } else {
      throw new Error(`unknown argument: ${argv[i]}`);
    }
  }
  if (!plan) throw new Error("--plan <file> is required");
  return { plan, apply };
}

/** Refuses to start on a plan that no longer matches the tree. */
function inspectMoves(plan: MovePlan): { pending: MovePlan["files"]; done: number; blocked: string[] } {
  const pending: MovePlan["files"] = [];
  const blocked: string[] = [];
  let done = 0;

  for (const move of plan.files) {
    const from = existsSync(join(REPO_ROOT, move.from));
    const to = existsSync(join(REPO_ROOT, move.to));
    if (from && !to) pending.push(move);
    else if (!from && to) done += 1;
    else if (!from && !to) blocked.push(`${move.from} — neither source nor destination exists`);
    else blocked.push(`${move.to} — destination already exists and the source is still there`);
  }
  return { pending, done, blocked };
}

/** `git mv`, so the rename is recorded rather than looking like a delete and an
 *  add. Arguments are passed as an array: 35 of these filenames have a space,
 *  a comma or parentheses in them. */
function gitMove(move: { from: string; to: string }): void {
  mkdirSync(dirname(join(REPO_ROOT, move.to)), { recursive: true });
  execFileSync("git", ["mv", move.from, move.to], { cwd: REPO_ROOT, stdio: "pipe" });
}

/** Removes directories the move emptied, deepest first. Never removes the root
 *  it is given, and never touches a directory that still holds anything. */
function pruneEmptyDirs(absRoot: string): string[] {
  const removed: string[] = [];
  const walk = (dir: string): boolean => {
    if (!existsSync(dir)) return true;
    let empty = true;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!walk(join(dir, entry.name))) empty = false;
      } else {
        empty = false;
      }
    }
    if (empty && dir !== absRoot) {
      rmdirSync(dir);
      removed.push(dir);
    }
    return empty;
  };
  walk(absRoot);
  return removed;
}

type Rewrite = { path: string; newPath: string };

/** Substitutes every path in one file, returning how many occurrences changed. */
function rewriteFile(relPath: string, rewrites: Rewrite[]): number {
  const abs = join(REPO_ROOT, relPath);
  const before = readFileSync(abs, "utf8");
  let text = before;
  let hits = 0;

  for (const { path, newPath } of rewrites) {
    const parts = text.split(path);
    if (parts.length === 1) continue;
    hits += parts.length - 1;
    text = parts.join(newPath);
  }

  if (text !== before) writeFileSync(abs, text, "utf8");
  return hits;
}

/**
 * Files whose image paths must survive the move verbatim.
 *
 * A test asserts a transformation: given the flat path in, it expects the
 * nested path out. Rewriting its inputs to its outputs turns every assertion
 * into `x === x` — the suite still passes, and it now proves nothing. The
 * forward check already exempts `.test.ts` sources for the same reason, so the
 * stale-looking paths left behind here are deliberate fixtures, not rot.
 *
 * Deliberately a list of exact files, not a `*.test.ts` pattern.
 * `lib/deck/deck.test.ts` also carries an `/img/events/...` path, but that one
 * is a real asset it expects to resolve on disk — exempting it would leave a
 * dangling fixture the deck suite then fails on.
 */
function isRewriteExempt(file: string): boolean {
  return PROTECTED_SOURCES.has(file);
}

/** Groups the plan's rewrites by the source file that has to change. */
function rewritesByFile(plan: MovePlan): Map<string, Rewrite[]> {
  const byFile = new Map<string, Rewrite[]>();
  for (const ref of plan.refs) {
    for (const source of ref.sources) {
      const file = source.split(":")[0];
      if (isRewriteExempt(file)) continue;
      const list = byFile.get(file) ?? [];
      if (!list.some((r) => r.path === ref.path)) list.push({ path: ref.path, newPath: ref.newPath });
      byFile.set(file, list);
    }
  }
  // Longest first: a shorter path that is a prefix of a longer one must not be
  // substituted inside it.
  for (const list of byFile.values()) list.sort((a, b) => b.path.length - a.path.length);
  return byFile;
}

function main() {
  const { plan: planPath, apply } = parseArgs(process.argv.slice(2));
  const planAbs = isAbsolute(planPath) ? planPath : join(REPO_ROOT, planPath);
  const plan = JSON.parse(readFileSync(planAbs, "utf8")) as MovePlan;
  const { pending, done, blocked } = inspectMoves(plan);
  const byFile = rewritesByFile(plan);

  console.log(`▶ plan "${planPath}" (scope ${plan.scope})`);
  console.log(`  ${pending.length} files to move${done > 0 ? `, ${done} already moved` : ""}`);
  console.log(`  ${byFile.size} source files to rewrite, ${plan.refs.length} paths in total`);

  if (blocked.length > 0) {
    console.error(`\n✗ ${blocked.length} move${blocked.length === 1 ? "" : "s"} the tree does not agree with:`);
    for (const line of blocked) console.error(`  ${line}`);
    console.error("\nRe-run plan-move.ts against the current tree.");
    process.exit(1);
  }

  if (!apply) {
    console.log("\n  (dry run — pass --apply to write)\n");
    for (const move of pending) console.log(`  mv  ${move.from}\n      → ${move.to}`);
    for (const [file, rewrites] of [...byFile.entries()].sort()) {
      console.log(`  ed  ${file} (${rewrites.length} path${rewrites.length === 1 ? "" : "s"})`);
    }
    process.exit(0);
  }

  for (const move of pending) gitMove(move);
  console.log(`\n✓ moved ${pending.length} files.`);

  let edited = 0;
  let hits = 0;
  const untouched: string[] = [];
  for (const [file, rewrites] of byFile) {
    const changed = rewriteFile(file, rewrites);
    if (changed === 0) untouched.push(file);
    else {
      edited += 1;
      hits += changed;
    }
  }
  console.log(`✓ rewrote ${hits} occurrences across ${edited} files.`);
  if (untouched.length > 0) {
    console.warn(`! ${untouched.length} planned file${untouched.length === 1 ? "" : "s"} had nothing to change:`);
    for (const file of untouched) console.warn(`  ${file}`);
  }

  const roots = new Set(plan.files.map((move) => move.from.split("/").slice(0, 3).join("/")));
  const removed: string[] = [];
  for (const root of roots) removed.push(...pruneEmptyDirs(join(REPO_ROOT, root)));
  if (removed.length > 0) console.log(`✓ removed ${removed.length} emptied directories.`);

  console.log("\nNow run: npx tsx scripts/verify-image-paths.ts");
}

main();
