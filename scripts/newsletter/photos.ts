/**
 * photos.ts — build the monthly newsletter photo strip.
 *
 * For each recap event in an issue's `auto` block, this gathers photo candidates
 * (on-page event photos → archive photos → harvested Google Photos album), selects
 * a spread of up to N landscape-leaning shots, transcodes each to an email-safe
 * JPEG (<=1200px, metadata stripped, <200KB) via the ffmpeg CLI, uploads them to
 * Vercel Blob, and writes the resulting `auto.photoStrip` / `auto.photoAlbumUrl`
 * back into the issue JSON.
 *
 * Email images MUST be JPEG (never WebP — Outlook renders WebP as broken images),
 * which is why local `.webp` archive photos are transcoded rather than linked.
 *
 * Usage:
 *   npx tsx scripts/newsletter/photos.ts <path-to-issue.json> [--max 4] [--dry-run]
 *
 * BLOB_READ_WRITE_TOKEN is read from the environment or, failing that, parsed from
 * .env.local. --dry-run does selection + conversion and prints the plan without
 * uploading or writing the issue file.
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { put } from "@vercel/blob";

import { getEventBySlug } from "@/lib/data/events";
import { eventArchivePhotos } from "@/lib/data/event-archive-photos";
import { newsletterIssueSchema } from "@/lib/newsletter/schema";
import type { NewsletterIssueData } from "@/lib/newsletter/schema";
import { harvestAlbum } from "./harvest-gphotos";

const ROOT = path.resolve(__dirname, "..", "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const TMP_ROOT = path.join(ROOT, "tmp", "newsletter-photos");
const OUT_DIR = path.join(TMP_ROOT, "_out");

/** Transcode target: max rendition width and the byte budget per email image. */
const TARGET_WIDTH = 1200;
const SIZE_BUDGET_BYTES = 200 * 1024;
/** mjpeg -q:v ladder (higher value = lower quality/smaller file); step up if oversize. */
const QUALITY_LADDER = [4, 5, 6, 7, 8];
/** Landscape acceptance band (width/height); shots in-band are preferred in selection. */
const LANDSCAPE_MIN = 1.3;
const LANDSCAPE_MAX = 2.1;
/** Upper bound on photos harvested per event when falling back to a Google album. */
const HARVEST_MAX = 8;

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

/**
 * Populate process.env from .env.local for keys not already set. Self-contained
 * (the other newsletter scripts rely on inline env), parses simple KEY=VALUE lines
 * and strips surrounding quotes.
 */
function loadLocalEnv(keys: string[]): void {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length === 0) return;

  const envPath = path.join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;

  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!missing.includes(key) || process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A source photo considered for the strip, before transcoding. */
interface Candidate {
  eventSlug: string;
  eventTitle: string;
  /** Absolute path to the local source file to feed ffmpeg. */
  sourcePath: string;
  /** Short provenance label for the summary table. */
  source: "on-page" | "archive" | "harvest";
  width: number;
  height: number;
}

/** A selected + transcoded photo ready to (optionally) upload. */
interface Prepared {
  candidate: Candidate;
  /** Absolute path to the transcoded JPEG. */
  jpegPath: string;
  sizeBytes: number;
  quality: number;
  /** 1-based index within its event, for a stable blob pathname. */
  slugIndex: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Decoded width/height of an image file via ffprobe, or null when it fails. */
function probeSize(file: string): { width: number; height: number } | null {
  try {
    const out = execFileSync(
      "ffprobe",
      [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=s=x:p=0",
        file,
      ],
      { encoding: "utf8" }
    ).trim();
    const [w, h] = out.split("x").map((n) => parseInt(n, 10));
    if (!w || !h) return null;
    return { width: w, height: h };
  } catch {
    return null;
  }
}

const isLandscape = (c: { width: number; height: number }): boolean => {
  const ratio = c.width / c.height;
  return ratio >= LANDSCAPE_MIN && ratio <= LANDSCAPE_MAX;
};

/** Trimmed string or null when empty/missing. */
const nullIfEmpty = (value: string | undefined | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * Gather photo candidates for one recap event in priority order:
 *   (a) on-page `detailPageData.photos` (site-relative → public/)
 *   (b) `eventArchivePhotos[slug]` local webp renditions
 *   (c) harvested Google Photos album, only when (a)+(b) yielded nothing and the
 *       event has a non-empty galleryUrl.
 */
async function gatherCandidates(slug: string): Promise<Candidate[]> {
  const event = getEventBySlug(slug);
  if (!event) {
    console.warn(`[photos] event not found for slug "${slug}", skipping`);
    return [];
  }
  const title = event.title;
  const candidates: Candidate[] = [];

  // (a) On-page photos.
  for (const photo of event.detailPageData.photos ?? []) {
    const rel = photo.url?.trim();
    if (!rel || /^https?:\/\//i.test(rel)) continue; // only local assets are transcodable
    const abs = path.join(PUBLIC_DIR, rel.replace(/^\//, ""));
    if (!existsSync(abs)) continue;
    const size = probeSize(abs);
    if (!size) continue;
    candidates.push({
      eventSlug: slug,
      eventTitle: title,
      sourcePath: abs,
      source: "on-page",
      ...size,
    });
  }

  // (b) Archive photos (dimensions already known in the data module).
  for (const photo of eventArchivePhotos[slug] ?? []) {
    const abs = path.join(PUBLIC_DIR, photo.src.replace(/^\//, ""));
    if (!existsSync(abs)) continue;
    candidates.push({
      eventSlug: slug,
      eventTitle: title,
      sourcePath: abs,
      source: "archive",
      width: photo.width,
      height: photo.height,
    });
  }

  // (c) Harvest fallback.
  if (candidates.length === 0) {
    const galleryUrl = nullIfEmpty(event.detailPageData.galleryUrl);
    if (galleryUrl) {
      console.log(`[photos] ${slug}: no local photos, harvesting ${galleryUrl}`);
      const outDir = path.join(TMP_ROOT, slug);
      const files = await harvestAlbum(galleryUrl, outDir, HARVEST_MAX);
      for (const file of files) {
        const size = probeSize(file);
        if (!size) continue;
        candidates.push({
          eventSlug: slug,
          eventTitle: title,
          sourcePath: file,
          source: "harvest",
          ...size,
        });
      }
    }
  }

  return candidates;
}

/**
 * Select up to `max` photos across events: spread round-robin over events, taking
 * landscape shots before others within each event, and de-duplicating by source file.
 */
function selectPhotos(byEvent: Candidate[][], max: number): Candidate[] {
  // Sort each event's list so in-band landscape shots come first.
  const queues = byEvent.map((list) =>
    [...list].sort((a, b) => Number(isLandscape(b)) - Number(isLandscape(a)))
  );

  const selected: Candidate[] = [];
  const seen = new Set<string>();
  let progressed = true;

  while (selected.length < max && progressed) {
    progressed = false;
    for (const queue of queues) {
      if (selected.length >= max) break;
      const next = queue.shift();
      if (!next) continue;
      if (seen.has(next.sourcePath)) continue;
      seen.add(next.sourcePath);
      selected.push(next);
      progressed = true;
    }
  }

  return selected;
}

/**
 * Transcode a candidate to an email-safe JPEG, stepping up the quality index until
 * the file lands under the size budget (or the ladder is exhausted).
 */
function transcode(candidate: Candidate, outPath: string): { sizeBytes: number; quality: number } {
  let sizeBytes = 0;
  let quality = QUALITY_LADDER[QUALITY_LADDER.length - 1];

  for (const q of QUALITY_LADDER) {
    quality = q;
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i", candidate.sourcePath,
        "-vf", `scale='min(${TARGET_WIDTH},iw)':-2`,
        "-q:v", String(q),
        "-map_metadata", "-1",
        outPath,
      ],
      { stdio: "ignore" }
    );
    sizeBytes = readFileSync(outPath).length;
    if (sizeBytes <= SIZE_BUDGET_BYTES) break;
  }

  return { sizeBytes, quality };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const positional: string[] = [];
  let max = 6;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") dryRun = true;
    else if (argv[i] === "--max") max = parseInt(argv[++i], 10) || max;
    else positional.push(argv[i]);
  }

  const issuePath = positional[0];
  if (!issuePath) {
    console.error(
      "Usage: npx tsx scripts/newsletter/photos.ts <path-to-issue.json> [--max 4] [--dry-run]"
    );
    process.exit(1);
  }

  const absIssuePath = path.resolve(process.cwd(), issuePath);
  const raw = JSON.parse(readFileSync(absIssuePath, "utf8"));
  const parsed = newsletterIssueSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Error: issue JSON failed validation:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }
  const issue: NewsletterIssueData = parsed.data;

  const recapSlugs = issue.auto.recapEvents.map((e) => e.slug);
  console.log(
    `Issue ${issue.id}: ${recapSlugs.length} recap event(s) — ${recapSlugs.join(", ") || "(none)"}`
  );

  // Prepare a clean scratch area for transcoded output.
  mkdirSync(OUT_DIR, { recursive: true });

  // Gather candidates per event.
  const byEvent: Candidate[][] = [];
  for (const slug of recapSlugs) {
    byEvent.push(await gatherCandidates(slug));
  }
  const totalCandidates = byEvent.reduce((n, list) => n + list.length, 0);
  console.log(`Gathered ${totalCandidates} candidate photo(s) across events.`);

  const selected = selectPhotos(byEvent, max);
  console.log(`Selected ${selected.length} photo(s) (max ${max}).`);

  // Transcode selected photos.
  const prepared: Prepared[] = [];
  const perSlugCount = new Map<string, number>();
  for (const candidate of selected) {
    const n = (perSlugCount.get(candidate.eventSlug) ?? 0) + 1;
    perSlugCount.set(candidate.eventSlug, n);
    const jpegPath = path.join(OUT_DIR, `${candidate.eventSlug}-${n}.jpg`);
    const { sizeBytes, quality } = transcode(candidate, jpegPath);
    prepared.push({ candidate, jpegPath, sizeBytes, quality, slugIndex: n });
    console.log(
      `  transcoded ${candidate.eventSlug}-${n}.jpg — ${(sizeBytes / 1024).toFixed(0)}KB @ q${quality} (from ${candidate.source})`
    );
  }

  // photoAlbumUrl = first recap event's non-empty galleryUrl.
  let photoAlbumUrl: string | null = null;
  for (const slug of recapSlugs) {
    const event = getEventBySlug(slug);
    const gallery = nullIfEmpty(event?.detailPageData.galleryUrl);
    if (gallery) {
      photoAlbumUrl = gallery;
      break;
    }
  }

  if (dryRun) {
    console.log("\n[dry-run] plan (no upload, no write):");
    printSummary(prepared, prepared.map((p) => ({ ...p, url: "(dry-run)" })));
    console.log(`  photoAlbumUrl → ${photoAlbumUrl ?? "null"}`);
    return;
  }

  // Upload to Blob.
  loadLocalEnv(["BLOB_READ_WRITE_TOKEN"]);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error(
      "Error: BLOB_READ_WRITE_TOKEN not set (and not found in .env.local)."
    );
    process.exit(1);
  }

  const uploaded: { url: string }[] = [];
  for (const p of prepared) {
    const pathname = `newsletter/${issue.id}/photos/${p.candidate.eventSlug}-${p.slugIndex}.jpg`;
    const body = readFileSync(p.jpegPath);
    const { url } = await put(pathname, body, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/jpeg",
      token,
    });
    uploaded.push({ url });
    console.log(`  uploaded ${pathname} → ${url}`);
  }

  // Write the strip back into the issue JSON (mutate raw to preserve field order).
  // Alt text is venue-grounded: "<event title> — <location>" (falls back to a
  // generic label when the recap event has no location).
  const locationBySlug = new Map(
    issue.auto.recapEvents.map((e) => [e.slug, e.locationLabel])
  );
  const photoStrip = prepared.map((p, i) => ({
    src: uploaded[i].url,
    alt: `${p.candidate.eventTitle} — ${
      locationBySlug.get(p.candidate.eventSlug) || "She Sharp event"
    }`,
    eventSlug: p.candidate.eventSlug,
  }));

  raw.auto.photoStrip = photoStrip;
  raw.auto.photoAlbumUrl = photoAlbumUrl;
  writeFileSync(absIssuePath, JSON.stringify(raw, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${photoStrip.length} strip photo(s) + album URL to ${absIssuePath}`);

  printSummary(prepared, uploaded.map((u) => ({ url: u.url })));
}

/** Print a human-readable summary table of the prepared photos. */
function printSummary(
  prepared: Prepared[],
  rows: { url: string }[]
): void {
  console.log("\n=== Photo strip summary ===");
  console.log(
    ["event", "source", "sizeKB", "url"].join("  |  ")
  );
  prepared.forEach((p, i) => {
    console.log(
      [
        p.candidate.eventSlug,
        p.candidate.source,
        (p.sizeBytes / 1024).toFixed(0),
        rows[i]?.url ?? "",
      ].join("  |  ")
    );
  });
  console.log("===========================");
}

main().catch((err) => {
  console.error("photos failed:", err);
  process.exit(1);
});
