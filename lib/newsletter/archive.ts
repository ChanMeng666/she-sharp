/**
 * Serving the archived newsletters from this site instead of from Mailchimp.
 *
 * `lib/data/newsletter-archive/` holds 179 sent campaigns as complete, already
 * sanitised HTML documents with every image re-hosted on Vercel Blob. Nothing
 * on the site could reach any of them: the newsletters grid sent every visitor
 * to `mailchi.mp`, and those pages die with the Mailchimp subscription the
 * founder is cancelling. This module is the join and the serve-time fixups that
 * make the archive reachable from `/resources/newsletters/<id>`.
 *
 * Two kinds of id address the same corpus, on purpose:
 *
 *   - `YYYY-MM` — the 59 cards the newsletters grid renders. Readable, already
 *     the shape of the one on-site URL that existed before this, and stable if
 *     the archive is ever re-extracted under different campaign ids.
 *   - a 10-hex campaign id — all 179, including the 121 with no card. Routing
 *     costs the same either way, so nothing in the archive is unreachable;
 *     which of them get a *card* stays an editorial decision, and most of the
 *     other 121 are event reminders and thank-yous rather than issues.
 *
 * `YYYY-MM` cannot address the corpus on its own — the 179 campaigns span 74
 * months and 55 of those months hold more than one, August 2022 holding eight.
 * That is why the card carries an explicit `campaign` id rather than the route
 * deriving one from the month.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import archiveIndex from "@/lib/data/newsletter-archive/index.json";
import { getAllNewsletters } from "@/lib/data/newsletters-manual";
import {
  buildArchiveLookup,
  resolveCampaignByArchiveUrl,
} from "@/lib/newsletter/archive-index";
import { listIssueIds } from "@/lib/newsletter/issues-registry";
import { SITE_URL } from "@/lib/seo/site";

/** Where the generated bodies live, relative to the repo root. */
const ARCHIVE_DIR = join(process.cwd(), "lib", "data", "newsletter-archive");

/** The public path prefix every archived issue is served under. */
export const NEWSLETTER_ISSUE_PREFIX = "/resources/newsletters";

/** Mailchimp campaign ids are ten lowercase hex characters; so is the filename. */
const CAMPAIGN_ID = /^[0-9a-f]{10}$/;

export function isCampaignId(id: string): boolean {
  return CAMPAIGN_ID.test(id);
}

/** Every campaign that has a body on disk. */
export const ARCHIVED_CAMPAIGN_IDS: ReadonlySet<string> = new Set(
  archiveIndex.entries.map((entry) => entry.id)
);

const FILE_BY_CAMPAIGN = new Map(archiveIndex.entries.map((e) => [e.id, e.file]));

const ARCHIVE_LOOKUP = buildArchiveLookup(archiveIndex.entries);

/**
 * Card id -> the archived campaign that card opens.
 *
 * Built from the rendered cards only, so a retracted id (`2026-02`, which the
 * legacy site pointed at the March 2026 send) resolves to nothing. Retraction
 * is enforced in `NEWSLETTER_RETRACTED` and nowhere else; reading the cards
 * through `getAllNewsletters()` is what keeps it to one place.
 */
export const CAMPAIGN_BY_ISSUE_ID: ReadonlyMap<string, string> = new Map(
  getAllNewsletters()
    .filter((issue): issue is typeof issue & { campaign: string } => Boolean(issue.campaign))
    .map((issue) => [issue.id, issue.campaign])
);

/** The reverse direction, for rewriting a link that names a campaign id. */
const ISSUE_ID_BY_CAMPAIGN = new Map(
  [...CAMPAIGN_BY_ISSUE_ID].map(([issueId, campaignId]) => [campaignId, issueId])
);

/**
 * The one path a campaign should be linked by.
 *
 * A campaign with a card is addressable twice — `/resources/newsletters/2023-05`
 * and `/resources/newsletters/6ae4e84676` — and the readable one wins. Every
 * link this module rewrites, including each body's own `og:url`, points here,
 * so the hex URL declares the card URL as its own canonical rather than
 * competing with it.
 */
export function pathForCampaign(campaignId: string): string {
  const issueId = ISSUE_ID_BY_CAMPAIGN.get(campaignId);
  return `${NEWSLETTER_ISSUE_PREFIX}/${issueId ?? campaignId}`;
}

/** What `/resources/newsletters/<id>` should serve, or null for a 404. */
export type IssueResolution =
  | { kind: "campaign"; campaignId: string; canonicalPath: string }
  | { kind: "registry"; issueId: string; canonicalPath: string };

/**
 * Resolves one `/resources/newsletters/<id>` path.
 *
 * The archived send wins over a registry render of the same month, which
 * reverses the order this was first specified with. All three ids in
 * `issues-registry.ts` are `meta.status: "draft"`, and for `2026-06` and
 * `2026-07` the issue that actually reached subscribers is the Mailchimp
 * campaign the card already linked. Preferring the registry there would swap a
 * real send for a draft nobody received, and would silently change what those
 * two cards open onto.
 *
 * `2026-08` has no Mailchimp campaign — it was composed in this repo rather
 * than in Mailchimp — so it carries no `campaign` and falls through to the
 * registry, which is the only artefact of that issue there is. A `campaign`
 * asserts exactly one thing, that the issue also exists as a Mailchimp send;
 * its absence means there is no send to prefer, NOT that the send happened
 * somewhere else. Nothing has ever been sent from `newsletter_subscribers`.
 */
export function resolveIssue(id: string): IssueResolution | null {
  const carded = CAMPAIGN_BY_ISSUE_ID.get(id);
  if (carded) {
    return { kind: "campaign", campaignId: carded, canonicalPath: pathForCampaign(carded) };
  }

  if (listIssueIds().includes(id)) {
    return { kind: "registry", issueId: id, canonicalPath: `${NEWSLETTER_ISSUE_PREFIX}/${id}` };
  }

  if (isCampaignId(id) && ARCHIVED_CAMPAIGN_IDS.has(id)) {
    return { kind: "campaign", campaignId: id, canonicalPath: pathForCampaign(id) };
  }

  return null;
}

/** Every id the route serves: 59 card ids, 179 campaign ids, 3 registry ids. */
export function allServableIds(): string[] {
  return [
    ...new Set([
      ...CAMPAIGN_BY_ISSUE_ID.keys(),
      ...listIssueIds(),
      ...ARCHIVED_CAMPAIGN_IDS,
    ]),
  ];
}

/** Reads one archived body. Throws when the id has no file, which is a bug. */
export async function readArchivedCampaign(campaignId: string): Promise<string> {
  const file = FILE_BY_CAMPAIGN.get(campaignId);
  if (!file) throw new Error(`No archived body for campaign ${campaignId}`);
  return readFile(join(ARCHIVE_DIR, file), "utf8");
}

// ---------------------------------------------------------------------------
// Serve-time link rewriting
//
// The bodies are GENERATED and hash-checked by
// `scripts/mailchimp/archive-guard.test.ts`, so none of this may be written back
// to disk — a body is fixed up on the way out and the file stays byte-identical
// to what the extractor produced.
//
// Regexes rather than a DOM parse, because the attributes being matched are not
// email-template HTML: `data-mc-campaign` is written by
// `scripts/mailchimp/archive-html.ts` with a known, double-quoted shape.
// Re-parsing twenty-year-old table markup would be the wrong tool for reading a
// marker the extractor just wrote.
// ---------------------------------------------------------------------------

/** An unescaped Mailchimp archive URL, wherever it turns up. */
const EMBEDDED_ARCHIVE_URL =
  /https?:\/\/(?:[a-z0-9-]+\.)*(?:mailchi\.mp|eepurl\.com|campaign-archive\.com|list-manage\.com)[^\s"'<>]*/gi;

/** A tag the extractor marked as naming a campaign, with the id it names. */
const MARKED_TAG = /<(a|meta)\b[^>]*\bdata-mc-campaign="([0-9a-f]{10})"[^>]*>/gi;

function absolute(path: string): string {
  return `${SITE_URL}${path}`;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function unescapeAttribute(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

/**
 * Rewrites the Mailchimp URLs a served body would otherwise carry.
 *
 * Three of them, and the third was not obvious:
 *
 *  1. Every body's `<head>` carries `<meta property="og:url">` pointing at its
 *     own `eepurl.com` short link. Served from shesharp.org.nz that becomes
 *     this page's declared URL — a page telling crawlers it lives on a host
 *     that is about to stop answering. It becomes this page's own canonical
 *     path instead, which is also the self-canonical a `noindex` child needs so
 *     that the parent's canonical cannot pick the noindex up.
 *  2. The "View this email in your browser" anchor in each body, same URL.
 *  3. 42 Facebook and Twitter share buttons whose *query string* carries the
 *     campaign's `mailchi.mp` page percent-encoded. The extractor's marker pass
 *     never saw these — the host is facebook.com, so `isArchiveHost` said no —
 *     and every one of them would share a dead link after the cancellation.
 */
export function localiseArchivedHtml(html: string): string {
  // 1 + 2. Anything the extractor marked with a campaign id.
  let out = html.replace(MARKED_TAG, (tag: string, tagName: string, campaignId: string) => {
    const target = escapeAttribute(absolute(pathForCampaign(campaignId)));
    const attribute = tagName.toLowerCase() === "meta" ? "content" : "href";
    return tag.replace(new RegExp(`\\b${attribute}="[^"]*"`, "i"), `${attribute}="${target}"`);
  });

  // 3. Archive URLs hidden inside another host's query string.
  out = out.replace(/\bhref="([^"]*)"/gi, (whole: string, raw: string) => {
    if (!/mailchi\.mp|eepurl|campaign-archive|list-manage/i.test(raw)) return whole;

    let url: URL;
    try {
      url = new URL(unescapeAttribute(raw));
    } catch {
      return whole;
    }

    let changed = false;
    for (const [key, value] of [...url.searchParams]) {
      const replaced = value.replace(EMBEDDED_ARCHIVE_URL, (hit: string) => {
        const campaignId = resolveCampaignByArchiveUrl(ARCHIVE_LOOKUP, hit);
        if (!campaignId) return hit;
        changed = true;
        return absolute(pathForCampaign(campaignId));
      });
      if (replaced !== value) url.searchParams.set(key, replaced);
    }

    return changed ? `href="${escapeAttribute(url.toString())}"` : whole;
  });

  return out;
}
