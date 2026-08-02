#!/usr/bin/env node
/**
 * prepare-assets.mjs — the report's image pipeline.
 *
 * WHY THIS EXISTS: Typst 0.15 reads WebP but decodes it to raw pixels and
 * re-embeds it as Flate. A 73 KB WebP costs ~1.26 MB in the PDF (17x). JPEG is
 * passed through untouched as DCTDecode (~1.05x). With ~55 photo placements,
 * embedding the site's WebP directly produces a ~65 MB PDF; converting to JPEG
 * lands it near 7 MB. This is not an optimisation, it is the difference between
 * a deliverable and an unusable file.
 *
 * Input:  report/assets/photos.manifest.json  (hand-authored; the ONLY place a
 *         source path is written down)
 * Output: report/assets/{photos,logos,diagrams}/<key>.{jpg,png}
 *         report/assets/MANIFEST.lock.json    (idempotency ledger)
 *
 * Also renders report/diagrams/*.mmd through mermaid-cli before rasterising.
 *
 * Usage:  node report/scripts/prepare-assets.mjs [--force] [--only <substr>]
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPORT = path.resolve(HERE, "..");
const ROOT = path.resolve(REPORT, "..");

const MANIFEST = path.join(REPORT, "assets", "photos.manifest.json");
const LOCK = path.join(REPORT, "assets", "MANIFEST.lock.json");
const DIAGRAM_SRC = path.join(REPORT, "diagrams");
const DIAGRAM_RAW = path.join(DIAGRAM_SRC, ".raw");

const OUT_DIRS = {
  photos: path.join(REPORT, "assets", "photos"),
  logos: path.join(REPORT, "assets", "logos"),
  diagrams: path.join(REPORT, "assets", "diagrams"),
};

// Bump when a recipe changes so the lock invalidates every entry using it.
const RECIPE_VERSION = 4;

// The brand-purple disc baked into every team headshot on the site. Sampled
// from the sources, not guessed: all 16 use exactly this value.
const PORTRAIT_DISC = "#9b2e83";

const argv = process.argv.slice(2);
const FORCE = argv.includes("--force");
const ONLY = (() => {
  const i = argv.indexOf("--only");
  return i === -1 ? null : argv[i + 1];
})();

/* ------------------------------------------------------------------ recipes */

/**
 * Each role declares its output directory, extension and the sharp pipeline.
 * `.rotate()` always comes first so EXIF orientation is baked into the pixels
 * and then stripped — Typst honours the EXIF orientation tag inconsistently.
 * `position: "attention"` uses libvips' saliency search, which keeps faces in
 * frame on circular portrait crops and A4 plate crops where a naive centre
 * crop decapitates people in 1280x853 group photos.
 */
const ROLES = {
  // 1240x1754 = A4 at 150 dpi, NOT 1654x2339 at 200 dpi.
  //
  // Every plate source in this project is a landscape photograph about 1280-1281
  // pixels tall (the curated pool is 1920x1280; the event archive is 1280x853).
  // Cropping one to a 2:2.83 portrait page keeps its full height and throws away
  // width, so 2339 was upscaling a 1280px column by 1.83x — inventing pixels and
  // paying for them in file size. 150 dpi is a modest 1.37x, and for a
  // full-bleed photograph behind a scrim it is indistinguishable in print.
  //
  // The real lesson sits one level up: a landscape source cannot fill an A4
  // portrait page at high resolution, so a plate should be chosen for height,
  // not just for content.
  plate: {
    dir: "photos",
    ext: "jpg",
    apply: (img, o) =>
      img
        .rotate()
        .resize(o.width ?? 1240, o.height ?? 1754, { fit: "cover", position: "attention" })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 82, mozjpeg: true }),
  },
  hero: {
    dir: "photos",
    ext: "jpg",
    apply: (img, o) =>
      img
        .rotate()
        .resize({ width: o.width ?? 1100 })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:4:4" }),
  },
  card: {
    dir: "photos",
    ext: "jpg",
    apply: (img, o) =>
      img
        .rotate()
        .resize({ width: o.width ?? 760 })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 82, mozjpeg: true }),
  },
  /**
   * The site's headshots are already square: a brand-purple disc on a
   * transparent square, with the subject composed to sit inside the disc. So
   * the resize below is normally a pure downscale and `attention` never fires.
   *
   * Three of them (Tharaneetharan, Nirmala, Moksha) break that composition —
   * the head overflows the disc onto the transparent corner. Rendered in the
   * report's 27 mm circle that reads as a flat-topped skull. `pad` fixes those
   * by zooming the whole frame OUT (nothing is cropped) and filling the new
   * margin with the disc's own colour, which is exactly brand #9b2e83.
   *   pad        subject occupies this fraction of the frame (0.84 = 16% margin)
   *   padShiftY  extra downward nudge, as a fraction of frame height
   */
  portrait: {
    dir: "photos",
    ext: "jpg",
    apply: (img, o) => {
      const w = o.width ?? 460;
      const h = o.height ?? 460;
      const enc = { quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" };

      if (!o.pad) {
        return img
          .rotate()
          .resize(w, h, { fit: "cover", position: "attention" })
          .flatten({ background: "#ffffff" })
          .jpeg(enc);
      }

      const bg = o.padColour ?? PORTRAIT_DISC;
      const iw = Math.round(w * o.pad);
      const ih = Math.round(h * o.pad);
      const padX = w - iw;
      const padY = h - ih;
      const shiftY = Math.round((o.padShiftY ?? 0) * h);
      const shiftX = Math.round((o.padShiftX ?? 0) * w);
      const top = Math.min(padY, Math.max(0, Math.round(padY / 2) + shiftY));
      const left = Math.min(padX, Math.max(0, Math.round(padX / 2) + shiftX));
      return img
        .rotate()
        // Flatten BEFORE the extend so the disc's transparent corners and the
        // new margin end up the same colour — otherwise the old disc edge
        // shows as a ring inside the report's circle.
        .flatten({ background: bg })
        .resize(iw, ih, { fit: "cover", position: "attention" })
        .extend({ top, bottom: padY - top, left, right: padX - left, background: bg })
        .jpeg(enc);
    },
  },
  mosaic: {
    dir: "photos",
    ext: "jpg",
    apply: (img, o) =>
      img
        .rotate()
        .resize({ width: o.width ?? 620 })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 80, mozjpeg: true }),
  },
  "svg-raster": {
    dir: "logos",
    ext: "png",
    svgDensityTarget: 1200,
    apply: (img, o) =>
      img.resize({ width: o.width ?? 1200 }).png({ palette: true, colours: 200, compressionLevel: 9 }),
  },
  /**
   * Partner logos that only exist as raster (MOE.png, peyvand-academy.jpg,
   * little-engineers.jpg). Output lands beside the svg-raster logos as
   * `logo-<slug>.png`, so a logo resolver never has to know the source
   * extension — it only has to know which slugs are rasterised.
   *
   * Trimmed by default to the ink bounds, using sharp's top-left-pixel
   * heuristic, because the vector logos are already tight to their ink and an
   * untrimmed JPEG sits visibly smaller than its neighbours in a logo row.
   * Set `"trim": false` when the padding is part of the artwork (MOE is a
   * reversed lockup on its own plum tile; trimming eats the tile).
   */
  "raster-logo": {
    dir: "logos",
    ext: "png",
    apply: (img, o) => {
      const step = o.trim === false ? img.rotate() : img.rotate().trim();
      return step
        .resize({ width: o.width ?? 1200, withoutEnlargement: true })
        // 64, not the 200 used for svg-raster: these are two- and three-colour
        // wordmarks whose JPEG ringing quantises into hundreds of near-identical
        // shades. Capping the palette snaps the ringing flat and cuts the files
        // by ~3.5x (72 KB -> 27 KB) with no visible difference. Below 64 libvips
        // gives nothing back.
        .png({ palette: true, colours: o.colours ?? 64, compressionLevel: 9 });
    },
  },
  diagram: {
    dir: "diagrams",
    ext: "png",
    apply: (img, o) =>
      img
        // withoutEnlargement: mmdc already renders above 2200px, and upscaling
        // a vector-derived raster only adds blur and bytes.
        .resize({ width: o.width ?? 2200, withoutEnlargement: true })
        .png({ palette: true, colours: 128, compressionLevel: 9 }),
  },
};

/* ------------------------------------------------------------------- helpers */

const fmt = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;

function fail(msg) {
  console.error(`\n  ERROR  ${msg}\n`);
  process.exitCode = 1;
}

const hashCache = new Map();

/**
 * Content hash of a source file. mtime alone is not enough: git does not
 * preserve mtimes, so on a fresh clone every entry would look stale and the
 * diagrams would be re-rendered through Chromium for no reason. mtime+size is
 * kept as the fast path and the hash is the authority when it disagrees.
 */
function hashFile(abs) {
  if (hashCache.has(abs)) return hashCache.get(abs);
  const h = crypto.createHash("sha1").update(fs.readFileSync(abs)).digest("hex").slice(0, 16);
  hashCache.set(abs, h);
  return h;
}

/** Stable fingerprint of everything that determines an output's bytes. */
function optionsFingerprint(entry) {
  return JSON.stringify([
    RECIPE_VERSION,
    entry.role,
    entry.width ?? null,
    entry.height ?? null,
    entry.trim ?? null,
    entry.colours ?? null,
    entry.pad ?? null,
    entry.padShiftY ?? null,
    entry.padShiftX ?? null,
    entry.padColour ?? null,
  ]);
}

/**
 * SVGs rasterise at their natural size, so resizing up to 1200px afterwards is
 * a blur. Raise librsvg's render density instead, capped so a huge embedded
 * raster (wahine-kakano is a base64 bitmap inside a <pattern>) cannot blow up
 * memory.
 */
async function svgDensity(absSrc, targetWidth) {
  const meta = await sharp(absSrc).metadata();
  if (!meta.width) return 300;
  return Math.min(600, Math.max(72, Math.round((72 * targetWidth) / meta.width)));
}

/* ------------------------------------------------------------------- mermaid */

/**
 * Render every report/diagrams/*.mmd to report/diagrams/.raw/<name>.png via
 * mermaid-cli. Skipped when the .mmd, the CSS and the puppeteer config are all
 * older than the PNG, so a rebuild costs nothing.
 */
function renderMermaid(lock) {
  if (!fs.existsSync(DIAGRAM_SRC)) return { rendered: 0, skipped: 0 };
  const sources = fs
    .readdirSync(DIAGRAM_SRC)
    .filter((f) => f.endsWith(".mmd"))
    .sort();
  if (sources.length === 0) return { rendered: 0, skipped: 0 };

  fs.mkdirSync(DIAGRAM_RAW, { recursive: true });
  const css = path.join(DIAGRAM_SRC, "mermaid.css");
  const pupp = path.join(DIAGRAM_SRC, "puppeteer.json");
  const cssMtime = fs.existsSync(css) ? fs.statSync(css).mtimeMs : 0;

  let rendered = 0;
  let skipped = 0;
  for (const file of sources) {
    const name = file.replace(/\.mmd$/, "");
    if (ONLY && !name.includes(ONLY)) continue;
    const src = path.join(DIAGRAM_SRC, file);
    const out = path.join(DIAGRAM_RAW, `${name}.png`);
    const st = fs.statSync(src);
    const key = `mmd:${name}`;
    const prev = lock[key];
    const stamp = {
      mtimeMs: st.mtimeMs,
      size: st.size,
      cssMtime,
      hash: hashFile(src),
      cssHash: fs.existsSync(css) ? hashFile(css) : null,
    };

    if (
      !FORCE &&
      prev &&
      fs.existsSync(out) &&
      prev.hash === stamp.hash &&
      prev.cssHash === stamp.cssHash
    ) {
      lock[key] = stamp; // refresh the mtime fast path
      skipped += 1;
      continue;
    }

    const args = [
      "-i", src,
      "-o", out,
      "-b", "white",
      // scale 4 keeps both diagrams above the 2200px raster target, so the
      // sharp step only ever downsamples.
      "-s", "4",
      "-w", "1400",
    ];
    if (fs.existsSync(css)) args.push("-C", css);
    if (fs.existsSync(pupp)) args.push("-p", pupp);

    process.stdout.write(`  mermaid  ${name} ... `);
    const res = spawnSync("mmdc", args, { cwd: ROOT, shell: true, encoding: "utf8" });
    if (res.status !== 0 || !fs.existsSync(out)) {
      console.log("FAILED");
      fail(`mmdc failed for ${file}\n${res.stderr || res.stdout || res.error}`);
      continue;
    }
    console.log(`${fmt(fs.statSync(out).size)}`);
    lock[key] = stamp;
    rendered += 1;
  }
  return { rendered, skipped };
}

/* ---------------------------------------------------------------------- main */

async function main() {
  if (!fs.existsSync(MANIFEST)) {
    fail(`manifest not found: ${path.relative(ROOT, MANIFEST)}`);
    return;
  }
  const manifest = JSON.parse(await fsp.readFile(MANIFEST, "utf8"));
  const lock = !FORCE && fs.existsSync(LOCK) ? JSON.parse(await fsp.readFile(LOCK, "utf8")) : {};

  for (const dir of Object.values(OUT_DIRS)) fs.mkdirSync(dir, { recursive: true });

  const mmd = renderMermaid(lock);
  if (mmd.rendered || mmd.skipped) {
    console.log(`  diagrams: ${mmd.rendered} rendered, ${mmd.skipped} up to date\n`);
  }

  const keys = Object.keys(manifest).filter((k) => !ONLY || k.includes(ONLY));
  let written = 0;
  let skippedCount = 0;
  let total = 0;
  const byRole = {};

  for (const key of keys) {
    const entry = manifest[key];
    const role = ROLES[entry.role];
    if (!role) {
      fail(`unknown role "${entry.role}" for key "${key}"`);
      continue;
    }
    const absSrc = path.resolve(ROOT, entry.src);
    if (!fs.existsSync(absSrc)) {
      fail(`source missing for "${key}": ${entry.src}`);
      continue;
    }
    const st = fs.statSync(absSrc);
    const outPath = path.join(OUT_DIRS[role.dir], `${key}.${role.ext}`);
    const relOut = path.relative(ROOT, outPath).replace(/\\/g, "/");
    const fingerprint = optionsFingerprint(entry);
    const prev = lock[key];

    const unchanged =
      !FORCE &&
      prev &&
      prev.src === entry.src &&
      prev.options === fingerprint &&
      fs.existsSync(outPath) &&
      fs.statSync(outPath).size === prev.outBytes &&
      // Fast path first; fall back to the content hash so a fresh clone (which
      // has new mtimes on every file) does not rebuild all 67 assets.
      ((prev.sourceMtimeMs === st.mtimeMs && prev.sourceSize === st.size) ||
        prev.sourceHash === hashFile(absSrc));

    if (unchanged) {
      lock[key] = {
        ...prev,
        sourceMtimeMs: st.mtimeMs,
        sourceSize: st.size,
        // Backfill so an entry locked before hashing existed self-heals rather
        // than rebuilding the first time its mtime moves.
        sourceHash: prev.sourceHash ?? hashFile(absSrc),
      };
      skippedCount += 1;
      total += prev.outBytes;
      byRole[entry.role] = (byRole[entry.role] ?? 0) + prev.outBytes;
      continue;
    }

    try {
      const readOpts = {};
      if (absSrc.toLowerCase().endsWith(".svg")) {
        readOpts.density = await svgDensity(absSrc, entry.width ?? role.svgDensityTarget ?? 1200);
      }
      const buf = await role.apply(sharp(absSrc, readOpts), entry).toBuffer();
      await fsp.writeFile(outPath, buf);
      const outBytes = buf.length;
      lock[key] = {
        src: entry.src,
        role: entry.role,
        sourceMtimeMs: st.mtimeMs,
        sourceSize: st.size,
        sourceHash: hashFile(absSrc),
        options: fingerprint,
        out: relOut,
        outBytes,
      };
      written += 1;
      total += outBytes;
      byRole[entry.role] = (byRole[entry.role] ?? 0) + outBytes;
      console.log(
        `  ${entry.role.padEnd(10)} ${key.padEnd(58)} ${fmt(outBytes).padStart(8)}  <- ${entry.src}`
      );
    } catch (err) {
      fail(`failed to process "${key}" (${entry.src}): ${err.message}`);
    }
  }

  // Drop lock entries whose manifest key is gone, and delete their outputs.
  if (!ONLY) {
    for (const key of Object.keys(lock)) {
      if (key.startsWith("mmd:")) continue;
      if (manifest[key]) continue;
      const stale = path.resolve(ROOT, lock[key].out ?? "");
      if (lock[key].out && fs.existsSync(stale)) {
        fs.rmSync(stale);
        console.log(`  removed    ${lock[key].out} (no longer in manifest)`);
      }
      delete lock[key];
    }
  }

  await fsp.writeFile(LOCK, `${JSON.stringify(lock, null, 2)}\n`);

  console.log("");
  for (const [r, bytes] of Object.entries(byRole).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${r.padEnd(12)} ${fmt(bytes).padStart(9)}`);
  }
  console.log(
    `\n  ${keys.length} assets — ${written} written, ${skippedCount} unchanged — ${fmt(total)} total\n`
  );

  if (process.exitCode) console.error("  prepare-assets FAILED\n");
}

await main();
