/**
 * The one adapter between an event in `events-custom.json` and a slide deck.
 *
 * Event data is the single source of truth for the whole site: the public
 * event page, the deck, the posters. A deck therefore never restates a fact it
 * could read — a speaker's job title is corrected in the JSON and both the
 * website and the projector change together. Every accessor here is called at
 * module scope inside a deck file, so the derivation happens on every build.
 *
 * Two rules run through all of it:
 *
 *  - **Absent data degrades, malformed data throws.** A missing run sheet is a
 *    smaller deck; a run sheet whose rows cannot be read is a build failure.
 *    Silently projecting an empty table is the one outcome nobody can recover
 *    from at the front of a room.
 *  - **An empty string is not a path.** `""` reaches `deck-image.tsx` as a
 *    broken image and fails `scripts/verify-image-paths.ts`; it is coerced to
 *    `undefined` at every boundary here rather than at each call site.
 */

import { formatEventDate, getEventBySlug } from "@/lib/data/events";
import type {
  EventSpeakerGroup,
  EventSpeakerV3,
  EventV3,
} from "@/types/event";

import { COPY_LIMITS } from "./lint";
import type { DeckImage, DeckLogo, PersonItem, TimedItem } from "./types";
import { parseTimedLine } from "./utils";

/** Trims to at most `max` words, dropping any dangling punctuation. */
function truncateWords(text: string, max: number): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= max) return text.trim();
  return parts.slice(0, max).join(" ").replace(/[,;:—–-]+$/, "");
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** `""`, `"   "` and `undefined` all mean "there is no image here". */
function imagePath(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Loads the event behind a deck, or explains what to do about it.
 *
 * The error names the file rather than the function because the person who
 * hits it is usually an organiser running the scaffold, not a developer.
 */
export function loadEventForDeck(slug: string): EventV3 {
  const event = getEventBySlug(slug);
  if (!event) {
    throw new Error(
      `No event with slug "${slug}" in lib/data/json/events-custom.json. ` +
        "Add the event first — the `sync-event-from-slack` skill puts it there.",
    );
  }
  return event;
}

/**
 * The event title, cut down to something that fits a slide headline.
 *
 * Event titles carry the host, the partner and the venue ("Her Waka (May
 * 2026) — Cybersecurity Workshop"); a headline carries the event. Cut at the
 * first spaced dash, and only if that is still too long, at a colon.
 *
 * **Never cut at a comma.** That is what the previous implementation did, and
 * it turned "No Pain, All Gain – Getting Fit for AI" into "No Pain" — a
 * headline that means nothing, projected three metres high. Commas fall inside
 * titles far more often than they separate them.
 */
export function deckTitleFrom(event: EventV3): string {
  const full = event.title.trim();

  const afterDash = full.split(/\s+[—–-]\s+/)[0].trim();
  if (wordCount(afterDash) <= COPY_LIMITS.titleWords) return afterDash;

  const afterColon = afterDash.split(":")[0].trim();
  if (wordCount(afterColon) <= COPY_LIMITS.titleWords) return afterColon;

  return truncateWords(afterColon, COPY_LIMITS.titleWords);
}

/** The event's own subtitle, when it has one worth showing. */
export function deckSubtitleFrom(event: EventV3): string | undefined {
  const subtitle = event.detailPageData.subtitle?.trim();
  return subtitle || undefined;
}

/**
 * Timezone suffixes are for a calendar invitation, not for a wall.
 *
 * Everyone in the room is in the same timezone as the projector.
 */
function tidyTimeRange(time: string): string {
  return time
    .replace(/\s*\(\s*(NZST|NZDT|NZT)\s*\)/gi, "")
    .replace(/\s*\b(NZST|NZDT|NZT)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/[\s,]+$/, "")
    .trim();
}

/**
 * Up to three facts for under the headline: the date, the time, the venue.
 *
 * The date comes first and is not negotiable. The previous implementation
 * preferred `detailPageData.time` and fell back to the date only when time was
 * missing, so every evening event — all of which have a time — put
 * "5:00pm – 7:30pm NZST" on the title slide and never said which day it was.
 * It looked correct because the hackathon, the only deck that existed, happens
 * to embed its dates inside the time string.
 *
 * The city is deliberately dropped: it is third of three, and `venueName`
 * already contains it in almost every event.
 */
export function deckMetaFrom(event: EventV3): string[] {
  const detail = event.detailPageData;
  const time = detail.time ? tidyTimeRange(detail.time) : undefined;

  return [formatEventDate(event, "full"), time, detail.location?.venueName]
    .filter((value): value is string => !!value && value.trim().length > 0)
    .slice(0, COPY_LIMITS.titleMetaMax);
}

/** A run sheet, plus whatever in the same section was not a timed row. */
export interface RunSheet {
  /** The `specialSections` title it came from, for the read-back. */
  sectionTitle?: string;
  items: TimedItem[];
  /** Lines in the same section that carried no time — usually a footer note. */
  skipped: string[];
}

/**
 * Finds the run sheet by reading the lines, never by trusting `type`.
 *
 * `specialSections[].type` is written by the Slack sync and is not reliable:
 * `making-linkedin-work-for-you-with-stuart-little` files a list of learning
 * outcomes as `type: "agenda"` with no times in it at all, and the section
 * title varies between "Event Format", "Event Flow" and "Two-Day Format". The
 * only dependable signal is whether the lines actually parse as times.
 *
 * A section qualifies on both counts — at least three rows parse, and most of
 * the section parses — so that a genuine schedule with one prose footer is
 * still a schedule, while a prose section that happens to mention two times is
 * not.
 */
export function runSheetFrom(event: EventV3): RunSheet {
  const sections = event.detailPageData.specialSections ?? [];

  for (const section of sections) {
    const content = section.content ?? [];
    if (content.length === 0) continue;

    const parsed = content.map((line) => ({ line, item: parseTimedLine(line) }));
    const rows = parsed.filter((entry) => entry.item);
    if (rows.length < 3) continue;
    if (rows.length / content.length < 0.6) continue;

    return {
      sectionTitle: section.title,
      items: rows.map((entry) => entry.item as TimedItem),
      skipped: parsed.filter((entry) => !entry.item).map((entry) => entry.line),
    };
  }

  return { items: [], skipped: [] };
}

/** The first run-sheet row whose label matches, for locating a moment. */
export function findRow(sheet: RunSheet, pattern: RegExp): TimedItem | undefined {
  return sheet.items.find((item) => pattern.test(item.label));
}

/**
 * The first row matching the most specific pattern that matches anything.
 *
 * Order matters more than it looks. Searching one loose pattern for the
 * table-discussion block — `/roundtable|table discussion|discussion/i` — finds
 * "Kickoff and panel discussion" at 5:30 before "Roundtable discussions" at
 * 6:15, and the deck then projects a 45-minute countdown over a 15-minute
 * exercise. The clock on the wall is the thing a room actually obeys, so it
 * has to come from the right row.
 */
export function findRowByPatterns(
  sheet: RunSheet,
  patterns: readonly RegExp[],
): TimedItem | undefined {
  for (const pattern of patterns) {
    const row = findRow(sheet, pattern);
    if (row) return row;
  }
  return undefined;
}

/** Minutes in `"6:15pm – 6:30pm"`, or `undefined` when it is not a range. */
export function minutesOf(time: string): number | undefined {
  const clock = /(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?/gi;
  const found: { hour: number; minute: number; meridiem?: string }[] = [];

  for (const match of time.matchAll(clock)) {
    found.push({
      hour: Number(match[1]),
      minute: Number(match[2] ?? 0),
      meridiem: match[3]?.toLowerCase(),
    });
  }
  if (found.length < 2) return undefined;

  /* An unmarked first half takes the meridiem of the second: "5:00–5:30pm". */
  const [start, end] = found;
  const endMeridiem = end.meridiem ?? start.meridiem;
  const startMeridiem = start.meridiem ?? endMeridiem;

  const to24 = (hour: number, meridiem?: string) => {
    if (meridiem === "p") return hour === 12 ? 12 : hour + 12;
    if (meridiem === "a") return hour === 12 ? 0 : hour;
    return hour;
  };

  const minutes =
    to24(end.hour, endMeridiem) * 60 +
    end.minute -
    (to24(start.hour, startMeridiem) * 60 + start.minute);

  return minutes > 0 && minutes <= 12 * 60 ? minutes : undefined;
}

/**
 * How the table-discussion block is named in a run sheet, most specific first.
 *
 * Order carries the whole meaning. One loose pattern containing `discussion`
 * finds "Panel discussion and Q&A" at 5:45 before "Roundtable discussions" at
 * 6:20, which puts the panel's thirty minutes on a clock the room is watching
 * to know how long it has to talk.
 */
export const DISCUSSION_ROW_PATTERNS: readonly RegExp[] = [
  /roundtable|round table|breakout|break-out/i,
  /table discussion|group activity|group exercise|interactive/i,
  /workshop|activity/i,
];

/** The run sheet's own row for the table discussion, if it has one. */
export function discussionRowFrom(event: EventV3): TimedItem | undefined {
  return findRowByPatterns(runSheetFrom(event), DISCUSSION_ROW_PATTERNS);
}

/**
 * Minutes the run sheet allows for the table discussion.
 *
 * Read at build time rather than frozen into the deck, so moving the block in
 * `events-custom.json` moves the countdown with it. The alternative — a number
 * baked in when the deck was generated — is a clock that keeps insisting on
 * fifteen minutes after the schedule says twenty, and the clock is the thing a
 * room obeys.
 */
export function discussionMinutesFrom(event: EventV3): number | undefined {
  const row = discussionRowFrom(event);
  return row ? minutesOf(row.time) : undefined;
}

/** One named group of people from the event, ready to put on a slide. */
export interface SpeakerGroup {
  key: string;
  /** The event's own heading, e.g. "Meet the Panel". */
  heading: string;
  people: PersonItem[];
}

/**
 * Speaker group order, fixed here rather than taken from the JSON.
 *
 * `Object.keys()` would return whatever order the Slack sync happened to
 * write, so the same event could produce a different slide order on a later
 * run. Hosts open, mentors close.
 *
 * Exported because the poster pipeline walks the same groups in the same order
 * but cannot use `speakerGroupsFrom()` below: `personFrom()` clamps a job title
 * to `COPY_LIMITS.personRoleWords` for a slide, where a person is one card in a
 * grid of four, and a poster gives the same string a whole column. Truncating
 * "Head of Finance – LM Media & Automation Lead" to six words is not a shorter
 * title, it is a wrong one. One order, two readings of the same rows.
 */
export const SPEAKER_GROUP_ORDER = [
  "hosts",
  "keynote_speakers",
  "panel_speakers",
  "panelists",
  "guest_speakers",
  "workshop_facilitators",
  "readiness_workshop_facilitators",
  "panel_facilitators",
  "demo_facilitators",
  "mentors",
] as const;

/** A speaker's role line: the job title, then the company, both clamped. */
function personFrom(speaker: EventSpeakerV3): PersonItem {
  return {
    name: speaker.name.trim(),
    role: speaker.title
      ? truncateWords(speaker.title, COPY_LIMITS.personRoleWords)
      : undefined,
    org: speaker.company?.trim() || undefined,
    image: imagePath(speaker.image),
  };
}

/** Every populated speaker group, in a stable order. */
export function speakerGroupsFrom(event: EventV3): SpeakerGroup[] {
  const speakers = event.detailPageData.speakers ?? {};

  return SPEAKER_GROUP_ORDER.flatMap((key) => {
    const group = (speakers as Record<string, EventSpeakerGroup | undefined>)[key];
    const people = (group?.speakers ?? []).filter((person) => person?.name?.trim());
    if (people.length === 0) return [];

    return [
      {
        key,
        heading: group?.heading?.trim() || "Our speakers",
        people: people.map(personFrom),
      },
    ];
  });
}

/**
 * How to lay out a given number of faces.
 *
 * The limits come from `COPY_LIMITS.peopleCount`: four faces can be large
 * enough to recognise from the back, twenty cannot.
 */
export function densityFor(count: number): {
  density: "sm" | "md" | "lg";
  shape: "circle" | "card";
} {
  if (count <= COPY_LIMITS.peopleCount.lg) return { density: "lg", shape: "card" };
  if (count <= COPY_LIMITS.peopleCount.md) return { density: "md", shape: "circle" };
  return { density: "sm", shape: "circle" };
}

/** The event's partner and host logos, main tier first. */
export function partnerLogosFrom(event: EventV3): DeckLogo[] {
  const sponsors = event.detailPageData.sponsors;
  return [...(sponsors?.main ?? []), ...(sponsors?.other ?? [])]
    .filter((sponsor) => sponsor?.name?.trim() && imagePath(sponsor.logo))
    .map((sponsor) => ({
      name: sponsor.name.trim(),
      logo: imagePath(sponsor.logo) as string,
    }));
}

/** A titled list section — "What You'll Explore", "Why Attend". */
export interface ListSection {
  title: string;
  items: string[];
}

/**
 * The first `specialSections` entry whose title or type matches, excluding any
 * section that is really the run sheet.
 */
export function listSectionFrom(
  event: EventV3,
  pattern: RegExp,
): ListSection | undefined {
  const runSheetTitle = runSheetFrom(event).sectionTitle;

  for (const section of event.detailPageData.specialSections ?? []) {
    if (section.title === runSheetTitle) continue;
    if (!pattern.test(section.title) && !pattern.test(section.type)) continue;

    const items = (section.content ?? []).map((line) => line.trim()).filter(Boolean);
    if (items.length === 0) continue;

    return { title: section.title, items };
  }

  return undefined;
}

/**
 * Shortens a list line to fit a bullet, by cutting at its own punctuation.
 *
 * Event prose is written for a web page: "How AI is impacting different roles
 * across an organisation — not just deep technical topics" is fifteen words
 * against a limit of ten. The clause after the dash or colon is almost always
 * the elaboration, so cutting there keeps the author's own words and their
 * meaning. Returns the line unchanged when it already fits, and `undefined`
 * when no cut gets it under the limit — the caller reports that rather than
 * truncating mid-thought.
 */
export function shortenBullet(
  line: string,
  max: number = COPY_LIMITS.bulletWords,
): string | undefined {
  /* Some sections carry their own glyphs — the layout draws the marker. */
  const trimmed = line
    .trim()
    .replace(/^[•●▪○◦*·\-–—]\s*/, "")
    .replace(/[.]+$/, "")
    .trim();
  if (wordCount(trimmed) <= max) return trimmed;

  for (const separator of [/\s+[—–]\s+/, /:\s+/, /,\s+/]) {
    const head = trimmed.split(separator)[0].trim();
    if (head && wordCount(head) <= max) return head;
  }

  return undefined;
}

/** The event poster, shown whole rather than cropped. */
export function posterImageFrom(event: EventV3): DeckImage | undefined {
  const poster = event.detailPageData.posters?.[0];
  const src = imagePath(poster?.url);
  if (!src) return undefined;
  return { src, alt: poster?.alt?.trim() || `${event.title} poster` };
}

/** The event's own photographs, if it has any yet. */
export function eventPhotosFrom(event: EventV3): DeckImage[] {
  const photos: DeckImage[] = [];
  for (const photo of event.detailPageData.photos ?? []) {
    const src = imagePath(photo?.url);
    if (!src) continue;
    photos.push({ src, alt: photo?.alt?.trim() || `${event.title} photograph` });
  }
  return photos;
}

/** The cover image — the poster artwork used on the site's event card. */
export function coverImageFrom(event: EventV3): DeckImage | undefined {
  const src = imagePath(event.coverImage?.url);
  if (!src) return undefined;
  return { src, alt: event.coverImage?.alt?.trim() || `${event.title} cover` };
}
