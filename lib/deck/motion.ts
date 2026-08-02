/**
 * Semantic entrance motion for the presentation deck.
 *
 * One recipe per slide type, coupled to what the graphic on that slide *means*:
 * a figure counts, a run sheet is read down, a crowd of portraits arrives all at
 * once, a karakia is spoken one line at a time. A single generic fade-up across
 * thirty-eight slides is the thing this module exists to replace — after two
 * chapters the room stops seeing motion and starts seeing a tic.
 *
 * ## Why the DOM is queried instead of the layouts being decorated
 *
 * The eighteen layout components in `components/deck/slides/` own composition,
 * not choreography. Keeping the recipes here means the whole deck's rhythm is
 * retuned in one file, and a new layout inherits motion by using the documented
 * class vocabulary rather than by remembering to sprinkle animation classes.
 *
 * ## The two rules that are not negotiable
 *
 * 1. **Leaves, never containers.** Every move claims the elements it matches,
 *    and later moves skip anything already claimed *or contained by* something
 *    claimed. So a recipe can say "the sheet rows" and then "everything else"
 *    without the second move re-animating the first move's children.
 * 2. **Content is never left invisible.** Nothing here ever writes a hiding
 *    style. Animations run with `fill: "backwards"`, which means the offset
 *    state exists only during the animation's own delay and active phase; the
 *    instant it ends — or is cancelled, or throws, or is never started because
 *    the browser has no Web Animations API — the element is at its natural,
 *    visible, fully-composed state. A blank slide in front of a room is
 *    unrecoverable, so the failure mode is built in rather than tested for.
 */

import type { SlideType } from "./types";

/* -------------------------------------------------------------------------
   Timing tokens

   IBM Carbon's productive/expressive set. Durations are the published Carbon
   values in milliseconds; the three deck-scale additions at the bottom are
   named for what they are for, because "12 seconds" is not a Carbon concern.
   ------------------------------------------------------------------------- */

export const DECK_EASE = {
  /** `--ease-prod` — productive. Utility motion: rows, chips, rules. */
  prod: "cubic-bezier(.2,0,.38,.9)",
  /** `--ease-exp` — expressive. Moments that carry meaning: a figure, a numeral. */
  exp: "cubic-bezier(.4,.14,.3,1)",
  /** `--ease-entry-exp` — expressive entry. Something arriving from nowhere. */
  entry: "cubic-bezier(0,0,.3,1)",
  /** For anything that must not read as a gesture: the slow photographic push. */
  linear: "linear",
} as const;

export const DECK_DUR = {
  /** `--dur-fast-01` */ fast1: 70,
  /** `--dur-fast-02` */ fast2: 110,
  /** `--dur-mod-01` */ mod1: 150,
  /** `--dur-mod-02` */ mod2: 240,
  /** `--dur-slow-01` */ slow1: 400,
  /** `--dur-slow-02` */ slow2: 700,

  /** One karakia line. Deliberately longer than anything Carbon names. */
  ceremony: 1050,
  /** A figure counting up. Long enough to read the digits moving. */
  count: 1500,
  /** The photographic push. Twelve seconds is below the threshold of noticing. */
  drift: 12000,
} as const;

/** Distance a line travels into place. Larger than this reads as a slide-in. */
const RISE = 26;

/* -------------------------------------------------------------------------
   Keyframe vocabulary

   Every `from` is an *offset from the finished composition*, and every move
   resolves to `REST`. There is no state here that an element can be stranded in.
   ------------------------------------------------------------------------- */

/** The finished composition. Every move ends here. */
const REST: Keyframe = { opacity: 1, transform: "none" };

/** Opacity only. The safe move for anything whose transform belongs to CSS. */
const FADE: Keyframe = { opacity: 0 };
const LIT: Keyframe = { opacity: 1 };

/** Lifts into place from below — a line of type arriving. */
const rise = (px: number = RISE): Keyframe => ({
  opacity: 0,
  transform: `translate3d(0, ${px}px, 0)`,
});

/** Drops in from above — a row of a list being read downwards. */
const drop = (px: number): Keyframe => ({
  opacity: 0,
  transform: `translate3d(0, ${-px}px, 0)`,
});

/** Enters from the inline start — text being written left to right. */
const write = (px: number): Keyframe => ({
  opacity: 0,
  transform: `translate3d(${-px}px, 0, 0)`,
});

/** Enters from the inline end — something coming towards you from ahead. */
const approach = (px: number): Keyframe => ({
  opacity: 0,
  transform: `translate3d(${px}px, 0, 0)`,
});

/** Scales up into place. Under 1 — a thing growing to its size. */
const grow = (from: number): Keyframe => ({
  opacity: 0,
  transform: `scale(${from})`,
});

/** Scales down into place. Over 1 — a thing landing, with weight. */
const land = (from: number): Keyframe => ({
  opacity: 0,
  transform: `scale(${from})`,
});

/** The imperceptible photographic push. Opaque throughout — only the frame moves. */
const PUSH: Keyframe = { transform: "scale(1.04)" };
const PUSHED: Keyframe = { transform: "scale(1)" };

/* -------------------------------------------------------------------------
   Selector vocabulary

   Names for groups of the `deck.css` class contract, so a recipe below reads
   as a sentence rather than as a selector list. A selector that matches
   nothing is a no-op, which is what lets one registry cover eighteen layouts
   that are free to compose differently.
   ------------------------------------------------------------------------- */

const SEL = {
  /** The drifting archive rows. Opacity only — CSS owns their transform. */
  wallRow: ".deck-wall-row",
  /** Bounded tile fields and single framed photographs. */
  tile: ".deck-mosaic .deck-slot, .deck-mosaic > *, .deck-band .deck-slot",
  /** Any photographic surface that can take a slow push. */
  plate: ".deck-bleed, .deck-slot > img, .deck-frame > img, .deck-frame > .deck-img",
  /** Display type — the one enormous thing on a title or divider. */
  display: ".deck-display",
  mega: ".deck-mega",
  stat: ".deck-stat",
  statMinor: ".deck-stat-minor",
  title: ".deck-title",
  subtitle: ".deck-subtitle",
  kicker: ".deck-kicker, .deck-eyebrow",
  lead: ".deck-lead",
  body: ".deck-body, .deck-quote",
  bullet: ".deck-bullet",
  label: ".deck-label",
  sheetRow: ".deck-sheet-row",
  card: ".deck-card",
  chip: ".deck-logo-chip",
  portrait: ".deck-avatar, .deck-frame",
  incision: ".deck-incision",
  rule: ".deck-rule, .deck-rule-v",
  /** SVG geometry a stroke can be drawn along. */
  stroke: "svg circle, svg ellipse, svg path, svg rect, svg line",

  /**
   * The catch-all tail. Anything a recipe did not speak for by name still
   * arrives deliberately instead of popping. Deliberately excludes containers.
   */
  rest:
    ".deck-kicker, .deck-eyebrow, .deck-display, .deck-mega, .deck-title, " +
    ".deck-subtitle, .deck-stat, .deck-stat-minor, .deck-lead, .deck-body, " +
    ".deck-bullet, .deck-label, .deck-quote, .deck-sheet-row, .deck-card, " +
    ".deck-logo-chip, .deck-avatar, .deck-frame, .deck-incision, .deck-rule",
} as const;

/**
 * Never animated, whatever a selector says.
 *
 * `.deck-rail` is the running header: it is chrome, it is identical on every
 * slide, and animating it would make the one fixed point on the screen twitch
 * thirty-eight times. `.deck-plate img` and `.deck-wall-row` already carry CSS
 * ambient loops on `transform`, and a Web Animations transform would fight them
 * for the duration and then hand back with a jump.
 */
const NEVER = ".deck-rail, .deck-rail *, .deck-progress-track, .deck-progress-fill";

/** Elements whose `transform` belongs to a CSS ambient loop. Opacity only. */
const CSS_OWNS_TRANSFORM = ".deck-wall-row, .deck-plate img, .deck-plate .deck-img";

/* -------------------------------------------------------------------------
   Recipe shape
   ------------------------------------------------------------------------- */

/**
 * How a move drives its elements.
 *
 * - `animate` — a Web Animations keyframe pair.
 * - `count`   — a figure counts up to the number already written in the DOM.
 * - `draw`    — an SVG stroke draws along its own length.
 */
type MoveKind = "animate" | "count" | "draw";

export interface MotionMove {
  /** CSS selector, scoped inside the active slide. Matching nothing is fine. */
  select: string;
  kind?: MoveKind;
  /** Offset state. Omitted for `count` and `draw`, which compute their own. */
  from?: Keyframe;
  /** Finished state. Defaults to `REST`. */
  to?: Keyframe;
  duration?: number;
  easing?: string;
  /** Milliseconds before the first element of this move starts. */
  delay?: number;
  /** Milliseconds between successive elements. */
  stagger?: number;
  /** Extra random delay per element, 0…jitter. Turns a queue into a crowd. */
  jitter?: number;
  /** Randomise which element goes first. Only meaningful with `jitter`. */
  shuffle?: boolean;
  /** Cap on elements. Protects a venue laptop from a two-hundred-tile wall. */
  limit?: number;
  /** Start after everything before it has finished, rather than at `delay`. */
  chain?: boolean;
  /** Skip elements matching this, or inside something matching it. */
  except?: string;
}

export interface MotionRecipe {
  /** Short name, for the debugging attribute the runtime writes on the slide. */
  name: string;
  /** What the motion is saying. Read this before changing a number below. */
  meaning: string;
  moves: MotionMove[];
}

/* -------------------------------------------------------------------------
   The registry — one recipe per slide type
   ------------------------------------------------------------------------- */

export const MOTION_RECIPES: Record<SlideType, MotionRecipe> = {
  /* The archive assembles itself, then the deck says its own name. */
  title: {
    name: "archive-fill",
    meaning:
      "Twelve years of photographs land tile by tile in no particular order, " +
      "the way a wall of prints goes up; only once the wall exists does the " +
      "event's name arrive on top of it.",
    moves: [
      {
        select: SEL.tile,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.entry,
        jitter: 620,
        shuffle: true,
        limit: 28,
      },
      {
        select: SEL.wallRow,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.entry,
        stagger: 90,
        jitter: 220,
      },
      {
        select: `${SEL.display}, ${SEL.mega}`,
        from: grow(1.04),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 120,
        chain: true,
      },
      {
        select: `${SEL.kicker}, ${SEL.subtitle}, ${SEL.title}`,
        from: rise(),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 110,
      },
      {
        select: `${SEL.label}, ${SEL.chip}, ${SEL.rest}`,
        from: rise(14),
        duration: DECK_DUR.mod2,
        easing: DECK_EASE.prod,
        stagger: 70,
      },
    ],
  },

  /* The slowest thing in the deck. Ceremony, not transition. */
  karakia: {
    name: "spoken-line",
    meaning:
      "A karakia is spoken, not displayed. Lines arrive one at a time at " +
      "speaking pace — te reo first, then its translation, which only starts " +
      "once the last te reo line has settled. Nothing here may be hurried to " +
      "match the rest of the deck; the whole point is that this slide is slower.",
    moves: [
      {
        select: SEL.title,
        from: rise(18),
        duration: DECK_DUR.ceremony,
        easing: DECK_EASE.exp,
        delay: 260,
      },
      /* Te reo. 550ms apart is roughly the pause between spoken lines. */
      {
        select: SEL.subtitle,
        from: rise(16),
        duration: DECK_DUR.ceremony,
        easing: DECK_EASE.exp,
        delay: 320,
        stagger: 550,
        chain: true,
      },
      /* The English translation waits for the te reo to finish. */
      {
        select: `${SEL.body}, ${SEL.lead}`,
        from: rise(12),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        stagger: 550,
        chain: true,
      },
      {
        select: SEL.rest,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.entry,
        stagger: 200,
      },
    ],
  },

  /* The wall goes up; the chapter number is cut out of it. */
  section: {
    name: "wall-then-numeral",
    meaning:
      "A divider is a door. The archive wall builds first, then the knockout " +
      "numeral scales up out of it — the number is a window into the wall, so " +
      "the wall has to exist before the number can be cut from it.",
    moves: [
      {
        select: SEL.wallRow,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.entry,
        stagger: 120,
      },
      {
        select: SEL.tile,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        jitter: 380,
        shuffle: true,
        limit: 24,
      },
      {
        select: SEL.mega,
        from: grow(0.94),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        chain: true,
      },
      {
        select: SEL.incision,
        from: { opacity: 0, transform: "scaleY(1.012)" },
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 60,
      },
      {
        select: `${SEL.title}, ${SEL.subtitle}, ${SEL.kicker}, ${SEL.rest}`,
        from: rise(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 130,
      },
    ],
  },

  /* The number is the argument. It is arrived at, not asserted. */
  stats: {
    name: "figures-count",
    meaning:
      "A figure that fades in is a claim; a figure that counts up is a total " +
      "being reached. The hero figure counts first and alone, because a stats " +
      "slide with four equal numbers says nothing — the subordinate figures " +
      "follow it, staggered, as supporting evidence.",
    moves: [
      { select: SEL.kicker, from: rise(12), duration: DECK_DUR.mod2, easing: DECK_EASE.prod },
      {
        select: SEL.title,
        from: rise(),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 60,
      },
      {
        select: SEL.stat,
        kind: "count",
        duration: DECK_DUR.count,
        easing: DECK_EASE.prod,
        delay: 260,
      },
      {
        select: SEL.statMinor,
        kind: "count",
        duration: DECK_DUR.count,
        easing: DECK_EASE.prod,
        delay: 620,
        stagger: 220,
      },
      {
        select: `${SEL.label}, ${SEL.lead}, ${SEL.body}, ${SEL.rest}`,
        from: rise(12),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 500,
        stagger: 90,
      },
      {
        select: SEL.plate,
        from: PUSH,
        to: PUSHED,
        duration: DECK_DUR.drift,
        easing: DECK_EASE.linear,
      },
    ],
  },

  /* A run sheet is read down the page, in order, at reading speed. */
  agenda: {
    name: "read-down",
    meaning:
      "Rows arrive top to bottom about ninety milliseconds apart — the pace of " +
      "an eye going down a list. They drop in from above rather than lifting " +
      "from below, so the direction of the motion is the direction of reading.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 100,
      },
      {
        select: SEL.sheetRow,
        from: drop(10),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.prod,
        delay: 240,
        stagger: 90,
      },
      {
        select: SEL.rest,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.mod2,
        easing: DECK_EASE.prod,
        delay: 320,
        stagger: 60,
      },
    ],
  },

  /* A crowd is not a queue. */
  people: {
    name: "crowd-arrives",
    meaning:
      "Portraits come in on a short random stagger so a group of people " +
      "arrives as a group. A strict left-to-right sequence would rank them, " +
      "and nobody on this slide outranks anybody else.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 100,
      },
      {
        select: `${SEL.portrait}, ${SEL.card}`,
        from: grow(0.96),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 220,
        jitter: 460,
        shuffle: true,
        limit: 48,
      },
      {
        select: SEL.rest,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 380,
        jitter: 300,
      },
    ],
  },

  /* Time visibly running out. */
  break: {
    name: "clock-draws",
    meaning:
      "The countdown is the only thing on this slide that matters, so it is " +
      "the only thing that moves with any force: the ring draws along its own " +
      "circumference, then the clock face lands. Everything else is captioning.",
    moves: [
      {
        select: SEL.stroke,
        kind: "draw",
        duration: 1200,
        easing: DECK_EASE.exp,
        delay: 200,
        limit: 4,
      },
      {
        select: `${SEL.kicker}, ${SEL.title}`,
        from: rise(16),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 90,
      },
      {
        select: SEL.stat,
        from: land(1.08),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 220,
      },
      {
        select: `${SEL.subtitle}, ${SEL.lead}, ${SEL.label}, ${SEL.rest}`,
        from: rise(12),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 460,
        stagger: 100,
      },
    ],
  },

  /* A photograph that moves is a video. This one must not read as movement. */
  photo: {
    name: "slow-push",
    meaning:
      "A twelve-second push from 1.04 to 1.0 — slow enough that nobody in the " +
      "room can see it happening, but the frame is alive rather than dead " +
      "behind the speaker. The caption arrives at ordinary speed on top of it.",
    moves: [
      {
        select: SEL.plate,
        from: PUSH,
        to: PUSHED,
        duration: DECK_DUR.drift,
        easing: DECK_EASE.linear,
        except: CSS_OWNS_TRANSFORM,
      },
      {
        select: SEL.incision,
        from: { opacity: 0, transform: "scaleY(1.012)" },
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 200,
      },
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}, ${SEL.label}, ${SEL.rest}`,
        from: rise(20),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 320,
        stagger: 120,
      },
    ],
  },

  "photo-grid": {
    name: "plates-settle",
    meaning:
      "Each frame gets the same imperceptible twelve-second push as a single " +
      "photograph, but they start a beat apart, so the grid breathes instead " +
      "of pulsing as one sheet.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 100,
      },
      {
        select: `${SEL.tile}, ${SEL.portrait}`,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.entry,
        delay: 180,
        stagger: 130,
        limit: 12,
      },
      {
        select: SEL.plate,
        from: PUSH,
        to: PUSHED,
        duration: DECK_DUR.drift,
        easing: DECK_EASE.linear,
        stagger: 400,
        except: CSS_OWNS_TRANSFORM,
        limit: 12,
      },
      {
        select: SEL.rest,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 420,
        stagger: 80,
      },
    ],
  },

  /* Marks on a chip, laid onto the page in rows. */
  logos: {
    name: "chips-settle",
    meaning:
      "Sponsor marks settle in reading rows, sixty milliseconds apart — quick " +
      "enough that the row reads as one gesture, sequential enough that no " +
      "sponsor appears to have been added as an afterthought.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 100,
      },
      {
        select: SEL.chip,
        from: rise(12),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.prod,
        delay: 220,
        stagger: 60,
        limit: 40,
      },
      {
        select: `${SEL.label}, ${SEL.rest}`,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.mod2,
        easing: DECK_EASE.prod,
        delay: 200,
        stagger: 70,
      },
    ],
  },

  /* Gratitude, unhurried, and warmer than the sponsor wall. */
  thanks: {
    name: "chips-gather",
    meaning:
      "The same chip rows as a logos slide, but slower and gathered rather " +
      "than filed: this is the last thing the room sees, and it should not " +
      "feel like a credits roll being got through.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(20),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        stagger: 130,
      },
      {
        select: SEL.chip,
        from: grow(0.94),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 300,
        stagger: 80,
        jitter: 160,
        limit: 40,
      },
      {
        select: `${SEL.label}, ${SEL.body}, ${SEL.rest}`,
        from: rise(10),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 420,
        stagger: 55,
      },
    ],
  },

  /* Points made in sequence, the way they are spoken. */
  bullets: {
    name: "written-in",
    meaning:
      "Items enter from the inline start, the direction writing goes, one " +
      "after another at speaking pace. Distinct from an agenda on purpose: a " +
      "run sheet is scanned downwards, an argument is made along a line.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}`,
        from: rise(20),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 90,
      },
      {
        select: SEL.lead,
        from: rise(14),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 180,
      },
      {
        select: SEL.rule,
        // The origin travels in the keyframes rather than being written to the
        // element: a rule has to draw from its start edge, and nothing here is
        // allowed to leave an inline style behind.
        from: { transform: "scaleX(0)", transformOrigin: "left center" },
        to: { transform: "none", transformOrigin: "left center" },
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 240,
      },
      {
        select: SEL.bullet,
        from: write(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 300,
        stagger: 110,
      },
      {
        select: `${SEL.plate}, ${SEL.portrait}`,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.entry,
        delay: 200,
      },
      {
        select: SEL.rest,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.mod2,
        easing: DECK_EASE.prod,
        delay: 420,
        stagger: 70,
      },
    ],
  },

  /* Cards dealt onto a table. */
  themes: {
    name: "cards-deal",
    meaning:
      "Each theme is a card, so each one is dealt: a small scale-up on the " +
      "expressive curve, eighty milliseconds apart. Options being put on the " +
      "table for the room to pick from.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 100,
      },
      {
        select: SEL.card,
        from: { opacity: 0, transform: "translate3d(0, 16px, 0) scale(0.97)" },
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 240,
        stagger: 80,
      },
      {
        select: SEL.rest,
        from: rise(10),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 340,
        stagger: 60,
      },
    ],
  },

  /* A rubric being totalled. */
  criteria: {
    name: "weights-tally",
    meaning:
      "Judging criteria are weights, so the hairlines between them draw " +
      "across before the rows resolve — the sheet rules itself up, then the " +
      "entries are filled in.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 100,
      },
      {
        select: SEL.rule,
        from: { transform: "scaleX(0)", transformOrigin: "left center" },
        to: { transform: "none", transformOrigin: "left center" },
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 200,
        stagger: 70,
      },
      {
        select: `${SEL.card}, ${SEL.sheetRow}`,
        from: rise(14),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.prod,
        delay: 120,
        stagger: 140,
        chain: true,
      },
      {
        select: `${SEL.statMinor}, ${SEL.label}, ${SEL.body}, ${SEL.bullet}, ${SEL.rest}`,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 80,
      },
    ],
  },

  /* Money, landing. */
  prizes: {
    name: "amounts-land",
    meaning:
      "Prize amounts come down onto the page from slightly too large rather " +
      "than up from below — the only place in the deck where something lands " +
      "with weight instead of arriving politely. The names follow the money.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 100,
      },
      {
        select: `${SEL.stat}, ${SEL.statMinor}`,
        from: land(1.14),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 260,
        stagger: 160,
      },
      {
        select: `${SEL.card}, ${SEL.label}, ${SEL.subtitle}, ${SEL.body}, ${SEL.rest}`,
        from: rise(10),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 420,
        stagger: 90,
      },
    ],
  },

  /* The code is the point; the copy is the reason to scan it. */
  "qr-cta": {
    name: "code-resolves",
    meaning:
      "The reason comes first and the code arrives last, scaling up on the " +
      "expressive curve — the opposite order to how the slide is read, so the " +
      "room's attention is delivered to the thing it is meant to act on.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(20),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 110,
      },
      {
        select: SEL.bullet,
        from: write(16),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 260,
        stagger: 100,
      },
      {
        select: SEL.chip,
        from: grow(0.92),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 120,
        chain: true,
      },
      {
        select: `${SEL.label}, ${SEL.rest}`,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 80,
        stagger: 70,
      },
    ],
  },

  /* Ways to reach us, opening one at a time. */
  contact: {
    name: "channels-open",
    meaning:
      "Each channel enters from the inline start as its own line, then the " +
      "codes resolve together once the list has finished — you decide how to " +
      "get in touch before you point a phone at anything.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 100,
      },
      {
        select: `${SEL.body}, ${SEL.bullet}, ${SEL.subtitle}`,
        from: write(14),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        delay: 240,
        stagger: 70,
      },
      {
        select: SEL.chip,
        from: grow(0.94),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 60,
        stagger: 90,
        chain: true,
      },
      {
        select: `${SEL.label}, ${SEL.rest}`,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.mod2,
        easing: DECK_EASE.prod,
        stagger: 60,
      },
    ],
  },

  /* What is coming next, coming towards you. */
  upcoming: {
    name: "dates-advance",
    meaning:
      "Future events enter from the inline end and move towards the reader — " +
      "the only slide in the deck whose motion runs against the page, because " +
      "it is the only one about something that has not happened yet.",
    moves: [
      {
        select: `${SEL.kicker}, ${SEL.title}, ${SEL.lead}`,
        from: rise(18),
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 100,
      },
      {
        select: `${SEL.card}, ${SEL.portrait}, ${SEL.sheetRow}`,
        from: approach(28),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 240,
        stagger: 130,
      },
      {
        select: SEL.chip,
        from: grow(0.94),
        duration: DECK_DUR.slow2,
        easing: DECK_EASE.exp,
        delay: 100,
        chain: true,
      },
      {
        select: `${SEL.subtitle}, ${SEL.body}, ${SEL.label}, ${SEL.rest}`,
        from: FADE,
        to: LIT,
        duration: DECK_DUR.slow1,
        easing: DECK_EASE.entry,
        stagger: 70,
      },
    ],
  },
};

/* -------------------------------------------------------------------------
   Runtime
   ------------------------------------------------------------------------- */

/**
 * Marks a stage as having a live JavaScript entrance runtime.
 *
 * `deck.css` carries its own entrance classes — `.deck-rise`, `.deck-reveal`,
 * `.deck-draw`, `.deck-d1…12` — which the layouts use and which are the correct
 * behaviour when this module never runs. They cannot both drive the same
 * element: a CSS entrance with a 1.46s delay and `fill: both` holds opacity 0
 * through its delay, so it would blank an element the instant a shorter Web
 * Animations entrance finished, and the room would see a flash.
 *
 * So the runtime claims the stage and `deck.css` stands its own entrances down
 * against this attribute. Progressive enhancement in the right direction: the
 * attribute only ever appears if JavaScript ran, so with no JavaScript, a
 * thrown error, or the print sheet, the CSS entrances are still there.
 */
export const ENTRANCES_ATTR = "entrances";
export const ENTRANCES_JS = "js";

export interface MotionHandle {
  /**
   * Stops everything and leaves every element in its finished, visible state.
   * Safe to call twice, and safe to call before anything has started.
   */
  stop: () => void;
}

const NOOP: MotionHandle = { stop: () => {} };

/** Grace period after the last animation should have ended. */
const SWEEP_MARGIN = 500;

/**
 * Plays one slide's recipe against the live DOM inside that slide.
 *
 * @param slide The `.deck-slide` element that has just become active.
 * @param type The slide's discriminant, which selects the recipe.
 * @returns A handle whose `stop()` reveals everything immediately.
 */
export function playSlideMotion(
  slide: HTMLElement,
  type: SlideType,
): MotionHandle {
  const recipe = MOTION_RECIPES[type];
  if (!recipe) return NOOP;

  // No Web Animations API means no motion — and, because nothing was ever
  // hidden, a fully composed slide. That is the correct outcome, not a bug.
  if (typeof slide.animate !== "function") return NOOP;

  const animations: Animation[] = [];
  const frames: number[] = [];
  /** Original text of every counter, so a stop() restores it exactly. */
  const texts = new Map<Element, string>();
  let sweep = 0;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(sweep);
    frames.forEach((id) => cancelAnimationFrame(id));
    frames.length = 0;
    // `cancel()` removes the effect. With `fill: "backwards"` there is nothing
    // to remove after the animation has finished anyway, so this is idempotent.
    animations.forEach((animation) => {
      try {
        animation.cancel();
      } catch {
        /* An animation whose element left the DOM. Nothing to reveal. */
      }
    });
    animations.length = 0;
    texts.forEach((text, element) => {
      element.textContent = text;
    });
    texts.clear();
    delete slide.dataset.motionRecipe;
  };

  try {
    slide.dataset.motionRecipe = recipe.name;

    /** Elements already spoken for, so no later move re-animates them. */
    const claimed: Element[] = [];
    /** Latest finishing time so far, for `chain`. */
    let chainEnd = 0;
    /** Latest finishing time of anything, for the safety sweep. */
    let latest = 0;

    for (const move of recipe.moves) {
      const targets = resolve(slide, move, claimed);
      if (targets.length === 0) continue;

      const base = (move.chain ? chainEnd : 0) + (move.delay ?? 0);
      const duration = move.duration ?? DECK_DUR.slow1;
      const easing = move.easing ?? DECK_EASE.entry;
      let moveEnd = base;

      targets.forEach((element, position) => {
        const delay =
          base +
          position * (move.stagger ?? 0) +
          (move.jitter ? Math.random() * move.jitter : 0);

        const end = delay + duration;
        if (end > moveEnd) moveEnd = end;

        claimed.push(element);

        if (move.kind === "count") {
          countUp(element, { duration, delay, easing, frames, texts });
          return;
        }

        const keyframes =
          move.kind === "draw"
            ? strokeKeyframes(element)
            : [move.from ?? FADE, move.to ?? REST];
        if (!keyframes) return;

        const animation = element.animate(keyframes, {
          duration,
          delay,
          easing,
          // NEVER "forwards" or "both". Backwards fill holds the offset state
          // only through the delay and the active phase; the moment the
          // animation ends the element is back to its natural, visible self.
          fill: "backwards",
        });
        animations.push(animation);
      });

      chainEnd = moveEnd;
      if (moveEnd > latest) latest = moveEnd;
    }

    // Belt and braces. Even if a keyframe is malformed or an animation somehow
    // never finishes, everything is released shortly after it should have been.
    sweep = window.setTimeout(stop, latest + SWEEP_MARGIN);
  } catch (error) {
    // A recipe must never be able to take a slide down. Reveal and carry on.
    console.error("[deck] motion recipe failed; revealing the slide", error);
    stop();
    return NOOP;
  }

  return { stop };
}

/**
 * Turns one move's selector into the list of elements it actually drives.
 *
 * Applies the leaves-not-containers rule (anything already claimed, or inside
 * something already claimed, is skipped), the never-animate list, the move's
 * own exclusions, shuffling and the element cap — in that order, so a `limit`
 * always counts elements that will really be animated.
 */
function resolve(
  slide: HTMLElement,
  move: MotionMove,
  claimed: Element[],
): Element[] {
  let found: Element[];
  try {
    found = Array.from(slide.querySelectorAll(move.select));
  } catch {
    return [];
  }

  const usable = found.filter((element) => {
    if (element.matches(NEVER) || element.closest(NEVER)) return false;
    if (move.except && (element.matches(move.except) || element.closest(move.except))) {
      return false;
    }
    // Both directions: never animate a child of something already moving, and
    // never animate a parent of it either — one of the two would be double
    // -transformed and the composition would drift.
    return !claimed.some(
      (taken) => taken === element || taken.contains(element) || element.contains(taken),
    );
  });

  const ordered = move.shuffle ? shuffle(usable) : usable;
  return move.limit ? ordered.slice(0, move.limit) : ordered;
}

/** Fisher–Yates on a copy. Only used where the order genuinely must not rank. */
function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/* ------------------------------------------------------------------ drawing */

/**
 * Keyframes that draw an SVG stroke along its own length.
 *
 * The element's own dash values are read from the cascade and used as the end
 * state rather than being overwritten, so a countdown ring that is *already*
 * using `stroke-dasharray` to show remaining time keeps showing it the instant
 * the entrance finishes.
 */
function strokeKeyframes(element: Element): Keyframe[] | null {
  const geometry = element as SVGGeometryElement;
  if (typeof geometry.getTotalLength !== "function") return null;

  let length = 0;
  try {
    length = geometry.getTotalLength();
  } catch {
    return null;
  }
  if (!Number.isFinite(length) || length <= 0) return null;

  const computed = getComputedStyle(element);
  const array =
    computed.strokeDasharray && computed.strokeDasharray !== "none"
      ? computed.strokeDasharray
      : `${length}px`;
  const offset =
    computed.strokeDashoffset && computed.strokeDashoffset !== "none"
      ? computed.strokeDashoffset
      : "0px";

  return [
    { strokeDasharray: `${length}px`, strokeDashoffset: `${length}px` },
    { strokeDasharray: array, strokeDashoffset: offset },
  ];
}

/* ------------------------------------------------------------------ counting */

/** First run of digits in a string, with optional thousands separators. */
const FIGURE = /-?\d[\d,]*(?:\.\d+)?/;

interface CountOptions {
  duration: number;
  delay: number;
  easing: string;
  frames: number[];
  texts: Map<Element, string>;
}

/**
 * Counts an already-rendered figure up to itself.
 *
 * The DOM is the source of truth: `"3000+"` counts to three thousand and keeps
 * its plus, `"$5,000"` keeps its currency mark and its comma. A value with no
 * number in it — `"Ongoing"` — is faded in instead, because counting nothing up
 * would be a blank space where a word should be.
 *
 * The exact original string is restored on the final frame rather than being
 * reformatted, so no amount of separator guesswork can change what the room
 * ends up reading.
 */
function countUp(element: Element, options: CountOptions): void {
  const original = element.textContent ?? "";
  const match = FIGURE.exec(original);

  if (!match) {
    if (typeof (element as HTMLElement).animate === "function") {
      (element as HTMLElement).animate([rise(14), REST], {
        duration: options.duration / 2,
        delay: options.delay,
        easing: options.easing,
        fill: "backwards",
      });
    }
    return;
  }

  const raw = match[0];
  const target = Number.parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(target)) return;

  const grouped = raw.includes(",");
  const decimals = raw.includes(".") ? raw.split(".")[1]!.length : 0;
  const prefix = original.slice(0, match.index);
  const suffix = original.slice(match.index + raw.length);
  const ease = bezier(options.easing);

  options.texts.set(element, original);

  const start = performance.now() + options.delay;

  const tick = (now: number) => {
    if (now < start) {
      options.frames.push(requestAnimationFrame(tick));
      return;
    }
    const progress = Math.min(1, (now - start) / options.duration);

    if (progress >= 1) {
      // Restore the authored string byte for byte. This is the only frame the
      // audience will still be looking at in thirty seconds.
      element.textContent = original;
      options.texts.delete(element);
      return;
    }

    const value = target * ease(progress);
    const shown = grouped
      ? value.toLocaleString("en-NZ", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : value.toFixed(decimals);
    element.textContent = `${prefix}${shown}${suffix}`;
    options.frames.push(requestAnimationFrame(tick));
  };

  options.frames.push(requestAnimationFrame(tick));
}

/* ------------------------------------------------------------------- easing */

/**
 * Compiles a `cubic-bezier(...)` string into a progress function.
 *
 * Needed because a count-up is text, not a style, so it cannot ride a Web
 * Animations timing function — and a linear count next to eased motion looks
 * mechanical in a way that is immediately visible on a projector. Anything that
 * is not a cubic-bezier falls back to linear.
 */
function bezier(easing: string): (t: number) => number {
  const parsed = /cubic-bezier\(([^)]+)\)/.exec(easing);
  if (!parsed) return (t) => t;

  const parts = parsed[1]!.split(",").map((n) => Number.parseFloat(n.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return (t) => t;
  }
  const [x1, y1, x2, y2] = parts as [number, number, number, number];

  const curve = (a: number, b: number, t: number) => {
    const u = 1 - t;
    return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
  };
  const slope = (a: number, b: number, t: number) => {
    const u = 1 - t;
    return 3 * u * u * a + 6 * u * t * (b - a) + 3 * t * t * (1 - b);
  };

  return (x: number) => {
    // Newton–Raphson, then give up and return the guess. Eight iterations is
    // far more than a monotonic curve on [0,1] needs, and this runs once per
    // frame per figure — at most five figures on the busiest stats slide.
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const error = curve(x1, x2, t) - x;
      if (Math.abs(error) < 1e-5) break;
      const d = slope(x1, x2, t);
      if (Math.abs(d) < 1e-6) break;
      t -= error / d;
    }
    return curve(y1, y2, Math.min(1, Math.max(0, t)));
  };
}
