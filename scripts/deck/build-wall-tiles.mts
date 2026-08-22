/**
 * build-wall-tiles.mts — add photographs to the deck archive wall.
 *
 * `public/img/wall/` holds 520px renditions that `lib/deck/wall-tiles.ts` tiles
 * and duotones as texture. The original 118 were produced by a one-off that was
 * never committed, so the selection criteria written at the top of that file
 * had never been enforced by anything. This script is that missing builder, and
 * it checks them:
 *
 *   landscape            w > h; a portrait tile ruins the run of a wall row
 *   mean luminance 47-150  outside that band a tile either blows out or dies
 *                        under the duotone, and the wall reads as damaged
 *   visually distinct    dHash distance >= 7 from every tile already in the
 *                        pool, so a wall never shows the same room twice
 *
 * A source that fails is REPORTED AND REFUSED, not skipped quietly: a silently
 * dropped tile looks identical to a tile nobody remembered to add.
 *
 * IT NEVER OVERWRITES. `/img/*` is served with a one-year immutable cache, so a
 * changed tile needs a new filename. An output that already exists is left
 * exactly as it is.
 *
 * NEW TILES ARE INTERLEAVED, NOT APPENDED. `pickWallTiles()` walks the pool at
 * `step = floor(length / count)`, and a full six-row wall consumes most of it,
 * so a block of thirty consecutive frames from one weekend would surface as a
 * visible slab of one venue. They are spread through the array in short runs.
 *
 * Run:
 *   npx tsx scripts/deck/build-wall-tiles.mts            # encode, then print the array
 *   npx tsx scripts/deck/build-wall-tiles.mts --write    # ... and splice it in
 *   npx tsx scripts/deck/build-wall-tiles.mts --check    # validate sources, encode nothing
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { dHash, hammingDistance } from "../lib/phash";

const REPO = process.cwd();
const WALL_DIR = path.join(REPO, "public/img/wall");
const TILES_MODULE = path.join(REPO, "lib/deck/wall-tiles.ts");
const SOURCES = path.join(REPO, "scripts/deck/wall-tile-sources.json");

const TILE_WIDTH = 520;
const QUALITY = 72;
/** The luminance band documented in lib/deck/wall-tiles.ts. */
const LUMA_MIN = 47;
const LUMA_MAX = 150;
/**
 * How different a new tile must be from every existing one.
 *
 * Not the `<= 6` that build-event-archive.mts uses to spot one photo
 * re-encoded — this is the opposite question, asked of two photographs that
 * were never the same file. Seven is the first distance at which two frames
 * from one burst reliably separate.
 */
const MIN_DISTANCE = 7;

type SourceFile = {
  sourceRoots: Record<string, string>;
  tiles: { source: string; name: string }[];
};

function resolveSource(source: string, roots: Record<string, string>): string {
  const named = source.match(/^([A-Za-z0-9_-]+):(.+)$/);
  if (!named) return path.isAbsolute(source) ? source : path.join(REPO, source);
  const [, key, file] = named;
  const envKey = `WALL_SOURCE_ROOT_${key.toUpperCase().replace(/-/g, "_")}`;
  const root = process.env[envKey] ?? roots[key];
  if (!root) {
    throw new Error(`Source root "${key}" is not defined in ${path.relative(REPO, SOURCES)}`);
  }
  return path.join(root, file);
}

/**
 * Spread additions through the existing pool in short runs.
 *
 * Evenly spaced single insertions would be tidier but produce a wall where
 * every Nth tile is the same venue, which reads as a pattern. Runs of three
 * scatter better at the sizes a wall is actually seen.
 */
function interleave(existing: string[], additions: string[], run = 3): string[] {
  if (additions.length === 0) return existing;
  const groups: string[][] = [];
  for (let i = 0; i < additions.length; i += run) {
    groups.push(additions.slice(i, i + run));
  }
  const gap = Math.max(1, Math.floor(existing.length / (groups.length + 1)));
  const out: string[] = [];
  let g = 0;
  for (let i = 0; i < existing.length; i++) {
    out.push(existing[i]);
    if (g < groups.length && (i + 1) % gap === 0) {
      out.push(...groups[g++]);
    }
  }
  while (g < groups.length) out.push(...groups[g++]);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const checkOnly = args.includes("--check");

  const spec = JSON.parse(await fs.readFile(SOURCES, "utf8")) as SourceFile;
  const moduleText = await fs.readFile(TILES_MODULE, "utf8");

  const existingPaths = [...moduleText.matchAll(/"(\/img\/wall\/[^"]+)"/g)].map((m) => m[1]);
  if (existingPaths.length === 0) {
    throw new Error(`Found no tile paths in ${path.relative(REPO, TILES_MODULE)}`);
  }

  // Hash the pool once; every candidate is measured against all of it.
  const poolHashes: { file: string; hash: bigint }[] = [];
  for (const p of existingPaths) {
    const abs = path.join(REPO, "public", p);
    poolHashes.push({ file: path.basename(p), hash: await dHash(abs) });
  }
  console.log(`pool: ${poolHashes.length} existing tiles`);

  const failures: string[] = [];
  const accepted: { name: string; src: string; hash: bigint }[] = [];

  for (const tile of spec.tiles) {
    const abs = resolveSource(tile.source, spec.sourceRoots);
    const meta = await sharp(abs).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (w <= h) {
      failures.push(`${tile.name}: not landscape (${w}x${h})`);
      continue;
    }
    const luma = (await sharp(abs).greyscale().stats()).channels[0].mean;
    if (luma < LUMA_MIN || luma > LUMA_MAX) {
      failures.push(`${tile.name}: mean luminance ${luma.toFixed(1)} outside ${LUMA_MIN}-${LUMA_MAX}`);
      continue;
    }
    const hash = await dHash(abs);
    const clashPool = poolHashes.find((p) => hammingDistance(p.hash, hash) < MIN_DISTANCE);
    if (clashPool) {
      failures.push(`${tile.name}: too close to existing tile ${clashPool.file}`);
      continue;
    }
    const clashNew = accepted.find((a) => hammingDistance(a.hash, hash) < MIN_DISTANCE);
    if (clashNew) {
      failures.push(`${tile.name}: too close to new tile ${clashNew.name}`);
      continue;
    }
    accepted.push({ name: tile.name, src: abs, hash });
  }

  if (failures.length) {
    console.error(`\n${failures.length} source(s) refused:`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error("\nFix or remove them in scripts/deck/wall-tile-sources.json. Nothing was written.");
    process.exit(1);
  }
  console.log(`accepted: ${accepted.length} new tiles`);
  if (checkOnly) return;

  await fs.mkdir(WALL_DIR, { recursive: true });
  let encoded = 0;
  let bytes = 0;
  for (const tile of accepted) {
    const out = path.join(WALL_DIR, `${tile.name}.webp`);
    try {
      await fs.access(out);
      console.log(`  exists, left alone: ${tile.name}.webp`);
    } catch {
      const info = await sharp(tile.src)
        .rotate()
        .resize({ width: TILE_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(out);
      bytes += info.size;
      encoded++;
    }
  }
  console.log(`encoded ${encoded} tiles, ${Math.round(bytes / 1024)} KB`);

  const merged = interleave(
    existingPaths,
    accepted.map((t) => `/img/wall/${t.name}.webp`),
  );

  // The module is CRLF on disk; keep it that way or the diff is the whole file.
  const eol = moduleText.includes("\r\n") ? "\r\n" : "\n";
  const arrayBody = merged.map((p) => `  "${p}",`).join(eol);
  const next = moduleText.replace(
    /(export const wallTiles: string\[\] = \[\r?\n)[\s\S]*?(\r?\n\];)/,
    (_m, head: string, tail: string) => `${head}${arrayBody}${tail}`,
  );
  if (next === moduleText) {
    throw new Error("Could not find the wallTiles array to splice — has the module changed shape?");
  }

  if (!write) {
    console.log(`\n--write not passed. ${merged.length} tiles would be spliced into ${path.relative(REPO, TILES_MODULE)}.`);
    return;
  }
  await fs.writeFile(TILES_MODULE, next);

  let total = 0;
  for (const p of merged) {
    total += (await fs.stat(path.join(REPO, "public", p))).size;
  }
  console.log(`\nwrote ${merged.length} tiles -> ${path.relative(REPO, TILES_MODULE)}`);
  console.log(
    `Update that file's JSDoc by hand: it says "118 photographs" and "~2855 KB"; ` +
      `the pool is now ${merged.length} photographs and ~${Math.round(total / 1024)} KB.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
