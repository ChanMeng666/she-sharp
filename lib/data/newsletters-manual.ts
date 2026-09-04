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
 * the URL it was published at in `source`. An issue composed here rather than
 * in Mailchimp has neither: `/resources/newsletters/<id>` renders it from
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
  // The issues with no Mailchimp campaign behind them: August and September
  // 2026 were composed in this repo rather than in Mailchimp, so the registry
  // render is the only artefact of each that exists.
  //
  // **Whether an issue has been sent is not recorded here.** This comment used
  // to assert that August "has not been sent — nothing has ever been sent from
  // `newsletter_subscribers`", which stopped being true on 2026-08-31, when
  // that issue went to 1,549 people in 16 chunks. Nobody updated the sentence,
  // because nothing makes a prose claim in a data file go red when it expires.
  // The send record lives in the skill's ledger
  // (`.claude/skills/monthly-newsletter/state/issues.json`, read it with
  // `issue-ledger.ts show --issue <id>`), which is written by the send itself.
  // Ask it, not this file, and do not re-add a send-status claim here.
  //
  // The missing `campaign` says only that there is no Mailchimp send to serve.
  // See `resolveIssue()` in `lib/newsletter/archive.ts`, which prefers the send
  // wherever there is one, because the other two registry fixtures are drafts
  // of issues that did go out from Mailchimp. The route stays `noindex` and out
  // of `app/sitemap.ts` — it is linked from here, not published to search.
  {
    id: "2026-09",
    month: 9,
    year: 2026,
    url: "/resources/newsletters/2026-09",
  },
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
  // Also a correction rather than a new issue, and the one the archive file's
  // header left open ("February 2025 is unresolved ... Needs a human to check
  // the send date in Mailchimp"). Checked on 2026-09-02, and it is the February
  // issue on five independent readings:
  //
  //   1. `newsletter-archive/index.json` puts the send at 2025-02-28.
  //   2. Mailchimp's own internal campaign title is "February 2025" — the
  //      subject line, "We are back for 2025", names no month, which is how the
  //      legacy site came to guess one.
  //   3. The preheader reads "Check out what we got lined up in March".
  //   4. The body cites news dated 2025-02-18 and 2025-02-20.
  //   5. #monthly-newsletter opens this cycle on 2025-02-24, worries on 02-27
  //      that "we need to send it today/tomorrow", and sends on 02-28. The
  //      strings "January 2025" and "Jan 2025" appear nowhere in the channel.
  //
  // And there is no January issue to displace: Mailchimp sent nothing at all in
  // January 2025. So this is the same card under its right month, not a second
  // one — `2025-01` is retracted below, which is what moves the URL with it.
  {
    id: "2025-02",
    month: 2,
    year: 2025,
    url: "/resources/newsletters/2025-02",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-december2024-5854405",
    campaign: "dcc451d2d3",
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
 * Archive entries that must not render — either because they were never real
 * issues (`2026-02`), or because the issue is real but the crawl filed it under
 * the wrong month and it renders correctly from `NEWSLETTER_MANUAL` above
 * (`2025-01`, served as `2025-02`). Both need the same thing: the card gone and
 * the URL with it. Do not read a retraction as "this issue does not exist".
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
  {
    id: "2025-01",
    reason:
      "Mislabelled, not missing. Mailchimp sent nothing whatsoever in January " +
      "2025; the campaign this card carried went out on 28 February 2025 under " +
      "the internal title 'February 2025', and is served as `2025-02` above. " +
      "The legacy site guessed a month because the subject line — 'We are back " +
      "for 2025' — names none. Retracting the id rather than editing the frozen " +
      "crawl keeps the crawl faithful and moves the URL with the card. " +
      "Verified 2026-09-02 against the campaign archive and #monthly-newsletter.",
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
