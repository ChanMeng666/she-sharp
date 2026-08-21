/**
 * Builds every poster size one event needs, from one generated plate.
 *
 * WHY THE TYPE IS SET IN CODE. The plate (`generate-poster-plate.ts`) carries no
 * words and no marks by design. Everything a reader has to read is set here,
 * against the event's own record in `lib/data/json/events-custom.json`, so the
 * date on a poster and the date on the website cannot disagree and a correction
 * is an edit rather than a redesign.
 *
 * WHY A LAYOUT PER ASPECT AND NOT ONE CROPPED SIX TIMES. A 2:1 Humanitix banner,
 * a 4:5 feed post and a 9:16 story cannot be the same composition — cropping to
 * satisfy one loses either the headline or the facts in the others. Two sizes
 * that share an ASPECT do share a layout, drawn once and downscaled; see
 * `Format.composeAt`. The design lives in `poster-formats.ts`; this file is the
 * machine that drives it.
 *
 * TWO SETS OF ARTWORK, ONE CAMPAIGN. Without a flag this builds the EVENT set —
 * the six sizes that announce the evening, and that can be posted once.
 * `--speaker` builds the per-person set instead, and `--lineup` the whole group
 * on one tile. Those exist because She Sharp promotes an event for weeks: the
 * speaker posters are what keeps it in a feed without repeating a picture, and
 * every one of them reads its date and venue from the same record, so a
 * six-week campaign cannot drift away from the website. Their design lives in
 * `poster-speaker-formats.ts`.
 *
 *   npx tsx scripts/events/build-event-poster.ts <event-slug> --plate <file.png>
 *          [--only social,humanitix] [--suffix v2] [--accent "#c846ab"]
 *          [--spark "#5ee7f5"] [--strapline "..."] [--no-gate]
 *          [--speaker <name-slug>|all] [--lineup] [--role "Panellist"]
 *          [--hook "..."] [--hook-file <json>] [--name-size 128]
 *
 * Writes `public/img/events/<slug>/<format>[-<suffix>].<ext>`, the crop
 * previews that matter into `tmp/poster-review/`, and a generated `index.ts`
 * manifest naming every file beside them that no page renders.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { formatEventDate } from "@/lib/data/events";
import {
  SPEAKER_GROUP_ORDER,
  loadEventForDeck,
  partnerLogosFrom,
} from "@/lib/deck/event-source";
import { getAllDecks } from "@/lib/deck/registry";
import { contrastRatio, relativeLuminance } from "@/lib/deck/theme";
import type { EventSpeakerGroup, EventSpeakerV3, EventV3 } from "@/types/event";
import {
  FORMATS,
  SHE_SHARP_THEME,
  type Layout,
  type PosterCopy,
  type PosterTheme,
} from "./poster-formats";
import {
  LINEUP_FORMATS,
  SPEAKER_FORMATS,
  assertHook,
  roleLabelFor,
  solveNameSize,
  type LineupCopy,
  type SpeakerCopy,
} from "./poster-speaker-formats";
import {
  assertFamiliesDistinct,
  renderLayer,
  renderPortrait,
  speakerSlug,
  type TextBox,
} from "./poster-type";

const ROOT = process.cwd();
/** Every asset for an event lives in its own folder; see the events README. */
const EVENTS_ROOT = path.join(ROOT, "public/img/events");
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

/* ---------------------------------------------------------------- speakers */

/** One person, plus the group they were listed under. */
export interface RosterEntry {
  person: EventSpeakerV3;
  groupKey: string;
  heading: string;
  slug: string;
}

/**
 * Everyone on the event, in a stable order, with their fields untruncated.
 *
 * NOT `speakerGroupsFrom()`, and the reason is written at `SPEAKER_GROUP_ORDER`
 * in `lib/deck/event-source.ts`: that accessor clamps a job title to six words
 * for a slide, and a poster has a whole column to set it in. The ORDER is
 * imported rather than restated, because two lists of the same ten group keys
 * would drift and the drift would be invisible — the same event would simply
 * produce a different first poster on a later run.
 */
export function rosterFor(event: EventV3): RosterEntry[] {
  const groups = (event.detailPageData.speakers ?? {}) as Record<
    string,
    EventSpeakerGroup | undefined
  >;

  return SPEAKER_GROUP_ORDER.flatMap((groupKey) => {
    const group = groups[groupKey];
    return (group?.speakers ?? [])
      .filter((person) => person?.name?.trim())
      .map((person) => ({
        person,
        groupKey,
        heading: group?.heading?.trim() || "",
        slug: speakerSlug(person.name),
      }));
  });
}

/**
 * One person, as a poster's copy — or a refusal naming them.
 *
 * THE HEADSHOT IS NOT OPTIONAL AND HAS NO FALLBACK. Two of the fifty-nine
 * speakers in `events-custom.json` carry `image: ""`, and a path that IS in the
 * JSON whose file was never committed is just as common, because the record and
 * the file are written by different steps of `sync-event-from-slack`. Either way
 * the failure without this check happens deep inside sharp as `Input file is
 * missing` — a stack trace, which the skill's fourth guardrail forbids handing
 * to an organiser. And a speaker poster with no face is not a degraded speaker
 * poster; it is the event poster with somebody's name on it.
 */
export function speakerCopyFor(
  entry: RosterEntry,
  opts: { role?: string; hook?: string; nameSize: number },
): SpeakerCopy {
  const image = entry.person.image?.trim();
  if (!image) {
    throw new Error(
      `${entry.person.name} has no photograph in the event record.\n` +
        "Add one to lib/data/json/events-custom.json — the event page shows the same file, " +
        "so it is worth having either way. Headshots live beside the event's other assets " +
        "as public/img/events/<slug>/<firstname-lastname>.jpg.",
    );
  }
  const file = path.join("public", image.replace(/^\//, ""));
  if (!existsSync(path.join(ROOT, file))) {
    throw new Error(
      `${entry.person.name}'s photograph is listed as "${image}" but there is no file there.\n` +
        "Either the image was never committed or the path in events-custom.json is stale.",
    );
  }

  const role = roleLabelFor(entry.groupKey, entry.heading, opts.role);
  return {
    slug: entry.slug,
    role: role.label,
    name: entry.person.name.trim(),
    title: entry.person.title?.trim() || undefined,
    company: entry.person.company?.trim() || undefined,
    portrait: file,
    hook: opts.hook ? assertHook(opts.hook, entry.person.name) : undefined,
    nameSize: opts.nameSize,
  };
}

/** Artwork this event ships that no page renders, so nothing else points at it. */
const UNRENDERED = [
  /* One person, or the whole group, on a tile that gets posted by hand. */
  /^(speaker-.+|lineup)-[a-z0-9-]+\.jpg$/,
  /* The mailing-list banner. Referenced by an absolute https URL inside a
     generated MessageSpec under gitignored `tmp/`, which is not a reference the
     reverse check can see — and the spec is rebuilt for every send, so it never
     will be. Naming it here is what stops it reading as an orphan. */
  /^email(-[a-z0-9]+)?\.jpg$/,
];

/**
 * The generated manifest that keeps the campaign out of the orphan list.
 *
 * WHY A FILE RATHER THAN AN ENTRY IN `KNOWN_UNREFERENCED`. A dozen files per
 * event cannot be hand-listed in that array and have the array stay read, and a
 * regex allow-list would be worse: its whole virtue is that an entry which stops
 * being true FAILS, and a pattern never goes stale — it would quietly become the
 * place broken things go to be forgotten, which is exactly what its own comment
 * warns about.
 *
 * `scripts/assets/refs.ts` already scans `public/**` for `.ts`, precisely
 * because `public/img/curated/index.ts` and `public/img/plates/index.ts` are
 * generated manifests inside the asset tree and are the sole reference for ~143
 * images. This is the same shape of thing, so it needs no change to any gate —
 * and it makes the FORWARD check cover these too, so deleting a poster fails CI
 * instead of CI staying green while somebody's scheduled post loses its picture.
 *
 * Per-event rather than one global list, so deleting an event's folder deletes
 * its manifest with it and a stale entry is structurally impossible. Rebuilt by
 * scanning the directory, so it is idempotent and self-healing after a rename.
 */
function writeAssetManifest(slug: string, event: EventV3): void {
  const dir = path.join(EVENTS_ROOT, slug);
  const files = readdirSync(dir)
    .filter((f) => UNRENDERED.some((pattern) => pattern.test(f)))
    .sort();
  const manifest = path.join(dir, "index.ts");

  if (files.length === 0) return;

  const row = (file: string, subject: string, alt: string): string =>
    `  {\n` +
    `    file: "/img/events/${slug}/${file}",\n` +
    `    subject: ${JSON.stringify(subject)},\n` +
    `    alt: ${JSON.stringify(alt)},\n` +
    `  },`;

  const roster = new Map(rosterFor(event).map((e) => [e.slug, e]));
  const rows = files.map((file) => {
    if (file.startsWith("email")) {
      return row(
        file,
        event.title,
        `${event.title} — the banner She Sharp's mailing-list announcement opens with.`,
      );
    }
    const speaker = file.startsWith("speaker-")
      ? [...roster.keys()].find((s) => file.startsWith(`speaker-${s}-`))
      : undefined;
    const person = speaker ? roster.get(speaker) : undefined;
    const group = [...roster.values()][0];
    const who = person ? person.person.name : group?.heading || "The speakers";
    const alt = person
      ? `${who} — a She Sharp promotional graphic for ${event.title}.`
      : `${who}: every speaker at ${event.title}, on one She Sharp promotional graphic.`;
    return row(file, who, alt);
  });

  writeFileSync(
    manifest,
    `// AUTO-GENERATED by scripts/events/build-event-poster.ts — do not edit by hand.\n` +
      `//\n` +
      `// Promotional graphics for this event that no page on the website renders:\n` +
      `// the speaker and line-up tiles, posted to LinkedIn and Instagram one at a\n` +
      `// time over the weeks before the event, and the mailing-list banner, which an\n` +
      `// email links by absolute URL. Naming them here rather than in\n` +
      `// scripts/verify-image-paths.ts means the forward check guards them too —\n` +
      `// delete one and CI fails, instead of CI staying green while a scheduled post\n` +
      `// loses its picture or an announcement goes out with a hole in it.\n` +
      `//\n` +
      `// NEVER point coverImage.url at one of these. A speaker poster has no safe\n` +
      `// band, so an event card would crop the person's name away, and the email\n` +
      `// banner is 2:1 — the website's cover is the 4:5 social WebP, which carries\n` +
      `// the band every card crop was checked against.\n` +
      `\n` +
      `export interface PromoGraphic {\n` +
      `  file: string;\n` +
      `  subject: string;\n` +
      `  alt: string;\n` +
      `}\n` +
      `\n` +
      `export const promoGraphics: PromoGraphic[] = [\n${rows.join("\n")}\n];\n`,
    "utf8",
  );
  console.log(`  → ${path.relative(ROOT, manifest)} — ${files.length} files named`);
}

/* ---------------------------------------------------------------- pipeline */

/**
 * What the machine needs to know about a format, whatever kind it is.
 *
 * `Format`, `SpeakerFormat` and `LineupFormat` differ only in what their `build`
 * takes; everything from the crop to the encoder is the same job. Naming that
 * shared shape is what lets one pipeline drive all three rather than three
 * pipelines drifting apart — which they would, because the interesting bugs in
 * here (`stats()` ignoring the queued pipeline, sharp keeping only the last
 * `resize()`, `toFile()` re-encoding an encoded buffer) are all in the part that
 * would have been copied.
 */
interface RenderSpec {
  key: string;
  width: number;
  height: number;
  /** Draw at this size, then downscale to `width`×`height`. See `Format`. */
  composeAt?: { width: number; height: number };
  encode: readonly ("webp" | "jpeg")[];
  bytes: { min: number; max: number };
  usedFor: string;
}

/**
 * Plate → ground, at the format's exact pixel size.
 *
 * `extract()` and `resize()` are two separate `sharp()` calls on purpose.
 * `scripts/deck/build-keynote-plate.ts` records that sharp keeps only the LAST
 * `resize()` in a chain, so a crop followed by a scale silently discards the
 * crop; the safest reading is never to put the two in one chain at all.
 */
async function ground(plate: string, format: RenderSpec, layout: Layout): Promise<Buffer> {
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
  format: RenderSpec,
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

/**
 * One layout → the files on disk.
 *
 * PLATE → SCRIM → PORTRAIT → GATE → TYPE, and every arrow is load-bearing.
 *
 * The gate sits between the scrim and the type because the ground it is asked
 * about is the scrimmed one; built into a single layer it measured the bare
 * plate and reported the same number however far the scrim was deepened.
 *
 * The PORTRAIT sits in front of the gate for the mirror-image reason. A real
 * photograph is part of the ground a line of type lands on, so a name that
 * strays onto a lit cheek has to be measured against the face rather than
 * against the wash behind it. Composited after the gate it would pass every
 * check and ship unreadable.
 */
async function renderFormat(args: {
  plate: string;
  spec: RenderSpec;
  layout: Layout;
  slug: string;
  /** The filename without its extension. */
  stem: string;
  gate: boolean;
  previews: boolean;
}): Promise<void> {
  const { spec, layout } = args;
  console.log(`\n${args.stem} — ${spec.width}×${spec.height}, ${spec.usedFor}`);

  layout.assert?.(layout.boxes);

  /* Everything up to the last step happens in the LAYOUT's coordinate system,
     not the file's. A `build` hardcodes its own W and H, and the gate measures
     `layout.boxes` in those same numbers — so a format that ships smaller than
     it draws has to keep the ground, the portraits, the gate and the type all at
     `composeAt`, and shrink only the finished frame. Resizing earlier would
     composite one coordinate system onto another and gate the wrong pixels. */
  const drawn: RenderSpec = spec.composeAt
    ? { ...spec, width: spec.composeAt.width, height: spec.composeAt.height }
    : spec;

  let base = await sharp(await ground(args.plate, drawn, layout))
    .composite([{ input: renderLayer(layout.scrim) }])
    .png()
    .toBuffer();

  for (const portrait of layout.portraits ?? []) {
    base = await sharp(base)
      .composite([
        { input: await renderPortrait(portrait), left: portrait.left, top: portrait.top },
      ])
      .png()
      .toBuffer();
  }

  if (args.gate) await gate(base, layout.boxes, true);

  const composed = await sharp(base)
    .composite([{ input: renderLayer(layout.type) }])
    .png()
    .toBuffer();

  // Separate `sharp()` call rather than a chained resize — see the one-resize()
  // gotcha in `ground()`. Downscaling here rather than at the start is what
  // supersamples the type: edges drawn at 3200 and resampled land cleaner than
  // the same edges drawn at 1200.
  const final = spec.composeAt
    ? await sharp(composed)
        .resize(spec.width, spec.height, { kernel: "lanczos3" })
        .png()
        .toBuffer()
    : composed;

  // One artwork, one file per encoding it needs. Several event formats need two:
  // a JPEG that an Instagram or Humanitix uploader will definitely accept, and a
  // WebP for anywhere on the website. Same pixels, different door.
  for (const kind of spec.encode) {
    const ext = kind === "jpeg" ? "jpg" : "webp";
    await encode(final, spec, kind, path.join(EVENTS_ROOT, args.slug, `${args.stem}.${ext}`));
  }

  if (args.previews) await previews(final, args.slug);
}

/* --------------------------------------------------------------------- cli */

/** `{ "keryn-mckenzie": "Where AI meets the finance team" }` */
function readHooks(file: string): Record<string, string> {
  const parsed = JSON.parse(readFileSync(path.resolve(file), "utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      `${file} should be a JSON object mapping a speaker's name-slug to their one-line hook, ` +
        'e.g. { "keryn-mckenzie": "Where AI meets the finance team" }.',
    );
  }
  return parsed as Record<string, string>;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const flag = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const slug = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
  const plate = flag("plate");
  const suffix = flag("suffix");
  const speaker = flag("speaker");
  const lineup = argv.includes("--lineup");
  const runGate = !argv.includes("--no-gate");
  const only = flag("only")
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (!slug || !plate) {
    console.error(
      "Usage: npx tsx scripts/events/build-event-poster.ts <event-slug> --plate <file.png>\n" +
        `       [--only ${FORMATS.map((f) => f.key).join(",")}] [--suffix v2]\n` +
        "       [--accent '#rrggbb'] [--spark '#rrggbb'] [--strapline '...'] [--no-gate]\n" +
        "\n" +
        "  The speaker set, for the weeks before the event:\n" +
        "       [--speaker <name-slug>|all] [--role 'Panellist']\n" +
        "       [--hook '...'] [--hook-file <json>] [--name-size 128]\n" +
        "       [--lineup]  the whole group on one tile",
    );
    process.exit(1);
  }
  if (!existsSync(plate)) {
    console.error(`Plate not found: ${plate}`);
    process.exit(1);
  }

  assertFamiliesDistinct();
  mkdirSync(path.join(EVENTS_ROOT, slug), { recursive: true });

  console.log(`${slug}\n  plate: ${plate}`);
  const theme = themeFor(slug, {
    ...(flag("accent") ? { accent: flag("accent") as string } : {}),
    ...(flag("spark") ? { spark: flag("spark") as string } : {}),
  });
  const copy = copyFor(slug, flag("strapline"));
  const stem = (name: string) => `${name}${suffix ? `-${suffix}` : ""}`;

  if (speaker || lineup) {
    await buildSpeakerSet({
      slug,
      plate,
      copy,
      theme,
      speaker,
      lineup,
      only,
      stem,
      gate: runGate,
      role: flag("role"),
      hook: flag("hook"),
      hookFile: flag("hook-file"),
      nameSize: flag("name-size") ? Number(flag("name-size")) : undefined,
    });
    return;
  }

  const chosen = only ? FORMATS.filter((f) => only.includes(f.key)) : FORMATS;
  if (chosen.length === 0) {
    console.error(
      `No format matched --only. Known: ${FORMATS.map((f) => f.key).join(", ")}`,
    );
    process.exit(1);
  }

  for (const format of chosen) {
    await renderFormat({
      plate,
      spec: format,
      layout: format.build(copy, theme),
      slug,
      // The slug is the directory now, not a filename prefix, so the name is
      // just the role: poster.webp, social.jpg, story.webp.
      stem: stem(format.key),
      gate: runGate,
      previews: format.key === "social",
    });
  }

  // The event set can now put an unrendered file in the folder too — the email
  // banner, which only a generated MessageSpec ever names. Rebuilt by scanning
  // the directory, so running this after any subset is safe: it re-states what
  // is there rather than appending to what was.
  writeAssetManifest(slug, loadEventForDeck(slug));

  console.log(
    "\nLook at the cover crops first — a headline that survives the 16:9 band has cleared the hardest constraint.",
  );
}

/**
 * The campaign set: one poster per person, and optionally the whole line-up.
 *
 * `--speaker all` DOES NOT STOP AT THE FIRST REFUSAL. A missing headshot is a
 * per-person problem, and dying on it would hand back one poster out of four
 * with no way to tell whether the other three were fine. Everyone who can be
 * built is built, everything that could not is listed at the end, and the exit
 * code is non-zero so a script still knows. A single named speaker fails
 * immediately, because there the refusal IS the answer.
 */
async function buildSpeakerSet(o: {
  slug: string;
  plate: string;
  copy: PosterCopy;
  theme: PosterTheme;
  speaker?: string;
  lineup: boolean;
  only?: string[];
  stem: (name: string) => string;
  gate: boolean;
  role?: string;
  hook?: string;
  hookFile?: string;
  nameSize?: number;
}): Promise<void> {
  const event = loadEventForDeck(o.slug);
  const roster = rosterFor(event);
  if (roster.length === 0) {
    throw new Error(
      `${o.slug} lists no speakers, so there is nobody to make a poster of.\n` +
        "Speakers live under detailPageData.speakers in lib/data/json/events-custom.json; " +
        "/sync-event-from-slack is what normally fills them in.",
    );
  }

  const wanted =
    !o.speaker || o.speaker === "all"
      ? roster
      : roster.filter((entry) => entry.slug === o.speaker);
  if (o.speaker && o.speaker !== "all" && wanted.length === 0) {
    throw new Error(
      `No speaker on ${o.slug} is called "${o.speaker}".\n` +
        `This event has: ${roster.map((e) => e.slug).join(", ")}`,
    );
  }

  const hooks = o.hookFile ? readHooks(o.hookFile) : {};
  const formats = o.only
    ? SPEAKER_FORMATS.filter((f) => o.only?.includes(f.key))
    : SPEAKER_FORMATS;

  /* One display size for every name in the run — see `SpeakerCopy.nameSize`.
     Solved against the narrowest column and the smallest cap in the set, so the
     one number is safe in all three formats. `--name-size` is for the case where
     one poster is rebuilt later and has to match the set it belongs to; without
     it a solo rebuild would set that name larger than its four neighbours. */
  const column = Math.min(...formats.map((f) => f.column));
  const nameMax = Math.min(...formats.map((f) => f.nameMax));
  const nameSize =
    o.nameSize ?? solveNameSize(wanted.map((e) => e.person.name), column, nameMax);
  console.log(`  name size: ${nameSize.toFixed(0)}pt, shared by all ${wanted.length} poster(s)`);

  const single = Boolean(o.speaker && o.speaker !== "all");
  const refused: string[] = [];
  const built: string[] = [];
  const people: SpeakerCopy[] = [];

  for (const entry of wanted) {
    let person: SpeakerCopy;
    try {
      person = speakerCopyFor(entry, {
        role: o.role,
        hook: o.hook && single ? o.hook : hooks[entry.slug],
        nameSize,
      });
    } catch (error) {
      if (single) throw error;
      refused.push(`${entry.person.name} — ${(error as Error).message.split("\n")[0]}`);
      continue;
    }
    people.push(person);

    const label = roleLabelFor(entry.groupKey, entry.heading, o.role);
    console.log(
      `\n${person.name} — kicker "${person.role}" (from the ${label.from}` +
        (label.from === "heading" ? ` "${label.heading}"` : "") +
        `)${person.hook ? `, hook "${person.hook}"` : ""}`,
    );

    if (o.speaker) {
      for (const format of formats) {
        try {
          await renderFormat({
            plate: o.plate,
            spec: format,
            layout: format.build(o.copy, person, o.theme),
            slug: o.slug,
            stem: o.stem(`speaker-${person.slug}-${format.key}`),
            gate: o.gate,
            previews: false,
          });
          built.push(`speaker-${person.slug}-${format.key}`);
        } catch (error) {
          if (single) throw error;
          refused.push(`${person.name} at ${format.key} — ${(error as Error).message.split("\n")[0]}`);
        }
      }
    }
  }

  if (o.lineup) {
    // The line-up carries one group, not everyone: "Meet the Panel" and "Meet
    // the Mentors" are two posts, and merging them produces a tile with a
    // heading that is true of half the faces on it.
    const first = wanted[0];
    const group = wanted.filter((e) => e.groupKey === first.groupKey);
    const lineupCopy: LineupCopy = {
      heading: first.heading || "Our speakers",
      people: people.filter((p) => group.some((e) => e.slug === p.slug)),
    };
    for (const format of o.only
      ? LINEUP_FORMATS.filter((f) => o.only?.includes(f.key))
      : LINEUP_FORMATS) {
      await renderFormat({
        plate: o.plate,
        spec: format,
        layout: format.build(o.copy, lineupCopy, o.theme),
        slug: o.slug,
        stem: o.stem(`lineup-${format.key}`),
        gate: o.gate,
        previews: false,
      });
      built.push(`lineup-${format.key}`);
    }
  }

  writeAssetManifest(o.slug, event);

  console.log(`\n${built.length} file(s) built.`);
  if (refused.length) {
    console.error(`\n${refused.length} could not be built:`);
    for (const line of refused) console.error(`  ${line}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    "Post the line-up first, then one speaker a week. Every one of them reads its date " +
      "and venue from the event record, so the set cannot drift away from the website.",
  );
}

/**
 * Run only when this file IS the command, so the module can also be imported.
 *
 * `poster-speaker.test.ts` needs `rosterFor()` and `speakerCopyFor()`, which are
 * the machine's reading of the event record and belong here beside `copyFor()`
 * rather than in the design layer. Without this guard, importing them would run
 * the CLI, print a usage error and exit 1 — so the test would be untestable for
 * the sake of three lines.
 */
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  main().catch((error) => {
    console.error(`\n${(error as Error).message}`);
    process.exit(1);
  });
}
