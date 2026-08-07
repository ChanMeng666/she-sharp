import type { CSSProperties } from "react";

import { DeckQr } from "@/components/deck/deck-qr";
import type { QrCtaSlide } from "@/lib/deck/types";
import { toneOf } from "@/lib/deck/utils";

import {
  ArchiveBand,
  ArchiveWall,
  BAND_PAD,
  INCISION_5_ROWS,
  INCISION_5_ROWS_PAD,
  Kicker,
  SponsorMark,
  seedFrom,
} from "./archive";

/**
 * The one slide that asks the room to do something with their phones.
 *
 * Registration, the feedback form, the ambassador intake — whatever the ask is,
 * it gets a whole slide and stays up for a full minute, because a code that
 * flashes past is a code nobody scanned. The code is 340 design px inside a
 * white chip so it resolves from the back row rather than only from the front
 * three tables, and the chip is the one white rectangle the deck allows: a code
 * needs quiet-zone contrast far more than it needs to match the paper.
 *
 * Both registers appear in a single deck — the feedback ask is dark and the
 * ambassador ask is light — so this layout carries the wall as a ground on one
 * and as a foot band on the other. That is the same language transposed, which
 * is what stops the two slides four apart reading as two different decks.
 */
export function QrCtaSlideLayout({ slide }: { slide: QrCtaSlide }) {
  const points = slide.points ?? [];
  const seed = seedFrom(slide.id);
  const onDark = toneOf(slide) === "dark";

  return (
    <>
      {onDark ? (
        <>
          <ArchiveWall seed={seed} />
          <div
            className="deck-incision deck-incision-sheer deck-edge-block-end"
            style={
              {
                insetInline: 0,
                insetBlockStart: "var(--deck-rail-h)",
                blockSize: INCISION_5_ROWS,
                "--incision-pad": "0px",
              } as CSSProperties
            }
            aria-hidden="true"
          />
        </>
      ) : (
        <ArchiveBand seed={seed} />
      )}

      <div
        className="deck-safe"
        style={{
          paddingBlockEnd: onDark ? INCISION_5_ROWS_PAD : BAND_PAD,
        }}
      >
        <div
          className="deck-qr-cta deck-content grid flex-1 grid-cols-[minmax(0,1fr)_auto] items-center"
          style={{ gap: "var(--deck-gap-xl)" }}
        >
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-md)" }}>
            {/* Above the kicker rather than beside the code: the trailing column
                is a fixed 340px of QR on every stage, and a mark squeezed in
                under it competes with the one thing this slide exists to get
                scanned. */}
            {slide.logo && (
              <div className="flex">
                <SponsorMark logo={slide.logo} />
              </div>
            )}

            <Kicker text={slide.eyebrow} />

            <h2 className="deck-title">{slide.title}</h2>

            {slide.lead && (
              <p className="deck-lead">{slide.lead}</p>
            )}

            {points.length > 0 && (
              <ul
                className="flex flex-col"
                style={{
                  gap: "var(--deck-gap-sm)",
                  borderBlockStart: "1px solid var(--slide-hairline)",
                  paddingBlockStart: "var(--deck-gap-sm)",
                }}
              >
                {points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start"
                    style={{ gap: "var(--deck-gap-sm)" }}
                  >
                    <span
                      aria-hidden="true"
                      className="deck-rule deck-rule-accent"
                      style={{ flex: "0 0 44px", marginBlockStart: 24 }}
                    />
                    <span className="deck-bullet">{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Fixed-width trailing column: the code stays the same physical size
              on every stage, and the extra width of a wide screen goes to the
              copy rather than to a larger code nobody needed. */}
          <div>
            <DeckQr qr={slide.qr} size={340} />
          </div>
        </div>
      </div>
    </>
  );
}
