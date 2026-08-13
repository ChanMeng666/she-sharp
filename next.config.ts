import type { NextConfig } from 'next';

import {
  PITCH_DECK_TEMPLATE_2026_PATH,
  PITCH_DECK_TEMPLATE_2026_PDF,
} from './lib/config/assets';

const nextConfig: NextConfig = {
  experimental: {
    ppr: 'incremental',
    clientSegmentCache: true,
  },
  images: {
    // AVIF first, WebP second. The optimizer picks the first format the
    // requesting browser accepts, so older clients still get WebP and the
    // rest fall back to the original encoding.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  /**
   * Cache headers for the static asset folders under `public/`.
   *
   * Next.js sends `Cache-Control: public, max-age=0, must-revalidate` for
   * everything in `public/` by default, so every photo, logo and video was
   * re-validated on every navigation. These files change rarely, so a day of
   * browser cache plus a week of stale-while-revalidate is a large win.
   *
   * Deliberately SHORT-lived and deliberately NOT `immutable`: the filenames
   * are not content-hashed, and a follow-up PR recompresses and renames the
   * asset pool. `immutable` (and a year-long max-age) can only be added once
   * the URLs carry a fingerprint, otherwise a re-encoded photo would be stuck
   * in browser caches with no way to bust it.
   *
   * `/docs/*` is left alone on purpose — the PDFs are a separate migration.
   */
  async headers() {
    const assetCacheControl =
      'public, max-age=86400, stale-while-revalidate=604800';
    return [
      {
        source: '/img/:path*',
        headers: [{ key: 'Cache-Control', value: assetCacheControl }],
      },
      {
        source: '/logos/:path*',
        headers: [{ key: 'Cache-Control', value: assetCacheControl }],
      },
      {
        source: '/video/:path*',
        headers: [{ key: 'Cache-Control', value: assetCacheControl }],
      },
    ];
  },
  /**
   * Permanent redirects from the legacy (pre-migration) URL structure to the
   * current routes. These old URLs are still in search-engine indexes but now
   * return 404 (verified 2026-06-23); 301-ing them consolidates link equity onto
   * the live pages and speeds de-indexing of the dead URLs. More specific rules
   * are listed before the broader `/media/*` catch-all (first match wins).
   */
  async redirects() {
    return [
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/about-us/:path*', destination: '/about', permanent: true },
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/mentorship/mentorship-program', destination: '/mentorship', permanent: true },
      // Legacy route renames surfaced by GSC 404 / not-indexed reports (2026-07-07).
      { source: '/mentorship/meet-our-mentors', destination: '/mentorship', permanent: true },
      { source: '/mentorship/become-a-mentor', destination: '/mentorship/mentor', permanent: true },
      { source: '/get-involved', destination: '/join-our-team', permanent: true },
      // Points at /sign-in, NOT /dashboard/account. GSC reported /user-account
      // as "Indexed, though blocked by robots.txt" (2026-08-09): the old target
      // sits under the robots-disallowed /dashboard/ prefix, so Googlebot could
      // never complete the hop and kept the stale URL in the index. /sign-in is
      // crawlable and carries `noindex`, which lets the old URL drop out.
      { source: '/user-account', destination: '/sign-in', permanent: true },
      { source: '/access-denied', destination: '/', permanent: true },
      // Plural variant — the redirect to /mentorship/mentorship-program was
      // requested years ago, which means something external was linking here.
      { source: '/mentorships', destination: '/mentorship', permanent: true },
      { source: '/mentorships/:path*', destination: '/mentorship', permanent: true },
      // Through 2021 every newsletter led with a full interview with a woman
      // working in tech, published at /introducing-<name>/ with the newsletter
      // carrying only a summary and a jump link. Ten of those pages existed;
      // all ten died with the old site and the links are still sitting in
      // years of sent email. They point at the newsletter archive rather than
      // /about, because that is where the interviews ran.
      //
      // The pages themselves are recoverable from the Internet Archive, but
      // republishing a five-year-old personal interview needs the subject's
      // agreement first — that is a decision, not a migration.
      { source: '/introducing-:name', destination: '/resources/newsletters', permanent: true },
      // Legacy event / conference URLs → current event slugs.
      { source: '/events-gec', destination: '/events/google-educator-conference', permanent: true },
      { source: '/conference/2024/google-educator2024', destination: '/events/google-educator-conference-2024', permanent: true },
      { source: '/conference/google-educator', destination: '/events/google-educator-conference-2023', permanent: true },
      { source: '/conference/schedule', destination: '/events/google-educator-conference-2023', permanent: true },
      // Was falling through to the /conference/:path* catch-all and landing on
      // /events (GSC 404 drilldown, 2026-08-09). Its 2024 sibling already had a
      // specific rule; this gives the 2023 edition the same treatment.
      { source: '/conference/2023/google-educator2023', destination: '/events/google-educator-conference-2023', permanent: true },
      // Catch-all for the rest of the old /conference/<year>/<slug> namespace.
      // Keep it AFTER the specific rules above — first match wins.
      { source: '/conference', destination: '/events', permanent: true },
      { source: '/conference/:path*', destination: '/events', permanent: true },
      {
        source: '/events/she-sharp-academyex-international-womens-day-2026',
        destination: '/events/she-sharp-and-academyex-international-womens-day-2026',
        permanent: true,
      },
      {
        source: '/events/international-womens-day-2026',
        destination: '/events/she-sharp-and-academyex-international-womens-day-2026',
        permanent: true,
      },
      { source: '/events/shesharp-ai-envirohack-2022-info', destination: '/events', permanent: true },
      // Surfaced by the GSC "Not found (404)" drilldown, 2026-08-09. This one is
      // a live event still in circulation under a slug the site never served —
      // the page it should reach is the second most internally-linked event on
      // the site, so the dead URL is costing real traffic.
      {
        source: '/events/she-sharp-myob-working-smarter-ai-myob-and-the-new-delivery-landscape',
        destination: '/events/she-sharp-and-myob-working-smarter',
        permanent: true,
      },
      // Remaining still-404 legacy URLs from the same drilldown. The WordPress
      // /category/* namespace and /paypal-checkout both predate the Webflow
      // site; /coming-soon was Webflow's placeholder page.
      { source: '/category/donation', destination: '/donate', permanent: true },
      { source: '/paypal-checkout', destination: '/donate', permanent: true },
      { source: '/sponsors/contact', destination: '/sponsors/corporate-sponsorship', permanent: true },
      { source: '/coming-soon', destination: '/', permanent: true },
      // Old WordPress newsletter PDFs → newsletters hub.
      { source: '/wp-content/uploads/2021/05/June-2021-Newsletter.pdf', destination: '/resources/newsletters', permanent: true },
      { source: '/wp-content/uploads/2021/08/August-2021-Newsletter.pdf', destination: '/resources/newsletters', permanent: true },
      { source: '/media/news-and-press', destination: '/resources/in-the-press', permanent: true },
      { source: '/media/podcasts', destination: '/resources/podcasts', permanent: true },
      { source: '/media/newsletters', destination: '/resources/newsletters', permanent: true },
      { source: '/media/gallery', destination: '/resources/photo-gallery', permanent: true },
      // Surfaced by the GSC duplicate-canonical drilldown (2026-07-31): without
      // this it fell through to the /media/:path* catch-all and landed on the
      // wrong page (/resources instead of the gallery).
      { source: '/media/photo-gallery', destination: '/resources/photo-gallery', permanent: true },
      // Catch-all for any remaining legacy /media/* path → resources hub.
      { source: '/media', destination: '/resources', permanent: true },
      { source: '/media/:path*', destination: '/resources', permanent: true },
      // Not a legacy URL — an indirection that exists to keep a QR code dense.
      //
      // The pitch-deck PDF moved to Vercel Blob, but the hackathon deck projects
      // its URL as a QR sharing a slide with two other codes, so each is drawn
      // small. At level M the short URL below encodes to 33×33 while the 89-byte
      // Blob URL needs 41×41 — a quarter off the module size in the same
      // physical square. The slide therefore keeps the short URL and this rule
      // does the hop. See `lib/config/assets.ts` for the measurements.
      //
      // `redirects()` runs BEFORE the filesystem, so this wins over the copy
      // still sitting in `public/docs/` (verified locally) and keeps working
      // unchanged once that copy is deleted. `permanent` is right here because
      // a document URL never needs re-pointing — unlike a feedback code, where
      // a cached 308 on someone's phone would be unrecoverable.
      {
        source: PITCH_DECK_TEMPLATE_2026_PATH,
        destination: PITCH_DECK_TEMPLATE_2026_PDF,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
