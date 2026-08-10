/**
 * Composes an event poster and its 4:5 social cover from a generated plate.
 *
 * WHY THE TYPE IS SET IN CODE. The plate (`generate-poster-plate.ts`) carries no
 * words and no marks by design. Everything a reader has to read is set here,
 * against the event's own record in `lib/data/json/events-custom.json` — so the
 * date on the poster and the date on the website cannot disagree, and a
 * correction is an edit to the event rather than a redesign. Nothing below is
 * hardcoded except the framing sentence, and that is flagged where it is.
 *
 * WHY THERE ARE TWO LAYOUTS AND NOT ONE CROP. `coverImage` is rendered at five
 * different aspect ratios across the site, and the poster is rendered at one.
 * A single composition cropped twice can satisfy at most one of them. See
 * COVER_SAFE below for the band that actually binds, and why.
 *
 *   npx tsx scripts/events/build-event-poster.ts <event-slug> --plate <file.png>
 *                                                [--suffix v2] [--no-gate]
 *
 * Writes `public/img/events/<slug>-poster-<suffix>.webp` and `-cover-<suffix>.webp`,
 * plus the crop previews that matter into `tmp/poster-review/`.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { formatEventDate } from "@/lib/data/events";
import { loadEventForDeck, partnerLogosFrom } from "@/lib/deck/event-source";
import { contrastRatio, relativeLuminance } from "@/lib/deck/theme";
import {
  BODY,
  DISPLAY,
  assertFamiliesDistinct,
  boxFor,
  fitSize,
  inlineLogo,
  measure,
  renderLayer,
  textLine,
  wrapBalanced,
  type TextBox,
} from "./poster-type";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/img/events");
const REVIEW_DIR = path.join(ROOT, "tmp/poster-review");

const SHE_SHARP_LOGO = "public/logos/she-sharp-logo.svg";

/* ------------------------------------------------------------------ tokens */

/**
 * The accent pair is this event's own, taken from
 * `lib/deck/decks/event-lesmills-03-september-2026.ts`, where it was derived
 * from the poster it replaces by `scripts/deck/accent-from-poster.ts` and run
 * through `accentFromBrandColour()` so it clears the contrast floor. Poster and
 * projector therefore stay the same evening rather than two.
 *
 * `CANVAS` is the deck's near-black rather than brand navy `#1f1e44`: navy
 * washes out under a scrim and turns the fibre light muddy.
 */
const INK = "#ffffff";
const ACCENT = "#ca53bb";
const SPARK = "#5ee7f5";
const CANVAS = "#0b0a14";

/*
 * ONE COLOUR, ONE JOB — and the legibility gate is what settled it.
 *
 * The cover's kicker was set in ACCENT and measured 2.09:1. Deepening the scrim
 * does not rescue it: `#ca53bb` is 4.61:1 on PURE BLACK, so over anything lit at
 * all it is arithmetically incapable of clearing 4.5:1, and the only scrim that
 * would work is one opaque enough to throw the photograph away. So the accent
 * never carries small type over the picture. It carries the RSVP pill, where it
 * is a solid fill of known contrast rather than ink on an unknown ground.
 *
 * SPARK does the kickers on both artefacts — it is bright enough to survive the
 * fibre light, and using it on both is what makes the poster and the cover read
 * as one pair rather than two designs.
 */

/* -------------------------------------------------------------------- copy */

interface PosterCopy {
  titleLead: string;
  titleTail: string;
  subtitle?: string;
  strapline: string;
  date: string;
  time: string;
  venue: string;
  address?: string;
  partner?: { name: string; logo: string };
  hasRsvp: boolean;
}

/**
 * Drops a trailing postcode segment, and says what it dropped.
 *
 * "…, Auckland Central, Auckland 1010" is a delivery address; a poster wants
 * the part someone navigates by. Silence here would be the bug — an address
 * mangled by a regex looks exactly like an address that was typed that way.
 */
function tidyAddress(address: string): string {
  const parts = address.split(",").map((p) => p.trim());
  const dropped: string[] = [];

  while (parts.length > 2 && /^[A-Za-z .'-]+ \d{4}$/.test(parts[parts.length - 1])) {
    dropped.push(parts.pop() as string);
  }

  if (dropped.length) {
    console.log(`  address: dropped ${dropped.map((d) => `"${d}"`).join(", ")}`);
  }
  return parts.join(", ");
}

function copyFor(slug: string): PosterCopy {
  const event = loadEventForDeck(slug);
  const detail = event.detailPageData;
  const partner = partnerLogosFrom(event)[0];

  // The same split `deckTitleFrom()` uses, and for the same documented reason:
  // cut at the first SPACED dash, never at a comma. This exact title — "No
  // Pain, All Gain – Getting Fit for AI" — is the one that rule was written
  // for; splitting it on the comma yields the headline "No Pain".
  const [lead, ...rest] = event.title.trim().split(/\s+[—–-]\s+/);

  return {
    titleLead: lead.trim(),
    titleTail: rest.join(" – ").trim(),
    subtitle: detail.subtitle?.trim() || undefined,
    // NOT in the event JSON verbatim, and deliberately not added to it:
    // `fullDescription[0]` is three sentences too long and `posters[0].alt`
    // describes the poster this replaces, so reading copy from it is circular.
    // Facts come from the record; a framing sentence belongs to the artefact
    // that says it — the same division `lib/deck/boilerplate.ts` already makes.
    // The partner's name is interpolated so it cannot go stale on its own.
    strapline: `Join She Sharp and ${partner?.name ?? "us"} for a cross-functional conversation about AI`,
    date: formatEventDate(event, "full"),
    // NZST is kept, which is a deliberate divergence from the deck. The deck's
    // `tidyTimeRange()` strips it because everyone in the room shares the
    // projector's timezone; a poster is shared on LinkedIn, where they do not.
    time: (detail.time ?? "").trim(),
    venue: detail.location?.venueName?.trim() ?? "",
    address: detail.location?.address
      ? tidyAddress(detail.location.address)
      : undefined,
    partner,
    hasRsvp: Boolean(detail.registrationUrl?.trim()),
  };
}

/* ----------------------------------------------------------------- layouts */

/**
 * `scrim` and `type` are two SVGs, not one, and that is load-bearing.
 *
 * The legibility gate has to measure the ground the type will actually sit on —
 * which means after the scrim and before the type. Building both into one layer
 * made the gate measure the bare plate instead, and it read a cover kicker as
 * sitting on `#6d3f74` no matter how far the scrim was deepened, because the
 * scrim it was being asked about had not been drawn yet. The numbers looked
 * plausible the whole time, which is what made it worth splitting rather than
 * commenting.
 */
interface Layout {
  width: number;
  height: number;
  scrim: string;
  type: string;
  boxes: TextBox[];
  /** Rows of the plate to keep, as fractions of its height. */
  crop: { top: number; bottom: number };
}

/** A logo lockup: She Sharp, a hairline, the partner. Returns markup + height. */
function lockup(
  copy: PosterCopy,
  x: number,
  y: number,
  sheSharpWidth: number,
): { markup: string; height: number } {
  const she = inlineLogo(SHE_SHARP_LOGO, {
    x,
    y,
    width: sheSharpWidth,
    fill: INK,
  });

  if (!copy.partner) return { markup: she.markup, height: she.height };

  const gap = sheSharpWidth * 0.19;
  const ruleX = x + she.width + gap;
  // Sized to sit optically level with the She Sharp mark rather than to a
  // shared height: the Les Mills wordmark is 5.55:1 and She Sharp is 2.67:1, so
  // matching their heights would make the wordmark twice as wide as the poster.
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

/**
 * The poster: 1400×1980, flush left on a single margin.
 *
 * The three display lines are solved to the SAME column width, so their right
 * edges align without any of the three sizes being written down. That is a
 * derived effect: change the title in `events-custom.json` and it re-solves
 * rather than breaking.
 */
function posterLayout(copy: PosterCopy): Layout {
  const W = 1400;
  const H = 1980;
  const M = 96;
  const COL = W - M * 2;

  const boxes: TextBox[] = [];
  const parts: string[] = [];

  /* Scrims, their own layer. Drawn here rather than relied upon in the plate:
     the plate is chosen for its picture, and a composition must not depend on
     the picture happening to be empty in the right place. This is the same move
     `components/events/event-detail/event-header.tsx` makes. */
  const scrim = `<defs>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CANVAS}" stop-opacity="0"/>
      <stop offset="0.35" stop-color="${CANVAS}" stop-opacity="0.62"/>
      <stop offset="1" stop-color="${CANVAS}" stop-opacity="0.94"/>
    </linearGradient>
    <linearGradient id="ceiling" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CANVAS}" stop-opacity="0.78"/>
      <stop offset="1" stop-color="${CANVAS}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="740" width="${W}" height="${H - 740}" fill="url(#floor)"/>
  <rect x="0" y="0" width="${W}" height="280" fill="url(#ceiling)"/>
  <ellipse cx="${M + 180}" cy="1230" rx="760" ry="420" fill="url(#glow)"/>`;

  /* Lockup, in the plate's named clear top strip. */
  const mark = lockup(copy, M, 108, 208);
  parts.push(mark.markup);

  /* Kicker, directly under the lockup rather than above the headline.
     It started above the headline at y 916, which on this plate is straight
     across the braid: the legibility gate measured a highlight at luminance
     1.00 running through it — cyan tracked caps on a blown-out fibre. The
     clear strip the plate prompt asked for at the top is the one place on the
     poster guaranteed to be empty, and an eyebrow under the lockup is where a
     reader looks for the "what kind of thing is this" line anyway. */
  let y = 268;
  if (copy.subtitle) {
    const kicker = copy.subtitle.toUpperCase();
    const fit = fitSize({
      text: kicker,
      family: BODY,
      maxWidth: COL,
      // No `label`: unlike the display lines, this slot is *meant* to cap. A
      // kicker is a fixed small size with wide tracking; it is not trying to
      // reach the column, so its cap firing is not news.
      maxSize: 31,
      trackEm: 0.2,
    });
    const line = {
      x: M,
      y,
      text: kicker,
      family: BODY,
      size: fit.size,
      letterSpacing: fit.letterSpacing,
    };
    parts.push(textLine({ ...line, fill: SPARK }));
    boxes.push(boxFor("subtitle", line, SPARK));
  }

  /* Display lines: each solved to the SAME column, which is what aligns their
     right edges. No size is written down anywhere — change the title in
     `events-custom.json` and the block re-solves. The cap is only there to stop
     a very short line ("IWD") from solving to something absurd, and `fitSize`
     says so when it fires, because a capped line no longer reaches the edge. */
  const displayLines = [copy.titleLead, copy.titleTail].filter(Boolean);
  const solved = displayLines.map((text, i) =>
    fitSize({
      text,
      family: DISPLAY,
      maxWidth: COL,
      maxSize: 230,
      label: `title line ${i + 1}`,
    }),
  );

  // Two lines of very different length end up at very different sizes, which
  // reads as a hierarchy rather than as one headline. Worth saying out loud;
  // the fix is the title, not this file.
  const spread = Math.max(...solved.map((s) => s.size)) / Math.min(...solved.map((s) => s.size));
  if (spread > 1.25) {
    console.warn(
      `  ! the two display lines differ by ${((spread - 1) * 100).toFixed(0)}% in size — ` +
        "they will read as a heading and a subheading, not as one title.",
    );
  }

  const leading = Math.max(...solved.map((s) => s.size)) * 0.9;
  y = 1150;
  for (const [i, text] of displayLines.entries()) {
    // The tail is the half of the title that sat after the dash, and set in the
    // same white at the same size the two lines read as one run-on sentence:
    // "No Pain, All Gain Getting Fit for AI". Colour restores the join the dash
    // was doing, and it is SPARK rather than ACCENT for two reasons — the cover
    // already sets this exact phrase in SPARK, so the pair agrees; and ACCENT at
    // display size would sit at about 4.4:1 here and fail the gate anyway.
    const ink = i === 0 ? INK : SPARK;
    const line = { x: M, y, text, family: DISPLAY, size: solved[i].size };
    parts.push(textLine({ ...line, fill: ink }));
    boxes.push(boxFor(`title "${text}"`, line, ink));
    y += leading;
  }

  /* Hairline. The subtraction backs off the leading the loop above added after
     its last line — that leading is space for a NEXT line, and there isn't one. */
  y -= leading * 0.28;
  y += 30;
  parts.push(
    `<rect x="${M}" y="${y}" width="${COL}" height="1.5" fill="${INK}" fill-opacity="0.2"/>`,
  );

  /* Strapline. */
  y += 74;
  const strapSize = 41;
  for (const text of wrapBalanced(copy.strapline, BODY, strapSize, COL)) {
    const line = { x: M, y, text, family: BODY, size: strapSize };
    parts.push(textLine({ ...line, fill: INK, opacity: 0.92 }));
    boxes.push(boxFor("strapline", line, INK));
    y += strapSize * 1.32;
  }

  /* Facts, and the RSVP pill beside them. */
  y += 44;
  const when = [copy.date, copy.time].filter(Boolean).join("   ·   ");
  const facts: [string, number, number][] = [
    [when, 32, 1],
    [copy.venue, 32, 0.8],
    [copy.address ?? "", 26, 0.58],
  ];

  for (const [text, size, opacity] of facts) {
    if (!text) continue;
    const line = { x: M, y, text, family: BODY, size };
    parts.push(textLine({ ...line, fill: INK, opacity }));
    boxes.push(boxFor("facts", line, INK));
    y += size * 1.42;
  }

  if (copy.hasRsvp) {
    const label = "RSVP TODAY";
    const size = 42;
    const track = size * 0.07;
    const textW =
      (measure(label, DISPLAY).width * size) / 100 + track * (label.length - 1);
    const padX = 54;
    const padY = 30;
    const capH = (measure(label, DISPLAY).height * size) / 100;
    const boxW = textW + padX * 2;
    const boxH = capH + padY * 2;
    const boxX = W - M - boxW;
    const boxY = 1820;

    parts.push(
      `<rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${boxH / 2}" fill="${ACCENT}"/>`,
    );
    parts.push(
      textLine({
        x: boxX + padX,
        y: boxY + padY + capH,
        text: label,
        family: DISPLAY,
        size,
        letterSpacing: track,
        fill: INK,
      }),
    );
    // Not gated: it is white on a solid accent fill of known contrast, not on
    // the photograph. Gating it would sample the pill, not the ground.
  }

  return {
    width: W,
    height: H,
    boxes,
    crop: { top: 0, bottom: 1 },
    scrim: frame(W, H, scrim),
    type: frame(W, H, parts.join("\n")),
  };
}

/**
 * The cover: 1080×1350, and a genuinely different composition.
 *
 * COVER_SAFE is why. `coverImage` is rendered at five aspect ratios, and each
 * keeps a different band of the 1350:
 *
 *   event-detail/event-header.tsx     ~2.2:1 centre   → 427–922   (top bound)
 *   events/event-card.tsx              16:9 centre    → 371–979
 *   home/events-showcase-section.tsx   1:1 centre @md → 135–1215
 *   home/events-showcase-section.tsx   4:3 object-top → 0–810     (bottom bound)
 *   events/featured-event-hero.tsx     4:5            → full
 *
 * The intersection is 427–810, tightened to 445–778 here: at the raw limit the
 * last display line cleared the 4:3 crop by 15px, which is inside the tolerance
 * but reads as type falling off the bottom of an event card.
 *
 * Two consequences follow and neither is cosmetic: there is NO logo lockup at
 * the top (16:9 cuts the whole strip off, so it moves to the bottom band), and
 * `titleTail` is promoted to a small kicker ABOVE the display lines instead of
 * trailing below them, where it would fall out of the band entirely. The
 * subtitle is dropped — the detail page renders it as live HTML directly over
 * this image, so repeating it here would double it.
 */
const COVER_SAFE = { top: 445, bottom: 778 };

function coverLayout(copy: PosterCopy): Layout {
  const W = 1080;
  const H = 1350;
  const M = 72;
  const COL = W - M * 2;

  const boxes: TextBox[] = [];
  const parts: string[] = [];

  /* A band, not a floor: the headline sits mid-frame, so the scrim has to
     darken the middle while leaving the fibre light in the top third — which is
     all the 1:1 and 4:5 crops really show. */
  const scrim = `<defs>
    <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CANVAS}" stop-opacity="0"/>
      <stop offset="0.17" stop-color="${CANVAS}" stop-opacity="0.80"/>
      <stop offset="0.45" stop-color="${CANVAS}" stop-opacity="0.90"/>
      <stop offset="1" stop-color="${CANVAS}" stop-opacity="0.96"/>
    </linearGradient>
    <radialGradient id="cglow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.15"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="300" width="${W}" height="${H - 300}" fill="url(#band)"/>
  <ellipse cx="${M + 140}" cy="700" rx="620" ry="340" fill="url(#cglow)"/>`;

  /* Kicker, promoted above the display lines. The baseline is what is written
     down, and the ink starts a cap height ABOVE it — so this number has to sit
     far enough down that the box clears COVER_SAFE.top. At 470 it cleared by
     −1px, which is precisely the miss the assertion at the end of this function
     exists to catch. */
  const KICKER_BASELINE = 492;
  if (copy.titleTail) {
    const kicker = copy.titleTail.toUpperCase();
    // No `label` — a kicker is meant to cap; see the poster's subtitle.
    const fit = fitSize({
      text: kicker,
      family: DISPLAY,
      maxWidth: COL * 0.78,
      maxSize: 48,
      trackEm: 0.04,
    });
    const line = {
      x: M,
      y: KICKER_BASELINE,
      text: kicker,
      family: DISPLAY,
      size: fit.size,
      letterSpacing: fit.letterSpacing,
    };
    parts.push(textLine({ ...line, fill: SPARK }));
    boxes.push(boxFor("cover kicker", line, SPARK));
  }

  /* Split on the comma HERE and only here. On the poster the two display lines
     are the title's own halves either side of its dash; the cover has 367px of
     safe band to work in and needs the lead itself to break, and its comma is
     the only honest place to do that. */
  const lead = copy.titleLead.split(/,\s*/).filter(Boolean);
  const displayLines =
    lead.length > 1 ? lead.map((l, i) => (i < lead.length - 1 ? `${l},` : l)) : lead;

  /* THE COVER IS SOLVED FROM THE BAND, NOT THE COLUMN — the opposite of the
     poster, and the reason the two layouts cannot be one composition cropped
     twice. 936px of column would set these lines at 200pt; two 200pt lines plus
     the kicker need ~380px of height and the safe band is 367. Height is what
     binds here, so height is what the size is solved from, and the column is
     only a ceiling. */
  const gap = 56;
  const available = COVER_SAFE.bottom - KICKER_BASELINE - gap;
  const inkEm = Math.max(...displayLines.map((t) => measure(t, DISPLAY).height)) / 100;
  const byBand = available / ((displayLines.length - 1) * 0.86 + inkEm + 0.08);
  const byColumn = Math.min(
    ...displayLines.map(
      (text) => fitSize({ text, family: DISPLAY, maxWidth: COL, maxSize: 240 }).size,
    ),
  );
  const size = Math.min(byBand, byColumn);
  console.log(
    `  cover display: ${size.toFixed(0)}pt (band allows ${byBand.toFixed(0)}, column allows ${byColumn.toFixed(0)})`,
  );

  // Last baseline sits a padding above the band's floor, because `boxFor` pads
  // the box below the baseline too and it is the BOX that has to clear.
  let y = COVER_SAFE.bottom - size * 0.05 - (displayLines.length - 1) * size * 0.86;
  for (const text of displayLines) {
    const line = { x: M, y, text, family: DISPLAY, size };
    parts.push(textLine({ ...line, fill: INK }));
    boxes.push(boxFor(`cover title "${text}"`, line, INK));
    y += size * 0.86;
  }

  /* Below the safe band: hairline, facts, lockup, pill. */
  y = COVER_SAFE.bottom + 78;
  parts.push(
    `<rect x="${M}" y="${y}" width="${COL}" height="1.5" fill="${INK}" fill-opacity="0.2"/>`,
  );

  y += 58;
  const when = [copy.date, copy.time].filter(Boolean).join("   ·   ");
  for (const [text, s, o] of [
    [when, 29, 1],
    [copy.venue, 29, 0.8],
  ] as [string, number, number][]) {
    if (!text) continue;
    const line = { x: M, y, text, family: BODY, size: s };
    parts.push(textLine({ ...line, fill: INK, opacity: o }));
    boxes.push(boxFor("cover facts", line, INK));
    y += s * 1.4;
  }

  const mark = lockup(copy, M, 1188, 168);
  parts.push(mark.markup);

  if (copy.hasRsvp) {
    const label = "RSVP TODAY";
    const s = 33;
    const track = s * 0.07;
    const textW = (measure(label, DISPLAY).width * s) / 100 + track * (label.length - 1);
    const capH = (measure(label, DISPLAY).height * s) / 100;
    const padX = 42;
    const padY = 24;
    const boxW = textW + padX * 2;
    const boxH = capH + padY * 2;
    const boxX = W - M - boxW;
    const boxY = 1188 + (mark.height - boxH) / 2;

    parts.push(
      `<rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${boxH / 2}" fill="${ACCENT}"/>`,
    );
    parts.push(
      textLine({
        x: boxX + padX,
        y: boxY + padY + capH,
        text: label,
        family: DISPLAY,
        size: s,
        letterSpacing: track,
        fill: INK,
      }),
    );
  }

  /* The band is asserted, not commented. It is the constraint most likely to be
     broken silently by a future copy edit, and the only place the breakage
     shows is an event card nobody thinks to look at. */
  for (const box of boxes) {
    if (!box.name.startsWith("cover title") && !box.name.startsWith("cover kicker")) continue;
    if (box.top < COVER_SAFE.top || box.top + box.height > COVER_SAFE.bottom) {
      throw new Error(
        `"${box.name}" spans y ${box.top}–${box.top + box.height}, outside the cover's ` +
          `safe band ${COVER_SAFE.top}–${COVER_SAFE.bottom}. It would be cropped away by ` +
          `event-card.tsx (16:9) or events-showcase-section.tsx (4:3 top).`,
      );
    }
  }

  return {
    width: W,
    height: H,
    boxes,
    // Taken from below the top: the cover has no top lockup, so the plate's top
    // strip is the expendable end and dropping it pushes the braid down into
    // the part of the frame the 1:1 and 4:5 crops actually show.
    crop: { top: 0.167, bottom: 1 },
    scrim: frame(W, H, scrim),
    type: frame(W, H, parts.join("\n")),
  };
}

function frame(w: number, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n${body}\n</svg>`;
}

/* ---------------------------------------------------------------- pipeline */

/**
 * Plate → ground, at the layout's exact pixel size.
 *
 * `extract()` and `resize()` are two separate `sharp()` calls on purpose.
 * `scripts/deck/build-keynote-plate.ts` records that sharp keeps only the LAST
 * `resize()` in a chain, so a crop followed by a scale silently discards the
 * crop; the safest reading of that is never to put the two in one chain at all.
 *
 * There is no upscale here. `--probe` established that gpt-image-2 renders
 * 2048×3072, so both targets are downscales — which is why the sharpening below
 * is as light as it is.
 */
async function ground(
  plate: string,
  layout: Layout,
): Promise<Buffer> {
  const meta = await sharp(plate).metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;

  const window = {
    top: Math.round(srcH * layout.crop.top),
    height: Math.round(srcH * (layout.crop.bottom - layout.crop.top)),
  };

  // Centre a window of the layout's aspect ratio inside the allowed rows.
  const want = Math.round(srcW / (layout.width / layout.height));
  const height = Math.min(want, window.height);
  const top = window.top + Math.round((window.height - height) / 2);

  const cropped = await sharp(plate)
    .extract({ left: 0, top, width: srcW, height })
    .png()
    .toBuffer();

  const scaled = await sharp(cropped)
    .resize(layout.width, layout.height, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.6, m1: 0.3, m2: 0.7 })
    .png()
    .toBuffer();

  /* Grain does three jobs at once and only one of them is texture: it dithers
     the near-black gradients that would otherwise band visibly in 8-bit WebP,
     it carries the file into the 100–250 kB size band a flat near-black frame
     falls below, and it delivers the "fine natural film grain" the plate prompt
     asked the generator for. */
  const grain = await sharp({
    create: {
      width: layout.width,
      height: layout.height,
      channels: 3,
      background: "#808080",
      noise: { type: "gaussian", mean: 128, sigma: 6 },
    },
  })
    .blur(0.4)
    .png()
    .toBuffer();

  return sharp(scaled)
    .composite([{ input: grain, blend: "overlay" }])
    .png()
    .toBuffer();
}

/**
 * Refuses to ship type nobody can read.
 *
 * Two assertions rather than one, because the mean hides the failure that
 * actually happens here. A single bright fibre running through a counter barely
 * moves the average of a box while making the word it crosses unreadable, so
 * the peak is checked separately.
 *
 * Note the `.toBuffer()` between `extract()` and `stats()`: **`sharp().stats()`
 * reads the input image and ignores the queued pipeline**, so measuring a box
 * without rendering the crop first silently measures the whole poster. That bug
 * is why the plate generator's first run reported two different regions as
 * identical to three decimals.
 */
async function gate(image: Buffer, boxes: TextBox[]): Promise<void> {
  const meta = await sharp(image).metadata();
  const failures: string[] = [];

  for (const box of boxes) {
    const left = Math.max(0, box.left);
    const top = Math.max(0, box.top);
    const width = Math.min(box.width, (meta.width ?? 0) - left);
    const height = Math.min(box.height, (meta.height ?? 0) - top);
    if (width <= 0 || height <= 0) continue;

    const crop = await sharp(image)
      .extract({ left, top, width, height })
      .toBuffer();
    const stats = await sharp(crop).stats();

    const hex = (pick: (c: (typeof stats.channels)[0]) => number) =>
      "#" +
      stats.channels
        .slice(0, 3)
        .map((c) => Math.round(pick(c)).toString(16).padStart(2, "0"))
        .join("");

    const mean = hex((c) => c.mean);
    const ratio = contrastRatio(box.ink, mean);
    const peak = relativeLuminance(hex((c) => c.max));

    const verdict =
      ratio < 4.5
        ? `contrast ${ratio.toFixed(2)}:1 against ${mean}`
        : peak > 0.42
          ? `a highlight at luminance ${peak.toFixed(2)} runs through it`
          : "";

    console.log(
      `  ${verdict ? "✗" : "✓"} ${box.name.padEnd(34)} ${ratio.toFixed(2)}:1 on ${mean}  peak ${peak.toFixed(2)}`,
    );
    if (verdict) failures.push(`${box.name} — ${verdict}`);
  }

  if (failures.length) {
    throw new Error(
      `Type would be hard to read:\n  ${failures.join("\n  ")}\n` +
        "Deepen the scrim, move the line, or choose a plate with darker ground under it.",
    );
  }
}

/**
 * Encodes to WebP inside the 100–250 kB band the event images convention asks
 * for, and says where it landed.
 *
 * Grain and file size are the same lever: a clean near-black frame encodes to
 * around 60 kB, under the floor. If a poster ever overshoots 250 kB, drop the
 * grain sigma before dropping quality — losing texture costs less than losing
 * the edges of the type.
 */
async function encode(image: Buffer, file: string): Promise<void> {
  const MIN = 100 * 1024;
  const MAX = 250 * 1024;
  let quality = 82;
  let out = Buffer.alloc(0);

  for (let attempt = 0; attempt < 5; attempt++) {
    out = await sharp(image)
      .webp({ quality, effort: 6, smartSubsample: true })
      .toBuffer();
    if (out.length >= MIN && out.length <= MAX) break;
    quality += out.length < MIN ? 4 : -4;
    quality = Math.max(60, Math.min(96, quality));
  }

  /* `writeFileSync`, NOT `sharp(out).toFile(file)`. `out` is already encoded
     WebP; handing it back to sharp decodes and re-encodes it at sharp's default
     quality, so the file on disk is neither the buffer that was measured nor the
     quality that is about to be printed — the first version reported 101 kB at
     q86 and wrote 80 kB, below the floor the loop had just worked to clear, with
     a generation of loss for free. Encode once, write those bytes. */
  writeFileSync(file, out);
  console.log(
    `  → ${path.relative(ROOT, file)} — ${Math.round(out.length / 1024)} kB at q${quality}`,
  );
}

/**
 * The crop previews. These, not the full poster, are what a review actually
 * looks at: each mirrors one component's `object-cover` and is the only way to
 * see what a visitor sees.
 */
async function previews(cover: Buffer, poster: Buffer, slug: string): Promise<void> {
  mkdirSync(REVIEW_DIR, { recursive: true });

  const crops: [string, number, number, "centre" | "top"][] = [
    ["cover-16x9", 1080, 608, "centre"], // events/event-card.tsx
    ["cover-4x3", 1080, 810, "top"], // home/events-showcase-section.tsx
    ["cover-1x1", 1080, 1080, "centre"], // …the same, at md
    ["cover-21x9", 1080, 495, "centre"], // event-detail/event-header.tsx, worst case
  ];

  for (const [name, w, h, position] of crops) {
    const top = position === "top" ? 0 : Math.round((1350 - h) / 2);
    const cut = await sharp(cover)
      .extract({ left: 0, top, width: w, height: h })
      .png()
      .toBuffer();
    // Separate call — see the one-resize() gotcha above.
    await sharp(cut)
      .resize(900)
      .webp({ quality: 82 })
      .toFile(path.join(REVIEW_DIR, `${slug}-${name}.webp`));
  }

  await sharp(poster)
    .resize(700)
    .webp({ quality: 82 })
    .toFile(path.join(REVIEW_DIR, `${slug}-poster-thumb.webp`));

  console.log(`  → ${path.relative(ROOT, REVIEW_DIR)}/ (5 crop previews)`);
}

/* --------------------------------------------------------------------- cli */

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const flag = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  // The first bare word that is not itself a flag's value.
  const slug = argv.find(
    (a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"),
  );
  const plate = flag("plate");
  const suffix = flag("suffix") ?? "v2";

  if (!slug || !plate) {
    console.error(
      "Usage: npx tsx scripts/events/build-event-poster.ts <event-slug> --plate <file.png> [--suffix v2]",
    );
    process.exit(1);
  }
  if (!existsSync(plate)) {
    console.error(`Plate not found: ${plate}`);
    process.exit(1);
  }

  assertFamiliesDistinct();
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`${slug}\n  plate: ${plate}`);
  const copy = copyFor(slug);

  for (const [name, layout] of [
    ["poster", posterLayout(copy)],
    ["cover", coverLayout(copy)],
  ] as [string, Layout][]) {
    console.log(`\n${name} ${layout.width}×${layout.height}`);

    // Plate → scrim → GATE → type. The gate has to sit between the scrim and
    // the type, because the ground it is asked about is the scrimmed one.
    const base = await sharp(await ground(plate, layout))
      .composite([{ input: renderLayer(layout.scrim) }])
      .png()
      .toBuffer();

    if (!argv.includes("--no-gate")) await gate(base, layout.boxes);

    const composed = await sharp(base)
      .composite([{ input: renderLayer(layout.type) }])
      .png()
      .toBuffer();

    await encode(composed, path.join(OUT_DIR, `${slug}-${name}-${suffix}.webp`));

    if (name === "cover") {
      const poster = await sharp(
        path.join(OUT_DIR, `${slug}-poster-${suffix}.webp`),
      )
        .png()
        .toBuffer();
      await previews(composed, poster, slug);
    }
  }
}

main().catch((error) => {
  console.error(`\n${(error as Error).message}`);
  process.exit(1);
});
