import { DeckImage } from "@/components/deck/deck-image";
import { DeckQr } from "@/components/deck/deck-qr";
import type { UpcomingSlide } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

import { DeckSurfaceBand } from "@/components/deck/surfaces";
import { BAND_PAD, Kicker, seedFrom } from "./archive";

/**
 * Column count per event count, as complete class strings for Tailwind's scanner.
 *
 * Always one row. Three cards wrapping to a second row is what pushes this slide
 * off the bottom of a 4:3 stage; narrower cards on the same row do not.
 */
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

/**
 * "Come to the next one" — the retention slide.
 *
 * Runs at the end of an event, while the room is still warm and before anyone
 * has left. The dates are snapshotted at authoring time rather than fetched:
 * `getUpcomingEvents()` is relative to today, and a deck that quietly changes
 * what it advertises between the rehearsal and the night is worse than a stale
 * one.
 *
 * THE ONE-EVENT CASE IS THE COMMON CASE and it used to look like a mistake — a
 * single card stranded in the middle of a 21:9 stage. A lone event now runs as a
 * wide horizontal entry with its photograph on the leading edge, which is a
 * composition rather than a card that failed to find siblings. Two or three
 * events fall back to columns.
 *
 * Event photographs keep their colour: each one is a single frame being looked
 * at, not archive mass. The band at the foot supplies the wall instead.
 *
 * THE SINGLE ENTRY'S ARTWORK IS CONTAINED, NOT CROPPED, and it is usually a
 * poster rather than a photograph — the next event has not happened yet, so the
 * only image of it that exists is the one made to advertise it. Posters are
 * portrait, and a portrait poster cropped to a 3:2 slot loses its own headline.
 * The band gives way to it for the same reason: at 4:3 the band costs 194px of
 * a safe area that has about 340px left after the title block, which is not a
 * poster.
 */
export function UpcomingSlideLayout({ slide }: { slide: UpcomingSlide }) {
  const count = slide.events.length;
  const single = count === 1 && !slide.qr;
  const columns = COLUMNS[count] ?? "grid-cols-3";
  const seed = seedFrom(slide.id);

  /* Three columns of card plus a hairline footer is already the full page at
     4:3; one wide entry is not — unless it is carrying artwork. */
  const showBand = count <= 1 && !slide.events[0]?.image;

  return (
    <>
      {showBand && <DeckSurfaceBand slide={slide} seed={seed} />}

      <div
        className="deck-safe"
        style={showBand ? { paddingBlockEnd: BAND_PAD } : undefined}
      >
        <div
          className="deck-content flex flex-1 flex-col"
          style={{ gap: "var(--deck-gap-lg)" }}
        >
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
            <Kicker text={slide.eyebrow} />
            <h2 className="deck-title">{slide.title}</h2>
            {slide.lead && (
              <p className="deck-lead">{slide.lead}</p>
            )}
          </div>

          <div className="flex items-start" style={{ gap: "var(--deck-gap-xl)" }}>
            <ul
              className={cn("grid flex-1 items-start", columns)}
              style={{ gap: "var(--deck-gap-lg)" }}
            >
              {slide.events.map((event, index) => (
                <li
                  key={event.title}
                  className={single ? "flex items-start" : "flex flex-col"}
                  style={{
                    gap: "var(--deck-gap-lg)",
                    borderBlockStart: "1px solid var(--slide-rule)",
                    paddingBlockStart: "var(--deck-gap-sm)",
                  }}
                >
                  {event.image &&
                    (single ? (
                      /* A fixed box the artwork is fitted inside, rather than a
                         slot it is cropped to fill. Whatever the poster's
                         shape, all of it is on the projector. */
                      <div
                        className="deck-frame deck-poster deck-full-colour"
                        style={{
                          flex: "0 0 38%",
                          blockSize: 500,
                          background: "var(--slide-surface)",
                        }}
                      >
                        <DeckImage image={event.image} fit="contain" />
                      </div>
                    ) : (
                      /* Several entries: a standard aspect slot, so the cards
                         line up whatever the source art. Full colour — this is
                         a photograph of one event, not archive mass. */
                      <div className="deck-frame deck-full-colour deck-slot deck-slot-16x9">
                        <DeckImage image={event.image} />
                      </div>
                    ))}

                  <div
                    className="flex min-w-0 flex-1 flex-col"
                    style={{ gap: "var(--deck-gap-xs)" }}
                  >
                    <p className="deck-label deck-accent">
                      {event.time ? `${event.date} · ${event.time}` : event.date}
                    </p>

                    {/* `.deck-display` is 152px and only earns that when it is
                        the whole composition. Beside a poster it is a second
                        hero competing with the first, and an event title of any
                        length then wraps to four lines and runs off the stage. */}
                    <p
                      className={
                        single
                          ? event.image
                            ? "deck-title"
                            : "deck-display"
                          : "deck-subtitle"
                      }
                    >
                      {event.title}
                    </p>

                    {event.venue && (
                      <p className="deck-body deck-muted">{event.venue}</p>
                    )}

                    {event.blurb && <p className="deck-body">{event.blurb}</p>}
                  </div>
                </li>
              ))}
            </ul>

            {slide.qr && (
              <div>
                <DeckQr qr={slide.qr} size={280} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
