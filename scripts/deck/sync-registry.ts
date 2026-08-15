/**
 * Regenerates the two derived files under `lib/deck/` from whatever is in
 * `lib/deck/decks/`: `registry.ts` and `index-meta.ts`.
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
 *
 * `index-meta.ts` is generated the same way and for a related reason: the site
 * needs to know a deck EXISTS without importing one. See the docblock this
 * script writes into that file.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DECKS_DIR = join(process.cwd(), "lib", "deck", "decks");
const REGISTRY = join(process.cwd(), "lib", "deck", "registry.ts");
const INDEX_META = join(process.cwd(), "lib", "deck", "index-meta.ts");

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

/**
 * The whole of `index-meta.ts`, built by loading every registered deck.
 *
 * Imported dynamically and only here, because this is the one place allowed to
 * pay that cost: a deck module runs `getEventBySlug()` at module scope and
 * pulls in the full events JSON plus every slide body. The generated file it
 * produces imports none of that, which is the entire point — see the docblock
 * below, which ships in the output.
 */
async function renderIndexMeta(): Promise<string> {
  const { getAllDecks } = await import("@/lib/deck/registry");

  const entries = getAllDecks()
    .map((deck) => {
      const fields = [
        `    slug: ${JSON.stringify(deck.slug)},`,
        `    eventSlug: ${JSON.stringify(deck.eventSlug ?? deck.slug)},`,
        `    title: ${JSON.stringify(deck.title)},`,
        ...(deck.subtitle === undefined
          ? []
          : [`    subtitle: ${JSON.stringify(deck.subtitle)},`]),
        `    slideCount: ${deck.slides.length},`,
      ];
      return `  {\n${fields.join("\n")}\n  },`;
    })
    .join("\n");

  return `/**
 * Every deck that exists, as plain data — slug, title, subtitle, slide count.
 *
 * GENERATED — run \`npx tsx scripts/deck/sync-registry.ts\` after adding,
 * removing or editing a deck. \`deck.test.ts\` fails when this file and the
 * registry disagree, so a stale slide count cannot reach \`/slides\`.
 *
 * **This file must never import a deck.** It exists so the public site can ask
 * "does this event have slides?" without loading one: a deck module runs
 * \`getEventBySlug()\` at module scope and carries every slide body with it, and
 * \`EventSidebarPanel\` — the component that asks the question — is a client
 * component, so importing \`registry.ts\` there would put all of it in the
 * browser bundle. Literal data costs about 200 bytes per deck instead.
 *
 * The link between a deck and its event needs no field in \`events-custom.json\`:
 * a deck slug IS its event slug (see \`registry.ts\`), and \`eventSlug\` records it
 * explicitly. Derived, so the two can never drift apart.
 */

export interface DeckIndexEntry {
  /** Deck slug — the deck is at \`/present/<slug>\`. */
  slug: string;
  /** The event this deck presents — its page is at \`/events/<eventSlug>\`. */
  eventSlug: string;
  title: string;
  subtitle?: string;
  /** Slides in the deck, boilerplate included. */
  slideCount: number;
}

export const DECK_INDEX: readonly DeckIndexEntry[] = [
${entries}
];

/** The deck presenting this event, or \`undefined\` when there is none. */
export function deckForEvent(eventSlug: string): DeckIndexEntry | undefined {
  return DECK_INDEX.find((entry) => entry.eventSlug === eventSlug);
}
`;
}

/** Writes the deck manifest, returning whether anything changed. */
export async function syncIndexMeta(): Promise<{ changed: boolean }> {
  const next = await renderIndexMeta();
  const current = existsSync(INDEX_META) ? readFileSync(INDEX_META, "utf8") : "";
  if (current === next) return { changed: false };

  writeFileSync(INDEX_META, next, "utf8");
  return { changed: true };
}

async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  const slugs = deckSlugsOnDisk();
  const nextRegistry = renderRegistry(slugs);
  const currentRegistry = existsSync(REGISTRY)
    ? readFileSync(REGISTRY, "utf8")
    : "";

  if (check) {
    const stale: string[] = [];
    if (currentRegistry !== nextRegistry) stale.push("registry.ts");

    // Only meaningful once the registry itself is current — a stale registry
    // means the manifest is being compared against the wrong set of decks, and
    // reporting both would send the reader chasing the second one first.
    if (stale.length === 0) {
      const nextMeta = await renderIndexMeta();
      const currentMeta = existsSync(INDEX_META)
        ? readFileSync(INDEX_META, "utf8")
        : "";
      if (currentMeta !== nextMeta) stale.push("index-meta.ts");
    }

    if (stale.length === 0) {
      console.log(
        `registry.ts and index-meta.ts are up to date (${slugs.length} deck(s)).`,
      );
      return;
    }
    console.error(
      `${stale.join(" and ")} out of date. Run: npx tsx scripts/deck/sync-registry.ts`,
    );
    process.exit(1);
  }

  const { changed } = syncRegistry();
  console.log(
    changed
      ? `Wrote lib/deck/registry.ts (${slugs.length} deck(s)): ${slugs.join(", ")}`
      : `registry.ts already listed all ${slugs.length} deck(s).`,
  );

  const meta = await syncIndexMeta();
  console.log(
    meta.changed
      ? `Wrote lib/deck/index-meta.ts (${slugs.length} deck(s)).`
      : `index-meta.ts already matched all ${slugs.length} deck(s).`,
  );
}

if (process.argv[1]?.includes("sync-registry")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
