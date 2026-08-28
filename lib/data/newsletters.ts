/**
 * Mailchimp configuration for the newsletter.
 *
 * Only the archive link remains. Subscribing used to send visitors out to a
 * Mailchimp hosted form, but the subscriber list now lives in this project's
 * own database and every subscribe entry point points at `/newsletter/subscribe`
 * instead — so the old `subscribeUrl` was removed rather than left as a second,
 * silently diverging way to join the list. The archive still has to be
 * Mailchimp's: it is the only route to the pre-August-2026 back catalogue,
 * which was never sent from here.
 */

import type { MailchimpConfig } from "@/types/newsletter";

export const MAILCHIMP_CONFIG: MailchimpConfig = {
  archiveUrl:
    "https://us3.campaign-archive.com/home/?u=1bcf1c40837f51b409973326f&id=31bd05e8eb",
};
