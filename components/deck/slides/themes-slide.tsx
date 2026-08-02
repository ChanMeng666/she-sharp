import type { ThemesSlide } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

import { Kicker } from "./archive";

/**
 * Column count per card count, as complete class strings so Tailwind's scanner
 * can see them.
 *
 * Count-driven rather than `auto-fit` because a leftover card alone on a second
 * row is the one thing that makes a themes slide look unfinished. Three columns
 * hold on a 4:3 projector — the columns get narrower, not fewer — because
 * folding six themes to two columns pushes a third row off the bottom.
 */
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4 @max-[1560px]/deck:grid-cols-2",
  5: "grid-cols-3",
  6: "grid-cols-3",
};

/**
 * The challenge themes — the slide teams argue in front of.
 *
 * Shown at the briefing and again at the start of build time, so each column has
 * to survive being read across a table rather than only from a stage. One line
 * of detail per theme; the full brief lives on the event page behind the QR.
 *
 * NO CARDS. An earlier pass boxed each theme in a bordered panel, which is the
 * house style of every other deck ever projected and belongs to a system with
 * elevation and radii. This one is a print system: a 1px accent rule opens each
 * column, a wide-tracked numeral counts them, and the space between them does
 * the rest of the work.
 */
export function ThemesSlideLayout({ slide }: { slide: ThemesSlide }) {
  const columns = COLUMNS[slide.themes.length] ?? "grid-cols-3";

  return (
    <div className="deck-safe">
      <div
        className="deck-content flex flex-1 flex-col"
        style={{ gap: "var(--deck-gap-lg)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          <Kicker text={slide.eyebrow} />
          <h2 className="deck-title">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <ul
          className={cn("grid", columns)}
          style={{ columnGap: "var(--deck-gap-lg)", rowGap: "var(--deck-gap-lg)" }}
        >
          {slide.themes.map((theme, index) => (
            <li
              key={theme.title}
              className={cn(
                "flex flex-col",
              )}
              style={{
                gap: "var(--deck-gap-sm)",
                borderBlockStart: "1px solid var(--slide-rule)",
                paddingBlockStart: "var(--deck-gap-sm)",
              }}
            >
              {theme.tag ? (
                <span className="deck-label deck-accent self-start">{theme.tag}</span>
              ) : (
                <span
                  aria-hidden="true"
                  className="deck-label deck-accent deck-tabular"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              )}

              <p className="deck-subtitle">{theme.title}</p>

              {theme.detail && (
                <p className="deck-body deck-muted">{theme.detail}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
