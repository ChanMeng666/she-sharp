import type { AgendaSlide, TimedItem } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

/**
 * One run-sheet row.
 *
 * All sizing comes from `.deck-sheet-*`; the only thing this decides is whether
 * the row is the "you are here" moment, which fills with the accent rather than
 * merely colouring the type — a colour change does not survive a washed-out
 * projector, and a filled row does.
 */
function AgendaRow({ item }: { item: TimedItem }) {
  const onAccent = item.emphasis ? { color: "var(--slide-on-accent)" } : undefined;

  return (
    <li
      className="deck-sheet-row"
      style={
        item.emphasis
          ? {
              background: "var(--slide-accent)",
              paddingInline: "var(--deck-gap-sm)",
              marginInline: "calc(var(--deck-gap-sm) * -1)",
            }
          : undefined
      }
    >
      <span className="deck-sheet-time" style={onAccent}>
        {item.time}
      </span>
      <span className="deck-sheet-item" style={onAccent}>
        {item.label}
      </span>
    </li>
  );
}

/**
 * The run sheet — the slide the room photographs.
 *
 * Left on screen during registration and again after every break, so the times
 * are the loudest thing on it and the labels are deliberately terse. A row
 * marked `emphasis` is what a host points at when they say "we are here".
 */
export function AgendaSlideLayout({ slide }: { slide: AgendaSlide }) {
  /* A `.deck-sheet-row` is at least 78px. Once the rail takes its 88px the safe
     area is 848px, the title block spends roughly 230 of it, and what is left
     holds seven rows. A long day therefore splits into two columns whatever the
     author asked for, rather than sliding off the bottom of a projector.

     Seven rather than nine is deliberately budgeted for the rail being present:
     splitting one row early costs nothing, and not splitting costs the last row
     of the run sheet on the one slide the room photographs. */
  const twoColumns = slide.columns === 2 || slide.items.length > 7;

  const half = Math.ceil(slide.items.length / 2);
  const columns = twoColumns
    ? [slide.items.slice(0, half), slide.items.slice(half)]
    : [slide.items];

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
          className={cn("grid", twoColumns ? "grid-cols-2" : "grid-cols-1")}
          style={{ columnGap: "var(--deck-gap-xl)" }}
        >
          {columns.map((items, columnIndex) => (
            <ul key={columnIndex} className="deck-sheet">
              {items.map((item) => (
                <AgendaRow key={`${item.time}-${item.label}`} item={item} />
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
