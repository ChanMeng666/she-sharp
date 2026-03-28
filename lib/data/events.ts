/**
 * Events Helper Functions
 *
 * This file contains all helper functions for working with events data.
 * The actual event data is stored in ./events-data.ts
 */

import {
  EventV3,
  EventSpeakerV3,
  EventSpeakerGroup,
  EventSpecialSection,
  EventSponsorsV3,
  EventLocationV3,
} from "@/types/event";
import { eventsV3 as scrapedEventsV3, eventsMetadata } from "./events-data";
import { customEventsV3 } from "./events-custom";

const HUMANITIX_EVENT_URLS = [
  "https://events.humanitix.com/she-sharp-and-academyex-international-women-s-day-2026",
  "https://events.humanitix.com/she-sharp-and-hcltech-ai-empowerment-shaping-an-inclusive-digital-future",
  "https://events.humanitix.com/she-sharp-and-vector-powering-possibility-women-in-tech-vector",
  "https://events.humanitix.com/she-sharp-scw-and-xero-code-secure-lead-the-future-women-in-cybersecurity-workshop",
  "https://events.humanitix.com/she-sharp-and-fonterra-business-and-technology-transformation-through-platforms-and-products",
  "https://events.humanitix.com/she-sharp-and-techbabes-nz-thrive-your-career-your-story",
  "https://events.humanitix.com/she-sharp-and-myob-tech-that-matches",
  "https://events.humanitix.com/she-sharp-iamremarkable",
  "https://events.humanitix.com/she-sharp-and-academy-ex-international-women-s-day",
  "https://events.humanitix.com/2024-google-educators-conference",
  "https://events.humanitix.com/she-sharp-and-hcl",
  "https://events.humanitix.com/she-sharp-10-year-anniversary",
  "https://events.humanitix.com/she-sharp-and-fonterra-harness-the-power-of-generative-al",
  "https://events.humanitix.com/f-and-p-hackathon-with-she",
  "https://events.humanitix.com/she-sharp-and-fiserv-bank-on-yourself",
  "https://events.humanitix.com/she-sharp-and-les-mills-own-the-unexpected",
  "https://events.humanitix.com/she-sharp-and-myob-embracing-bias",
  "https://events.humanitix.com/she-sharp-and-woolworths-international-women-s-day",
  "https://events.humanitix.com/she-celebrates-tot0tupv",
  "https://events.humanitix.com/google-educators-conference",
  "https://events.humanitix.com/she-sharp-and-hcl-technological-change-workplace-and-workforce-impacts",
  "https://events.humanitix.com/inspire-her-te-whakatipuranga-wahine",
  "https://events.humanitix.com/she-sharp-and-techwomen-nz-from-burnout-to-balance",
  "https://events.humanitix.com/she-sharp-and-fonterra-a-legendairy-career",
  "https://events.humanitix.com/she-sharp-and-kiwibank",
  "https://events.humanitix.com/she-sharp-deloitte-innovation",
  "https://events.humanitix.com/developher",
  "https://events.humanitix.com/shesharp-iwd-2023",
  "https://events.humanitix.com/she-celebrates",
  "https://events.humanitix.com/google-event",
  "https://events.humanitix.com/she-sharp-ai-forum-hackathon",
  "https://events.humanitix.com/navigating-the-workplace",
  "https://events.humanitix.com/women-in-security",
  "https://events.humanitix.com/she-sharp-and-countdown-techweek-event",
  "https://events.humanitix.com/she-sharp-and-myob",
  "https://events.humanitix.com/shesharp-iwd-2022",
  "https://events.humanitix.com/women-in-data-and-analytics",
  "https://events.humanitix.com/iamremarkable-lf7rurd0",
  "https://events.humanitix.com/iamremarkable",
  "https://events.humanitix.com/she-sharp-techweek",
  "https://events.humanitix.com/she-sharp-fergus",
  "https://events.humanitix.com/international-women-s-day-event-myob",
  "https://events.humanitix.com/girlsnightout",
  "https://events.humanitix.com/online-event-celebrating-ada-lovelace-day",
  "https://events.humanitix.com/storytellers-series-2-0",
  "https://events.humanitix.com/future-ready",
  "https://events.humanitix.com/she-sharp-techweek-envision-the-future-how-to-create-a-more-diverse-inclusive-and-sustainable-future-through-technology-and-human-centered-innovation",
  "https://events.humanitix.com/story-tellers-series",
  "https://events.humanitix.com/she-sharp-ey",
];

const normalizeUrl = (url: string) =>
  url
    .split(/[?#]/)[0]
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();

/**
 * Returns a merged event list, preferring custom entries on conflicts.
 */
const mergeEvents = (scraped: EventV3[], custom: EventV3[]): EventV3[] => {
  const merged = [...scraped];
  const indexBySlug = new Map<string, number>();
  const slugByHumanitixUrl = new Map<string, string>();

  scraped.forEach((event, index) => {
    indexBySlug.set(event.slug, index);
    const humanitixUrl = event.detailPageData.humanitixUrl;
    if (humanitixUrl) {
      slugByHumanitixUrl.set(normalizeUrl(humanitixUrl), event.slug);
    }
  });

  custom.forEach((event) => {
    const slug = event.slug;
    const humanitixUrl = event.detailPageData.humanitixUrl;
    const normalizedHumanitixUrl = humanitixUrl
      ? normalizeUrl(humanitixUrl)
      : null;

    const slugFromUrl = normalizedHumanitixUrl
      ? slugByHumanitixUrl.get(normalizedHumanitixUrl)
      : undefined;
    const targetSlug = slugFromUrl ?? slug;
    const existingIndex = indexBySlug.get(targetSlug);

    if (existingIndex !== undefined) {
      merged[existingIndex] = event;
      indexBySlug.set(event.slug, existingIndex);
      if (normalizedHumanitixUrl) {
        slugByHumanitixUrl.set(normalizedHumanitixUrl, event.slug);
      }
      return;
    }

    merged.push(event);
    indexBySlug.set(event.slug, merged.length - 1);
    if (normalizedHumanitixUrl) {
      slugByHumanitixUrl.set(normalizedHumanitixUrl, event.slug);
    }
  });

  return merged;
};

const HUMANITIX_URL_SET = new Set(
  HUMANITIX_EVENT_URLS.map((url) => normalizeUrl(url))
);

const deriveEventTime = (event: EventV3): string | null => {
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
};

const normalizeTitle = (event: EventV3): string => {
  const detailTitle = event.detailPageData.title?.trim();
  return detailTitle && detailTitle.length > 0 ? detailTitle : event.title;
};

const baseEventsV3 = mergeEvents(scrapedEventsV3, customEventsV3);

const normalizedEventsV3: EventV3[] = baseEventsV3.map((event) => {
  const humanitixUrl = event.detailPageData.humanitixUrl;
  const isVerifiedHumanitix =
    humanitixUrl && HUMANITIX_URL_SET.has(normalizeUrl(humanitixUrl));

  if (!isVerifiedHumanitix) {
    return event;
  }

  const normalizedTitle = normalizeTitle(event);
  const normalizedTime = deriveEventTime(event);

  if (normalizedTitle === event.title && !normalizedTime) {
    return event;
  }

  return {
    ...event,
    title: normalizedTitle,
    detailPageData: {
      ...event.detailPageData,
      time: event.detailPageData.time || normalizedTime || "",
    },
  };
});

// Re-export types and data for convenience
export type {
  EventV3,
  EventSpeakerV3,
  EventSpeakerGroup,
  EventSpecialSection,
  EventSponsorsV3,
  EventLocationV3,
};
export const eventsV3 = baseEventsV3;
export { eventsMetadata };

// ============================================
// Date Parsing Utility
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

// ============================================
// Helper Functions
// ============================================

/**
 * Get event by slug
 */
export function getEventBySlug(slug: string): EventV3 | undefined {
  return normalizedEventsV3.find((e) => e.slug === slug);
}

/**
 * Get all events
 */
export function getAllEvents(): EventV3[] {
  return normalizedEventsV3;
}

/**
 * Get upcoming events sorted by date (nearest first)
 */
export function getUpcomingEvents(limit?: number): EventV3[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = normalizedEventsV3
    .filter((e) => parseDateString(e.date) >= now)
    .sort(
      (a, b) =>
        parseDateString(a.date).getTime() - parseDateString(b.date).getTime()
    );
  return limit ? upcoming.slice(0, limit) : upcoming;
}

/**
 * Get past events sorted by date (most recent first)
 */
export function getPastEvents(limit?: number): EventV3[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const past = normalizedEventsV3
    .filter((e) => parseDateString(e.date) < now)
    .sort(
      (a, b) =>
        parseDateString(b.date).getTime() - parseDateString(a.date).getTime()
    );
  return limit ? past.slice(0, limit) : past;
}

/**
 * Get in-person events (upcoming only)
 */
export function getInPersonEvents(): EventV3[] {
  return getUpcomingEvents().filter(
    (e) =>
      e.detailPageData.location.format === "in_person" ||
      e.detailPageData.location.format === "hybrid"
  );
}

/**
 * Get featured event - returns an explicitly featured event, or the nearest upcoming event
 */
export function getFeaturedEvent(): EventV3 | undefined {
  const upcoming = getUpcomingEvents();
  const featured = upcoming.find((e) => e.detailPageData.isFeatured);
  if (featured) return featured;
  return upcoming.length > 0 ? upcoming[0] : undefined;
}

/**
 * Get events by category
 */
export function getEventsByCategory(category: string): EventV3[] {
  return normalizedEventsV3.filter(
    (e) => e.detailPageData.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get events by city
 */
export function getEventsByCity(city: string): EventV3[] {
  return normalizedEventsV3.filter(
    (e) => e.detailPageData.location.city.toLowerCase() === city.toLowerCase()
  );
}

/**
 * Search events by title or description
 */
export function searchEvents(query: string): EventV3[] {
  const q = query.toLowerCase();
  return normalizedEventsV3.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.shortDescription.toLowerCase().includes(q) ||
      e.detailPageData.fullDescription.some((desc) =>
        desc.toLowerCase().includes(q)
      )
  );
}

/**
 * Calculate days until event
 */
export function getDaysUntilEvent(event: EventV3): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const eventDate = parseDateString(event.date);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil(
    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Format event date for display
 */
export function formatEventDate(
  event: EventV3,
  style: "short" | "long" | "full" = "long"
): string {
  const date = parseDateString(event.date);
  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? { month: "short", day: "numeric" }
      : style === "full"
        ? { weekday: "long", year: "numeric", month: "long", day: "numeric" }
        : { weekday: "short", month: "short", day: "numeric", year: "numeric" };

  return date.toLocaleDateString("en-NZ", options);
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
 * Get event statistics
 */
export function getEventStats() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = normalizedEventsV3.filter(
    (e) => parseDateString(e.date) >= now
  );
  const past = normalizedEventsV3.filter((e) => parseDateString(e.date) < now);

  // Get unique cities
  const cities = new Set(
    normalizedEventsV3
      .map((e) => e.detailPageData.location.city)
      .filter((city) => city && city.length > 0)
  );

  // Get unique categories
  const categories = new Set(
    normalizedEventsV3
      .map((e) => e.detailPageData.category)
      .filter((cat) => cat && cat.length > 0)
  );

  return {
    total: normalizedEventsV3.length,
    upcoming: upcoming.length,
    past: past.length,
    cities: Array.from(cities),
    categories: Array.from(categories),
  };
}

/**
 * Get all unique cities from events
 */
export function getAllEventCities(): string[] {
  const cities = new Set(
    normalizedEventsV3
      .map((e) => e.detailPageData.location.city)
      .filter((city) => city && city.length > 0)
  );
  return Array.from(cities).sort();
}

/**
 * Get all unique years from events
 */
export function getAllEventYears(): number[] {
  const years = new Set(
    normalizedEventsV3.map((e) => parseDateString(e.date).getFullYear())
  );
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Get events by year
 */
export function getEventsByYear(year: number): EventV3[] {
  return normalizedEventsV3.filter(
    (e) => parseDateString(e.date).getFullYear() === year
  );
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
  const speakers: EventSpeakerV3[] = [];
  const speakersData = event.detailPageData.speakers;

  if (speakersData.keynote_speakers?.speakers) {
    speakers.push(...speakersData.keynote_speakers.speakers);
  }
  if (speakersData.panel_speakers?.speakers) {
    speakers.push(...speakersData.panel_speakers.speakers);
  }
  if (speakersData.guest_speakers?.speakers) {
    speakers.push(...speakersData.guest_speakers.speakers);
  }
  if (speakersData.panel_facilitators?.speakers) {
    speakers.push(...speakersData.panel_facilitators.speakers);
  }

  return speakers;
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
    (speakers.panel_facilitators?.speakers?.length ?? 0) > 0
  );
}

/**
 * Check if event has any sponsors
 */
export function hasAnySponsors(event: EventV3): boolean {
  const sponsors = event.detailPageData.sponsors;
  return (
    (sponsors.main?.length ?? 0) > 0 || (sponsors.other?.length ?? 0) > 0
  );
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

/**
 * Collect all unique sponsor logos across every event.
 * Deduplicates by sponsor name, keeping the first occurrence.
 */
export function getAllSponsorLogos(): { name: string; logo: string }[] {
  const allEvents = getAllEvents();
  const seen = new Map<string, string>();

  for (const event of allEvents) {
    const { main = [], other = [] } = event.detailPageData.sponsors ?? {};
    for (const sponsor of [...main, ...other]) {
      if (sponsor.name && sponsor.logo && !seen.has(sponsor.name)) {
        seen.set(sponsor.name, sponsor.logo);
      }
    }
  }

  return Array.from(seen, ([name, logo]) => ({ name, logo }));
}