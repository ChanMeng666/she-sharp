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
import crosswalkJson from "./json/mailchimp/crosswalk.json";
import manifestJson from "./json/mailchimp/manifest.json";
import tagRulesJson from "./json/mailchimp/tag-rules.json";
import tagsJson from "./json/mailchimp/tags.json";

import type {
  MailchimpAggregates,
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
