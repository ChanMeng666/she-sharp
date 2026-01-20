import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import type { Event } from "../types/event";
import { events as existingEvents } from "../lib/data/events-data";

const GLOBAL_SPEAKER_NAMES = new Set<string>([
  "Michelle Sandford",
  "Renee Noble",
  "Amir Mohammadi",
  "Geri Harris",
]);

const shouldKeepOriginalSpeakers = (speakers: Event["speakers"]): boolean => {
  if (!speakers || speakers.length === 0) return true;

  const uniqueNames = new Set(speakers.map((speaker) => speaker.name));

  // 如果 speakers 里有任何不是全局四人的名字，则需要清理
  for (const name of uniqueNames) {
    if (!GLOBAL_SPEAKER_NAMES.has(name)) {
      return false;
    }
  }

  // 只有这四个人（子集）时，按需求：不删除
  return true;
};

const cleanSpeakers = (event: Event): Event => {
  const { speakers } = event;
  if (!speakers || speakers.length === 0) {
    return event;
  }

  if (shouldKeepOriginalSpeakers(speakers)) {
    return event;
  }

  const filteredSpeakers =
    speakers.filter((speaker) => !GLOBAL_SPEAKER_NAMES.has(speaker.name)) ?? speakers;

  return {
    ...event,
    speakers: filteredSpeakers,
  };
};

const main = () => {
  const cleanedEvents: Event[] = existingEvents.map((event) => cleanSpeakers(event));

  const header = `/**
 * Events Data
 *
 * This file contains all event data for the She Sharp website.
 * Speakers were cleaned by scripts/clean-events-speakers.ts to remove global speakers
 * from events that also have other, event-specific speakers.
 */

import { Event } from "@/types/event";

export const events: Event[] = [
`;

  const footer = `
];
`;

  const body = cleanedEvents
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
  console.log(`Cleaned speakers for ${cleanedEvents.length} events in lib/data/events-data.ts`);
};

main();


