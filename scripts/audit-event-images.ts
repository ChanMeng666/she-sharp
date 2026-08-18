/**
 * Event & sponsor image audit script.
 *
 * Scans `public/img/events/`, `public/img/sponsors/`, `public/sponsors/`, then
 * cross-references every image path referenced in:
 *   - lib/data/json/events-custom.json
 *   - lib/data/sponsors.ts
 *   - components/ app/ lib/ (grepped for /img/events/, /img/sponsors/, /sponsors/ string literals)
 *
 * Outputs a report to stdout (human-readable) and scripts/audit-report.json
 * (machine-readable) with six buckets: orphans, broken, duplicates,
 * shared_files, legacy_named, rename_map.
 *
 * Read-only; does not modify any files.
 *
 * Usage:
 *   npx tsx scripts/audit-event-images.ts
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "fs";
import { join, relative, extname, basename } from "path";

const REPO_ROOT = process.cwd();

const EVENTS_JSON_PATH = "lib/data/json/events-custom.json";
const SPONSORS_TS_PATH = "lib/data/sponsors.ts";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".svg", ".webp", ".gif"]);

const SCAN_DIRS = [
  "public/img/events",
  "public/img/sponsors",
  "public/sponsors",
];

/**
 * Accepted filename-prefix aliases per event slug. Event files are considered
 * "convention-compliant" if their stem starts with EITHER the event slug OR
 * any of its aliases. Aliases are shorter, human-readable handles already
 * adopted for long event slugs.
 */
const EVENT_ALIASES: Record<string, string[]> = {
  "she-sharp-and-academyex-international-womens-day-2026": ["iwd-2026"],
  "she-sharp-candice-murray-own-your-energy": [],
  "her-waka": [],
  "her-waka-april-2026": [],
  "her-waka-may-2026": [],
};

/** Acronyms that must NOT be split by the camelCase-to-kebab converter.
 *  Example: "McCauley" must stay together as "mccauley", not "mc-cauley".
 */
const PRESERVE_ACRONYMS = ["MSD", "McCauley", "IWD"];

/** Manual rename overrides for edge cases the heuristic can't fix (typos, etc.). */
const MANUAL_RENAME_OVERRIDES: Record<string, string> = {
  // typo fix: filename says "Murrary" but speaker name is "Candice Murray"
  "/img/events/202604-CandiceMurrary.jpg": "/img/events/she-sharp-candice-murray-own-your-energy-candice-murray.jpg",
};

const GREP_DIRS = ["components", "app", "lib"];
const GREP_EXTS = new Set([".tsx", ".ts", ".jsx", ".js"]);

const PATH_PATTERN = /["'`](\/(?:img\/)?(?:events|sponsors)\/[^"'`)\s]+?\.(?:jpg|jpeg|png|svg|webp|gif))["'`]/gi;

type EventV3 = {
  id: number;
  slug: string;
  coverImage?: { url: string };
  detailPageData?: {
    speakers?: Record<string, { speakers?: Array<{ image?: string }> }>;
    organizers?: Array<{ image?: string }>;
    sponsors?: { main?: Array<{ logo?: string }>; other?: Array<{ logo?: string }> };
    photos?: Array<{ url?: string }>;
    images?: Array<{ url?: string }>;
  };
};

type EventsCustomFile = {
  template?: unknown;
  events: EventV3[];
};

type AuditReport = {
  generatedAt: string;
  summary: {
    totalFilesOnDisk: number;
    totalReferencedPaths: number;
    orphans: number;
    broken: number;
    duplicates: number;
    sharedFiles: number;
    legacyNamed: number;
    renameProposals: number;
  };
  orphans: string[];
  broken: Array<{ path: string; referencedIn: string[] }>;
  duplicates: Array<{
    canonicalSlug: string;
    preferred: string;
    obsolete: string[];
  }>;
  shared_files: Array<{ path: string; referencedByEventSlugs: string[] }>;
  legacy_named: Array<{
    path: string;
    referencingEventSlug: string;
    expectedPrefix: string;
  }>;
  rename_map: Array<{
    old: string;
    new: string;
    referencingEventSlugs: string[];
    confidence: "high" | "medium" | "low";
    note?: string;
  }>;
};

/* ------------------------------------------------------------------ */
/* 1. Scan disk                                                        */
/* ------------------------------------------------------------------ */

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  const absDir = join(REPO_ROOT, dir);
  if (!existsSync(absDir)) return out;
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const s = statSync(full);
      if (s.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(absDir);
  return out;
}

/**
 * Convert absolute filesystem path to public URL path.
 * e.g. D:/.../public/img/events/foo.png -> /img/events/foo.png
 *      D:/.../public/sponsors/bar.svg   -> /sponsors/bar.svg
 */
function toPublicPath(absPath: string): string {
  const rel = relative(join(REPO_ROOT, "public"), absPath).replace(/\\/g, "/");
  return "/" + rel;
}

function listDiskImages(): Map<string, string> {
  const map = new Map<string, string>();
  for (const dir of SCAN_DIRS) {
    for (const abs of listFilesRecursive(dir)) {
      if (!IMAGE_EXTS.has(extname(abs).toLowerCase())) continue;
      map.set(toPublicPath(abs), abs);
    }
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* 2. Collect references                                               */
/* ------------------------------------------------------------------ */

type Reference = { path: string; source: string; eventSlug?: string; role?: "cover" | "speaker" | "sponsor" | "photo" };

function collectFromEventsJson(): Reference[] {
  const abs = join(REPO_ROOT, EVENTS_JSON_PATH);
  const data: EventsCustomFile = JSON.parse(readFileSync(abs, "utf8"));
  const refs: Reference[] = [];

  for (const ev of data.events) {
    const slug = ev.slug;
    const add = (p: string | undefined, field: string, role?: Reference["role"]) => {
      if (!p) return;
      refs.push({ path: p, source: `events-custom.json#${slug}.${field}`, eventSlug: slug, role });
    };
    add(ev.coverImage?.url, "coverImage.url", "cover");
    const dpd = ev.detailPageData;
    if (dpd?.speakers) {
      for (const [group, g] of Object.entries(dpd.speakers)) {
        if (!g?.speakers) continue;
        g.speakers.forEach((s, i) => add(s.image, `detailPageData.speakers.${group}.speakers[${i}].image`, "speaker"));
      }
    }
    if (dpd?.organizers) {
      dpd.organizers.forEach((o, i) => add(o.image, `detailPageData.organizers[${i}].image`, "speaker"));
    }
    if (dpd?.sponsors) {
      dpd.sponsors.main?.forEach((s, i) => add(s.logo, `detailPageData.sponsors.main[${i}].logo`, "sponsor"));
      dpd.sponsors.other?.forEach((s, i) => add(s.logo, `detailPageData.sponsors.other[${i}].logo`, "sponsor"));
    }
    if (dpd?.photos) {
      dpd.photos.forEach((p, i) => add(p.url, `detailPageData.photos[${i}].url`, "photo"));
    }
    if (dpd?.images) {
      dpd.images.forEach((p, i) => add(p.url, `detailPageData.images[${i}].url`, "photo"));
    }
  }

  return refs;
}

function collectFromSponsorsTs(): Reference[] {
  const abs = join(REPO_ROOT, SPONSORS_TS_PATH);
  const text = readFileSync(abs, "utf8");
  const refs: Reference[] = [];
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    const matches = line.matchAll(PATH_PATTERN);
    for (const m of matches) {
      refs.push({ path: m[1], source: `${SPONSORS_TS_PATH}:${i + 1}` });
    }
  });
  return refs;
}

function collectFromCodeGrep(): Reference[] {
  const refs: Reference[] = [];
  for (const dir of GREP_DIRS) {
    for (const abs of listFilesRecursive(dir)) {
      const ext = extname(abs).toLowerCase();
      if (!GREP_EXTS.has(ext)) continue;
      const rel = relative(REPO_ROOT, abs).replace(/\\/g, "/");
      if (rel.startsWith("lib/data/json/")) continue;
      if (rel === SPONSORS_TS_PATH) continue;
      const text = readFileSync(abs, "utf8");
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        const matches = line.matchAll(PATH_PATTERN);
        for (const m of matches) {
          refs.push({ path: m[1], source: `${rel}:${i + 1}` });
        }
      });
    }
  }
  return refs;
}

/* ------------------------------------------------------------------ */
/* 3. Detect duplicates (sponsor logo canonicalization)                */
/* ------------------------------------------------------------------ */

function sponsorSlugFromPath(p: string): string {
  const stem = basename(p, extname(p));
  return stem.replace(/-logo$/i, "").toLowerCase();
}

function detectDuplicates(disk: Map<string, string>): AuditReport["duplicates"] {
  const byCanonical = new Map<string, string[]>();
  for (const p of disk.keys()) {
    if (p.startsWith("/sponsors/") || p.startsWith("/img/sponsors/")) {
      const slug = sponsorSlugFromPath(p);
      const arr = byCanonical.get(slug) ?? [];
      arr.push(p);
      byCanonical.set(slug, arr);
    }
  }
  const dupes: AuditReport["duplicates"] = [];
  for (const [slug, paths] of byCanonical.entries()) {
    if (paths.length < 2) continue;
    // prefer /img/sponsors/ over /sponsors/, prefer .svg over others
    const sorted = [...paths].sort((a, b) => {
      const aImg = a.startsWith("/img/sponsors/") ? 0 : 1;
      const bImg = b.startsWith("/img/sponsors/") ? 0 : 1;
      if (aImg !== bImg) return aImg - bImg;
      const aSvg = a.endsWith(".svg") ? 0 : 1;
      const bSvg = b.endsWith(".svg") ? 0 : 1;
      return aSvg - bSvg;
    });
    dupes.push({
      canonicalSlug: slug,
      preferred: sorted[0],
      obsolete: sorted.slice(1),
    });
  }
  return dupes;
}

/* ------------------------------------------------------------------ */
/* 4. Propose renames                                                   */
/* ------------------------------------------------------------------ */

function camelToKebab(s: string): string {
  // Protect acronyms with dash-wrapped lowercase placeholders so that:
  //   (a) camelCase regex naturally treats them as word boundaries
  //   (b) lowercase() doesn't mangle them
  //   (c) restoration preserves separation from adjacent tokens
  let protectedStr = s;
  const placeholders: Array<{ placeholder: string; original: string }> = [];
  PRESERVE_ACRONYMS.forEach((acr, i) => {
    const placeholder = `-acr${i}-`;
    if (protectedStr.includes(acr)) {
      protectedStr = protectedStr.split(acr).join(placeholder);
      placeholders.push({ placeholder, original: acr.toLowerCase() });
    }
  });
  let result = protectedStr
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
  for (const { placeholder, original } of placeholders) {
    result = result.split(placeholder).join(`-${original}-`);
  }
  // clean up resulting dash noise
  return result.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function slugifyStem(stem: string): string {
  return camelToKebab(stem)
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function acceptedPrefixesFor(slug: string): string[] {
  return [slug, ...(EVENT_ALIASES[slug] ?? [])];
}

function hasAcceptedPrefix(stem: string, slug: string): boolean {
  const stemLower = stem.toLowerCase();
  return acceptedPrefixesFor(slug).some(p => stemLower.startsWith(p.toLowerCase() + "-") || stemLower === p.toLowerCase());
}

function preferredPrefixFor(slug: string): string {
  const aliases = EVENT_ALIASES[slug] ?? [];
  // prefer shortest alias over the full slug (readability), fall back to slug
  if (aliases.length === 0) return slug;
  const all = [slug, ...aliases];
  return all.reduce((a, b) => (a.length <= b.length ? a : b));
}

/**
 * Derive a descriptive slug from an old filename, trying to strip known
 * legacy prefixes. Returns the descriptive part AFTER the event slug.
 */
function deriveDescriptiveSlug(oldStem: string, eventSlug: string): { slug: string; confidence: "high" | "medium" | "low"; note?: string } {
  let s = oldStem;

  // strip common legacy date/event prefixes (case insensitive)
  const legacyPrefixes = [
    /^\d{6}-+/i,           // 202604-
    /^\d{4}-her-waka-+/i,  // 2026-Her-Waka-
    /^her-?waka-+/i,       // HerWaka- / her-waka-
    /^msd-+/i,             // MSD-
  ];
  for (const re of legacyPrefixes) {
    if (re.test(s)) {
      s = s.replace(re, "");
      break;
    }
  }

  const kebab = slugifyStem(s);

  if (!kebab) {
    return { slug: "cover", confidence: "low", note: "Could not derive descriptive slug; defaulting to 'cover'" };
  }

  // detect if the result looks like a person name (2+ words) vs a generic descriptor
  const confidence: "high" | "medium" | "low" =
    oldStem.match(/^(\d{4,6}|her-?waka|2026)-/i) ? "medium" : "high";

  return { slug: kebab, confidence };
}

function computeRenameMap(
  eventRefs: Reference[],
  diskImages: Map<string, string>
): AuditReport["rename_map"] {
  // group references by file path to find files referenced by 1+ event slugs
  const byPath = new Map<string, Set<string>>();
  // track whether a given path is any event's coverImage.url
  const coverPaths = new Set<string>();
  for (const r of eventRefs) {
    if (!r.eventSlug) continue;
    if (!r.path.startsWith("/img/events/")) continue;
    const slugs = byPath.get(r.path) ?? new Set();
    slugs.add(r.eventSlug);
    byPath.set(r.path, slugs);
    if (r.role === "cover") coverPaths.add(r.path);
  }

  const proposals: AuditReport["rename_map"] = [];

  /** Apply manual override if configured for this path, returning the final target path. */
  const applyOverride = (oldPath: string, defaultNew: string): string => {
    return MANUAL_RENAME_OVERRIDES[oldPath] ?? defaultNew;
  };

  /** Build the suggested descriptive part of the new filename. */
  const suggestDescriptive = (oldStem: string, slug: string, isCover: boolean): { descriptive: string; confidence: "high" | "medium" | "low"; note?: string } => {
    if (isCover) return { descriptive: "cover", confidence: "high" };
    const r = deriveDescriptiveSlug(oldStem, slug);
    return { descriptive: r.slug, confidence: r.confidence, note: r.note };
  };

  for (const [oldPath, slugSet] of byPath.entries()) {
    const slugs = [...slugSet];
    const oldStem = basename(oldPath, extname(oldPath));
    const ext = extname(oldPath).toLowerCase();
    const isCover = coverPaths.has(oldPath);

    // for shared files (2+ slugs), propose ONE new name per slug (copy-per-event)
    if (slugs.length > 1) {
      for (const slug of slugs) {
        const prefix = preferredPrefixFor(slug);
        const { descriptive, confidence } = suggestDescriptive(oldStem, slug, isCover);
        const defaultNewPath = `/img/events/${prefix}-${descriptive}${ext}`;
        const newPath = applyOverride(oldPath, defaultNewPath);
        if (newPath === oldPath) continue;
        proposals.push({
          old: oldPath,
          new: newPath,
          referencingEventSlugs: [slug],
          confidence,
          note: `Shared asset: referenced by ${slugs.length} events; will be copied to per-event filename.`,
        });
      }
      continue;
    }

    // single referencing event: skip if already compliant with any accepted prefix
    const [slug] = slugs;
    if (hasAcceptedPrefix(oldStem, slug)) continue;
    const prefix = preferredPrefixFor(slug);
    const { descriptive, confidence, note } = suggestDescriptive(oldStem, slug, isCover);
    const defaultNewPath = `/img/events/${prefix}-${descriptive}${ext}`;
    const newPath = applyOverride(oldPath, defaultNewPath);
    if (newPath === oldPath) continue;
    // confidence downgrade: if descriptive slug still contains legacy tokens, mark low
    let conf = confidence;
    if (!isCover && /herwaka|^\d{4,6}/.test(descriptive)) conf = "low";
    // override = high confidence (human-curated)
    if (MANUAL_RENAME_OVERRIDES[oldPath]) conf = "high";
    proposals.push({
      old: oldPath,
      new: newPath,
      referencingEventSlugs: [slug],
      confidence: conf,
      ...(note ? { note } : {}),
      ...(MANUAL_RENAME_OVERRIDES[oldPath] ? { note: "Manual override (typo fix or special case)" } : {}),
    });
  }

  // sponsor-in-events-folder (e.g., /img/events/iwd-2026-academyex-logo.svg → /img/sponsors/academyex.svg)
  for (const r of eventRefs) {
    if (!r.path.startsWith("/img/events/")) continue;
    if (!/-logo\.[a-z]+$/i.test(r.path)) continue;
    const stem = basename(r.path, extname(r.path)).toLowerCase();
    // e.g. "iwd-2026-academyex-logo" -> sponsor slug "academyex"
    const match = stem.match(/(?:-)([a-z0-9]+)-logo$/);
    if (!match) continue;
    const sponsorSlug = match[1];
    const candidate = `/img/sponsors/${sponsorSlug}.svg`;
    if (diskImages.has(candidate)) {
      // replace any proposal for this file, or add new if not already proposed
      const existing = proposals.find(p => p.old === r.path);
      if (existing) {
        existing.new = candidate;
        existing.confidence = "high";
        existing.note = `Sponsor logo already exists in canonical /img/sponsors/ — reference path should be updated (source file can then be deleted).`;
      } else {
        proposals.push({
          old: r.path,
          new: candidate,
          referencingEventSlugs: r.eventSlug ? [r.eventSlug] : [],
          confidence: "high",
          note: `Sponsor logo already exists in canonical /img/sponsors/ — reference path should be updated (source file can then be deleted).`,
        });
      }
    }
  }

  // plain-named sponsor file in events folder (e.g., /img/events/metlifecare.png)
  // This case SUPERSEDES the main-loop proposal because the canonical /img/sponsors/
  // SVG is strictly better than a per-event copy.
  for (const r of eventRefs) {
    if (!r.path.startsWith("/img/events/")) continue;
    const stem = basename(r.path, extname(r.path)).toLowerCase();
    if (stem.includes("-")) continue; // has dash, probably not a plain sponsor name
    const candidate = `/img/sponsors/${stem}.svg`;
    if (!diskImages.has(candidate)) continue;
    const existingIdx = proposals.findIndex(p => p.old === r.path);
    const overridden = {
      old: r.path,
      new: candidate,
      referencingEventSlugs: r.eventSlug ? [r.eventSlug] : [],
      confidence: "high" as const,
      note: `Sponsor logo already exists as SVG in canonical /img/sponsors/ — reference path should be updated (source file in events/ can be deleted).`,
    };
    if (existingIdx >= 0) proposals[existingIdx] = overridden;
    else proposals.push(overridden);
  }

  return proposals;
}

/* ------------------------------------------------------------------ */
/* 5. Main                                                              */
/* ------------------------------------------------------------------ */

function main() {
  console.log("▶ Scanning disk ...");
  const disk = listDiskImages();
  console.log(`  ${disk.size} image files on disk across ${SCAN_DIRS.join(", ")}`);

  console.log("▶ Collecting references ...");
  const eventRefs = collectFromEventsJson();
  const sponsorRefs = collectFromSponsorsTs();
  const codeRefs = collectFromCodeGrep();
  const allRefs = [...eventRefs, ...sponsorRefs, ...codeRefs];
  console.log(`  events-custom.json: ${eventRefs.length} paths`);
  console.log(`  sponsors.ts:        ${sponsorRefs.length} paths`);
  console.log(`  code (tsx/ts):      ${codeRefs.length} paths`);

  const referencedPaths = new Set(allRefs.map(r => r.path));

  /* orphans */
  const orphans = [...disk.keys()].filter(p => !referencedPaths.has(p)).sort();

  /* broken — verify via direct fs check, NOT the limited disk scan,
     because referenced paths may live in directories outside our scan scope
     (e.g., /img/legacy-site/ is intentionally not scanned). */
  const refsByPath = new Map<string, string[]>();
  for (const r of allRefs) {
    const arr = refsByPath.get(r.path) ?? [];
    arr.push(r.source);
    refsByPath.set(r.path, arr);
  }
  const broken: AuditReport["broken"] = [];
  for (const [p, sources] of refsByPath.entries()) {
    const abs = join(REPO_ROOT, "public", p.replace(/^\//, ""));
    if (!existsSync(abs)) broken.push({ path: p, referencedIn: sources });
  }
  broken.sort((a, b) => a.path.localeCompare(b.path));

  /* duplicates */
  const duplicates = detectDuplicates(disk);

  /* shared_files (event-referenced files used by 2+ events) */
  const eventRefsByPath = new Map<string, Set<string>>();
  for (const r of eventRefs) {
    if (!r.eventSlug) continue;
    const set = eventRefsByPath.get(r.path) ?? new Set();
    set.add(r.eventSlug);
    eventRefsByPath.set(r.path, set);
  }
  const shared_files: AuditReport["shared_files"] = [];
  for (const [p, slugs] of eventRefsByPath.entries()) {
    if (slugs.size >= 2) {
      shared_files.push({ path: p, referencedByEventSlugs: [...slugs].sort() });
    }
  }
  shared_files.sort((a, b) => a.path.localeCompare(b.path));

  /* legacy_named */
  const legacy_named: AuditReport["legacy_named"] = [];
  for (const [p, slugs] of eventRefsByPath.entries()) {
    if (!p.startsWith("/img/events/")) continue;
    if (slugs.size !== 1) continue; // shared files handled separately
    const [slug] = slugs;
    const stem = basename(p, extname(p));
    if (!hasAcceptedPrefix(stem, slug)) {
      legacy_named.push({
        path: p,
        referencingEventSlug: slug,
        expectedPrefix: `${preferredPrefixFor(slug)}- (or aliases: ${acceptedPrefixesFor(slug).join(", ")})`,
      });
    }
  }
  legacy_named.sort((a, b) => a.path.localeCompare(b.path));

  /* rename_map */
  const rename_map = computeRenameMap(eventRefs, disk);
  rename_map.sort((a, b) => a.old.localeCompare(b.old));

  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalFilesOnDisk: disk.size,
      totalReferencedPaths: referencedPaths.size,
      orphans: orphans.length,
      broken: broken.length,
      duplicates: duplicates.length,
      sharedFiles: shared_files.length,
      legacyNamed: legacy_named.length,
      renameProposals: rename_map.length,
    },
    orphans,
    broken,
    duplicates,
    shared_files,
    legacy_named,
    rename_map,
  };

  /* print human-readable */
  console.log("\n" + "═".repeat(72));
  console.log("  AUDIT REPORT");
  console.log("═".repeat(72));
  const s = report.summary;
  console.log(`  Disk files:    ${s.totalFilesOnDisk}`);
  console.log(`  Referenced:    ${s.totalReferencedPaths} unique paths`);
  console.log(`  Orphans:       ${s.orphans}`);
  console.log(`  Broken:        ${s.broken}`);
  console.log(`  Duplicates:    ${s.duplicates} (sponsor slugs with 2+ copies)`);
  console.log(`  Shared files:  ${s.sharedFiles} (used by 2+ events)`);
  console.log(`  Legacy named:  ${s.legacyNamed} (event files missing slug prefix)`);
  console.log(`  Rename props:  ${s.renameProposals}`);

  if (orphans.length) {
    console.log("\n── Orphans (on disk, not referenced anywhere) ──");
    for (const p of orphans) console.log(`  ${p}`);
  }
  if (broken.length) {
    console.log("\n── Broken (referenced but missing on disk) ──");
    for (const b of broken) {
      console.log(`  ${b.path}`);
      for (const src of b.referencedIn) console.log(`    ← ${src}`);
    }
  }
  if (duplicates.length) {
    console.log("\n── Duplicates (same sponsor, multiple files) ──");
    for (const d of duplicates) {
      console.log(`  ${d.canonicalSlug}: preferred=${d.preferred}`);
      for (const o of d.obsolete) console.log(`    obsolete: ${o}`);
    }
  }
  if (shared_files.length) {
    console.log("\n── Shared files (used by 2+ events) ──");
    for (const sh of shared_files) {
      console.log(`  ${sh.path}`);
      for (const slug of sh.referencedByEventSlugs) console.log(`    ← ${slug}`);
    }
  }
  if (legacy_named.length) {
    console.log("\n── Legacy named (missing slug prefix) ──");
    for (const l of legacy_named) {
      console.log(`  ${l.path}  (expected prefix: ${l.expectedPrefix})`);
    }
  }
  if (rename_map.length) {
    console.log("\n── Rename proposals ──");
    for (const r of rename_map) {
      const mark = r.confidence === "high" ? "●" : r.confidence === "medium" ? "◐" : "○";
      console.log(`  ${mark} ${r.old}`);
      console.log(`      → ${r.new}`);
      if (r.note) console.log(`      note: ${r.note}`);
    }
    console.log("\n  Legend:  ● high confidence   ◐ medium   ○ low (review carefully)");
  }

  /* write machine-readable */
  const reportPath = join(REPO_ROOT, "scripts", "audit-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\n▶ Machine-readable report written to: scripts/audit-report.json`);
}

main();
