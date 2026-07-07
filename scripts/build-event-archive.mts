/**
 * build-event-archive.mts — one-time generator for event archive photos.
 *
 * Maps harvested Google Photos albums (a scratchpad inventory) to She Sharp
 * event slugs, selects up to 5 photos per event that does NOT already ship its
 * own on-page photos, transcodes them to WebP under
 * public/img/events/archive/<slug>/, and emits lib/data/event-archive-photos.ts.
 *
 * The detail page injects these only when an event has no own photo set, and
 * the gallery page reuses them for album mosaics, so events that already carry
 * local photos are skipped here (they never consume the archive set).
 *
 * Run:
 *   HARVEST_DIR="D:/.../scratchpad/gphotos" npx tsx scripts/build-event-archive.mts
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HARVEST_DIR =
  process.env.HARVEST_DIR ??
  "D:/Temp/claude/D--github-repository-she-sharp/849ecf8e-f8d5-42df-a44f-112fd41ba309/scratchpad/gphotos";
const IMG_DIR = path.join(HARVEST_DIR, "img");
const INVENTORY_PATH = path.join(HARVEST_DIR, "inventory.json");

const OUT_IMG_ROOT = path.join(ROOT, "public/img/events/archive");
const OUT_DATA_PATH = path.join(ROOT, "lib/data/event-archive-photos.ts");

const MAX_PER_EVENT = 5; // hard cap on photos kept per event
const MIN_PER_EVENT = 2; // events with fewer available sources are skipped
const TARGET_WIDTH = 1280; // max rendition width (no enlargement)
const FETCH_THROTTLE_MS = 300;
const SIZE_BUDGET_MB = 30;
const QUALITY_LADDER = [70, 68, 66, 64]; // step down if over budget

// ---------------------------------------------------------------------------
// Types (loosely typed views over the raw event JSON)
// ---------------------------------------------------------------------------
interface InventoryCandidate {
  baseUrl: string;
  w: number;
  h: number;
  ratio: number;
}
interface InventoryAlbum {
  url: string;
  eventTitle: string;
  slug: string;
  photoCount: number;
  candidates: InventoryCandidate[];
}
interface RawEvent {
  slug: string;
  title: string;
  detailPageData: {
    title?: string;
    photos?: { url: string; alt: string }[];
  };
}
interface ArchivePhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
}

// A source image to transcode: either a local harvested file or a fetched buffer.
type PhotoSource = { kind: "file"; file: string } | { kind: "buffer"; data: Buffer };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const normalize = (s: string | undefined): string =>
  (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const escapeRegExp = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const readJson = <T,>(p: string): T => JSON.parse(fs.readFileSync(p, "utf8")) as T;

/** Resolve an inventory album to an event via slug → title → detail title → fuzzy. */
function resolveEvent(
  album: InventoryAlbum,
  bySlug: Map<string, RawEvent>,
  byTitle: Map<string, RawEvent>,
  byDetailTitle: Map<string, RawEvent>,
  all: RawEvent[]
): RawEvent | undefined {
  const na = normalize(album.eventTitle);
  return (
    bySlug.get(album.slug) ||
    byTitle.get(na) ||
    byDetailTitle.get(na) ||
    all.find(
      (e) => normalize(e.title).includes(na) || na.includes(normalize(e.title))
    )
  );
}

/** Downloaded files for an album, sorted by their numeric suffix. */
function downloadedFiles(albumSlug: string): string[] {
  const re = new RegExp(`^${escapeRegExp(albumSlug)}-(\\d+)\\.jpg$`);
  return fs
    .readdirSync(IMG_DIR)
    .map((f) => ({ f, m: f.match(re) }))
    .filter((x) => x.m)
    .sort((a, b) => Number(a.m![1]) - Number(b.m![1]))
    .map((x) => path.join(IMG_DIR, x.f));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const inventory = readJson<InventoryAlbum[]>(INVENTORY_PATH);
  const v3 = readJson<{ events: RawEvent[] }>(
    path.join(ROOT, "lib/data/json/shesharp_events_v3.json")
  ).events;
  const custom = readJson<{ events: RawEvent[] }>(
    path.join(ROOT, "lib/data/json/events-custom.json")
  ).events;

  // Union, custom last so a shared slug prefers the current event.
  const all = [...v3, ...custom];
  const bySlug = new Map<string, RawEvent>();
  const byTitle = new Map<string, RawEvent>();
  const byDetailTitle = new Map<string, RawEvent>();
  for (const e of all) {
    bySlug.set(e.slug, e);
    byTitle.set(normalize(e.title), e);
    byDetailTitle.set(normalize(e.detailPageData.title), e);
  }

  const hasOwnPhotos = (e: RawEvent) =>
    (e.detailPageData.photos?.length ?? 0) > 0;

  // Gather the source plan per target event before any transcoding, so we can
  // apply an adaptive quality if the total exceeds the size budget.
  interface Plan {
    event: RawEvent;
    album: InventoryAlbum;
    sources: PhotoSource[];
  }
  const plans: Plan[] = [];
  const unmatched: string[] = [];
  const skippedOwnPhotos = new Set<string>();
  const skippedNoSource: string[] = [];

  for (const album of inventory) {
    const event = resolveEvent(album, bySlug, byTitle, byDetailTitle, all);
    if (!event) {
      unmatched.push(`${album.eventTitle} [${album.slug}]`);
      continue;
    }
    if (hasOwnPhotos(event)) {
      skippedOwnPhotos.add(event.slug);
      continue;
    }

    // Prefer already-downloaded files; fetch more only when under 4 on disk.
    const files = downloadedFiles(album.slug);
    const sources: PhotoSource[] = files
      .slice(0, MAX_PER_EVENT)
      .map((file) => ({ kind: "file", file }));

    if (sources.length < 4 && album.candidates.length > 0) {
      const need = Math.min(MAX_PER_EVENT, 4) - sources.length;
      const picks = album.candidates.slice(0, need);
      for (const cand of picks) {
        try {
          const res = await fetch(`${cand.baseUrl}=w${TARGET_WIDTH}`);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            sources.push({ kind: "buffer", data: buf });
          }
        } catch {
          // Ignore individual fetch failures; we keep whatever succeeded.
        }
        await sleep(FETCH_THROTTLE_MS);
      }
    }

    if (sources.length < MIN_PER_EVENT) {
      skippedNoSource.push(`${event.slug} (${sources.length} source)`);
      continue;
    }
    plans.push({ event, album, sources: sources.slice(0, MAX_PER_EVENT) });
  }

  // Transcode with an adaptive quality that respects the size budget.
  let quality = QUALITY_LADDER[0];
  let result: Record<string, ArchivePhoto[]> = {};
  let totalBytes = 0;
  let fileCount = 0;

  for (const q of QUALITY_LADDER) {
    quality = q;
    fs.rmSync(OUT_IMG_ROOT, { recursive: true, force: true });
    result = {};
    totalBytes = 0;
    fileCount = 0;

    for (const { event, sources } of plans) {
      const outDir = path.join(OUT_IMG_ROOT, event.slug);
      fs.mkdirSync(outDir, { recursive: true });
      const photos: ArchivePhoto[] = [];

      for (let i = 0; i < sources.length; i++) {
        const src = sources[i];
        const input = src.kind === "file" ? src.file : src.data;
        const { data, info } = await sharp(input)
          .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
          .webp({ quality })
          .toBuffer({ resolveWithObject: true });

        const n = i + 1;
        fs.writeFileSync(path.join(outDir, `${n}.webp`), data);
        photos.push({
          src: `/img/events/archive/${event.slug}/${n}.webp`,
          width: info.width,
          height: info.height,
          alt: `${event.title} — She Sharp event photo ${n}`,
        });
        totalBytes += data.length;
        fileCount++;
      }
      result[event.slug] = photos;
    }

    if (totalBytes / (1024 * 1024) <= SIZE_BUDGET_MB) break;
  }

  writeDataModule(result);
  printReport({
    inventoryCount: inventory.length,
    matched: inventory.length - unmatched.length,
    unmatched,
    generated: Object.keys(result),
    skippedOwnPhotos: skippedOwnPhotos.size,
    skippedNoSource,
    fileCount,
    totalMB: totalBytes / (1024 * 1024),
    quality,
  });
}

/** Emit the typed, auto-generated data module keyed by event slug. */
function writeDataModule(data: Record<string, ArchivePhoto[]>) {
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

  const module = `/**
 * AUTO-GENERATED by scripts/build-event-archive.mts — do not edit by hand.
 *
 * Archive photos for past events that ship no on-page photo set of their own.
 * Keyed by event slug. Consumed by the event detail page (photo gallery) and
 * the resources photo-gallery mosaics.
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

function printReport(r: {
  inventoryCount: number;
  matched: number;
  unmatched: string[];
  generated: string[];
  skippedOwnPhotos: number;
  skippedNoSource: string[];
  fileCount: number;
  totalMB: number;
  quality: number;
}) {
  console.log("\n=== Event archive build report ===");
  console.log(`Inventory albums:      ${r.inventoryCount}`);
  console.log(`Matched to events:     ${r.matched}`);
  console.log(`Unmatched albums:      ${r.unmatched.length}`);
  r.unmatched.forEach((u) => console.log(`  - ${u}`));
  console.log(`Skipped (own photos):  ${r.skippedOwnPhotos}`);
  console.log(`Skipped (no source):   ${r.skippedNoSource.length}`);
  r.skippedNoSource.forEach((s) => console.log(`  - ${s}`));
  console.log(`Events with archive:   ${r.generated.length}`);
  r.generated.forEach((s) => console.log(`  - ${s}`));
  console.log(`WebP files written:    ${r.fileCount}`);
  console.log(`Total size:            ${r.totalMB.toFixed(1)} MB @ q${r.quality}`);
  console.log("==================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
