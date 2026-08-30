/**
 * Re-hosts the archived newsletters' images onto Vercel Blob and repoints the
 * committed bodies at them.
 *
 * WHY THIS EXISTS
 * ---------------
 * `lib/data/newsletter-archive/` holds 179 sent newsletters, saved because the
 * Mailchimp subscription is being cancelled and Mailchimp documents nothing
 * about what happens to hosted content on a downgraded plan. Saving the HTML
 * without the images hedges half the risk: every `<img>` in those bodies pointed
 * at `mcusercontent.com`, which is the same account and the same unknown. This
 * moves the pixels somewhere we control.
 *
 * THE CROSSWALK DECIDES, NOT THE MARKERS — AND THAT COST SOMETHING TO LEARN
 * ------------------------------------------------------------------------
 * `extract-archive.ts` tags re-hostable images with `data-mc-asset` (the path
 * inside the private vault) and `data-mc-sha256`. The obvious design is to key
 * everything on that marker.
 *
 * **The markers are incomplete, and the first version of this script trusted
 * them.** `assets/8070797-IMG_2938.jpg` — the one image a human personally
 * decided to withhold, a whole-class photograph of primary-school children —
 * appears four times across two campaigns, and only two of those four carried
 * `data-mc-asset-withheld`. The other two sat in the committed HTML with a live
 * Mailchimp `src` and no marker of any kind. A marker-based guard cannot see
 * them: it checks what an earlier pass wrote down, and nothing was written down.
 * A marker-based re-host would have uploaded that image to a URL that is
 * immutable for a year.
 *
 * So the unit of decision here is **the vault file a URL resolves to**, taken
 * from `campaign-images.json`. A marker is a record of what one pass noticed;
 * the crosswalk is what the corpus actually contains. Anything Mailchimp-hosted
 * that the crosswalk cannot resolve stops the run, because an unresolvable URL
 * is one nothing can prove is safe.
 *
 * Resolving by file also fixes the ordinary version of the same gap: 86 content
 * images were referenced under a URL shape the marking pass missed, and would
 * otherwise have kept pointing at Mailchimp after the account was downgraded.
 *
 * WEBP IS CORRECT HERE — DO NOT "FIX" IT
 * --------------------------------------
 * This repo forbids WebP in exactly one place: `image-format` in
 * `lib/email/gates.ts`, because Outlook desktop cannot decode it *in email*.
 * These are web pages. The bodies lay out at 660px CSS, so 1400px covers a 2x
 * display with margin. Animated GIFs are passed through untouched — `sharp`
 * would render one still frame and the loss would be silent.
 *
 * Usage:
 *   npx tsx scripts/mailchimp/rehost-archive-images.ts            # plan only
 *   npx tsx scripts/mailchimp/rehost-archive-images.ts --apply    # upload + rewrite
 *
 * Idempotent: object paths are the source digest, `allowOverwrite` is set, and
 * anything already in `images.json` is carried forward rather than re-encoded.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { put } from "@vercel/blob";
import sharp from "sharp";

import { isWithheldAsset } from "./withheld-images";

/** Where the sanitised bodies and their index live. */
const ARCHIVE_DIR = path.join(process.cwd(), "lib", "data", "newsletter-archive");
/** Committed map from vault path to hosted object. URLs and digests only. */
const MAP_PATH = path.join(ARCHIVE_DIR, "images.json");
/** Blob prefix, mirrored as a constant in `lib/config/assets.ts`. */
const BLOB_PREFIX = "newsletter-archive";

/**
 * Sixteen hex characters of the source digest names each object.
 *
 * Long enough that a collision is not worth thinking about — at this corpus the
 * birthday probability is about 5e-15, and it stays under 1e-10 at a hundred
 * times the size. Naming by digest also means **no original filename becomes a
 * public URL**, which matters: 39 of the source files name a person.
 */
const NAME_LEN = 16;

/** Long edge in pixels. The bodies lay out at 660px CSS; this covers 2x. */
const MAX_EDGE = 1400;
const WEBP_QUALITY = 82;

/** Hosts Mailchimp serves images from. Any of these left in a body is unfinished. */
const MC_IMAGE_HOST =
  /(?:dim\.)?mcusercontent\.com|cdn-images\.mailchimp\.com|gallery\.mailchimp\.com/;

/** Every element that can carry an image URL: `<img src>`, `og:image`, `itemprop`. */
const URL_BEARING = /<(?:img|meta|link)\b[^>]*>/gi;
const URL_ATTR = /(?:\bsrc|\bcontent|\bhref)="([^"]+)"/;

interface MapEntry {
  asset: string;
  sourceSha256: string;
  blobPath: string;
  bytes: number;
  width: number | null;
  height: number | null;
  /** `webp`, or `gif` where the original was passed through. */
  format: string;
}

/**
 * Populate `process.env` from `.env.local` for keys not already set.
 *
 * `import "dotenv/config"` reads `.env`, not `.env.local` — that is the Next.js
 * dev server's file — but `BLOB_READ_WRITE_TOKEN` lives there.
 * `scripts/newsletter/photos.ts` does this the same way for the same reason.
 */
function loadLocalEnv(keys: string[]): void {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length === 0) return;
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
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

function vaultDir(): string {
  const dir = process.env.MAILCHIMP_VAULT_DIR;
  if (dir && existsSync(dir)) return dir;
  const fallback = "D:/github_repository/she-sharp-slack-archive/mailchimp/2026-08-28-api";
  if (existsSync(fallback)) return fallback;
  throw new Error(
    "Cannot find the Mailchimp vault. Set MAILCHIMP_VAULT_DIR to the export directory."
  );
}

interface Resolution {
  /** Vault paths that must be hosted, deduplicated. */
  uploadable: Set<string>;
  /** URLs resolving to a withheld file. Stripped, never uploaded. */
  withheldUrls: Set<string>;
  /** URLs the crosswalk has but holds no file for. */
  lostUrls: Set<string>;
  /** url -> vault path, for the rewrite. */
  urlToAsset: Map<string, string>;
  /** How many references each bucket accounts for, for the report. */
  refs: { uploadable: number; withheld: number; lost: number };
}

/**
 * Resolve every Mailchimp-hosted URL still in the bodies against the crosswalk.
 *
 * An unresolvable URL is a hard stop rather than a skip: it is a URL nothing can
 * prove is not one of the withheld images.
 */
function resolveAll(vault: string): Resolution {
  const crosswalk = JSON.parse(
    readFileSync(path.join(vault, "campaign-images.json"), "utf8")
  ) as { images: { url: string; file: string | null }[] };
  const byUrl = new Map(crosswalk.images.map((i) => [i.url, i]));

  const out: Resolution = {
    uploadable: new Set(),
    withheldUrls: new Set(),
    lostUrls: new Set(),
    urlToAsset: new Map(),
    refs: { uploadable: 0, withheld: 0, lost: 0 },
  };
  const unresolved: string[] = [];

  for (const file of readdirSync(ARCHIVE_DIR).filter((f) => f.endsWith(".html"))) {
    const html = readFileSync(path.join(ARCHIVE_DIR, file), "utf8");
    for (const m of html.matchAll(URL_BEARING)) {
      const raw = URL_ATTR.exec(m[0])?.[1];
      if (!raw) continue;
      const url = raw.replace(/&amp;/g, "&");
      if (!MC_IMAGE_HOST.test(url)) continue;

      const row = byUrl.get(url);
      if (!row) {
        unresolved.push(file + ": " + url);
        continue;
      }
      if (!row.file) {
        out.lostUrls.add(url);
        out.refs.lost++;
        continue;
      }
      if (isWithheldAsset(row.file)) {
        out.withheldUrls.add(url);
        out.refs.withheld++;
        continue;
      }
      out.uploadable.add(row.file);
      out.urlToAsset.set(url, row.file);
      out.refs.uploadable++;
    }
  }

  if (unresolved.length > 0) {
    throw new Error(
      unresolved.length +
        " Mailchimp image URL(s) are in the bodies but not in the crosswalk, so " +
        "nothing can say whether they are withheld:\n  " +
        unresolved.slice(0, 5).join("\n  ")
    );
  }
  return out;
}

/** Re-encode unless it is an animated GIF, which sharp would flatten silently. */
async function encode(
  buf: Buffer,
  asset: string
): Promise<{
  body: Buffer;
  ext: string;
  format: string;
  width: number | null;
  height: number | null;
}> {
  if (path.extname(asset).toLowerCase() === ".gif") {
    const meta = await sharp(buf, { animated: true })
      .metadata()
      .catch(() => null);
    return {
      body: buf,
      ext: "gif",
      format: "gif",
      width: meta?.width ?? null,
      height: meta?.pageHeight ?? meta?.height ?? null,
    };
  }
  const img = sharp(buf, { failOn: "none" });
  const meta = await img.metadata();
  const oversized = (meta.width ?? 0) > MAX_EDGE || (meta.height ?? 0) > MAX_EDGE;
  const pipeline = oversized
    ? img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    : img;
  const body = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  const out = await sharp(body).metadata();
  return { body, ext: "webp", format: "webp", width: out.width ?? null, height: out.height ?? null };
}

/**
 * Rewrite every URL-bearing element still pointing at a Mailchimp image host.
 *
 * A URL resolving to a withheld file loses its URL entirely and gains
 * `data-mc-asset-withheld`, so the decision is enforced by what the file is
 * rather than by what an earlier pass remembered to annotate.
 */
function rewriteAll(
  base: string,
  map: Map<string, MapEntry>,
  res: Resolution
): { hosted: number; withheld: number; lost: number } {
  const counts = { hosted: 0, withheld: 0, lost: 0 };
  for (const file of readdirSync(ARCHIVE_DIR).filter((f) => f.endsWith(".html"))) {
    const full = path.join(ARCHIVE_DIR, file);
    const before = readFileSync(full, "utf8");
    const after = before.replace(URL_BEARING, (el) => {
      const raw = URL_ATTR.exec(el)?.[1];
      if (!raw) return el;
      const url = raw.replace(/&amp;/g, "&");
      if (!MC_IMAGE_HOST.test(url)) return el;

      if (res.withheldUrls.has(url)) {
        counts.withheld++;
        return el
          .replace(/\s(?:src|content|href)="[^"]*"/, "")
          .replace(/<(img|meta|link)\b/i, '<$1 data-mc-asset-withheld="1"');
      }
      if (res.lostUrls.has(url)) {
        counts.lost++;
        return el
          .replace(/\s(?:src|content|href)="[^"]*"/, "")
          .replace(/<(img|meta|link)\b/i, '<$1 data-mc-asset-lost="1"');
      }
      const asset = res.urlToAsset.get(url);
      const entry = asset ? map.get(asset) : undefined;
      if (!entry) throw new Error(file + ": no mapping for " + url);
      counts.hosted++;
      return el.replace(
        /(\s(?:src|content|href)=")[^"]*"/,
        "$1" + base + "/" + entry.blobPath + '"'
      );
    });
    if (after !== before) writeFileSync(full, after);
  }
  return counts;
}

async function main(): Promise<void> {
  const apply = process.argv.slice(2).includes("--apply");
  const vault = vaultDir();
  const res = resolveAll(vault);

  // The guard that failed the first time round. It asks the crosswalk what a URL
  // resolves to, rather than asking the HTML what it was labelled.
  const leaked = [...res.uploadable].filter((a) => isWithheldAsset(a));
  if (leaked.length > 0) {
    throw new Error(
      "REFUSING TO UPLOAD. " +
        leaked.length +
        " withheld image(s) reached the upload set:\n  " +
        leaked.join("\n  ") +
        "\nA Blob URL is immutable for a year. Fix the resolution, not this check."
    );
  }

  console.log("Vault             " + vault);
  console.log("Files to host     " + res.uploadable.size + " (" + res.refs.uploadable + " refs)");
  console.log(
    "Withheld URLs     " + res.withheldUrls.size + " (" + res.refs.withheld + " refs, stripped)"
  );
  console.log("Lost URLs         " + res.lostUrls.size + " (" + res.refs.lost + " refs)");
  console.log();

  if (!apply) {
    console.log("Plan only. Re-run with --apply to transcode, upload and rewrite.");
    return;
  }

  loadLocalEnv(["BLOB_READ_WRITE_TOKEN"]);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set, and .env.local does not carry it.\n" +
        "Pull it rather than inventing one:\n" +
        "  vercel env pull .env.production.local --environment production --yes"
    );
  }

  // Carry forward what a previous run hosted. The upload is idempotent, but
  // re-encoding hundreds of images to prove that is a waste.
  const map = new Map<string, MapEntry>();
  let base = "";
  if (existsSync(MAP_PATH)) {
    const prev = JSON.parse(readFileSync(MAP_PATH, "utf8")) as {
      base?: string;
      entries?: MapEntry[];
    };
    base = prev.base ?? "";
    for (const e of prev.entries ?? []) map.set(e.asset, e);
  }

  const todo = [...res.uploadable].filter((a) => !map.has(a));
  console.log("Already hosted    " + map.size);
  console.log("To upload now     " + todo.length);
  console.log();

  let srcBytes = 0;
  let outBytes = 0;
  let done = 0;
  for (const asset of todo) {
    const file = path.join(vault, asset);
    if (!existsSync(file)) throw new Error("Vault file missing: " + asset);
    const buf = readFileSync(file);
    const digest = createHash("sha256").update(buf).digest("hex");
    const { body, ext, format, width, height } = await encode(buf, asset);
    const blobPath = BLOB_PREFIX + "/" + digest.slice(0, NAME_LEN) + "." + ext;
    const { url } = await put(blobPath, body, {
      access: "public",
      token,
      addRandomSuffix: false,
      contentType: format === "gif" ? "image/gif" : "image/webp",
      allowOverwrite: true,
    });
    if (!base) base = url.slice(0, url.indexOf("/" + blobPath));
    srcBytes += buf.byteLength;
    outBytes += body.byteLength;
    map.set(asset, {
      asset,
      sourceSha256: digest,
      blobPath,
      bytes: body.byteLength,
      width,
      height,
      format,
    });
    done++;
    if (done % 25 === 0) console.log("  … " + done + "/" + todo.length);
  }

  if (done > 0) {
    console.log();
    console.log("Uploaded  " + done + " new object(s)");
    console.log("Source    " + (srcBytes / 1024 / 1024).toFixed(1) + " MB");
    console.log("Hosted    " + (outBytes / 1024 / 1024).toFixed(1) + " MB");
  }

  // Every entry, not just this run's. `res.uploadable` holds only the paths still
  // reachable through a Mailchimp URL, so after a first pass has rewritten them it
  // is nearly empty — filtering the map by it would silently discard the record of
  // everything already hosted, leaving bodies that point at objects the map no
  // longer explains. The map is the provenance, so it only ever grows.
  const entries = [...map.values()].sort((a, b) => a.asset.localeCompare(b.asset));
  const objects = new Set(entries.map((e) => e.sourceSha256)).size;

  writeFileSync(
    MAP_PATH,
    JSON.stringify(
      {
        _readme:
          "Generated by scripts/mailchimp/rehost-archive-images.ts. Maps a vault path to " +
          "the object hosted for it. URLs and digests only \u2014 no address, no personal " +
          "data. Keyed on the vault path, not on src: Mailchimp serves one image under " +
          "several URL shapes, and the withheld decision is made per file.",
        base,
        prefix: BLOB_PREFIX,
        generatedAt: new Date().toISOString().slice(0, 10),
        objects,
        paths: entries.length,
        entries,
      },
      null,
      2
    ) + "\n"
  );

  const counts = rewriteAll(base, map, res);

  // `index.json` carries a sha256 and a byte count per body, and the guard uses
  // them to catch a hand-edited file. This script is the LAST writer in the
  // pipeline — `extract-archive.ts` produces the bodies, this repoints their
  // images — so it owns re-stamping them. Leaving that to the extractor would
  // mean regenerating from the vault, which would undo the re-host.
  const indexPath = path.join(ARCHIVE_DIR, "index.json");
  const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
    entries: { file: string; bytes: number; sha256: string }[];
  };
  let restamped = 0;
  for (const entry of index.entries) {
    const text = readFileSync(path.join(ARCHIVE_DIR, entry.file), "utf8");
    const sha = createHash("sha256").update(text, "utf8").digest("hex");
    const bytes = Buffer.byteLength(text, "utf8");
    if (sha !== entry.sha256 || bytes !== entry.bytes) {
      entry.sha256 = sha;
      entry.bytes = bytes;
      restamped++;
    }
  }
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");

  console.log();
  console.log("Rewrote   " + counts.hosted + " reference(s) onto Blob");
  console.log("Restamped " + restamped + " index entr(ies)");
  console.log("Withheld  " + counts.withheld + " reference(s) stripped");
  console.log("Lost      " + counts.lost + " reference(s) stripped");
  console.log("Map       " + objects + " object(s) across " + entries.length + " path(s)");
}

main().catch((err) => {
  console.error(String(err instanceof Error ? err.message : err));
  process.exit(1);
});
