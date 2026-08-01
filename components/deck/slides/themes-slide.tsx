import type { ThemesSlide } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

/**
 * Column count per card count, as complete class strings so Tailwind's scanner
 * can see them.
 *
 * Count-driven rather than `auto-fit` because a leftover card on its own row is
 * the one thing that makes a themes slide look unfinished. Three columns hold on
 * a 4:3 projector — the cards get narrower, not fewer — because folding six
 * cards to two columns would push the third row off the bottom of the stage.
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
 * The hackathon challenge themes — the slide teams argue in front of.
 *
 * Shown at the briefing and then again at the start of build time, so each card
 * has to survive being read across a table rather than from a stage. One line of
 * detail per theme: the full brief lives on the event page behind the QR slide.
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
          {slide.eyebrow && <p className="deck-kicker">{slide.eyebrow}</p>}
          <h2 className="deck-title">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <ul
          className={cn("grid", columns)}
          style={{ gap: "var(--deck-gap-md)" }}
        >
          {slide.themes.map((theme, index) => (
            <li
              key={theme.title}
              className="deck-card flex flex-col"
              style={{ gap: "var(--deck-gap-sm)" }}
            >
              {theme.tag ? (
                <span
                  className="deck-label self-start"
                  style={{
                    color: "var(--slide-on-accent)",
                    background: "var(--slide-accent)",
                    borderRadius: "var(--deck-radius-sm)",
                    padding: "8px 16px",
                  }}
                >
                  {theme.tag}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="deck-title deck-accent deck-tabular"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              )}

              <p className="deck-subtitle">{theme.title}</p>

              {theme.detail && <p className="deck-body deck-muted">{theme.detail}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
