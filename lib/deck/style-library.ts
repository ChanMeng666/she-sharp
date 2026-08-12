/**
 * The axes a deck's look is made of, and the check that two decks differ on them.
 *
 * WHY THIS EXISTS. Every rule in `lint.ts` looks at one deck. That is the right
 * scope for copy and rhythm — a title is too long or it is not — but it is
 * structurally blind to the defect that produced this file: on 12 August 2026
 * the repository held two decks that each passed every check and still read as
 * the same deck. The hackathon declared no skin at all; Les Mills declared one
 * and used it on ten of its twenty-four slides. The other fourteen — over half
 * the deck — were the identical drifting archive wall, because the
 * organisational sequence is stamped `surface: "house"` and short-circuits to
 * the house skin before an event skin is ever consulted.
 *
 * Nothing could have caught that, because nothing compared two decks.
 *
 * THE METRIC IS SPLIT IN TWO, AND THAT IS THE WHOLE POINT. A single
 * whole-deck distance would have scored those two decks 3 out of 5 and passed
 * them: they genuinely differ on surface, geometry and tempo — on the slides the
 * event owns. Averaging drowns the house slides, which are the majority of a
 * short deck and were 100% identical. So `houseDistance` scores only what an
 * organisational slide can vary (the ground behind it and the accent hue) and
 * fails at zero, and `eventDistance` scores the rest.
 *
 * WHAT IS NOT HERE. No taste, no ranking, no "which deck is better". These are
 * five enumerable axes with small ranges; the check says two decks are not the
 * same, never that either is good. Judging that is a person's job at Step 7 of
 * the skill, in front of a rendered stage.
 *
 * IMPORTS NOTHING FROM `registry.ts`, deliberately. The ledger script, the
 * scaffold and the test all want axis names; pulling the registry in here would
 * mean every one of them loads every deck in the repository — and a deck file
 * reads the event JSON at module load.
 */

import type {
  ArchiveWeaveKey,
  Deck,
  DeckSkin,
  GeometryFamily,
} from "./types";

export type { GeometryFamily };

/** One line per axis, for the ledger an author reads before choosing. */
export const STYLE_AXES = {
  houseGround: "what stands behind She Sharp's own slides",
  surface: "what fills the frame behind the event's own statement slides",
  geometry: "how edges are made — cut, glass, ruled or soft",
  tempo: "how fast the entrances play",
  hue: "where the accent sits on the colour wheel",
} as const;

/** How fast a skin's entrances play, banded so 1.24 and 1.25 are not "different". */
export type TempoBand = "measured" | "house" | "slow";

export function tempoBand(tempo: number | undefined): TempoBand {
  const t = tempo ?? 1;
  if (t < 0.9) return "measured";
  if (t > 1.1) return "slow";
  return "house";
}

/**
 * The default geometry for a skin that declares none.
 *
 * The archive is a wall of hard-edged tiles cut by opaque incisions; a plate is
 * a continuous field, and every plate skin written so far has reached for glass.
 * A skin that does something else says so.
 */
export function geometryOf(skin: DeckSkin | undefined): GeometryFamily {
  if (!skin) return "cut";
  if (skin.geometry) return skin.geometry;
  return skin.surface.kind === "plate" ? "glass" : "cut";
}

/**
 * The accent's hue, as one of six 60° sectors.
 *
 * Sectors rather than degrees because the question is "do these two decks read
 * as the same colour across a room", and two magentas 14° apart do. That 14° is
 * not hypothetical: it is the exact distance between the hackathon's `#c846ab`
 * and Les Mills' `#ca53bb`.
 */
export function hueSector(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = Number.parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;

  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return Math.floor(h / 60) % 6;
}

export interface DeckFingerprint {
  slug: string;
  /**
   * What actually stands behind She Sharp's own slides — `archive:<weave>` when
   * the deck uses the photo wall, otherwise the surface kind that replaced it.
   *
   * A single string rather than a weave, because a deck that abandons the
   * archive has no weave: `Deck.archive` still holds a value, the type demands
   * one, and nothing renders it. Comparing weaves there would report two decks
   * as different on an axis neither of them uses.
   */
  houseGround: string;
  surface: "archive" | "plate" | "field";
  geometry: GeometryFamily;
  tempo: TempoBand;
  hue: number;
}

export function deckFingerprint(deck: Deck): DeckFingerprint {
  const house = deck.skin?.houseSurface;
  return {
    slug: deck.slug,
    houseGround:
      !house || house.kind === "archive"
        ? `archive:${house?.weave ?? deck.archive}`
        : house.kind,
    surface: deck.skin?.surface.kind ?? "archive",
    geometry: geometryOf(deck.skin),
    tempo: tempoBand(deck.skin?.tempo),
    hue: hueSector(deck.theme.accent.onDark),
  };
}

/**
 * What an organisational slide can vary between two decks: what stands behind
 * it, and the accent tinting its headings.
 *
 * Deliberately short, and it is the axis that matters most — the organisational
 * sequence is over half of a short deck. Two decks sharing a ground here look
 * like one deck whatever they do elsewhere, which is not a theory: it is what
 * happened twice, first with the same wall in two colours and then with the
 * same wall in two arrangements.
 */
export function houseDistance(a: DeckFingerprint, b: DeckFingerprint): number {
  return (a.houseGround !== b.houseGround ? 1 : 0) + (a.hue !== b.hue ? 1 : 0);
}

/** What the event's own chapters can vary. */
export function eventDistance(a: DeckFingerprint, b: DeckFingerprint): number {
  return (
    (a.surface !== b.surface ? 1 : 0) +
    (a.geometry !== b.geometry ? 1 : 0) +
    (a.tempo !== b.tempo ? 1 : 0) +
    (a.hue !== b.hue ? 1 : 0)
  );
}

/**
 * Thresholds.
 *
 * `house: 1` — two decks may not present She Sharp's own slides identically.
 * One differing axis is enough; the weave alone changes the silhouette of every
 * organisational slide, which is what a room actually notices.
 *
 * `event: 2` — and not 3, which was tempting. The reachable space is small (3
 * weaves × 2 surfaces × 4 geometries × 3 tempos × 6 hues, most combinations
 * meaningless), and `references/skins.md` is right that a deck with no artwork
 * should wear the house skin rather than a half-built bespoke one. Demanding 3
 * would push authors into inventing a concept they do not have, which is a
 * worse deck than an honest house-skinned one.
 */
export const STYLE_DISTANCE_FLOOR = { house: 1, event: 2 } as const;

export interface DeckSetIssue {
  rule: "deck-set-house-twins" | "deck-set-too-close";
  severity: "error";
  slugs: [string, string];
  message: string;
}

/**
 * Every pair of decks that is too close to tell apart.
 *
 * Pure over fingerprints so the ledger, the test and the scaffold share one
 * definition rather than three that drift.
 */
export function lintDeckSet(decks: readonly Deck[]): DeckSetIssue[] {
  const prints = decks.map(deckFingerprint);
  const issues: DeckSetIssue[] = [];

  for (let i = 0; i < prints.length; i += 1) {
    for (let j = i + 1; j < prints.length; j += 1) {
      const a = prints[i];
      const b = prints[j];

      if (houseDistance(a, b) < STYLE_DISTANCE_FLOOR.house) {
        issues.push({
          rule: "deck-set-house-twins",
          severity: "error",
          slugs: [a.slug, b.slug],
          message:
            `"${a.slug}" and "${b.slug}" present She Sharp's own slides identically — ` +
            `both standing on "${a.houseGround}" and both accent hue sector ${a.hue}. ` +
            `Over half of a short deck is the organisational sequence, so this is ` +
            `what makes two decks look like one. Give one of them a different ` +
            `\`archive:\` weave.`,
        });
      }

      if (eventDistance(a, b) < STYLE_DISTANCE_FLOOR.event) {
        issues.push({
          rule: "deck-set-too-close",
          severity: "error",
          slugs: [a.slug, b.slug],
          message:
            `"${a.slug}" and "${b.slug}" differ on fewer than ` +
            `${STYLE_DISTANCE_FLOOR.event} of surface, geometry, tempo and accent hue. ` +
            `The event's own chapters will read as the same deck.`,
        });
      }
    }
  }

  return issues;
}

/** Weaves nothing has claimed yet — the scaffold's first choice, and the ledger's. */
export function unusedWeaves(
  decks: readonly Deck[],
  all: readonly ArchiveWeaveKey[],
): ArchiveWeaveKey[] {
  const taken = new Set(decks.map((deck) => deck.archive));
  return all.filter((weave) => !taken.has(weave));
}
