import type { StatsSlide } from "@/lib/deck/types";
import { toneOf } from "@/lib/deck/utils";
import { buildMosaic } from "@/lib/deck/wall";
import { cn } from "@/lib/utils";

import { DeckSurfaceBand } from "@/components/deck/surfaces";
import {
  Kicker,
  knockoutStyle,
  seedFrom,
} from "./archive";

/** Longest value the photo knockout stays legible at. Beyond it, solid ink. */
const KNOCKOUT_MAX_CHARS = 5;

/**
 * The credibility slide: the one figure that says how big this thing is, and
 * the three that qualify it.
 *
 * HIERARCHY, NOT FOUR EQUAL NUMBERS. Four figures at the same size are four
 * figures nobody remembers. One leads at `--dt-stat` and the rest follow at
 * `--dt-stat-minor` behind vertical hairlines, so the room takes away one number
 * and a sense that there are others.
 *
 * THE HERO FIGURE IS CUT OUT OF THE ARCHIVE. "3000+" is five characters at
 * 224px — squarely inside the constraint the knockout actually works within —
 * and filling it with a photograph of a room full of people makes the literal
 * point the number is making. The subordinate figures stay solid: at 100px the
 * counters are too small to hold a photograph, and three more knockouts would
 * destroy the hierarchy the slide exists to create.
 *
 * The archive band runs directly under the running header rather than at the
 * foot, which is the prototype's composition: evidence first, then the numbers
 * drawn from it.
 */
export function StatsSlideLayout({ slide }: { slide: StatsSlide }) {
  const [hero, ...rest] = slide.stats;
  const seed = seedFrom(slide.id);
  const onLight = toneOf(slide) === "light";

  /* The slide's supporting photograph, used as the fill of the hero figure
     rather than parked beside it as one more picture nobody looks at. Falls back
     to the tile pool so the device never depends on the author supplying one. */
  const knockoutSrc = slide.image?.src ?? buildMosaic(1, seed)[0];
  const heroKnockout =
    Boolean(hero) && hero.value.length <= KNOCKOUT_MAX_CHARS;

  return (
    <>
      <DeckSurfaceBand slide={slide} seed={seed} place="start" />

      <div
        className="deck-safe"
        style={{ paddingBlockStart: "calc(var(--deck-band-h) + var(--deck-pad-y))" }}
      >
        <div
          className="deck-content flex flex-1 flex-col"
          style={{ gap: "var(--deck-gap-md)" }}
        >
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
            <Kicker text={slide.eyebrow} />
            <h2 className="deck-title">{slide.title}</h2>
          </div>

          {hero && (
            <div
              className="flex flex-wrap items-start"
              style={{ columnGap: "var(--deck-gap-xl)", rowGap: "var(--deck-gap-md)" }}
            >
              <div className="flex flex-col" style={{ gap: 10 }}>
                <p
                  className={cn(
                    "deck-stat",
                    heroKnockout && "deck-knockout",
                    heroKnockout && onLight && "deck-knockout-ink",
                    !heroKnockout && "deck-accent",
                  )}
                  style={heroKnockout ? knockoutStyle(knockoutSrc, seed) : undefined}
                >
                  {hero.value}
                </p>
                <p className="deck-label">{hero.label}</p>
                {hero.detail && (
                  <p className="deck-body deck-muted">{hero.detail}</p>
                )}
              </div>

              {slide.lead && (
                /* The supporting sentence sits beside the hero figure, not under
                   the title: it is an aside about that number, and on its own
                   row it reads as a second heading. */
                <p
                  className="deck-lead"
                  style={{ flex: "1 1 380px", marginBlockStart: "var(--deck-gap-sm)" }}
                >
                  {slide.lead}
                </p>
              )}
            </div>
          )}

          {rest.length > 0 && (
            <div className="flex flex-col" style={{ gap: "var(--deck-gap-md)" }}>
              <hr className="deck-rule" />
              {/* auto-fit rather than a fixed column count: the subordinate
                  figures sit in one row on a 16:9 or 21:9 stage and fold to two
                  on a 4:3 projector, with no breakpoint. */}
              <ul
                className="grid"
                style={{
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
                  columnGap: "var(--deck-gap-lg)",
                  rowGap: "var(--deck-gap-md)",
                }}
              >
                {rest.map((stat, index) => (
                  <li
                    key={stat.label}
                    className="flex flex-col"
                    style={{
                      gap: 8,
                      /* A hairline between figures rather than a box around
                         each one — this deck has no cards. */
                      borderInlineStart:
                        index > 0 ? "1px solid var(--slide-hairline)" : undefined,
                      paddingInlineStart:
                        index > 0 ? "var(--deck-gap-lg)" : undefined,
                    }}
                  >
                    <p className="deck-stat-minor">{stat.value}</p>
                    <p className="deck-label">{stat.label}</p>
                    {stat.detail && (
                      <p className="deck-body deck-muted">{stat.detail}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
