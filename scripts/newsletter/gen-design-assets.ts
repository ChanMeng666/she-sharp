/**
 * Newsletter design-asset generator.
 *
 * Generates a reusable kit of BACKGROUND-ART-ONLY images for the monthly
 * newsletter email template using OpenAI image models, post-processes each to
 * email weight with ffmpeg, uploads to Vercel Blob under
 * `newsletter/assets/v1/<key>.<ext>`, and writes/updates a manifest at
 * `emails/assets-manifest.json` mapping key -> {url, width, height, bytes, ...}.
 *
 * The generated images must contain NO text/letters/logos — real copy is
 * overlaid in HTML by the email template. AI-rendered text is unreliable.
 *
 * Env (parsed from .env.local in-repo; values may be quoted):
 *   OPENAI_API_KEY, BLOB_READ_WRITE_TOKEN
 *
 * Usage:
 *   npx tsx scripts/newsletter/gen-design-assets.ts            # generate whole kit
 *   npx tsx scripts/newsletter/gen-design-assets.ts --only hero-community,divider-wave
 *   npx tsx scripts/newsletter/gen-design-assets.ts --dry-run  # print the spec, generate nothing
 */

import { execFileSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { dirname, join, resolve } from "path";
import OpenAI from "openai";
import { put } from "@vercel/blob";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface PostProcess {
  /** Output container. jpeg flattens alpha; png keeps it. */
  format: "jpeg" | "png";
  /** Target longest-edge width in px (never upscales past source). */
  maxWidth: number;
  /** Byte budget in KB — the final file must be <= this. */
  targetKb: number;
  /**
   * Optional ffmpeg `-vf` override used verbatim (e.g. a crop+scale chain).
   * Must include its own scale; replaces the default scale filter entirely.
   */
  vf?: string;
}

interface AssetSpec {
  key: string;
  model: string;
  prompt: string;
  size: `${number}x${number}`;
  quality: "high" | "medium" | "low";
  /** Set to "transparent" for gpt-image-1-mini alpha output. */
  background?: "transparent" | "opaque";
  postprocess: PostProcess;
}

interface ManifestEntry {
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: "jpeg" | "png";
  model: string;
  prompt: string;
}

type Manifest = Record<string, ManifestEntry>;

/* ------------------------------------------------------------------ */
/* Kit spec (Deliverable 2)                                           */
/* ------------------------------------------------------------------ */

const PALETTE =
  "purple #9b2e83, purple-mid #c846ab, periwinkle #8982ff, mint #b1f6e9, " +
  "on a very light lavender background #f4f4fa";

const NO_TEXT =
  "Strictly no text, no letters, no words, no numbers, no logos, no watermark, " +
  "no human faces, no people.";

const KIT: AssetSpec[] = [
  {
    key: "hero-community",
    model: "gpt-image-2",
    size: "1536x1024",
    quality: "high",
    prompt:
      `Wide flat-vector abstract banner illustration. Interconnected glowing ` +
      `nodes and orbiting rings suggesting a warm, supportive community network. ` +
      `Clean geometric shapes and soft gradients flowing ${PALETTE}, with mint ` +
      `#b1f6e9 accent dots. Generous empty negative space through the vertical ` +
      `center of the composition for overlaid text. Airy, optimistic, premium, ` +
      `modern non-profit brand feel. ${NO_TEXT}`,
    postprocess: { format: "jpeg", maxWidth: 1200, targetKb: 180 },
  },
  {
    key: "hero-growth",
    model: "gpt-image-2",
    size: "1536x1024",
    quality: "high",
    prompt:
      `Wide flat-vector abstract banner illustration. Ascending botanical ` +
      `koru-inspired spirals and rising geometric steps evoking growth and ` +
      `mentorship; a subtle nod to a New Zealand fern curve without being ` +
      `literal. Soft gradients flowing ${PALETTE}, with mint #b1f6e9 accents. ` +
      `Generous empty negative space through the vertical center for overlaid ` +
      `text. Airy, optimistic, premium, modern. ${NO_TEXT}`,
    postprocess: { format: "jpeg", maxWidth: 1200, targetKb: 180 },
  },
  {
    key: "hero-tech",
    model: "gpt-image-2",
    size: "1536x1024",
    quality: "high",
    prompt:
      `Wide flat-vector abstract banner illustration. A minimal ` +
      `circuit-meets-constellation motif: thin periwinkle #8982ff linework with ` +
      `small mint #b1f6e9 node dots and one bold purple #9b2e83 focal arc. ` +
      `Mostly light lavender #f4f4fa background with generous empty negative ` +
      `space through the vertical center for overlaid text. Airy, precise, ` +
      `premium, modern. ${NO_TEXT}`,
    postprocess: { format: "jpeg", maxWidth: 1200, targetKb: 180 },
  },
  {
    key: "divider-wave",
    model: "gpt-image-1-mini",
    size: "1536x1024",
    quality: "high",
    background: "transparent",
    prompt:
      `A single flowing horizontal ribbon wave stroke, centered, spanning the ` +
      `full width, on a fully transparent background. The ribbon blends a smooth ` +
      `gradient from purple #9b2e83 to periwinkle #8982ff to mint #b1f6e9. ` +
      `Elegant, minimal, clean vector, soft edges. Nothing else in the frame. ` +
      `${NO_TEXT}`,
    // Crop the middle horizontal band from the square, then scale to a wide strip.
    postprocess: {
      format: "png",
      maxWidth: 1200,
      targetKb: 120,
      vf: "crop=iw:ih/5:0:ih*2/5,scale=1200:-2:flags=lanczos",
    },
  },
  {
    key: "footer-motif",
    model: "gpt-image-1-mini",
    size: "1024x1024",
    quality: "high",
    background: "transparent",
    prompt:
      `A small delicate constellation of dots connected by thin lines forming a ` +
      `gentle upward arc, on a fully transparent background. Light-colored ` +
      `strokes only — mint #b1f6e9 and periwinkle #8982ff — because it will sit ` +
      `on a dark navy background. Minimal, airy, centered, lots of empty space. ` +
      `${NO_TEXT}`,
    postprocess: { format: "png", maxWidth: 400, targetKb: 60 },
  },
  {
    key: "spotlight-frame",
    model: "gpt-image-1-mini",
    size: "1024x1024",
    quality: "high",
    background: "transparent",
    prompt:
      `Soft abstract corner ornaments in only two opposite corners (top-left and ` +
      `bottom-right) of the frame, on a fully transparent background. Thin ` +
      `geometric periwinkle #8982ff and mint #b1f6e9 linework and small dots ` +
      `framing a completely empty transparent center. Delicate, minimal, ` +
      `symmetrical, elegant. ${NO_TEXT}`,
    postprocess: { format: "png", maxWidth: 600, targetKb: 80 },
  },
];

/* ------------------------------------------------------------------ */
/* Paths                                                              */
/* ------------------------------------------------------------------ */

const REPO_ROOT = resolve(__dirname, "..", "..");
const MANIFEST_PATH = join(REPO_ROOT, "emails", "assets-manifest.json");
// Intermediate raw + post-processed images are scratch work, not repo files;
// keep them out of the repo tree. Override with ASSET_GEN_WORK_DIR if desired.
const WORK_DIR =
  process.env.ASSET_GEN_WORK_DIR ||
  "D:\\.claude-scratch\\2026-07-21\\newsletter-assets";
const BLOB_PREFIX = "newsletter/assets/v1";

/* ------------------------------------------------------------------ */
/* Env loading                                                        */
/* ------------------------------------------------------------------ */

/** Parse KEY=VALUE pairs from .env.local, stripping optional surrounding quotes. */
function loadEnv(): { openaiKey: string; blobToken: string } {
  const envPath = join(REPO_ROOT, ".env.local");
  const raw = readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[m[1]] = value;
  }
  const openaiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
  const blobToken =
    env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || "";
  if (!openaiKey) throw new Error("OPENAI_API_KEY not found in .env.local");
  if (!blobToken) throw new Error("BLOB_READ_WRITE_TOKEN not found in .env.local");
  return { openaiKey, blobToken };
}

/* ------------------------------------------------------------------ */
/* ffmpeg / ffprobe helpers                                           */
/* ------------------------------------------------------------------ */

function ffmpeg(args: string[]): void {
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args]);
}

/** Return [width, height] of an image file via ffprobe. */
function probeDimensions(file: string): [number, number] {
  const out = execFileSync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "csv=p=0",
    file,
  ])
    .toString()
    .trim();
  const [w, h] = out.split(",").map((n) => parseInt(n, 10));
  return [w, h];
}

function kb(file: string): number {
  return statSync(file).size / 1024;
}

/**
 * Encode a JPEG at the highest quality (lowest -q:v) that still fits targetKb.
 * ffmpeg mjpeg -q:v ranges 2 (best/largest) .. 31 (worst/smallest).
 */
function encodeJpeg(src: string, dst: string, pp: PostProcess): void {
  const vf = pp.vf ?? `scale='min(${pp.maxWidth},iw)':-2:flags=lanczos`;
  const qLadder = [2, 3, 4, 5, 6, 8, 10, 13, 16, 20, 25, 31];
  for (const q of qLadder) {
    ffmpeg([
      "-i",
      src,
      "-vf",
      vf,
      "-map_metadata",
      "-1",
      "-q:v",
      String(q),
      dst,
    ]);
    if (kb(dst) <= pp.targetKb) return;
  }
  // Ladder exhausted — keep the smallest (q=31) result even if slightly over.
}

/**
 * Encode a PNG preserving alpha at max compression; if over budget, progressively
 * downscale width until it fits (transparent art compresses well, so this is rare).
 */
function encodePng(src: string, dst: string, pp: PostProcess): void {
  let width = pp.maxWidth;
  for (let attempt = 0; attempt < 6; attempt++) {
    const vf = pp.vf
      ? pp.vf.replace(/scale=\d+/, `scale=${width}`)
      : `scale='min(${width},iw)':-2:flags=lanczos`;
    ffmpeg([
      "-i",
      src,
      "-vf",
      vf,
      "-map_metadata",
      "-1",
      "-pix_fmt",
      "rgba",
      "-compression_level",
      "9",
      "-pred",
      "mixed",
      dst,
    ]);
    if (kb(dst) <= pp.targetKb) return;
    width = Math.round(width * 0.82);
  }
}

/* ------------------------------------------------------------------ */
/* Generation                                                         */
/* ------------------------------------------------------------------ */

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  } catch {
    return {};
  }
}

function saveManifest(manifest: Manifest): void {
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  const ordered: Manifest = {};
  for (const key of Object.keys(manifest).sort()) ordered[key] = manifest[key];
  writeFileSync(MANIFEST_PATH, JSON.stringify(ordered, null, 2) + "\n", "utf8");
}

async function generateOne(
  spec: AssetSpec,
  openai: OpenAI,
  blobToken: string
): Promise<ManifestEntry> {
  console.log(`\n[${spec.key}] generating with ${spec.model} (${spec.quality}, ${spec.size})...`);

  const req: Record<string, unknown> = {
    model: spec.model,
    prompt: spec.prompt,
    size: spec.size,
    quality: spec.quality,
    n: 1,
  };
  if (spec.background === "transparent") {
    req.background = "transparent";
    req.output_format = "png";
  }

  const res = await openai.images.generate(req as never);
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No image data returned for ${spec.key}`);

  const rawPath = join(WORK_DIR, `${spec.key}.raw.png`);
  writeFileSync(rawPath, Buffer.from(b64, "base64"));
  console.log(`[${spec.key}] raw saved (${kb(rawPath).toFixed(0)} KB) -> ${rawPath}`);

  const ext = spec.postprocess.format === "jpeg" ? "jpg" : "png";
  const outPath = join(WORK_DIR, `${spec.key}.${ext}`);
  if (spec.postprocess.format === "jpeg") {
    encodeJpeg(rawPath, outPath, spec.postprocess);
  } else {
    encodePng(rawPath, outPath, spec.postprocess);
  }

  const [width, height] = probeDimensions(outPath);
  const bytes = statSync(outPath).size;
  console.log(
    `[${spec.key}] post-processed -> ${outPath} (${(bytes / 1024).toFixed(0)} KB, ${width}x${height})`
  );

  const contentType = ext === "jpg" ? "image/jpeg" : "image/png";
  const blob = await put(
    `${BLOB_PREFIX}/${spec.key}.${ext}`,
    readFileSync(outPath),
    {
      access: "public",
      addRandomSuffix: true,
      contentType,
      token: blobToken,
    }
  );
  console.log(`[${spec.key}] uploaded -> ${blob.url}`);

  return {
    url: blob.url,
    width,
    height,
    bytes,
    format: spec.postprocess.format,
    model: spec.model,
    prompt: spec.prompt,
  };
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyArg = args.find((a) => a.startsWith("--only"));
  let onlyKeys: string[] | null = null;
  if (onlyArg) {
    const inline = onlyArg.includes("=") ? onlyArg.split("=")[1] : args[args.indexOf(onlyArg) + 1];
    onlyKeys = (inline || "").split(",").map((s) => s.trim()).filter(Boolean);
  }

  const specs = onlyKeys ? KIT.filter((s) => onlyKeys!.includes(s.key)) : KIT;
  if (onlyKeys && specs.length === 0) {
    console.error(`No kit assets match --only ${onlyKeys.join(",")}`);
    console.error(`Available keys: ${KIT.map((s) => s.key).join(", ")}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(JSON.stringify(specs, null, 2));
    return;
  }

  const { openaiKey, blobToken } = loadEnv();
  const openai = new OpenAI({ apiKey: openaiKey });
  mkdirSync(WORK_DIR, { recursive: true });

  const manifest = loadManifest();
  for (const spec of specs) {
    const entry = await generateOne(spec, openai, blobToken);
    manifest[spec.key] = entry;
    saveManifest(manifest); // persist after each success (resilient to mid-run failure)
  }

  console.log(`\nDone. Manifest at ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error("gen-design-assets failed:", err);
  process.exit(1);
});
