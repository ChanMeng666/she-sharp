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
import { eventsV3, eventsMetadata } from "./events-data";

// Re-export types and data for convenience
export type {
  EventV3,
  EventSpeakerV3,
  EventSpeakerGroup,
  EventSpecialSection,
  EventSponsorsV3,
  EventLocationV3,
};
export { eventsV3, eventsMetadata };

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
  return eventsV3.find((e) => e.slug === slug);
}

/**
 * Get all events
 */
export function getAllEvents(): EventV3[] {
  return eventsV3;
}

/**
 * Get upcoming events sorted by date (nearest first)
 */
export function getUpcomingEvents(limit?: number): EventV3[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = eventsV3
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

  const past = eventsV3
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
 * Get featured event - returns the nearest upcoming event
 */
export function getFeaturedEvent(): EventV3 | undefined {
  const upcoming = getUpcomingEvents(1);
  return upcoming.length > 0 ? upcoming[0] : undefined;
}

/**
 * Get events by category
 */
export function getEventsByCategory(category: string): EventV3[] {
  return eventsV3.filter(
    (e) => e.detailPageData.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get events by city
 */
export function getEventsByCity(city: string): EventV3[] {
  return eventsV3.filter(
    (e) => e.detailPageData.location.city.toLowerCase() === city.toLowerCase()
  );
}

/**
 * Search events by title or description
 */
export function searchEvents(query: string): EventV3[] {
  const q = query.toLowerCase();
  return eventsV3.filter(
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

  const upcoming = eventsV3.filter((e) => parseDateString(e.date) >= now);
  const past = eventsV3.filter((e) => parseDateString(e.date) < now);

  // Get unique cities
  const cities = new Set(
    eventsV3
      .map((e) => e.detailPageData.location.city)
      .filter((city) => city && city.length > 0)
  );

  // Get unique categories
  const categories = new Set(
    eventsV3
      .map((e) => e.detailPageData.category)
      .filter((cat) => cat && cat.length > 0)
  );

  return {
    total: eventsV3.length,
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
    eventsV3
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
    eventsV3.map((e) => parseDateString(e.date).getFullYear())
  );
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Get events by year
 */
export function getEventsByYear(year: number): EventV3[] {
  return eventsV3.filter(
    (e) => parseDateString(e.date).getFullYear() === year
  );
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
