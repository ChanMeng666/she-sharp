import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import type { Event, EventSponsor } from "../types/event";
import { events as existingEvents } from "../lib/data/events-data";

type JsonSponsor = {
  name: string;
  logo: string;
  type?: string;
  logoLocal?: string;
};

type JsonPhoto = {
  url: string;
  alt: string;
  localPath?: string;
};

type JsonLocation = {
  format: string;
  venueName?: string;
  address?: string;
  city?: string;
  country?: string;
};

type JsonDetailPageData = {
  date: string;
  time: string;
  location: JsonLocation;
  fullDescription: string[];
  speakers: unknown[];
  photos?: JsonPhoto[];
  galleryUrl?: string;
  registrationUrl?: string;
  status?: string;
  category?: string;
  isFeatured?: boolean;
  sponsors?: JsonSponsor[];
};

type JsonEvent = {
  id: number;
  slug: string;
  title: string;
  date: string;
  coverImage: {
    url: string;
    alt: string;
    localPath?: string;
  };
  detailPageUrl: string;
  shortDescription?: string;
  attendees?: number | null;
  detailPageData: JsonDetailPageData;
};

type JsonRoot = {
  metadata: unknown;
  events: JsonEvent[];
};

const TIMEZONE = "Pacific/Auckland";

const toIsoDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseTimeRange = (timeRange: string): { startTime: string; endTime: string } | null => {
  const trimmed = (timeRange ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const clean = trimmed
    .replace(/NZDT|NZST|NZT/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const [rawStart, rawEnd] = clean.split("-").map((part) => part.trim());

  const to24h = (raw: string): string | null => {
    const normalized = raw
      .replace(/\./g, ":")
      .replace(/(\d)(am|pm)/i, "$1 $2")
      .trim();

    const match = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (!match) {
      return null;
    }
    const [, hourStr, minuteStr = "00", ampm] = match;
    let hour = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);

    if (/pm/i.test(ampm) && hour !== 12) {
      hour += 12;
    }
    if (/am/i.test(ampm) && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const startTime = to24h(rawStart);
  const endTime = to24h(rawEnd ?? rawStart);

  if (!startTime || !endTime) {
    return null;
  }

  return { startTime, endTime };
};

const mapStatus = (status: string | undefined): Event["status"] | undefined => {
  const normalized = (status ?? "").toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "upcoming") return "upcoming";
  if (normalized === "ongoing") return "ongoing";
  if (normalized === "completed" || normalized === "past") return "completed";
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
  return undefined;
};

const mapCategory = (jsonCategory: string | undefined): Event["category"] | undefined => {
  if (!jsonCategory || jsonCategory.trim() === "") {
    return undefined;
  }
  const normalized = jsonCategory.toLowerCase();

  if (normalized.includes("workshop")) return "workshop";
  if (normalized.includes("webinar")) return "webinar";
  if (normalized.includes("conference")) return "conference";
  if (normalized.includes("panel")) return "panel";
  if (normalized.includes("meetup")) return "meetup";
  if (normalized.includes("training")) return "training";
  if (normalized.includes("social")) return "social";
  if (normalized.includes("thrive")) return "thrive";

  return "networking";
};

const buildSponsors = (sponsors: JsonSponsor[] = []): EventSponsor[] | undefined => {
  if (!sponsors.length) return undefined;
  return sponsors.map((sponsor) => ({
    name: sponsor.name,
    logo: sponsor.logo,
    type: sponsor.type,
  }));
};

const mergeEventFromJson = (event: Event, jsonEvent: JsonEvent | undefined): Event => {
  if (!jsonEvent) {
    return event;
  }

  const detail = jsonEvent.detailPageData;

  const mergedSponsors = buildSponsors(detail.sponsors ?? []);

  const jsonDateIso = toIsoDate(detail.date || jsonEvent.date);
  const parsedTimes = parseTimeRange(detail.time);

  const mergedStatus = mapStatus(detail.status) ?? event.status;
  const mergedCategory = mapCategory(detail.category) ?? event.category;

  const mergedAlbumUrl = event.albumUrl ?? detail.galleryUrl;

  const mergedPhotos =
    event.photos && event.photos.length
      ? event.photos
      : detail.photos && detail.photos.length
        ? detail.photos.map((photo) => photo.url)
        : event.photos;

  const mergedRegistration =
    event.registration ??
    (detail.registrationUrl
      ? {
          isRequired: true,
          externalUrl: detail.registrationUrl,
          isFree: true,
        }
      : undefined);

  const mergedStartDate = event.startDate || jsonDateIso;

  const mergedTimes =
    (!event.startTime && !event.endTime && parsedTimes) ||
    (event.startTime === "00:00" && event.endTime === "00:00" && parsedTimes)
      ? parsedTimes
      : { startTime: event.startTime, endTime: event.endTime };

  return {
    ...event,
    status: mergedStatus,
    category: mergedCategory,
    startDate: mergedStartDate,
    startTime: mergedTimes.startTime,
    endTime: mergedTimes.endTime,
    timezone: event.timezone || TIMEZONE,
    albumUrl: mergedAlbumUrl,
    photos: mergedPhotos,
    registration: mergedRegistration,
    sponsors: mergedSponsors ?? event.sponsors,
  };
};

const main = () => {
  const jsonPath = join(process.cwd(), "lib", "data", "json", "shesharp_events_enhanced_with_local_images.json");
  const rawJson = readFileSync(jsonPath, "utf-8");
  const parsed = JSON.parse(rawJson) as JsonRoot;

  const jsonBySlug = new Map<string, JsonEvent>();
  for (const jsonEvent of parsed.events) {
    jsonBySlug.set(jsonEvent.slug, jsonEvent);
  }

  const mergedEvents = existingEvents.map((event) => {
    const jsonEvent = jsonBySlug.get(event.slug);
    if (!jsonEvent) {
      return event;
    }
    return mergeEventFromJson(event, jsonEvent);
  });

  const header = `/**
 * Events Data
 *
 * This file contains all event data for the She Sharp website.
 * This file is partially generated/updated by scripts/merge-events-from-json.ts
 * Source data: lib/data/json/shesharp_events_enhanced_with_local_images.json
 */

import { Event } from "@/types/event";

export const events: Event[] = [
`;

  const footer = `
];
`;

  const body = mergedEvents
    .map((event) =>
      JSON.stringify(event, null, 2)
        .replace(/"([^"]+)":/g, "$1:")
        .replace(/\\\\n/g, "\\n"),
    )
    .join(",\n\n");

  const output = `${header}${body}${footer}`;

  const outPath = join(process.cwd(), "lib", "data", "events-data.ts");
  writeFileSync(outPath, output, "utf-8");

  // eslint-disable-next-line no-console
  console.log(`Merged ${mergedEvents.length} events into lib/data/events-data.ts`);
};

main();


