/**
 * optimize-images.mts — Build responsive WebP variants for the curated hero set.
 *
 * Reads scripts/curated-picks.json, then for each pick emits
 * public/img/curated/{name}-{1920,1280,768}.webp (sharp, quality 78, never
 * enlarged) and writes a typed public/img/curated/index.ts exporting the
 * `curatedImages` map consumed by the design system.
 *
 * THE PICKS FILE IS THE SOURCE OF TRUTH, AND IT IS COMMITTED.
 * It did not used to be: the file that produced the first 47 entries lived in a
 * throwaway scratchpad and the default path pointed at it. Because this script
 * REGENERATES index.ts from whatever picks it is handed, running it with a
 * partial list silently deleted every entry not in that list — taking four
 * components down with it and orphaning 141 files, which the reverse check in
 * verify-image-paths.ts would then fail on. Two things now make that impossible:
 *
 *   1. The picks file is in the repo and lists every entry.
 *   2. `assertNoRemovals()` reads the existing index.ts and REFUSES to write if
 *      any key would disappear. `--allow-removals` is the deliberate override.
 *
 * PREBUILT ENTRIES. The original 47 picks record `"source": null` and a
 * `prebuilt` block, because their source images were never committed and are
 * unrecoverable. Their renditions on disk ARE the archive: this script verifies
 * the files exist and re-emits their entries verbatim, without touching sharp.
 * `--freeze` converts a freshly built pick into a prebuilt one, which is what
 * keeps the next run from re-encoding a file that `/img/*` already serves under
 * a one-year immutable cache (re-encoding in place is forbidden — a content
 * change needs a new filename).
 *
 * Usage:
 *   npx tsx scripts/optimize-images.mts                      # rebuild from the committed picks
 *   npx tsx scripts/optimize-images.mts --freeze             # ... and record new picks as prebuilt
 *   npx tsx scripts/optimize-images.mts other-picks.json     # a different picks file
 *   CURATED_OUT=/tmp/dry npx tsx scripts/optimize-images.mts # throwaway target
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const REPO = process.cwd();
// Defaults to the real asset dir; CURATED_OUT allows a throwaway dry-run target.
const OUT_DIR = process.env.CURATED_OUT
  ? path.resolve(process.env.CURATED_OUT)
  : path.join(REPO, "public/img/curated");
const QUALITY = 78;
const TARGET_WIDTHS = [1920, 1280, 768] as const;

const DEFAULT_PICKS = path.join(REPO, "scripts/curated-picks.json");

type Role = "hero" | "divider" | "card" | "support";

/**
 * `label` is the filename suffix; `w` is the pixel width actually emitted.
 * They differ when the source was narrower than the label, because this script
 * never enlarges — a 1878px source still produces `name-1920.webp`, at 1878px.
 */
type Variant = { label: number; w: number };

type Pick = {
  name: string;
  alt: string;
  role?: Role;
  /**
   * Where the original lives. One of:
   *   "<root>:<file>"  resolved against `sourceRoots[root]` in the picks file
   *   an absolute path
   *   a repo-relative path
   *   null             the source is gone; `prebuilt` must be present
   */
  source?: string | null;
  prebuilt?: { width: number; height: number; variants: Variant[] };
  note?: string;
};

type PicksFile = { sourceRoots?: Record<string, string>; picks: Pick[] };

type Entry = {
  name: string;
  role: string;
  alt: string;
  width: number; // largest variant width
  height: number; // largest variant height
  variants: { w: number; file: string }[]; // actual emitted widths
};

/**
 * Resolve a pick's source image.
 *
 * A named root keeps per-pick entries short and lets another machine repoint a
 * whole shoot with one env var — the 2026 hackathon originals are 1.1 GB of
 * 4000px JPEGs sitting outside the repo, which is where they belong.
 */
function resolveSource(pick: Pick, roots: Record<string, string>): string {
  const raw = pick.source;
  if (!raw) {
    throw new Error(`Pick "${pick.name}" has no source and no prebuilt block`);
  }
  const named = raw.match(/^([A-Za-z0-9_-]+):(.+)$/);
  if (named) {
    const [, key, file] = named;
    const envKey = `CURATED_SOURCE_ROOT_${key.toUpperCase().replace(/-/g, "_")}`;
    const root = process.env[envKey] ?? roots[key];
    if (!root) {
      throw new Error(
        `Pick "${pick.name}" names source root "${key}", which the picks file does not define`,
      );
    }
    return path.join(root, file);
  }
  return path.isAbsolute(raw) ? raw : path.join(REPO, raw);
}

/**
 * Refuse to write an index.ts that drops an existing key.
 *
 * This is the guard that makes the historical hazard unreachable. It reads the
 * generated file as text rather than importing it, so a half-written or
 * syntactically broken index.ts fails loudly instead of parsing as empty.
 */
async function assertNoRemovals(nextNames: Set<string>, allowRemovals: boolean) {
  const indexPath = path.join(OUT_DIR, "index.ts");
  let existing: string;
  try {
    existing = await fs.readFile(indexPath, "utf8");
  } catch {
    return; // first build into this directory
  }
  const keys = [...existing.matchAll(/^ {2}"([a-z0-9-]+)": \{$/gm)].map((m) => m[1]);
  const missing = keys.filter((k) => !nextNames.has(k));
  if (missing.length === 0) return;

  const plural = missing.length === 1 ? "y" : "ies";
  if (allowRemovals) {
    console.warn(
      `--allow-removals: dropping ${missing.length} entr${plural}: ${missing.join(", ")}`,
    );
    return;
  }
  throw new Error(
    `Refusing to write: ${missing.length} existing curated entr${plural} would disappear\n` +
      missing.map((m) => `  - ${m}`).join("\n") +
      "\n\nThe picks file must list every entry, because index.ts is regenerated from it." +
      "\nIf the removal is deliberate, re-run with --allow-removals and delete the orphaned" +
      "\nwebp files in the same commit (scripts/verify-image-paths.ts fails on unreferenced images).",
  );
}

async function main() {
  const args = process.argv.slice(2);
  const freeze = args.includes("--freeze");
  const allowRemovals = args.includes("--allow-removals");
  const positional = args.find((a) => !a.startsWith("--"));
  const picksPath = positional ? path.resolve(positional) : DEFAULT_PICKS;

  const parsed = JSON.parse(await fs.readFile(picksPath, "utf8")) as PicksFile;
  const picks = parsed.picks ?? [];
  const roots = parsed.sourceRoots ?? {};
  if (!picks.length) throw new Error(`No picks found in ${picksPath}`);

  // Reject duplicate semantic names early — they would collide on disk / in the map.
  const seen = new Set<string>();
  for (const p of picks) {
    if (seen.has(p.name)) throw new Error(`Duplicate pick name: ${p.name}`);
    seen.add(p.name);
  }

  await assertNoRemovals(seen, allowRemovals);
  await fs.mkdir(OUT_DIR, { recursive: true });

  const entries: Entry[] = [];
  const frozen: Pick[] = [];

  for (const pick of picks) {
    if (pick.prebuilt) {
      // Already on disk behind a one-year immutable cache. Verify, re-emit,
      // never re-encode: the bytes at these URLs are not allowed to change.
      const variants: { w: number; file: string }[] = [];
      for (const v of pick.prebuilt.variants) {
        const file = `${pick.name}-${v.label}.webp`;
        try {
          await fs.access(path.join(OUT_DIR, file));
        } catch {
          throw new Error(`Prebuilt pick "${pick.name}" is missing ${file} in ${OUT_DIR}`);
        }
        variants.push({ w: v.w, file });
      }
      entries.push({
        name: pick.name,
        role: pick.role ?? "support",
        alt: pick.alt,
        width: pick.prebuilt.width,
        height: pick.prebuilt.height,
        variants,
      });
      frozen.push(pick);
      continue;
    }

    const abs = resolveSource(pick, roots);
    const meta = await sharp(abs).metadata();
    const ow = meta.width ?? 0;
    const oh = meta.height ?? 0;
    if (!ow || !oh) {
      console.warn(`skip (no dims): ${pick.source}`);
      continue;
    }

    // Emit one file per label; never enlarge — cap each label at the source width.
    const variants: { w: number; file: string }[] = [];
    const recorded: Variant[] = [];
    for (const label of TARGET_WIDTHS) {
      const w = Math.min(label, ow);
      const file = `${pick.name}-${label}.webp`;
      await sharp(abs)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(path.join(OUT_DIR, file));
      variants.push({ w, file });
      recorded.push({ label, w });
    }

    // Largest variant drives layout width/height.
    const top = variants[0];
    const topH = Math.round((oh * top.w) / ow);
    entries.push({
      name: pick.name,
      role: pick.role ?? "support",
      alt: pick.alt,
      width: top.w,
      height: topH,
      variants,
    });
    frozen.push({
      ...pick,
      prebuilt: { width: top.w, height: topH, variants: recorded },
    });
    console.log(`${pick.name}: ${variants.map((v) => v.w).join("/")} from ${ow}x${oh}`);
  }

  // Generate the typed index.ts.
  const body = entries
    .map((e) => {
      const srcSet = e.variants
        .map((v) => `      "${v.w}": "/img/curated/${v.file}",`)
        .join("\n");
      return `  "${e.name}": {
    src: "/img/curated/${e.variants[0].file}",
    srcSet: {
${srcSet}
    },
    width: ${e.width},
    height: ${e.height},
    role: "${e.role}",
    alt: ${JSON.stringify(e.alt)},
  },`;
    })
    .join("\n");

  const ts = `// AUTO-GENERATED by scripts/optimize-images.mts — do not edit by hand.
// Curated real-event photography for the editorial design system.

export type CuratedImage = {
  src: string;
  srcSet: Record<string, string>;
  width: number;
  height: number;
  role: "hero" | "divider" | "card" | "support";
  alt: string;
};

export const curatedImages = {
${body}
} as const satisfies Record<string, CuratedImage>;

export type CuratedImageKey = keyof typeof curatedImages;

/** Build a \`srcSet\` attribute string (width descriptors) from a curated entry. */
export function toSrcSet(img: CuratedImage): string {
  return Object.entries(img.srcSet)
    .map(([w, url]) => \`\${url} \${w}w\`)
    .join(", ");
}
`;

  await fs.writeFile(path.join(OUT_DIR, "index.ts"), ts);
  console.log(`\nwrote ${entries.length} entries -> public/img/curated/index.ts`);

  if (freeze) {
    const next: PicksFile = { ...parsed, picks: frozen };
    await fs.writeFile(picksPath, JSON.stringify(next, null, 2) + "\n");
    console.log(`froze ${frozen.length} picks -> ${path.relative(REPO, picksPath)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
