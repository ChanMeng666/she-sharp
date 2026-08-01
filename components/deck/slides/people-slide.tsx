import { DeckImage } from "@/components/deck/deck-image";
import type { PeopleSlide, PersonItem } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

/**
 * Target tile width per density.
 *
 * Fed to `minmax()` inside an `auto-fit` grid so the column count follows the
 * stage: roughly 8 across at `sm`, 6 at `md` and 4 at `lg` on a 16:9 stage, one
 * more on a 21:9 wall and one fewer on a 4:3 projector, with no breakpoint.
 */
/* Sized against the 1600px content column and the 32px column gap, so `sm`
   lands on 8 columns and `md` on 7 — enough for a 16-person crew or a
   13-mentor roster to sit in two rows on a 16:9 stage. A tile even 20px wider
   drops a column and adds a whole row, which is what overflows 1080. */
const TILE_WIDTH = { sm: 168, md: 196, lg: 288 } as const;

/** Portrait size per density, before the crowd-size cap is applied. */
const PORTRAIT = { sm: 156, md: 200, lg: 248 } as const;

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
 * Names only at `sm` (a wall of forty mentors), name plus organisation at `md`,
 * and the full name/role/org card at `lg` for a judging panel of four. A bio is
 * never rendered: the person is standing in the room saying it.
 */
export function PeopleSlideLayout({ slide }: { slide: PeopleSlide }) {
  const density = slide.density ?? "md";
  const shape = slide.shape ?? (density === "lg" ? "card" : "circle");
  const count = slide.people.length;

  /* A big crowd wraps to more rows, and rows are what overflow 1080. Shrink the
     portrait rather than let the last row fall off the bottom of the screen. */
  const crowdCap = count > 18 ? 132 : count > 12 ? 164 : count > 8 ? 200 : 999;
  const portrait = Math.min(PORTRAIT[density], crowdCap);

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
          className="grid"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${TILE_WIDTH[density]}px, 1fr))`,
            columnGap: "var(--deck-gap-md)",
            rowGap: "var(--deck-gap-lg)",
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
  );
}

function PersonTile({
  person,
  density,
  shape,
  portrait,
}: {
  person: PersonItem;
  density: "sm" | "md" | "lg";
  shape: "circle" | "card";
  portrait: number;
}) {
  const circle = shape === "circle";
  const frame = {
    inlineSize: portrait,
    blockSize: portrait,
    borderRadius: circle ? 999 : "var(--deck-radius)",
    overflow: "hidden" as const,
  };

  return (
    <li className="flex flex-col items-center text-center" style={{ gap: "var(--deck-gap-sm)" }}>
      {person.image ? (
        <div style={frame}>
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
        <p className={density === "lg" ? "deck-subtitle" : "deck-body"} style={{ fontWeight: 600 }}>
          {person.name}
        </p>

        {density === "lg" && person.role && (
          <p className="deck-body deck-muted">{person.role}</p>
        )}

        {density !== "sm" && person.org && (
          <p className="deck-label">{person.org}</p>
        )}
      </div>
    </li>
  );
}
