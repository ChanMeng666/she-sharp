/**
 * Every deck that exists, as plain data — slug, title, subtitle, slide count.
 *
 * GENERATED — run `npx tsx scripts/deck/sync-registry.ts` after adding,
 * removing or editing a deck. `deck.test.ts` fails when this file and the
 * registry disagree, so a stale slide count cannot reach `/slides`.
 *
 * **This file must never import a deck.** It exists so the public site can ask
 * "does this event have slides?" without loading one: a deck module runs
 * `getEventBySlug()` at module scope and carries every slide body with it, and
 * `EventSidebarPanel` — the component that asks the question — is a client
 * component, so importing `registry.ts` there would put all of it in the
 * browser bundle. Literal data costs about 200 bytes per deck instead.
 *
 * The link between a deck and its event needs no field in `events-custom.json`:
 * a deck slug IS its event slug (see `registry.ts`), and `eventSlug` records it
 * explicitly. Derived, so the two can never drift apart.
 */

export interface DeckIndexEntry {
  /** Deck slug — the deck is at `/present/<slug>`. */
  slug: string;
  /** The event this deck presents — its page is at `/events/<eventSlug>`. */
  eventSlug: string;
  title: string;
  subtitle?: string;
  /** Slides in the deck, boilerplate included. */
  slideCount: number;
}

export const DECK_INDEX: readonly DeckIndexEntry[] = [
  {
    slug: "aotearoa-ai-hackathon-festival-2026",
    eventSlug: "aotearoa-ai-hackathon-festival-2026",
    title: "Aotearoa AI Hackathon Festival 2026",
    subtitle: "AUT City Campus · 7–8 August 2026",
    slideCount: 91,
  },
  {
    slug: "event-lesmills-03-september-2026",
    eventSlug: "event-lesmills-03-september-2026",
    title: "No Pain, All Gain",
    subtitle: "Diversity and AI for Impact",
    slideCount: 25,
  },
];

/** The deck presenting this event, or `undefined` when there is none. */
export function deckForEvent(eventSlug: string): DeckIndexEntry | undefined {
  return DECK_INDEX.find((entry) => entry.eventSlug === eventSlug);
}
