import type { AgendaSlide, TimedItem } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

/** One run-sheet row: clock time on the leading edge, six words beside it. */
function AgendaRow({
  item,
  dense,
  isLast,
  timeWidth,
}: {
  item: TimedItem;
  dense: boolean;
  isLast: boolean;
  timeWidth: number;
}) {
  const padding = dense ? 12 : 20;

  return (
    <li
      className="grid items-baseline"
      style={{
        gridTemplateColumns: `${timeWidth}px minmax(0, 1fr)`,
        columnGap: "var(--deck-gap-sm)",
        paddingBlock: padding,
        paddingInline: 20,
        marginInline: -20,
        borderBlockEnd: isLast ? "none" : "2px solid var(--slide-hairline)",
        borderRadius: item.emphasis ? "var(--deck-radius-sm)" : undefined,
        background: item.emphasis ? "var(--slide-accent)" : undefined,
        color: item.emphasis ? "var(--slide-on-accent)" : undefined,
      }}
    >
      <span
        className={cn(dense ? "deck-body" : "deck-bullet", "deck-tabular")}
        style={{
          color: item.emphasis ? "var(--slide-on-accent)" : "var(--slide-accent)",
          fontWeight: 700,
        }}
      >
        {item.time}
      </span>
      <span className={dense ? "deck-body" : "deck-bullet"}>{item.label}</span>
    </li>
  );
}

/**
 * The run sheet — the slide the room photographs.
 *
 * Left on screen during registration and again after every break, so the times
 * are the loudest thing on it and the labels are deliberately terse. The row
 * marked `emphasis` is the "you are here" moment a host points at; it gets a
 * solid accent chip rather than a colour change, because a colour change does
 * not survive a washed-out projector.
 */
export function AgendaSlideLayout({ slide }: { slide: AgendaSlide }) {
  /* Fourteen rows in one column overflows 1080 at any type size the back of the
     room can read, so a long day splits whatever the author asked for. */
  const twoColumns = slide.columns === 2 || slide.items.length > 10;
  /* Two columns halve the space a label has, so its six words start wrapping to
     a second line and every row costs 60% more height. The dense threshold is
     therefore lower when split, not higher. */
  const dense = slide.items.length > (twoColumns ? 8 : 7);
  const timeWidth = twoColumns ? 240 : 300;

  const half = Math.ceil(slide.items.length / 2);
  const columns = twoColumns
    ? [slide.items.slice(0, half), slide.items.slice(half)]
    : [slide.items];

  return (
    <div className="deck-safe">
      <div
        className="deck-content flex min-h-0 flex-1 flex-col"
        style={{ gap: "var(--deck-gap-md)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          {slide.eyebrow && <p className="deck-eyebrow">{slide.eyebrow}</p>}
          <h2 className="deck-title">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <div
          className={cn("grid min-h-0 flex-1", twoColumns ? "grid-cols-2" : "grid-cols-1")}
          style={{ columnGap: "var(--deck-gap-xl)" }}
        >
          {columns.map((items, columnIndex) => (
            <ul key={columnIndex} className="flex flex-col">
              {items.map((item, index) => (
                <AgendaRow
                  key={`${item.time}-${item.label}`}
                  item={item}
                  dense={dense}
                  isLast={index === items.length - 1}
                  timeWidth={timeWidth}
                />
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
