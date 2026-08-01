import type { PrizesSlide } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

/**
 * Column count per prize count, as complete class strings for Tailwind's scanner.
 *
 * Four prizes go two-by-two rather than four across: `.deck-stat` is 132–152
 * design px, so a fourth column would either clip "$5,000" or shrink the number
 * to the point where the reveal stops being a reveal.
 */
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3 @max-[1560px]/deck:grid-cols-2",
  4: "grid-cols-2",
};

/** Human wording for a prize's reach; the raw enum never reaches the screen. */
const SCOPE_LABEL: Record<NonNullable<PrizesSlide["prizes"][number]["scope"]>, string> =
  {
    venue: "Venue prize",
    national: "National prize",
  };

/**
 * The reveal. Usually the darkest slide in the deck.
 *
 * Held back until the closing session, when the amounts are the reason half the
 * teams entered. The figure is set in the same voice as the impact statistics
 * because it is the same kind of fact: one number, read across a room, no
 * explanation needed.
 */
export function PrizesSlideLayout({ slide }: { slide: PrizesSlide }) {
  const columns = COLUMNS[slide.prizes.length] ?? "grid-cols-2";

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
          style={{ columnGap: "var(--deck-gap-lg)", rowGap: "var(--deck-gap-lg)" }}
        >
          {slide.prizes.map((prize) => (
            <li
              key={prize.name}
              className="flex flex-col"
              style={{ gap: "var(--deck-gap-xs)" }}
            >
              {prize.scope && (
                <span
                  className="deck-label self-start"
                  style={{
                    border: "1px solid var(--slide-hairline)",
                    borderRadius: "var(--deck-radius-sm)",
                    padding: "8px 16px",
                  }}
                >
                  {SCOPE_LABEL[prize.scope]}
                </span>
              )}

              <p className="deck-stat deck-accent">{prize.amount}</p>

              <p className="deck-subtitle">{prize.name}</p>

              {prize.detail && <p className="deck-body deck-muted">{prize.detail}</p>}
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
