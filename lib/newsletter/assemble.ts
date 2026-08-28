/**
 * Builds the machine-owned `auto` block of a monthly newsletter issue.
 *
 * The `auto` block is a snapshot of live site data (events + stats) taken at
 * generation time. It is refreshed freely on every (re)generation, unlike the
 * human-owned `editorial` block. See `lib/newsletter/schema.ts`.
 */

import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

import { getAllEvents, parseDateString } from "@/lib/data/events";
import { globalStats } from "@/lib/data/stats";
import { absoluteUrl } from "@/lib/seo/site";
import type { EventV3 } from "@/types/event";
import type { AutoEvent, IssueAuto } from "./schema";
import { toEmailSafeAsset } from "./email-assets";

/** IANA zone every She Sharp event is scheduled in. */
const EVENT_TIME_ZONE = "Pacific/Auckland";

/** Max events surfaced in each section of the email. */
const RECAP_CAP = 5;
const UPCOMING_CAP = 4;

/**
 * Absolutizes a site-relative asset path (e.g. "/img/events/x.png"); returns
 * null for empty/missing values. Already-absolute URLs are passed through.
 */
function toAbsoluteAsset(path: string | undefined | null): string | null {
  const trimmed = path?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return absoluteUrl(trimmed);
}

/** Returns the trimmed string, or null when empty/missing. */
function nullIfEmpty(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Builds "Thursday, July 30" from an EventV3's date field. */
function formatDateLabel(event: EventV3): string {
  return parseDateString(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Builds a human-readable location label:
 *  - in_person / hybrid → "VenueName, City" (falls back to whichever exists)
 *  - online             → "Online"
 *  - otherwise / unknown → null
 */
function formatLocationLabel(event: EventV3): string | null {
  const { format: locationFormat, venueName, city } = event.detailPageData.location;

  if (locationFormat === "online") return "Online";

  if (locationFormat === "in_person" || locationFormat === "hybrid") {
    const parts = [venueName, city]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(", ") : null;
  }

  return null;
}

/**
 * Best-effort ISO 8601 start instant (with the Pacific/Auckland offset) built
 * from the event date and the first clock time found in `detailPageData.time`
 * (e.g. "2:30pm - 4:30pm NZST"). Returns null when no time can be parsed.
 */
function computeStartIso(event: EventV3): string | null {
  const timeText = event.detailPageData.time ?? "";
  const match = timeText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3].toLowerCase();

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  const date = parseDateString(event.date);
  const zoned = new TZDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    EVENT_TIME_ZONE
  );

  return format(zoned, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/** Snapshots an EventV3 into the email-ready AutoEvent shape (all URLs absolute). */
function toAutoEvent(event: EventV3): AutoEvent {
  return {
    slug: event.slug,
    title: event.title,
    dateLabel: formatDateLabel(event),
    startIso: computeStartIso(event),
    timeLabel: nullIfEmpty(event.detailPageData.time),
    locationLabel: formatLocationLabel(event),
    // Mapped to the email-safe JPEG twin before absolutizing: the site serves
    // WebP, which Outlook cannot decode at all. See lib/newsletter/email-assets.ts.
    coverImageUrl: toAbsoluteAsset(toEmailSafeAsset(event.coverImage?.url)),
    url: absoluteUrl(`/events/${event.slug}`),
    registrationUrl: nullIfEmpty(event.detailPageData.registrationUrl),
    shortDescription: nullIfEmpty(event.shortDescription),
  };
}

/**
 * Builds the `auto` snapshot for the issue dated `year`-`month` (month 1-12).
 *
 * - recapEvents: events dated within the issue month (already happened by the
 *   last-Thursday send date), ascending, capped at 5.
 * - upcomingEvents: events strictly after the issue month, nearest-first,
 *   capped at 4.
 * - stats: current org headline figures formatted as "3000+" etc.
 */
export function assembleAutoData(year: number, month: number): IssueAuto {
  const monthIndex = month - 1;
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

  const events = getAllEvents();

  const recapEvents = events
    .filter((event) => {
      const date = parseDateString(event.date);
      return date.getFullYear() === year && date.getMonth() === monthIndex;
    })
    .sort(
      (a, b) =>
        parseDateString(a.date).getTime() - parseDateString(b.date).getTime()
    )
    .slice(0, RECAP_CAP)
    .map(toAutoEvent);

  const upcomingEvents = events
    .filter((event) => parseDateString(event.date).getTime() > monthEnd.getTime())
    .sort(
      (a, b) =>
        parseDateString(a.date).getTime() - parseDateString(b.date).getTime()
    )
    .slice(0, UPCOMING_CAP)
    .map(toAutoEvent);

  return {
    recapEvents,
    upcomingEvents,
    stats: {
      members: `${globalStats.members.current}+`,
      sponsors: `${globalStats.sponsors.current}+`,
      events: `${globalStats.events.total}+`,
    },
    // Populated by the local photo pipeline (scripts/newsletter/photos.ts);
    // the serverless cron cannot run ffmpeg/harvesting, so it starts empty.
    photoStrip: [],
    photoAlbumUrl: null,
  };
}
