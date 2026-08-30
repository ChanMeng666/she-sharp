/**
 * Filesystem access to the generated newsletter archive index.
 *
 * The join itself — `normaliseArchiveUrl`, `buildArchiveLookup`,
 * `resolveCampaignByArchiveUrl` and the entry types — moved to
 * `lib/newsletter/archive-index.ts` when `/resources/newsletters/[issue]` began
 * serving the archive: the Next.js build needs the same resolver, the root
 * `tsconfig` excludes `scripts/`, and two copies of a five-year-old URL join is
 * exactly the shape of thing that silently drifts. Everything is re-exported
 * here so the extractor, the re-hoster and the guard keep their imports.
 *
 * The file these paths point at, `lib/data/newsletter-archive/index.json`, is
 * GENERATED. Do not hand-edit it — `extract-archive.ts` rewrites it wholesale.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { ArchiveIndex } from "@/lib/newsletter/archive-index";

import { REPO_ROOT } from "./vault";

export {
  buildArchiveLookup,
  normaliseArchiveUrl,
  resolveCampaignByArchiveUrl,
} from "@/lib/newsletter/archive-index";
export type {
  ArchiveIndex,
  ArchiveIndexEntry,
  ArchiveLookup,
} from "@/lib/newsletter/archive-index";

/** Where the generated archive lives. Not `lib/data/json/`: see the README there. */
export const ARCHIVE_HTML_DIR = join(REPO_ROOT, "lib", "data", "newsletter-archive");
export const ARCHIVE_INDEX_PATH = join(ARCHIVE_HTML_DIR, "index.json");

export function readArchiveIndex(path = ARCHIVE_INDEX_PATH): ArchiveIndex {
  return JSON.parse(readFileSync(path, "utf8")) as ArchiveIndex;
}
