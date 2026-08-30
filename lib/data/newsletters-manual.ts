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
 *     id: "2026-09",        // "YYYY-MM" (zero-padded month) — must be unique
 *     month: 9,             // 1-12
 *     year: 2026,
 *     url: "/resources/newsletters/2026-09",   // always on-site (see below)
 *     // theme: 0,          // optional: pin a cover color (0-5); omit to auto-rotate
 *   },
 *
 * `url` used to mean "the Mailchimp campaign link". It no longer does: every
 * card opens `/resources/newsletters/<id>` on this site, served by
 * `app/(site)/resources/newsletters/[issue]/route.ts`. Mailchimp documents
 * nothing about what happens to a hosted campaign page once the subscription is
 * cancelled, and the founder is cancelling it, so 51 links to `mailchi.mp` were
 * 51 ways for the back catalogue to disappear.
 *
 * An issue sent from Mailchimp names the archived send in `campaign`, and keeps
 * the URL it was published at in `source`. An issue built AND sent from this
 * repo has neither: `/resources/newsletters/<id>` renders it from
 * `lib/newsletter/issues-registry.ts`. Add the fixture there, then the card
 * here.
 *
 * Entries here override archive entries with the same id.
 */

import type { NewsletterIssue } from "@/types/newsletter";
import { NEWSLETTER_ARCHIVE } from "./newsletters-archive";

export const NEWSLETTER_MANUAL: NewsletterIssue[] = [
  // Add new monthly newsletters here (newest or oldest — order does not matter,
  // the grid sorts by date). Example:
  // {
  //   id: "2026-09",
  //   month: 9,
  //   year: 2026,
  //   url: "/resources/newsletters/2026-09",
  // },
  // The one issue with no Mailchimp campaign behind it: August 2026 was built
  // in this repo and mailed through Resend, so the copy this site serves IS the
  // issue and there is no archived send to prefer over it. That is exactly what
  // the missing `campaign` means — see `resolveIssue()` in
  // `lib/newsletter/archive.ts`, which prefers the send everywhere there is
  // one, because the other two registry fixtures are drafts of issues that
  // actually went out from Mailchimp. The route stays `noindex` and out of
  // `app/sitemap.ts` — it is linked from here, not published to search.
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
    url: "/resources/newsletters/2026-07",
    source: "https://mailchi.mp/841abfbfb88b/xe8t2dvmn3-5867935",
    campaign: "70f3dfd320",
  },
  // Points at the *corrected* June send. Mailchimp shows two campaigns going
  // out on 23 June: one still subject-lined "May 2026" and this one. The
  // genuine May issue is the 31 May campaign, already in the archive.
  {
    id: "2026-06",
    month: 6,
    year: 2026,
    url: "/resources/newsletters/2026-06",
    source: "https://mailchi.mp/d19ba8c843ff/xe8t2dvmn3-5867920",
    campaign: "e9835f97b7",
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
    url: "/resources/newsletters/2022-06",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=24dba84a67",
    campaign: "24dba84a67",
  },
];

/**
 * Archive entries that were never real issues.
 *
 * `newsletters-archive.ts` is a frozen crawl of the legacy site and is not
 * hand-edited, so a card that should never have existed is suppressed here
 * instead — the crawl stays faithful and the correction stays visible and
 * reversible.
 *
 * Retraction now also decides a URL. `2026-02` still carries the March 2026
 * campaign in `campaign`, because that is what the legacy site linked, but
 * `lib/newsletter/archive.ts` builds its id -> campaign map from
 * `getAllNewsletters()`, so `/resources/newsletters/2026-02` is a 404 and the
 * hex URL for that campaign resolves to `/resources/newsletters/2026-03`. One
 * list suppresses the card and the route together; the guard checks it.
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
