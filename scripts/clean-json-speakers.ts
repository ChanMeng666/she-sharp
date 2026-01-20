import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

type JsonSpeaker = {
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  image?: string;
  linkedin?: string;
};

type JsonDetailPageData = {
  speakers?: JsonSpeaker[];
};

type JsonEvent = {
  slug: string;
  title: string;
  detailPageData: JsonDetailPageData;
};

type JsonRoot = {
  metadata: unknown;
  events: JsonEvent[];
};

const GLOBAL_SPEAKER_NAMES = new Set<string>([
  "Michelle Sandford",
  "Renee Noble",
  "Amir Mohammadi",
  "Geri Harris",
]);

const isGlobalSpeakersOnly = (speakers: JsonSpeaker[] | undefined): boolean => {
  if (!speakers || !speakers.length) return false;

  const names = new Set<string>();
  for (const speaker of speakers) {
    if (!GLOBAL_SPEAKER_NAMES.has(speaker.name)) {
      return false;
    }
    names.add(speaker.name);
  }

  // 只有这四个人（或其中部分子集）时，认为是“全局挂载”的错误数据
  return names.size > 0 && [...names].every((name) => GLOBAL_SPEAKER_NAMES.has(name));
};

const main = () => {
  const jsonPath = join(process.cwd(), "lib", "data", "json", "shesharp_events_enhanced_with_local_images.json");
  const raw = readFileSync(jsonPath, "utf-8");
  const parsed = JSON.parse(raw) as JsonRoot;

  let cleanedCount = 0;

  for (const event of parsed.events) {
    const detail = event.detailPageData;
    if (!detail) continue;

    if (isGlobalSpeakersOnly(detail.speakers)) {
      detail.speakers = [];
      cleanedCount += 1;
    }
  }

  writeFileSync(jsonPath, JSON.stringify(parsed, null, 2), "utf-8");

  // eslint-disable-next-line no-console
  console.log(`Cleaned speakers for ${cleanedCount} events in JSON`);
};

main();


