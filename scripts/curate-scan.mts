/**
 * curate-scan.mts — Scan candidate event photography for the editorial redesign.
 *
 * Recursively scans the scraped photo/site trees, the gallery folder, and a
 * handful of large root-level photos. Reads pixel dimensions with sharp and
 * keeps landscape, hero-grade candidates (width >= 1600, ratio 1.35..2.1).
 *
 * Output: scratchpad/curate-manifest.json — [{path,width,height,ratio,sizeKB}]
 * sorted by width descending.
 *
 * Run: npx tsx scripts/curate-scan.mts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const REPO = process.cwd();
const SCRATCH =
  "D:/Temp/claude/D--github-repository-she-sharp/849ecf8e-f8d5-42df-a44f-112fd41ba309/scratchpad";

const EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MIN_WIDTH = 1600;
const MIN_RATIO = 1.35;
const MAX_RATIO = 2.1;

// Directory roots to walk recursively.
const SCAN_DIRS = [
  "public/img/scraped/photos",
  "public/img/scraped/site",
  "public/img/gallery",
];

// Individual large root-level photos.
const SCAN_FILES = [
  "public/img/joinus-1.jpg",
  "public/img/joinus-2.jpg",
  "public/img/joinus-3.jpg",
  "public/img/joinus-4.jpg",
  "public/img/joinus-5.jpg",
  "public/img/inspire.jpg",
];

/** Recursively collect files with an allowed image extension. */
async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: Awaited<ReturnType<typeof fs.readdir>>;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (EXT.has(path.extname(e.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

type Candidate = {
  path: string;
  width: number;
  height: number;
  ratio: number;
  sizeKB: number;
};

async function main() {
  const files: string[] = [];
  for (const d of SCAN_DIRS) files.push(...(await walk(path.join(REPO, d))));
  for (const f of SCAN_FILES) {
    const full = path.join(REPO, f);
    try {
      await fs.access(full);
      files.push(full);
    } catch {
      /* skip missing */
    }
  }

  const candidates: Candidate[] = [];
  let scanned = 0;
  for (const file of files) {
    scanned++;
    try {
      const meta = await sharp(file).metadata();
      const width = meta.width ?? 0;
      const height = meta.height ?? 0;
      if (!width || !height) continue;
      const ratio = width / height;
      if (width >= MIN_WIDTH && ratio >= MIN_RATIO && ratio <= MAX_RATIO) {
        const stat = await fs.stat(file);
        candidates.push({
          // Store repo-relative POSIX path for portability.
          path: path.relative(REPO, file).split(path.sep).join("/"),
          width,
          height,
          ratio: Number(ratio.toFixed(3)),
          sizeKB: Math.round(stat.size / 1024),
        });
      }
    } catch {
      /* unreadable image — skip */
    }
  }

  candidates.sort((a, b) => b.width - a.width);
  await fs.mkdir(SCRATCH, { recursive: true });
  await fs.writeFile(
    path.join(SCRATCH, "curate-manifest.json"),
    JSON.stringify(candidates, null, 2),
  );
  console.log(
    `scanned ${scanned} files, ${candidates.length} candidates -> curate-manifest.json`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
