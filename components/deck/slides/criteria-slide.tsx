import type { CriteriaSlide } from "@/lib/deck/types";

/**
 * The judging rubric, shown to teams before they build and to judges before
 * they score.
 *
 * Deliberately a table rather than bullets: teams read down the names to work
 * out where to spend the last hour, and a weight beside a name is the single
 * most argued-about number of the day, so it gets its own accent chip instead of
 * being buried in the description.
 */
export function CriteriaSlideLayout({ slide }: { slide: CriteriaSlide }) {
  const rowPadding = slide.criteria.length > 4 ? 20 : 28;

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

        <ul className="flex flex-col">
          {slide.criteria.map((item, index) => (
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
                borderBlockEnd:
                  index === slide.criteria.length - 1
                    ? "none"
                    : "1px solid var(--slide-hairline)",
              }}
            >
              <p className="deck-subtitle">{item.name}</p>

              <p className="deck-body deck-muted">{item.description}</p>

              {item.weight ? (
                <span
                  className="deck-label deck-tabular"
                  style={{
                    color: "var(--slide-on-accent)",
                    background: "var(--slide-accent)",
                    borderRadius: "var(--deck-radius-sm)",
                    padding: "10px 20px",
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
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-sm)" }}>
            <hr className="deck-rule" />
            <p className="deck-label">{slide.footnote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
