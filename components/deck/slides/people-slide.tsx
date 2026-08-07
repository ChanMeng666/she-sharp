import { DeckImage } from "@/components/deck/deck-image";
import type { PeopleSlide, PersonItem } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

import { ArchiveBand, BAND_PAD, Kicker, seedFrom } from "./archive";

type Density = "sm" | "md" | "lg";

/**
 * Narrowest tile a person is allowed, used to derive the column count.
 *
 * Not a `minmax()` track minimum any more. `auto-fit` sized the grid off the
 * live stage, which meant fifteen team members landed eleven-across on a 16:9
 * projector and four-across underneath — ragged, and with every column at
 * 129px while the names on them were set at 30px. The count is now derived
 * once, from the narrowest stage, and the same rectangle is projected
 * everywhere.
 */
const TILE_WIDTH: Record<Density, number> = { sm: 130, md: 196, lg: 262 };

/** Column gap per density; `sm` runs tighter because it carries names only. */
const TILE_GAP: Record<Density, number> = { sm: 20, md: 32, lg: 32 };

/** Portrait cap per density, before the crowd-size reduction. */
const PORTRAIT: Record<Density, number> = { sm: 148, md: 156, lg: 248 };

/** Vertical space between rows of tiles. */
const ROW_GAP = 32;

/**
 * Content width at the narrowest stage the deck supports: 1440 less two 105px
 * safe-area insets. Every fit decision is made against this, because a layout
 * that fits at 4:3 fits everywhere.
 */
const NARROW_CONTENT = 1230;

/** Height the title block spends before the grid starts, at the narrow scale. */
const HEADER_HEIGHT = 210;

/**
 * Type metrics for the three caption lines, at the narrow (4:3) scale.
 *
 * `char` is the mean advance width as a fraction of the font size — the org
 * line is the widest of the three despite being the smallest, because
 * `.deck-label` is uppercase with 0.18em of tracking and therefore about a
 * fifth wider than it looks.
 */
const CAPTION_TYPE = {
  nameLg: { size: 38, height: 1.16, char: 0.54 },
  name: { size: 30, height: 1.4, char: 0.54 },
  role: { size: 30, height: 1.4, char: 0.51 },
  org: { size: 28, height: 1.2, char: 0.68 },
} as const;

/** Gap between the caption lines, matching the `<div>` below. */
const CAPTION_GAP = 6;

/** Lines a string takes in a column of `width`, never fewer than one. */
function linesFor(
  text: string,
  metric: { size: number; char: number },
  width: number,
): number {
  return Math.max(1, Math.ceil((text.length * metric.size * metric.char) / width));
}

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
  const count = slide.people.length;
  const seed = seedFrom(slide.id);

  /* A big crowd wraps to more rows, and rows are what overflow 1080. Shrink the
     portrait rather than let the last row fall off the bottom of the screen. */
  const crowdCap = count > 24 ? 112 : count > 16 ? 128 : 999;
  const portrait = Math.min(PORTRAIT[density], crowdCap);

  const tile = TILE_WIDTH[density];
  const gap = TILE_GAP[density];

  /* Fewest rows the narrow stage allows, then spread evenly across them. The
     second step is what turns 5+2 into 4+3. */
  const perRow = Math.min(
    count,
    Math.max(1, Math.floor((NARROW_CONTENT + gap) / (tile + gap))),
  );
  const rows = Math.max(1, Math.ceil(count / perRow));
  const columns = Math.max(1, Math.ceil(count / rows));

  const columnWidth = (NARROW_CONTENT - (columns - 1) * gap) / columns;
  const captionHeight = Math.max(
    ...slide.people.map((person) => captionHeightFor(person, density, columnWidth)),
  );
  const gridHeight = rows * (portrait + captionHeight) + (rows - 1) * ROW_GAP;
  const showBand = HEADER_HEIGHT + gridHeight <= 660;

  return (
    <>
      {showBand && <ArchiveBand seed={seed} />}

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

          {/* The class and `data-density` exist so `deck.css` can restate the
              track list on a PORTRAIT stage. The count above is derived against
              a 1230px content column, and a phone has about 800 — eight across
              there gives every caption a 90px track and breaks names one
              character to a line. It has to be `!important` in the stylesheet
              because this is an inline style, and the density has to travel as
              an attribute because a track minimum that suits name-only tiles is
              far too narrow for name-role-org ones. */}
          <ul
            className="deck-people-grid grid"
            data-density={density}
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              columnGap: gap,
              rowGap: ROW_GAP,
            }}
          >
            {slide.people.map((person) => (
              <PersonTile
                key={`${person.name}-${person.org ?? ""}`}
                person={person}
                density={density}
                shape={shape}
                portrait={portrait}
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
  portrait,
}: {
  person: PersonItem;
  density: Density;
  shape: "circle" | "card";
  portrait: number;
}) {
  const circle = shape === "circle";

  /* `min(100%, cap)` rather than a fixed size: `auto-fit` hands a wide stage
     columns wider than the cap and a narrow one columns narrower, and a fixed
     portrait would either float in its column or overflow it. */
  const frame = {
    inlineSize: `min(100%, ${portrait}px)`,
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

      {/* Clamped to the column and told to break inside a word if it has to.
          Without this a single token wider than the track — a long surname, a
          tracked organisation name — overflows symmetrically into both gutters
          and lands on the tiles either side, and nothing in the deck detects
          horizontal overflow. */}
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

/**
 * Height of one tile's caption, in design px at the narrow type scale.
 *
 * Estimated rather than measured because the decision it feeds — whether this
 * slide can afford the archive band — has to be made during render, on the
 * server. It only has to be right to about a line, but it does have to react to
 * the strings: the previous version was a per-density constant, which is
 * correct for a roster of first names and wrong by two lines for a judging
 * panel whose titles run to forty characters.
 */
function captionHeightFor(
  person: PersonItem,
  density: Density,
  columnWidth: number,
): number {
  const nameType = density === "lg" ? CAPTION_TYPE.nameLg : CAPTION_TYPE.name;
  let height = linesFor(person.name, nameType, columnWidth) * nameType.size * nameType.height;
  let blocks = 1;

  if (density === "lg" && person.role) {
    const { role } = CAPTION_TYPE;
    height += linesFor(person.role, role, columnWidth) * role.size * role.height;
    blocks += 1;
  }

  if (density !== "sm" && person.org) {
    const { org } = CAPTION_TYPE;
    height += linesFor(person.org, org, columnWidth) * org.size * org.height;
    blocks += 1;
  }

  return height + (blocks - 1) * CAPTION_GAP;
}
