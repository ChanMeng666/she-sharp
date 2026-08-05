/**
 * Deck registry.
 *
 * One entry per event presentation. The key is the deck slug, which matches the
 * event slug so `/present/<slug>` mirrors `/events/<slug>`.
 *
 * Kept separate from `types.ts` so the schema stays importable by scripts and
 * tests without pulling in every deck's data.
 *
 * GENERATED — run `npx tsx scripts/deck/sync-registry.ts` after adding or
 * removing a deck. `deck.test.ts` fails when this file and `decks/` disagree,
 * because a deck missing from here is a 404 that nobody sees until they are
 * standing at a projector.
 */

import type { Deck } from "./types";
import { aotearoaAiHackathonFestival2026Deck } from "./decks/aotearoa-ai-hackathon-festival-2026";
import { eventLesmills03September2026Deck } from "./decks/event-lesmills-03-september-2026";

const decks: Record<string, Deck> = {
  [aotearoaAiHackathonFestival2026Deck.slug]: aotearoaAiHackathonFestival2026Deck,
  [eventLesmills03September2026Deck.slug]: eventLesmills03September2026Deck,
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
