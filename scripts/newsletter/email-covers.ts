/**
 * Generates the email-safe JPEG twin of every event cover a newsletter issue
 * refers to.
 *
 * The website serves WebP; Outlook on the desktop cannot decode it and shows a
 * broken-image placeholder instead. `lib/email/gates.ts` refuses to build a send
 * carrying one, which is how this was found — the newsletter's event cards pull
 * covers straight from the site's event data, so every issue embedded WebP and
 * the old Resend-broadcast path, which ran no gates at all, would have delivered
 * them broken to every Outlook reader.
 *
 * `lib/newsletter/email-assets.ts` owns the naming rule (`<base>-email.jpg`).
 * This script produces the files that rule names, reading the issue fixtures so
 * it only ever generates twins that something actually references — an orphaned
 * image fails `scripts/verify-image-paths.ts`, and so does a reference with no
 * file, which is what keeps these two halves honest.
 *
 * ffmpeg is the transcoder because `scripts/newsletter/photos.ts` already uses it
 * for the photo strip; adding `sharp` for this would be a second image toolchain
 * for the same job.
 *
 * Usage:
 *   npx tsx scripts/newsletter/email-covers.ts [--issue 2026-08] [--check] [--force]
 *
 * Flags:
 *   --issue   Only this issue. Default: every issue in the registry.
 *   --check   Report what is missing and exit non-zero; write nothing. For CI
 *             and for a pre-send check.
 *   --force   Re-transcode even when the twin already exists.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import {
  EMAIL_ASSET_SUFFIX,
  needsEmailSafeTwin,
} from "../../lib/newsletter/email-assets";
import { listIssueIds } from "../../lib/newsletter/issues-registry";

/** Widest an event card is rendered; anything larger is wasted bytes. */
const TARGET_WIDTH = 1200;

/** ffmpeg -q:v value. 2-5 is visually lossless for photographic content. */
const JPEG_QUALITY = 4;

/** Where the issue fixtures live, relative to the repo root. */
const ISSUES_DIR = "lib/data/json/newsletter-issues";

interface Twin {
  /** Site-relative source, e.g. /img/events/x/cover.webp */
  source: string;
  /** Site-relative twin, e.g. /img/events/x/cover-email.jpg */
  target: string;
}

/** Prints an error and exits. */
function fail(...lines: string[]): never {
  console.error(`Error: ${lines[0]}`);
  for (const line of lines.slice(1)) console.error(`  ${line}`);
  process.exit(1);
}

/** Reads a flag's value from argv. */
function readOption(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

/**
 * Collects every cover an issue's fixture refers to that needs a twin.
 *
 * Reads the raw JSON rather than the parsed issue, because the fixture is the
 * thing `verify-image-paths.ts` scans for references — so what is written there
 * is exactly what has to exist on disk.
 *
 * @param issueId The issue, e.g. "2026-08".
 * @returns One entry per distinct cover needing a twin.
 */
function twinsForIssue(issueId: string): Twin[] {
  const fixturePath = resolve(ISSUES_DIR, `${issueId}.json`);
  if (!existsSync(fixturePath)) {
    fail(`no fixture at ${fixturePath}`);
  }

  const raw = readFileSync(fixturePath, "utf8");
  const found = new Map<string, Twin>();

  // The fixture already holds the MAPPED (-email.jpg) paths, because assemble.ts
  // maps before writing. Work backwards from those to the source that has to be
  // transcoded, so this script and the fixture cannot disagree about the name.
  const pattern = new RegExp(`/img/[^"']*${EMAIL_ASSET_SUFFIX}`, "g");
  for (const match of raw.matchAll(pattern)) {
    const target = match[0];
    const base = target.slice(0, -EMAIL_ASSET_SUFFIX.length);
    const source = [".webp", ".avif", ".png", ".jpg"]
      .map((ext) => `${base}${ext}`)
      .find((candidate) => existsSync(resolve(`public${candidate}`)));

    if (!source) {
      fail(
        `${target} is referenced by ${issueId}, but no source image exists for it.`,
        `Looked for ${base}.webp / .avif / .png / .jpg under public/.`
      );
    }
    found.set(target, { source, target });
  }

  return [...found.values()];
}

/**
 * Transcodes one cover to an email-safe JPEG.
 *
 * @param twin The source and target pair.
 */
function transcode(twin: Twin): void {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i", resolve(`public${twin.source}`),
      "-vf", `scale='min(${TARGET_WIDTH},iw)':-2`,
      "-q:v", String(JPEG_QUALITY),
      // Strip EXIF: covers are designed artwork, and metadata on a public asset
      // is a needless disclosure.
      "-map_metadata", "-1",
      resolve(`public${twin.target}`),
    ],
    { stdio: "ignore" }
  );
}

function main(): void {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const force = argv.includes("--force");
  const only = readOption(argv, "--issue");

  const issueIds = only ? [only] : listIssueIds().sort();
  if (issueIds.length === 0) fail("no issues registered.");

  const all = new Map<string, Twin>();
  for (const issueId of issueIds) {
    for (const twin of twinsForIssue(issueId)) all.set(twin.target, twin);
  }

  if (all.size === 0) {
    console.log(`No email-safe twins needed for ${issueIds.join(", ")}.`);
    return;
  }

  const missing: Twin[] = [];
  const written: Twin[] = [];

  for (const twin of all.values()) {
    const exists = existsSync(resolve(`public${twin.target}`));
    if (exists && !force) continue;

    if (check) {
      missing.push(twin);
      continue;
    }

    transcode(twin);
    written.push(twin);
  }

  if (check) {
    if (missing.length === 0) {
      console.log(`ok - all ${all.size} email-safe cover(s) present for ${issueIds.join(", ")}.`);
      return;
    }
    console.error(`Missing ${missing.length} email-safe cover(s):`);
    for (const twin of missing) console.error(`  ${twin.target}  (from ${twin.source})`);
    console.error("");
    console.error("Generate them with: npx tsx scripts/newsletter/email-covers.ts");
    process.exit(1);
  }

  for (const twin of written) {
    const bytes = statSync(resolve(`public${twin.target}`)).size;
    console.log(`  wrote ${twin.target}  ${(bytes / 1024).toFixed(0)}KB`);
  }
  console.log("");
  console.log(
    written.length === 0
      ? `Nothing to do — all ${all.size} twin(s) already present.`
      : `Wrote ${written.length} of ${all.size} twin(s).`
  );
}

try {
  main();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
