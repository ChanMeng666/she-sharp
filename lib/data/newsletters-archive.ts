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
 * All other links are kept exactly as served by the live site. February 2026
 * points at the March 2026 campaign here because the source site did; it is
 * suppressed at render time via NEWSLETTER_RETRACTED in
 * `newsletters-manual.ts` rather than deleted, so this crawl stays faithful.
 * Mailchimp's own archive has no newsletter between 24 December 2025 and
 * 3 March 2026 — the February issue slipped and went out as March.
 *
 * Gaps here mean the legacy site had no card for that month. That is NOT the
 * same as "no newsletter went out", and this comment used to claim it was.
 * Corrected against the Slack archive:
 * - June 2022 WAS published. The draft was proofread in-channel on 2022-06-27
 *   and sent that afternoon; the campaign is titled "She Sharp Newsletter -
 *   June 2022" and still resolves. It is restored in `newsletters-manual.ts`.
 *   The legacy site was missing four issues in this stretch, and this was the
 *   last of them not to be recovered.
 * - February 2025 is unresolved. The February issue was written, laid out,
 *   reviewed and confirmed sent, but the most likely explanation is that it
 *   went out at the end of February under the name
 *   `she-sharp-newsletter-march2025` — i.e. it is the `2025-03` entry below,
 *   not a missing issue. Needs a human to check the send date in Mailchimp.
 * - November 2025 genuinely did not go out; the founder noticed in December.
 *
 * KNOWN BROKEN: the seven 2021 entries pointing at
 * `shesharp.org.nz/wp-content/uploads/2021/...` are all dead. The WordPress
 * site they were hosted on is gone: five return 403 and two return a soft-404
 * HTML page under a `.pdf` URL, which is worse — the browser renders a web
 * page instead of downloading the issue. Every 2021 issue had a proper PDF;
 * recovering them means pulling the originals out of the 2021 UpdraftPlus
 * backup and self-hosting them under `/docs/`. Until someone does, these seven
 * covers open onto nothing.
 */

import type { NewsletterIssue } from "@/types/newsletter";

export const NEWSLETTER_ARCHIVE: NewsletterIssue[] = [
  {
    id: "2026-05",
    month: 5,
    year: 2026,
    url: "https://mailchi.mp/c80a84acaeb9/xe8t2dvmn3-5867183",
  },
  {
    id: "2026-04",
    month: 4,
    year: 2026,
    url: "https://mailchi.mp/b697daeb0f62/xe8t2dvmn3-5865592",
  },
  {
    id: "2026-03",
    month: 3,
    year: 2026,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5863769",
  },
  {
    id: "2026-02",
    month: 2,
    year: 2026,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5863769",
  },
  {
    id: "2025-12",
    month: 12,
    year: 2025,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5862634",
  },
  {
    id: "2025-10",
    month: 10,
    year: 2025,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=0df2326c60",
  },
  {
    id: "2025-09",
    month: 9,
    year: 2025,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5859928",
  },
  {
    id: "2025-08",
    month: 8,
    year: 2025,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5859117",
  },
  {
    id: "2025-07",
    month: 7,
    year: 2025,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5858500",
  },
  {
    id: "2025-06",
    month: 6,
    year: 2025,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5857733",
  },
  {
    id: "2025-05",
    month: 5,
    year: 2025,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5856902",
  },
  {
    id: "2025-04",
    month: 4,
    year: 2025,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025-5856322",
  },
  {
    id: "2025-03",
    month: 3,
    year: 2025,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-march2025",
  },
  {
    id: "2025-01",
    month: 1,
    year: 2025,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-december2024-5854405",
  },
  {
    id: "2024-12",
    month: 12,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-december2024",
  },
  {
    id: "2024-11",
    month: 11,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-november2024",
  },
  {
    id: "2024-10",
    month: 10,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-october2024",
  },
  {
    id: "2024-09",
    month: 9,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-july2024-5849726",
  },
  {
    id: "2024-08",
    month: 8,
    year: 2024,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=45a4a31bb3",
  },
  {
    id: "2024-07",
    month: 7,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-july2024",
  },
  {
    id: "2024-06",
    month: 6,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-june2024",
  },
  {
    id: "2024-05",
    month: 5,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-may2024",
  },
  {
    id: "2024-04",
    month: 4,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5671251",
  },
  {
    id: "2024-03",
    month: 3,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5669451",
  },
  {
    id: "2024-02",
    month: 2,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5667707",
  },
  {
    id: "2024-01",
    month: 1,
    year: 2024,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5665331?e=efe01823bb",
  },
  {
    id: "2023-12",
    month: 12,
    year: 2023,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5652759?e=efe01823bb",
  },
  {
    id: "2023-11",
    month: 11,
    year: 2023,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-5414610?e=efe01823bb",
  },
  {
    id: "2023-10",
    month: 10,
    year: 2023,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-october-2023?e=00b1b089f2",
  },
  {
    id: "2023-09",
    month: 9,
    year: 2023,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-september-2023",
  },
  {
    id: "2023-08",
    month: 8,
    year: 2023,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-august-2023",
  },
  {
    id: "2023-07",
    month: 7,
    year: 2023,
    url: "https://mailchi.mp/shesharp/she-sharp-newsletter-july2023",
  },
  {
    id: "2023-06",
    month: 6,
    year: 2023,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=107784f2d5",
  },
  {
    id: "2023-05",
    month: 5,
    year: 2023,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=6ae4e84676",
  },
  {
    id: "2023-04",
    month: 4,
    year: 2023,
    url: "https://mailchi.mp/shesharp/2023-may",
  },
  {
    id: "2023-03",
    month: 3,
    year: 2023,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=74d6d8b4f5",
  },
  {
    id: "2023-02",
    month: 2,
    year: 2023,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=fffa1fe445",
  },
  {
    id: "2022-12",
    month: 12,
    year: 2022,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=279e8f7889",
  },
  {
    id: "2022-11",
    month: 11,
    year: 2022,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=c186979078",
  },
  {
    id: "2022-10",
    month: 10,
    year: 2022,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=35a651565b",
  },
  {
    id: "2022-09",
    month: 9,
    year: 2022,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=acc9062a04",
  },
  {
    id: "2022-08",
    month: 8,
    year: 2022,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=481be5a70c",
  },
  {
    id: "2022-07",
    month: 7,
    year: 2022,
    url: "https://us3.campaign-archive.com/?u=1bcf1c40837f51b409973326f&id=20cd1b9d69",
  },
  {
    id: "2022-05",
    month: 5,
    year: 2022,
    url: "https://mailchi.mp/7cdfb4162416/she-sharp-newsletter-2022-5186505",
  },
  {
    id: "2022-04",
    month: 4,
    year: 2022,
    url: "https://mailchi.mp/fff2edf06c5b/she-sharp-newsletter-2022-5178745",
  },
  {
    id: "2022-03",
    month: 3,
    year: 2022,
    url: "https://mailchi.mp/fbae9b4afea4/she-sharp-newsletter-2022-5135178",
  },
  {
    id: "2021-12",
    month: 12,
    year: 2021,
    url: "https://mailchi.mp/92d1b889e6f2/she-sharp-newsletter-2021-4702918?e=20bef7c4a0",
  },
  {
    id: "2021-11",
    month: 11,
    year: 2021,
    url: "https://mailchi.mp/e24b596b9034/she-sharp-newsletter-2021-4693790?e=20bef7c4a0",
  },
  {
    id: "2021-10",
    month: 10,
    year: 2021,
    url: "https://mailchi.mp/0e13ff4dda6f/she-sharp-newsletter-august2021-4680858?e=20bef7c4a0",
  },
  {
    id: "2021-09",
    month: 9,
    year: 2021,
    url: "https://shesharp.org.nz/wp-content/uploads/2021/09/September-2021-Newsletter.pdf",
  },
  {
    id: "2021-08",
    month: 8,
    year: 2021,
    url: "https://shesharp.org.nz/wp-content/uploads/2021/08/August-2021-Newsletter.pdf",
  },
  {
    id: "2021-07",
    month: 7,
    year: 2021,
    url: "https://shesharp.org.nz/wp-content/uploads/2021/07/July-2021-Newsletter.pdf",
  },
  {
    id: "2021-06",
    month: 6,
    year: 2021,
    url: "https://shesharp.org.nz/wp-content/uploads/2021/05/June-2021-Newsletter.pdf",
  },
  {
    id: "2021-05",
    month: 5,
    year: 2021,
    url: "https://shesharp.org.nz/wp-content/uploads/2021/05/May-2021-Newsletter.pdf",
  },
  {
    id: "2021-04",
    month: 4,
    year: 2021,
    url: "https://shesharp.org.nz/wp-content/uploads/2021/04/April-2021-Newsletter.pdf",
  },
  {
    id: "2021-03",
    month: 3,
    year: 2021,
    url: "https://shesharp.org.nz/wp-content/uploads/2021/03/March-2021-Newsletter.pdf",
  },
];
