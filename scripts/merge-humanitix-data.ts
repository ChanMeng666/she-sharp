/**
 * Merge Humanitix Event Data
 *
 * This script merges additional event data from humanitix_events.json
 * into shesharp_events_v3.json to enrich event details with:
 * - Precise date/time information (startTime, endTime, timezone)
 * - Google Maps URL with coordinates
 * - Refund policy
 * - Humanitix registration URL
 *
 * Usage: npx tsx scripts/merge-humanitix-data.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface HumanitixLocation {
  venue_name: string | null;
  full_address: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface HumanitixDetailInfo {
  url: string;
  title: string;
  banner_image_url: string;
  date_time: string | null;
  location: HumanitixLocation;
  description: string[];
  agenda: unknown[];
  host: {
    name: string;
    profile_url: string;
    followers: string;
    website: string | null;
    facebook: string | null;
    instagram: string | null;
    linkedin: string | null;
    twitter: string | null;
    description: string | null;
  };
  refund_policy: string;
}

interface HumanitixEvent {
  basic_info: {
    url: string;
    slug: string;
    title: string;
    date_time: string;
    location: string | null;
    image_url: string;
  };
  detail_info: HumanitixDetailInfo;
}

interface HumanitixRoot {
  host_url: string;
  total_urls_attempted: number;
  successful_events: number;
  failed_urls: string[];
  events: HumanitixEvent[];
}

interface V3Location {
  format: string;
  venueName: string;
  address: string;
  city: string;
  country: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
}

interface V3DetailPageData {
  url: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  location: V3Location;
  fullDescription: string[];
  speakers: unknown;
  organizers: unknown[];
  sponsors: unknown;
  specialSections: unknown[];
  photos: unknown[];
  galleryUrl: string;
  registrationUrl: string;
  images: unknown[];
  category: string;
  status: string;
  isFeatured: boolean;
  dateTime?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  refundPolicy?: string;
  humanitixUrl?: string;
}

interface V3Event {
  id: number;
  slug: string;
  title: string;
  date: string;
  coverImage: {
    url: string;
    alt: string;
  };
  detailPageUrl: string;
  shortDescription: string;
  attendees: number | null;
  detailPageData: V3DetailPageData;
}

interface V3Root {
  metadata: {
    source: string;
    scrapedAt: string;
    totalEvents: number;
    organization: string;
    version: string;
  };
  events: V3Event[];
}

/**
 * Parse date_time string like "Thu, 21 Nov 2024, 8am - 6pm NZDT"
 * Returns extracted startTime, endTime, and timezone
 */
function parseDateTimeString(dateTime: string | null): {
  startTime?: string;
  endTime?: string;
  timezone?: string;
} {
  if (!dateTime) {
    return {};
  }

  // Extract timezone (NZDT, NZST, etc.)
  const tzMatch = dateTime.match(/\b(NZD?T|NZST)\b/i);
  const timezone = tzMatch ? tzMatch[1].toUpperCase() : undefined;

  // Extract time range like "8am - 6pm" or "5:30pm - 8pm"
  const timeRangeMatch = dateTime.match(
    /(\d{1,2}(?::\d{2})?(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?(?:am|pm)?)/i
  );

  if (!timeRangeMatch) {
    return { timezone };
  }

  const startTime = normalizeTime(timeRangeMatch[1]);
  const endTime = normalizeTime(timeRangeMatch[2]);

  return {
    startTime,
    endTime,
    timezone,
  };
}

/**
 * Normalize time format to consistent format like "8am", "5:30pm"
 */
function normalizeTime(time: string): string {
  // Already has am/pm
  if (/am|pm/i.test(time)) {
    return time.toLowerCase().replace(/\s/g, "");
  }
  // If no am/pm, we can't determine, return as is
  return time;
}

/**
 * Normalize slug for comparison
 * Handles differences in slug formatting between sources
 */
function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/^she-sharp-/, "")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Try to match events using multiple strategies
 */
function findMatchingHumanitixEvent(
  v3Event: V3Event,
  humanitixEvents: HumanitixEvent[]
): HumanitixEvent | undefined {
  const v3Slug = normalizeSlug(v3Event.slug);
  const v3Title = v3Event.title.toLowerCase();

  // Strategy 1: Direct slug match
  let match = humanitixEvents.find(
    (h) => normalizeSlug(h.basic_info.slug) === v3Slug
  );
  if (match) return match;

  // Strategy 2: Slug contains match
  match = humanitixEvents.find(
    (h) =>
      v3Slug.includes(normalizeSlug(h.basic_info.slug)) ||
      normalizeSlug(h.basic_info.slug).includes(v3Slug)
  );
  if (match) return match;

  // Strategy 3: Title similarity
  match = humanitixEvents.find((h) => {
    const hTitle = h.basic_info.title.toLowerCase();
    // Check if significant overlap in title
    const v3Words = v3Title.split(/\s+/).filter((w) => w.length > 3);
    const matchCount = v3Words.filter((w) => hTitle.includes(w)).length;
    return matchCount >= Math.min(3, v3Words.length * 0.5);
  });

  return match;
}

function main() {
  const v3Path = join(
    process.cwd(),
    "lib",
    "data",
    "json",
    "shesharp_events_v3.json"
  );
  const humanitixPath = join(
    process.cwd(),
    "lib",
    "data",
    "json",
    "humanitix_events.json"
  );

  console.log("Reading source files...");

  const v3Raw = readFileSync(v3Path, "utf-8");
  const humanitixRaw = readFileSync(humanitixPath, "utf-8");

  const v3Data = JSON.parse(v3Raw) as V3Root;
  const humanitixData = JSON.parse(humanitixRaw) as HumanitixRoot;

  console.log(`V3 events: ${v3Data.events.length}`);
  console.log(`Humanitix events: ${humanitixData.events.length}`);

  let matchedCount = 0;
  let updatedCount = 0;

  const mergedEvents = v3Data.events.map((v3Event) => {
    const hEvent = findMatchingHumanitixEvent(v3Event, humanitixData.events);

    if (!hEvent) {
      return v3Event;
    }

    matchedCount++;

    const hDetail = hEvent.detail_info;
    const hLocation = hDetail.location;

    // Parse date_time string
    const dateTimeInfo = parseDateTimeString(
      hDetail.date_time || hEvent.basic_info.date_time
    );

    // Check if any new data was added
    let hasNewData = false;

    // Create merged location
    const mergedLocation: V3Location = {
      ...v3Event.detailPageData.location,
    };

    // Add venue name if available and current is empty
    if (hLocation.venue_name && !mergedLocation.venueName) {
      mergedLocation.venueName = hLocation.venue_name;
      hasNewData = true;
    }

    // Add full address if available and current is empty
    if (hLocation.full_address && !mergedLocation.address) {
      mergedLocation.address = hLocation.full_address;
      hasNewData = true;
    }

    // Update format based on location data
    // If we have a venue name or address, it's likely an in-person event
    if (
      (hLocation.venue_name || hLocation.full_address) &&
      mergedLocation.format === "online"
    ) {
      // Check if it's truly online (virtual venue names)
      const venueNameLower = (hLocation.venue_name || "").toLowerCase();
      const isOnlineVenue =
        venueNameLower.includes("online") ||
        venueNameLower.includes("virtual") ||
        venueNameLower.includes("zoom") ||
        venueNameLower.includes("webinar");

      if (!isOnlineVenue && hLocation.venue_name) {
        mergedLocation.format = "in_person";
        hasNewData = true;
      }
    }

    // Add Google Maps URL if available
    if (hLocation.google_maps_url && !mergedLocation.googleMapsUrl) {
      mergedLocation.googleMapsUrl = hLocation.google_maps_url;
      hasNewData = true;
    }

    // Add coordinates if available
    if (hLocation.latitude !== null && !mergedLocation.latitude) {
      mergedLocation.latitude = hLocation.latitude;
      hasNewData = true;
    }
    if (hLocation.longitude !== null && !mergedLocation.longitude) {
      mergedLocation.longitude = hLocation.longitude;
      hasNewData = true;
    }

    // Create merged detail page data
    const mergedDetailPageData: V3DetailPageData = {
      ...v3Event.detailPageData,
      location: mergedLocation,
    };

    // Add date/time info if available
    const fullDateTime = hDetail.date_time || hEvent.basic_info.date_time;
    if (fullDateTime && !mergedDetailPageData.dateTime) {
      mergedDetailPageData.dateTime = fullDateTime;
      hasNewData = true;
    }
    if (dateTimeInfo.startTime && !mergedDetailPageData.startTime) {
      mergedDetailPageData.startTime = dateTimeInfo.startTime;
      hasNewData = true;
    }
    if (dateTimeInfo.endTime && !mergedDetailPageData.endTime) {
      mergedDetailPageData.endTime = dateTimeInfo.endTime;
      hasNewData = true;
    }
    if (dateTimeInfo.timezone && !mergedDetailPageData.timezone) {
      mergedDetailPageData.timezone = dateTimeInfo.timezone;
      hasNewData = true;
    }

    // Add refund policy if available
    if (hDetail.refund_policy && !mergedDetailPageData.refundPolicy) {
      mergedDetailPageData.refundPolicy = hDetail.refund_policy;
      hasNewData = true;
    }

    // Add Humanitix URL
    if (hEvent.basic_info.url && !mergedDetailPageData.humanitixUrl) {
      mergedDetailPageData.humanitixUrl = hEvent.basic_info.url;
      hasNewData = true;
    }

    if (hasNewData) {
      updatedCount++;
    }

    return {
      ...v3Event,
      detailPageData: mergedDetailPageData,
    };
  });

  // Update metadata
  const mergedData: V3Root = {
    metadata: {
      ...v3Data.metadata,
      scrapedAt: new Date().toISOString(),
    },
    events: mergedEvents,
  };

  // Write output
  const outputPath = v3Path;
  writeFileSync(outputPath, JSON.stringify(mergedData, null, 2), "utf-8");

  console.log("\n--- Merge Summary ---");
  console.log(`Total V3 events: ${v3Data.events.length}`);
  console.log(`Matched with Humanitix: ${matchedCount}`);
  console.log(`Events updated with new data: ${updatedCount}`);
  console.log(`Output written to: ${outputPath}`);
}

main();
