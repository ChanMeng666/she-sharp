/**
 * Deck helpers shared by the builders, the viewer, and the offline scripts.
 */

import type { Deck, DeckImage, Slide, SlideTone, TimedItem } from "./types";

/**
 * Default tone per slide type.
 *
 * Dark carries the moments that want the room to go quiet — the opening, the
 * chapter breaks, the karakia, the prize reveal. Everything informational is
 * light, matching the site's editorial system.
 */
export function slideDefaultTone(slide: Slide): SlideTone {
  switch (slide.type) {
    case "title":
    case "karakia":
    case "section":
    case "break":
    /* A team photograph is pillarboxed by construction — portrait source, a
       landscape stage — so the canvas around it is on screen either way, and a
       projector throwing white either side of a photograph is the one that
       makes the photograph look like a mistake. Dark also puts these inside the
       chapter they belong to: the final-presentations divider is dark, and the
       pitch clock between them is dark. */
    case "team-photo":
      return "dark";
    default:
      return "light";
  }
}

/** Resolved tone for a slide, honouring an explicit override. */
export function toneOf(slide: Slide): SlideTone {
  return slide.tone ?? slideDefaultTone(slide);
}

/** One clock reading: `5`, `5:30`, `5pm`, `5:30pm`, `12:15 PM`. */
const CLOCK = String.raw`\d{1,2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?`;

/** Words that join the two halves of a range: `5:00–5:30`, `5:00pm to 5:30pm`. */
const RANGE_JOIN = String.raw`\s*(?:[–—-]|to|until|till)\s*`;

/**
 * Words organisers put around a time that belong to it, not to the label —
 * "From 7:30pm — Closing remarks", "7:30pm onwards: Networking".
 *
 * Both carry their own `?`. Appending one at the point of use would attach it
 * to the trailing quantifier inside the group (`\s+` becoming `\s+?`) and make
 * the whole prefix mandatory instead of optional.
 */
const TIME_PREFIX = String.raw`(?:(?:from|at)\s+)?`;
const TIME_SUFFIX = String.raw`(?:\s+onwards?)?`;

/**
 * A run-sheet line: a leading time (optionally a range), a separator, a label.
 *
 * Anchoring the time and consuming it *whole* is the entire point. The previous
 * implementation split on the first spaced dash, which works only when the
 * range itself has no spaces (`5:00–5:30pm — Doors`). Three of the five real
 * She Sharp run sheets are written `5:00pm – 5:30pm — Doors`, where that split
 * lands inside the range and leaves the end time glued to the front of the
 * label — projecting "5:30pm — Registration" for a block that opens at 5:00.
 * It read as correct from the back of the room, which is why it survived.
 *
 * A colon counts as a label separator only when whitespace follows it. Without
 * that guard the engine backtracks into the clock itself: `8:00pm Close of day
 * one` has no separator at all, but the regex would match the time as `8`, the
 * separator as the colon inside it, and the label as `00pm Close of day one`.
 * The colon in a clock is always followed by a digit; the colon in `5:30pm:
 * Doors open` never is.
 */
const TIMED_LINE = new RegExp(
  `^(${TIME_PREFIX}${CLOCK}(?:${RANGE_JOIN}${CLOCK})?${TIME_SUFFIX})` +
    String.raw`\s*(?:[—–-]|:(?=\s))\s*` +
    `(.+)$`,
  "i",
);

/**
 * Splits a run-sheet line such as `"5:30–5:40pm — Event opening"` into a
 * `TimedItem`.
 *
 * The event JSON stores schedules as prose lines; this is the one place that
 * knows their shape. Returns `null` when the line does not start with a
 * recognisable time, so callers can fail loudly instead of rendering an empty
 * row — and so a prose paragraph that merely mentions a time is not mistaken
 * for a schedule.
 */
export function parseTimedLine(line: string): TimedItem | null {
  const match = TIMED_LINE.exec(line.trim());
  if (!match) return null;

  const time = match[1].trim().replace(/\s+/g, " ");
  const label = match[2].trim();
  if (!time || !label) return null;

  return { time, label };
}

/**
 * Parses a list of run-sheet lines, throwing on the first unparseable one.
 *
 * Deck data is authored once and projected in front of a room; a silently
 * dropped row is worse than a build failure.
 */
export function parseTimedLines(lines: string[]): TimedItem[] {
  return lines.map((line) => {
    const item = parseTimedLine(line);
    if (!item) {
      throw new Error(`Could not parse a time from run-sheet line: "${line}"`);
    }
    return item;
  });
}

/**
 * Returns `slides` with `additions` spliced in directly after the slide `id`.
 *
 * The opening and closing sequences arrive from `boilerplate.ts` as finished
 * arrays, which is the point of them — but an event occasionally needs a slide
 * *inside* one, and appending after the spread puts it in the wrong chapter.
 * A venue's own host introduced before the safety briefing has to precede the
 * briefing; a keynote billed with the welcome has to sit with the welcome.
 *
 * Throws on an unknown id rather than returning the array unchanged. The
 * failure this guards against is a boilerplate slide being renamed and an
 * event's own content quietly disappearing from the deck, which nobody notices
 * until it is not on the projector.
 */
export function insertAfter(
  slides: Slide[],
  id: string,
  ...additions: Slide[]
): Slide[] {
  const index = slides.findIndex((slide) => slide.id === id);
  if (index === -1) {
    throw new Error(
      `Cannot insert after "${id}": no slide with that id. Boilerplate ids are defined in lib/deck/boilerplate.ts.`,
    );
  }
  return [...slides.slice(0, index + 1), ...additions, ...slides.slice(index + 1)];
}

/** Every image path a deck will request, in slide order, de-duplicated. */
export function collectDeckImages(deck: Deck): string[] {
  const paths: string[] = [];
  const push = (src?: string) => {
    if (src) paths.push(src);
  };
  const pushImage = (image?: DeckImage) => push(image?.src);

  if (deck.theme.darkBackground) pushImage(deck.theme.darkBackground);

  for (const slide of deck.slides) {
    switch (slide.type) {
      case "title":
        slide.logos?.forEach((logo) => push(logo.logo));
        break;
      case "karakia":
      case "section":
      case "break":
        pushImage(slide.background);
        break;
      case "bullets":
        pushImage(slide.image);
        break;
      case "people":
        slide.people.forEach((person) => push(person.image));
        break;
      case "photo":
        pushImage(slide.image);
        break;
      case "photo-grid":
        slide.images.forEach(pushImage);
        break;
      case "stats":
        pushImage(slide.image);
        break;
      case "logos":
        slide.groups.forEach((group) =>
          group.logos.forEach((logo) => push(logo.logo)),
        );
        break;
      case "qr-cta":
        push(slide.qr.image);
        break;
      case "contact":
        slide.qrs.forEach((qr) => push(qr.image));
        break;
      case "upcoming":
        slide.events.forEach((event) => pushImage(event.image));
        push(slide.qr?.image);
        break;
      case "thanks":
        slide.groups.forEach((group) =>
          group.logos.forEach((logo) => push(logo.logo)),
        );
        break;
      default:
        break;
    }
  }

  return Array.from(new Set(paths));
}

/** Screen-reader label announced when a slide becomes current. */
export function slideAriaLabel(slide: Slide, index: number, total: number): string {
  const title =
    "title" in slide && slide.title ? slide.title : slide.id.replace(/-/g, " ");
  return `Slide ${index + 1} of ${total}: ${title}`;
}

/** Short label used in the overview grid and the print header. */
export function slideLabel(slide: Slide): string {
  if ("title" in slide && slide.title) return slide.title;
  if (slide.type === "photo" && slide.lead) return slide.lead;
  return slide.id.replace(/-/g, " ");
}

/** Groups slides by their `section` for the overview grid, preserving order. */
export function groupSlides(
  slides: Slide[],
): { section: string; slides: { slide: Slide; index: number }[] }[] {
  const groups: {
    section: string;
    slides: { slide: Slide; index: number }[];
  }[] = [];

  slides.forEach((slide, index) => {
    const section = slide.section ?? "";
    const last = groups[groups.length - 1];
    if (last && last.section === section) {
      last.slides.push({ slide, index });
    } else {
      groups.push({ section, slides: [{ slide, index }] });
    }
  });

  return groups;
}
