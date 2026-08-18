/**
 * Rebuilds the hackathon keynote plate from the speaker's own headshot.
 *
 * WHY THIS EXISTS AT ALL. The keynote slide is a full-bleed `photo` slide, and
 * the stage it fills flexes from 4:3 to 21:9. Rach's headshot is a 2500×2500
 * square: dropped straight in, the crop cuts her face at the mouth. So the
 * slide is fed a composed 16:9 plate instead, with her portrait placed to
 * survive the crop at both extremes. The first version of that plate was
 * composed by hand and could not be regenerated; this script replaces it, so
 * the next colour or placement change is an edit rather than an excavation.
 *
 * WHY THE COLOUR CHANGED. The headshot arrived on a saturated yellow field, and
 * the plate simply extended that yellow to 2560×1440 — which put a single slide
 * of chrome yellow in the middle of a deck whose whole dark register is
 * near-black, magenta-purple and electric cyan, taken from this event's own
 * poster. Mahsa flagged it on 5 Aug 2026 and suggested green, to match AI
 * Forum. Green is the same mistake in a different hue: it takes its cue from
 * somebody else's brand rather than from the deck. The ground is now the deck's
 * own canvas and the accents are the theme's own pair.
 *
 * WHY THE DISC IS LIGHT. Her portrait keeps the disc it always had, but the
 * disc now has to be visible — it was invisible before only because it was
 * yellow-on-yellow. Filling it with the theme magenta loses her hair and her
 * dark top into it at the bottom of the circle. The deck already has a
 * vocabulary for "this thing needs its own ground on a dark slide": the white
 * QR chip and the white logo chip. The disc is that chip, made round, in
 * `--deck-paper` rather than pure white so it sits with the rest of the deck.
 * The theme pair does the work around it, as a ring and a burst — which is what
 * the poster does behind its own headline.
 *
 * KEYING. The yellow is removed by solving the compositing equation rather than
 * by thresholding: the observed pixel is `alpha·F + (1-alpha)·BG`, so the true
 * foreground is `(C - (1-alpha)·BG) / alpha`. Un-premultiplying this way strips
 * the yellow spill out of the hair edge for free. A plain threshold leaves a
 * yellow halo that is invisible at thumbnail size and obvious at three metres.
 *
 *   npx tsx scripts/deck/build-keynote-plate.ts [--preview]
 */

import { existsSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

/** Design tokens, mirrored from `styles/components/deck.css` and the deck's theme. */
const CANVAS_DARK = "#0b0a14";
const PAPER = "#f4f4fa";
const ACCENT_ON_DARK = "#c846ab";
const SPARK = "#5ee7f5";

const STAGE = { w: 2560, h: 1440 };

/**
 * Measured off the plate this replaces, and deliberately unchanged: the
 * placement was tuned so her face clears the crop at 4:3 and at 21:9, and so
 * the copy on the leading edge never lands on her. Move it and re-check both.
 */
const DISC = { cx: 1756, cy: 725, r: 425 };

/** The flat field the headshot was photographed against. */
const KEY = { r: 255, g: 234, b: 0 };

/**
 * The matte is cut on YELLOW EXCESS — `min(r, g) - b` — not on distance from
 * the key colour.
 *
 * Distance was the obvious first try and it leaves a yellow-green rim through
 * the hair. A strand that is half hair and half field lands around (147,132,12),
 * which is 171 away from the key: past any sensible threshold, so it is called
 * fully opaque, never corrected, and the yellow stays baked in. Excess reads
 * that same pixel as 120 out of 234 and gives it the alpha it actually has.
 *
 * The measure survives everything else in the frame: dark hair scores about 5,
 * skin 30, teeth 0. The one thing it costs is the caramel highlight in her hair,
 * which comes back a few per cent transparent — invisible against the disc.
 */
const EXCESS_KEY = Math.min(KEY.r, KEY.g) - KEY.b;
/** Below `OPAQUE` a pixel is untouched; above `FIELD` it is pure background. */
const OPAQUE = 42;
const FIELD = 205;

const ROOT = process.cwd();
const SRC = path.join(
  ROOT,
  "public/img/events/aotearoa-ai-hackathon-festival-2026/rach-monks.jpg",
);
const OUT = path.join(
  ROOT,
  "public/img/events/aotearoa-ai-hackathon-festival-2026/rach-monks-plate.jpg",
);

/** Keys the flat field out of the headshot and returns straight RGBA. */
async function keyPortrait(size: number): Promise<Buffer> {
  const { data, info } = await sharp(SRC)
    .resize(size, size, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(info.width * info.height * 4);

  for (let p = 0; p < info.width * info.height; p++) {
    const r = data[p * 3];
    const g = data[p * 3 + 1];
    const b = data[p * 3 + 2];

    const excess = Math.min(r, g) - b;
    const a =
      1 - Math.min(1, Math.max(0, (excess - OPAQUE) / (FIELD - OPAQUE)));

    if (a <= 0) {
      out.writeUInt32LE(0, p * 4);
      continue;
    }

    // Un-premultiply against the key colour: C = a·F + (1-a)·BG  →  F.
    const un = (c: number, k: number) =>
      Math.round(Math.min(255, Math.max(0, (c - (1 - a) * k) / a)));

    out[p * 4] = a < 1 ? un(r, KEY.r) : r;
    out[p * 4 + 1] = a < 1 ? un(g, KEY.g) : g;
    out[p * 4 + 2] = a < 1 ? un(b, KEY.b) : b;
    out[p * 4 + 3] = Math.round(a * 255);
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/**
 * The ground: dark canvas, the theme's burst behind the disc, and the disc.
 *
 * The burst sits entirely on the trailing half. The photo layout empties the
 * leading edge with `.deck-gradient` and sets the copy into it, so any light
 * put there is light the host's own words have to compete with.
 */
function groundSvg(): string {
  const { cx, cy, r } = DISC;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STAGE.w}" height="${STAGE.h}">
  <defs>
    <radialGradient id="burst" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.50" stop-color="${ACCENT_ON_DARK}" stop-opacity="0.30"/>
      <stop offset="0.72" stop-color="${ACCENT_ON_DARK}" stop-opacity="0.09"/>
      <stop offset="1" stop-color="${ACCENT_ON_DARK}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="spark" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.58" stop-color="${SPARK}" stop-opacity="0.16"/>
      <stop offset="0.80" stop-color="${SPARK}" stop-opacity="0.04"/>
      <stop offset="1" stop-color="${SPARK}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="100%" height="100%" fill="${CANVAS_DARK}"/>

  <!-- HELD BACK ON PURPOSE. The deck is a hard-edged system — incisions,
       hairlines, tiles — and a soft airbrush glow is not native to it. This is
       the event poster's light burst quoted quietly enough to read as depth
       behind the disc rather than as a second visual language. Cyan under
       magenta, offset up and trailing, so the two read as one light source
       rather than as two concentric rings. -->
  <circle cx="${cx + 170}" cy="${cy - 130}" r="${r * 2.1}" fill="url(#spark)"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 1.85}" fill="url(#burst)"/>

  <!-- The disc, and the accent as a ring on it: the same accent hairline that
       opens a panel on every other slide, closed into a circle. -->
  <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="${ACCENT_ON_DARK}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${PAPER}"/>
</svg>`;
}

/** Clips the portrait to the disc so no keying artefact escapes the circle. */
function discMaskSvg(size: number): string {
  const c = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <circle cx="${c}" cy="${c}" r="${c}" fill="#fff"/>
</svg>`;
}

async function main() {
  if (!existsSync(SRC)) {
    console.error(`Headshot not found: ${SRC}`);
    process.exit(1);
  }

  const size = DISC.r * 2;
  const portrait = await keyPortrait(size);

  const clipped = await sharp(portrait)
    .composite([{ input: Buffer.from(discMaskSvg(size)), blend: "dest-in" }])
    .png()
    .toBuffer();

  const plate = await sharp(Buffer.from(groundSvg()))
    .composite([
      { input: clipped, left: DISC.cx - DISC.r, top: DISC.cy - DISC.r },
    ])
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
    .toBuffer();

  await sharp(plate).toFile(OUT);

  const meta = await sharp(OUT).metadata();
  console.log(
    `✓ ${path.relative(ROOT, OUT)} — ${meta.width}×${meta.height}, ${Math.round(
      (meta.size ?? 0) / 1024,
    )} kB`,
  );

  if (process.argv.includes("--preview")) {
    const previews: [string, number, number][] = [
      ["21x9", 2560, 1097],
      ["4x3", 1920, 1440],
    ];
    for (const [name, w, h] of previews) {
      const file = path.join(ROOT, `tmp/keynote-plate-${name}.jpg`);
      // ONE resize call, not two. sharp keeps only the last one, so chaining a
      // cover-crop and then a scale-down silently throws the crop away and
      // writes the uncropped plate — which is exactly the check this is for.
      await sharp(plate)
        .resize(900, Math.round((900 * h) / w), {
          fit: "cover",
          position: "centre",
        })
        .jpeg({ quality: 80 })
        .toFile(file);
      console.log(`  preview ${name} → ${path.relative(ROOT, file)}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
