/**
 * Regenerates `lib/deck/registry.ts` from whatever is in `lib/deck/decks/`.
 *
 * Usage:
 *   npx tsx scripts/deck/sync-registry.ts
 *   npx tsx scripts/deck/sync-registry.ts --check     (exit 1 if out of date)
 *
 * Registering a deck used to be a two-line hand edit, and forgetting it was a
 * documented failure mode with a bad symptom: `/present/<slug>` returns 404 and
 * says nothing about why, usually discovered by the person setting up a
 * projector. The file has no hand-written content — an import line, a map
 * entry, three helpers — so it is generated whole rather than patched. Whole
 * generation is idempotent by construction and heals a deleted deck too, which
 * inserting a line cannot.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DECKS_DIR = join(process.cwd(), "lib", "deck", "decks");
const REGISTRY = join(process.cwd(), "lib", "deck", "registry.ts");

/** The `export const <name>: Deck` a deck file declares. */
function exportNameOf(slug: string): string {
  const source = readFileSync(join(DECKS_DIR, `${slug}.ts`), "utf8");
  const match = /export\s+const\s+(\w+)\s*:\s*Deck\b/.exec(source);
  if (!match) {
    throw new Error(
      `lib/deck/decks/${slug}.ts has no \`export const <name>: Deck\`. ` +
        "A deck file must export exactly one typed Deck.",
    );
  }
  return match[1];
}

/** Every deck slug on disk, in a stable order. */
export function deckSlugsOnDisk(): string[] {
  return readdirSync(DECKS_DIR)
    .filter((name) => name.endsWith(".ts") && !name.startsWith("_"))
    .map((name) => name.replace(/\.ts$/, ""))
    .sort();
}

/** The whole of `registry.ts`, for the given slugs. */
export function renderRegistry(slugs: string[]): string {
  const names = slugs.map((slug) => ({ slug, name: exportNameOf(slug) }));

  const imports = names
    .map(({ slug, name }) => `import { ${name} } from "./decks/${slug}";`)
    .join("\n");

  const entries = names
    .map(({ name }) => `  [${name}.slug]: ${name},`)
    .join("\n");

  return `/**
 * Deck registry.
 *
 * One entry per event presentation. The key is the deck slug, which matches the
 * event slug so \`/present/<slug>\` mirrors \`/events/<slug>\`.
 *
 * Kept separate from \`types.ts\` so the schema stays importable by scripts and
 * tests without pulling in every deck's data.
 *
 * GENERATED — run \`npx tsx scripts/deck/sync-registry.ts\` after adding or
 * removing a deck. \`deck.test.ts\` fails when this file and \`decks/\` disagree,
 * because a deck missing from here is a 404 that nobody sees until they are
 * standing at a projector.
 */

import type { Deck } from "./types";
${imports}

const decks: Record<string, Deck> = {
${entries}
};

/** Returns the deck for a slug, or \`undefined\` when there is none. */
export function getDeck(slug: string): Deck | undefined {
  return decks[slug];
}

/** All registered deck slugs, in registration order. */
export function getDeckSlugs(): string[] {
  return Object.keys(decks);
}

/** All registered decks — used by the linter and the test suite. */
export function getAllDecks(): Deck[] {
  return Object.values(decks);
}
`;
}

/** Writes the registry, returning whether anything changed. */
export function syncRegistry(): { changed: boolean; slugs: string[] } {
  const slugs = deckSlugsOnDisk();
  const next = renderRegistry(slugs);
  const current = existsSync(REGISTRY) ? readFileSync(REGISTRY, "utf8") : "";
  if (current === next) return { changed: false, slugs };

  writeFileSync(REGISTRY, next, "utf8");
  return { changed: true, slugs };
}

function main(): void {
  const check = process.argv.includes("--check");
  const slugs = deckSlugsOnDisk();
  const next = renderRegistry(slugs);
  const current = existsSync(REGISTRY) ? readFileSync(REGISTRY, "utf8") : "";

  if (check) {
    if (current === next) {
      console.log(`registry.ts is up to date (${slugs.length} deck(s)).`);
      return;
    }
    console.error(
      "registry.ts is out of date. Run: npx tsx scripts/deck/sync-registry.ts",
    );
    process.exit(1);
  }

  const { changed } = syncRegistry();
  console.log(
    changed
      ? `Wrote lib/deck/registry.ts (${slugs.length} deck(s)): ${slugs.join(", ")}`
      : `registry.ts already listed all ${slugs.length} deck(s).`,
  );
}

if (process.argv[1]?.includes("sync-registry")) main();
