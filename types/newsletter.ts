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
