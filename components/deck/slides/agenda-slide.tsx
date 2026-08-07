import type { CSSProperties } from "react";

import type { AgendaSlide, TimedItem } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

import { ArchiveBand, BAND_PAD, Kicker, seedFrom } from "./archive";

/**
 * One run-sheet row.
 *
 * All sizing comes from `.deck-sheet-*`; the only things decided here are the
 * width of the time column and whether this is the "you are here" moment. That
 * one fills with the accent rather than merely colouring its type — a colour
 * change does not survive a washed-out projector at the back of a hall, and a
 * filled row does.
 */
function AgendaRow({
  item,
  timeWidth,
  minHeight,
}: {
  item: TimedItem;
  timeWidth: number;
  minHeight: number;
}) {
  const onAccent = item.emphasis ? { color: "var(--slide-on-accent)" } : undefined;

  return (
    <li
      className="deck-sheet-row"
      style={{
        minBlockSize: minHeight,
        ...(item.emphasis
          ? {
              background: "var(--slide-accent)",
              paddingInline: "var(--deck-gap-sm)",
              marginInline: "calc(var(--deck-gap-sm) * -1)",
            }
          : {}),
      }}
    >
      <span
        className="deck-sheet-time"
        style={{ flexBasis: timeWidth, ...onAccent }}
      >
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
 * It is left up during registration and again after every break, so it is built
 * for legibility before elegance: times loud and in the accent, labels terse,
 * one hairline between every pair of rows and nothing else on the page. The
 * archive band across the foot is the only decoration, and the safe area
 * reserves its height so the last row never lands on it.
 *
 * THE THIRTEEN-ROW CASE. A `.deck-sheet-row` is at least 78px, the rail takes
 * 88px and the title block spends about 230 more, which leaves room for seven
 * rows in one column. A longer day therefore splits into two columns whatever
 * the author asked for, and in that mode the row minimum and the time column
 * both tighten — a 4:3 stage gives each column roughly 600px, and a 250px time
 * column would push every six-word label onto a second line and put the sheet
 * back over the bottom edge it was split to avoid.
 */
export function AgendaSlideLayout({ slide }: { slide: AgendaSlide }) {
  const twoColumns = slide.columns === 2 || slide.items.length > 7;
  const seed = seedFrom(slide.id);

  const half = Math.ceil(slide.items.length / 2);
  const columns = twoColumns
    ? [slide.items.slice(0, half), slide.items.slice(half)]
    : [slide.items];

  const rows = Math.max(...columns.map((column) => column.length));

  /* The band costs 162px of a 848px safe area. A one-column sheet always has it
     to spare; a seven-row split column at 4:3 does not, and the run sheet is the
     one slide where the content wins that argument outright. */
  const showBand = !twoColumns && rows <= 6;

  return (
    <>
      {showBand && <ArchiveBand seed={seed} />}

      <div
        className="deck-safe"
        style={showBand ? { paddingBlockEnd: BAND_PAD } : undefined}
      >
        <div
          className="deck-content flex flex-1 flex-col"
          style={{ gap: "var(--deck-gap-md)" }}
        >
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
            <Kicker text={slide.eyebrow} />
            <h2 className="deck-title">{slide.title}</h2>
            {slide.lead && (
              <p className="deck-lead">{slide.lead}</p>
            )}
          </div>

          {/* The class lets `deck.css` fold this back to one column on a
              PORTRAIT stage. The split exists because a 1080-high stage fits
              only seven rows; a portrait stage is nearly twice that and has the
              room to spare, while its width does not — two columns there leave
              each label about 170px beside a 208px time, so "Problems,
              requirements & judging criteria" ran off the edge of the screen. */}
          <div
            className={cn("deck-sheet-grid grid")}
            style={
              {
                gridTemplateColumns: twoColumns
                  ? "repeat(2, minmax(0, 1fr))"
                  : "minmax(0, 1fr)",
                columnGap: "var(--deck-gap-xl)",
              } as CSSProperties
            }
          >
            {columns.map((items, columnIndex) => (
              <ul key={columnIndex} className="deck-sheet">
                {items.map((item) => (
                  <AgendaRow
                    key={`${item.time}-${item.label}`}
                    item={item}
                    timeWidth={twoColumns ? 208 : 250}
                    minHeight={twoColumns ? 68 : 78}
                  />
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
