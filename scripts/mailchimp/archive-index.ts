/**
 * The index that joins a newsletter card on the site to an archived campaign.
 *
 * `/resources/newsletters` renders 59 cards from `lib/data/newsletters-archive.ts`
 * and `lib/data/newsletters-manual.ts`; 51 of them are Mailchimp URLs in three
 * different shapes, written down over five years by whoever was sending that
 * month. Nothing in those files records a campaign id, so re-pointing a card at
 * an on-site render (PR 3) needs a join, and the join needs to be the same one
 * every time — hence one function here rather than a regex per call site.
 *
 * Three keys, tried in order, resolve all 51:
 *
 *   1. `us3.campaign-archive.com/?u=…&id=<campaignId>` — the id is the campaign.
 *   2. An exact match on the campaign's own `long_archive_url` (`mailchi.mp/…`)
 *      or `archive_url` (`eepurl.com/…`), once `e=` is stripped.
 *   3. The trailing numeric `web_id` some `mailchi.mp` slugs carry
 *      (`…/she-sharp-newsletter-august2021-4680858`).
 *
 * The same resolver marks the 147 `mailchi.mp` cross-links *inside* the bodies,
 * which is why it lives beside the sanitiser rather than inside the extractor:
 * the guard reads it too, and importing the extractor would run it.
 *
 * The file it describes, `lib/data/newsletter-archive/index.json`, is GENERATED.
 * Do not hand-edit it — `extract-archive.ts` rewrites it wholesale.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { REPO_ROOT } from "./vault";

/** Where the generated archive lives. Not `lib/data/json/`: see the README there. */
export const ARCHIVE_HTML_DIR = join(REPO_ROOT, "lib", "data", "newsletter-archive");
export const ARCHIVE_INDEX_PATH = join(ARCHIVE_HTML_DIR, "index.json");

/** One archived campaign. */
export interface ArchiveIndexEntry {
  /** Mailchimp's campaign id — also the HTML filename. */
  id: string;
  /** Mailchimp's numeric campaign id, the third join key. */
  webId: number;
  /** ISO 8601, as Mailchimp reports it. */
  sendTime: string;
  subject: string;
  /** The `eepurl.com` short link. Dies with the account; kept as a join key. */
  archiveUrl: string | null;
  /** The `mailchi.mp` hosted page. Dies with the account; kept as a join key. */
  longArchiveUrl: string | null;
  /** Filename inside `lib/data/newsletter-archive/`. */
  file: string;
  bytes: number;
  /** sha256 of the generated file, so a hand-edit is visible. */
  sha256: string;
}

export interface ArchiveIndex {
  /** The vault export these bodies came from. */
  sourceExport: string;
  /** Campaigns sent, from `sent-campaigns.json`. */
  campaignsSent: number;
  /** Campaigns with a body. One 2019 campaign has neither `html` nor `archive_html`. */
  campaignsArchived: number;
  /** Campaign ids with no body at all, so the gap is recorded rather than inferred. */
  campaignsWithoutBody: string[];
  entries: ArchiveIndexEntry[];
}

/** Drops the per-recipient `e=` parameter and any trailing separator. */
export function normaliseArchiveUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.replace(/&amp;/g, "&"));
  } catch {
    return raw.trim().toLowerCase();
  }
  url.searchParams.delete("e");
  return url
    .toString()
    .replace(/\?$/, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

/** The lookup tables the resolver needs, built once per run. */
export interface ArchiveLookup {
  byId: Set<string>;
  byUrl: Map<string, string>;
  byWebId: Map<string, string>;
}

export function buildArchiveLookup(
  campaigns: Array<Pick<ArchiveIndexEntry, "id" | "webId" | "archiveUrl" | "longArchiveUrl">>
): ArchiveLookup {
  const byId = new Set<string>();
  const byUrl = new Map<string, string>();
  const byWebId = new Map<string, string>();

  for (const campaign of campaigns) {
    byId.add(campaign.id);
    byWebId.set(String(campaign.webId), campaign.id);
    for (const url of [campaign.longArchiveUrl, campaign.archiveUrl]) {
      if (url) byUrl.set(normaliseArchiveUrl(url), campaign.id);
    }
  }
  return { byId, byUrl, byWebId };
}

/**
 * Resolves one Mailchimp archive URL to a campaign id.
 *
 * @param lookup - Built by {@link buildArchiveLookup}.
 * @param raw - A `mailchi.mp`, `eepurl.com` or `campaign-archive.com` URL.
 * @returns The campaign id, or null when nothing matches.
 */
export function resolveCampaignByArchiveUrl(lookup: ArchiveLookup, raw: string): string | null {
  const normalised = normaliseArchiveUrl(raw);

  let url: URL | null = null;
  try {
    url = new URL(normalised);
  } catch {
    url = null;
  }

  if (url && /(^|\.)campaign-archive\.com$/i.test(url.hostname)) {
    const id = url.searchParams.get("id");
    if (id && lookup.byId.has(id)) return id;
  }

  const direct = lookup.byUrl.get(normalised);
  if (direct) return direct;

  const trailing = normalised.match(/-(\d+)$/);
  if (trailing) {
    const byWebId = lookup.byWebId.get(trailing[1]);
    if (byWebId) return byWebId;
  }

  return null;
}

export function readArchiveIndex(path = ARCHIVE_INDEX_PATH): ArchiveIndex {
  return JSON.parse(readFileSync(path, "utf8")) as ArchiveIndex;
}
