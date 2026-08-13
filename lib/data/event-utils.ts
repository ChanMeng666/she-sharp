/**
 * Event Helper Functions — record-scoped, data-free.
 *
 * Everything here works on a single event (or a single date string) and never
 * touches the event archive. That separation is load-bearing rather than
 * cosmetic: `lib/data/events.ts` imports ~960KB of JSON at module scope, so any
 * client component importing a helper from there dragged all 97 event records
 * into the browser bundle. Client components import these helpers from here;
 * `lib/data/events.ts` re-exports every one of them, so server callers and the
 * public API are unchanged.
 */

import {
  EventV3,
  EventSpeakerV3,
  EventSpeakersV3,
} from "@/types/event";

// ============================================
// Date Parsing Utilities
// ============================================

/**
 * Parse date string in format "November 21, 2025" to Date object
 */
export function parseDateString(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Check if date string represents a future date
 */
export function isFutureDate(dateStr: string): boolean {
  const eventDate = parseDateString(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return eventDate >= now;
}

/**
 * Whole days from today until the given date string (negative once past).
 */
export function daysUntilDate(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const eventDate = parseDateString(dateStr);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil(
    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Format a raw event date string for display
 */
export function formatDateString(
  dateStr: string,
  style: "short" | "long" | "full" = "long"
): string {
  const date = parseDateString(dateStr);
  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? { month: "short", day: "numeric", year: "numeric" }
      : style === "full"
        ? { weekday: "long", year: "numeric", month: "long", day: "numeric" }
        : { weekday: "short", month: "short", day: "numeric", year: "numeric" };

  return date.toLocaleDateString("en-NZ", options);
}

// ============================================
// Per-event Helpers
// ============================================

/**
 * Calculate days until event
 */
export function getDaysUntilEvent(event: EventV3): number {
  return daysUntilDate(event.date);
}

/**
 * Format event date for display
 */
export function formatEventDate(
  event: EventV3,
  style: "short" | "long" | "full" = "long"
): string {
  return formatDateString(event.date, style);
}

/**
 * Format event time for display
 */
export function formatEventTime(event: EventV3): string {
  return event.detailPageData.time || "Time TBA";
}

/**
 * Check if event is upcoming
 */
export function isUpcomingEvent(event: EventV3): boolean {
  return isFutureDate(event.date);
}

/**
 * Check if event is past
 */
export function isPastEvent(event: EventV3): boolean {
  return !isFutureDate(event.date);
}

/**
 * Derive a display time from whichever of the time fields the record carries.
 */
export function deriveEventTime(event: EventV3): string | null {
  const { startTime, endTime, timezone, dateTime, time } =
    event.detailPageData;

  if (time && time.trim().length > 0) {
    return time;
  }

  if (startTime && endTime) {
    const timePart = `${startTime} - ${endTime}`;
    return timezone ? `${timePart} ${timezone}` : timePart;
  }

  if (startTime) {
    return timezone ? `${startTime} ${timezone}` : startTime;
  }

  if (dateTime && dateTime.trim().length > 0) {
    const lastCommaIndex = dateTime.lastIndexOf(",");
    const timePart =
      lastCommaIndex >= 0
        ? dateTime.slice(lastCommaIndex + 1).trim()
        : dateTime.trim();
    return timePart || null;
  }

  return null;
}

/**
 * Get display-friendly time for an event
 */
export function getEventDisplayTime(event: EventV3): string | null {
  return deriveEventTime(event);
}

/**
 * Get start time for countdowns
 */
export function getEventStartTime(event: EventV3): string | null {
  const { startTime, time, dateTime } = event.detailPageData;

  if (startTime) {
    return startTime;
  }

  if (time && time.trim().length > 0) {
    const [timePart] = time.split("-");
    return timePart.trim();
  }

  if (dateTime && dateTime.trim().length > 0) {
    const lastCommaIndex = dateTime.lastIndexOf(",");
    const timePart =
      lastCommaIndex >= 0
        ? dateTime.slice(lastCommaIndex + 1).trim()
        : dateTime.trim();
    const [timeRange] = timePart.split("-");
    return timeRange.trim() || null;
  }

  return null;
}

/**
 * Get all speakers from an event (flattened)
 */
export function getAllSpeakersFromEvent(event: EventV3): EventSpeakerV3[] {
  const speakersData = event.detailPageData.speakers;

  // Flatten every speaker group the EventSpeakersV3 type defines so the schema
  // `performer` field and the chatbot cover all people shown on the page. Keep
  // this list in sync with hasAnySpeakers() below.
  const groups: (keyof EventSpeakersV3)[] = [
    "keynote_speakers",
    "panel_speakers",
    "guest_speakers",
    "demo_facilitators",
    "panel_facilitators",
    "hosts",
    "mentors",
    "panelists",
    "workshop_facilitators",
    "readiness_workshop_facilitators",
  ];

  return groups.flatMap((group) => speakersData[group]?.speakers ?? []);
}

/**
 * Check if event has any speakers
 */
export function hasAnySpeakers(event: EventV3): boolean {
  const speakers = event.detailPageData.speakers;
  return !!(
    (speakers.keynote_speakers?.speakers?.length ?? 0) > 0 ||
    (speakers.panel_speakers?.speakers?.length ?? 0) > 0 ||
    (speakers.guest_speakers?.speakers?.length ?? 0) > 0 ||
    (speakers.demo_facilitators?.speakers?.length ?? 0) > 0 ||
    (speakers.panel_facilitators?.speakers?.length ?? 0) > 0 ||
    (speakers.hosts?.speakers?.length ?? 0) > 0 ||
    (speakers.mentors?.speakers?.length ?? 0) > 0 ||
    (speakers.panelists?.speakers?.length ?? 0) > 0 ||
    (speakers.workshop_facilitators?.speakers?.length ?? 0) > 0 ||
    (speakers.readiness_workshop_facilitators?.speakers?.length ?? 0) > 0
  );
}

/**
 * Check if event has any sponsors
 */
export function hasAnySponsors(event: EventV3): boolean {
  const sponsors = event.detailPageData.sponsors;
  return (sponsors.main?.length ?? 0) > 0 || (sponsors.other?.length ?? 0) > 0;
}

/**
 * Check if event has special sections
 */
export function hasSpecialSections(event: EventV3): boolean {
  return (event.detailPageData.specialSections?.length ?? 0) > 0;
}

/**
 * Check if event has photos
 */
export function hasPhotos(event: EventV3): boolean {
  return (event.detailPageData.photos?.length ?? 0) > 0;
}
