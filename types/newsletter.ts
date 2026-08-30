/**
 * Newsletter type definitions for Mailchimp integration
 */

export type NewsletterCategory = "monthly" | "event";

export const NEWSLETTER_CATEGORY_LABELS: Record<NewsletterCategory, string> = {
  monthly: "Monthly Newsletter",
  event: "Event Announcement",
};

export interface MailchimpNewsletter {
  id: string;
  title: string;
  date: string; // Display date: "October 31, 2025"
  dateRaw: string; // ISO for sorting: "2025-10-31"
  mailchimpUrl: string; // Link to Mailchimp campaign
  category: NewsletterCategory;
  isFeatured?: boolean;
}

/**
 * A single monthly newsletter issue rendered as a CSS-generated cover card.
 * Covers are produced entirely from `month`/`year` — no image files needed.
 */
export interface NewsletterIssue {
  /** Stable sort/dedupe key, e.g. "2025-05" (zero-padded month). */
  id: string;
  /** Calendar month, 1-12. */
  month: number;
  /** Four-digit year. */
  year: number;
  /**
   * Where the cover opens — always `/resources/newsletters/<id>` now, served by
   * this repo from the archived send or from the issue fixture. It used to be
   * the Mailchimp campaign link, and 51 of these opened a `mailchi.mp` page
   * that stops existing when the subscription is cancelled.
   */
  url: string;
  /**
   * The external URL this issue was originally published at, kept verbatim as
   * provenance and as the join key the archive guard re-derives `campaign`
   * from. Absent for issues that were never published anywhere but here.
   *
   * Not a link the site renders. The seven 2021 entries carry a
   * `shesharp.org.nz/wp-content/…` PDF that has been dead since the WordPress
   * site went away, which is a record of where the issue used to live, not a
   * destination.
   */
  source?: string;
  /**
   * The archived Mailchimp campaign (`lib/data/newsletter-archive/<id>.html`)
   * that `url` serves. Absent when the issue has no Mailchimp send — either it
   * was built and mailed from this repo, or it is retracted.
   */
  campaign?: string;
  /** Optional explicit cover theme index; when omitted the grid rotates by position. */
  theme?: number;
}

/**
 * Uppercase month labels shown on the generated cover, matching the legacy
 * Webflow site's mixed abbreviation style (e.g. MARCH/APRIL spelled out, SEPT).
 */
export const MONTH_COVER_LABELS: Record<number, string> = {
  1: "JAN",
  2: "FEB",
  3: "MARCH",
  4: "APRIL",
  5: "MAY",
  6: "JUNE",
  7: "JULY",
  8: "AUG",
  9: "SEPT",
  10: "OCT",
  11: "NOV",
  12: "DEC",
};

/** Full month names used for the card caption and accessible labels. */
export const MONTH_FULL_NAMES: Record<number, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

/**
 * Background/foreground color pairs the newsletter covers rotate through,
 * replicating the legacy site's bracket-motif palette. Values map to the
 * brand tokens in styles/tokens/colors.css.
 */
export interface NewsletterCoverTheme {
  bg: string;
  fg: string;
}

export const NEWSLETTER_COVER_THEMES: NewsletterCoverTheme[] = [
  { bg: "#f4f4fa", fg: "#8982ff" }, // periwinkle light / periwinkle dark
  { bg: "#9b2e83", fg: "#ffffff" }, // purple dark / white
  { bg: "#f7e5f3", fg: "#9b2e83" }, // purple light / purple dark
  { bg: "#8982ff", fg: "#ffffff" }, // periwinkle dark / white
  { bg: "#b1f6e9", fg: "#1f1e44" }, // mint dark / navy dark
  { bg: "#1f1e44", fg: "#b1f6e9" }, // navy dark / mint dark
  { bg: "#c846ab", fg: "#ffffff" }, // purple mid / white
  { bg: "#eaf2ff", fg: "#1378d1" }, // navy light / accessible blue
  { bg: "#f7e5f3", fg: "#c846ab" }, // purple light / purple mid
  { bg: "#effefb", fg: "#8982ff" }, // mint light / periwinkle dark
  { bg: "#eaf2ff", fg: "#1f1e44" }, // navy light / navy dark
  { bg: "#f4f4fa", fg: "#1378d1" }, // periwinkle light / accessible blue
];
