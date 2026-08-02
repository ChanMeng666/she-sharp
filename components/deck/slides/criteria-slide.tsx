import type { CriteriaSlide } from "@/lib/deck/types";

import { Kicker } from "./archive";

/**
 * The judging rubric — shown to teams before they build, and again to the room
 * during pitch practice.
 *
 * Deliberately a ruled table rather than bullets: teams read down the names to
 * work out where to spend the last hour, and the weight beside a name is the
 * single most argued-about number of the day, so it gets its own chip on the
 * trailing edge instead of being buried in the description.
 *
 * THE ROW IS ONE LINE HIGH ON PURPOSE. An earlier pass set the criterion name at
 * subtitle scale above its description, which is handsomer and 130px per row.
 * Four of those plus a sixty-word footnote is 90px past the bottom edge of a 4:3
 * projector. Name and description share a baseline instead, which fits the
 * footnote — and the footnote is where the two-scorecard rule lives, which is
 * the thing teams get wrong.
 *
 * No archive band: with the footnote this slide is already using the full page,
 * and a band would be 162px it does not have.
 */
export function CriteriaSlideLayout({ slide }: { slide: CriteriaSlide }) {
  const rowPadding = slide.criteria.length > 4 ? 12 : 18;

  return (
    <div className="deck-safe">
      <div
        className="deck-content flex flex-1 flex-col"
        style={{ gap: "var(--deck-gap-md)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          <Kicker text={slide.eyebrow} />
          <h2 className="deck-title">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <ul
          className="flex flex-col"
          style={{ borderBlockStart: "1px solid var(--slide-hairline)" }}
        >
          {slide.criteria.map((item) => (
            <li
              key={item.name}
              /* Fractional name and description columns with a `max-content`
                 chip: the extra width of a 21:9 stage lands in the description,
                 and the chip never wraps at 4:3. */
              className="grid items-baseline"
              style={{
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.9fr) max-content",
                columnGap: "var(--deck-gap-lg)",
                paddingBlock: rowPadding,
                borderBlockEnd: "1px solid var(--slide-hairline)",
              }}
            >
              <p className="deck-bullet">{item.name}</p>

              <p className="deck-body deck-muted">{item.description}</p>

              {item.weight ? (
                <span
                  className="deck-label deck-tabular"
                  style={{
                    color: "var(--slide-on-accent)",
                    background: "var(--slide-accent)",
                    borderRadius: "var(--deck-radius-sm)",
                    padding: "8px 18px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.weight}
                </span>
              ) : (
                <span aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>

        {slide.footnote && (
          <div
            className="mt-auto flex flex-col"
            style={{ gap: "var(--deck-gap-sm)" }}
          >
            <hr className="deck-rule deck-rule-accent" />
            <p className="deck-body deck-muted">{slide.footnote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
