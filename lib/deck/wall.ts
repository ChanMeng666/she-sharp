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
 * A bounded block of tiles for `.deck-mosaic`, in reading order.
 *
 * A mosaic is static — no drift — so it takes exactly the tiles it shows and
 * is not doubled.
 */
export function buildMosaic(count: number, seed = 0): string[] {
  return pickWallTiles(count, seed * 23);
}

/** How many photographs the pool holds; useful for an on-slide credit line. */
export const WALL_TILE_COUNT = wallTiles.length;
