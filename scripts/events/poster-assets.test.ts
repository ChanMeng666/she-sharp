/**
 * The two homes for an unreferenced image must never claim the same file.
 *
 * `scripts/verify-image-paths.ts` runs a reverse check — every file under
 * `public/img/` must be referenced by something — and two mechanisms satisfy
 * it for artwork no page renders:
 *
 *   - the generated per-event `index.ts` manifest, whose contents are decided
 *     by `UNRENDERED` in `build-event-poster.ts`, meaning "the campaign ships
 *     this, so guard it";
 *   - `KNOWN_UNREFERENCED`, meaning "somebody built this and has not decided
 *     whether to keep it".
 *
 * They are not interchangeable, and the gate fails an allow-list entry that has
 * become referenced. So a file claimed by both is a build that goes red for a
 * reason nobody changed: on 21 Aug 2026 `UNRENDERED` gained patterns matching
 * `humanitix|social|story|square` WITH an optional `-suffix`, which silently
 * claimed the eight Les Mills `-v2` files sitting in the allow-list awaiting a
 * keep-or-drop decision. Nothing failed at the time, because a manifest is only
 * rewritten when its event is rebuilt — the next rebuild of that event would
 * have turned CI red weeks later, for artwork nobody had touched.
 *
 * Run: npx tsx scripts/events/poster-assets.test.ts
 */
import assert from "node:assert/strict";
import path from "node:path";

import { UNRENDERED } from "./build-event-poster";
import { KNOWN_UNREFERENCED } from "../verify-image-paths";

let failures = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL - ${name}`);
    console.error(`    ${(error as Error).message}`);
  }
}

console.log("\nposter asset ownership");

check("no allow-list entry is also claimed by the generated manifest", () => {
  const clashes = KNOWN_UNREFERENCED.filter((entry) => {
    const file = path.posix.basename(entry.path);
    return UNRENDERED.some((pattern) => pattern.test(file));
  }).map((entry) => entry.path);

  assert.deepStrictEqual(
    clashes,
    [],
    `these are in KNOWN_UNREFERENCED and would ALSO be written into their event's ` +
      `index.ts on the next rebuild, which fails verify-image-paths as a stale ` +
      `allow-list entry:\n      ${clashes.join("\n      ")}\n` +
      `    Pick one owner. A --suffix variant awaiting a decision belongs in the ` +
      `allow-list; the campaign's own base-named files belong in the manifest.`,
  );
});

check("the manifest claims base names and leaves --suffix variants alone", () => {
  // The distinction the clash above came from, asserted directly so a future
  // widening of a pattern fails here with the reason rather than in CI weeks
  // later on an unrelated branch.
  const live = ["email.jpg", "humanitix.jpg", "social.jpg", "story.webp", "square.jpg"];
  const variants = ["email-v2.jpg", "humanitix-v2.jpg", "social-v2.jpg", "poster-light.webp"];
  const claims = (f: string) => UNRENDERED.some((p) => p.test(f));

  for (const f of live) assert.ok(claims(f), `${f} ships with the campaign and must be in the manifest`);
  for (const f of variants) {
    assert.ok(!claims(f), `${f} is a --suffix variant and must be left to KNOWN_UNREFERENCED`);
  }
});

check("the two files a page renders are never in the manifest", () => {
  // `social.webp` is the event's coverImage and `poster.webp` its posters[]
  // entry. Naming a rendered file here would be harmless today and misleading
  // forever: the manifest's whole claim is that nothing else points at these.
  for (const f of ["social.webp", "poster.webp", "cover.webp"]) {
    assert.ok(
      !UNRENDERED.some((p) => p.test(f)),
      `${f} is rendered by the event page and must not be claimed as unrendered`,
    );
  }
});

console.log(
  failures === 0
    ? "\nAll poster asset ownership checks passed.\n"
    : `\n${failures} check(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
