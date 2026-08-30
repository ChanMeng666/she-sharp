/**
 * Proves which images the newsletter archive still has, and fetches the rest.
 *
 * When this ran, the site's only route to the back catalogue was
 * `MAILCHIMP_CONFIG.archiveUrl`, a live hyperlink to `us3.campaign-archive.com`.
 * When the Mailchimp account is cancelled that stops resolving with no code
 * change and no deploy, and every image inside the archived newsletters goes
 * with it. (That field and its `lib/data/newsletters.ts` were deleted on
 * 2026-08-30, once `/resources/newsletters/<id>` could serve all 179 sends from
 * this repo — which is exactly what this crosswalk made possible.)
 * The bodies themselves are already safe — `<vault>/content/<campaignId>.json`
 * holds `html`, `archive_html` and `plain_text` for all 180 sent campaigns — but
 * an HTML body full of dead `<img src>` is not an archive of a newsletter.
 *
 * WHY THIS IS A CROSSWALK AND NOT JUST A DOWNLOADER
 * -------------------------------------------------
 * Most of the images were already here. `fetch-assets.ts` downloaded the whole
 * 677-file Mailchimp gallery into `<vault>/assets/`, and the gallery is where
 * She Sharp's own artwork lives. What nobody had was the *join*: a campaign body
 * references `mcusercontent.com/<hash>/images/<uuid>.png` while the inventory
 * records `gallery.mailchimp.com/<hash>/images/<uuid>.png`, so proving the
 * archive covers the bodies means matching on the `/images/<uuid>.<ext>` segment
 * the two hosts share. Until that join existed, "we have the images" was a
 * belief rather than a measurement — and the measurement found one image that is
 * already gone, which a downloader alone would never have reported.
 *
 * Phase 5 — re-hosting the back catalogue on the site — reads the classification
 * to decide which images to carry across and which are Mailchimp's own furniture
 * to drop.
 *
 * TWO WAYS TO FIND AN IMAGE, AND BOTH ARE NEEDED
 * ----------------------------------------------
 * Scanning for URLs that END in an image extension finds 544. Scanning image
 * ATTRIBUTES (`<img src>`, `background=`, `srcset`) also finds 544. They are not
 * the same 544: the union is 545. One `lh5.googleusercontent.com` URL carries no
 * extension at all and is only visible as an `<img src>`; one gallery URL
 * appears outside any image attribute. Either rule alone silently under-reports,
 * so this scans both and unions them.
 *
 * `plain_text` is scanned too, and yields **zero** image URLs. That is recorded
 * as a finding rather than assumed: a URL in the text alternative is a link
 * somebody clicks, not an image the mail renders.
 *
 * THREE URL SHAPES, ONE FILE
 * --------------------------
 * A single gallery image can appear as any of:
 *   https://gallery.mailchimp.com/<hash>/images/<uuid>.png     (the inventory)
 *   https://mcusercontent.com/<hash>/images/<uuid>.png         (a send)
 *   https://dim.mcusercontent.com/cs/<hash>/images/<uuid>.png?w=..&dpr=2
 * plus a fourth that is not a gallery image at all:
 *   https://dim.mcusercontent.com/https/<percent-encoded-url>?w=..
 * which is Mailchimp's proxy in front of somebody else's CDN. Treating that
 * fourth form as a distinct image would report 43 lost She Sharp photographs
 * that are in fact Facebook and Instagram icons.
 *
 * IT TOUCHES NO ACCOUNT DATA. Every URL here is a public CDN object; no API key
 * is sent and no Mailchimp endpoint is called. The account is still the live
 * newsletter sender and is strictly read-only until it is not.
 *
 * Resumable by design, like `fetch-assets.ts`: a downloaded file is named from
 * the sha256 of its URL, so a second run recognises what it already has without
 * trusting a manifest it may have half-written.
 *
 * Usage:
 *   MAILCHIMP_VAULT_DIR=…/she-sharp-slack-archive/mailchimp/2026-08-28-api \
 *     npx tsx scripts/mailchimp/campaign-images.ts --export 2026-08-28-api [--dry-run] [--json]
 */

import "dotenv/config";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { argValue, fileBytes, resolveVaultDir, sha256File } from "./vault";

/** One row of `file-manager-files.json`, narrowed to what the join needs. */
interface GalleryFile {
  id: number;
  name: string;
  type: string;
  size: number;
  full_size_url: string;
}

/** How an image reached a campaign body, and what a re-host should do with it. */
type ImageClass =
  /** She Sharp's own artwork, uploaded to the Mailchimp gallery. Carry it across. */
  | "gallery-original"
  /** Mailchimp's template furniture — social icons, the rewards badge. Drop it. */
  | "mailchimp-chrome"
  /**
   * On a Mailchimp host, referenced by a body, and NOT in the gallery.
   *
   * This class is a finding in itself: it proves `file-manager-files.json` is
   * not a complete inventory of the account's images, so "we downloaded the
   * gallery" was never the same claim as "we have the newsletters' images".
   */
  | "content-not-in-gallery"
  /** Hosted by somebody else. Cancelling Mailchimp does not touch it, but the
   * third party can still take it down — and one already has. */
  | "third-party";

interface ImageRecord {
  /** The URL exactly as it appears in the body, query string and all. */
  url: string;
  host: string;
  classification: ImageClass;
  /** The gallery row this resolved to, or null. */
  galleryId: number | null;
  /** Path inside the export directory, forward slashes, or null when unfetched. */
  file: string | null;
  sha256: string | null;
  bytes: number | null;
  /** The HTTP status of the fetch; null when the file was already on disk. */
  httpStatus: number | null;
  contentType: string | null;
  /** Campaign ids whose `html` or `archive_html` references this URL. */
  campaigns: string[];
  references: number;
  /** Populated only when something went wrong, and never silently dropped. */
  error?: string;
}

/**
 * Images this archive cannot have, with the reason and the evidence.
 *
 * Same contract as `KNOWN_UNREFERENCED` in `scripts/verify-image-paths.ts`:
 * every entry needs a reason, and an entry that stops being true **fails** this
 * script rather than sitting stale. A recorded loss that quietly starts
 * resolving again means the archive is more complete than it claims, which is
 * the one direction nobody would think to check.
 */
const KNOWN_LOSSES: Array<{ url: string; reason: string }> = [
  {
    url:
      "https://lh5.googleusercontent.com/7lE3tEedpFVDPCGEroE8vzLZ-oxA3lo9BUqHj_rTzBxxAP" +
      "smHv-NhPTlwV5VyahAdba-pkVCwZT8otwUmqkOxGYh1ELi9WR3TLxfT-ZctGTUFhyXoBznBfWkoPkdPd" +
      "WPU2CTS1u1",
    reason:
      "Already gone. A Google user-content link, embedded in the 2020-09-16 issue " +
      "'SHE# STORYTELLERS SPEAKER SERIES 2.0!' (campaign 9db594f92d). It returns HTTP " +
      "403 as at 2026-08-29, with and without a browser User-Agent and Referer, so it " +
      "is withdrawn rather than merely hotlink-blocked. It carries no file extension, " +
      "so it was invisible to an extension-based scan — which is why this script also " +
      "reads image attributes, and why it was found at all. Nothing in this archive, " +
      "in Mailchimp, or on Google holds it; the loss predates every decision made here " +
      "and is recorded so it is not rediscovered as a bug.",
  },
];

/** Concurrent downloads. Small on purpose — this is a few dozen files, and a
 * burst against a stranger's CDN buys nothing but the appearance of a scrape. */
const MAX_CONCURRENT = 4;

/** Pause between a worker's fetches, so the run stays visibly gentle. */
const REQUEST_DELAY_MS = 250;

const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i;

/** The `/images/<uuid>.<ext>` segment that every Mailchimp host form shares. */
const GALLERY_UUID = /\/images\/([0-9a-f-]{36})\.(\w+)/i;

const MAILCHIMP_HOSTS = new Set([
  "gallery.mailchimp.com",
  "mcusercontent.com",
  "dim.mcusercontent.com",
  "cdn-images.mailchimp.com",
]);

/**
 * Reduces a body URL to the thing it actually points at.
 *
 * `dim.mcusercontent.com/https/<encoded>` is a proxy, not an image: the real
 * object is the URL inside it. Decoding first is what stops one social icon
 * being counted as forty distinct missing images.
 *
 * @param url - A URL as it appears in a campaign body.
 * @returns The URL of the underlying object, query string removed.
 */
function underlyingUrl(url: string): string {
  const proxied = url.match(/^https:\/\/dim\.mcusercontent\.com\/https?\/(.+?)(?:\?|$)/i);
  if (proxied) {
    try {
      const decoded = decodeURIComponent(proxied[1]).split("?")[0];
      return decoded.startsWith("http") ? decoded : `https://${decoded}`;
    } catch {
      // A malformed escape sequence is not a reason to lose the reference.
    }
  }
  return url.split("?")[0];
}

/** The host of a URL, or `"(unparseable)"` — never a throw mid-scan. */
function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "(unparseable)";
  }
}

/** Every URL an image attribute points at, across the shapes email HTML uses. */
function attributeUrls(html: string): string[] {
  const pattern =
    /<(?:img|td|th|table|body|v:image|v:fill)\b[^>]*?\s(?:src|background|srcset|data-src)\s*=\s*["']([^"']+)["']/gi;
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    // `srcset` is a comma-separated list of "<url> <descriptor>".
    for (const candidate of match[1].split(",")) {
      const url = candidate.trim().split(/\s+/)[0].replace(/&amp;/g, "&");
      if (/^https?:/i.test(url)) found.push(url);
    }
  }
  return found;
}

/** Every URL that ends in an image extension, wherever it sits in the markup. */
function extensionUrls(html: string): string[] {
  const found: string[] = [];
  for (const match of html.match(/https?:\/\/[^"'\s)<>]+/g) ?? []) {
    // `&amp;` survives in HTML attributes; a trailing full stop is prose.
    const url = match.replace(/&amp;/g, "&").replace(/[.,;]+$/, "");
    if (IMAGE_EXTENSION.test(url)) found.push(url);
  }
  return found;
}

interface Scan {
  references: Map<string, { campaigns: Set<string>; count: number }>;
  campaigns: number;
  plainTextImageUrls: number;
}

/**
 * Every image URL in every campaign body, with who references it.
 *
 * The corpus is the **union** of the attribute scan and the extension scan,
 * because neither alone is complete — see the header.
 *
 * @param vault - The export directory.
 */
function scanBodies(vault: string): Scan {
  const contentDir = join(vault, "content");
  if (!existsSync(contentDir)) {
    throw new Error(
      `No content/ directory in ${vault}.\n` +
        "  Run: npx tsx scripts/mailchimp/fetch-api.ts --export <id> --include content"
    );
  }

  const references = new Map<string, { campaigns: Set<string>; count: number }>();
  const files = readdirSync(contentDir).filter((name) => name.endsWith(".json"));
  let plainTextImageUrls = 0;

  for (const entry of files) {
    const campaignId = entry.replace(/\.json$/, "");
    const body = JSON.parse(readFileSync(join(contentDir, entry), "utf8")) as {
      html?: string;
      archive_html?: string;
      plain_text?: string;
    };

    for (const key of ["html", "archive_html"] as const) {
      const html = body[key];
      if (!html) continue;

      // Both scans read the same string, so adding their counts would double
      // every URL either one finds — which is most of them. Take the larger:
      // three `<img>` tags give 3 either way, and a URL that also appears in an
      // `<a href>` legitimately scores one more on the extension side.
      const tallies = new Map<string, number>();
      for (const list of [attributeUrls(html), extensionUrls(html)]) {
        const seen = new Map<string, number>();
        for (const url of list) seen.set(url, (seen.get(url) ?? 0) + 1);
        for (const [url, count] of seen) {
          tallies.set(url, Math.max(tallies.get(url) ?? 0, count));
        }
      }

      for (const [url, count] of tallies) {
        const record = references.get(url) ?? { campaigns: new Set<string>(), count: 0 };
        record.campaigns.add(campaignId);
        record.count += count;
        references.set(url, record);
      }
    }

    // Counted rather than assumed. It is zero across all 180 campaigns, and a
    // future non-zero would mean the text alternative had started carrying
    // something the HTML did not.
    plainTextImageUrls += extensionUrls(body.plain_text ?? "").length;
  }

  return { references, campaigns: files.length, plainTextImageUrls };
}

/**
 * The gallery, indexed by the uuid every host form shares.
 *
 * @param vault - The export directory.
 * @returns uuid → the gallery row's id and the local filename.
 */
function galleryIndex(vault: string): Map<string, { id: number; localName: string }> {
  const inventoryPath = join(vault, "file-manager-files.json");
  if (!existsSync(inventoryPath)) {
    throw new Error(
      `No file-manager-files.json in ${vault}.\n` +
        "  Run: npx tsx scripts/mailchimp/fetch-api.ts --export <id> --include assets"
    );
  }

  const raw: unknown = JSON.parse(readFileSync(inventoryPath, "utf8"));
  const files = (Array.isArray(raw) ? raw : []) as GalleryFile[];
  const index = new Map<string, { id: number; localName: string }>();

  for (const file of files) {
    const uuid = (file.full_size_url ?? "").match(GALLERY_UUID);
    if (!uuid) continue;
    // The same naming `fetch-assets.ts` writes. Reimplemented rather than
    // imported because that module is a script with a `main()`, and the rule it
    // encodes is one line: id first, because gallery names are not unique.
    const cleaned = file.name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
    index.set(uuid[1].toLowerCase(), { id: file.id, localName: `${file.id}-${cleaned || "untitled"}` });
  }

  return index;
}

/**
 * What a body URL is, once it is known whether the gallery holds it.
 *
 * `cdn-images.mailchimp.com` is the only host Mailchimp serves its own template
 * assets from, so it is the whole of the chrome test — and a `dim` proxy in
 * front of it has already been reduced to it by {@link underlyingUrl}.
 */
function classify(underlying: string, inGallery: boolean): ImageClass {
  if (inGallery) return "gallery-original";
  const host = hostOf(underlying);
  if (host === "cdn-images.mailchimp.com") return "mailchimp-chrome";
  if (MAILCHIMP_HOSTS.has(host)) return "content-not-in-gallery";
  return "third-party";
}

/**
 * True when the bytes begin like an image file.
 *
 * The `Content-Type` header alone is not enough: the failure that matters is a
 * CDN error page returned as `200 text/html`, which writes a perfectly valid
 * file that is not an image. Magic bytes catch it; a header does not.
 */
function looksLikeImage(body: Buffer): boolean {
  if (body.length < 12) return false;
  const hex = body.subarray(0, 4).toString("hex").toLowerCase();
  if (hex.startsWith("89504e47")) return true; // PNG
  if (hex.startsWith("ffd8ff")) return true; // JPEG
  if (hex.startsWith("47494638")) return true; // GIF
  if (hex === "52494646" && body.subarray(8, 12).toString("ascii") === "WEBP") return true;
  const head = body.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
  return head.startsWith("<svg") || head.startsWith("<?xml");
}

/**
 * A filename that is deterministic from the URL, so a re-run can resume.
 *
 * The hash prefix is not decoration. Forty-three proxied URLs share basenames
 * with the thirty-two origins they wrap, and several `?dpr=1`/`?dpr=2` pairs
 * share one — without the prefix they would overwrite each other silently.
 * The sanitiser also strips `@`, which matters: four of these URLs end
 * `1f49c@2x.png`, and an `@` in a committed string trips the archive's leak
 * guard as though it were an email address.
 */
function downloadName(underlying: string): string {
  const digest = createHash("sha256").update(underlying).digest("hex").slice(0, 16);
  const base = basename(underlying)
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${digest}-${base || "image"}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Fetched {
  file?: string;
  httpStatus: number | null;
  contentType: string | null;
  error?: string;
}

/**
 * Fetches one image unless a copy is already on disk.
 *
 * @param underlying - The URL of the object itself, proxy already unwrapped.
 * @param dir - Where downloads go.
 */
async function download(underlying: string, dir: string): Promise<Fetched> {
  const name = downloadName(underlying);
  const target = join(dir, name);
  const relative = `campaign-images/${name}`;

  if (existsSync(target) && statSync(target).size > 0) {
    return { file: relative, httpStatus: null, contentType: null };
  }

  try {
    const response = await fetch(underlying, { redirect: "follow" });
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      return { httpStatus: response.status, contentType, error: `HTTP ${response.status}` };
    }

    const body = Buffer.from(await response.arrayBuffer());
    if (body.length === 0) {
      return { httpStatus: response.status, contentType, error: "empty response body" };
    }
    if (!looksLikeImage(body)) {
      return {
        httpStatus: response.status,
        contentType,
        error: `not an image (content-type ${contentType ?? "unknown"}, ${body.length} bytes)`,
      };
    }

    mkdirSync(dir, { recursive: true });
    writeFileSync(target, body);
    return { file: relative, httpStatus: response.status, contentType };
  } catch (error) {
    return {
      httpStatus: null,
      contentType: null,
      error: `network error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Refuses to write a crosswalk keyed on the wrong export.
 *
 * `resolveVaultDir` honours `MAILCHIMP_VAULT_DIR` regardless of `--export`, and
 * every other script only READS under that mismatch. This one writes a file
 * whose `exportId` is what a later manifest merge joins on, so a stale env var
 * would file one pull's images under another pull's name, permanently and
 * without an error.
 */
function assertVaultMatchesExport(exportId: string, vault: string): void {
  if (basename(vault) === exportId) return;
  throw new Error(
    `MAILCHIMP_VAULT_DIR points at ${basename(vault)} but --export says ${exportId}.\n` +
      `  ${vault}\n` +
      "  These must agree: the crosswalk is filed under the export id, and a\n" +
      "  mismatch records one pull's images under another pull's name."
  );
}

async function main(): Promise<void> {
  const exportId = argValue(process.argv, "--export");
  if (!exportId) {
    console.error(
      "Usage: npx tsx scripts/mailchimp/campaign-images.ts --export <exportId> [--dry-run] [--json]"
    );
    process.exit(1);
  }

  const dryRun = process.argv.includes("--dry-run");
  const asJson = process.argv.includes("--json");
  const vault = resolveVaultDir(exportId);
  assertVaultMatchesExport(exportId, vault);

  const downloadDir = join(vault, "campaign-images");
  const assetsDir = join(vault, "assets");
  const scan = scanBodies(vault);
  const gallery = galleryIndex(vault);
  const knownLosses = new Map(KNOWN_LOSSES.map((loss) => [loss.url, loss.reason]));

  // One record per URL as it appears in the body, but the work is keyed on the
  // underlying object — so forty proxied copies of one icon are one download.
  const records: ImageRecord[] = [];
  const toFetch = new Map<string, string[]>();

  for (const [url, { campaigns, count }] of [...scan.references.entries()].sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
  )) {
    const underlying = underlyingUrl(url);
    const uuid = underlying.match(GALLERY_UUID);
    const hit = uuid ? gallery.get(uuid[1].toLowerCase()) : undefined;

    const record: ImageRecord = {
      url,
      host: hostOf(url),
      classification: classify(underlying, Boolean(hit)),
      galleryId: hit?.id ?? null,
      file: hit ? `assets/${hit.localName}` : null,
      sha256: null,
      bytes: null,
      httpStatus: null,
      contentType: null,
      campaigns: [...campaigns].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
      references: count,
    };

    if (hit) {
      const path = join(assetsDir, hit.localName);
      if (existsSync(path)) {
        record.sha256 = sha256File(path);
        record.bytes = fileBytes(path);
      } else {
        // The inventory names a file the download never wrote. Recorded rather
        // than resolved: an archive that claims coverage it does not have is
        // worse than one that admits a hole.
        record.file = null;
        record.error = `gallery file missing on disk: assets/${hit.localName}`;
      }
    } else {
      const waiting = toFetch.get(underlying) ?? [];
      waiting.push(url);
      toFetch.set(underlying, waiting);
    }

    records.push(record);
  }

  console.log(`campaigns scanned:        ${scan.campaigns}`);
  console.log(`image URLs referenced:    ${records.length}`);
  console.log(`image URLs in plain_text: ${scan.plainTextImageUrls}`);
  console.log(`already in assets/:       ${records.filter((r) => r.file !== null).length}`);
  console.log(`distinct objects to get:  ${toFetch.size}`);

  if (dryRun) {
    console.log("\n--dry-run: nothing downloaded, nothing written.");
    for (const [underlying, urls] of toFetch) {
      console.log(`  would fetch ${underlying}  (${urls.length} body URL(s))`);
    }
    return;
  }

  // --- fetch what is missing -------------------------------------------------

  const fetched = new Map<string, Fetched>();
  const queue = [...toFetch.keys()];
  let done = 0;

  const workers = Array.from({ length: MAX_CONCURRENT }, async () => {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      const outcome = await download(next, downloadDir);
      fetched.set(next, outcome);
      done += 1;
      if (outcome.error) console.log(`  ! ${next} — ${outcome.error}`);
      if (done % 10 === 0 || done === toFetch.size) console.log(`  ${done}/${toFetch.size}`);
      await sleep(REQUEST_DELAY_MS);
    }
  });
  await Promise.all(workers);

  for (const record of records) {
    if (record.file !== null || record.error) continue;
    const outcome = fetched.get(underlyingUrl(record.url));
    if (!outcome) continue;
    record.httpStatus = outcome.httpStatus;
    record.contentType = outcome.contentType;
    if (outcome.error || !outcome.file) {
      record.error = outcome.error ?? "not fetched";
      continue;
    }
    record.file = outcome.file;
    const path = join(vault, outcome.file);
    record.sha256 = sha256File(path);
    record.bytes = fileBytes(path);
  }

  // --- the whole gallery, not only the referenced part -----------------------
  //
  // A third of the gallery is referenced by no surviving campaign. Those files
  // are still She Sharp's artwork and still have no integrity record anywhere,
  // so they are hashed here too — the manifest merge that follows reads this.

  const referenceCounts = new Map<string, number>();
  for (const record of records) {
    if (!record.file) continue;
    referenceCounts.set(record.file, (referenceCounts.get(record.file) ?? 0) + record.references);
  }

  const galleryFiles = existsSync(assetsDir)
    ? readdirSync(assetsDir).sort()
    : [];
  const galleryRecords = galleryFiles.map((name) => {
    const path = join(assetsDir, name);
    const file = `assets/${name}`;
    return {
      id: Number.parseInt(name.split("-")[0], 10),
      file,
      sha256: sha256File(path),
      bytes: fileBytes(path),
      references: referenceCounts.get(file) ?? 0,
    };
  });

  const downloadedFiles = existsSync(downloadDir) ? readdirSync(downloadDir).sort() : [];
  const downloadedRecords = downloadedFiles.map((name) => {
    const file = `campaign-images/${name}`;
    const owner = records.find((r) => r.file === file);
    return {
      file,
      sha256: sha256File(join(downloadDir, name)),
      bytes: fileBytes(join(downloadDir, name)),
      host: owner ? hostOf(underlyingUrl(owner.url)) : "(unknown)",
      classification: owner?.classification ?? "third-party",
      references: referenceCounts.get(file) ?? 0,
    };
  });

  const byClass = (value: ImageClass) => records.filter((r) => r.classification === value).length;
  const unresolved = records.filter((r) => r.error);
  const lost = unresolved.filter((r) => knownLosses.has(r.url));
  const unexplained = unresolved.filter((r) => !knownLosses.has(r.url));
  const staleLosses = KNOWN_LOSSES.filter(
    (loss) => !unresolved.some((r) => r.url === loss.url)
  );

  const output = {
    generatedAt: new Date().toISOString().slice(0, 10),
    exportId,
    note:
      "Crosswalk from the campaign bodies in content/ to the image files this " +
      "archive holds. Built by scripts/mailchimp/campaign-images.ts in she-sharp. " +
      "A row with a null file is an image this archive does NOT have.",
    corpus:
      "The union of two scans of html and archive_html: URLs ending in an image " +
      "extension, and URLs in an image attribute (src, background, srcset, " +
      "data-src). Neither alone is complete. plain_text yields zero.",
    totals: {
      campaigns: scan.campaigns,
      imageUrls: records.length,
      references: records.reduce((sum, r) => sum + r.references, 0),
      plainTextImageUrls: scan.plainTextImageUrls,
      resolvedToGallery: records.filter((r) => r.file?.startsWith("assets/")).length,
      downloaded: records.filter((r) => r.file?.startsWith("campaign-images/")).length,
      lost: lost.length,
      unexplained: unexplained.length,
      galleryFilesOnDisk: galleryRecords.length,
      galleryFilesReferenced: galleryRecords.filter((g) => g.references > 0).length,
      galleryFilesNeverReferenced: galleryRecords.filter((g) => g.references === 0).length,
    },
    byClassification: {
      "gallery-original": byClass("gallery-original"),
      "mailchimp-chrome": byClass("mailchimp-chrome"),
      "content-not-in-gallery": byClass("content-not-in-gallery"),
      "third-party": byClass("third-party"),
    },
    images: records,
    galleryFiles: galleryRecords,
    downloadedFiles: downloadedRecords,
    lost: lost.map((r) => ({
      url: r.url,
      error: r.error,
      campaigns: r.campaigns,
      reason: knownLosses.get(r.url),
    })),
    unexplained: unexplained.map((r) => ({ url: r.url, error: r.error, campaigns: r.campaigns })),
  };

  const outPath = join(vault, "campaign-images.json");
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`\nresolved to the gallery:  ${output.totals.resolvedToGallery}`);
  console.log(`newly downloaded:         ${output.totals.downloaded}`);
  console.log(`known losses:             ${lost.length}`);
  console.log(`unexplained failures:     ${unexplained.length}`);
  console.log(`gallery files hashed:     ${galleryRecords.length}`);
  console.log(`  of which never used:    ${output.totals.galleryFilesNeverReferenced}`);
  console.log(`\nwrote ${outPath}`);

  if (asJson) console.log(JSON.stringify(output.totals, null, 2));

  if (staleLosses.length > 0) {
    console.error(
      `\n${staleLosses.length} KNOWN_LOSSES entr(y|ies) now resolve. Remove them —\n` +
        "an archive that claims a loss it no longer has is as wrong as one that\n" +
        "hides a loss it does have:\n" +
        staleLosses.map((loss) => `  ${loss.url}`).join("\n")
    );
    process.exit(1);
  }

  if (unexplained.length > 0) {
    console.error(
      "\nSome images could not be fetched and are not recorded losses. Re-run to\n" +
        "retry — anything already on disk is skipped. If a URL keeps failing, add\n" +
        "it to KNOWN_LOSSES with the evidence rather than letting it read as a bug."
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
