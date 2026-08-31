/**
 * Typesetting for event posters: measure, fit, wrap, inline a logo, rasterise.
 *
 * WHY THIS IS A SEPARATE FILE. Two layouts consume it (the 1400×1980 poster and
 * the 1080×1350 cover), and every genuinely surprising constraint in the whole
 * pipeline lives here rather than in either layout. Chief among them:
 *
 * **resvg renders only a variable font's DEFAULT INSTANCE.** `@resvg/resvg-js`
 * 2.6.2 ignores `font-weight`, `font-stretch` and `font-variation-settings`
 * against a variable TTF — measured, not assumed: the ink-pixel count and the
 * `innerBBox` of the same string are byte-identical at wght 200, 400, 600 and
 * 800. So the repo's four vendored faces give exactly four typefaces:
 *
 *   Bricolage Grotesque   wght 800, wdth 100, opsz 96   ← display
 *   Instrument Sans       wght 400                      ← body
 *   Instrument Sans + font-style="italic"               ← body italic
 *   Carattere             400 static                    ← script
 *
 * Bricolage's fvar default happening to be 800 is the accident that makes this
 * approach viable at all — it is the poster weight, free. The cost is the other
 * end: **there is no semibold body face.** Emphasis in body copy comes from
 * size, colour, case and tracking. Do not write `font-weight="600"` anywhere in
 * a poster SVG; it renders identically to 400 and reads as a bug to whoever
 * finds it next. If a heavier body face ever becomes genuinely necessary, the
 * escape hatch is `stroke` + `paint-order="stroke"` at `strokeEm ≈ 0.018`,
 * which grows ink ~26% while leaving the advance width — and therefore every
 * measured layout — unchanged.
 *
 * The second surprise: **a misspelled `font-family` fails silently**, falling
 * back to whatever fontdb offers rather than raising. `assertFamiliesDistinct()`
 * is the guard, and it runs before any layout does.
 *
 * Nothing in here is specific to one event. Copy, colour and placement belong to
 * `build-event-poster.ts`.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg, type ResvgRenderOptions } from "@resvg/resvg-js";
import sharp from "sharp";

/**
 * The repository root, derived from this file rather than from `process.cwd()`.
 *
 * Every path below — the four font files, the logos, the poster plates — is
 * spelled relative to the repo, so a `cwd` of anywhere but the root produced a
 * confusing ENOENT. The fonts make that worse than confusing: resvg does not
 * raise on a font file it cannot open, it falls back silently, and a poster set
 * entirely in the wrong face looks deliberate.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const DISPLAY = "Bricolage Grotesque";
export const BODY = "Instrument Sans";
export const SCRIPT = "Carattere";

/**
 * `loadSystemFonts: false` is determinism, not speed: this machine, a
 * teammate's Mac and a CI container have three different font sets, and a
 * poster that quietly picks up Segoe UI on one of them is a defect nobody sees
 * until it is printed.
 *
 * `defaultFontFamily` is the body face on purpose — a typo should degrade into
 * something that looks wrong at body size, not into 300pt display type.
 */
const FONT_FILES = [
  "BricolageGrotesque-VF.ttf",
  "InstrumentSans-VF.ttf",
  "InstrumentSans-Italic-VF.ttf",
  "Carattere-Regular.ttf",
].map((file) => path.join(ROOT, "scripts/events/fonts", file));

export const RESVG_OPTIONS: ResvgRenderOptions = {
  font: {
    loadSystemFonts: false,
    fontFiles: FONT_FILES,
    defaultFontFamily: BODY,
  },
  textRendering: 2,
  shapeRendering: 2,
};

/** XML-escapes a string bound for a text node or an attribute. */
export function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Measured at font-size 100, keyed on `family|letter-spacing|text`. */
const measureCache = new Map<string, Measurement>();

export interface Measurement {
  /** Ink width at font-size 100, in user units. */
  width: number;
  /** Ink height at font-size 100 — cap height for an all-caps string. */
  height: number;
}

/**
 * Measures one line at font-size 100.
 *
 * **This is ink extent, not advance width.** It stops at the last inked pixel,
 * so it under-reports the trailing sidebearing by a few units. That is exactly
 * what you want for optically aligning flush edges — which is what the poster's
 * three display lines do — and it is exactly what you must not treat as a text
 * box: padding inside a pill has to be real padding, not a fudge factor
 * borrowed from the sidebearing.
 */
export function measure(
  text: string,
  family: string,
  letterSpacing = 0,
): Measurement {
  const key = `${family}|${letterSpacing}|${text}`;
  const hit = measureCache.get(key);
  if (hit) return hit;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20000" height="600">
    <text x="100" y="400" font-family="${esc(family)}" font-size="100"${
      letterSpacing ? ` letter-spacing="${letterSpacing}"` : ""
    }>${esc(text)}</text>
  </svg>`;

  const bbox = new Resvg(svg, RESVG_OPTIONS).innerBBox();
  if (!bbox) throw new Error(`Nothing rendered while measuring "${text}".`);

  // BBox's fields are native getters and are NOT enumerable — JSON.stringify()
  // on one prints `{}`. Read them individually.
  const result = {
    // From the anchor, not from the ink's left edge: a leading sidebearing is
    // part of the space the line occupies when it is set flush left.
    width: bbox.x - 100 + bbox.width,
    height: bbox.height,
  };
  measureCache.set(key, result);
  return result;
}

/**
 * Solves the font size that makes a line exactly `maxWidth` wide.
 *
 * The tracking term is why this cannot be a ratio. resvg's `letter-spacing` is
 * an ABSOLUTE user-unit value applied to n−1 gaps, so tracking expressed as a
 * fraction of the em has to be folded into the solve rather than applied after
 * it. Returns the size and the absolute letter-spacing to set alongside it.
 *
 * **A `maxSize` cap that binds is the warning, not a line that solves small.**
 * Filling the column is the entire mechanism by which the display lines end up
 * with aligned right edges; the moment the cap binds, that line stops reaching
 * the column and the alignment silently goes ragged. A line that solves *small*
 * is that mechanism working — a long title simply gets set smaller — and warning
 * about it, as the first version did, only trains the reader to ignore warnings.
 */
export function fitSize(opts: {
  text: string;
  family: string;
  maxWidth: number;
  maxSize: number;
  trackEm?: number;
  label?: string;
}): { size: number; letterSpacing: number } {
  const { text, family, maxWidth, maxSize, trackEm = 0, label } = opts;
  const gaps = Math.max(0, [...text].length - 1);
  const per100 = measure(text, family).width / 100;

  const size = maxWidth / (per100 + trackEm * gaps);

  if (size > maxSize) {
    if (label) {
      console.warn(
        `  ! "${label}" wanted ${size.toFixed(0)}pt to fill its column and was capped at ` +
          `${maxSize}pt — it will not reach the column edge.`,
      );
    }
    return { size: maxSize, letterSpacing: trackEm * maxSize };
  }
  return { size, letterSpacing: trackEm * size };
}

/**
 * Wraps to `maxWidth`, then rebalances so the lines are close to equal.
 *
 * Greedy wrapping alone breaks the strapline 904/416 at the poster's column
 * width — technically correct, and it reads as a mistake. The second pass walks
 * the break points down one word at a time and keeps whichever arrangement has
 * the narrowest widest-line.
 */
export function wrapBalanced(
  text: string,
  family: string,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const widthOf = (line: string) => (measure(line, family).width * size) / 100;

  const greedy: string[] = [];
  for (const word of words) {
    const candidate = greedy.length
      ? `${greedy[greedy.length - 1]} ${word}`
      : word;
    if (greedy.length && widthOf(candidate) <= maxWidth) {
      greedy[greedy.length - 1] = candidate;
    } else {
      greedy.push(word);
    }
  }
  if (greedy.length < 2) return greedy;

  // Rebalance: try every split into the same number of lines and keep the one
  // whose widest line is narrowest. Line counts here are 2–3, so this is cheap.
  const lines = greedy.length;
  let best = greedy;
  let bestMax = Math.max(...greedy.map(widthOf));

  const splits = (start: number, remaining: number): number[][] => {
    if (remaining === 1) return [[words.length]];
    const out: number[][] = [];
    for (let cut = start + 1; cut <= words.length - remaining + 1; cut++) {
      for (const rest of splits(cut, remaining - 1)) out.push([cut, ...rest]);
    }
    return out;
  };

  for (const cuts of splits(0, lines)) {
    let prev = 0;
    const candidate = cuts.map((cut) => {
      const line = words.slice(prev, cut).join(" ");
      prev = cut;
      return line;
    });
    const widest = Math.max(...candidate.map(widthOf));
    if (widest <= maxWidth && widest < bestMax) {
      best = candidate;
      bestMax = widest;
    }
  }

  return best;
}

export interface TextOptions {
  x: number;
  y: number;
  text: string;
  family: string;
  size: number;
  fill: string;
  opacity?: number;
  letterSpacing?: number;
  anchor?: "start" | "middle" | "end";
}

/** One line of type. */
export function textLine(o: TextOptions): string {
  return (
    `<text x="${round(o.x)}" y="${round(o.y)}" font-family="${esc(o.family)}" font-size="${round(o.size)}"` +
    ` fill="${o.fill}"${o.opacity !== undefined ? ` fill-opacity="${o.opacity}"` : ""}` +
    `${o.letterSpacing ? ` letter-spacing="${round(o.letterSpacing)}"` : ""}` +
    `${o.anchor && o.anchor !== "start" ? ` text-anchor="${o.anchor}"` : ""}` +
    `>${esc(o.text)}</text>`
  );
}

/** The rectangle a line of type occupies, for the legibility gate. */
export interface TextBox {
  name: string;
  ink: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The box a line will occupy, from its baseline and measured ink.
 *
 * Padded by 4% of the size on every side so the gate samples the ground the
 * glyph edges actually sit against rather than only the ground inside them.
 */
export function boxFor(
  name: string,
  o: Pick<TextOptions, "x" | "y" | "text" | "family" | "size" | "letterSpacing">,
  ink: string,
): TextBox {
  const gaps = Math.max(0, [...o.text].length - 1);
  const m = measure(o.text, o.family);
  const width = (m.width * o.size) / 100 + (o.letterSpacing ?? 0) * gaps;
  const height = (m.height * o.size) / 100;
  const pad = o.size * 0.04;

  return {
    name,
    ink,
    left: Math.round(o.x - pad),
    top: Math.round(o.y - height - pad),
    width: Math.round(width + pad * 2),
    height: Math.round(height + pad * 2),
  };
}

export interface InlinedLogo {
  markup: string;
  width: number;
  height: number;
}

/**
 * Inlines an SVG logo at a given width, in a given colour.
 *
 * TWO SILENT TRAPS, and the two marks in this repo hit one each.
 *
 * `public/img/sponsors/lesmills_logo.svg` declares no `fill` anywhere at all
 * (7 paths and a polyline), so it defaults to black — invisible on a dark
 * poster. The wrapper's `fill` is what colours it.
 *
 * `public/logos/she-sharp-logo.svg` carries `fill="none"` on its ROOT and
 * `fill="currentColor"` on its single path. Both matter and they fail
 * differently. Nesting the file whole keeps the root's `fill="none"`, so the
 * mark paints nothing — a hole where the logo should be, with no error. And
 * because the path states its own fill, **a wrapper `<g fill="#fff">` does not
 * reach it**: an explicit `fill` on the element always beats an inherited one.
 * `currentColor` resolves against the `color` property, not against `fill`, so
 * `color` is the only lever there is. Setting both on the wrapper covers a mark
 * that names its colour and one that does not.
 *
 * Worth knowing if you go looking: that `fill="currentColor"` has a literal
 * newline inside the attribute value, so a `grep 'fill="[^"]*"'` over the file
 * reports only the root's `none` and the path looks unfilled. It is not.
 */
export function inlineLogo(
  file: string,
  opts: { x: number; y: number; width: number; fill: string },
): InlinedLogo {
  const raw = readFileSync(path.join(ROOT, file), "utf8");

  const openTag = raw.match(/<svg[\s\S]*?>/)?.[0];
  if (!openTag) throw new Error(`No <svg> element in ${file}`);

  const viewBox = openTag.match(/viewBox="([^"]+)"/)?.[1];
  if (!viewBox) throw new Error(`No viewBox on ${file} — cannot scale it.`);
  const [, , vbW, vbH] = viewBox.split(/[\s,]+/).map(Number);

  const inner = raw
    .slice(raw.indexOf(openTag) + openTag.length, raw.lastIndexOf("</svg>"))
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  const scale = opts.width / vbW;
  return {
    width: opts.width,
    height: vbH * scale,
    markup:
      `<g transform="translate(${round(opts.x)} ${round(opts.y)}) scale(${scale.toFixed(6)})"` +
      ` fill="${opts.fill}" color="${opts.fill}">${inner}</g>`,
  };
}

/**
 * Guards against the silent font fallback.
 *
 * A misspelled family does not raise — it renders in whatever fontdb hands back,
 * and a poster set entirely in the wrong face looks deliberate. Measuring one
 * probe string in each family and requiring three distinct widths costs three
 * milliseconds and catches a renamed font file, a moved `scripts/events/fonts`, and a
 * typo in a family constant.
 */
export function assertFamiliesDistinct(): void {
  const probe = "Handgloves 2026";
  const widths = new Map<string, number>();

  for (const family of [DISPLAY, BODY, SCRIPT]) {
    widths.set(family, Math.round(measure(probe, family).width));
  }

  const distinct = new Set(widths.values());
  if (distinct.size !== widths.size) {
    throw new Error(
      "Two font families measured identically, which means at least one did not load " +
        "and resvg fell back silently:\n" +
        [...widths].map(([f, w]) => `  ${f} → ${w}`).join("\n") +
        `\nCheck the four TTFs in scripts/events/fonts/.`,
    );
  }
}

/**
 * Rasterises a layer to a transparent PNG at its own pixel size.
 *
 * No `background`, so it composites cleanly over the plate. The SVG must
 * already be built at final pixel dimensions — rendering type small and scaling
 * it up would throw away the entire reason for setting the copy in code.
 */
export function renderLayer(svg: string): Buffer {
  return new Resvg(svg, RESVG_OPTIONS).render().asPng();
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ------------------------------------------------------------------ people */

/**
 * A slug for one person's name.
 *
 * The same string has to be three things at once — the CLI argument
 * (`--speaker keryn-mckenzie`), the headshot already on disk
 * (`keryn-mckenzie.jpg`, the convention in `public/img/events/README.md`) and
 * the output filename (`speaker-keryn-mckenzie-social.jpg`). Deriving all three
 * from `speaker.name` is what stops them drifting apart, so the normalisation
 * has to survive the awkward real names in the record: "Dr. Mahsa Mohaghegh
 * (McCauley)" is one of them, and NFD-stripping accents first is what keeps a
 * name like "José" from losing its vowel rather than its diacritic.
 */
export function speakerSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A real photograph placed in the artwork, as a circle. */
export interface PortraitSpec {
  /** Repo-relative, e.g. `public/img/events/<slug>/keryn-mckenzie.jpg`. */
  file: string;
  left: number;
  top: number;
  /** Diameter in px. The circle is inscribed in this square. */
  size: number;
  /**
   * Fraction of the radius over which the edge fades to nothing. Default 0.08.
   *
   * This is the whole difference between a portrait that belongs to the picture
   * and one that looks stuck onto it. A hard circular cut leaves the headshot's
   * own background — an office, a white wall, a window — ending at a crisp
   * boundary against a near-black cinematic plate, which reads as a sticker. A
   * short falloff lets that background dissolve into the plate instead.
   */
  feather?: number;
}

/**
 * A circular, soft-edged portrait as a transparent PNG, ready to composite.
 *
 * THIS IS THE ONE RASTER PRIMITIVE IN THE PIPELINE, and it is here rather than
 * in a layout for the same reason `inlineLogo` is: it knows nothing about any
 * event. Two traps, both silent.
 *
 * **`blend: "dest-in"` does nothing to an image with no alpha channel.** A JPEG
 * headshot has none, so `ensureAlpha()` is load-bearing — without it the mask
 * composites as a no-op and the portrait ships as a full square.
 *
 * **The resize and the mask are separate `sharp()` calls.** Same family as the
 * gotcha recorded in `scripts/deck/build-keynote-plate.ts`: sharp keeps only the
 * LAST `resize()` in a chain, so anything geometric queued behind another
 * geometric operation is at risk. Render, then measure or mask the render.
 */
export async function renderPortrait(spec: PortraitSpec): Promise<Buffer> {
  const file = path.join(ROOT, spec.file);
  const size = Math.round(spec.size);
  const feather = spec.feather ?? 0.08;

  const meta = await sharp(file).metadata();
  const shortest = Math.min(meta.width ?? 0, meta.height ?? 0);
  if (shortest > 0 && shortest < size) {
    // A warning, not a refusal. Headshots arrive at whatever size the speaker
    // had — three of the Les Mills panel are 800×800 and one is 358×358 — and a
    // 1.6× lanczos upscale of a face is soft rather than wrong. Silence is what
    // would be wrong: the softness is invisible on a laptop and obvious in print.
    console.warn(
      `  ! ${path.basename(spec.file)} is ${meta.width}×${meta.height} but is drawn at ${size}px ` +
        `— upscaled ${(size / shortest).toFixed(1)}×. Ask for a larger headshot if it looks soft.`,
    );
  }

  /* `position: "top"`, not centre and not sharp's entropy strategy. A headshot
     frames the head in the upper part of the frame, so a tall source cropped to
     a square from the top keeps the face and drops the chest; centred, it takes
     a slice of chin and shoulders. On an already-square source — which most of
     these are — `cover` is a plain resize and the position is inert. */
  const filled = await sharp(file)
    .resize(size, size, { fit: "cover", position: "top", kernel: "lanczos3" })
    .ensureAlpha()
    .png()
    .toBuffer();

  const mask = renderLayer(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <radialGradient id="edge" cx="0.5" cy="0.5" r="0.5">
          <stop offset="${(1 - feather).toFixed(4)}" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#edge)"/>
    </svg>`,
  );

  return sharp(filled).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}
