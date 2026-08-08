import { DeckImage } from "@/components/deck/deck-image";
import type { TeamGridSlide } from "@/lib/deck/types";

import { Kicker } from "./archive";

/**
 * Every team at once, immediately before the first of them stands up.
 *
 * A contact sheet, and deliberately so. `photo-grid` caps at five because it is
 * an editorial mosaic and a sixth frame breaks the composition; here the
 * composition IS the completeness, and the only way to get this slide wrong is
 * to leave somebody out of it. Full colour rather than the archive duotone, for
 * the same reason the single team slides are: this is a room looking at itself,
 * not the archive used as texture.
 *
 * Six across on a projector, four once the stage narrows — `gridAutoRows` keeps
 * every row the same height whichever it is, so twelve teams fall into 6×2 or
 * 4×3 without either shape needing its own rule.
 */
export function TeamGridSlideLayout({ slide }: { slide: TeamGridSlide }) {
  return (
    /* `auto minmax(0, 1fr)` on a grid, not a flex column — the same trap
       `photo-grid-slide.tsx` documents at length: `fr` rows only resolve
       against a definite block size, and a flex item's stretched height is not
       one. */
    <div
      className="deck-safe"
      style={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr)" }}
    >
      <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
        <Kicker text={slide.eyebrow} />
        <h2 className="deck-title">{slide.title}</h2>
        {slide.lead && <p className="deck-lead">{slide.lead}</p>}
      </div>

      {/* Taken out of flow and pinned, so the tracks inside have a definite
          height to resolve against. Without this the rows size to the images'
          intrinsic 1492px and the grid runs off the bottom of the stage while
          looking perfectly composed in the file. */}
      <div
        style={{
          position: "relative",
          minBlockSize: 0,
          marginBlockStart: "var(--deck-gap-md)",
        }}
      >
        <div
          className="grid grid-cols-6 @max-[1560px]/deck:grid-cols-4"
          style={{
            position: "absolute",
            inset: 0,
            gap: "var(--deck-gap-xs)",
            gridAutoRows: "minmax(0, 1fr)",
          }}
        >
          {slide.teams.map((team) => (
            <figure
              key={team.name}
              style={{
                display: "grid",
                gridTemplateRows: "minmax(0, 1fr) auto",
                gap: "calc(var(--deck-gap-xs) / 2)",
                minBlockSize: 0,
                margin: 0,
              }}
            >
              {/* `aspectRatio: auto` is load-bearing, not tidying. `.deck-slot`
                  defaults to `aspect-ratio: 16 / 10`, and a ratio WINS over a
                  definite track — the same trap `photo-grid-slide.tsx` records.
                  Left alone it crops these portrait frames to a wide letterbox
                  band and takes the tops and bottoms off the teams, which is the
                  exact failure `team-photo` exists to avoid. Cleared, the cell
                  fills its track (roughly 5:6 here) and the crop is slight.

                  `focus` is set per image by the deck: the house default crops
                  from the bottom, which on frames whose top third is ceiling
                  keeps the ceiling and loses the people. */}
              <div
                className="deck-slot"
                style={{ minBlockSize: 0, aspectRatio: "auto" }}
              >
                <DeckImage image={team.image} />
              </div>
              {/* Smaller and tighter than `.deck-label`'s 28px at 0.18em, which
                  wrapped `kpi-kaitiaki-positive-impact` onto three lines and
                  stole that cell's picture height. `minBlockSize` reserves two
                  lines for every caption so one long name cannot leave its row
                  of photographs shorter than the others. */}
              <figcaption
                className="deck-label"
                style={{
                  overflowWrap: "anywhere",
                  lineHeight: 1.2,
                  textAlign: "center",
                  fontSize: "clamp(12px, 1.05cqi, 20px)",
                  letterSpacing: "0.1em",
                  minBlockSize: "2.4em",
                }}
              >
                {team.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
