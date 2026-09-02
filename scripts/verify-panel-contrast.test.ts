/**
 * Hands `classify()` the cases it is supposed to refuse, and the ones it is
 * supposed to let through.
 *
 * The check itself needs a browser and a running site, so it cannot go in CI.
 * Its judgement can: everything that decides whether a surface is a flat panel
 * is a pure function over measurements, and this is the half that goes wrong.
 * Every exclusion below exists because a real element on this site matched it,
 * and a rule loosened by accident would let the 2026-09-02 bug back in silently
 * — the whole point of the check is that nothing else catches that bug.
 *
 * Run: npx tsx scripts/verify-panel-contrast.test.ts
 */
import assert from "node:assert/strict";
import { classify, isOpaque, type RawSurface } from "./lib/panel-contrast";

const WHITE = "rgb(255, 255, 255)";
const CANVAS = "rgb(249, 245, 248)";

/** A bordered 400x200 card on a ground, with everything else neutral. */
function surface(overrides: Partial<RawSurface> = {}): RawSurface {
  return {
    cls: "rounded-[32px] border border-border bg-white",
    bg: WHITE,
    borderWidth: 1,
    borderStyle: "solid",
    radii: [32, 32, 32, 32],
    width: 400,
    height: 200,
    viewportWidth: 1440,
    mediaCovered: false,
    groundBg: CANVAS,
    groundCls: "flex min-h-screen flex-col bg-background",
    ...overrides,
  };
}

let failures = 0;
function check(name: string, run: () => void): void {
  try {
    run();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures++;
    console.error(`not ok - ${name}`);
    console.error(`    ${error instanceof Error ? error.message : error}`);
  }
}

// --- the bug this check exists for -----------------------------------------

check("a card painting its own ground colour is a finding", () => {
  const found = classify([surface({ groundBg: WHITE })]);
  assert.equal(found.length, 1);
  assert.equal(found[0].count, 1);
  assert.equal(found[0].bg, WHITE);
});

check("the same flat card twice is one finding with a count of two", () => {
  const flat = surface({ groundBg: WHITE });
  const found = classify([flat, { ...flat }]);
  assert.equal(found.length, 1);
  assert.equal(found[0].count, 2);
});

check("a radius with no border still bounds a panel", () => {
  const found = classify([
    surface({ groundBg: WHITE, borderWidth: 0, borderStyle: "none" }),
  ]);
  assert.equal(found.length, 1);
});

check("a border with no radius still bounds a panel", () => {
  const found = classify([
    surface({ groundBg: WHITE, radii: [0, 0, 0, 0] }),
  ]);
  assert.equal(found.length, 1);
});

// --- what must NOT be a finding --------------------------------------------

check("a card that separates from its ground is not a finding", () => {
  assert.deepEqual(classify([surface()]), []);
});

check("a full-bleed section matching the page is the ground, not a panel", () => {
  const found = classify([
    surface({ groundBg: WHITE, width: 1440, viewportWidth: 1440 }),
  ]);
  assert.deepEqual(found, []);
});

check("a single-corner radius is a knockout, not a panel", () => {
  // components/ui/inflected-card.tsx paints the page colour to carve the notch
  // around its arrow button, so matching the ground is the design.
  const found = classify([
    surface({
      groundBg: WHITE,
      borderWidth: 0,
      borderStyle: "none",
      radii: [96, 0, 0, 0],
      cls: "inflected-icon",
    }),
  ]);
  assert.deepEqual(found, []);
});

check("a well the media covers is not a contrast problem", () => {
  const found = classify([surface({ groundBg: WHITE, mediaCovered: true })]);
  assert.deepEqual(found, []);
});

check("a chip is too small to be a panel", () => {
  const found = classify([
    surface({ groundBg: WHITE, width: 44, height: 44 }),
  ]);
  assert.deepEqual(found, []);
});

check("a radius under 12px is decoration, not a boundary", () => {
  const found = classify([
    surface({
      groundBg: WHITE,
      borderWidth: 0,
      borderStyle: "none",
      radii: [4, 4, 4, 4],
    }),
  ]);
  assert.deepEqual(found, []);
});

check("a surface with nothing painted behind it is not judged", () => {
  assert.deepEqual(classify([surface({ groundBg: null })]), []);
});

check("a translucent fill matching its ground shows through on purpose", () => {
  const found = classify([
    surface({ groundBg: "rgba(255, 255, 255, 0.1)", bg: "rgba(255, 255, 255, 0.1)" }),
  ]);
  assert.deepEqual(found, []);
});

// --- the alpha test the browser actually feeds it ---------------------------

check("isOpaque rejects every alpha spelling Chromium emits", () => {
  assert.equal(isOpaque("rgba(0, 0, 0, 0)"), false);
  assert.equal(isOpaque("rgba(255, 255, 255, 0.1)"), false);
  assert.equal(isOpaque("oklab(0.97 0.005 -0.002 / 0.4)"), false);
  assert.equal(isOpaque("transparent"), false);
  assert.equal(isOpaque(""), false);
});

check("isOpaque accepts solid colours", () => {
  assert.equal(isOpaque(WHITE), true);
  assert.equal(isOpaque(CANVAS), true);
  assert.equal(isOpaque("rgba(255, 255, 255, 1)"), true);
});

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll panel-contrast classifier checks passed.");
