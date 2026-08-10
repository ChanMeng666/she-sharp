import type { CSSProperties } from "react";

import type { PrizesSlide } from "@/lib/deck/types";
import { toneOf } from "@/lib/deck/utils";
import { buildMosaic } from "@/lib/deck/wall";
import { cn } from "@/lib/utils";

import { DeckSurface } from "@/components/deck/surfaces";
import {
  Kicker,
  knockoutStyle,
  seedFrom,
} from "./archive";

/**
 * Column count per prize count, as complete class strings for Tailwind's scanner.
 *
 * Four prizes go four across rather than two-by-two. Two-by-two was correct
 * while the figure was locked to `.deck-stat`; now that the size follows the
 * column count (see `.deck-prize-figure` in `deck.css`) the constraint has
 * flipped, because a second row of stacked figure-over-name is 190px more than
 * the stage has and a narrower figure is not.
 */
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  // One column once the stage narrows, not two. Two columns leaves three
  // prizes as a 2+1 stack — the same height as three rows but with a hole in
  // it — and the rows are laid out side-on at that width anyway, so a single
  // column is both shorter and more even.
  3: "grid-cols-3 @max-[1560px]/deck:grid-cols-1",
  4: "grid-cols-4 @max-[1560px]/deck:grid-cols-2",
};

/** Human wording for a prize's reach; the raw enum never reaches the screen. */
const SCOPE_LABEL: Record<
  NonNullable<PrizesSlide["prizes"][number]["scope"]>,
  string
> = {
  venue: "Won in this room",
  national: "National prize",
};

/** Longest amount the photo knockout stays legible at. Beyond it, solid ink. */
const KNOCKOUT_MAX_CHARS = 6;

/**
 * The reveal — and, on the wall register, the loudest page in the deck.
 *
 * Held back until the closing session, when the amounts are the reason half the
 * teams entered. The archive runs full bleed with a translucent cut starting one
 * tile row down, so the top row of faces stays at full strength above the
 * numbers: the money is on the room's own photographs, not on a black panel.
 *
 * The venue amount is cut out of the archive and the national ones are not. That
 * is the hierarchy the host is asked to speak — "say the venue prize first and
 * loudest, it is the one this room can win tomorrow" — expressed as a difference
 * in kind rather than in size, because the venue figure is the smaller number
 * and setting it larger would look like a mistake.
 */
export function PrizesSlideLayout({ slide }: { slide: PrizesSlide }) {
  const columns = COLUMNS[slide.prizes.length] ?? "grid-cols-2";
  const seed = seedFrom(slide.id);
  const onLight = toneOf(slide) === "light";
  const knockoutSrc = buildMosaic(1, seed + 3)[0];

  return (
    <>
      <DeckSurface slide={slide} seed={seed} />

      {/* Starts one tile row down and runs to the bottom edge — the inverse of
          the section divider's cut, so two dark wall slides in the same deck do
          not read as the same slide twice. */}
      <div
        className="deck-incision deck-incision-sheer deck-edge-block-start"
        style={
          {
            insetInline: 0,
            insetBlockStart: 254,
            insetBlockEnd: 0,
            "--incision-pad": "0px",
          } as CSSProperties
        }
        aria-hidden="true"
      />

      <div
        className="deck-safe"
        style={{ paddingBlockStart: "calc(166px + var(--deck-pad-y))" }}
      >
        <div
          className="deck-content flex flex-1 flex-col"
          style={{ gap: "var(--deck-gap-lg)" }}
        >
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
            <Kicker text={slide.eyebrow} />
            <h2 className="deck-title">{slide.title}</h2>
            {slide.lead && (
              <p className="deck-lead">{slide.lead}</p>
            )}
          </div>

          {/* The column count picks the figure size — see `.deck-prize-figure`
              in `deck.css`. Three `.deck-stat` amounts side by side overflow
              their tracks and land on each other, and nothing in the deck
              detects horizontal overflow. */}
          <ul
            className={cn("grid", columns)}
            data-prize-columns={slide.prizes.length}
            style={{
              columnGap: "var(--deck-gap-lg)",
              rowGap: "var(--deck-gap-lg)",
            }}
          >
            {slide.prizes.map((prize, index) => {
              const knockout =
                prize.scope === "venue" &&
                prize.amount.length <= KNOCKOUT_MAX_CHARS;

              return (
                /* Stacked while there is width for it; side by side once the
                   grid has folded to two columns. Three figures at
                   `.deck-stat` stacked over their names is 1269px of content
                   on a 4:3 stage — the slide then scaled itself to 79%, which
                   puts the scope labels under the 28px a room can read. Laying
                   the figure beside its name recovers the height without
                   touching the type. */
                <li
                  key={prize.name}
                  className={cn(
                    "flex flex-col",
                    "@max-[1560px]/deck:flex-row @max-[1560px]/deck:items-center @max-[1560px]/deck:gap-8",
                  )}
                  style={{
                    gap: 10,
                    borderBlockStart: "1px solid var(--slide-rule)",
                    paddingBlockStart: "var(--deck-gap-sm)",
                  }}
                >
                  <p
                    className={cn(
                      "deck-stat deck-tabular deck-prize-figure",
                      "@max-[1560px]/deck:order-1 @max-[1560px]/deck:shrink-0",
                      knockout && "deck-knockout",
                      knockout && onLight && "deck-knockout-ink",
                      !knockout && "deck-accent",
                    )}
                    style={knockout ? knockoutStyle(knockoutSrc, seed) : undefined}
                  >
                    {prize.amount}
                  </p>

                  <div className="flex min-w-0 flex-col @max-[1560px]/deck:order-2" style={{ gap: 6 }}>
                    {prize.scope && (
                      <span className="deck-label deck-faint">
                        {SCOPE_LABEL[prize.scope]}
                      </span>
                    )}
                    <p className="deck-subtitle">{prize.name}</p>
                    {prize.detail && (
                      <p className="deck-body deck-muted">{prize.detail}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {slide.footnote && (
            <div
              className="mt-auto flex flex-col"
              style={{ gap: "var(--deck-gap-sm)" }}
            >
              <hr className="deck-rule" />
              <p className="deck-body deck-muted">{slide.footnote}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
