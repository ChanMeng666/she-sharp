import { DeckImage } from "@/components/deck/deck-image";
import type { PeopleSlide, PersonItem } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

import { ArchiveBand, BAND_PAD, Kicker, seedFrom } from "./archive";

type Density = "sm" | "md" | "lg";

/**
 * Target tile width per density, fed to `minmax()` inside an `auto-fit` grid.
 *
 * No breakpoints: the column count follows the stage on its own — roughly 11
 * across at `sm` on a 16:9 stage and 8 on a 4:3 projector, 7 and 5 at `md`, 5
 * and 4 at `lg`. A tile even 20px wider drops a column at 4:3 and adds a whole
 * row, and rows are what overflow 1080.
 */
const TILE_WIDTH: Record<Density, number> = { sm: 130, md: 196, lg: 262 };

/** Column gap per density; `sm` runs tighter because it carries names only. */
const TILE_GAP: Record<Density, number> = { sm: 20, md: 32, lg: 32 };

/** Portrait cap per density, before the crowd-size reduction. */
const PORTRAIT: Record<Density, number> = { sm: 148, md: 164, lg: 248 };

/**
 * Everything under a portrait, in design px at the narrow (4:3) type scale.
 *
 * Estimated rather than measured because the decision it feeds — whether this
 * slide can afford the archive band — has to be made during render, and the
 * numbers only have to be right to about a row.
 */
const CAPTION_HEIGHT: Record<Density, number> = { sm: 104, md: 120, lg: 194 };

/**
 * Content width at the narrowest stage the deck supports: 1440 less two 105px
 * safe-area insets. Every fit decision is made against this, because a layout
 * that fits at 4:3 fits everywhere.
 */
const NARROW_CONTENT = 1230;

/** Height the title block spends before the grid starts, at the narrow scale. */
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
 * WHETHER THE BAND FITS IS COMPUTED, NOT GUESSED. The archive band across the
 * foot costs 162px of an 848px safe area. At `lg` a single row of four leaves
 * that spare; a roster of sixteen at `sm` wraps to two rows on a 4:3 projector
 * and does not. So the column count is derived from the narrowest stage and the
 * band appears only when the grid genuinely clears it — which is the difference
 * between a considered omission and a slide that overflows in the one venue
 * nobody rehearsed in.
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
  const columns = Math.max(
    1,
    Math.floor((NARROW_CONTENT + gap) / (tile + gap)),
  );
  const rows = Math.ceil(count / columns);
  const gridHeight =
    rows * (portrait + CAPTION_HEIGHT[density]) + (rows - 1) * 40;
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

          <ul
            className="grid"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(${tile}px, 1fr))`,
              columnGap: gap,
              rowGap: 40,
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
      className="flex flex-col items-center text-center"
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

      <div className="flex flex-col" style={{ gap: 6 }}>
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
          <p className="deck-label deck-accent">{person.org}</p>
        )}
      </div>
    </li>
  );
}
