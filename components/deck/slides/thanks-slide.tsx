import { Fragment } from "react";

import { DeckImage } from "@/components/deck/deck-image";
import type { ThanksSlide } from "@/lib/deck/types";

import { Kicker } from "./archive";

/**
 * The thank-you.
 *
 * Held on screen while the host reads the names out, so it stays generous rather
 * than efficient: the partners who funded the room get their marks at full size,
 * and the mentors and judges who gave up a Saturday get their names in full.
 *
 * NAMES AS ONE FLOWING LINE, not a table. Seventeen people in a four-column grid
 * reads like a spreadsheet of attendance; the same seventeen separated by accent
 * dots reads like a list being spoken, which is exactly what is happening in the
 * room while it is up. It also costs three lines instead of five, which is what
 * lets the title stay at display scale.
 *
 * No archive band. The title is the only `.deck-display` on a light slide in the
 * deck and it needs the height; a band would take 162px this page does not have
 * once seventeen names are on it.
 */
export function ThanksSlideLayout({ slide }: { slide: ThanksSlide }) {
  const names = slide.names ?? [];
  const total = slide.groups.reduce((sum, group) => sum + group.logos.length, 0);

  /* Same trade as the sponsor wall: a long partner list shrinks the chip rather
     than losing its last row off the bottom of the stage. */
  const chipHeight = total > 18 ? 84 : total > 10 ? 104 : 124;
  const chipWidth = total > 18 ? 170 : 210;

  return (
    <div className="deck-safe">
      <div
        className="deck-content flex flex-1 flex-col"
        style={{ gap: "var(--deck-gap-md)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          <Kicker text={slide.eyebrow} />
          <h2 className="deck-display">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <div className="flex flex-col" style={{ gap: "var(--deck-gap-md)" }}>
          {slide.groups.map((group, index) => (
            <div
              key={group.label ?? index}
              className="flex flex-col"
              style={{ gap: "var(--deck-gap-sm)" }}
            >
              {group.label && (
                <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
                  <p className="deck-label deck-accent">{group.label}</p>
                  <hr className="deck-rule" />
                </div>
              )}

              <ul
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(auto-fit, minmax(${chipWidth}px, 1fr))`,
                  gap: 12,
                }}
              >
                {group.logos.map((logo) => (
                  <li
                    key={logo.name}
                    className="deck-logo-chip"
                    style={{ blockSize: chipHeight }}
                  >
                    <DeckImage
                      image={{ src: logo.logo, alt: logo.name }}
                      fit="contain"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {names.length > 0 && (
          <div
            className="mt-auto flex flex-col"
            style={{ gap: "var(--deck-gap-sm)" }}
          >
            <hr className="deck-rule deck-rule-accent" />
            <p className="deck-body" style={{ lineHeight: 1.55 }}>
              {names.map((name, index) => (
                <Fragment key={name}>
                  {index > 0 && (
                    <span aria-hidden="true" className="deck-accent">
                      {"  ·  "}
                    </span>
                  )}
                  {name}
                </Fragment>
              ))}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
