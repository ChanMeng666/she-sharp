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
 *     url: "https://...",   // the Mailchimp campaign link for this issue
 *     // theme: 0,          // optional: pin a cover color (0-5); omit to auto-rotate
 *   },
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
 * Returns every newsletter issue (manual + archive), deduped by id (manual
 * wins) and sorted newest-first for display.
 */
export function getAllNewsletters(): NewsletterIssue[] {
  const byId = new Map<string, NewsletterIssue>();
  for (const issue of NEWSLETTER_ARCHIVE) byId.set(issue.id, issue);
  for (const issue of NEWSLETTER_MANUAL) byId.set(issue.id, issue);

  return Array.from(byId.values()).sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  );
}
