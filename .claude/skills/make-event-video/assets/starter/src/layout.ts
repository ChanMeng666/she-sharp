import { useVideoConfig } from "remotion";

export type Format = "vertical" | "portrait" | "square" | "landscape";

/**
 * One composition drives four social sizes, so scenes ask the layout what shape
 * they are in rather than hard-coding pixels.
 *
 * Type sizes barely change between formats because the short edge is 1080 in
 * all four. What does change is the safe area (Reels and TikTok cover the top
 * and bottom of a 9:16 frame with their own UI) and whether grids run in one
 * row or two.
 */
export const useLayout = () => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const ar = width / height;

  const format: Format =
    ar >= 1.3 ? "landscape" : ar >= 0.95 ? "square" : ar >= 0.7 ? "portrait" : "vertical";

  const safe = {
    vertical: { top: 250, bottom: 390, side: 92 },
    portrait: { top: 120, bottom: 168, side: 84 },
    square: { top: 88, bottom: 96, side: 80 },
    landscape: { top: 80, bottom: 88, side: 128 },
  }[format];

  /**
   * Landscape reads at arm's length or across a room and has 1420px of usable
   * width against the vertical's 896, so its type steps UP. The two-line
   * headlines only ever use about a quarter of its height.
   */
  const scale = { vertical: 1, portrait: 0.98, square: 0.95, landscape: 1.05 }[format];

  const maxContent = format === "landscape" ? 1420 : width - safe.side * 2;

  return {
    width,
    height,
    fps,
    durationInFrames,
    format,
    safe,
    scale,
    maxContent,
    isWide: format === "landscape",
    /**
     * Face grids run 4-up only in landscape. A square 1080 split four ways
     * leaves ~208px a cell, which wraps "Keryn McKenzie" onto two lines and the
     * job titles onto three.
     */
    gridColumns: format === "landscape" ? 4 : 2,
    /** px helper: size a value against the type scale. */
    t: (px: number) => Math.round(px * scale),
  };
};

export type Layout = ReturnType<typeof useLayout>;
