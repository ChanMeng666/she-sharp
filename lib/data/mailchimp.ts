/**
 * The Mailchimp audience archive: typed access to what survived the export.
 *
 * She Sharp's newsletter went out from Mailchimp from 2019 until the move to
 * Resend. The raw exports are 3,689 contacts with names, employers, phone
 * numbers, street addresses and the IP address each person signed up from, so
 * they live in a gitignored vault; what is committed under
 * `lib/data/json/mailchimp/` is counts, a tag vocabulary and file checksums.
 * This module is the single place that reads it.
 *
 * **Read `docs/development/MAILCHIMP_ARCHIVE.md` before quoting any number from
 * here.** Three traps in particular:
 *
 *  - The audience is 3,689 contacts and the mailing list is 1,560. The other
 *    2,129 left, hard-bounced, or never subscribed at all.
 *  - Mailchimp's own dashboard says 3,145, because the UI figure excludes the
 *    544 cleaned. Both numbers are right; quoting them together is not.
 *  - A tag is not attendance. `Event:` and `Ticket Type:` tags record a ticket
 *    list pasted into Mailchimp. `lib/data/humanitix.ts` is authoritative for
 *    who actually turned up.
 *
 * Nothing here is rendered on the public site. The archive exists to be read,
 * cited with provenance, and to keep the migration honest — and the running
 * application deliberately has no path to a real address.
 */
import aggregatesJson from "./json/mailchimp/aggregates.json";
import campaignsJson from "./json/mailchimp/campaigns.json";
import crosswalkJson from "./json/mailchimp/crosswalk.json";
import manifestJson from "./json/mailchimp/manifest.json";
import tagRulesJson from "./json/mailchimp/tag-rules.json";
import tagsJson from "./json/mailchimp/tags.json";

import type {
  MailchimpAggregates,
  MailchimpCampaign,
  MailchimpCampaigns,
  MailchimpCrosswalk,
  MailchimpManifest,
  MailchimpTag,
  MailchimpTagKind,
  MailchimpTagRules,
  MailchimpTags,
} from "@/types/mailchimp";

export const mailchimpManifest = manifestJson as unknown as MailchimpManifest;
export const mailchimpAggregates = aggregatesJson as unknown as MailchimpAggregates;
export const mailchimpTags = tagsJson as unknown as MailchimpTags;
export const mailchimpTagRules = tagRulesJson as unknown as MailchimpTagRules;
export const mailchimpCrosswalk = crosswalkJson as unknown as MailchimpCrosswalk;
export const mailchimpCampaigns = campaignsJson as unknown as MailchimpCampaigns;

/**
 * Looks up a tag's classification.
 *
 * @param tag The tag string exactly as Mailchimp holds it.
 * @returns Its kind, or null when the tag is not in this export. Null rather
 *   than a default kind: a tag nobody has classified must not silently acquire
 *   a meaning.
 */
export function resolveTagKind(tag: string): MailchimpTagKind | null {
  return mailchimpTags.tags.find((entry) => entry.tag === tag)?.kind ?? null;
}

/**
 * The Mailchimp tags that point at one site event.
 *
 * An array, not a single tag: five of She Sharp's events were tagged twice, an
 * early short tag and a later fuller one. Summing their `contacts` would count
 * the same people twice — see `mailchimpCrosswalk.multiTagEvents`.
 *
 * @param slug A site event slug, as used by `getEventBySlug()`.
 */
export function mailchimpTagsForSlug(slug: string): MailchimpTag[] {
  const wanted = new Set(
    mailchimpCrosswalk.links.filter((link) => link.siteSlug === slug).map((link) => link.tag)
  );
  return mailchimpTags.tags.filter((tag) => wanted.has(tag.tag));
}

/**
 * Sign-ups per calendar year, oldest first.
 *
 * **This is not list size in that year.** It counts contacts whose `OPTIN_TIME`
 * falls in the year, across every status — so it includes people who have since
 * unsubscribed or bounced, and subtracting them is not possible: an unsubscribe
 * records when somebody left, never which year's cohort they joined in. Read it
 * as "how many people we recruited that year" and nothing else.
 */
export function signupsByYear(): { year: string; contacts: number }[] {
  return mailchimpAggregates.byOptinYear.map((entry) => ({
    year: entry.key,
    contacts: entry.contacts,
  }));
}

/**
 * The one figure that is a mailing list.
 *
 * Every other total in this archive counts people who may not be emailed. This
 * is here so that reaching for the list size is easier than reaching for the
 * contact count, which is the mistake the whole archive is shaped to prevent.
 */
export function subscribedCount(): number {
  return mailchimpAggregates.totals.subscribed;
}

/**
 * The audience's size at the end of every month, oldest first.
 *
 * The one series the CSV export could never produce. A status-partitioned
 * export is a snapshot of the present: it records that somebody unsubscribed
 * and when, but not which cohort they had joined in, so list size in a past
 * year cannot be reconstructed from it. Mailchimp kept the monthly snapshot
 * server-side, and this is it.
 *
 * **Each `subscribed` is a STOCK, not that month's additions.** The series is
 * not monotonic — it peaks in November 2025 and declines through 2026 — so
 * differencing two points gives net movement, never sign-ups.
 */
export function listSizeByMonth(): { month: string; subscribed: number }[] {
  return mailchimpCampaigns.growth.map((point) => ({
    month: point.month,
    subscribed: point.subscribed,
  }));
}

/**
 * Campaigns sent inside a window, oldest first.
 *
 * **A floor by construction.** Campaigns sent to fewer than
 * `mailchimpCampaigns.campaigns.floor` people are counted in `belowFloor` and
 * never named, so they cannot appear here — and four of this account's sends
 * are below it. For any whole-account figure, and for anything a funder reads,
 * use `mailchimpCampaigns.totals`, which counts every send including those.
 *
 * @param fromIso Inclusive lower bound, `YYYY-MM-DD` or a full ISO timestamp.
 * @param toIso Inclusive upper bound, same. A bare date covers the whole day.
 */
export function campaignsSentBetween(fromIso: string, toIso: string): MailchimpCampaign[] {
  // `sentAt` is a UTC ISO timestamp in a fixed format, so a lexicographic
  // compare is exact and needs no Date parsing. A bare `YYYY-MM-DD` upper bound
  // would otherwise exclude everything sent on that day — the off-by-one a
  // caller writing `--to 2026-06-30` would never see. The `+00:00` suffix is
  // the one the API returns, so a send at exactly 23:59:59 compares equal
  // rather than depending on how `+` and `Z` happen to sort.
  const upper = /^\d{4}-\d{2}-\d{2}$/.test(toIso) ? `${toIso}T23:59:59+00:00` : toIso;
  return mailchimpCampaigns.campaigns.sent.filter(
    (campaign) => campaign.sentAt >= fromIso && campaign.sentAt <= upper
  );
}
