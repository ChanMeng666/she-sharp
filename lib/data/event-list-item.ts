/**
 * Slim projection of an event for the /events browse experience.
 *
 * The /events page is legitimately a client component — it owns the search box,
 * the year filter and the "load more" pagination — but the filter and card
 * render paths together touch a dozen fields out of a full `EventV3`. Handing
 * the client the whole archive meant ~960KB of JSON in the route bundle and the
 * same records again in the flight payload. This type is exactly what those
 * paths read, and nothing else.
 *
 * Fields were derived by walking every property access in
 * `app/(site)/events/page.tsx` (search, year/category/city filters, sort),
 * `components/events/event-inflected-card.tsx` and
 * `components/events/featured-event-hero.tsx`.
 *
 * `date` stays raw rather than pre-formatted: the "in N days" chip and the
 * upcoming/past split must keep being computed at render time, or a statically
 * prerendered page would freeze them at build time.
 */

import type { EventV3 } from "@/types/event";
import { getEventDisplayTime } from "./event-utils";

export interface EventListItem {
  /** React key, card href, InflectedCard id. */
  slug: string;
  /** Card heading and search haystack. */
  title: string;
  /** Card description and search haystack. */
  shortDescription: string;
  /** Raw "November 21, 2025" string — year filter, sort, upcoming test. */
  date: string;
  /** Category filter. */
  category: string;
  /** City filter and the featured hero's location line. */
  city: string;
  /** Card location line. */
  venueName: string;
  /** "online" | "in_person" | "hybrid" — decides the location icon and label. */
  locationFormat: string;
  /** Cover image src; empty when the record carries none. */
  imageUrl: string;
  /** Cover image alt; empty when the record carries none. */
  imageAlt: string;
  /** Derived display time, e.g. "5:30pm - 8pm NZDT". */
  displayTime: string | null;
  /** External registration link; empty when the event has none. */
  registrationUrl: string;
  /** Registration count shown on the card. */
  attendees: number | null;
}

/**
 * Project a full event record down to what the browse UI renders.
 */
export function toEventListItem(event: EventV3): EventListItem {
  const location = event.detailPageData.location;

  return {
    slug: event.slug,
    title: event.title,
    shortDescription: event.shortDescription,
    date: event.date,
    category: event.detailPageData.category ?? "",
    city: location?.city ?? "",
    venueName: location?.venueName ?? "",
    locationFormat: location?.format ?? "",
    imageUrl: event.coverImage?.url ?? "",
    imageAlt: event.coverImage?.alt ?? "",
    displayTime: getEventDisplayTime(event),
    registrationUrl: event.detailPageData.registrationUrl ?? "",
    attendees: event.attendees ?? null,
  };
}
