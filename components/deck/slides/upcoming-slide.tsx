import { DeckImage } from "@/components/deck/deck-image";
import { DeckQr } from "@/components/deck/deck-qr";
import type { UpcomingSlide } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

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
 * what it advertises between rehearsal and the night is worse than a stale one.
 */
export function UpcomingSlideLayout({ slide }: { slide: UpcomingSlide }) {
  const columns = COLUMNS[slide.events.length] ?? "grid-cols-3";

  return (
    <div className="deck-safe">
      <div
        className="deck-content flex flex-1 flex-col"
        style={{ gap: "var(--deck-gap-lg)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          {slide.eyebrow && <p className="deck-kicker">{slide.eyebrow}</p>}
          <h2 className="deck-title">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <div
          className="flex items-center"
          style={{ gap: "var(--deck-gap-xl)" }}
        >
          <ul
            className={cn("grid flex-1 items-start", columns)}
            style={{ gap: "var(--deck-gap-md)" }}
          >
            {slide.events.map((event) => (
              <li
                key={event.title}
                className="flex flex-col overflow-hidden"
                style={{
                  background: "var(--slide-surface)",
                  border: "1px solid var(--slide-hairline)",
                  borderRadius: "var(--deck-radius)",
                }}
              >
                {event.image && (
                  /* A standard aspect slot rather than the image's native
                     ratio, so three cards line up whatever the source art. */
                  <div className="deck-slot deck-slot-16x9">
                    <DeckImage image={event.image} />
                  </div>
                )}

                <div
                  className="flex flex-col"
                  style={{ gap: "var(--deck-gap-xs)", padding: "var(--deck-gap-md)" }}
                >
                  <p className="deck-label" style={{ color: "var(--slide-accent)" }}>
                    {event.time ? `${event.date} · ${event.time}` : event.date}
                  </p>

                  <p className="deck-subtitle">{event.title}</p>

                  {event.venue && <p className="deck-body deck-muted">{event.venue}</p>}

                  {event.blurb && <p className="deck-body">{event.blurb}</p>}
                </div>
              </li>
            ))}
          </ul>

          {slide.qr && <DeckQr qr={slide.qr} size={300} />}
        </div>
      </div>
    </div>
  );
}
