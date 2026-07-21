/**
 * harvest-gphotos.ts — download full-size JPEGs from a public Google Photos album.
 *
 * Google Photos public share pages embed per-photo `baseUrl`s (lh3.googleusercontent.com
 * links) inside inline `AF_initDataCallback` script JSON. Fetching the short link
 * (`https://photos.app.goo.gl/<id>`) follows a redirect to the share page whose HTML
 * we scrape for those baseUrls; appending `=w1600` yields a 1600px-wide JPEG that
 * downloads without auth for publicly shared albums.
 *
 * Standalone:
 *   npx tsx scripts/newsletter/harvest-gphotos.ts <albumUrl> <outDir> [--max 12]
 *
 * Importable:
 *   import { harvestAlbum } from "./harvest-gphotos";
 *   const files = await harvestAlbum(albumUrl, outDir, 12);
 *
 * Robustness contract: any network/parse failure degrades to "return what we have
 * with a warning" — the function never throws for an individual photo or a bad page.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";

/** Milliseconds between downloads, mirroring build-event-archive.mts throttling. */
const FETCH_THROTTLE_MS = 300;
/** Minimum decoded width (px) below which a match is treated as thumbnail/profile junk. */
const MIN_WIDTH_PX = 400;
/** Requested rendition width appended to each baseUrl. */
const RENDITION_WIDTH = 1600;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract unique photo baseUrls from a Google Photos share-page HTML.
 *
 * Shared-album photos are served from `lh3.googleusercontent.com/pw/<token>` — the
 * `/pw/` ("photos web") prefix distinguishes real album images from `/a/` profile
 * avatars and other static assets. Tokens are matched without the scheme (the HTML
 * escapes it as `https:\/\/`) and re-prefixed with `https://`; duplicates across
 * the several AF_initDataCallback chunks are removed.
 */
function extractBaseUrls(html: string): string[] {
  const matches = html.match(
    /lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_-]{40,}/g
  );
  if (!matches) return [];
  return Array.from(new Set(matches)).map((m) => `https://${m}`);
}

/**
 * Decoded pixel width of a JPEG buffer via ffprobe (bundled with ffmpeg), or 0 when
 * the probe fails. Written to a temp file because ffprobe needs a seekable input.
 */
function probeWidth(buffer: Buffer, tmpDir: string): number {
  const probePath = path.join(tmpDir, `.probe-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
  try {
    writeFileSync(probePath, buffer);
    const out = execFileSync(
      "ffprobe",
      [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width",
        "-of", "csv=p=0",
        probePath,
      ],
      { encoding: "utf8" }
    );
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  } finally {
    rmSync(probePath, { force: true });
  }
}

/**
 * Resolve the share URL (following the short-link redirect), scrape photo baseUrls,
 * download up to `max` full-size JPEGs (>= MIN_WIDTH_PX wide) into `outDir` as
 * `album-<n>.jpg`, and return the written file paths. Never throws.
 */
export async function harvestAlbum(
  albumUrl: string,
  outDir: string,
  max: number
): Promise<string[]> {
  mkdirSync(outDir, { recursive: true });

  let html: string;
  try {
    const res = await fetch(albumUrl, {
      redirect: "follow",
      headers: {
        // A desktop UA yields the full share page with embedded photo data.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      console.warn(`  [harvest] share page returned HTTP ${res.status} for ${albumUrl}`);
      return [];
    }
    html = await res.text();
  } catch (err) {
    console.warn(`  [harvest] failed to fetch share page: ${(err as Error).message}`);
    return [];
  }

  const baseUrls = extractBaseUrls(html);
  if (baseUrls.length === 0) {
    console.warn(`  [harvest] no photo baseUrls found on ${albumUrl}`);
    return [];
  }
  console.log(`  [harvest] found ${baseUrls.length} candidate photo url(s)`);

  const written: string[] = [];
  let index = 0;

  for (const baseUrl of baseUrls) {
    if (written.length >= max) break;
    index++;

    try {
      const res = await fetch(`${baseUrl}=w${RENDITION_WIDTH}`, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        },
      });
      if (!res.ok) {
        console.warn(`  [harvest] photo ${index}: HTTP ${res.status}, skipping`);
        await sleep(FETCH_THROTTLE_MS);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const width = probeWidth(buffer, outDir);
      if (width < MIN_WIDTH_PX) {
        console.warn(`  [harvest] photo ${index}: ${width}px wide (<${MIN_WIDTH_PX}), skipping`);
        await sleep(FETCH_THROTTLE_MS);
        continue;
      }

      const n = written.length + 1;
      const filePath = path.join(outDir, `album-${n}.jpg`);
      writeFileSync(filePath, buffer);
      written.push(filePath);
      console.log(`  [harvest] photo ${index}: saved album-${n}.jpg (${width}px, ${(buffer.length / 1024).toFixed(0)}KB)`);
    } catch (err) {
      console.warn(`  [harvest] photo ${index}: ${(err as Error).message}, skipping`);
    }
    await sleep(FETCH_THROTTLE_MS);
  }

  console.log(`  [harvest] downloaded ${written.length} photo(s) to ${outDir}`);
  return written;
}

/** CLI entry point. */
async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const positional: string[] = [];
  let max = 12;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--max") {
      max = parseInt(argv[++i], 10) || max;
    } else {
      positional.push(argv[i]);
    }
  }

  const [albumUrl, outDir] = positional;
  if (!albumUrl || !outDir) {
    console.error(
      "Usage: npx tsx scripts/newsletter/harvest-gphotos.ts <albumUrl> <outDir> [--max 12]"
    );
    process.exit(1);
  }

  const files = await harvestAlbum(albumUrl, outDir, max);
  console.log(`\nHarvest complete: ${files.length} file(s).`);
  files.forEach((f) => console.log(`  ${f}`));
}

// Run as a script only when invoked directly (not when imported by photos.ts).
// Filename check works under both CJS and ESM execution (no import.meta needed).
if (process.argv[1] && /harvest-gphotos\.(ts|mts|js)$/.test(process.argv[1])) {
  main().catch((err) => {
    console.error("harvest-gphotos failed:", err);
    process.exit(1);
  });
}
