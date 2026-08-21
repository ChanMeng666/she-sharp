/**
 * The design layer: what a She Sharp event poster looks like, at every size.
 *
 * `build-event-poster.ts` is the machine — it fetches copy, crops the plate,
 * runs the legibility gate and encodes. This file is the design, and it is
 * separate for one reason: adding a platform means adding a `Format` here and
 * nothing anywhere else.
 *
 * WHY EACH SIZE IS ITS OWN LAYOUT. A 2:1 Humanitix banner is not a 4:5 social
 * post cropped, and neither is a 9:16 story. Cropping one composition to three
 * aspect ratios can satisfy at most one of them; the other two lose either the
 * headline or the facts. So the shared thing is the type system and the stack
 * builder below, not the composition.
 *
 * THE COLOURS ARE THE EVENT'S, NOT THIS FILE'S. `PosterTheme` is passed in.
 * When the event already has a deck, its theme is reused so the poster and the
 * projector are one piece of art direction; otherwise it comes off the plate or
 * falls back to the She Sharp default. A colour written into this file would be
 * one event's colour applied to every future event, which is the same mistake
 * the decks made before they had skins.
 */

import { contrastRatio } from "@/lib/deck/theme";

import {
  BODY,
  DISPLAY,
  boxFor,
  fitSize,
  inlineLogo,
  measure,
  textLine,
  wrapBalanced,
  type TextBox,
} from "./poster-type";

const SHE_SHARP_LOGO = "public/logos/she-sharp-logo.svg";

/* ------------------------------------------------------------------ theme */

export interface PosterTheme {
  /** Large solid fills the room is meant to act on — the RSVP pill. */
  accent: string;
  /**
   * The bright counterpoint, used for kickers and the title's tail.
   *
   * It has to survive being set as SMALL TYPE over a lit photograph, which is a
   * far harder job than a solid fill. Brand magenta is 4.61:1 on pure black, so
   * over anything lit at all it cannot clear 4.5:1 and no scrim rescues it
   * without throwing the picture away — the gate proved that rather than anyone
   * arguing it. So the accent carries fills and the spark carries ink.
   */
  spark: string;
  /** The ground the scrims are made of. Near-black, not brand navy: navy
   *  washes out under a scrim and muddies whatever is behind it. */
  canvas: string;
}

export const INK = "#ffffff";

export const SHE_SHARP_THEME: PosterTheme = {
  accent: "#c846ab",
  spark: "#5ee7f5",
  canvas: "#0b0a14",
};

/* -------------------------------------------------------------------- copy */

export interface PosterCopy {
  titleLead: string;
  titleTail: string;
  subtitle?: string;
  strapline?: string;
  date: string;
  time: string;
  venue: string;
  address?: string;
  partner?: { name: string; logo: string };
  hasRsvp: boolean;
}

/* ----------------------------------------------------------------- formats */

export interface Layout {
  scrim: string;
  type: string;
  boxes: TextBox[];
  /** Rows of the plate to keep, as fractions of its height. */
  crop: { top: number; bottom: number };
  /** Extra assertions this format owes, run after layout. */
  assert?: (boxes: TextBox[]) => void;
}

export interface Format {
  key: string;
  width: number;
  height: number;
  /**
   * Which files to write. More than one when the same artwork has two jobs.
   *
   * FORMAT IS AN UPLOAD CONSTRAINT, NOT A QUALITY PREFERENCE, and two platforms
   * disagree with the web here:
   *
   *   - **Humanitix rejects WebP outright.** Its banner upload takes JPEG, PNG
   *     or SVG, so a WebP looks perfect locally and cannot be uploaded at all.
   *   - **Instagram accepts WebP but handles it inconsistently on mobile**,
   *     where these actually get posted from. JPEG is the format that always
   *     works, so anything bound for Instagram ships one.
   *
   * `social` emits both because it has two destinations: WebP is the website's
   * `coverImage`, JPEG is what somebody uploads to a feed.
   */
  encode: readonly ("webp" | "jpeg")[];
  /** Target file-size band in bytes. */
  bytes: { min: number; max: number };
  /** One line for the build report, so an organiser knows what it is for. */
  usedFor: string;
  build: (copy: PosterCopy, theme: PosterTheme) => Layout;
}

/* ------------------------------------------------------- the stack builder */

interface StackOptions {
  x: number;
  y: number;
  column: number;
  theme: PosterTheme;
  copy: PosterCopy;
  /** Display cap; the column is what actually decides the size. */
  titleMax: number;
  kicker?: { size: number; track: number };
  strapline?: { size: number };
  facts: { size: number; addressSize?: number };
  /**
   * Gaps, so a tall format can breathe and a square one cannot.
   *
   * `afterKicker` is CLEAR SPACE BELOW THE KICKER, not the distance to the
   * title's baseline. The builder adds the title's own cap height on top,
   * because a title's ink rises a full cap above its baseline and a raw
   * baseline-to-baseline number silently draws the headline over the kicker the
   * moment the title solves larger than the gap. That happened twice while
   * these formats were being tuned — once at 3200px where it was obvious, once
   * at 1080px where the two merely touched — and the legibility gate cannot see
   * it, because the thing covering the kicker is not the ground.
   */
  gap: { afterKicker: number; afterTitle: number; afterRule: number; afterStrapline: number };
  /** Colour the title's tail differently, restoring the join the dash was doing. */
  tailInSpark?: boolean;
}

interface StackResult {
  parts: string[];
  boxes: TextBox[];
  /** Where the next element may start. */
  endY: number;
}

/**
 * Kicker → title → rule → strapline → facts, in one column.
 *
 * Every format is some arrangement of this stack over a plate, which is why it
 * is written once. What differs between formats is the geometry and which
 * pieces are present — a square has no room for a strapline, a story has no
 * room for an address — so each piece is optional and the caller positions the
 * result.
 *
 * The display lines are solved to the SAME column width, and that is the whole
 * mechanism by which their right edges align. No size is written down; change
 * the title in the event data and the block re-solves.
 */
function buildStack(o: StackOptions): StackResult {
  const parts: string[] = [];
  const boxes: TextBox[] = [];
  let y = o.y;

  // Solved BEFORE the kicker is placed, because the kicker's clearance depends
  // on how tall the title turned out to be.
  const displayLines = [o.copy.titleLead, o.copy.titleTail].filter(Boolean);
  const solved = displayLines.map((text, i) =>
    fitSize({
      text,
      family: DISPLAY,
      maxWidth: o.column,
      maxSize: o.titleMax,
      label: `title line ${i + 1}`,
    }),
  );
  const titleCap =
    (Math.max(...displayLines.map((t) => measure(t, DISPLAY).height)) *
      Math.max(...solved.map((s) => s.size))) /
    100;

  if (o.kicker && o.copy.subtitle) {
    const text = o.copy.subtitle.toUpperCase();
    // No `label` on the fit: a kicker is MEANT to cap. It is a fixed small size
    // with wide tracking, not a line trying to reach the column, so its cap
    // firing is not news and warning about it trains the reader to ignore
    // warnings.
    const fit = fitSize({
      text,
      family: BODY,
      maxWidth: o.column,
      maxSize: o.kicker.size,
      trackEm: o.kicker.track,
    });
    const line = {
      x: o.x,
      y,
      text,
      family: BODY,
      size: fit.size,
      letterSpacing: fit.letterSpacing,
    };
    parts.push(textLine({ ...line, fill: o.theme.spark }));
    boxes.push(boxFor("subtitle", line, o.theme.spark));
    // Clear space, then the title's own cap height — see the note on `gap`.
    y += o.gap.afterKicker + titleCap;
  }

  const spread =
    Math.max(...solved.map((s) => s.size)) / Math.min(...solved.map((s) => s.size));
  if (spread > 1.25) {
    console.warn(
      `  ! the display lines differ by ${((spread - 1) * 100).toFixed(0)}% in size — ` +
        "they will read as a heading and a subheading, not as one title.",
    );
  }

  const leading = Math.max(...solved.map((s) => s.size)) * 0.9;
  for (const [i, text] of displayLines.entries()) {
    // The tail is the half of the title that sat after the dash. Set in the
    // same ink at the same size the two read as one run-on sentence; colour
    // restores the join the dash was doing.
    const ink = i > 0 && o.tailInSpark ? o.theme.spark : INK;
    const line = { x: o.x, y, text, family: DISPLAY, size: solved[i].size };
    parts.push(textLine({ ...line, fill: ink }));
    boxes.push(boxFor(`title "${text}"`, line, ink));
    y += leading;
  }
  // Back off the leading the loop added after its last line: that space is for
  // a NEXT line, and there isn't one.
  y -= leading * 0.28;
  y += o.gap.afterTitle;

  parts.push(
    `<rect x="${o.x}" y="${y}" width="${o.column}" height="1.5" fill="${INK}" fill-opacity="0.2"/>`,
  );
  y += o.gap.afterRule;

  if (o.strapline && o.copy.strapline) {
    const size = o.strapline.size;
    for (const text of wrapBalanced(o.copy.strapline, BODY, size, o.column)) {
      const line = { x: o.x, y, text, family: BODY, size };
      parts.push(textLine({ ...line, fill: INK, opacity: 0.92 }));
      boxes.push(boxFor("strapline", line, INK));
      y += size * 1.32;
    }
    y += o.gap.afterStrapline;
  }

  const when = [o.copy.date, o.copy.time].filter(Boolean).join("   ·   ");
  const facts: [string, number, number][] = [
    [when, o.facts.size, 1],
    [o.copy.venue, o.facts.size, 0.8],
  ];
  if (o.facts.addressSize && o.copy.address) {
    facts.push([o.copy.address, o.facts.addressSize, 0.58]);
  }

  for (const [text, size, opacity] of facts) {
    if (!text) continue;
    const line = { x: o.x, y, text, family: BODY, size };
    parts.push(textLine({ ...line, fill: INK, opacity }));
    boxes.push(boxFor("facts", line, INK));
    y += size * 1.42;
  }

  return { parts, boxes, endY: y };
}

/**
 * The pill's label colour, chosen against the pill's own fill.
 *
 * THE INK IS CHECKED, NOT ASSUMED, and that is a correction. The pill drew its
 * label in `INK` unconditionally because it was "white on a solid fill of known
 * contrast" — and the contrast stopped being known the day `themeFor()` began
 * reusing an event's DECK accent. A deck accent is tuned for that deck's canvas,
 * which may be light: the Les Mills evening carries `#b1f6e9`, a mint chosen at
 * 12.98:1 on navy, and **white on that mint is 1.22:1**. The pill rendered as an
 * empty lozenge and nothing in the pipeline said so, because the one component
 * deliberately exempt from the legibility gate was the one that had broken.
 *
 * TWO THINGS ABOUT THE NUMBER, and both were measured rather than reasoned.
 *
 * It is a FLOOR, not a comparison. Brand magenta `#c846ab` measures 4.27:1
 * against white and 4.62:1 against the canvas, so "pick the higher" would flip
 * the label on every poster this repo has ever shipped, to fix nothing.
 *
 * And the floor is 3:1, not the gate's 4.5:1, which is the one place in this
 * pipeline where a lower number is the correct one. 4.5 is the WCAG ratio for
 * body-size text; this is a 32–42pt display word inside a solid fill of known
 * colour, which is unambiguously large text at 3:1. Set at 4.5 the check flips
 * brand magenta too — the shipped, reviewed look — while the failure it exists
 * to catch measures 1.22 and would be caught by either.
 */
export const PILL_CONTRAST_FLOOR = 3;

export function pillInk(theme: PosterTheme): string {
  return contrastRatio(INK, theme.accent) >= PILL_CONTRAST_FLOOR ? INK : theme.canvas;
}

/**
 * The call to action, as a solid pill.
 *
 * Not gated for legibility, deliberately: it is ink on a solid fill of known
 * contrast, not ink on an unknown photograph. Gating it would sample the pill
 * rather than the ground and report a number that means nothing. `pillInk()` is
 * what makes "known" true again.
 */
function pill(
  label: string,
  theme: PosterTheme,
  o: { right: number; y: number; size: number },
): string {
  const ink = pillInk(theme);
  const track = o.size * 0.07;
  const m = measure(label, DISPLAY);
  const textW = (m.width * o.size) / 100 + track * (label.length - 1);
  const capH = (m.height * o.size) / 100;
  const padX = o.size * 1.3;
  const padY = o.size * 0.72;
  const boxW = textW + padX * 2;
  const boxH = capH + padY * 2;
  const boxX = o.right - boxW;

  return (
    `<rect x="${boxX}" y="${o.y}" width="${boxW}" height="${boxH}" rx="${boxH / 2}" fill="${theme.accent}"/>` +
    textLine({
      x: boxX + padX,
      y: o.y + padY + capH,
      text: label,
      family: DISPLAY,
      size: o.size,
      letterSpacing: track,
      fill: ink,
    })
  );
}

/** A logo lockup: She Sharp, a hairline, the partner. */
function lockup(
  copy: PosterCopy,
  x: number,
  y: number,
  sheSharpWidth: number,
): { markup: string; height: number } {
  const she = inlineLogo(SHE_SHARP_LOGO, { x, y, width: sheSharpWidth, fill: INK });
  if (!copy.partner) return { markup: she.markup, height: she.height };

  const gap = sheSharpWidth * 0.19;
  const ruleX = x + she.width + gap;
  // Sized to sit optically level with the She Sharp mark rather than to a shared
  // height: a wordmark like Les Mills is 5.55:1 against She Sharp's 2.67:1, so
  // matching heights would make the wordmark twice as wide as the poster.
  const partner = inlineLogo(`public${copy.partner.logo}`, {
    x: ruleX + gap,
    y: y + (she.height - sheSharpWidth * 0.245) / 2,
    width: sheSharpWidth * 1.36,
    fill: INK,
  });
  const rule =
    `<rect x="${ruleX}" y="${y + she.height * 0.14}" width="1.5" ` +
    `height="${she.height * 0.72}" fill="${INK}" fill-opacity="0.28"/>`;

  return { markup: she.markup + rule + partner.markup, height: she.height };
}

function frame(w: number, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n${body}\n</svg>`;
}

/**
 * The wash the type is set into. Three shapes, and they are not interchangeable.
 *
 * `up` is a floor: the type sits at the bottom, so the darkening ramps in over
 * the lower half and the picture stays open above it.
 *
 * `left` is the same idea rotated, for a wide banner whose type runs down the
 * leading edge.
 *
 * `band` holds down the MIDDLE and is the one that is easy to get wrong. A
 * format whose headline sits mid-frame — the 4:5, because it doubles as a
 * website cover with a fixed safe band — needs the darkening to arrive early
 * and stay, while leaving the top third lit. Handing it the `up` floor instead
 * looks almost right and drops a highlight straight through the kicker; the
 * gate caught exactly that when these three were briefly one gradient.
 */
function washDefs(theme: PosterTheme, direction: "up" | "left" | "band"): string {
  const stops =
    direction === "up"
      ? `<linearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0" stop-color="${theme.canvas}" stop-opacity="0"/>
           <stop offset="0.35" stop-color="${theme.canvas}" stop-opacity="0.62"/>
           <stop offset="1" stop-color="${theme.canvas}" stop-opacity="0.94"/>
         </linearGradient>`
      : direction === "band"
        ? `<linearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
             <stop offset="0" stop-color="${theme.canvas}" stop-opacity="0"/>
             <stop offset="0.17" stop-color="${theme.canvas}" stop-opacity="0.80"/>
             <stop offset="0.45" stop-color="${theme.canvas}" stop-opacity="0.90"/>
             <stop offset="1" stop-color="${theme.canvas}" stop-opacity="0.96"/>
           </linearGradient>`
        : `<linearGradient id="wash" x1="0" y1="0" x2="1" y2="0">
             <stop offset="0" stop-color="${theme.canvas}" stop-opacity="0.95"/>
             <stop offset="0.46" stop-color="${theme.canvas}" stop-opacity="0.82"/>
             <stop offset="1" stop-color="${theme.canvas}" stop-opacity="0.06"/>
           </linearGradient>`;

  return `<defs>
    ${stops}
    <linearGradient id="ceiling" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.canvas}" stop-opacity="0.78"/>
      <stop offset="1" stop-color="${theme.canvas}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

/* ------------------------------------------------------------- the formats */

/** Print and the event page: the tallest, and the only one with an address. */
function posterLayout(copy: PosterCopy, theme: PosterTheme): Layout {
  const W = 1400;
  const H = 1980;
  const M = 96;
  const COL = W - M * 2;

  const scrim = `${washDefs(theme, "up")}
    <rect x="0" y="740" width="${W}" height="${H - 740}" fill="url(#wash)"/>
    <rect x="0" y="0" width="${W}" height="280" fill="url(#ceiling)"/>
    <ellipse cx="${M + 180}" cy="1230" rx="760" ry="420" fill="url(#glow)"/>`;

  const mark = lockup(copy, M, 108, 208);
  const stack = buildStack({
    x: M,
    // The kicker sits under the lockup, not above the headline. Above the
    // headline it landed on the brightest part of the plate and the gate
    // measured a highlight at luminance 1.00 running straight through it.
    y: 268,
    column: COL,
    theme,
    copy,
    titleMax: 230,
    kicker: { size: 31, track: 0.2 },
    strapline: { size: 41 },
    facts: { size: 32, addressSize: 26 },
    gap: { afterKicker: 758, afterTitle: 30, afterRule: 74, afterStrapline: 44 },
    tailInSpark: true,
  });

  const parts = [mark.markup, ...stack.parts];
  if (copy.hasRsvp) {
    parts.push(pill("RSVP TODAY", theme, { right: W - M, y: 1820, size: 42 }));
  }

  return {
    scrim: frame(W, H, scrim),
    type: frame(W, H, parts.join("\n")),
    boxes: stack.boxes,
    crop: { top: 0, bottom: 1 },
  };
}

/**
 * The 4:5 that does the most work: LinkedIn, Instagram, Facebook — and the
 * website's own `coverImage`.
 *
 * SOCIAL_SAFE is why this is not the poster rescaled. As the site cover the file
 * is rendered at five aspect ratios, and each keeps a different band of the
 * 1350:
 *
 *   event-detail/event-header.tsx     ~2.2:1 centre   → 427–922   (top bound)
 *   events/event-card.tsx              16:9 centre    → 371–979
 *   home/events-showcase-section.tsx   1:1 centre @md → 135–1215
 *   home/events-showcase-section.tsx   4:3 object-top → 0–810     (bottom bound)
 *   events/featured-event-hero.tsx     4:5            → full
 *
 * The intersection is 427–810, tightened to 445–778: at the raw limit the last
 * display line cleared the 4:3 crop by 15px, inside tolerance but reading as
 * type falling off an event card.
 */
const SOCIAL_SAFE = { top: 445, bottom: 778 };

function socialLayout(copy: PosterCopy, theme: PosterTheme): Layout {
  const W = 1080;
  const H = 1350;
  const M = 72;
  const COL = W - M * 2;

  const scrim = `${washDefs(theme, "band")}
    <rect x="0" y="300" width="${W}" height="${H - 300}" fill="url(#wash)"/>
    <ellipse cx="${M + 140}" cy="700" rx="620" ry="340" fill="url(#glow)"/>`;

  const parts: string[] = [];
  const boxes: TextBox[] = [];

  /* The tail is promoted to a kicker ABOVE the display lines rather than
     trailing below them, where it would fall out of the safe band entirely.
     There is no logo lockup at the top either: 16:9 cuts the whole strip off,
     so it moves to the bottom band. */
  const KICKER_BASELINE = 492;
  if (copy.titleTail) {
    const text = copy.titleTail.toUpperCase();
    const fit = fitSize({
      text,
      family: DISPLAY,
      maxWidth: COL * 0.78,
      maxSize: 48,
      trackEm: 0.04,
    });
    const line = {
      x: M,
      y: KICKER_BASELINE,
      text,
      family: DISPLAY,
      size: fit.size,
      letterSpacing: fit.letterSpacing,
    };
    parts.push(textLine({ ...line, fill: theme.spark }));
    boxes.push(boxFor("cover kicker", line, theme.spark));
  }

  /* Split on the comma HERE and only here. On the poster the two display lines
     are the title's halves either side of its dash; this format has 333px of
     band to work in and needs the lead itself to break. */
  const lead = copy.titleLead.split(/,\s*/).filter(Boolean);
  const displayLines =
    lead.length > 1 ? lead.map((l, i) => (i < lead.length - 1 ? `${l},` : l)) : lead;

  /* SOLVED FROM THE BAND, NOT THE COLUMN — the opposite of every other format,
     and the reason this cannot be one composition cropped. 936px of column
     would set these at 200pt; two 200pt lines plus the kicker need ~380px and
     the band is 333. Height binds, so height decides, and the column is only a
     ceiling. */
  const gap = 56;
  const available = SOCIAL_SAFE.bottom - KICKER_BASELINE - gap;
  const inkEm = Math.max(...displayLines.map((t) => measure(t, DISPLAY).height)) / 100;
  const byBand = available / ((displayLines.length - 1) * 0.86 + inkEm + 0.08);
  const byColumn = Math.min(
    ...displayLines.map(
      (t) => fitSize({ text: t, family: DISPLAY, maxWidth: COL, maxSize: 240 }).size,
    ),
  );
  const size = Math.min(byBand, byColumn);

  let y = SOCIAL_SAFE.bottom - size * 0.05 - (displayLines.length - 1) * size * 0.86;
  for (const text of displayLines) {
    const line = { x: M, y, text, family: DISPLAY, size };
    parts.push(textLine({ ...line, fill: INK }));
    boxes.push(boxFor(`cover title "${text}"`, line, INK));
    y += size * 0.86;
  }

  y = SOCIAL_SAFE.bottom + 78;
  parts.push(
    `<rect x="${M}" y="${y}" width="${COL}" height="1.5" fill="${INK}" fill-opacity="0.2"/>`,
  );
  y += 58;
  const when = [copy.date, copy.time].filter(Boolean).join("   ·   ");
  for (const [text, s, op] of [
    [when, 29, 1],
    [copy.venue, 29, 0.8],
  ] as [string, number, number][]) {
    if (!text) continue;
    const line = { x: M, y, text, family: BODY, size: s };
    parts.push(textLine({ ...line, fill: INK, opacity: op }));
    boxes.push(boxFor("cover facts", line, INK));
    y += s * 1.4;
  }

  const mark = lockup(copy, M, 1188, 168);
  parts.push(mark.markup);
  if (copy.hasRsvp) {
    parts.push(
      pill("RSVP TODAY", theme, { right: W - M, y: 1188 + (mark.height - 81) / 2, size: 33 }),
    );
  }

  return {
    scrim: frame(W, H, scrim),
    type: frame(W, H, parts.join("\n")),
    boxes,
    // Taken from below the top: there is no top lockup here, so the plate's top
    // strip is the expendable end.
    crop: { top: 0.167, bottom: 1 },
    assert(all) {
      for (const box of all) {
        if (!box.name.startsWith("cover title") && !box.name.startsWith("cover kicker")) {
          continue;
        }
        if (box.top < SOCIAL_SAFE.top || box.top + box.height > SOCIAL_SAFE.bottom) {
          throw new Error(
            `"${box.name}" spans y ${box.top}–${box.top + box.height}, outside the ` +
              `safe band ${SOCIAL_SAFE.top}–${SOCIAL_SAFE.bottom}. It would be cropped ` +
              `away by event-card.tsx (16:9) or events-showcase-section.tsx (4:3 top).`,
          );
        }
      }
    },
  };
}

/**
 * The Humanitix banner: 2:1, and the widest thing in the set.
 *
 * Humanitix asks for a minimum of 3200×1600 at 2:1 and crops anything else, so
 * this is authored at exactly that. Type runs down the leading 45% with the
 * plate open on the trailing side, which is the only arrangement that survives
 * a 2:1 frame — a centred column on a strip this wide reads as a website
 * header, not a poster.
 *
 * NO RSVP PILL, on purpose. The Humanitix page puts its own "Get tickets"
 * button directly beneath this image; a second, non-clickable one drawn into
 * the artwork is a button people will try to press.
 */
function humanitixLayout(copy: PosterCopy, theme: PosterTheme): Layout {
  const W = 3200;
  const H = 1600;
  const M = 200;
  const COL = 1380;

  const scrim = `${washDefs(theme, "left")}
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#wash)"/>
    <ellipse cx="${M + 300}" cy="${H / 2}" rx="1200" ry="700" fill="url(#glow)"/>`;

  const mark = lockup(copy, M, 150, 300);
  const stack = buildStack({
    x: M,
    y: 520,
    column: COL,
    theme,
    copy,
    titleMax: 205,
    kicker: { size: 34, track: 0.2 },
    facts: { size: 40 },
    // THE KICKER GAP IS A CAP HEIGHT, NOT A NICE NUMBER. A title's ink rises a
    // full cap height ABOVE its baseline, so a gap smaller than that draws the
    // headline straight over the kicker. At 120 against a 190pt title it did
    // exactly that — they overlapped and the kicker was unreadable underneath.
    // The legibility gate cannot catch this: both boxes measure fine against
    // the ground, because the thing on top of the kicker is not the ground.
    gap: { afterKicker: 128, afterTitle: 44, afterRule: 86, afterStrapline: 0 },
    tailInSpark: true,
  });

  return {
    scrim: frame(W, H, scrim),
    type: frame(W, H, [mark.markup, ...stack.parts].join("\n")),
    boxes: stack.boxes,
    // A 2:1 window centred in a 2:3 plate lands on the plate's MIDDLE, which on
    // a poster plate is the empty space the prompt deliberately left below the
    // subject — giving a banner with its picture in one corner and half a frame
    // of black. The window is pulled up onto the subject instead. Any
    // plate-led LANDSCAPE format needs this; the portrait ones do not, because
    // their aspect already spans most of the plate.
    crop: { top: 0.04, bottom: 0.54 },
  };
}

/**
 * Instagram and Facebook stories: 9:16, and the only format with someone else's
 * interface on top of it.
 *
 * Both platforms overlay chrome on the frame — the account row at the top, the
 * reply bar and any link sticker at the bottom — so roughly the top and bottom
 * 250px belong to them, not to us. Type outside `STORY_SAFE` is not clipped, it
 * is COVERED, which is worse: it looks fine in the file and fine in the preview
 * and is hidden only once it is live.
 */
const STORY_SAFE = { top: 250, bottom: 1670 };

function storyLayout(copy: PosterCopy, theme: PosterTheme): Layout {
  const W = 1080;
  const H = 1920;
  const M = 84;
  const COL = W - M * 2;

  const scrim = `${washDefs(theme, "up")}
    <rect x="0" y="640" width="${W}" height="${H - 640}" fill="url(#wash)"/>
    <rect x="0" y="0" width="${W}" height="420" fill="url(#ceiling)"/>
    <ellipse cx="${W / 2}" cy="1180" rx="700" ry="520" fill="url(#glow)"/>`;

  const mark = lockup(copy, M, 330, 190);
  const stack = buildStack({
    x: M,
    y: 1010,
    column: COL,
    theme,
    copy,
    titleMax: 150,
    kicker: { size: 27, track: 0.2 },
    facts: { size: 30 },
    gap: { afterKicker: 54, afterTitle: 34, afterRule: 62, afterStrapline: 0 },
    tailInSpark: true,
  });

  const parts = [mark.markup, ...stack.parts];
  if (copy.hasRsvp) {
    parts.push(pill("RSVP TODAY", theme, { right: W - M, y: 1520, size: 34 }));
  }

  return {
    scrim: frame(W, H, scrim),
    type: frame(W, H, parts.join("\n")),
    boxes: stack.boxes,
    crop: { top: 0, bottom: 1 },
    assert(all) {
      for (const box of all) {
        const bottom = box.top + box.height;
        if (box.top < STORY_SAFE.top || bottom > STORY_SAFE.bottom) {
          throw new Error(
            `"${box.name}" spans y ${box.top}–${bottom}, outside the story safe area ` +
              `${STORY_SAFE.top}–${STORY_SAFE.bottom}. Instagram and Facebook draw their ` +
              `own interface over those strips, so it would be covered rather than cropped.`,
          );
        }
      }
    },
  };
}

/** The 1:1, for an Instagram grid that still has square tiles in it. */
function squareLayout(copy: PosterCopy, theme: PosterTheme): Layout {
  const W = 1080;
  const H = 1080;
  const M = 84;
  const COL = W - M * 2;

  const scrim = `${washDefs(theme, "up")}
    <rect x="0" y="300" width="${W}" height="${H - 300}" fill="url(#wash)"/>
    <rect x="0" y="0" width="${W}" height="240" fill="url(#ceiling)"/>
    <ellipse cx="${M + 160}" cy="760" rx="640" ry="380" fill="url(#glow)"/>`;

  const mark = lockup(copy, M, 76, 150);
  // No strapline and no address: at 1080 square there is room for the title and
  // the two facts that decide whether someone can come, and nothing else. A
  // square that tries to carry the poster's copy is a square nobody can read in
  // a grid thumbnail.
  const stack = buildStack({
    x: M,
    y: 560,
    column: COL,
    theme,
    copy,
    titleMax: 132,
    kicker: { size: 24, track: 0.2 },
    facts: { size: 27 },
    gap: { afterKicker: 54, afterTitle: 28, afterRule: 52, afterStrapline: 0 },
    tailInSpark: true,
  });

  return {
    scrim: frame(W, H, scrim),
    type: frame(W, H, [mark.markup, ...stack.parts].join("\n")),
    boxes: stack.boxes,
    crop: { top: 0.1, bottom: 0.95 },
  };
}

/**
 * Every size one event needs, in the order they are usually wanted.
 *
 * `social` doubles as the website's `coverImage`, which is why it is 1080×1350
 * rather than a rounder number: that is Instagram's 4:5, LinkedIn's best mobile
 * ratio, Facebook's feed ratio and the site's cover slot, all at once. One file,
 * four jobs, one set of crop constraints to satisfy.
 */
export const FORMATS: Format[] = [
  {
    key: "poster",
    width: 1400,
    height: 1980,
    encode: ["webp"],
    bytes: { min: 100 * 1024, max: 320 * 1024 },
    usedFor: "The event page and print. The only size that carries the address.",
    build: posterLayout,
  },
  {
    key: "social",
    width: 1080,
    height: 1350,
    encode: ["webp", "jpeg"],
    bytes: { min: 100 * 1024, max: 320 * 1024 },
    usedFor: "LinkedIn, Instagram and Facebook feeds (JPEG) — and the website's own cover (WebP).",
    build: socialLayout,
  },
  {
    key: "humanitix",
    width: 3200,
    height: 1600,
    encode: ["jpeg"],
    bytes: { min: 300 * 1024, max: 3 * 1024 * 1024 },
    usedFor: "The Humanitix ticketing page banner (2:1, their stated minimum).",
    build: humanitixLayout,
  },
  {
    key: "story",
    width: 1080,
    height: 1920,
    encode: ["jpeg", "webp"],
    bytes: { min: 100 * 1024, max: 380 * 1024 },
    usedFor: "Instagram and Facebook stories (JPEG). Keeps clear of their interface.",
    build: storyLayout,
  },
  {
    key: "square",
    width: 1080,
    height: 1080,
    encode: ["jpeg", "webp"],
    bytes: { min: 80 * 1024, max: 300 * 1024 },
    usedFor: "A square Instagram grid tile (JPEG).",
    build: squareLayout,
  },
];
