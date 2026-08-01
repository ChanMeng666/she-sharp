import { DeckQr } from "@/components/deck/deck-qr";
import type { QrCtaSlide } from "@/lib/deck/types";

/**
 * The one slide that asks the room to do something with their phones.
 *
 * Registration, the feedback form, the Discord invite — whatever the ask is, it
 * gets a whole slide and stays up for a minute, because a code that flashes past
 * is a code nobody scanned. The supporting points answer "why would I", and the
 * code is 380 design px so it resolves from the back row rather than only from
 * the front three tables.
 */
export function QrCtaSlideLayout({ slide }: { slide: QrCtaSlide }) {
  const points = slide.points ?? [];

  return (
    <div className="deck-safe">
      <div
        className="deck-content grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center"
        style={{ gap: "var(--deck-gap-xl)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-md)" }}>
          {slide.eyebrow && <p className="deck-eyebrow">{slide.eyebrow}</p>}

          <h2 className="deck-title">{slide.title}</h2>

          {slide.lead && <p className="deck-lead">{slide.lead}</p>}

          {points.length > 0 && (
            <ul className="flex flex-col" style={{ gap: "var(--deck-gap-sm)" }}>
              {points.map((point) => (
                <li
                  key={point}
                  className="flex items-start"
                  style={{ gap: "var(--deck-gap-sm)" }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      inlineSize: 44,
                      blockSize: 4,
                      marginBlockStart: 22,
                      background: "var(--slide-accent)",
                    }}
                  />
                  <span className="deck-bullet">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Fixed-width trailing column: the code stays the same physical size on
            every stage, and the extra width of a wide screen goes to the copy. */}
        <DeckQr qr={slide.qr} size={380} />
      </div>
    </div>
  );
}
