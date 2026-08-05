/**
 * Archive primitives shared by the slide layouts — THE WALL.
 *
 * Not a layout. `slide-renderer.tsx` never imports this file; it exists so the
 * wall, the band and the photo-knockout fill are built the same way on every
 * slide that reaches for them, instead of eight near-identical copies drifting
 * apart the first time the tile pitch is retuned.
 *
 * Everything here is GEOMETRY AND MARKUP only. The purple duotone grade, the
 * tile ratios, the drift and the knockout's four background layers are all in
 * `styles/components/deck.css`; nothing in this file sets a colour, a font size
 * or a hairline.
 */

import type { CSSProperties, ReactNode } from "react";

import { DeckImage } from "@/components/deck/deck-image";
import { buildWallBand, buildWallRows } from "@/lib/deck/wall";
import { cn } from "@/lib/utils";

/**
 * Where an opaque panel stops and the archive keeps going, on the title and
 * feature slides.
 *
 * A fixed 620px of exposed wall (the prototype's number at a 1920 stage) leaves
 * a 4:3 projector 820px for a 116px headline, which is one word per line. A
 * fixed percentage does the opposite and hands a 21:9 wall a 700px column of
 * type floating in the middle of nothing. The clamp keeps the exposed strip
 * between roughly two and three tiles at every stage width: 547px at 1440,
 * 660px at 1920, 706px at 2520.
 */
export const PANEL_SPLIT = "clamp(62%, 100% - 660px, 72%)";

/** Padding that pushes a safe area's content inside `PANEL_SPLIT`. */
export const PANEL_SAFE_PAD = `calc(100% - ${PANEL_SPLIT} + var(--deck-pad-x))`;

/**
 * Height of a sheer incision that stops on a tile edge.
 *
 * Five rows of 166px pitch less the trailing gap. Below it the last row of the
 * wall runs at full strength, which is what stops a section divider reading as
 * a scrim laid over a photograph rather than as a panel cut into one.
 */
export const INCISION_5_ROWS = 826;

/** Bottom padding that keeps safe-area content clear of that last full row. */
export const INCISION_5_ROWS_PAD = "calc(166px + var(--deck-pad-y))";

/** Bottom padding that keeps safe-area content clear of a foot band. */
export const BAND_PAD = "calc(var(--deck-band-h) + var(--deck-gap-md))";

/**
 * A stable per-slide seed derived from its id.
 *
 * Layouts are handed a slide and nothing else — no index — so the walk through
 * the tile pool has to come from the slide itself. It must also be a pure
 * function of the id and never `Math.random()`: slides are server-rendered and
 * then hydrated, and a wall whose `src` list differs between the two is a
 * hydration mismatch on every tile at once.
 */
export function seedFrom(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100_000;
  }
  return hash;
}

function WallRowTiles({
  tiles,
  seconds,
  reverse,
}: {
  tiles: string[];
  seconds: number;
  reverse: boolean;
}) {
  return (
    <div
      className={cn("deck-wall-row", reverse && "deck-wall-row-reverse")}
      style={{ "--wall-seconds": `${seconds}s` } as CSSProperties}
    >
      {tiles.map((src, index) => (
        <span key={`${src}-${index}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" decoding="async" loading="lazy" draggable={false} />
        </span>
      ))}
    </div>
  );
}

/**
 * The full-bleed archive wall: the ground of every dark slide that carries one.
 *
 * Six rows on a 166px pitch starting below the running header fill the stage
 * exactly, so the bottom edge never slices a tile.
 */
export function ArchiveWall({ seed }: { seed: number }) {
  const rows = buildWallRows({ seed });

  return (
    <div
      className="deck-wall deck-duotone deck-duotone-ground"
      aria-hidden="true"
    >
      <div className="deck-wall-rows">
        {rows.map((row, index) => (
          <WallRowTiles
            key={index}
            tiles={row.tiles}
            seconds={row.seconds}
            reverse={row.reverse}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The wall reduced to one full-bleed row — how the archive survives on paper.
 *
 * A light slide is the same language transposed, not a different design, and
 * this strip is what carries the family resemblance. It is placed at the foot
 * by default; the slide reserves `BAND_PAD` for it so type never lands on it.
 */
export function ArchiveBand({
  seed,
  place = "end",
}: {
  seed: number;
  /** `end` sits on the bottom edge, `start` directly under the header. */
  place?: "start" | "end";
}) {
  const row = buildWallBand(seed);

  return (
    <div
      className={cn(
        "deck-band deck-wall-flush deck-duotone deck-duotone-flat",
        place === "end" ? "deck-edge-block-start" : "deck-edge-block-end",
      )}
      style={
        place === "end"
          ? { insetBlockEnd: 0 }
          : { insetBlockStart: "var(--deck-rail-h)" }
      }
      aria-hidden="true"
    >
      <div className="deck-wall-rows">
        <WallRowTiles
          tiles={row.tiles}
          seconds={row.seconds}
          reverse={row.reverse}
        />
      </div>
    </div>
  );
}

/**
 * Custom properties that fill display glyphs with an archive photograph.
 *
 * The default background size in the stylesheet assumes a wide pre-composed
 * mosaic. What a layout actually has to hand is one archive frame, so the size
 * is restated at the archive's dominant 3:2 and the position is walked by the
 * seed — otherwise every knockout in the deck shows the same corner of the same
 * photograph.
 *
 * Callers still owe the constraint the stylesheet cannot enforce: numerals and
 * words of about five characters, at `--dt-stat` or larger, and nothing else.
 */
export function knockoutStyle(src: string | undefined, seed: number): CSSProperties {
  if (!src) return {};
  return {
    "--deck-knockout-src": `url("${src}")`,
    "--deck-knockout-size": "1620px 1080px",
    "--deck-knockout-pos": `${-(seed % 7) * 160}px ${-(seed % 4) * 130}px`,
  } as CSSProperties;
}

/**
 * The kicker: the one line that names THIS page.
 *
 * Every slide carries one. It is what stops thirty-eight slides of the same
 * furniture reading as a template, so it is a component rather than a
 * convention — a layout that forgets it is a layout that looks generic, and
 * that failure is invisible until the deck is on a projector.
 */
export function Kicker({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="deck-kicker">{text}</p>;
}

/**
 * The mark of the organisation whose problem a slide is presenting.
 *
 * Added 5 Aug 2026 for the hackathon's featured problems, where the sponsor was
 * named only in the kicker — a line the room reads once and forgets. A team
 * choosing which problem to spend a weekend on is partly choosing whose problem
 * it is, so the mark belongs on the slide that asks them to choose.
 *
 * It is NOT the sponsors slide in miniature: exactly one mark, on the trailing
 * edge of the header, on the white chip every logo in this deck sits on. The
 * chip is what makes a multi-colour SVG survive both tones without filtering.
 * Hidden on narrow stages for the same reason the supporting photograph is —
 * a 4:3 projector needs the whole content column for the type.
 */
export function SponsorMark({
  logo,
}: {
  logo: { name: string; logo: string };
}) {
  return (
    <div
      className="deck-logo-chip @max-[1400px]/deck:hidden"
      style={{ flex: "0 0 auto", inlineSize: 208, blockSize: 96 }}
    >
      <DeckImage image={{ src: logo.logo, alt: logo.name }} fit="contain" />
    </div>
  );
}

/** A hairline-separated column of content, the deck's default list rhythm. */
export function Stack({
  children,
  gap = "var(--deck-gap-md)",
  className,
  style,
}: {
  children: ReactNode;
  gap?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("flex flex-col", className)} style={{ gap, ...style }}>
      {children}
    </div>
  );
}
