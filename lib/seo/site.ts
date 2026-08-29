/**
 * Centralized SEO/site constants.
 *
 * Single source of truth for the canonical production origin, organization
 * facts, and social links used across robots.ts, sitemap.ts, manifest.ts,
 * JSON-LD schema builders, and the llms.txt routes. Keep this in sync with
 * `metadataBase` in app/layout.tsx and footerConfig in lib/config/footer.ts.
 */

import { footerConfig } from "@/lib/config/footer";

/** Canonical production origin (no trailing slash). */
export const SITE_URL = "https://www.shesharp.org.nz";

export const SITE_NAME = "She Sharp";

export const SITE_DESCRIPTION =
  "She Sharp is a New Zealand non-profit on a mission to bridge the gender gap in STEM, one woman at a time — through events, mentorship, networking, and career development.";

/** NZ Charities Register number, mirrored from the footer config. */
export const CHARITY_REGISTRATION = footerConfig.charityInfo.registrationNumber;
export const CHARITY_REGISTRATION_URL =
  footerConfig.charityInfo.registrationLink;

/** Legal name exactly as it appears on the Charities Register. */
export const LEGAL_NAME = footerConfig.charityInfo.name;

/** NZ Business Number, from the same register entry. */
export const NZBN = footerConfig.charityInfo.nzbn;

/**
 * Absolute social profile URLs, for JSON-LD `sameAs`.
 *
 * This used to filter out an entry literally named "Mailchimp", because the
 * newsletter archive sat in `socialLinks` and `sameAs` must list profiles the
 * organisation controls, not a mail vendor's archive page. The archive moved to
 * `footerConfig.newsletterArchive`, so the whole list is now profiles and the
 * filter is gone — but keep it that way: anything non-profile added back to
 * `socialLinks` would land in `sameAs` unnoticed.
 */
export const SOCIAL_LINKS = footerConfig.socialLinks.map((link) => link.href);

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
