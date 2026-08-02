#!/usr/bin/env node
/**
 * Generate report/theme/tokens.typ from styles/tokens/colors.css.
 *
 * The website's colour system is the source of truth for the report's palette.
 * Only variables whose value is a LITERAL hex colour are emitted — the shadcn
 * semantic layer stores bare HSL triples (`312 54% 40%`), which are meaningless
 * to Typst, so those are skipped rather than mistranslated.
 *
 * Usage (from the repo root):
 *   node report/scripts/gen-tokens.mjs
 *
 * Output: report/theme/tokens.typ  (committed; DO NOT hand-edit)
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const SRC = resolve(REPO, "styles", "tokens", "colors.css");
const OUT = resolve(REPO, "report", "theme", "tokens.typ");

// Only the `:root` block. `.dark` overrides are screen-only and would collide on
// name with their light counterparts.
function rootBlock(css) {
  const start = css.indexOf(":root");
  if (start === -1) throw new Error(`No :root block in ${SRC}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`Unterminated :root block in ${SRC}`);
}

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** `--color-purple-dark` and `--ink-900` both become `purple-dark` / `ink-900`. */
function tokenName(cssVar) {
  return cssVar.replace(/^--/, "").replace(/^color-/, "");
}

function parse(css) {
  const seen = new Map();
  const decl = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = decl.exec(css)) !== null) {
    const value = m[2].trim();
    if (!HEX.test(value)) continue; // HSL triples, radii, easings — not colours we can use
    const name = tokenName(m[1]);
    if (!seen.has(name)) seen.set(name, value.toLowerCase());
  }
  return seen;
}

const tokens = parse(rootBlock(readFileSync(SRC, "utf8")));
if (tokens.size === 0) throw new Error(`Parsed 0 literal-hex colours from ${SRC}`);

// Chart series order is a design decision, not a CSS one — the CSS `--chart-N`
// vars are HSL triples and therefore invisible to the parser above. Keep this
// list in the same order as `--chart-1..5`.
const CHART = ["purple-dark", "periwinkle-dark", "blue", "mint-dark", "purple-mid"];
const missing = CHART.filter((k) => !tokens.has(k));
if (missing.length) throw new Error(`Chart palette refers to unknown tokens: ${missing.join(", ")}`);

const lines = [
  "// GENERATED — DO NOT EDIT.",
  "// Source: styles/tokens/colors.css (:root)",
  "// Regenerate with: node report/scripts/gen-tokens.mjs",
  `// Emitted: ${tokens.size} literal-hex colours. Variables stored as bare HSL`,
  "// triples (the shadcn semantic layer) are deliberately skipped.",
  "",
  "// ─── Raw palette ─────────────────────────────────────────────────────────",
];
for (const [name, hex] of tokens) lines.push(`#let raw-${name} = rgb("${hex}")`);
lines.push(
  "",
  "// ─── Chart series palette (order matters — matches --chart-1..5) ─────────",
  `#let chart-palette = (${CHART.map((k) => `raw-${k}`).join(", ")})`,
  "",
);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(`gen-tokens: wrote ${tokens.size} colours + ${CHART.length}-stop chart palette to ${OUT}`);
