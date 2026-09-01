/**
 * The join between a She Sharp event record and a Humanitix listing: reducing a
 * URL to a listing slug, and indexing the account's listings by every slug they
 * can be reached under.
 *
 * Both functions were written inside `verify-live-events.ts` and lived there
 * until a second caller needed them. That script calls `main()` at module
 * scope, so importing anything from it runs a whole report — including, without
 * `--offline`, a paginated API call. Extracting them here is a pure move: the
 * bodies are unchanged, and `verify-live-events.ts` now imports what it used to
 * define, so its `--json` output shape is byte-identical.
 *
 * **The URL path is the only bridge to a 24-hex event id.** Neither
 * `lib/data/json/humanitix/crosswalk.json` nor `.../events.json` carries one —
 * the archive's `humanitixEventId` is the 8-character uppercase code from the
 * CSV export (`K5SJHRMS`), a different identifier from the API's ObjectId
 * (`5ac598ccd8fe7c0c0f212e2a`), and `lib/humanitix/client.ts` says so where it
 * declares `HumanitixEvent`. So anything that has a site event and wants the
 * API's id for it goes: site record → registration URL → this slug →
 * `listEvents()` → `indexListings()` → `id`.
 */
import type { HumanitixEvent } from "../../lib/humanitix/client";

/** The only Humanitix host the site links to; the join key lives in its path. */
export const HUMANITIX_HOST = "events.humanitix.com";

/**
 * Pulls the Humanitix listing slug out of one URL.
 *
 * The slug is the FIRST path segment and nothing else: several records link
 * straight to the buy page
 * (`…/she-sharp-and-academyex-international-women-s-day-2026/tickets`), and
 * keying on the whole path would make those look like listings of their own,
 * silently hiding every duplicate they are part of.
 *
 * @param raw - The URL as the record carries it.
 * @returns The slug, an explained failure, or null when the URL is simply not a
 *   Humanitix link and therefore not this script's business.
 */
export function extractHumanitixSlug(
  raw: string
): { slug: string } | { reason: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Only complain about URLs that were *trying* to be Humanitix links. A Zoom
  // link or an empty string is not a fault to report.
  if (!/humanitix/i.test(trimmed)) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { reason: "not a parseable absolute URL" };
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== HUMANITIX_HOST) {
    return { reason: `host is ${host}, not ${HUMANITIX_HOST}` };
  }

  const segment = parsed.pathname.split("/").filter(Boolean)[0];
  if (!segment) return { reason: "no path segment to use as a listing slug" };

  return { slug: decodeURIComponent(segment).toLowerCase() };
}

/**
 * Indexes the account's listings by every slug they can be reached under.
 *
 * The `slug` field is the join key, but a listing also carries a public `url`
 * whose first path segment is the slug somebody would have copied. Indexing
 * both means a listing whose slug was later edited is still found under the
 * link pasted a year ago.
 *
 * @param listing - Every event the account returned.
 * @returns Lowercased slug to listing; the first listing claiming a slug keeps it.
 */
export function indexListings(listing: HumanitixEvent[]): Map<string, HumanitixEvent> {
  const index = new Map<string, HumanitixEvent>();
  const add = (key: string, event: HumanitixEvent) => {
    const normalised = key.trim().toLowerCase();
    if (!normalised || index.has(normalised)) return;
    index.set(normalised, event);
  };

  for (const event of listing) {
    add(event.slug, event);
    if (event.url) {
      const extracted = extractHumanitixSlug(event.url);
      if (extracted && "slug" in extracted) add(extracted.slug, event);
    }
  }
  return index;
}
