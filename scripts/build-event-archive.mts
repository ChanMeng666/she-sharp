/**
 * build-event-archive.mts — incremental generator for event archive photos.
 *
 * Harvests a past event's public Google Photos album (its `galleryUrl`),
 * transcodes a small set to WebP under public/img/events/<slug>/archive/, and
 * merges the entries into lib/data/event-archive-photos.ts. The detail page
 * injects these only for events that ship no on-page photos of their own, and
 * the resources gallery reuses the first two as album thumbnails.
 *
 * INCREMENTAL AND ADDITIVE. It only ever touches the slugs it is asked to
 * build, and merges into the existing data module rather than regenerating it.
 * (The previous version read a one-off scratchpad inventory and rmSync'd the
 * whole archive tree on every run, which meant it could only ever be run once —
 * afterwards it would delete every existing set and rebuild nothing.)
 *
 * Run:
 *   # fill every gap: past events with an album but no photos anywhere
 *   npx tsx scripts/build-event-archive.mts --gaps --dry-run
 *   npx tsx scripts/build-event-archive.mts --gaps
 *
 *   # one or more specific events (re-harvests even if already present)
 *   npx tsx scripts/build-event-archive.mts --slug her-waka-june-2026
 *   npx tsx scripts/build-event-archive.mts --slug a,b --max 4
 *
 *   # what would change, without writing anything
 *   npx tsx scripts/build-event-archive.mts --gaps --dry-run
 */
import sharp from "sharp";
import type { OutputInfo } from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { harvestAlbum } from "./newsletter/harvest-gphotos";
import { getAllEvents, parseDateString } from "../lib/data/events";
import { eventArchivePhotos } from "../lib/data/event-archive-photos";
import type { EventArchivePhoto } from "../lib/data/event-archive-photos";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Each event's harvested set lives at <slug>/archive/ inside the event's own
 *  folder. `archive/` stays a separate sub-folder because this script wipes it
 *  before every rebuild — merging it with the hand-curated photo-N.webp files
 *  beside it would put those in reach of the rmSync below. */
const OUT_IMG_ROOT = path.join(ROOT, "public/img/events");
const OUT_DATA_PATH = path.join(ROOT, "lib/data/event-archive-photos.ts");
const WORK_ROOT = path.join(ROOT, "tmp/event-archive-harvest");

const DEFAULT_MAX = 5; // photos kept per event
const MIN_PER_EVENT = 2; // fewer usable sources than this and we skip the event
const TARGET_WIDTH = 1280; // max rendition width; never upscales
const QUALITY_LADDER = [70, 68, 66, 64];
const PER_IMAGE_BUDGET_BYTES = 220 * 1024;
const HARVEST_OVERFETCH = 4; // grab extras so duplicates can be dropped

/**
 * Perceptual-hash distance below which two images are treated as the same shot.
 * Albums routinely expose several renditions of one photo; they arrive with
 * different bytes, so a checksum will not catch them.
 */
const DHASH_DUPLICATE_MAX_DISTANCE = 6;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
interface Options {
  slugs: string[];
  gaps: boolean;
  dryRun: boolean;
  max: number;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { slugs: [], gaps: false, dryRun: false, max: DEFAULT_MAX };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--gaps") opts.gaps = true;
    else if (arg === "--slug") {
      const value = argv[++i];
      if (!value) fail("--slug needs a value (comma-separated for several).");
      opts.slugs.push(...value.split(",").map((s) => s.trim()).filter(Boolean));
    } else if (arg === "--max") {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value) || value < MIN_PER_EVENT) {
        fail(`--max must be a number >= ${MIN_PER_EVENT}.`);
      }
      opts.max = value;
    } else fail(`Unknown argument "${arg}".`);
  }
  if (!opts.gaps && opts.slugs.length === 0) {
    fail("Nothing to do: pass --gaps to fill every gap, or --slug <slug>.");
  }
  return opts;
}

function fail(message: string): never {
  console.error(`Error: ${message}\n`);
  console.error(
    "Usage:\n" +
      "  npx tsx scripts/build-event-archive.mts --gaps [--dry-run] [--max 5]\n" +
      "  npx tsx scripts/build-event-archive.mts --slug <slug>[,<slug>] [--dry-run] [--max 5]"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Target selection
// ---------------------------------------------------------------------------
interface Target {
  slug: string;
  title: string;
  album: string;
}

/** Events with an album, no on-page photos of their own, and no archive set yet. */
function findGaps(): Target[] {
  const now = Date.now();
  const targets: Target[] = [];
  for (const event of getAllEvents()) {
    const date = parseDateString(event.date);
    if (!date || date.getTime() >= now) continue; // upcoming events have no photos yet
    if ((event.detailPageData.photos?.length ?? 0) > 0) continue; // ships its own
    if ((eventArchivePhotos[event.slug]?.length ?? 0) > 0) continue; // already built
    const album = (event.detailPageData.galleryUrl ?? "").trim();
    if (!album) continue; // nothing to harvest from
    targets.push({ slug: event.slug, title: event.title, album });
  }
  return targets;
}

function resolveSlugs(slugs: string[]): Target[] {
  const all = getAllEvents();
  return slugs.map((slug) => {
    const event = all.find((e) => e.slug === slug);
    if (!event) fail(`No event with slug "${slug}".`);
    const album = (event.detailPageData.galleryUrl ?? "").trim();
    if (!album) fail(`Event "${slug}" has no galleryUrl to harvest from.`);
    return { slug, title: event.title, album };
  });
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------
/**
 * 64-bit difference hash: compare each pixel with its right-hand neighbour on a
 * 9x8 greyscale reduction. Robust to the re-encoding and rescaling that make
 * album renditions of one photo differ byte-for-byte.
 */
async function dHash(file: string): Promise<bigint> {
  const raw = await sharp(file)
    .greyscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer();
  let hash = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = raw[y * 9 + x];
      const right = raw[y * 9 + x + 1];
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return hash;
}

function hammingDistance(a: bigint, b: bigint): number {
  let diff = a ^ b;
  let count = 0;
  while (diff) {
    count += Number(diff & 1n);
    diff >>= 1n;
  }
  return count;
}

/** Keeps the first of each visually distinct shot, preserving album order. */
async function dropVisualDuplicates(files: string[]): Promise<string[]> {
  const kept: { file: string; hash: bigint }[] = [];
  for (const file of files) {
    let hash: bigint;
    try {
      hash = await dHash(file);
    } catch {
      continue; // unreadable source; skip rather than abort the event
    }
    const clash = kept.find(
      (k) => hammingDistance(k.hash, hash) <= DHASH_DUPLICATE_MAX_DISTANCE
    );
    if (clash) {
      console.log(
        `    duplicate of ${path.basename(clash.file)} — dropping ${path.basename(file)}`
      );
      continue;
    }
    kept.push({ file, hash });
  }
  return kept.map((k) => k.file);
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
async function buildEvent(
  target: Target,
  max: number,
  dryRun: boolean
): Promise<EventArchivePhoto[] | null> {
  const { slug, title, album } = target;
  console.log(`\n--- ${slug}`);

  const workDir = path.join(WORK_ROOT, slug);
  let harvested: string[];
  try {
    harvested = await harvestAlbum(album, workDir, max + HARVEST_OVERFETCH);
  } catch (err) {
    console.log(`    HARVEST FAILED: ${(err as Error).message}`);
    return null;
  }
  if (harvested.length === 0) {
    console.log("    no photos returned by the album");
    return null;
  }

  const unique = await dropVisualDuplicates(harvested);
  const selected = unique.slice(0, max);
  console.log(
    `    ${harvested.length} harvested, ${unique.length} distinct, keeping ${selected.length}`
  );
  if (selected.length < MIN_PER_EVENT) {
    console.log(`    SKIPPED — fewer than ${MIN_PER_EVENT} distinct photos`);
    return null;
  }

  const photos: EventArchivePhoto[] = [];
  const outDir = path.join(OUT_IMG_ROOT, slug, "archive");
  if (!dryRun) {
    // Only this slug's directory is cleared, so other events are never touched.
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (let i = 0; i < selected.length; i++) {
    const n = i + 1;
    let data: Buffer | undefined;
    let info: OutputInfo | undefined;
    for (const quality of QUALITY_LADDER) {
      const out = await sharp(selected[i])
        .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer({ resolveWithObject: true });
      data = out.data;
      info = out.info;
      if (out.data.length <= PER_IMAGE_BUDGET_BYTES) break;
    }
    if (!data || !info) continue;

    if (!dryRun) fs.writeFileSync(path.join(outDir, `${n}.webp`), data);
    photos.push({
      src: `/img/events/${slug}/archive/${n}.webp`,
      width: info.width,
      height: info.height,
      alt: `${title} — She Sharp event photo ${n}`,
    });
    console.log(
      `    ${n}.webp  ${info.width}x${info.height}  ${(data.length / 1024).toFixed(0)}KB`
    );
  }

  return photos.length >= MIN_PER_EVENT ? photos : null;
}

/** Rewrites the data module from the merged set, preserving its exact shape. */
function writeDataModule(data: Record<string, EventArchivePhoto[]>): void {
  const entries = Object.entries(data)
    .map(([slug, photos]) => {
      const items = photos
        .map(
          (p) =>
            `    { src: ${JSON.stringify(p.src)}, width: ${p.width}, height: ${p.height}, alt: ${JSON.stringify(p.alt)} },`
        )
        .join("\n");
      return `  ${JSON.stringify(slug)}: [\n${items}\n  ],`;
    })
    .join("\n");

  // Not the webpack `module` the Next.js rule guards — this is a standalone
  // Node script and the variable holds the generated file's source text.
  // eslint-disable-next-line @next/next/no-assign-module-variable
  const module = `/**
 * AUTO-GENERATED by scripts/build-event-archive.mts — do not edit by hand.
 *
 * Archive photos for past events that ship no on-page photo set of their own.
 * Keyed by event slug. Consumed by the event detail page (photo gallery) and
 * the resources photo-gallery mosaics.
 *
 * Regenerate a single event with:
 *   npx tsx scripts/build-event-archive.mts --slug <slug>
 */

export interface EventArchivePhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export const eventArchivePhotos: Record<string, EventArchivePhoto[]> = {
${entries}
};
`;
  fs.writeFileSync(OUT_DATA_PATH, module, "utf8");
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const targets = opts.gaps ? findGaps() : resolveSlugs(opts.slugs);

  if (targets.length === 0) {
    console.log("No events to build — every past event with an album already has photos.");
    return;
  }

  console.log(
    `${opts.dryRun ? "[dry-run] " : ""}Building ${targets.length} event(s), max ${opts.max} photos each.`
  );

  // Merge into what already exists; untouched events are carried through as-is.
  const merged: Record<string, EventArchivePhoto[]> = { ...eventArchivePhotos };
  const built: string[] = [];
  const failed: string[] = [];

  for (const target of targets) {
    const photos = await buildEvent(target, opts.max, opts.dryRun);
    if (photos) {
      merged[target.slug] = photos;
      built.push(target.slug);
    } else {
      failed.push(target.slug);
    }
  }

  if (!opts.dryRun && built.length > 0) writeDataModule(merged);

  console.log(`\n=== ${opts.dryRun ? "Dry run" : "Build"} report ===`);
  console.log(`Built:   ${built.length}`);
  built.forEach((s) => console.log(`  + ${s}  (${merged[s].length} photos)`));
  if (failed.length > 0) {
    console.log(`Failed:  ${failed.length}`);
    failed.forEach((s) => console.log(`  - ${s}`));
  }
  console.log(`Total events in registry: ${Object.keys(merged).length}`);
  if (opts.dryRun) console.log("\nNothing was written.");
  console.log("==============================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
