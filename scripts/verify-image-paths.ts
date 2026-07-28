/**
 * Image path integrity verifier.
 *
 * Asserts that every image path referenced in:
 *   - lib/data/json/events-custom.json
 *   - lib/data/sponsors.ts
 *   - components/ app/ lib/ (string literals matching /img/... or /sponsors/...)
 * resolves to an existing file under `public/`.
 *
 * Exit 0 if all paths resolve; exit 1 with a report of missing paths otherwise.
 * This is the CI gate for all M0 cleanup PRs + the M1 Slack bot PR.
 *
 * Usage:
 *   npx tsx scripts/verify-image-paths.ts
 */

import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, relative, extname } from "path";

const REPO_ROOT = process.cwd();

const EVENTS_JSON_PATH = "lib/data/json/events-custom.json";
const SPONSORS_TS_PATH = "lib/data/sponsors.ts";

const GREP_DIRS = ["components", "app", "lib"];
const GREP_EXTS = new Set([".tsx", ".ts", ".jsx", ".js"]);

/** Match image paths inside string literals: "/img/..." or "/sponsors/..." */
const PATH_PATTERN = /["'`](\/(?:img\/)?(?:events|sponsors|scraped|team)\/[^"'`)\s]+?\.(?:jpg|jpeg|png|svg|webp|gif))["'`]/gi;
/** Also catch paths that start with a known public subfolder (homepage hero, etc.) */
const PUBLIC_PATH_PATTERN = /["'`](\/(?:img|sponsors)\/[^"'`)\s]+?\.(?:jpg|jpeg|png|svg|webp|gif))["'`]/gi;

type Reference = { path: string; source: string };

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  const absDir = join(REPO_ROOT, dir);
  if (!existsSync(absDir)) return out;
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const s = statSync(full);
      if (s.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(absDir);
  return out;
}

function collectFromEventsJson(refs: Reference[]): void {
  const abs = join(REPO_ROOT, EVENTS_JSON_PATH);
  const data: any = JSON.parse(readFileSync(abs, "utf8"));

  const visit = (node: unknown, path: string) => {
    if (node === null || node === undefined) return;
    if (typeof node === "string") {
      if (/^\/(img|sponsors)\/.+\.(jpg|jpeg|png|svg|webp|gif)$/i.test(node)) {
        refs.push({ path: node, source: `${EVENTS_JSON_PATH}:${path}` });
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((child, i) => visit(child, `${path}[${i}]`));
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        visit(v, path ? `${path}.${k}` : k);
      }
    }
  };
  // visit only real events — skip template (it contains placeholder paths)
  if (Array.isArray(data.events)) {
    data.events.forEach((ev: any, i: number) => visit(ev, `events[${i}]`));
  }
}

/**
 * Blanks out comment text so a path written as documentation is not treated as
 * a live reference.
 *
 * A JSDoc line like `Absolutizes a site-relative path (e.g. "/img/events/x.png")`
 * is an example, not a usage — but it looks identical to one line-at-a-time, and
 * failing the gate on it teaches people to work around the gate.
 *
 * Returns the line with comment spans replaced by spaces (column numbers stay
 * correct) and the block-comment state carried to the next line.
 */
function stripComments(line: string, inBlock: boolean): { code: string; inBlock: boolean } {
  let out = "";
  let block = inBlock;
  let quote: string | null = null;

  for (let i = 0; i < line.length; i += 1) {
    const two = line.slice(i, i + 2);

    if (block) {
      if (two === "*/") {
        block = false;
        out += "  ";
        i += 1;
      } else {
        out += " ";
      }
      continue;
    }

    const ch = line[i];

    // Inside a string literal, comment markers are just characters.
    if (quote) {
      out += ch;
      if (ch === "\\") {
        out += line[i + 1] ?? "";
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      out += ch;
      continue;
    }
    if (two === "//") return { code: out, inBlock: false };
    if (two === "/*") {
      block = true;
      out += "  ";
      i += 1;
      continue;
    }
    out += ch;
  }

  return { code: out, inBlock: block };
}

/** File types where `//` and `/* *​/` mean "comment" rather than data. */
const COMMENT_AWARE_EXTS = new Set([".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", ".css"]);

function collectFromTextFile(filePath: string, refs: Reference[]): void {
  const abs = join(REPO_ROOT, filePath);
  if (!existsSync(abs)) return;
  const text = readFileSync(abs, "utf8");
  const lines = text.split("\n");
  const patterns = [PUBLIC_PATH_PATTERN];
  const commentAware = COMMENT_AWARE_EXTS.has(extname(filePath).toLowerCase());
  let inBlock = false;

  lines.forEach((rawLine, i) => {
    let line = rawLine;
    if (commentAware) {
      const stripped = stripComments(rawLine, inBlock);
      line = stripped.code;
      inBlock = stripped.inBlock;
    }
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      for (const m of line.matchAll(pattern)) {
        refs.push({ path: m[1], source: `${filePath}:${i + 1}` });
      }
    }
  });
}

function collectFromCodeGrep(refs: Reference[]): void {
  for (const dir of GREP_DIRS) {
    for (const abs of listFilesRecursive(dir)) {
      const ext = extname(abs).toLowerCase();
      if (!GREP_EXTS.has(ext)) continue;
      const rel = relative(REPO_ROOT, abs).replace(/\\/g, "/");
      // skip the JSON (handled separately)
      if (rel.startsWith("lib/data/json/")) continue;
      collectFromTextFile(rel, refs);
    }
  }
}

function main() {
  const refs: Reference[] = [];
  collectFromEventsJson(refs);
  collectFromCodeGrep(refs);

  const missing: Array<{ path: string; sources: string[] }> = [];
  const byPath = new Map<string, string[]>();
  for (const r of refs) {
    const arr = byPath.get(r.path) ?? [];
    arr.push(r.source);
    byPath.set(r.path, arr);
  }
  for (const [p, sources] of byPath.entries()) {
    // Skip template placeholders (e.g., "/img/events/<slug>-<desc>.<ext>")
    if (p.includes("<") || p.includes(">")) continue;
    const abs = join(REPO_ROOT, "public", p.replace(/^\//, ""));
    if (!existsSync(abs)) missing.push({ path: p, sources });
  }

  console.log(`▶ Verified ${byPath.size} unique image paths referenced across ${refs.length} usages.`);

  if (missing.length === 0) {
    console.log("✓ All referenced image paths resolve to files on disk.");
    process.exit(0);
  }

  console.error(`\n✗ ${missing.length} broken image path${missing.length === 1 ? "" : "s"}:`);
  for (const m of missing.sort((a, b) => a.path.localeCompare(b.path))) {
    console.error(`  ${m.path}`);
    for (const src of m.sources) console.error(`    ← referenced in ${src}`);
  }
  console.error("\nCI gate failed. Fix broken paths (either restore the file or update the reference) before merging.");
  process.exit(1);
}

main();
