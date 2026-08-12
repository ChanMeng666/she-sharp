/**
 * The archive wall: turning the tile pool in `wall-tiles.ts` into the drifting
 * rows that `styles/components/deck.css` renders as the deck's ground.
 *
 * This module owns GEOMETRY AND MOTION only. Which photographs are in the pool
 * is `wall-tiles.ts`; how they are graded into one purple duotone is CSS (see
 * the DUOTONE block in `deck.css`) — nothing here touches colour, and no file
 * is ever processed.
 *
 * WHY THIS IS DETERMINISTIC
 * The tile order is a fixed walk, never `Math.random()`. Slides are
 * server-rendered and then hydrated, so a random wall would produce a different
 * `src` list on the server and on the client and React would report a
 * hydration mismatch for every tile on screen.
 */

import { pickWallTiles, wallTiles } from "./wall-tiles";

/**
 * Tile geometry, in design px at the 1080 stage height. Mirrors
 * `--deck-tile-w` / `--deck-tile-h` / `--deck-wall-gap` in `deck.css`; the CSS
 * is authoritative for rendering and these exist so a layout can reason about
 * how many tiles a row needs without measuring the DOM.
 */
export const WALL_TILE_WIDTH = 259;
export const WALL_TILE_HEIGHT = 162;
export const WALL_TILE_GAP = 4;

/**
 * Six rows of 162px on a 166px pitch fill 992px exactly, and 992px is the
 * stage height minus the running header. Nothing is clipped mid-tile at the
 * bottom edge, and every horizontal incision can land on a tile edge.
 */
export const WALL_ROWS_FULL = 6;

/**
 * Distinct tiles per row before doubling. 20 x 263px of pitch is 5260px, which
 * overfills even a 2520px (21:9) stage twice over — the row has to be wider
 * than the stage or the drift would run out of photographs.
 */
export const WALL_TILES_PER_ROW = 20;

/**
 * Seconds per row for the horizontal drift, one per row of a full wall.
 * Deliberately uneven so the rows never resynchronise into one sliding sheet.
 */
export const WALL_ROW_SECONDS = [176, 218, 152, 248, 190, 164] as const;

/** One row of the wall, ready to render. */
export interface WallRow {
  /**
   * Tile sources for this row, ALREADY EMITTED TWICE — the same list back to
   * back. The CSS drift translates the row by -50%, so a row that is not
   * doubled visibly jumps at the loop point. Doubling here rather than in each
   * layout is what stops that being a per-layout bug.
   */
  tiles: string[];
  /** Feeds `--wall-seconds` on `.deck-wall-row`. */
  seconds: number;
  /** Alternating rows drift the other way; adds `.deck-wall-row-reverse`. */
  reverse: boolean;
}

export interface BuildWallOptions {
  /** Rows to emit. Defaults to a full-height wall. */
  rows?: number;
  /** Distinct tiles per row before doubling. */
  perRow?: number;
  /**
   * Offsets the whole walk. Pass the slide index so two walls in the same deck
   * do not show the same photographs in the same order.
   */
  seed?: number;
}

/**
 * A stable numeric seed from a slide's `id`.
 *
 * Layout components receive `{ slide }` and no position, so they cannot seed a
 * wall with an index. Seeding from `slide.id` is better anyway: the id is
 * stable, so reordering the deck does not reshuffle every wall behind it, and
 * two walls in one deck still differ because their ids do.
 *
 * FNV-1a, chosen because it is four lines and deterministic — not because hash
 * quality matters here. Any stable string-to-int would do; what matters is
 * that the server and the client compute the same one, for the hydration
 * reason above.
 */
export function wallSeed(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash);
}

/**
 * Builds the rows for one wall.
 *
 * Each row takes its own spread through the pool via `pickWallTiles`, offset
 * far enough from the row above that neighbouring rows are not two frames of
 * the same group shot.
 */
export function buildWallRows(options: BuildWallOptions = {}): WallRow[] {
  const {
    rows = WALL_ROWS_FULL,
    perRow = WALL_TILES_PER_ROW,
    seed = 0,
  } = options;

  return Array.from({ length: rows }, (_, row) => {
    const tiles = pickWallTiles(perRow, row * 7 + seed * 23);
    return {
      tiles: [...tiles, ...tiles],
      seconds: WALL_ROW_SECONDS[row % WALL_ROW_SECONDS.length],
      reverse: row % 2 === 1,
    };
  });
}

/**
 * A single row, for `.deck-band` — the wall reduced to a horizontal rule made
 * of evidence at the head or foot of a paper slide.
 */
export function buildWallBand(seed = 0): WallRow {
  return buildWallRows({ rows: 1, seed })[0];
}

/**
 * A bounded block of tiles, in reading order.
 *
 * NOT the mosaic weave, despite the name and the comment this once carried.
 * Its three callers — `section-slide.tsx`, `stats-slide.tsx`, `prizes-slide.tsx`
 * — all call it as `buildMosaic(1, seed)[0]` to pick the single archive frame
 * that fills a photo-knockout numeral. Changing its walk changes that numeral on
 * six slides across both shipped decks, so it is left exactly as it is; the
 * weave builders below are new functions rather than a generalisation of this
 * one.
 */
export function buildMosaic(count: number, seed = 0): string[] {
  return pickWallTiles(count, seed * 23);
}

/* -------------------------------------------------------------------------
   The still weaves

   Both lay the archive on the SAME grid the drifting wall uses — six rows of
   `--deck-tile-h` on the house gutter — so `INCISION_5_ROWS` still lands on a
   cell edge and the layouts that write it inline never learn a weave exists.
   Neither is doubled and neither drifts: they are compositions, not loops.
   ------------------------------------------------------------------------- */

/** Columns at the widest stage. Every narrower step divides into this. */
export const WEAVE_COLS_FULL = 8;

/** Rows of a full-bleed weave. The wall's own six. */
export const WEAVE_ROWS_FULL = WALL_ROWS_FULL;

/**
 * One cell of a still weave.
 *
 * `span` is COLUMNS, and only ever 1 or 2. There is no row span and there must
 * never be one: a cell two rows tall crossing the row-5/row-6 boundary is cut
 * through the middle by `INCISION_5_ROWS`, and the invariant that would prevent
 * it cannot survive the column count changing per breakpoint.
 */
export interface WeaveCell {
  src: string;
  span: 1 | 2;
}

/**
 * A strict, uniform field — the contact sheet.
 *
 * Exactly `cols × rows` cells, so the grid tiles with no ragged last row at any
 * breakpoint. A ragged bottom row reads as a broken grid rather than a designed
 * one, which is the whole difference between this weave and an accident.
 */
export function buildContactSheet(options: BuildWallOptions & { cols?: number } = {}): WeaveCell[] {
  const { rows = WEAVE_ROWS_FULL, cols = WEAVE_COLS_FULL, seed = 0 } = options;
  return pickWallTiles(rows * cols, seed * 23).map((src) => ({ src, span: 1 }));
}

/**
 * An irregular field cut on the same rows — the mosaic.
 *
 * THE PATTERN HAS A PERIOD OF THREE CELLS FILLING FOUR COLUMNS (2 + 1 + 1), and
 * that is not decoration. It means the pattern tiles exactly at any column count
 * that is a multiple of four, so a breakpoint can step 8 → 4 by hiding a whole
 * number of periods and the bottom row still lands flush. A pattern chosen for
 * looks alone would have to be re-derived for every column count, and would be
 * wrong at one of them without anybody noticing until it was projected.
 *
 * Which cells are wide is a fixed walk off the seed — never `Math.random()`, for
 * the hydration reason at the top of this file.
 */
export function buildMosaicWeave(options: BuildWallOptions & { cols?: number } = {}): WeaveCell[] {
  const { rows = WEAVE_ROWS_FULL, cols = WEAVE_COLS_FULL, seed = 0 } = options;

  const periods = (rows * cols) / 4;
  const cells: WeaveCell[] = [];
  const tiles = pickWallTiles(periods * 3, seed * 23);

  for (let i = 0; i < periods; i += 1) {
    /* Which of the three slots in this period is the wide one. Stepping by a
       number coprime with 3 keeps neighbouring rows from lining their wide
       cells up into an accidental column. */
    const wide = (seed + i * 2) % 3;
    for (let slot = 0; slot < 3; slot += 1) {
      cells.push({ src: tiles[i * 3 + slot], span: slot === wide ? 2 : 1 });
    }
  }

  return cells;
}

/**
 * One row of a still band, for a light slide.
 *
 * Every surface owes a band — a light slide with no band has no family
 * resemblance to the dark ones either side of it. The mosaic keeps its uneven
 * rhythm here; the contact sheet stays uniform.
 */
export function buildStillBand(
  seed: number,
  weave: "mosaic" | "contact-sheet",
  cols = WEAVE_COLS_FULL,
): WeaveCell[] {
  return weave === "mosaic"
    ? buildMosaicWeave({ rows: 1, cols, seed })
    : buildContactSheet({ rows: 1, cols, seed });
}

/** How many photographs the pool holds; useful for an on-slide credit line. */
export const WALL_TILE_COUNT = wallTiles.length;
