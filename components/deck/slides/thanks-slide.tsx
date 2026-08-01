import { Fragment } from "react";

import { DeckImage } from "@/components/deck/deck-image";
import type { ThanksSlide } from "@/lib/deck/types";

/**
 * The thank-you.
 *
 * Held on screen while the host reads the names out, so it has to stay generous
 * rather than efficient: the partners who funded the room get their marks, and
 * the mentors and judges who gave up a Saturday get their names in full. Names
 * flow as one line of text separated by accent dots rather than sitting in a
 * table, because a table of seventeen people reads like a spreadsheet and this
 * moment is not one.
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
        className="deck-content flex min-h-0 flex-1 flex-col"
        style={{ gap: "var(--deck-gap-lg)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          {slide.eyebrow && <p className="deck-eyebrow">{slide.eyebrow}</p>}
          <h2 className="deck-display">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col justify-center"
          style={{ gap: "var(--deck-gap-md)" }}
        >
          {slide.groups.map((group, index) => (
            <div
              key={group.label ?? index}
              className="flex flex-col"
              style={{ gap: "var(--deck-gap-sm)" }}
            >
              {group.label && <p className="deck-label">{group.label}</p>}

              <ul
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(auto-fit, minmax(${chipWidth}px, 1fr))`,
                  gap: "var(--deck-gap-sm)",
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
          <p className="deck-body deck-muted" style={{ lineHeight: 1.6 }}>
            {names.map((name, index) => (
              <Fragment key={name}>
                {index > 0 && (
                  <span aria-hidden="true" style={{ color: "var(--slide-accent)" }}>
                    {"  ·  "}
                  </span>
                )}
                {name}
              </Fragment>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
