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
 * Parse ISO date string like "2024-11-21T08:00:00+1300" to extract time
 */
function parseIsoTime(isoString: string): string | undefined {
  const match = isoString.match(/T(\d{2}):(\d{2}):\d{2}/);
  if (!match) return undefined;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  const isPm = hour >= 12;
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  if (minute === 0) {
    return `${hour12}${isPm ? "pm" : "am"}`;
  }
  return `${hour12}:${minute.toString().padStart(2, "0")}${isPm ? "pm" : "am"}`;
}

/**
 * Parse ISO date/time range like "2024-11-21T08:00:00+1300 - 2024-11-21T18:00:00+1300"
 */
function parseIsoDateTimeRange(dateTime: string): {
  startTime?: string;
  endTime?: string;
  timezone?: string;
  humanReadable?: string;
} {
  // Check if it's ISO format (contains T and timezone offset)
  if (dateTime.includes("T") && /[+-]\d{4}/.test(dateTime)) {
    const parts = dateTime.split(" - ");
    if (parts.length === 2) {
      const startIso = parts[0];
      const endIso = parts[1];

      const startTime = parseIsoTime(startIso);
      const endTime = parseIsoTime(endIso);

      // Extract timezone from offset
      const tzMatch = startIso.match(/([+-])(\d{2})(\d{2})$/);
      let timezone = "NZST";
      if (tzMatch) {
        const offset = parseInt(tzMatch[2], 10);
        // +13 is NZDT (daylight saving), +12 is NZST
        timezone = offset >= 13 ? "NZDT" : "NZST";
      }

      // Parse date for human readable format
      const dateMatch = startIso.match(/^(\d{4})-(\d{2})-(\d{2})/);
      let humanReadable: string | undefined;
      if (dateMatch) {
        const date = new Date(startIso);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const dayName = days[date.getDay()];
        const monthName = months[date.getMonth()];
        const dayNum = date.getDate();
        const year = date.getFullYear();
        humanReadable = `${dayName}, ${dayNum} ${monthName} ${year}, ${startTime} - ${endTime} ${timezone}`;
      }

      return { startTime, endTime, timezone, humanReadable };
    }
  }

  return {};
}

/**
 * Parse date_time string like "Thu, 21 Nov 2024, 8am - 6pm NZDT"
 * Also handles ISO format like "2024-11-21T08:00:00+1300 - 2024-11-21T18:00:00+1300"
 * Returns extracted startTime, endTime, and timezone
 */
function parseDateTimeString(dateTime: string | null): {
  startTime?: string;
  endTime?: string;
  timezone?: string;
  humanReadable?: string;
} {
  if (!dateTime) {
    return {};
  }

  // Try ISO format first
  const isoResult = parseIsoDateTimeRange(dateTime);
  if (isoResult.startTime) {
    return isoResult;
  }

  // Fall back to human readable format parsing
  // Extract timezone (NZDT, NZST, etc.)
  const tzMatch = dateTime.match(/\b(NZD?T|NZST)\b/i);
  const timezone = tzMatch ? tzMatch[1].toUpperCase() : undefined;

  // Extract time range like "8am - 6pm" or "5:30pm - 8pm"
  const timeRangeMatch = dateTime.match(
    /(\d{1,2}(?::\d{2})?(?:am|pm))\s*-\s*(\d{1,2}(?::\d{2})?(?:am|pm))/i
  );

  if (!timeRangeMatch) {
    return { timezone, humanReadable: dateTime };
  }

  const startTime = normalizeTime(timeRangeMatch[1]);
  const endTime = normalizeTime(timeRangeMatch[2]);

  return {
    startTime,
    endTime,
    timezone,
    humanReadable: dateTime,
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
 * Manual mapping from shesharp_events_v3.json slugs to humanitix_events.json slugs
 * For events where automatic matching fails due to different naming conventions
 */
const SLUG_MAPPING: Record<string, string> = {
  // V3 slug -> Humanitix slug
  "she-sharp-vector-future-ready-data-ai-digital-innovation-inclusive-careers-at-vector":
    "she-sharp-and-vector-powering-possibility-women-in-tech-vector",
  "code-secure":
    "she-sharp-scw-and-xero-code-secure-lead-the-future-women-in-cybersecurity-workshop",
  "she-sharp-academy-ex-international-womens-day":
    "she-sharp-and-academy-ex-international-women-s-day",
  "google-educator-conference-2024": "2024-google-educators-conference",
  "google-educator-conference-2023": "google-educators-conference",
  "harness-the-power-of-data-and-ai":
    "she-sharp-and-fonterra-harness-the-power-of-generative-al",
  "f-p-hackathon": "f-and-p-hackathon-with-she",
  "bank-on-yourself": "she-sharp-and-fiserv-bank-on-yourself",
  "own-the-unexpected": "she-sharp-and-les-mills-own-the-unexpected",
  "embracing-bias": "she-sharp-and-myob-embracing-bias",
  "international-womens-day-2": "she-sharp-and-woolworths-international-women-s-day",
  "2022-she-celebrates": "she-celebrates",
  "2023-she-celebrates": "she-celebrates-tot0tupv",
  "2022-shaping-the-future-with-ai": "google-event",
  "2022-ai-enviro-hack": "she-sharp-ai-forum-hackathon",
  "2022-women-in-security": "women-in-security",
  "2022-women-igniting-tech": "she-sharp-and-countdown-techweek-event",
  "2022-mind-your-own-career": "she-sharp-and-myob",
  "2022-break-the-bias": "shesharp-iwd-2022",
  "2023-innovation-unleashed": "she-sharp-deloitte-innovation",
  "2023-kickstart-your-career-in-tech-with-myob": "developher",
  "2023-international-womens-day": "shesharp-iwd-2023",
  "2023-the-buzz-about-banking": "she-sharp-and-kiwibank",
  "2021-iamremarkable": "iamremarkable-lf7rurd0",
  "2021-international-womens-day": "international-women-s-day-event-myob",
  "girls-night-out": "girlsnightout",
  "the-truths-to-gaming-and-start-up": "she-sharp-techweek",
  "women-in-tech-and-trades": "she-sharp-fergus",
  "shesharp-future-ready": "future-ready",
  "she-sharp-techweek-envision-the-future":
    "she-sharp-techweek-envision-the-future-how-to-create-a-more-diverse-inclusive-and-sustainable-future-through-technology-and-human-centered-innovation",
  "she-storytellers-series": "story-tellers-series",
  "robotic-process-automation": "she-sharp-ey",
  "2022-navigating-the-workplace-as-a-woman": "navigating-the-workplace",
  "she-sharp-and-hcl": "she-sharp-and-hcl",
  "the-role-of-technology-in-sustainable-development":
    "she-sharp-and-hcl-technological-change-workplace-and-workforce-impacts",
  "ai-hackathon-festival-2025": "ai-forum-nz-hackathon-2023",
  "ai-for-the-environment-hackathon-festival-2024": "ai-forum-nz-hackathon-2023",
  "ai-for-the-environment-hackathon-festival": "she-sharp-ai-forum-hackathon",
  "fonterra-a-legendairy-career": "she-sharp-and-fonterra-a-legendairy-career",
  "she-sharp-and-techwomen-nz-from-burnout-to-balance":
    "she-sharp-and-techwomen-nz-from-burnout-to-balance",
};

/**
 * Normalize slug for comparison
 * Handles differences in slug formatting between sources
 */
function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/^she-sharp-/, "")
    .replace(/^she-/, "")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Extract year from date string like "November 21, 2025" or "2024-11-21T08:00:00+1300"
 */
function extractYear(dateStr: string | null): number | null {
  if (!dateStr) return null;

  // Try ISO format first
  const isoMatch = dateStr.match(/^(\d{4})-\d{2}-\d{2}/);
  if (isoMatch) return parseInt(isoMatch[1], 10);

  // Try "Month Day, Year" format
  const monthMatch = dateStr.match(/,\s*(\d{4})$/);
  if (monthMatch) return parseInt(monthMatch[1], 10);

  // Try generic year match
  const yearMatch = dateStr.match(/\b(20\d{2})\b/);
  if (yearMatch) return parseInt(yearMatch[1], 10);

  return null;
}

/**
 * Try to match events using strict strategies
 * Requires year matching to avoid mismatches between old and new events
 */
function findMatchingHumanitixEvent(
  v3Event: V3Event,
  humanitixEvents: HumanitixEvent[]
): HumanitixEvent | undefined {
  const v3Slug = v3Event.slug.toLowerCase();
  const normalizedV3Slug = normalizeSlug(v3Event.slug);
  const v3Year = extractYear(v3Event.date);

  // Strategy 0: Check manual mapping first
  const mappedSlug = SLUG_MAPPING[v3Slug];
  if (mappedSlug) {
    const match = humanitixEvents.find(
      (h) => h.basic_info.slug.toLowerCase() === mappedSlug.toLowerCase()
    );
    if (match) return match;
  }

  // Strategy 1: Direct slug match with year validation
  let match = humanitixEvents.find((h) => {
    const hSlug = normalizeSlug(h.basic_info.slug);
    const hYear = extractYear(h.basic_info.date_time);

    // Exact slug match
    if (hSlug === normalizedV3Slug) {
      // If both have years, they should match or be within 1 year
      if (v3Year && hYear) {
        return Math.abs(v3Year - hYear) <= 1;
      }
      return true;
    }
    return false;
  });
  if (match) return match;

  // Strategy 2: Humanitix slug contains v3 slug (for short slugs)
  // Only if years match
  match = humanitixEvents.find((h) => {
    const hSlug = normalizeSlug(h.basic_info.slug);
    const hYear = extractYear(h.basic_info.date_time);

    // Check if Humanitix slug contains v3 slug as a complete segment
    const hSlugParts = hSlug.split("-");
    const v3SlugParts = normalizedV3Slug.split("-");

    // At least 3 consecutive words should match
    if (v3SlugParts.length >= 3) {
      let consecutiveMatches = 0;
      let maxConsecutive = 0;

      for (const v3Part of v3SlugParts) {
        if (hSlugParts.includes(v3Part)) {
          consecutiveMatches++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
        } else {
          consecutiveMatches = 0;
        }
      }

      if (maxConsecutive >= 3) {
        // Validate year match
        if (v3Year && hYear) {
          return Math.abs(v3Year - hYear) <= 1;
        }
        return true;
      }
    }

    return false;
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
      // Clear any incorrectly assigned humanitix data
      if (v3Event.detailPageData.humanitixUrl) {
        const cleanedDetailPageData = { ...v3Event.detailPageData };
        delete cleanedDetailPageData.humanitixUrl;
        delete cleanedDetailPageData.dateTime;
        delete cleanedDetailPageData.startTime;
        delete cleanedDetailPageData.endTime;
        delete cleanedDetailPageData.timezone;
        delete cleanedDetailPageData.refundPolicy;
        return {
          ...v3Event,
          detailPageData: cleanedDetailPageData,
        };
      }
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
    // Use human-readable format if available, otherwise use raw date_time
    const fullDateTime = hDetail.date_time || hEvent.basic_info.date_time;
    const displayDateTime = dateTimeInfo.humanReadable || fullDateTime;
    if (displayDateTime) {
      // Always update dateTime to ensure it's in human-readable format
      mergedDetailPageData.dateTime = displayDateTime;
      hasNewData = true;
    }
    if (dateTimeInfo.startTime) {
      // Always update startTime to fix any incorrect values
      mergedDetailPageData.startTime = dateTimeInfo.startTime;
      hasNewData = true;
    }
    if (dateTimeInfo.endTime) {
      // Always update endTime to fix any incorrect values
      mergedDetailPageData.endTime = dateTimeInfo.endTime;
      hasNewData = true;
    }
    if (dateTimeInfo.timezone) {
      // Always update timezone to fix any incorrect values
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
