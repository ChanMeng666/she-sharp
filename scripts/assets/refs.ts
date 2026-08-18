/**
 * The single definition of "an image reference".
 *
 * Two tools need to agree on this: the CI gate (`scripts/verify-image-paths.ts`)
 * that says a path is live, and the mover (`scripts/assets/apply-move.ts`) that
 * rewrites it. If they each grew their own scanner they would drift, and the
 * failure mode is silent — the gate stays green while the mover leaves a dead
 * path behind in the one file it did not know how to read. So both import
 * `collectReferences()` from here and nothing else scans.
 *
 * Two path forms are in use and both are load-bearing:
 *
 *   site  "/img/events/x.webp"          — everything the browser resolves
 *   repo  "public/img/events/x.webp"    — report/assets/*.json, which Typst
 *                                          reads from the repo root
 *
 * `Reference.path` is always normalised to the site form so callers can compare
 * and index by it; `Reference.form` is what the source file actually contains,
 * which is what the mover has to substitute.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, relative, extname, dirname } from "path";
import { fileURLToPath } from "url";

/** Repo root, derived from this file's location rather than the cwd, so the
 *  scan is identical whether CI runs it from the root or a teammate runs it
 *  from `scripts/`. */
export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export type Reference = {
  /** Always the site form: "/img/...". */
  path: string;
  /** "file:line" for a text scan, "file:jsonPath" for the structured walk. */
  source: string;
  /** The form the source file actually spells it in. */
  form: "site" | "repo";
};

export type ScanRoot = {
  /** Repo-relative directory, or a single file for the root-level docs. */
  dir: string;
  /** Lowercase extensions, with the dot. */
  exts: string[];
};

/**
 * Everywhere an image path can hide.
 *
 * `public` with `.ts` only is not an oversight and is the entry that matters
 * most: `public/img/curated/index.ts`, `public/img/curated/archive/index.ts` and
 * `public/img/plates/index.ts` are generated manifests that live *inside* the
 * asset tree, and they are the sole reference for ~143 images. Omit `public`
 * and the reverse check declares all of them dead.
 */
export const SCAN_ROOTS: ScanRoot[] = [
  { dir: "app", exts: [".ts", ".tsx", ".js", ".jsx", ".css"] },
  { dir: "components", exts: [".ts", ".tsx", ".js", ".jsx", ".css"] },
  { dir: "lib", exts: [".ts", ".tsx", ".js", ".jsx", ".css"] },
  { dir: "hooks", exts: [".ts", ".tsx", ".js", ".jsx", ".css"] },
  { dir: "styles", exts: [".ts", ".tsx", ".js", ".jsx", ".css"] },
  { dir: "emails", exts: [".ts", ".tsx", ".js", ".jsx", ".css"] },
  { dir: "scripts", exts: [".ts", ".mts", ".mjs", ".js", ".py"] },
  { dir: "report", exts: [".json", ".typ", ".mjs", ".js"] },
  { dir: ".claude", exts: [".md", ".ts", ".json"] },
  { dir: "docs", exts: [".md"] },
  { dir: "public", exts: [".ts"] },
  { dir: "CLAUDE.md", exts: [".md"] },
  { dir: "README.md", exts: [".md"] },
];

/** Data JSON is scanned as plain text as well as walked structurally: one path
 *  in `shesharp_events_v3.json` is the third field of a "|"-delimited string,
 *  so no structural walk will ever see it as a path. */
const JSON_DATA_DIR = "lib/data/json";

/** The structured walk keeps `events[i].a.b` source labels, which are what a
 *  teammate needs to find the entry to fix. */
const EVENTS_JSON_PATH = "lib/data/json/events-custom.json";

/** Directories never worth walking: build output, caches, dependencies. */
/**
 * Files inside a scan root that git does not track.
 *
 * `collect-event-from-slack.py` is gitignored and superseded by the
 * `sync-event-from-slack` skill, so it exists on some machines and not in CI.
 * Scanning it makes the gate's answer depend on who is running it.
 */
const IGNORED_FILES = new Set(["scripts/collect-event-from-slack.py"]);

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".cache",
  ".turbo",
  ".vercel",
  "__pycache__",
  "coverage",
  "out",
]);

const EXT = String.raw`\.(?:jpe?g|png|svg|webp|gif)`;
/**
 * Either path form.
 *
 * The site branch refuses a leading slash preceded by a hostname character,
 * which is what keeps `https://www.shesharp.org.nz/img/events/june.jpg` out of
 * the corpus: an absolute URL in a newsletter test fixture is not a reference
 * to a file in `public/`, and treating it as one made eleven invented fixture
 * paths look like broken images. The same lookbehind stops the site branch
 * firing on the "/img/..." tail of a "public/img/..." match.
 */
const HEAD = String.raw`(?:(?<![\w.\-])public\/|(?<![A-Za-z0-9.\-_:])\/)(?:img|sponsors)\/`;

/**
 * Inside a string literal, where the delimiter has already bounded the text.
 *
 * Spaces, apostrophes, commas and parentheses are all legal here — 35 files
 * under `public/img/legacy-site/` have one in the name, and
 * `060_International_Woman's_Day.png` has an apostrophe inside a JSON string.
 * The match is lazy, so a `srcset` holding several paths yields each of them in
 * turn rather than one run from the first path to the last extension.
 */
const IN_STRING = new RegExp(String.raw`${HEAD}[^\n<>]+?${EXT}`, "gi");

/**
 * Outside a string literal: prose, a markdown bullet, a bare value.
 *
 * Spaces are NOT allowed here. A sentence like "files in /img/events/ are named
 * cover.webp" would otherwise read as one long filename, and the gate would
 * fail on documentation. Names containing spaces are only ever seen quoted.
 */
const IN_PROSE = new RegExp(String.raw`${HEAD}[^"'\`\s)\]}<>|]+?${EXT}`, "gi");

/** String delimiters, per file type. Markdown has no string literals, but a
 *  backtick code span plays the same role and is where a path with a space in
 *  it gets written. */
const QUOTES_CODE = new Set(['"', "'", "`"]);
const QUOTES_JSON = new Set(['"']);
const QUOTES_MARKDOWN = new Set(["`"]);

function quoteCharsFor(ext: string): Set<string> {
  if (ext === ".json") return QUOTES_JSON;
  if (ext === ".md") return QUOTES_MARKDOWN;
  if (ext === ".typ") return QUOTES_JSON;
  return QUOTES_CODE;
}

type Segment = { text: string; quoted: boolean };

/**
 * Splits a line into quoted and unquoted stretches.
 *
 * The point is not to parse the language — it is to know when a space may be
 * part of a filename (a delimiter will end the path) and when it may not.
 * An unterminated quote is treated as running to end of line, which is the
 * conservative reading: it can only make the scan more permissive on one line.
 */
function splitQuoted(line: string, quotes: Set<string>): Segment[] {
  const segments: Segment[] = [];
  let plain = "";
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (!quotes.has(ch)) {
      plain += ch;
      continue;
    }
    if (plain) segments.push({ text: plain, quoted: false });
    plain = "";
    let body = "";
    let j = i + 1;
    for (; j < line.length; j += 1) {
      if (line[j] === "\\" && quotes.has(line[j + 1] ?? "")) {
        body += line[j + 1];
        j += 1;
        continue;
      }
      if (line[j] === ch) break;
      body += line[j];
    }
    segments.push({ text: body, quoted: true });
    i = j;
  }
  if (plain) segments.push({ text: plain, quoted: false });
  return segments;
}

/** A path a human wrote as an example, not as a usage. */
function isPlaceholder(path: string): boolean {
  return path.includes("<") || path.includes(">") || path.includes("${");
}

/** Site-form normalisation: "public/img/x" and "/img/x" index to the same key. */
export function toSitePath(raw: string): string {
  return raw.startsWith("public/") ? raw.slice("public".length) : raw;
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
export function stripComments(line: string, inBlock: boolean): { code: string; inBlock: boolean } {
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

/** Python's comment marker, with the same "not inside a string" caveat. */
function stripHashComments(line: string): string {
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
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
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === "#") return out;
    out += ch;
  }
  return out;
}

/** File types where `//` and a block comment mean "comment" rather than data.
 *  Markdown and JSON are deliberately absent: `//` is ordinary text in one and
 *  illegal in the other, and stripping it would blank real references. */
const SLASH_COMMENT_EXTS = new Set([".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", ".css", ".typ"]);
const HASH_COMMENT_EXTS = new Set([".py"]);

/** Every file under `dir` whose extension is in `exts`, repo-relative, POSIX. */
export function listFiles(root: ScanRoot): string[] {
  const abs = join(REPO_ROOT, root.dir);
  if (!existsSync(abs)) return [];
  const exts = new Set(root.exts.map((e) => e.toLowerCase()));
  const out: string[] = [];

  const consider = (full: string) => {
    if (!exts.has(extname(full).toLowerCase())) return;
    const rel = relative(REPO_ROOT, full).replace(/\\/g, "/");
    if (IGNORED_FILES.has(rel)) return;
    out.push(rel);
  };

  if (statSync(abs).isFile()) {
    consider(abs);
    return out;
  }

  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(join(current, entry.name));
      } else {
        consider(join(current, entry.name));
      }
    }
  };
  walk(abs);
  return out;
}

/** Scans one text file, honouring its comment syntax. Duplicate hits on the
 *  same line (the quoted and bare patterns overlap whenever a name has no
 *  space) collapse to one reference. */
function collectFromTextFile(filePath: string, refs: Reference[]): void {
  const abs = join(REPO_ROOT, filePath);
  if (!existsSync(abs)) return;
  const ext = extname(filePath).toLowerCase();
  const slashComments = SLASH_COMMENT_EXTS.has(ext);
  const hashComments = HASH_COMMENT_EXTS.has(ext);
  const quotes = quoteCharsFor(ext);
  let inBlock = false;

  readFileSync(abs, "utf8").split("\n").forEach((rawLine, i) => {
    let line = rawLine;
    if (slashComments) {
      const stripped = stripComments(rawLine, inBlock);
      line = stripped.code;
      inBlock = stripped.inBlock;
    } else if (hashComments) {
      line = stripHashComments(rawLine);
    }

    const source = `${filePath}:${i + 1}`;
    const seen = new Set<string>();
    const take = (raw: string) => {
      if (isPlaceholder(raw)) return;
      const form: Reference["form"] = raw.startsWith("public/") ? "repo" : "site";
      const path = toSitePath(raw);
      const key = `${form} ${path}`;
      if (seen.has(key)) return;
      seen.add(key);
      refs.push({ path, source, form });
    };

    for (const segment of splitQuoted(line, quotes)) {
      const pattern = segment.quoted ? IN_STRING : IN_PROSE;
      pattern.lastIndex = 0;
      for (const m of segment.text.matchAll(pattern)) take(m[0]);
    }
  });
}

/**
 * Walks `events-custom.json` structurally so a broken path reports as
 * `events[12].detailPageData.gallery[3]` rather than a line number nobody can
 * map back to an event. The `template` block is skipped on purpose: it holds
 * `<slug>`-style placeholders that are documentation, not references.
 */
function collectFromEventsJson(refs: Reference[]): void {
  const abs = join(REPO_ROOT, EVENTS_JSON_PATH);
  if (!existsSync(abs)) return;
  const data = JSON.parse(readFileSync(abs, "utf8")) as { events?: unknown[] };

  const visit = (node: unknown, path: string) => {
    if (node === null || node === undefined) return;
    if (typeof node === "string") {
      if (/^\/(?:img|sponsors)\/.+\.(?:jpe?g|png|svg|webp|gif)$/i.test(node) && !isPlaceholder(node)) {
        refs.push({ path: node, source: `${EVENTS_JSON_PATH}:${path}`, form: "site" });
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

  if (Array.isArray(data.events)) {
    data.events.forEach((ev, i) => visit(ev, `events[${i}]`));
  }
}

/** Every image reference in the repo, from every place one can be written. */
export function collectReferences(): Reference[] {
  const refs: Reference[] = [];

  collectFromEventsJson(refs);

  for (const root of SCAN_ROOTS) {
    for (const file of listFiles(root)) collectFromTextFile(file, refs);
  }

  // The data JSON is not in SCAN_ROOTS (the `lib` root takes code extensions
  // only) and needs a plain-text pass: `shesharp_events_v3.json` hides one path
  // as the third field of a "|"-delimited string, which no structural walk can
  // see as a path. `events-custom.json` is excluded because the walk above
  // already covers it and, unlike a text pass, knows to skip the `template`
  // block of `<slug>`-style examples.
  for (const file of listFiles({ dir: JSON_DATA_DIR, exts: [".json"] })) {
    if (file === EVENTS_JSON_PATH) continue;
    collectFromTextFile(file, refs);
  }

  return refs;
}

/**
 * Files that name image paths in order to reason about them, not to use them.
 *
 * Both are inside a scan root and both would otherwise prove themselves right:
 * the gate's own allow-list of unreferenced files would make every file in it
 * referenced, and the ownership test naming a flat filename would make that
 * file look used by the site. Nothing renders either one.
 *
 * This is about the reverse check only. The mover still rewrites the gate (its
 * allow-list has to follow the files it names); whether a file may be rewritten
 * is a separate question, answered by PROTECTED_SOURCES just below.
 */
export const NON_USE_SOURCES: ReadonlySet<string> = new Set([
  "scripts/verify-image-paths.ts",
  "scripts/assets/event-assets.test.ts",
]);

/** True when a `file:line` source label points at one of NON_USE_SOURCES. */
export function isNonUseSource(source: string): boolean {
  return NON_USE_SOURCES.has(source.split(":")[0]);
}

/**
 * Files whose image paths must survive the move unchanged.
 *
 * `event-assets.test.ts` asserts that a flat filename resolves to an event:
 * rewriting its inputs into the nested form it is asserting turns every one of
 * those cases into `x === x`. The test would still pass, and would no longer
 * test anything — which is worse than failing, because the next person to
 * change `resolveOwner()` would trust it.
 */
export const PROTECTED_SOURCES = new Set(["scripts/assets/event-assets.test.ts"]);

/** True when a `file:line` source label points at one of PROTECTED_SOURCES. */
export function isProtectedSource(source: string): boolean {
  return PROTECTED_SOURCES.has(source.split(":")[0]);
}

/** Groups references by site path, preserving source order. */
export function groupByPath(refs: Reference[]): Map<string, Reference[]> {
  const byPath = new Map<string, Reference[]>();
  for (const ref of refs) {
    const arr = byPath.get(ref.path);
    if (arr) arr.push(ref);
    else byPath.set(ref.path, [ref]);
  }
  return byPath;
}
