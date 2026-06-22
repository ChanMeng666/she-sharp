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
    alternateName: "She# (She Sharp)",
    url: SITE_URL,
    logo: absoluteUrl("/logos/she-sharp-logo-purple-dark-500x500.png"),
    image: absoluteUrl("/og-cover.png"),
    description: SITE_DESCRIPTION,
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
    identifier: {
      "@type": "PropertyValue",
      propertyID: "NZ Charities Register",
      value: CHARITY_REGISTRATION,
      url: CHARITY_REGISTRATION_URL,
    },
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

/**
 * Event node for an event detail page. Pulls dates, location, speakers, and
 * registration from the V3 event record; references the Organization as organizer.
 */
export function eventSchema(event: EventV3) {
  const data = event.detailPageData;
  const date = parseDateString(event.date);
  const startDate = Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().split("T")[0];

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
    performer: speakers.length > 0 ? speakers : undefined,
    offers: registrationUrl
      ? {
          "@type": "Offer",
          url: registrationUrl,
          availability: "https://schema.org/InStock",
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
