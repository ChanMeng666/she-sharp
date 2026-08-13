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
import { deriveEventTime, parseDateString } from "./event-utils";

// Record-scoped helpers live in ./event-utils so client components can import
// them without pulling this module's ~960KB of JSON into the browser bundle.
// Re-exported here so every existing call site keeps working unchanged.
export {
  parseDateString,
  isFutureDate,
  daysUntilDate,
  formatDateString,
  getDaysUntilEvent,
  formatEventDate,
  formatEventTime,
  isUpcomingEvent,
  isPastEvent,
  getEventDisplayTime,
  getEventStartTime,
  getAllSpeakersFromEvent,
  hasAnySpeakers,
  hasAnySponsors,
  hasSpecialSections,
  hasPhotos,
} from "./event-utils";

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
// Archive-wide Helper Functions
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
 * Count the events that have already been held, as of the given date.
 *
 * The homepage "Events Since 2014" headline is derived from this rather than
 * hand-typed, so the number cannot silently fall behind the event register the
 * way the previous literal had. Records whose date cannot be parsed are skipped
 * rather than guessed at.
 */
export function getEventsHeldCount(asOf: Date = new Date()): number {
  const cutoff = new Date(asOf);
  cutoff.setHours(0, 0, 0, 0);

  return normalizedEventsV3.filter((e) => {
    const eventDate = parseDateString(e.date);
    return !Number.isNaN(eventDate.getTime()) && eventDate < cutoff;
  }).length;
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