/**
 * Deck shape as a sequence — the rules that a slide cannot break on its own.
 *
 * Lives apart from `lint.ts` because three callers need the same definitions:
 * the linter reports violations, the evening-event planner has to avoid
 * creating them in the first place, and the tests assert both. When these
 * constants lived inside the linter, the planner had to restate them, and a
 * restated rule is a rule that drifts.
 */

import type { Slide, SlideTone, SlideType } from "./types";
import { toneOf } from "./utils";

/**
 * Slides that fill the frame and make a statement, as against slides that
 * carry information.
 *
 * The distinction is the one the room feels: a full-frame slide is a breath,
 * and information does not rest an audience however well it is set.
 */
export const HERO_TYPES: ReadonlySet<SlideType> = new Set<SlideType>([
  "title",
  "section",
  "karakia",
  "break",
  "photo",
  "prizes",
]);

/** Whether a slide reads as a full-frame statement rather than information. */
export function isHero(type: SlideType): boolean {
  return HERO_TYPES.has(type);
}

/** The minimum a rhythm check needs to know about a slide. */
export interface RhythmStep {
  type: SlideType;
  tone: SlideTone;
}

/** Reduces a real slide to what the sequence rules actually look at. */
export function toRhythmStep(slide: Slide): RhythmStep {
  return { type: slide.type, tone: toneOf(slide) };
}

/**
 * The longest run of each distinct key, rather than the single longest overall.
 *
 * The previous implementation kept one global best and callers then asked
 * "…and was that best a run of heroes?". Because `buildClosingSlides()` always
 * ends a deck with four consecutive information slides, the global best was
 * always an information run of at least four, so a run of three or four heroes
 * could never become the best and `rhythm-hero-run` could not fire at all. The
 * rule had been dead since it was written. Reporting per value is the fix, and
 * it costs one Map.
 */
export function longestRunPerValue<T>(
  items: readonly T[],
  key: (item: T) => string,
): Map<string, { length: number; endsAt: number }> {
  const best = new Map<string, { length: number; endsAt: number }>();
  let current: string | undefined;
  let length = 0;

  items.forEach((item, index) => {
    const value = key(item);
    length = value === current ? length + 1 : 1;
    current = value;

    const previous = best.get(value);
    if (!previous || length > previous.length) {
      best.set(value, { length, endsAt: index });
    }
  });

  return best;
}

/** One broken sequence rule, with enough detail to name the offending slide. */
export interface RhythmViolation {
  rule:
    | "rhythm-hero-run"
    | "rhythm-content-run"
    | "rhythm-tone-run"
    | "rhythm-dark-share"
    | "rhythm-layout-variety";
  length: number;
  endsAt: number;
  detail: string;
}

/** Sequence limits. Mirrored into `COPY_LIMITS` so authors see one table. */
export const RHYTHM_LIMITS = {
  consecutiveHero: 2,
  consecutiveContent: 4,
  consecutiveTone: 4,
  darkShare: 0.25,
  floorSlides: 12,
  distinctLayouts: 8,
} as const;

/**
 * Every sequence rule a deck breaks, in slide order.
 *
 * Pure over `RhythmStep[]`, so the planner can test a deck it has not built
 * yet and the degradation matrix can enumerate thousands of shapes without
 * constructing a single real slide.
 */
export function rhythmViolations(steps: readonly RhythmStep[]): RhythmViolation[] {
  const violations: RhythmViolation[] = [];
  if (steps.length === 0) return violations;

  const byRegister = longestRunPerValue(steps, (step) =>
    isHero(step.type) ? "hero" : "content",
  );

  const heroRun = byRegister.get("hero");
  if (heroRun && heroRun.length > RHYTHM_LIMITS.consecutiveHero) {
    violations.push({
      rule: "rhythm-hero-run",
      length: heroRun.length,
      endsAt: heroRun.endsAt,
      detail: `${heroRun.length} full-frame slides in a row (max ${RHYTHM_LIMITS.consecutiveHero})`,
    });
  }

  const contentRun = byRegister.get("content");
  if (contentRun && contentRun.length > RHYTHM_LIMITS.consecutiveContent) {
    violations.push({
      rule: "rhythm-content-run",
      length: contentRun.length,
      endsAt: contentRun.endsAt,
      detail: `${contentRun.length} information slides in a row (max ${RHYTHM_LIMITS.consecutiveContent})`,
    });
  }

  for (const [tone, run] of longestRunPerValue(steps, (step) => step.tone)) {
    if (run.length > RHYTHM_LIMITS.consecutiveTone) {
      violations.push({
        rule: "rhythm-tone-run",
        length: run.length,
        endsAt: run.endsAt,
        detail: `${run.length} ${tone} slides in a row (max ${RHYTHM_LIMITS.consecutiveTone})`,
      });
    }
  }

  if (steps.length >= RHYTHM_LIMITS.floorSlides) {
    const dark = steps.filter((step) => step.tone === "dark").length;
    const share = dark / steps.length;
    if (share < RHYTHM_LIMITS.darkShare) {
      violations.push({
        rule: "rhythm-dark-share",
        length: dark,
        endsAt: steps.length - 1,
        detail: `only ${Math.round(share * 100)}% of slides are dark (need ${Math.round(RHYTHM_LIMITS.darkShare * 100)}%)`,
      });
    }
  }

  if (steps.length >= 10) {
    const distinct = new Set(steps.map((step) => step.type)).size;
    if (distinct < RHYTHM_LIMITS.distinctLayouts) {
      violations.push({
        rule: "rhythm-layout-variety",
        length: distinct,
        endsAt: steps.length - 1,
        detail: `only ${distinct} distinct layouts across ${steps.length} slides (need ${RHYTHM_LIMITS.distinctLayouts})`,
      });
    }
  }

  return violations;
}
