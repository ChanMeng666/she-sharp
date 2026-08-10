/**
 * Builds every poster size one event needs, from one generated plate.
 *
 * WHY THE TYPE IS SET IN CODE. The plate (`generate-poster-plate.ts`) carries no
 * words and no marks by design. Everything a reader has to read is set here,
 * against the event's own record in `lib/data/json/events-custom.json`, so the
 * date on a poster and the date on the website cannot disagree and a correction
 * is an edit rather than a redesign.
 *
 * WHY FIVE LAYOUTS AND NOT ONE CROPPED FIVE TIMES. A 2:1 Humanitix banner, a 4:5
 * feed post and a 9:16 story cannot be the same composition — cropping to satisfy
 * one loses either the headline or the facts in the others. The design lives in
 * `poster-formats.ts`; this file is the machine that drives it.
 *
 *   npx tsx scripts/events/build-event-poster.ts <event-slug> --plate <file.png>
 *          [--only social,humanitix] [--suffix v2] [--accent "#c846ab"]
 *          [--spark "#5ee7f5"] [--strapline "..."] [--no-gate]
 *
 * Writes `public/img/events/<slug>-<format>[-<suffix>].<ext>` and the crop
 * previews that matter into `tmp/poster-review/`.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { formatEventDate } from "@/lib/data/events";
import { loadEventForDeck, partnerLogosFrom } from "@/lib/deck/event-source";
import { getAllDecks } from "@/lib/deck/registry";
import { contrastRatio, relativeLuminance } from "@/lib/deck/theme";
import {
  FORMATS,
  SHE_SHARP_THEME,
  type Format,
  type Layout,
  type PosterCopy,
  type PosterTheme,
} from "./poster-formats";
import { assertFamiliesDistinct, renderLayer, type TextBox } from "./poster-type";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/img/events");
const REVIEW_DIR = path.join(ROOT, "tmp/poster-review");

/* -------------------------------------------------------------------- copy */

/**
 * Drops a trailing postcode segment, and says what it dropped.
 *
 * "…, Auckland Central, Auckland 1010" is a delivery address; a poster wants the
 * part someone navigates by. Silence here would be the bug — an address mangled
 * by a regex looks exactly like an address that was typed that way.
 */
function tidyAddress(address: string): string {
  const parts = address.split(",").map((p) => p.trim());
  const dropped: string[] = [];

  while (parts.length > 2 && /^[A-Za-z .'-]+ \d{4}$/.test(parts[parts.length - 1])) {
    dropped.push(parts.pop() as string);
  }
  if (dropped.length) {
    console.log(`  address: dropped ${dropped.map((d) => `"${d}"`).join(", ")}`);
  }
  return parts.join(", ");
}

/** Title → [headline, tail]. See the note at the call site for the rules. */
function splitTitle(title: string): string[] {
  const dashed = title.split(/\s+[—–-]\s+/);
  if (dashed.length > 1) return dashed;

  const colon = title.match(/^([^:]{1,28}):\s+(.+)$/);
  if (colon && colon[1].trim().split(/\s+/).length <= 4) {
    return [colon[1], colon[2]];
  }
  return [title];
}

function copyFor(slug: string, strapline?: string): PosterCopy {
  const event = loadEventForDeck(slug);
  const detail = event.detailPageData;
  const partner = partnerLogosFrom(event)[0];

  // The same split `deckTitleFrom()` uses, and for the same documented reason:
  // cut at the first SPACED dash, never at a comma. "No Pain, All Gain – Getting
  // Fit for AI" is the exact title that rule was written for; splitting it on
  // the comma yields the headline "No Pain".
  //
  // A colon is the other structural separator organisers use — "Working Smarter:
  // AI, MYOB, and the New Delivery Landscape" — and unsplit it sets as one
  // 52-character display line, which solves to caption size in every format and
  // reads as a caption. It is taken ONLY when the part before it is short enough
  // to be a headline on its own; a colon inside a sentence ("Three things we
  // learned: why AI…") must not become the headline, so the guard is the point
  // rather than a tidy-up of the regex.
  const [lead, ...rest] = splitTitle(event.title.trim());

  return {
    titleLead: lead.trim(),
    titleTail: rest.join(" – ").trim(),
    subtitle: detail.subtitle?.trim() || undefined,
    // A framing sentence is the artefact's, not the event record's — the same
    // division `lib/deck/boilerplate.ts` already makes between facts and
    // wording. It is optional: with none given the posters simply carry the
    // title and the facts, which is the honest default. Do NOT reach into
    // `fullDescription` for one; it is paragraphs, and truncating a paragraph
    // produces a sentence nobody wrote.
    strapline,
    date: formatEventDate(event, "full"),
    // NZST is kept, which is a deliberate divergence from the deck. The deck's
    // `tidyTimeRange()` strips it because everyone in the room shares the
    // projector's timezone; a poster is shared on LinkedIn, where they do not.
    time: (detail.time ?? "").trim(),
    venue: detail.location?.venueName?.trim() ?? "",
    address: detail.location?.address ? tidyAddress(detail.location.address) : undefined,
    partner,
    hasRsvp: Boolean(detail.registrationUrl?.trim()),
  };
}

/**
 * The colours, in the order that keeps a poster and a projector agreeing.
 *
 * An event that already has a deck has already had its accent derived from
 * artwork and run through the contrast fixer, so reusing it means the two are
 * one piece of art direction rather than two that happen to be near each other.
 * Only when there is no deck does this fall back to the brand default — and the
 * flags exist for the case where the poster comes FIRST and the deck will be
 * built from it, which is the order `build-event-slides` now recommends.
 */
function themeFor(slug: string, override: Partial<PosterTheme>): PosterTheme {
  const deck = getAllDecks().find((d) => d.slug === slug || d.eventSlug === slug);
  const fromDeck = deck?.theme?.accent;

  const base: PosterTheme = fromDeck
    ? { accent: fromDeck.onDark, spark: fromDeck.spark, canvas: SHE_SHARP_THEME.canvas }
    : SHE_SHARP_THEME;

  const theme = { ...base, ...override };
  console.log(
    `  theme: accent ${theme.accent}, spark ${theme.spark}` +
      (fromDeck ? " (from this event's deck)" : " (She Sharp default — no deck yet)"),
  );
  return theme;
}

/* ---------------------------------------------------------------- pipeline */

/**
 * Plate → ground, at the format's exact pixel size.
 *
 * `extract()` and `resize()` are two separate `sharp()` calls on purpose.
 * `scripts/deck/build-keynote-plate.ts` records that sharp keeps only the LAST
 * `resize()` in a chain, so a crop followed by a scale silently discards the
 * crop; the safest reading is never to put the two in one chain at all.
 */
async function ground(plate: string, format: Format, layout: Layout): Promise<Buffer> {
  const meta = await sharp(plate).metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;

  const window = {
    top: Math.round(srcH * layout.crop.top),
    height: Math.round(srcH * (layout.crop.bottom - layout.crop.top)),
  };

  // Centre a window of the format's aspect ratio inside the allowed rows. A
  // landscape format needs far less height than the plate has, so this is what
  // keeps the subject in frame rather than taking the top of it.
  const want = Math.round(srcW / (format.width / format.height));
  const height = Math.min(want, window.height);
  const top = window.top + Math.round((window.height - height) / 2);

  const cropped = await sharp(plate)
    .extract({ left: 0, top, width: srcW, height })
    .png()
    .toBuffer();

  const scaled = await sharp(cropped)
    .resize(format.width, format.height, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.6, m1: 0.3, m2: 0.7 })
    .png()
    .toBuffer();

  /* Grain does three jobs and only one of them is texture: it dithers the
     near-black gradients that would otherwise band visibly in 8-bit, it carries
     the file into its size band (a flat near-black frame encodes below the
     floor), and it delivers the "fine natural film grain" the plate prompt asked
     the generator for. */
  const grain = await sharp({
    create: {
      width: format.width,
      height: format.height,
      channels: 3,
      background: "#808080",
      noise: { type: "gaussian", mean: 128, sigma: 6 },
    },
  })
    .blur(0.4)
    .png()
    .toBuffer();

  return sharp(scaled)
    .composite([{ input: grain, blend: "overlay" }])
    .png()
    .toBuffer();
}

/**
 * Refuses to ship type nobody can read.
 *
 * Two assertions rather than one, because the mean hides the failure that
 * actually happens. A single bright highlight running through a counter barely
 * moves the average of a box while making the word it crosses unreadable, so the
 * peak is checked separately.
 *
 * Note the `.toBuffer()` between `extract()` and `stats()`: **`sharp().stats()`
 * reads the input image and ignores the queued pipeline**, so measuring a box
 * without rendering the crop first silently measures the whole frame.
 */
async function gate(image: Buffer, boxes: TextBox[], quiet: boolean): Promise<void> {
  const meta = await sharp(image).metadata();
  const failures: string[] = [];

  for (const box of boxes) {
    const left = Math.max(0, box.left);
    const top = Math.max(0, box.top);
    const width = Math.min(box.width, (meta.width ?? 0) - left);
    const height = Math.min(box.height, (meta.height ?? 0) - top);
    if (width <= 0 || height <= 0) continue;

    const crop = await sharp(image).extract({ left, top, width, height }).toBuffer();
    const stats = await sharp(crop).stats();

    const hex = (pick: (c: (typeof stats.channels)[0]) => number) =>
      "#" +
      stats.channels
        .slice(0, 3)
        .map((c) => Math.round(pick(c)).toString(16).padStart(2, "0"))
        .join("");

    const mean = hex((c) => c.mean);
    const ratio = contrastRatio(box.ink, mean);
    const peak = relativeLuminance(hex((c) => c.max));

    const verdict =
      ratio < 4.5
        ? `contrast ${ratio.toFixed(2)}:1 against ${mean}`
        : peak > 0.42
          ? `a highlight at luminance ${peak.toFixed(2)} runs through it`
          : "";

    if (!quiet || verdict) {
      console.log(
        `    ${verdict ? "✗" : "✓"} ${box.name.padEnd(30)} ${ratio.toFixed(2)}:1  peak ${peak.toFixed(2)}`,
      );
    }
    if (verdict) failures.push(`${box.name} — ${verdict}`);
  }

  if (failures.length) {
    throw new Error(
      `Type would be hard to read:\n  ${failures.join("\n  ")}\n` +
        "Deepen the scrim, move the line, or choose a plate with darker ground under it.",
    );
  }
}

/**
 * Encodes into the format's size band and says where it landed.
 *
 * `writeFileSync`, NOT `sharp(out).toFile()`: `out` is already encoded, and
 * handing it back to sharp decodes and re-encodes it at sharp's default quality,
 * so the file on disk is neither the buffer that was measured nor the quality
 * about to be printed. The first version reported 101 kB at q86 and wrote 80 kB.
 *
 * Grain and file size are the same lever. If a format overshoots its ceiling,
 * drop the grain sigma before dropping quality — losing texture costs less than
 * losing the edges of the type.
 */
async function encode(
  image: Buffer,
  format: Format,
  kind: "webp" | "jpeg",
  file: string,
): Promise<number> {
  let quality = kind === "jpeg" ? 86 : 82;
  let out = Buffer.alloc(0);

  for (let attempt = 0; attempt < 6; attempt++) {
    const pipeline = sharp(image);
    out =
      kind === "jpeg"
        ? await pipeline.jpeg({ quality, chromaSubsampling: "4:4:4", mozjpeg: true }).toBuffer()
        : await pipeline.webp({ quality, effort: 6, smartSubsample: true }).toBuffer();

    if (out.length >= format.bytes.min && out.length <= format.bytes.max) break;
    quality += out.length < format.bytes.min ? 4 : -4;
    quality = Math.max(58, Math.min(96, quality));
  }

  writeFileSync(file, out);
  console.log(
    `  → ${path.relative(ROOT, file)} — ${format.width}×${format.height}, ` +
      `${Math.round(out.length / 1024)} kB ${kind} at q${quality}`,
  );
  return out.length;
}

/**
 * Crop previews for the one format that is also a website asset.
 *
 * These, not the full image, are what a review actually looks at: each mirrors
 * one component's `object-cover` and is the only way to see what a visitor sees.
 */
async function previews(social: Buffer, slug: string): Promise<void> {
  mkdirSync(REVIEW_DIR, { recursive: true });

  const crops: [string, number, number, "centre" | "top"][] = [
    ["cover-16x9", 1080, 608, "centre"], // events/event-card.tsx
    ["cover-4x3", 1080, 810, "top"], // home/events-showcase-section.tsx
    ["cover-1x1", 1080, 1080, "centre"], // …the same, at md
    ["cover-21x9", 1080, 495, "centre"], // event-detail/event-header.tsx, worst case
  ];

  for (const [name, w, h, position] of crops) {
    const top = position === "top" ? 0 : Math.round((1350 - h) / 2);
    const cut = await sharp(social)
      .extract({ left: 0, top, width: w, height: h })
      .png()
      .toBuffer();
    // Separate call — see the one-resize() gotcha above.
    await sharp(cut)
      .resize(900)
      .webp({ quality: 82 })
      .toFile(path.join(REVIEW_DIR, `${slug}-${name}.webp`));
  }
  console.log(`  → ${path.relative(ROOT, REVIEW_DIR)}/ (4 cover crop previews)`);
}

/* --------------------------------------------------------------------- cli */

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const flag = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const slug = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
  const plate = flag("plate");
  const suffix = flag("suffix");
  const only = flag("only")
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (!slug || !plate) {
    console.error(
      "Usage: npx tsx scripts/events/build-event-poster.ts <event-slug> --plate <file.png>\n" +
        `       [--only ${FORMATS.map((f) => f.key).join(",")}] [--suffix v2]\n` +
        "       [--accent '#rrggbb'] [--spark '#rrggbb'] [--strapline '...'] [--no-gate]",
    );
    process.exit(1);
  }
  if (!existsSync(plate)) {
    console.error(`Plate not found: ${plate}`);
    process.exit(1);
  }

  const chosen = only ? FORMATS.filter((f) => only.includes(f.key)) : FORMATS;
  if (chosen.length === 0) {
    console.error(
      `No format matched --only. Known: ${FORMATS.map((f) => f.key).join(", ")}`,
    );
    process.exit(1);
  }

  assertFamiliesDistinct();
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`${slug}\n  plate: ${plate}`);
  const theme = themeFor(slug, {
    ...(flag("accent") ? { accent: flag("accent") as string } : {}),
    ...(flag("spark") ? { spark: flag("spark") as string } : {}),
  });
  const copy = copyFor(slug, flag("strapline"));

  for (const format of chosen) {
    console.log(`\n${format.key} ${format.width}×${format.height} — ${format.usedFor}`);

    const layout = format.build(copy, theme);
    layout.assert?.(layout.boxes);

    // Plate → scrim → GATE → type. The gate has to sit between the scrim and the
    // type, because the ground it is asked about is the scrimmed one. Built into
    // one layer, it measured the bare plate and reported the same value however
    // far the scrim was deepened.
    const base = await sharp(await ground(plate, format, layout))
      .composite([{ input: renderLayer(layout.scrim) }])
      .png()
      .toBuffer();

    if (!argv.includes("--no-gate")) await gate(base, layout.boxes, true);

    const composed = await sharp(base)
      .composite([{ input: renderLayer(layout.type) }])
      .png()
      .toBuffer();

    // One artwork, one file per encoding it needs. Several formats need two:
    // a JPEG that an Instagram or Humanitix uploader will definitely accept,
    // and a WebP for anywhere on the website. Same pixels, different door.
    for (const kind of format.encode) {
      const ext = kind === "jpeg" ? "jpg" : "webp";
      const name = `${slug}-${format.key}${suffix ? `-${suffix}` : ""}.${ext}`;
      await encode(composed, format, kind, path.join(OUT_DIR, name));
    }

    if (format.key === "social") await previews(composed, slug);
  }

  console.log(
    "\nLook at the cover crops first — a headline that survives the 16:9 band has cleared the hardest constraint.",
  );
}

main().catch((error) => {
  console.error(`\n${(error as Error).message}`);
  process.exit(1);
});
