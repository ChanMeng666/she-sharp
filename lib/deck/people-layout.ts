/**
 * Geometry for the people grid: how many columns, and how big a portrait.
 *
 * Split out of `components/deck/slides/people-slide.tsx` so the arithmetic can
 * be asserted in `deck.test.ts` — the failure this file exists to prevent is
 * invisible in the markup and only appears on one projector shape.
 *
 * THE RULE THIS FILE ENFORCES: a track is at least as wide as the widest single
 * WORD it has to carry. The column count used to be derived from the portrait
 * width alone, which is a reasonable-looking mistake — the circle is the thing
 * you see, so it feels like the thing that sets the pitch. It is not. The widest
 * object in a tile is the name under it. On a 4:3 projector fifteen 130px
 * portraits fitted eight across and handed each caption a 136px track, so
 * "McCauley" (140px), "Kaniyawala" (159px) and "Tharaneetharan" (228px) were
 * broken inside the word — `overflow-wrap: anywhere` on the caption did exactly
 * what it was asked to. Breaking someone's name across a line is the rudest
 * thing this deck can do to the people it is thanking, and it happened in front
 * of the room every time the venue had a 4:3 screen.
 *
 * The type is measured, not guessed. The old estimate used a mean advance width
 * per character, which is the right tool for "how tall will this get" and the
 * wrong one for "will this fit" — a mean is wrong by a fifth on any particular
 * word, and the column count turns on about one percent. The table below is the
 * real thing, and the two questions are answered separately: `linesFor()` for
 * height, `widestWord()` for fit.
 */

import type { PersonItem } from "@/lib/deck/types";

export type PeopleDensity = "sm" | "md" | "lg";

/**
 * Narrowest tile a person is allowed, before the caption has its say.
 *
 * A floor rather than the answer: it stops a slide of one-syllable names from
 * spreading fifteen portraits across a 21:9 wall.
 */
const TILE_WIDTH: Record<PeopleDensity, number> = { sm: 130, md: 196, lg: 262 };

/** Column gap per density; `sm` runs tighter because it carries names only. */
export const TILE_GAP: Record<PeopleDensity, number> = { sm: 20, md: 32, lg: 32 };

/** Portrait cap per density, before the height budget has its say. */
const PORTRAIT: Record<PeopleDensity, number> = { sm: 148, md: 156, lg: 248 };

/** Vertical space between rows of tiles. */
export const ROW_GAP = 32;

/** `--deck-gap-sm`, between a portrait and its caption. */
const PORTRAIT_GAP = 20;

/** Gap between the caption lines, matching the `<div>` in `PersonTile`. */
export const CAPTION_GAP = 6;

/** `--deck-gap-xs`, between the kicker, the title and the lead. */
const HEADER_GAP = 12;

/** The kicker line with its rule, which does not change size between scales. */
const KICKER_HEIGHT = 36;

/** The running header, which every stage carries. */
const RAIL_HEIGHT = 88;

/** 1080 design height less the rail and two 72px `--deck-pad-y` insets. */
const SAFE_HEIGHT = 848;

/** `--deck-pad-y` on a portrait stage, where there is no overscan to fear. */
const PHONE_PAD_Y = 40;

/**
 * Below this a headshot stops being a face and becomes a coloured dot.
 *
 * If a roster is so large that the height budget wants to go under it, the
 * portrait stops here and `useFitContent()` scales the slide as a last resort —
 * which is the signal to the author that the slide holds too many people, not
 * something this file should quietly absorb.
 */
const MIN_PORTRAIT = 64;

/* --------------------------------------------------------------------------
   Type metrics
   -------------------------------------------------------------------------- */

/**
 * Advance widths for Instrument Sans 600, in thousandths of an em.
 *
 * Measured with `canvas.measureText` inside a running deck, so these are the
 * webfont the projector actually gets rather than a metric-compatible stand-in.
 */
const ADVANCE = parseAdvances(
  "A=733 B=645 C=747 D=755 E=630 F=594 G=764 H=725 I=254 J=427 K=712 L=589 " +
    "M=898 N=725 O=794 P=667 Q=806 R=664 S=637 T=664 U=704 V=733 W=1087 X=707 " +
    "Y=700 Z=631 a=558 b=621 c=552 d=621 e=571 f=370 g=621 h=612 i=260 j=260 " +
    "k=558 l=260 m=941 n=612 o=597 p=621 q=621 r=390 s=494 t=406 u=604 v=536 " +
    "w=800 x=587 y=536 z=513 0=677 1=387 2=557 3=579 4=615 5=581 6=615 7=561 " +
    "8=598 9=619 -=493 '=256 &=768 .=275 ,=275 (=439 )=439 /=444 :=275 +=700",
);

/**
 * What an unmeasured character is worth.
 *
 * Deliberately generous. Em and en dashes turned up in an organisation line and
 * were the only glyphs the table under-called; a character nobody thought about
 * should cost a column rather than break a word.
 */
const UNKNOWN_ADVANCE = 1;

/**
 * How much wider Bricolage Grotesque runs than the table at the same size.
 *
 * Only the `lg` name is set in the display face, so carrying a second table for
 * it would be sixty numbers to serve four people on a judging panel. Measured
 * across every `lg` name in both decks the worst case was 4.1% — "Professor" —
 * and the rounding up to 6% costs nothing at `lg`, where four tiles share the
 * whole content column.
 */
const DISPLAY_FACTOR = 1.06;

/**
 * How far the table may be out, as a fraction of the width it reports.
 *
 * Summing advances cannot see kerning, so a word measures a shade wide — across
 * every name, role and organisation in both shipped decks the table ran up to
 * 1% over and never more than 0.25% under. A fit therefore allows 1% back, and
 * the 0.25% is the margin that keeps this honest.
 *
 * The band is not cosmetic. "Tharaneetharan" is 228px of rendered type at the
 * 4:3 name size and the fifth column of that stage is 230px wide, so the whole
 * arrangement turns on a pixel and a half: measure the word 1% pessimistically
 * and the slide drops to four columns, four rows, and portraits too small to be
 * faces. Anything that changes the caption font has to be re-measured — see the
 * table above — rather than absorbed by widening this.
 */
const KERNING_ALLOWANCE = 0.01;

interface TextStyle {
  /** Font size in design px at this stage scale. */
  size: number;
  /** Line height as a multiple of the size. */
  height: number;
  /** Letter spacing in em. */
  track?: number;
  /** Set in caps, so it is the uppercase form that has to fit. */
  caps?: boolean;
  /** Set in Bricolage Grotesque rather than Instrument Sans. */
  display?: boolean;
}

function parseAdvances(table: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const pair of table.split(" ")) {
    const at = pair.lastIndexOf("=");
    map.set(pair.slice(0, at), Number(pair.slice(at + 1)) / 1000);
  }
  return map;
}

/** Rendered width of one unbreakable run of characters, in design px. */
export function wordWidth(word: string, style: TextStyle): number {
  const text = style.caps ? word.toUpperCase() : word;
  let em = 0;
  for (const character of text) {
    em += ADVANCE.get(character) ?? UNKNOWN_ADVANCE;
    em += style.track ?? 0;
  }
  return em * style.size * (style.display ? DISPLAY_FACTOR : 1);
}

/** Rendered width of a whole string set on one line, in design px. */
function textWidth(text: string, style: TextStyle): number {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .reduce(
      (total, word, index) =>
        total + wordWidth(word, style) + (index === 0 ? 0 : 0.25 * style.size),
      0,
    );
}

/** The widest word in a string — the one that decides whether it can break. */
function widestWord(text: string, style: TextStyle): number {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .reduce((widest, word) => Math.max(widest, wordWidth(word, style)), 0);
}

/** Lines a string takes in a column of `width`, never fewer than one. */
function linesFor(text: string, style: TextStyle, width: number): number {
  return Math.max(1, Math.ceil(textWidth(text, style) / width));
}

/* --------------------------------------------------------------------------
   Stage scales
   -------------------------------------------------------------------------- */

interface StageScale {
  /** Width of the content column, in design px. */
  content: number;
  /** `--deck-gap-lg`, between the title block and the grid. */
  gapLg: number;
  /** `--dt-title`, and `--dt-lead` with its line height. */
  title: number;
  lead: number;
  /** Caption sizes: `--dt-body`, `--dt-subtitle` and `--dt-label`. */
  name: number;
  nameLg: number;
  role: number;
  /**
   * `--dt-label`, plus the tracking `.deck-person-org` has at this scale.
   *
   * A skin may open the tracking further, and one does — `fibre` sets 0.26em
   * on every label. It is allowed to do that at the wide scale, where the
   * number only decides how many lines an organisation wraps to, and it is
   * excluded from the narrow and portrait scales, where the number decides
   * whether a word fits at all. See the exemption in `deck-skins.css`.
   */
  org: number;
  orgTrack: number;
}

/**
 * The three type scales a deck is projected at, and the fit each one decides.
 *
 * Every measurement below is a `--dt-*` token from `deck.css`, read at the
 * stage width where its container query applies. They are here rather than in
 * CSS because the column count has to be known during render, on the server,
 * and a scaled stage gives JavaScript no honest way to ask.
 *
 * WHICH SCALE IS TIGHTEST DEPENDS ON THE AXIS, and getting that backwards is
 * how this file would go wrong again. HORIZONTALLY the narrow projector binds:
 * it has 75% of the width of a 16:9 stage carrying 94% of the type, so a column
 * count that fits at 4:3 fits everywhere, which is why `columns` is derived
 * there alone and the same rectangle is then projected at every width.
 * VERTICALLY it is the opposite — the wide stages have the same 848px of safe
 * area but a bigger title, a looser line and a wider gap under the header, so
 * they run out of room first. The portrait cap is therefore the smaller of the
 * two landscape budgets.
 */
const SCALES: Record<"narrow" | "wide" | "phone", StageScale> = {
  /** 4:3 and 5:4 projectors — `@container deck (max-width: 1560px)`. */
  narrow: {
    content: 1230,
    gapLg: 40,
    title: 62,
    lead: 31,
    name: 30,
    nameLg: 38,
    role: 30,
    org: 28,
    // The narrow block gives up `.deck-person-org`'s tracking; see deck.css.
    orgTrack: 0,
  },
  /**
   * 16:9 through 21:9. The tightest combination the wide band produces rather
   * than any one stage: 16:9's content column, which is the narrower of the
   * two and so wraps captions to more lines, with 21:9's display type, which
   * is the taller of the two and so leaves the grid less room.
   */
  wide: {
    content: 1640,
    gapLg: 52,
    title: 84,
    lead: 34,
    name: 32,
    nameLg: 44,
    role: 32,
    org: 28,
    orgTrack: 0.08,
  },
  /** A phone held upright — `@container deck (max-width: 1000px)`. */
  phone: {
    content: 804,
    gapLg: 36,
    title: 58,
    lead: 34,
    name: 34,
    nameLg: 38,
    role: 34,
    org: 30,
    orgTrack: 0,
  },
};

function nameStyle(density: PeopleDensity, scale: StageScale): TextStyle {
  return density === "lg"
    ? { size: scale.nameLg, height: 1.16, display: true }
    : { size: scale.name, height: 1.4 };
}

function roleStyle(scale: StageScale): TextStyle {
  return { size: scale.role, height: 1.4 };
}

function orgStyle(scale: StageScale): TextStyle {
  return { size: scale.org, height: 1.2, caps: true, track: scale.orgTrack };
}

/** Lines the caption shows for this person at this density. */
function captionLines(
  person: PersonItem,
  density: PeopleDensity,
  scale: StageScale,
  width: number,
): { height: number; blocks: number } {
  let height = linesFor(person.name, nameStyle(density, scale), width) *
    nameStyle(density, scale).size *
    nameStyle(density, scale).height;
  let blocks = 1;

  if (density === "lg" && person.role) {
    const style = roleStyle(scale);
    height += linesFor(person.role, style, width) * style.size * style.height;
    blocks += 1;
  }

  if (density !== "sm" && person.org) {
    const style = orgStyle(scale);
    height += linesFor(person.org, style, width) * style.size * style.height;
    blocks += 1;
  }

  return { height, blocks };
}

/**
 * Height of each ROW's caption band, in design px at this scale.
 *
 * Per row, not per slide. A grid row is as tall as its own tallest tile and no
 * taller — the rows do not equalise — so a judging panel whose fourth member
 * has a three-line title costs that row a line and leaves the others alone.
 * Taking the maximum across the whole slide instead is safe but wrong by up to
 * a line per row, and every pixel it over-books comes off the portraits.
 */
function rowCaptionHeights(
  people: PersonItem[],
  density: PeopleDensity,
  scale: StageScale,
  width: number,
  columns: number,
): number[] {
  const heights: number[] = [];
  for (let start = 0; start < people.length; start += columns) {
    heights.push(
      Math.max(
        ...people.slice(start, start + columns).map((person) => {
          const { height, blocks } = captionLines(person, density, scale, width);
          return height + (blocks - 1) * CAPTION_GAP;
        }),
      ),
    );
  }
  return heights;
}

/**
 * The widest unbreakable word any caption on this slide has to hold.
 *
 * The role and the organisation are in here as well as the name. A tile is one
 * column, so anything that cannot fit it breaks the same way — the Les Mills
 * panel shipped four portraits captioned "LES MILLS INTERNATIONA / L" on a 4:3
 * screen. What keeps that from costing a column is the tracking: `.deck-label`
 * is caps at 0.08em, which is a tenth of the line's width spent on air, and the
 * narrow scale gives it back rather than a column.
 */
function widestWordFor(
  people: PersonItem[],
  density: PeopleDensity,
  scale: StageScale,
): number {
  let widest = 0;
  for (const person of people) {
    widest = Math.max(widest, widestWord(person.name, nameStyle(density, scale)));
    if (density === "lg" && person.role) {
      widest = Math.max(widest, widestWord(person.role, roleStyle(scale)));
    }
    if (density !== "sm" && person.org) {
      widest = Math.max(widest, widestWord(person.org, orgStyle(scale)));
    }
  }
  return widest;
}

/** Height of the title block plus the gap below it, in design px. */
function headerHeight(
  scale: StageScale,
  title: string,
  lead: string | undefined,
): number {
  const titleStyle: TextStyle = { size: scale.title, height: 1, display: true };
  const leadStyle: TextStyle = { size: scale.lead, height: 1.44 };
  // `.deck-lead` is clamped to 34ch, and a `ch` is the advance of "0".
  const leadWidth = Math.min(scale.content, 34 * 0.677 * scale.lead);

  let height =
    KICKER_HEIGHT +
    HEADER_GAP +
    linesFor(title, titleStyle, scale.content) * scale.title;

  if (lead) {
    height +=
      HEADER_GAP + linesFor(lead, leadStyle, leadWidth) * scale.lead * 1.44;
  }

  return height + scale.gapLg;
}

/** Height the captions and the gaps between rows take, whatever the portrait. */
function fixedGridHeight(
  people: PersonItem[],
  density: PeopleDensity,
  scale: StageScale,
  columns: number,
): number {
  const track = (scale.content - (columns - 1) * TILE_GAP[density]) / columns;
  const captions = rowCaptionHeights(people, density, scale, track, columns);
  return (
    captions.reduce((total, height) => total + height + PORTRAIT_GAP, 0) +
    (captions.length - 1) * ROW_GAP
  );
}

/**
 * Tallest portrait that still leaves the whole grid inside the safe area.
 *
 * `available` is what the stage has after the title block; everything the
 * captions and gaps take is fixed, and the portraits divide what is left. A
 * negative answer means the captions alone overflow, which the caller floors at
 * `MIN_PORTRAIT` and leaves to `useFitContent()` to report.
 */
function portraitCap(
  people: PersonItem[],
  density: PeopleDensity,
  scale: StageScale,
  columns: number,
  available: number,
  title: string,
  lead: string | undefined,
): number {
  const rows = Math.ceil(people.length / columns);
  const spare =
    available -
    headerHeight(scale, title, lead) -
    fixedGridHeight(people, density, scale, columns);
  return spare / rows;
}

/** How many tiles fit across `content`, given the narrowest one allowed. */
function fits(content: number, gap: number, track: number, count: number): number {
  const needed = track / (1 + KERNING_ALLOWANCE) + gap;
  return Math.min(count, Math.max(1, Math.floor((content + gap) / needed)));
}

export interface PeopleGrid {
  /** Columns on every landscape stage — one rectangle, projected everywhere. */
  columns: number;
  rows: number;
  /** Portrait cap on a landscape stage, in design px. */
  portrait: number;
  /**
   * Whether the last row holds exactly one person, on each stage.
   *
   * Balancing the rows takes care of this wherever it can — fifteen people go
   * five-and-five-and-five — but an odd count in two columns has no balanced
   * arrangement, which is what a phone hands a fifteen-person team. A lone tile
   * left in the first column reads as a grid that gave up; the same tile
   * centred under the pair above it reads as the end of a list.
   */
  lastAlone: boolean;
  phoneLastAlone: boolean;
  /** Columns on an upright phone, where the type scale is different again. */
  phoneColumns: number;
  /**
   * Portrait cap on an upright phone, as a CSS length rather than a number.
   *
   * A landscape stage is 1080 design px tall whatever the projector is, so its
   * budget is arithmetic this file can finish. A portrait stage is not: the
   * width is pinned at 900 and the HEIGHT flows with the device, anywhere from
   * 1080 to 2400, so the only honest answer is an expression the browser
   * evaluates against the stage it actually got. Handing back a number would
   * mean picking one phone — and picking the shortest, which is what safety
   * would demand, gives every real phone portraits half the size they could be.
   */
  phonePortrait: string;
}

/**
 * Plans one people grid: the column count first, then the portrait that fits.
 *
 * The order matters and is the whole design. Columns come from the width the
 * NAMES need, because a broken name is not a trade anyone would make. Rows fall
 * out of the column count, and the portrait is then whatever is left over — the
 * grid gains a row on a crowded slide and the faces get smaller to pay for it.
 * Shrinking type is not on the table (`useFitContent()` is the last resort, and
 * a slide that reaches it is a slide to cut), so the portrait is the only give
 * in the system.
 */
export function planPeopleGrid(
  people: PersonItem[],
  density: PeopleDensity,
  title: string,
  lead: string | undefined,
): PeopleGrid {
  const count = people.length;
  const gap = TILE_GAP[density];

  const track = Math.max(
    TILE_WIDTH[density],
    widestWordFor(people, density, SCALES.narrow),
  );
  const perRow = fits(SCALES.narrow.content, gap, track, count);
  const rows = Math.max(1, Math.ceil(count / perRow));
  // Spread evenly over the rows the width allows: seven people go four-and-three
  // rather than five-and-two, so the block reads as an arrangement instead of a
  // list that ran out of room.
  const columns = Math.max(1, Math.ceil(count / rows));

  const portrait = Math.max(
    MIN_PORTRAIT,
    Math.min(
      PORTRAIT[density],
      portraitCap(people, density, SCALES.narrow, columns, SAFE_HEIGHT, title, lead),
      portraitCap(people, density, SCALES.wide, columns, SAFE_HEIGHT, title, lead),
    ),
  );

  const phoneTrack = Math.max(
    TILE_WIDTH[density],
    widestWordFor(people, density, SCALES.phone),
  );
  const phonePerRow = fits(SCALES.phone.content, gap, phoneTrack, count);
  const phoneRows = Math.max(1, Math.ceil(count / phonePerRow));
  const phoneColumns = Math.max(1, Math.ceil(count / phoneRows));

  /* Everything a portrait stage spends before the portraits get any: the rail,
     both `--deck-pad-y` insets at the phone's own 40px, the title block and the
     captions. What is left is divided by the rows, by the browser, against the
     height this particular phone gave the stage. */
  const phoneChrome =
    RAIL_HEIGHT +
    2 * PHONE_PAD_Y +
    headerHeight(SCALES.phone, title, lead) +
    fixedGridHeight(people, density, SCALES.phone, phoneColumns);

  return {
    columns,
    rows,
    portrait: Math.floor(portrait),
    lastAlone: columns > 1 && count % columns === 1,
    phoneLastAlone: phoneColumns > 1 && count % phoneColumns === 1,
    phoneColumns,
    phonePortrait:
      `clamp(${MIN_PORTRAIT}px, ` +
      `(var(--deck-stage-h, 1080px) - ${Math.round(phoneChrome)}px) / ${phoneRows}, ` +
      `${PORTRAIT[density]}px)`,
  };
}

/**
 * Every caption word on this slide that is wider than the track it lands in.
 *
 * Nothing in the deck detects horizontal overflow, and a name broken inside the
 * word looks like a deliberate hyphenation from the back of a room, so this is
 * how the test asserts the thing the layout exists to guarantee. Empty is the
 * only acceptable answer.
 *
 * It measures with the same table the plan was made with, so it proves the
 * arithmetic is self-consistent rather than proving the browser agrees. What
 * proves the browser agrees is walking the slides at every stage shape and
 * asking each word whether it occupies more than one client rect; that is a
 * browser job and it lives outside the repo.
 */
export function overflowingWords(
  people: PersonItem[],
  density: PeopleDensity,
  grid: PeopleGrid,
): string[] {
  const gap = TILE_GAP[density];
  const broken: string[] = [];

  const check = (scale: StageScale, columns: number) => {
    const track = (scale.content - (columns - 1) * gap) / columns;
    for (const person of people) {
      const fields: [string | undefined, TextStyle][] = [
        [person.name, nameStyle(density, scale)],
        [density === "lg" ? person.role : undefined, roleStyle(scale)],
        [density === "sm" ? undefined : person.org, orgStyle(scale)],
      ];
      for (const [text, style] of fields) {
        if (!text) continue;
        for (const word of text.split(/\s+/).filter(Boolean)) {
          if (wordWidth(word, style) > track * (1 + KERNING_ALLOWANCE)) {
            broken.push(word);
          }
        }
      }
    }
  };

  check(SCALES.narrow, grid.columns);
  check(SCALES.wide, grid.columns);
  check(SCALES.phone, grid.phoneColumns);
  return broken;
}

/**
 * How far the planned slide runs past the safe area, in design px.
 *
 * Zero unless the portraits hit `MIN_PORTRAIT` — below that the plan stops
 * giving ground, and what is left is a slide holding more people than a 1080px
 * stage can show. `useFitContent()` would catch it in front of the room by
 * scaling the whole slide down; this catches it in CI, where the fix is still
 * available: split the roster across two slides.
 *
 * Landscape only. A portrait stage flows its height, so there is no number here
 * to check against — see `PeopleGrid.phonePortrait`.
 */
export function stageOverflow(
  people: PersonItem[],
  density: PeopleDensity,
  grid: PeopleGrid,
  title: string,
  lead: string | undefined,
): number {
  const worst = [SCALES.narrow, SCALES.wide].reduce((tallest, scale) => {
    const height =
      headerHeight(scale, title, lead) +
      grid.rows * grid.portrait +
      fixedGridHeight(people, density, scale, grid.columns);
    return Math.max(tallest, height);
  }, 0);
  return Math.max(0, Math.round(worst - SAFE_HEIGHT));
}

/** Height of the grid itself, in design px at the narrow scale. */
export function gridHeightFor(
  people: PersonItem[],
  density: PeopleDensity,
  grid: PeopleGrid,
): number {
  return (
    grid.rows * grid.portrait +
    fixedGridHeight(people, density, SCALES.narrow, grid.columns)
  );
}
