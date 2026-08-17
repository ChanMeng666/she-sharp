/**
 * Manually-maintained newsletter issues.
 *
 * This is the ONLY file to edit when a new monthly newsletter goes out.
 * Add a new entry to the array below — the cover image is generated
 * automatically from `month` + `year`, so no design or image upload is needed.
 *
 * To add the next issue, copy this template into NEWSLETTER_MANUAL:
 *
 *   {
 *     id: "2026-06",        // "YYYY-MM" (zero-padded month) — must be unique
 *     month: 6,             // 1-12
 *     year: 2026,
 *     url: "https://...",   // where the cover opens (see below)
 *     // theme: 0,          // optional: pin a cover color (0-5); omit to auto-rotate
 *   },
 *
 * `url` used to mean "the Mailchimp campaign link", and for every issue up to
 * and including July 2026 it still does. From August 2026 an issue built in this
 * repo instead points at its own on-site render,
 * `/resources/newsletters/<id>` — the same HTML its subscribers received, served
 * by `app/(site)/resources/newsletters/[issue]/route.ts`. Both forms work: the
 * grid opens whatever is here in a new tab.
 *
 * Entries here override archive entries with the same id.
 */

import type { NewsletterIssue } from "@/types/newsletter";
import { NEWSLETTER_ARCHIVE } from "./newsletters-archive";

export const NEWSLETTER_MANUAL: NewsletterIssue[] = [
  // Add new monthly newsletters here (newest or oldest — order does not matter,
  // the grid sorts by date). Example:
  // {
  //   id: "2026-06",
  //   month: 6,
  //   year: 2026,
  //   url: "https://mailchi.mp/shesharp/...",
  // },
  // The first issue archived as an on-site render rather than a Mailchimp
  // campaign: August 2026 was built in this repo, so the copy this site serves
  // IS the issue. The route stays `noindex` and out of `app/sitemap.ts` — it is
  // linked from here, not published to search.
  {
    id: "2026-08",
    month: 8,
    year: 2026,
    url: "/resources/newsletters/2026-08",
  },
  {
    id: "2026-07",
    month: 7,
    year: 2026,
    url: "https://mailchi.mp/841abfbfb88b/xe8t2dvmn3-5867935",
  },
  // Points at the *corrected* June send. Mailchimp shows two campaigns going
  // out on 23 June: one still subject-lined "May 2026" and this one. The
  // genuine May issue is the 31 May campaign, already in the archive.
  {
    id: "2026-06",
    month: 6,
    year: 2026,
    url: "https://mailchi.mp/d19ba8c843ff/xe8t2dvmn3-5867920",
  },
  // Restoring a back issue rather than adding a new one. The legacy Webflow
  // site had no card for June 2022, and `newsletters-archive.ts` used to read
  // that absence as "no newsletter that month". It went out: the draft was
  // proofread in-channel on 2022-06-27 (a headline typo and the footer social
  // links were fixed) and sent that afternoon. The campaign still resolves and
  // is titled "She Sharp Newsletter - June 2022".
  {
    id: "2022-06",
    month: 6,
    year: 2022,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=24dba84a67",
  },
];

/**
 * Archive entries that were never real issues.
 *
 * `newsletters-archive.ts` is a frozen crawl of the legacy site and is not
 * hand-edited, so a card that should never have existed is suppressed here
 * instead — the crawl stays faithful and the correction stays visible and
 * reversible.
 */
export const NEWSLETTER_RETRACTED: { id: string; reason: string }[] = [
  {
    id: "2026-02",
    reason:
      "Never sent. The legacy site's February 2026 card pointed at the March " +
      "2026 campaign, and Mailchimp's own archive has no newsletter between " +
      "24 December 2025 and 3 March 2026 — the February issue slipped and went " +
      "out as March. Verified against the campaign archive 2026-08.",
  },
];

const RETRACTED_IDS = new Set(NEWSLETTER_RETRACTED.map((entry) => entry.id));

/**
 * Returns every newsletter issue (manual + archive), deduped by id (manual
 * wins), with retracted ids removed, sorted newest-first for display.
 */
export function getAllNewsletters(): NewsletterIssue[] {
  const byId = new Map<string, NewsletterIssue>();
  for (const issue of NEWSLETTER_ARCHIVE) byId.set(issue.id, issue);
  for (const issue of NEWSLETTER_MANUAL) byId.set(issue.id, issue);
  for (const id of RETRACTED_IDS) byId.delete(id);

  return Array.from(byId.values()).sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  );
}
