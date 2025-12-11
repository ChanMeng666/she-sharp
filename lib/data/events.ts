/**
 * Events Helper Functions
 *
 * This file contains all helper functions for working with events data.
 * The actual event data is stored in ./events-data.ts
 */

import {
  Event,
  EventCategory,
  EventStatus,
  EventFormat,
  EVENT_CATEGORIES,
  AgendaItem,
} from '@/types/event';
import { events } from './events-data';

// Re-export types and data for convenience
export type { Event, EventCategory, EventStatus, EventFormat, AgendaItem };
export { events };

// ============================================
// Helper Functions
// ============================================

/**
 * Get event by slug
 */
export function getEventBySlug(slug: string): Event | undefined {
  return events.find((e) => e.slug === slug);
}

/**
 * Get all events (excluding hidden)
 */
export function getAllEvents(): Event[] {
  return events;
}

/**
 * Get upcoming events sorted by date (nearest first)
 */
export function getUpcomingEvents(limit?: number): Event[] {
  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.startDate) >= now && e.status !== 'cancelled')
    .sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  return limit ? upcoming.slice(0, limit) : upcoming;
}

/**
 * Get past events sorted by date (most recent first)
 */
export function getPastEvents(limit?: number): Event[] {
  const now = new Date();
  const past = events
    .filter((e) => new Date(e.startDate) < now || e.status === 'completed')
    .sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  return limit ? past.slice(0, limit) : past;
}

/**
 * Get in-person events (upcoming only)
 */
export function getInPersonEvents(): Event[] {
  return getUpcomingEvents().filter((e) => e.location.format === 'in_person');
}

/**
 * Get featured event
 */
export function getFeaturedEvent(): Event | undefined {
  return events.find((e) => e.isFeatured && e.status === 'upcoming');
}

/**
 * Get events by category
 */
export function getEventsByCategory(category: EventCategory): Event[] {
  return events.filter((e) => e.category === category);
}

/**
 * Get events by format
 */
export function getEventsByFormat(format: EventFormat): Event[] {
  return events.filter((e) => e.location.format === format);
}

/**
 * Search events by title, description, or tags
 */
export function searchEvents(query: string): Event[] {
  const q = query.toLowerCase();
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.shortDescription?.toLowerCase().includes(q) ||
      e.tags?.some((t) => t.toLowerCase().includes(q))
  );
}

/**
 * Calculate days until event
 */
export function getDaysUntilEvent(event: Event): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.startDate);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil(
    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Format event date for display
 */
export function formatEventDate(
  event: Event,
  style: 'short' | 'long' | 'full' = 'long'
): string {
  const date = new Date(event.startDate);
  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { month: 'short', day: 'numeric' }
      : style === 'full'
        ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };

  return date.toLocaleDateString('en-NZ', options);
}

/**
 * Format event time range for display
 */
export function formatEventTime(event: Event): string {
  return `${event.startTime} - ${event.endTime}`;
}

/**
 * Check if registration is open
 */
export function isRegistrationOpen(event: Event): boolean {
  if (event.status !== 'upcoming') return false;
  if (!event.registration?.isRequired) return false;
  if (
    event.registration.deadline &&
    new Date(event.registration.deadline) < new Date()
  )
    return false;
  if (
    event.registration.capacity &&
    event.registration.attendeeCount &&
    event.registration.attendeeCount >= event.registration.capacity
  )
    return false;
  return true;
}

/**
 * Get spots remaining for event
 */
export function getSpotsRemaining(event: Event): number | null {
  if (!event.registration?.capacity) return null;
  const attendees = event.registration.attendeeCount || 0;
  return Math.max(0, event.registration.capacity - attendees);
}

/**
 * Get event statistics
 */
export function getEventStats() {
  const now = new Date();
  const upcoming = events.filter(
    (e) => new Date(e.startDate) >= now && e.status !== 'cancelled'
  );
  const past = events.filter(
    (e) => new Date(e.startDate) < now || e.status === 'completed'
  );

  const byCategory: Partial<Record<EventCategory, number>> = {};
  const byFormat: Partial<Record<EventFormat, number>> = {};

  events.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    byFormat[e.location.format] = (byFormat[e.location.format] || 0) + 1;
  });

  return {
    total: events.length,
    upcoming: upcoming.length,
    past: past.length,
    inPerson: events.filter((e) => e.location.format === 'in_person').length,
    byCategory,
    byFormat,
  };
}

/**
 * Get all unique categories from events
 */
export function getAllEventCategories(): EventCategory[] {
  return EVENT_CATEGORIES.filter((cat) =>
    events.some((e) => e.category === cat)
  );
}

/**
 * Get all unique tags from events
 */
export function getAllEventTags(): string[] {
  const tagSet = new Set<string>();
  events.forEach((e) => {
    e.tags?.forEach((t) => tagSet.add(t));
  });
  return Array.from(tagSet).sort();
}
