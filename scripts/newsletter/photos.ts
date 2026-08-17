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
 * `--from-dir` replaces candidate gathering with a hand-picked local folder, for a
 * month whose photographs arrive as a directory of originals rather than as on-page
 * assets or a public album. It also turns OFF the landscape-first re-sort: the folder
 * has already been curated by a human, so its filename order IS the editorial order
 * and reordering it would throw that decision away.
 *
 * `--placeholders` is a separate mode for issues whose recap event has not happened
 * yet (or whose album has not arrived): it skips candidate gathering entirely and
 * generates six branded gradient cards — hero, photo of the month, and four strip
 * slots — on FIXED, OVERWRITABLE blob URLs, so the real photos can later be swapped
 * in by re-running the upload against the same paths without touching the issue JSON.
 *
 * Usage:
 *   npx tsx scripts/newsletter/photos.ts <path-to-issue.json> [--max 4] [--dry-run]
 *   npx tsx scripts/newsletter/photos.ts <path-to-issue.json> --from-dir <dir> [--slug <eventSlug>] [--max 15] [--dry-run]
 *   npx tsx scripts/newsletter/photos.ts <path-to-issue.json> --placeholders [--dry-run]
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
  readdirSync,
  rmSync,
  statSync,
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

// --- Placeholder mode ------------------------------------------------------

/**
 * Line 1 of every placeholder card — CHANGE THIS PER ISSUE. Deliberately a hand
 * written constant rather than derived from the recap event: the cards are read
 * at a glance in an email, so the label wants to be short ("MYOB · Working
 * Smarter"), not the full event title.
 */
const PLACEHOLDER_EVENT_LABEL = "MYOB · Working Smarter";

/** 16:9 card, the same aspect the real strip photos land on. */
const PLACEHOLDER_WIDTH = 1200;
const PLACEHOLDER_HEIGHT = 675;
/** Brand gradient ramp (purple dark → purple mid → periwinkle), drawn diagonally. */
const PLACEHOLDER_GRADIENT = ["0x7c2569", "0x9b2e83", "0x8982ff"] as const;
/**
 * Font paths inside a filtergraph MUST be drive-less: a "C:" is parsed as an
 * option separator ("No option name near ..."), and escaping it as "C\:" does not
 * survive the tool layers either. A drive-less path is resolved against the drive
 * of the process cwd, so ffmpeg is run from the system drive root (this repo lives
 * on D:, where "/Windows/Fonts/..." does not exist and drawtext silently falls
 * back to a monospace default).
 */
const WINDIR = process.env.SystemRoot ?? process.env.windir ?? "C:\\Windows";
const PLACEHOLDER_FFMPEG_CWD = `${WINDIR.slice(0, 2)}\\`;
const driveLessFont = (file: string): string =>
  `${WINDIR.slice(2).replace(/\\/g, "/")}/Fonts/${file}`;
const PLACEHOLDER_FONT_BOLD = driveLessFont("segoeuib.ttf");
const PLACEHOLDER_FONT_REGULAR = driveLessFont("segoeui.ttf");

/**
 * Strip photo count. `PhotoStrip` leads with one full-width photo and pairs the
 * rest into rows of two, so an odd count fills every row — 5 gives a lead plus
 * two complete rows. An even count leaves a visible gap in the final row.
 * Capped at 6 by `stripPhotoSchema`.
 */
const PLACEHOLDER_STRIP_COUNT = 5;

const PLACEHOLDER_STRIP_NUMBERS = Array.from(
  { length: PLACEHOLDER_STRIP_COUNT },
  (_, i) => i + 1
);

/** The fixed placeholder slots, in write-back order. */
const PLACEHOLDER_SLOTS: { slot: string; subtitle: string }[] = [
  { slot: "hero", subtitle: "photo coming soon" },
  { slot: "photo-of-the-month", subtitle: "photo of the month coming soon" },
  ...PLACEHOLDER_STRIP_NUMBERS.map((n) => ({
    slot: `strip-${n}`,
    subtitle: `photo coming soon · ${n} of ${PLACEHOLDER_STRIP_COUNT}`,
  })),
];

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
  source: "on-page" | "archive" | "harvest" | "placeholder" | "from-dir";
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

/** Image extensions ffmpeg will happily transcode from a hand-picked folder. */
const FROM_DIR_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/**
 * Gather candidates from a hand-curated local folder, attributed to `slug`.
 *
 * Files are taken in filename order and NOT re-sorted — see `selectPhotos`. The
 * convention this exists to serve is a folder whose names carry the running
 * order (`01-…`, `02-…`), because the slot a photo lands in (cover, photo of the
 * month, the strip's full-width lead, then the paired rows) is a judgement about
 * the photographs, and no ratio test can make it.
 *
 * A file ffprobe cannot read is skipped with a warning rather than failing the
 * run: one unreadable original should not cost the other fourteen.
 */
function gatherFromDir(dir: string, slug: string, eventTitle: string): Candidate[] {
  const entries = readdirSync(dir)
    .filter((name) => FROM_DIR_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en"));

  const candidates: Candidate[] = [];
  for (const name of entries) {
    const abs = path.join(dir, name);
    const size = probeSize(abs);
    if (!size) {
      console.warn(`[photos] could not probe "${name}", skipping`);
      continue;
    }
    candidates.push({
      eventSlug: slug,
      eventTitle,
      sourcePath: abs,
      source: "from-dir",
      ...size,
    });
  }
  return candidates;
}

/**
 * Select up to `max` photos across events: spread round-robin over events, taking
 * landscape shots before others within each event, and de-duplicating by source file.
 *
 * `preserveOrder` skips the landscape-first sort. It is set only by `--from-dir`,
 * where the folder's filename order is a human's running order and must survive.
 */
function selectPhotos(
  byEvent: Candidate[][],
  max: number,
  preserveOrder = false
): Candidate[] {
  // Sort each event's list so in-band landscape shots come first.
  const queues = byEvent.map((list) =>
    preserveOrder
      ? [...list]
      : [...list].sort((a, b) => Number(isLandscape(b)) - Number(isLandscape(a)))
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
// Placeholder mode
// ---------------------------------------------------------------------------

/**
 * Escape a string for ffmpeg's drawtext `text=` option. The value is wrapped in
 * single quotes by the caller, which protects commas and spaces; what still has
 * to be escaped is the backslash itself, the ':' option separator, the quote
 * character, and '%' (drawtext expands it).
 */
function escapeDrawText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%");
}

/**
 * Render one branded placeholder card: a diagonal brand gradient with two centred
 * lines of text, written as an email-safe JPEG. Returns the file size in bytes and
 * throws when it does not fit the per-image budget.
 *
 * stderr is captured rather than inherited, because ffmpeg prints a handful of
 * harmless `Fontconfig error: Cannot load default config file` lines per run (the
 * explicit fontfile is used and the frame is still produced); it is surfaced only
 * when ffmpeg actually fails.
 */
function renderPlaceholder(
  line1: string,
  line2: string,
  outPath: string
): number {
  // Fail loudly rather than let drawtext fall back to a monospace default.
  for (const font of [PLACEHOLDER_FONT_BOLD, PLACEHOLDER_FONT_REGULAR]) {
    const abs = path.join(PLACEHOLDER_FFMPEG_CWD, font);
    if (!existsSync(abs)) throw new Error(`placeholder font not found: ${abs}`);
  }

  const [c0, c1, c2] = PLACEHOLDER_GRADIENT;
  const gradient =
    `gradients=s=${PLACEHOLDER_WIDTH}x${PLACEHOLDER_HEIGHT}` +
    `:c0=${c0}:c1=${c1}:c2=${c2}:nb_colors=3` +
    `:x0=0:y0=0:x1=${PLACEHOLDER_WIDTH}:y1=${PLACEHOLDER_HEIGHT}` +
    `:type=linear:d=1:r=1`;

  const filters = [
    `drawtext=fontfile=${PLACEHOLDER_FONT_BOLD}:text='${escapeDrawText(line1)}'` +
      `:fontcolor=0xffffff:fontsize=54:x=(w-text_w)/2:y=(h/2)-56`,
    `drawtext=fontfile=${PLACEHOLDER_FONT_REGULAR}:text='${escapeDrawText(line2)}'` +
      `:fontcolor=0xf7e5f3:fontsize=30:x=(w-text_w)/2:y=(h/2)+18`,
  ].join(",");

  try {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-hide_banner",
        "-loglevel", "error",
        "-f", "lavfi",
        "-i", gradient,
        "-frames:v", "1",
        "-vf", filters,
        "-q:v", "4",
        "-map_metadata", "-1",
        outPath,
      ],
      { stdio: ["ignore", "ignore", "pipe"], cwd: PLACEHOLDER_FFMPEG_CWD }
    );
  } catch (err) {
    const stderr = (err as { stderr?: Buffer }).stderr?.toString().trim();
    throw new Error(`ffmpeg failed for ${path.basename(outPath)}${stderr ? `:\n${stderr}` : ""}`);
  }

  const sizeBytes = readFileSync(outPath).length;
  if (sizeBytes > SIZE_BUDGET_BYTES) {
    throw new Error(
      `placeholder ${path.basename(outPath)} is ${(sizeBytes / 1024).toFixed(0)}KB, ` +
        `over the ${(SIZE_BUDGET_BYTES / 1024).toFixed(0)}KB budget`
    );
  }
  return sizeBytes;
}

/**
 * Public URL a `put()` with `addRandomSuffix: false` will produce, derived from the
 * store id embedded in the R/W token (`vercel_blob_rw_<storeId>_<secret>`). Used to
 * show the real destination URLs during --dry-run; null when the token is absent.
 */
function predictBlobUrl(token: string | undefined, pathname: string): string | null {
  const storeId = token?.split("_")[3];
  if (!storeId) return null;
  return `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com/${pathname}`;
}

/**
 * Placeholder pipeline: render the six fixed cards, upload them to stable
 * overwritable blob paths, and point the issue's hero / photo-of-the-month /
 * photo strip at them. Swapping in real photos later is then just another upload
 * to the same six paths — the issue JSON never has to change.
 */
async function runPlaceholders(
  raw: { editorial: Record<string, unknown>; auto: Record<string, unknown> },
  issue: NewsletterIssueData,
  absIssuePath: string,
  dryRun: boolean
): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(
    `Placeholder mode: ${PLACEHOLDER_SLOTS.length} card(s), label "${PLACEHOLDER_EVENT_LABEL}".`
  );

  const prepared: Prepared[] = [];
  for (const { slot, subtitle } of PLACEHOLDER_SLOTS) {
    const jpegPath = path.join(OUT_DIR, `placeholder-${slot}.jpg`);
    const sizeBytes = renderPlaceholder(
      PLACEHOLDER_EVENT_LABEL,
      subtitle,
      jpegPath
    );
    prepared.push({
      candidate: {
        eventSlug: slot,
        eventTitle: PLACEHOLDER_EVENT_LABEL,
        sourcePath: jpegPath,
        source: "placeholder",
        width: PLACEHOLDER_WIDTH,
        height: PLACEHOLDER_HEIGHT,
      },
      jpegPath,
      sizeBytes,
      quality: 4,
      slugIndex: 1,
    });
    console.log(
      `  rendered placeholder-${slot}.jpg — ${(sizeBytes / 1024).toFixed(0)}KB ("${subtitle}")`
    );
  }

  const pathnameFor = (slot: string): string =>
    `newsletter/${issue.id}/photos/${slot}.jpg`;

  // Token is needed for the upload, and (best effort) to show real URLs in dry-run.
  loadLocalEnv(["BLOB_READ_WRITE_TOKEN"]);
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (dryRun) {
    console.log("\n[dry-run] plan (no upload, no write):");
    printSummary(
      prepared,
      PLACEHOLDER_SLOTS.map(({ slot }) => ({
        url:
          predictBlobUrl(token, pathnameFor(slot)) ??
          `(dry-run) ${pathnameFor(slot)}`,
      }))
    );
    console.log("  photoAlbumUrl → null (unchanged)");
    return;
  }

  if (!token) {
    console.error(
      "Error: BLOB_READ_WRITE_TOKEN not set (and not found in .env.local)."
    );
    process.exit(1);
  }

  const urlBySlot = new Map<string, string>();
  for (const { slot } of PLACEHOLDER_SLOTS) {
    const pathname = pathnameFor(slot);
    const body = readFileSync(path.join(OUT_DIR, `placeholder-${slot}.jpg`));
    // Deliberately the OPPOSITE options to the real-photo upload above:
    // - addRandomSuffix: false + allowOverwrite: true make the URL guessable and
    //   re-uploadable, which IS the swap mechanism for the real photos later.
    // - Blob's default cache-control is one YEAR; 300s is what makes that swap
    //   actually show up in already-sent-and-opened email clients and browsers.
    // Keep this option set strictly scoped to `newsletter/<issueId>/photos/` —
    // it must never be pointed at the store's `she-sharp/` logo prefix.
    if (!pathname.startsWith(`newsletter/${issue.id}/photos/`)) {
      throw new Error(`refusing overwriting upload outside the issue prefix: ${pathname}`);
    }
    const { url } = await put(pathname, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "image/jpeg",
      cacheControlMaxAge: 300,
      token,
    });
    urlBySlot.set(slot, url);
    console.log(`  uploaded ${pathname} → ${url}`);
  }

  // Write back into the parsed object so the file's key order is preserved.
  raw.editorial.heroImageUrl = urlBySlot.get("hero");
  raw.editorial.photoOfTheMonth = {
    src: urlBySlot.get("photo-of-the-month"),
    caption: `Placeholder — real photos from ${PLACEHOLDER_EVENT_LABEL} are coming soon.`,
  };
  // NOTE: no `eventSlug` on these entries, on purpose. PhotoStrip.captionFor()
  // OVERRIDES `alt` whenever the slug resolves to a recap event, which would
  // caption a synthetic purple card "Working Smarter · MYOB, Auckland" — a
  // generated image presented as a real venue shot.
  raw.auto.photoStrip = PLACEHOLDER_STRIP_NUMBERS.map((n) => ({
    src: urlBySlot.get(`strip-${n}`),
    alt: `${PLACEHOLDER_EVENT_LABEL} — photo coming soon (${n} of ${PLACEHOLDER_STRIP_COUNT})`,
  }));
  raw.auto.photoAlbumUrl = null;

  const revalidated = newsletterIssueSchema.safeParse(raw);
  if (!revalidated.success) {
    console.error("Error: placeholder write-back produced an invalid issue:");
    console.error(JSON.stringify(revalidated.error.format(), null, 2));
    process.exit(1);
  }

  writeFileSync(absIssuePath, JSON.stringify(raw, null, 2) + "\n", "utf8");
  console.log(
    `\nWrote ${PLACEHOLDER_SLOTS.length} placeholder image(s) to ${absIssuePath}`
  );

  printSummary(
    prepared,
    PLACEHOLDER_SLOTS.map(({ slot }) => ({ url: urlBySlot.get(slot) ?? "" }))
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/** Reads `argv[index]` as a flag's value, exiting when it is absent. */
function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    console.error(`Error: ${flag} needs a value.`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const positional: string[] = [];
  let max = 6;
  let dryRun = false;
  let placeholders = false;
  let maxGiven = false;
  let fromDir: string | null = null;
  let slugOverride: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") dryRun = true;
    else if (argv[i] === "--placeholders") placeholders = true;
    // A value-taking flag whose value is missing must fail loudly: swallowing it
    // as `null` would silently fall back to the normal candidate-gathering path
    // and upload the wrong photographs.
    else if (argv[i] === "--from-dir") fromDir = requireValue(argv, ++i, "--from-dir");
    else if (argv[i] === "--slug") slugOverride = requireValue(argv, ++i, "--slug");
    else if (argv[i] === "--max") {
      max = parseInt(argv[++i], 10) || max;
      maxGiven = true;
    } else positional.push(argv[i]);
  }

  const issuePath = positional[0];
  if (!issuePath) {
    console.error(
      "Usage: npx tsx scripts/newsletter/photos.ts <path-to-issue.json> [--max 4] [--dry-run]\n" +
        "       npx tsx scripts/newsletter/photos.ts <path-to-issue.json> --from-dir <dir> [--slug <eventSlug>] [--max 15] [--dry-run]\n" +
        "       npx tsx scripts/newsletter/photos.ts <path-to-issue.json> --placeholders [--dry-run]"
    );
    process.exit(1);
  }

  if (placeholders && maxGiven) {
    console.error(
      "Error: --max has no meaning with --placeholders (the six slots are fixed). Drop it."
    );
    process.exit(1);
  }

  if (placeholders && fromDir) {
    console.error(
      "Error: --from-dir and --placeholders are opposite modes (real photos vs generated cards). Pick one."
    );
    process.exit(1);
  }

  if (!fromDir && slugOverride) {
    console.error(
      "Error: --slug only applies to --from-dir; without it the slug comes from the issue's recap events."
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

  // Placeholder mode short-circuits candidate gathering/selection entirely.
  if (placeholders) {
    await runPlaceholders(raw, issue, absIssuePath, dryRun);
    return;
  }

  const recapSlugs = issue.auto.recapEvents.map((e) => e.slug);
  console.log(
    `Issue ${issue.id}: ${recapSlugs.length} recap event(s) — ${recapSlugs.join(", ") || "(none)"}`
  );

  // Prepare a clean scratch area for transcoded output.
  mkdirSync(OUT_DIR, { recursive: true });

  // Gather candidates — from the hand-picked folder, or per event from site data.
  const byEvent: Candidate[][] = [];
  if (fromDir) {
    const absDir = path.resolve(process.cwd(), fromDir);
    if (!existsSync(absDir) || !statSync(absDir).isDirectory()) {
      console.error(`Error: --from-dir "${fromDir}" is not a directory.`);
      process.exit(1);
    }

    // The slug decides the caption and the blob pathname, so it has to be
    // unambiguous. One recap event is the normal case and needs no flag; more
    // than one is a real fork in the road that only a human can settle.
    const slug = slugOverride ?? recapSlugs[0];
    if (!slug) {
      console.error(
        "Error: the issue has no recap events, so --from-dir has no event to attribute the photos to. Pass --slug <eventSlug>."
      );
      process.exit(1);
    }
    if (!slugOverride && recapSlugs.length > 1) {
      console.error(
        `Error: ${recapSlugs.length} recap events (${recapSlugs.join(", ")}) — pass --slug to say which one the folder belongs to.`
      );
      process.exit(1);
    }

    const event = getEventBySlug(slug);
    if (!event) {
      console.error(`Error: no event found for slug "${slug}".`);
      process.exit(1);
    }

    byEvent.push(gatherFromDir(absDir, slug, event.title));
    console.log(
      `Reading ${byEvent[0].length} photo(s) from ${absDir} as "${slug}" (filename order preserved).`
    );
  } else {
    for (const slug of recapSlugs) {
      byEvent.push(await gatherCandidates(slug));
    }
  }
  const totalCandidates = byEvent.reduce((n, list) => n + list.length, 0);
  console.log(`Gathered ${totalCandidates} candidate photo(s) across events.`);

  const selected = selectPhotos(byEvent, max, Boolean(fromDir));
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
    ["event/slot", "source", "sizeKB", "url"].join("  |  ")
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
