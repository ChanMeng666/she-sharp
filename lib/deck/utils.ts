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
      return "dark";
    default:
      return "light";
  }
}

/** Resolved tone for a slide, honouring an explicit override. */
export function toneOf(slide: Slide): SlideTone {
  return slide.tone ?? slideDefaultTone(slide);
}

/** Separators used between a clock time and its label in the source data. */
const TIME_SEPARATOR = /\s+[—–-]\s+/;

/**
 * Splits a run-sheet line such as `"5:30–5:40pm — Event opening"` into a
 * `TimedItem`.
 *
 * The event JSON stores schedules as prose lines; this is the one place that
 * knows their shape. Returns `null` when the line has no recognisable time, so
 * callers can fail loudly instead of rendering an empty row.
 */
export function parseTimedLine(line: string): TimedItem | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(TIME_SEPARATOR);
  if (parts.length < 2) return null;

  const time = parts[0].trim();
  const label = parts.slice(1).join(" — ").trim();
  if (!time || !label) return null;
  if (!/\d/.test(time)) return null;

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
