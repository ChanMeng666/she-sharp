/**
 * Image path integrity gate.
 *
 * Three checks, each individually runnable:
 *
 *   --forward    every referenced path resolves to a file under `public/`
 *   --reverse    every file under `public/img/` is referenced by something
 *   --ownership  every file under `public/img/events/` belongs to a known event
 *
 * With no flag it runs all three and exits non-zero if any fails.
 *
 * The forward check is the original gate. The other two exist for the move of
 * ~170 event images into per-event folders: a mover that renames a file but
 * misses one of its references leaves a dead path (forward catches it), and a
 * mover that rewrites a reference but misses the file leaves an unreachable
 * image that no page will ever show again (reverse catches it). Ownership is
 * the invariant the move preserves rather than establishes — it holds in the
 * flat layout of today and in the nested layout afterwards, which is what makes
 * it safe to land the gate before the move.
 *
 * What counts as a reference is defined once, in `scripts/assets/refs.ts`, and
 * imported by both this gate and the mover so the two cannot disagree.
 *
 * Usage:
 *   npx tsx scripts/verify-image-paths.ts
 *   npx tsx scripts/verify-image-paths.ts --reverse
 */

import { readdirSync, existsSync } from "fs";
import { join, relative } from "path";

import { collectReferences, groupByPath, isNonUseSource, REPO_ROOT, type Reference } from "./assets/refs";
import { resolveOwner } from "./assets/event-assets";

/**
 * Files under `public/img/` that nothing references, on purpose.
 *
 * Every entry needs a reason, because "unreferenced" is the state an asset is
 * in both just before it is deleted and just after someone broke the page that
 * used it. Without the reason the list becomes the place broken things go to be
 * forgotten. An entry that stops being true — the file is referenced again, or
 * has been deleted — fails this check rather than sitting stale.
 */
export const KNOWN_UNREFERENCED: Array<{ path: string; reason: string }> = [
  // A second poster set generated for the Les Mills evening. The event page
  // still points at the originals; keep or drop is an unmade decision, not an
  // accident, so they are neither wired up nor deleted.
  { path: "/img/events/event-lesmills-03-september-2026/humanitix-v2.jpg", reason: "regenerated poster set, pending a keep-or-drop decision" },
  { path: "/img/events/event-lesmills-03-september-2026/poster-v2.webp", reason: "regenerated poster set, pending a keep-or-drop decision" },
  { path: "/img/events/event-lesmills-03-september-2026/social-v2.jpg", reason: "regenerated poster set, pending a keep-or-drop decision" },
  { path: "/img/events/event-lesmills-03-september-2026/social-v2.webp", reason: "regenerated poster set, pending a keep-or-drop decision" },
  { path: "/img/events/event-lesmills-03-september-2026/square-v2.jpg", reason: "regenerated poster set, pending a keep-or-drop decision" },
  { path: "/img/events/event-lesmills-03-september-2026/square-v2.webp", reason: "regenerated poster set, pending a keep-or-drop decision" },
  { path: "/img/events/event-lesmills-03-september-2026/story-v2.jpg", reason: "regenerated poster set, pending a keep-or-drop decision" },
  { path: "/img/events/event-lesmills-03-september-2026/story-v2.webp", reason: "regenerated poster set, pending a keep-or-drop decision" },

  // The Slack event sync duplicates a shared speaker photo per event rather
  // than sharing one file across events (docs/development/SLACK_APP_DEVELOPMENT_GUIDE.md).
  // The April 2026 Her Waka page never used this copy — only the March one is
  // on a page — so the duplicate has been sitting here unread since it landed.
  { path: "/img/events/her-waka-april-2026/chan-meng.png", reason: "per-event duplicate of her-waka-chan-meng.png that no page ever referenced; delete once someone confirms the April event does not want it" },

  { path: "/img/team/Isha.webp", reason: "departed team member; the entry is commented out in lib/data/team.ts rather than deleted, so the photo is kept alongside it" },

  // Not a supporter's logo and deliberately not on the sponsor wall: it is She
  // Sharp's own event mark. Named in the JSDoc of lib/data/sponsors.ts, which
  // is a comment and therefore not a reference.
  { path: "/img/sponsors/aotearoa-ai-hackathon-festival.jpg", reason: "She Sharp's own hackathon mark, deliberately absent from lib/data/sponsors.ts" },

  // The Webflow scrape recorded this podcast cover under `localPath` only —
  // the `url` field for that episode is empty, so no page ever renders it.
  { path: "/img/legacy-site/podcasts/65a9cbb3c67fedb1bc802f30_Podcast_Template_1_bc8e5114.png", reason: "scraped podcast cover with an empty `url` in shesharp_podcasts_with_local_images.json; reachable only via the legacy `localPath` field" },
];

/**
 * Sources whose image paths are illustrations rather than references.
 *
 * The corpus deliberately includes documentation and scripts so the mover
 * rewrites them too, but a doc that shows `/img/my-new-event.webp` as an
 * example, and a test that invents `/img/events/no-such-event-cover.webp` to
 * assert a refusal, are not broken images. They are excluded from the forward
 * check only — the reverse check still sees whatever they legitimately name.
 */
const FORWARD_EXEMPT_SOURCES: Array<{ match: RegExp; reason: string }> = [
  { match: /\.md:/, reason: "markdown documentation writes example paths" },
  {
    // The bot prompt teaches by contrast: it shows the flat path it must NOT
    // emit next to the folder path it must. The wrong half is required to not
    // exist, which is exactly what the forward check would flag.
    match: /^lib\/slack-bot\/conventions\.ts:/,
    reason: "OpenAI prompt text, including deliberate counter-examples",
  },
  {
    // Named exactly, not as a `*.test.ts` pattern. `lib/deck/deck.test.ts`
    // names two real assets and one of them is an event photo the move will
    // rename, so a pattern that exempted every test would quietly stop
    // checking the file most likely to break.
    match: /^scripts\/assets\/event-assets\.test\.ts:/,
    reason: "asserts what resolveOwner() does with paths that do not exist",
  },
];

function isForwardExempt(source: string): boolean {
  return FORWARD_EXEMPT_SOURCES.some((entry) => entry.match.test(source));
}

/** Basenames under `public/img/` that are not assets. */
const NON_ASSET_FILES = new Set(["README.md", "index.ts"]);

/** Every image under `public/img/`, as a site-relative path. */
function listPublicImages(): string[] {
  const publicDir = join(REPO_ROOT, "public");
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (NON_ASSET_FILES.has(entry.name)) continue;
      out.push(`/${relative(publicDir, full).split("\\").join("/")}`);
    }
  };
  walk(join(publicDir, "img"));
  return out.sort((a, b) => a.localeCompare(b));
}

function forwardCheck(byPath: Map<string, Reference[]>): boolean {
  const missing: Array<{ path: string; sources: string[] }> = [];
  let checked = 0;

  for (const [path, refs] of byPath.entries()) {
    const live = refs.filter((ref) => !isForwardExempt(ref.source));
    if (live.length === 0) continue;
    checked += 1;
    if (!existsSync(join(REPO_ROOT, "public", path.replace(/^\//, "")))) {
      missing.push({ path, sources: live.map((ref) => ref.source) });
    }
  }

  console.log(`▶ forward: ${checked} unique image paths referenced by code and data.`);
  if (missing.length === 0) {
    console.log("✓ All referenced image paths resolve to files on disk.");
    return true;
  }

  console.error(`\n✗ ${missing.length} broken image path${missing.length === 1 ? "" : "s"}:`);
  for (const entry of missing.sort((a, b) => a.path.localeCompare(b.path))) {
    console.error(`  ${entry.path}`);
    for (const source of entry.sources) console.error(`    ← referenced in ${source}`);
  }
  console.error("\nFix each one — either restore the file or update the reference.");
  return false;
}

function reverseCheck(byPath: Map<string, Reference[]>): boolean {
  const files = listPublicImages();
  const known = new Map(KNOWN_UNREFERENCED.map((entry) => [entry.path, entry.reason]));
  const onDisk = new Set(files);

  // A file named by the allow-list above, or by the ownership test, is named
  // rather than used — see NON_USE_SOURCES in scripts/assets/refs.ts.
  const used = (path: string): boolean =>
    (byPath.get(path) ?? []).some((ref) => !isNonUseSource(ref.source));

  const orphans = files.filter((file) => !used(file) && !known.has(file));
  const stale = [...known.keys()].filter((path) => !onDisk.has(path) || used(path));

  console.log(`▶ reverse: ${files.length} files under public/img/, ${known.size} allowed to be unreferenced.`);
  if (orphans.length === 0 && stale.length === 0) {
    console.log("✓ Every image on disk is referenced by something.");
    return true;
  }

  if (orphans.length > 0) {
    console.error(`\n✗ ${orphans.length} image${orphans.length === 1 ? "" : "s"} on disk that nothing references:`);
    for (const path of orphans) console.error(`  ${path}`);
    console.error("\nEither wire each one up, delete it, or add it to KNOWN_UNREFERENCED with a reason.");
  }
  if (stale.length > 0) {
    console.error(`\n✗ ${stale.length} stale KNOWN_UNREFERENCED entr${stale.length === 1 ? "y" : "ies"}:`);
    for (const path of stale) {
      const why = onDisk.has(path) ? "is referenced again" : "no longer exists";
      console.error(`  ${path} — ${why}; remove the entry`);
    }
  }
  return false;
}

/**
 * Nothing may sit loose at the top of `public/img/events/`.
 *
 * This is the check that stops the old layout growing back. Ownership alone
 * does not: `her-waka-june-2026-cover.webp` dropped in the root still resolves
 * to its event, so every other gate stays green while the flat directory
 * quietly refills one event at a time. Requiring directories makes the
 * regression impossible rather than merely discouraged.
 */
function layoutCheck(): boolean {
  const eventsDir = join(REPO_ROOT, "public", "img", "events");
  if (!existsSync(eventsDir)) return true;

  const stray = readdirSync(eventsDir, { withFileTypes: true })
    .filter((entry) => !entry.isDirectory() && entry.name !== "README.md")
    .map((entry) => entry.name);
  if (stray.length === 0) return true;

  console.error(`\n\u2717 ${stray.length} file(s) loose at the top of public/img/events/:`);
  for (const name of stray) console.error(`  ${name}`);
  console.error(
    "\nEvery asset belongs to exactly one event and lives in that event's folder:\n" +
      "  public/img/events/<event-slug>/<what-it-is>.<ext>\n" +
      "Drop the slug prefix from the filename when you move it in."
  );
  return false;
}

function ownershipCheck(): boolean {
  const files = listPublicImages().filter((file) => file.startsWith("/img/events/"));
  const unowned = files.filter((file) => resolveOwner(file) === null);

  console.log(`\u25b6 ownership: ${files.length} files under public/img/events/.`);

  const layoutOk = layoutCheck();
  if (unowned.length === 0) {
    if (layoutOk) console.log("\u2713 Every event image sits in its own event's folder.");
    return layoutOk;
  }

  console.error(`\n\u2717 ${unowned.length} event image(s) that no event owns:`);
  for (const path of unowned) console.error(`  ${path}`);
  console.error(
    "\nEach needs to move into its event's folder, gain an entry in ALIASES\n" +
      "(scripts/assets/event-assets.ts), or leave public/img/events/ entirely."
  );
  return false;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const selected = {
    forward: args.has("--forward"),
    reverse: args.has("--reverse"),
    ownership: args.has("--ownership"),
  };
  if (!selected.forward && !selected.reverse && !selected.ownership) {
    selected.forward = selected.reverse = selected.ownership = true;
  }

  const byPath = groupByPath(collectReferences());
  const results: boolean[] = [];

  if (selected.forward) results.push(forwardCheck(byPath));
  if (selected.reverse) {
    if (results.length > 0) console.log("");
    results.push(reverseCheck(byPath));
  }
  if (selected.ownership) {
    if (results.length > 0) console.log("");
    results.push(ownershipCheck());
  }

  if (results.every(Boolean)) process.exit(0);
  console.error("\nCI gate failed.");
  process.exit(1);
}

main();
