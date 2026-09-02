/**
 * Complete historical newsletter archive imported from the legacy She Sharp
 * Webflow site (https://shesharp.org.nz/media/newsletters).
 *
 * Source of truth: the live site's paginated CMS collection (7 pages, 56
 * issues, March 2021 -> May 2026), crawled in full via browser automation.
 *
 * DO NOT hand-edit this file to add new months. It is the frozen historical
 * record. Add new issues going forward in `newsletters-manual.ts` instead.
 *
 * Reconciled legacy data quirks (the old site mislabeled some cards; the true
 * month was recovered from each card's cover-image filename and link slug):
 * - The second "July 2024" card is really June 2024 (link slug `june2024`).
 * - The first "November 2022" card is really November 2021 (cover `2021_nov`,
 *   link `...2021-4693790`).
 * - The first "September 2021" card is really August 2021 (cover `aug`, link
 *   `August-2021-Newsletter.pdf`).
 * Every link the live site served is kept exactly, in `source`; `url` is now
 * this site's own `/resources/newsletters/<id>`, and `campaign` names the
 * archived Mailchimp send it serves from `lib/data/newsletter-archive/`. The
 * one edit to a `source` is the removal of a trailing `?e=<hash>` from seven of
 * them: that is Mailchimp's per-recipient identifier, and it named a real
 * subscriber in a committed file.
 *
 * February 2026 points at the March 2026 campaign here because the source site
 * did; it is suppressed at render time via NEWSLETTER_RETRACTED in
 * `newsletters-manual.ts` rather than deleted, so this crawl stays faithful.
 * Mailchimp's own archive has no newsletter between 24 December 2025 and
 * 3 March 2026 — the February issue slipped and went out as March.
 *
 * TWO CARDS ARE SWAPPED AND ARE LEFT THAT WAY. The legacy site's April 2023
 * card links the campaign subject-lined "She Sharp Newsletter - May 2023" (sent
 * 22 May), and its May 2023 card links "April 2023" (sent 20 April). Serving
 * these ourselves does not change what a visitor gets — the cards opened those
 * same two campaigns before — and re-dating a card is a content decision like
 * the three reconciliations above it, made by moving the card's id with the
 * evidence written down, not by quietly re-pointing `campaign`.
 *
 * Gaps here mean the legacy site had no card for that month. That is NOT the
 * same as "no newsletter went out", and this comment used to claim it was.
 * Corrected against the Slack archive:
 * - June 2022 WAS published. The draft was proofread in-channel on 2022-06-27
 *   and sent that afternoon; the campaign is titled "She Sharp Newsletter -
 *   June 2022" and still resolves. It is restored in `newsletters-manual.ts`.
 *   The legacy site was missing four issues in this stretch, and this was the
 *   last of them not to be recovered.
 * - February 2025 is resolved, and the answer was neither of the two this
 *   comment used to weigh. It is not the `2025-03` entry, and it is not
 *   missing: it is the card below labelled `2025-01`, which carries a campaign
 *   sent on 28 February 2025 under Mailchimp's own internal title "February
 *   2025". The subject line names no month ("We are back for 2025"), so the
 *   legacy site guessed, and guessed January — a month in which Mailchimp sent
 *   nothing at all. Corrected 2026-09-02 by retracting `2025-01` and serving
 *   the same campaign as `2025-02` from `newsletters-manual.ts`, where the
 *   five readings behind that are written out. The `2025-01` entry stays here
 *   because this crawl is a record of what the legacy site said, not of what
 *   was true.
 * - November 2025 genuinely did not go out; the founder noticed in December.
 *   Confirmed 2026-09-02: the draft survives in Mailchimp titled "Newsletter -
 *   NOV DEC 2025" and was never sent — November was folded into December.
 *
 * RECOVERED: the seven March–September 2021 cards used to point at
 * `shesharp.org.nz/wp-content/uploads/2021/...`, all dead — the WordPress site
 * they were hosted on is gone, five returning 403 and two a soft-404 HTML page
 * under a `.pdf` URL, which is worse, because the browser renders a web page
 * instead of downloading the issue. Every one of those seven months also went
 * out as a Mailchimp campaign titled "She Sharp Newsletter - <Month> 2021", and
 * all seven are in the archive, so each card now serves the send instead. That
 * is the emailed issue, not the PDF: the PDF had its own layout and is still
 * only recoverable from the 2021 UpdraftPlus backup. Seven covers that opened
 * onto nothing now open onto the issue.
 */

import type { NewsletterIssue } from "@/types/newsletter";

export const NEWSLETTER_ARCHIVE: NewsletterIssue[] = [
  {
    id: "2026-05",
    month: 5,
    year: 2026,
    url: "/resources/newsletters/2026-05",
    source: "https://mailchi.mp/c80a84acaeb9/xe8t2dvmn3-5867183",
    campaign: "578dc30a92",
  },
  {
    id: "2026-04",
    month: 4,
    year: 2026,
    url: "/resources/newsletters/2026-04",
    source: "https://mailchi.mp/b697daeb0f62/xe8t2dvmn3-5865592",
    campaign: "b94b03986b",
  },
  {
    id: "2026-03",
    month: 3,
    year: 2026,
    url: "/resources/newsletters/2026-03",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5863769",
    campaign: "ac964c7ac5",
  },
  {
    id: "2026-02",
    month: 2,
    year: 2026,
    url: "/resources/newsletters/2026-02",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5863769",
    campaign: "ac964c7ac5",
  },
  {
    id: "2025-12",
    month: 12,
    year: 2025,
    url: "/resources/newsletters/2025-12",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5862634",
    campaign: "8d3bb9b4fe",
  },
  {
    id: "2025-10",
    month: 10,
    year: 2025,
    url: "/resources/newsletters/2025-10",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=0df2326c60",
    campaign: "0df2326c60",
  },
  {
    id: "2025-09",
    month: 9,
    year: 2025,
    url: "/resources/newsletters/2025-09",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5859928",
    campaign: "d64e5d9fbb",
  },
  {
    id: "2025-08",
    month: 8,
    year: 2025,
    url: "/resources/newsletters/2025-08",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5859117",
    campaign: "3b6d93487e",
  },
  {
    id: "2025-07",
    month: 7,
    year: 2025,
    url: "/resources/newsletters/2025-07",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5858500",
    campaign: "d388b32073",
  },
  {
    id: "2025-06",
    month: 6,
    year: 2025,
    url: "/resources/newsletters/2025-06",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5857733",
    campaign: "26d04f015e",
  },
  {
    id: "2025-05",
    month: 5,
    year: 2025,
    url: "/resources/newsletters/2025-05",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5856902",
    campaign: "f2f1482172",
  },
  {
    id: "2025-04",
    month: 4,
    year: 2025,
    url: "/resources/newsletters/2025-04",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5856322",
    campaign: "bcb91ae408",
  },
  {
    id: "2025-03",
    month: 3,
    year: 2025,
    url: "/resources/newsletters/2025-03",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025",
    campaign: "bd8ae1698f",
  },
  {
    id: "2025-01",
    month: 1,
    year: 2025,
    url: "/resources/newsletters/2025-01",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-december2024-5854405",
    campaign: "dcc451d2d3",
  },
  {
    id: "2024-12",
    month: 12,
    year: 2024,
    url: "/resources/newsletters/2024-12",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-december2024",
    campaign: "e24b1e8e29",
  },
  {
    id: "2024-11",
    month: 11,
    year: 2024,
    url: "/resources/newsletters/2024-11",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-november2024",
    campaign: "b6b28f4f6b",
  },
  {
    id: "2024-10",
    month: 10,
    year: 2024,
    url: "/resources/newsletters/2024-10",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-october2024",
    campaign: "d28cdd1dee",
  },
  {
    id: "2024-09",
    month: 9,
    year: 2024,
    url: "/resources/newsletters/2024-09",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-july2024-5849726",
    campaign: "1c87447a73",
  },
  {
    id: "2024-08",
    month: 8,
    year: 2024,
    url: "/resources/newsletters/2024-08",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=45a4a31bb3",
    campaign: "45a4a31bb3",
  },
  {
    id: "2024-07",
    month: 7,
    year: 2024,
    url: "/resources/newsletters/2024-07",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-july2024",
    campaign: "8a5a8b91ca",
  },
  {
    id: "2024-06",
    month: 6,
    year: 2024,
    url: "/resources/newsletters/2024-06",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-june2024",
    campaign: "1ce993f1f8",
  },
  {
    id: "2024-05",
    month: 5,
    year: 2024,
    url: "/resources/newsletters/2024-05",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-may2024",
    campaign: "a8be32a53d",
  },
  {
    id: "2024-04",
    month: 4,
    year: 2024,
    url: "/resources/newsletters/2024-04",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5671251",
    campaign: "ef75ef8bd7",
  },
  {
    id: "2024-03",
    month: 3,
    year: 2024,
    url: "/resources/newsletters/2024-03",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5669451",
    campaign: "bbdc3816a1",
  },
  {
    id: "2024-02",
    month: 2,
    year: 2024,
    url: "/resources/newsletters/2024-02",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5667707",
    campaign: "27933d3934",
  },
  {
    id: "2024-01",
    month: 1,
    year: 2024,
    url: "/resources/newsletters/2024-01",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5665331",
    campaign: "bedbcff7b4",
  },
  {
    id: "2023-12",
    month: 12,
    year: 2023,
    url: "/resources/newsletters/2023-12",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5652759",
    campaign: "95f516dccb",
  },
  {
    id: "2023-11",
    month: 11,
    year: 2023,
    url: "/resources/newsletters/2023-11",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5414610",
    campaign: "e2713aecbb",
  },
  {
    id: "2023-10",
    month: 10,
    year: 2023,
    url: "/resources/newsletters/2023-10",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-2023",
    campaign: "57399c255e",
  },
  {
    id: "2023-09",
    month: 9,
    year: 2023,
    url: "/resources/newsletters/2023-09",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-september-2023",
    campaign: "daa2b6fa45",
  },
  {
    id: "2023-08",
    month: 8,
    year: 2023,
    url: "/resources/newsletters/2023-08",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-august-2023",
    campaign: "432585d5c7",
  },
  {
    id: "2023-07",
    month: 7,
    year: 2023,
    url: "/resources/newsletters/2023-07",
    source: "https://mailchi.mp/shesharp/she-sharp-newsletter-july2023",
    campaign: "f96347184b",
  },
  {
    id: "2023-06",
    month: 6,
    year: 2023,
    url: "/resources/newsletters/2023-06",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=107784f2d5",
    campaign: "107784f2d5",
  },
  {
    id: "2023-05",
    month: 5,
    year: 2023,
    url: "/resources/newsletters/2023-05",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=6ae4e84676",
    campaign: "6ae4e84676",
  },
  {
    id: "2023-04",
    month: 4,
    year: 2023,
    url: "/resources/newsletters/2023-04",
    source: "https://mailchi.mp/shesharp/2023-may",
    campaign: "585e6ba099",
  },
  {
    id: "2023-03",
    month: 3,
    year: 2023,
    url: "/resources/newsletters/2023-03",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=74d6d8b4f5",
    campaign: "74d6d8b4f5",
  },
  {
    id: "2023-02",
    month: 2,
    year: 2023,
    url: "/resources/newsletters/2023-02",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=fffa1fe445",
    campaign: "fffa1fe445",
  },
  {
    id: "2022-12",
    month: 12,
    year: 2022,
    url: "/resources/newsletters/2022-12",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=279e8f7889",
    campaign: "279e8f7889",
  },
  {
    id: "2022-11",
    month: 11,
    year: 2022,
    url: "/resources/newsletters/2022-11",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=c186979078",
    campaign: "c186979078",
  },
  {
    id: "2022-10",
    month: 10,
    year: 2022,
    url: "/resources/newsletters/2022-10",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=35a651565b",
    campaign: "35a651565b",
  },
  {
    id: "2022-09",
    month: 9,
    year: 2022,
    url: "/resources/newsletters/2022-09",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=acc9062a04",
    campaign: "acc9062a04",
  },
  {
    id: "2022-08",
    month: 8,
    year: 2022,
    url: "/resources/newsletters/2022-08",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=481be5a70c",
    campaign: "481be5a70c",
  },
  {
    id: "2022-07",
    month: 7,
    year: 2022,
    url: "/resources/newsletters/2022-07",
    source: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=20cd1b9d69",
    campaign: "20cd1b9d69",
  },
  {
    id: "2022-05",
    month: 5,
    year: 2022,
    url: "/resources/newsletters/2022-05",
    source: "https://mailchi.mp/7cdfb4162416/she-sharp-newsletter-2022-5186505",
    campaign: "d4d23f0933",
  },
  {
    id: "2022-04",
    month: 4,
    year: 2022,
    url: "/resources/newsletters/2022-04",
    source: "https://mailchi.mp/fff2edf06c5b/she-sharp-newsletter-2022-5178745",
    campaign: "76e9687fc6",
  },
  {
    id: "2022-03",
    month: 3,
    year: 2022,
    url: "/resources/newsletters/2022-03",
    source: "https://mailchi.mp/fbae9b4afea4/she-sharp-newsletter-2022-5135178",
    campaign: "2fb11100b6",
  },
  {
    id: "2021-12",
    month: 12,
    year: 2021,
    url: "/resources/newsletters/2021-12",
    source: "https://mailchi.mp/92d1b889e6f2/she-sharp-newsletter-2021-4702918",
    campaign: "4feef8a3e7",
  },
  {
    id: "2021-11",
    month: 11,
    year: 2021,
    url: "/resources/newsletters/2021-11",
    source: "https://mailchi.mp/e24b596b9034/she-sharp-newsletter-2021-4693790",
    campaign: "f85cb4c7b4",
  },
  {
    id: "2021-10",
    month: 10,
    year: 2021,
    url: "/resources/newsletters/2021-10",
    source: "https://mailchi.mp/0e13ff4dda6f/she-sharp-newsletter-august2021-4680858",
    campaign: "0c9f9ef7f3",
  },
  {
    id: "2021-09",
    month: 9,
    year: 2021,
    url: "/resources/newsletters/2021-09",
    source: "https://shesharp.org.nz/wp-content/uploads/2021/09/September-2021-Newsletter.pdf",
    campaign: "d5be656a22",
  },
  {
    id: "2021-08",
    month: 8,
    year: 2021,
    url: "/resources/newsletters/2021-08",
    source: "https://shesharp.org.nz/wp-content/uploads/2021/08/August-2021-Newsletter.pdf",
    campaign: "7db3e54194",
  },
  {
    id: "2021-07",
    month: 7,
    year: 2021,
    url: "/resources/newsletters/2021-07",
    source: "https://shesharp.org.nz/wp-content/uploads/2021/07/July-2021-Newsletter.pdf",
    campaign: "e2f589a881",
  },
  {
    id: "2021-06",
    month: 6,
    year: 2021,
    url: "/resources/newsletters/2021-06",
    source: "https://shesharp.org.nz/wp-content/uploads/2021/05/June-2021-Newsletter.pdf",
    campaign: "dfa5cbe173",
  },
  {
    id: "2021-05",
    month: 5,
    year: 2021,
    url: "/resources/newsletters/2021-05",
    source: "https://shesharp.org.nz/wp-content/uploads/2021/05/May-2021-Newsletter.pdf",
    campaign: "7dda283a39",
  },
  {
    id: "2021-04",
    month: 4,
    year: 2021,
    url: "/resources/newsletters/2021-04",
    source: "https://shesharp.org.nz/wp-content/uploads/2021/04/April-2021-Newsletter.pdf",
    campaign: "0e7888af9a",
  },
  {
    id: "2021-03",
    month: 3,
    year: 2021,
    url: "/resources/newsletters/2021-03",
    source: "https://shesharp.org.nz/wp-content/uploads/2021/03/March-2021-Newsletter.pdf",
    campaign: "839196b7be",
  },
];
