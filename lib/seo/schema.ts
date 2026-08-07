/**
 * schema.org JSON-LD builders.
 *
 * Centralizes structured-data construction so it stays consistent across the
 * site. Consumed by the <JsonLd /> component (components/seo/json-ld.tsx).
 */

import type { EventV3 } from "@/types/event";
import { getAllSpeakersFromEvent, parseDateString } from "@/lib/data/events";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SOCIAL_LINKS,
  CHARITY_REGISTRATION,
  CHARITY_REGISTRATION_URL,
  LEGAL_NAME,
  NZBN,
  absoluteUrl,
} from "@/lib/seo/site";

/** Stable @id for the Organization node so other nodes can reference it. */
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Resolve a possibly-relative asset path to an absolute URL. */
function toAbsolute(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return absoluteUrl(url.startsWith("/") ? url : `/${url}`);
}

/**
 * Organization / NGO node describing She Sharp. Reused site-wide and
 * referenced by event organizer fields via @id.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["NGO", "Organization"],
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    // The legal name on the Charities Register is "She Sharp" — same as the
    // display name — so `legalName` is not decorative here: it tells a machine
    // reader that "She#", the visual mark, is the alternate and not the
    // registered entity.
    legalName: LEGAL_NAME,
    alternateName: "She# (She Sharp)",
    url: SITE_URL,
    logo: absoluteUrl("/logos/she-sharp-logo-purple-dark-500x500.png"),
    image: absoluteUrl("/og-cover.png"),
    description: SITE_DESCRIPTION,
    // When the organisation started, NOT when it became a registered charity
    // (4 June 2019) — the two are eighteen months and one legal step apart and
    // must not be conflated.
    foundingDate: "2014",
    slogan: "Connecting Women in Technology",
    areaServed: {
      "@type": "Country",
      name: "New Zealand",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "NZ",
    },
    identifier: [
      {
        "@type": "PropertyValue",
        propertyID: "NZ Charities Register",
        value: CHARITY_REGISTRATION,
        url: CHARITY_REGISTRATION_URL,
      },
      {
        "@type": "PropertyValue",
        propertyID: "NZBN",
        value: NZBN,
      },
    ],
    sameAs: SOCIAL_LINKS,
  };
}

/** WebSite node enabling sitelinks / search understanding. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en-NZ",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Map the event location format to a schema.org eventAttendanceMode. */
function attendanceMode(format: string): string {
  switch (format) {
    case "online":
      return "https://schema.org/OnlineEventAttendanceMode";
    case "hybrid":
      return "https://schema.org/MixedEventAttendanceMode";
    default:
      return "https://schema.org/OfflineEventAttendanceMode";
  }
}

/** Build the schema.org `location` for an event (Place and/or VirtualLocation). */
function buildEventLocation(event: EventV3) {
  const loc = event.detailPageData.location;
  const registrationUrl =
    event.detailPageData.registrationUrl ||
    event.detailPageData.humanitixUrl ||
    event.detailPageUrl;

  const virtual = {
    "@type": "VirtualLocation",
    url: registrationUrl || SITE_URL,
  };

  if (loc.format === "online") {
    return virtual;
  }

  const place: Record<string, unknown> = {
    "@type": "Place",
    name: loc.venueName || loc.city || "New Zealand",
    address: {
      "@type": "PostalAddress",
      streetAddress: loc.address || undefined,
      addressLocality: loc.city || undefined,
      addressCountry: loc.country || "NZ",
    },
  };

  if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
    place.geo = {
      "@type": "GeoCoordinates",
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
  }

  // Hybrid events list both the physical place and a virtual location.
  return loc.format === "hybrid" ? [place, virtual] : place;
}

/** Map NZ timezone abbreviations to their UTC offset (NZDT = UTC+13, NZST = +12). */
function nzOffset(tz?: string): string {
  return tz === "NZST" ? "+12:00" : "+13:00";
}

/**
 * Format a Date to "YYYY-MM-DD" using its local calendar fields. parseDateString
 * builds the Date at local midnight, so reading local fields (not toISOString,
 * which reads UTC) keeps the calendar day stable regardless of server timezone.
 */
function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a "7:30pm" / "6pm" style clock time to 24h "HH:MM"; null if unparseable. */
function parseClockTime(time?: string): string | null {
  const m = time
    ?.trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (m[3] === "pm" && hour !== 12) hour += 12;
  if (m[3] === "am" && hour === 12) hour = 0;
  if (hour > 23 || min > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Compose an ISO datetime with NZ offset from a YYYY-MM-DD date and an optional
 * clock time. Falls back to the date-only string when the time is missing.
 */
function composeNzDateTime(
  dateOnly: string,
  time: string | null,
  tz?: string,
): string {
  return time ? `${dateOnly}T${time}:00${nzOffset(tz)}` : dateOnly;
}

/**
 * Event node for an event detail page. Pulls dates, location, speakers, and
 * registration from the V3 event record; references the Organization as organizer.
 */
export function eventSchema(event: EventV3) {
  const data = event.detailPageData;
  const date = parseDateString(event.date);
  const dateOnly = Number.isNaN(date.getTime())
    ? undefined
    : toDateOnly(date);

  // Compose start/end datetimes from the day plus extracted clock times. Events
  // are single-day, so endDate shares the day; both fall back to date-only when
  // no time is available, which still satisfies the schema.
  const startDate = dateOnly
    ? composeNzDateTime(dateOnly, parseClockTime(data.startTime), data.timezone)
    : undefined;
  const endDate = dateOnly
    ? composeNzDateTime(dateOnly, parseClockTime(data.endTime), data.timezone)
    : undefined;
  // Free RSVP events: the offer is valid from the start of the event day.
  const validFrom = dateOnly
    ? `${dateOnly}T00:00:00${nzOffset(data.timezone)}`
    : undefined;

  const speakers = getAllSpeakersFromEvent(event)
    .filter((s) => s.name)
    .map((s) => ({
      "@type": "Person",
      name: s.name,
      jobTitle: s.title || undefined,
      worksFor: s.company
        ? { "@type": "Organization", name: s.company }
        : undefined,
    }));

  const registrationUrl =
    data.registrationUrl || data.humanitixUrl || event.detailPageUrl;

  const description =
    event.shortDescription || data.fullDescription?.[0]?.slice(0, 300) || "";

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description,
    startDate,
    endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: attendanceMode(data.location.format),
    location: buildEventLocation(event),
    image: event.coverImage?.url ? [toAbsolute(event.coverImage.url)] : undefined,
    url: absoluteUrl(`/events/${event.slug}`),
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      "@id": ORGANIZATION_ID,
    },
    // Named speakers when available; otherwise fall back to She Sharp as the
    // hosting performer so the recommended `performer` field is always present.
    performer:
      speakers.length > 0
        ? speakers
        : [
            {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              "@id": ORGANIZATION_ID,
            },
          ],
    offers: registrationUrl
      ? {
          "@type": "Offer",
          url: registrationUrl,
          // She Sharp events are free to attend (RSVP only).
          price: "0",
          priceCurrency: "NZD",
          availability: "https://schema.org/InStock",
          validFrom,
        }
      : undefined,
  };
}

/**
 * Person node for a team member. Use only for people actually shown on the page
 * (e.g. the /about team grid) so the structured data matches visible content.
 * `worksFor` references the Organization node by @id.
 */
export function personSchema(member: {
  name: string;
  roles?: readonly string[];
  linkedin?: string;
  image?: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: member.name,
    jobTitle: member.roles?.length ? member.roles.join(", ") : undefined,
    worksFor: {
      "@type": "Organization",
      name: SITE_NAME,
      "@id": ORGANIZATION_ID,
    },
    sameAs: member.linkedin ? [member.linkedin] : undefined,
    image: member.image ? toAbsolute(member.image) : undefined,
    description: member.description
      ? member.description.replace(/\s+/g, " ").trim().slice(0, 500)
      : undefined,
  };
}

/** BreadcrumbList from an ordered list of {name, path} crumbs. */
export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
