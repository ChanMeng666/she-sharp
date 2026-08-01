/**
 * Deck theming: the default She Sharp palette, per-deck accent overrides, and
 * the WCAG contrast helpers that keep an accent pair honest.
 *
 * Per-event customisation is deliberately narrow — swap `theme.accent` and use
 * that event's own photography. Everything else stays the shared system.
 */

import type { DeckAccent, DeckTheme } from "./types";

/** Near-black rather than brand navy: navy washes out on a projector. */
export const DEFAULT_DARK_CANVAS = "#0b0a14";
export const DEFAULT_LIGHT_CANVAS = "#ffffff";

/**
 * How QR blocks render.
 *
 * `"generate"` draws `QrBlock.url` client-side with `qrcode.react`. This is the
 * default because a generated code cannot drift out of sync with the link it
 * encodes, and nobody has to remember to re-export an image when a form URL
 * changes. It is still venue-safe: generation happens in the browser, so a code
 * on screen never depends on the network.
 *
 * `"image"` falls back to the committed file at `QrBlock.image` — for a code
 * someone else produced that must be used verbatim.
 */
export const DECK_QR_MODE: "image" | "generate" = "generate";

/** Brand default: purple on light, purple-mid on dark, mint spark. */
export const sheSharpTheme: DeckTheme = {
  accent: {
    onLight: "#9b2e83",
    onDark: "#c846ab",
    spark: "#5ee7f5",
  },
};

/** Parses `#rgb` / `#rrggbb` into 0–255 channels. Throws on anything else. */
function parseHex(hex: string): [number, number, number] {
  const value = hex.trim().replace(/^#/, "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`Deck theme colours must be hex, received "${hex}"`);
  }
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Relative luminance per WCAG 2.x. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours, 1–21. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

export interface AccentCheck {
  tone: "light" | "dark";
  accent: string;
  canvas: string;
  ratio: number;
  passes: boolean;
}

/**
 * Checks both accents against their own canvas at the AA body-text threshold.
 *
 * Run by `deck.test.ts` and by `scripts/deck/lint-deck.ts`, so an unreadable
 * accent fails before it reaches a projector.
 */
export function checkAccentContrast(theme: DeckTheme): AccentCheck[] {
  const dark = theme.darkCanvas ?? DEFAULT_DARK_CANVAS;
  const light = theme.lightCanvas ?? DEFAULT_LIGHT_CANVAS;
  return [
    {
      tone: "light",
      accent: theme.accent.onLight,
      canvas: light,
      ratio: contrastRatio(theme.accent.onLight, light),
      passes: contrastRatio(theme.accent.onLight, light) >= 4.5,
    },
    {
      tone: "dark",
      accent: theme.accent.onDark,
      canvas: dark,
      ratio: contrastRatio(theme.accent.onDark, dark),
      passes: contrastRatio(theme.accent.onDark, dark) >= 4.5,
    },
  ];
}

/**
 * Nudges a colour's lightness until it clears `target` against `canvas`.
 *
 * Used when deriving an accent from an event poster: the extracted colour is
 * usually right in hue and wrong in luminance. Returns the input unchanged if
 * it already passes, or the closest passing step within 24 iterations.
 */
export function adjustForContrast(
  hex: string,
  canvas: string,
  target = 4.5,
): string {
  if (contrastRatio(hex, canvas) >= target) return hex;

  const canvasIsDark = relativeLuminance(canvas) < 0.5;
  const [r, g, b] = parseHex(hex);
  let current: [number, number, number] = [r, g, b];

  for (let step = 0; step < 24; step += 1) {
    current = current.map((channel) =>
      canvasIsDark
        ? Math.min(255, Math.round(channel + (255 - channel) * 0.08 + 3))
        : Math.max(0, Math.round(channel * 0.92 - 3)),
    ) as [number, number, number];
    const next = `#${current.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    if (contrastRatio(next, canvas) >= target) return next;
  }
  return `#${current.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** CSS custom properties applied inline to `.deck-stage`. */
export function themeToCssVars(theme: DeckTheme): Record<string, string> {
  return {
    "--deck-accent-light": theme.accent.onLight,
    "--deck-accent-dark": theme.accent.onDark,
    "--deck-spark": theme.accent.spark,
    "--deck-canvas-dark": theme.darkCanvas ?? DEFAULT_DARK_CANVAS,
    "--deck-canvas-light": theme.lightCanvas ?? DEFAULT_LIGHT_CANVAS,
  };
}

/** Builds a theme from a poster-derived hue, fixing contrast automatically. */
export function accentFromBrandColour(
  base: string,
  spark: string,
  canvases: { dark?: string; light?: string } = {},
): DeckAccent {
  const dark = canvases.dark ?? DEFAULT_DARK_CANVAS;
  const light = canvases.light ?? DEFAULT_LIGHT_CANVAS;
  return {
    onLight: adjustForContrast(base, light),
    onDark: adjustForContrast(base, dark),
    spark,
  };
}
