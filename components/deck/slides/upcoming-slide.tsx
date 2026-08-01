import { DeckImage } from "@/components/deck/deck-image";
import { DeckQr } from "@/components/deck/deck-qr";
import type { UpcomingSlide } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

import { ArchiveBand, BAND_PAD, Kicker, seedFrom } from "./archive";

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
 */
export function UpcomingSlideLayout({ slide }: { slide: UpcomingSlide }) {
  const count = slide.events.length;
  const single = count === 1 && !slide.qr;
  const columns = COLUMNS[count] ?? "grid-cols-3";
  const seed = seedFrom(slide.id);

  /* Three columns of card plus a hairline footer is already the full page at
     4:3; one wide entry is not. */
  const showBand = count <= 1;

  return (
    <>
      {showBand && <ArchiveBand seed={seed} />}

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
                  {event.image && (
                    /* A standard aspect slot rather than the image's native
                       ratio, so several entries line up whatever the source
                       art. Full colour: this is a photograph of one event. */
                    <div
                      className={cn(
                        "deck-frame deck-full-colour deck-slot",
                        single ? "deck-slot-3x2" : "deck-slot-16x9",
                      )}
                      style={single ? { flex: "0 0 42%" } : undefined}
                    >
                      <DeckImage image={event.image} />
                    </div>
                  )}

                  <div
                    className="flex min-w-0 flex-1 flex-col"
                    style={{ gap: "var(--deck-gap-xs)" }}
                  >
                    <p className="deck-label deck-accent">
                      {event.time ? `${event.date} · ${event.time}` : event.date}
                    </p>

                    <p className={single ? "deck-display" : "deck-subtitle"}>
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
