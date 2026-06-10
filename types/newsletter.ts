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

export interface MailchimpConfig {
  archiveUrl: string;
  subscribeUrl: string;
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
  /** Mailchimp campaign link the cover opens. */
  url: string;
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
  { bg: "#f4f4fa", fg: "#8982ff" }, // periwinkle-light bg, periwinkle text
  { bg: "#9b2e83", fg: "#ffffff" }, // purple-dark bg, white text
  { bg: "#f6e7f1", fg: "#9b2e83" }, // pink tint bg, purple-dark text
  { bg: "#8982ff", fg: "#ffffff" }, // periwinkle bg, white text
  { bg: "#b1f6e9", fg: "#1f1e44" }, // mint bg, navy text
  { bg: "#f6e7f1", fg: "#8982ff" }, // pink tint bg, periwinkle text
];
