import type { CSSProperties } from "react";

import { DeckImage } from "@/components/deck/deck-image";
import {
  ROW_GAP,
  TILE_GAP,
  CAPTION_GAP,
  gridHeightFor,
  planPeopleGrid,
  type PeopleDensity,
} from "@/lib/deck/people-layout";
import type { PeopleSlide, PersonItem } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

import { DeckSurfaceBand } from "@/components/deck/surfaces";
import { BAND_PAD, Kicker, seedFrom } from "./archive";

type Density = PeopleDensity;

/**
 * Rough height of the title block, used for the band decision only.
 *
 * `people-layout.ts` computes the real one per stage scale, from the actual
 * title and lead. This stays a round number because the threshold below was
 * tuned against it: whether a slide can afford the archive band is a question
 * with a comfortable margin either side, and sharpening the input would move
 * the band on and off slides for no gain.
 */
const HEADER_HEIGHT = 210;

/** Two letters that read from the back of a room when a headshot is missing. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Mentors, judges, speakers and the crew — the slide that runs while they are
 * being thanked out loud.
 *
 * Names only at `sm` (a sixteen-person committee), name plus organisation at
 * `md`, and the full name/role/org card at `lg` for a judging panel of four. A
 * bio is never rendered: the person is standing in the room saying it.
 *
 * PORTRAITS KEEP THEIR COLOUR. The duotone is mandatory on the archive used as
 * mass, and these are the opposite of that — sixteen individuals, each named,
 * each being looked at. Grading a volunteer's face into brand purple to make a
 * grid match is where a design system stops serving the people in it.
 *
 * THE GRID IS A RECTANGLE, NOT A WRAP. Rows are balanced — seven people go
 * four-and-three rather than five-and-two — so the block reads as a considered
 * arrangement instead of a list that ran out of width. Every column is
 * `minmax(0, 1fr)` and every caption is clamped to its own column, because a
 * fixed track minimum is what let a long surname or a tracked organisation name
 * spill symmetrically into both gutters and land on its neighbours.
 *
 * HOW WIDE A COLUMN HAS TO BE IS A TYPESETTING QUESTION, and it is answered in
 * `lib/deck/people-layout.ts` — the widest word in any caption, measured in the
 * caption's own face, sets the pitch, and the portraits are then sized from
 * whatever height is left. Deriving the pitch from the portrait instead is what
 * broke "Tharaneetharan" across three lines on every 4:3 screen.
 *
 * WHETHER THE BAND FITS IS COMPUTED, NOT GUESSED. The archive band across the
 * foot costs 162px of an 848px safe area. At `lg` a single row of four leaves
 * that spare; a roster of sixteen at `sm` wraps to two rows on a 4:3 projector
 * and does not. The caption height is estimated from the actual strings rather
 * than assumed per density — "Head of Computer & Information Sciences" takes
 * three lines, not one, and assuming one is what put the judges' titles on top
 * of the archive band.
 */
export function PeopleSlideLayout({ slide }: { slide: PeopleSlide }) {
  const density: Density = slide.density ?? "md";
  const shape = slide.shape ?? (density === "lg" ? "card" : "circle");
  const seed = seedFrom(slide.id);
  const gap = TILE_GAP[density];

  const grid = planPeopleGrid(slide.people, density, slide.title, slide.lead);
  const gridHeight = gridHeightFor(slide.people, density, grid);
  const showBand = HEADER_HEIGHT + gridHeight <= 660;

  return (
    <>
      {showBand && <DeckSurfaceBand slide={slide} seed={seed} />}

      <div
        className="deck-safe"
        style={showBand ? { paddingBlockEnd: BAND_PAD } : undefined}
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

          {/* Two rectangles travel with the slide, and `deck.css` picks between
              them. The landscape count is derived against a 1230px content
              column; a phone has 804 and sets its captions two points LARGER,
              so the same count there gives every name a track it cannot fit.
              Both are inputs rather than answers — the custom properties are
              read by `.deck-people-grid` in the stylesheet, so the container
              query chooses between them by ordinary cascade and neither rule
              needs `!important` to beat this inline style. */}
          <ul
            className="deck-people-grid grid"
            style={{
              "--deck-people-columns": grid.columns,
              "--deck-people-columns-phone": grid.phoneColumns,
              "--deck-person-size": `${grid.portrait}px`,
              "--deck-person-size-phone": grid.phonePortrait,
              "--deck-people-last-wide": grid.lastAlone ? "1 / -1" : "auto",
              "--deck-people-last-phone": grid.phoneLastAlone ? "1 / -1" : "auto",
              columnGap: gap,
              rowGap: ROW_GAP,
            } as CSSProperties}
          >
            {slide.people.map((person) => (
              <PersonTile
                key={`${person.name}-${person.org ?? ""}`}
                person={person}
                density={density}
                shape={shape}
              />
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function PersonTile({
  person,
  density,
  shape,
}: {
  person: PersonItem;
  density: Density;
  shape: "circle" | "card";
}) {
  const circle = shape === "circle";

  /* `min(100%, cap)` rather than a fixed size: a wide stage hands the tile a
     column wider than the cap and a narrow one a column narrower, and a fixed
     portrait would either float in its column or overflow it. The cap arrives
     through a custom property so that the stylesheet can hand a phone the
     phone's own number without fighting an inline style. */
  const frame = {
    inlineSize: "min(100%, var(--deck-person))",
    aspectRatio: "1 / 1",
    borderRadius: circle ? 999 : "var(--deck-radius-sm)",
    overflow: "hidden" as const,
  };

  return (
    <li
      className="flex min-w-0 flex-col items-center text-center"
      style={{ gap: "var(--deck-gap-sm)" }}
    >
      {person.image ? (
        /* Full colour, and outside every duotone container on the slide. */
        <div className="deck-full-colour" style={frame}>
          <DeckImage
            image={{ src: person.image, alt: person.name }}
            className={cn(circle && "deck-avatar")}
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="deck-subtitle deck-accent grid place-items-center"
          style={{
            ...frame,
            background: "var(--slide-surface)",
            border: "1px solid var(--slide-hairline)",
          }}
        >
          {initialsOf(person.name)}
        </div>
      )}

      {/* Clamped to the column, and still told to break inside a word as an
          absolute last resort. The column is now sized so that no word on the
          slide needs it (see `lib/deck/people-layout.ts`); this is what happens
          if a future caption defeats that, and the alternative is worse — a
          single token wider than its track overflows symmetrically into both
          gutters and lands on the tiles either side, and nothing in the deck
          detects horizontal overflow. */}
      <div
        className="flex w-full min-w-0 flex-col"
        style={{ gap: CAPTION_GAP, overflowWrap: "anywhere", hyphens: "auto" }}
      >
        <p
          className={density === "lg" ? "deck-subtitle" : "deck-body"}
          style={{ fontWeight: 600 }}
        >
          {person.name}
        </p>

        {density === "lg" && person.role && (
          <p className="deck-body deck-muted">{person.role}</p>
        )}

        {density !== "sm" && person.org && (
          <p className="deck-label deck-person-org deck-accent">{person.org}</p>
        )}
      </div>
    </li>
  );
}
