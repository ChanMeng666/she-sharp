import { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { DeckArchiveCard } from "@/components/slides/deck-archive-card";
import { getEventBySlug } from "@/lib/data/events";
import { formatEventDate, parseDateString } from "@/lib/data/event-utils";
import { DECK_INDEX } from "@/lib/deck/index-meta";

export const metadata: Metadata = {
  title: "Event Slide Decks",
  alternates: { canonical: "/slides" },
  description:
    "The slides She Sharp projected at its events — every deck, from the room it was built for, kept online after the night.",
};

/**
 * The deck archive.
 *
 * Reads `DECK_INDEX`, not the deck registry: a deck module carries every slide
 * body and runs `getEventBySlug()` at module scope, and this page needs four
 * fields per deck. See `lib/deck/index-meta.ts`.
 *
 * This page is indexable; the decks it links to are `noindex` and stay out of
 * the sitemap. That pairing is fine and is the documented right way round — a
 * `Disallow` would stop a crawler ever reading the `noindex`, so the decks are
 * left crawlable and marked instead.
 */
export default function SlidesPage() {
  const decks = DECK_INDEX.map((deck) => {
    // The event may be absent: a deck outlives an event record that was
    // renamed or pulled. Fall back to the deck's own words rather than
    // dropping the deck off its archive.
    const event = getEventBySlug(deck.eventSlug);

    return {
      ...deck,
      date: event ? formatEventDate(event, "long") : undefined,
      sortKey: event ? parseDateString(event.date).getTime() : 0,
      image: event?.coverImage?.url ? event.coverImage : undefined,
      eventHref: event ? `/events/${event.slug}` : undefined,
    };
  }).sort((a, b) => b.sortKey - a.sortKey);

  return (
    <Section spacing="section" className="pt-28 pb-16 md:py-24 lg:py-32">
      <Container size="full">
        <div className="mb-8 max-w-3xl sm:mb-10 md:mb-14 lg:mb-16">
          <p className="text-label mb-4 text-brand">Archive</p>
          <h1 className="text-display-sm text-foreground">Event slide decks</h1>
          <p className="mt-4 text-base text-ink-600 md:text-lg">
            Every deck She Sharp has projected at an event, kept exactly as the
            room saw it. Open one and use the arrow keys, or press{" "}
            <kbd className="rounded border border-border px-1.5 py-0.5 text-sm">
              O
            </kbd>{" "}
            for the overview.
          </p>
        </div>

        {decks.length === 0 ? (
          <p className="text-base text-ink-600">
            No decks have been published yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:gap-6 lg:gap-8 xl:grid-cols-3">
            {decks.map((deck) => (
              <DeckArchiveCard
                key={deck.slug}
                slug={deck.slug}
                title={deck.title}
                subtitle={deck.subtitle}
                slideCount={deck.slideCount}
                date={deck.date}
                image={deck.image}
                eventHref={deck.eventHref}
              />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
