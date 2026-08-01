/**
 * Deck registry.
 *
 * One entry per event presentation. The key is the deck slug, which matches the
 * event slug so `/present/<slug>` mirrors `/events/<slug>`.
 *
 * Kept separate from `types.ts` so the schema stays importable by scripts and
 * tests without pulling in every deck's data.
 */

import type { Deck } from "./types";
import { aotearoaAiHackathonFestival2026Deck } from "./decks/aotearoa-ai-hackathon-festival-2026";

const decks: Record<string, Deck> = {
  [aotearoaAiHackathonFestival2026Deck.slug]:
    aotearoaAiHackathonFestival2026Deck,
};

/** Returns the deck for a slug, or `undefined` when there is none. */
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
