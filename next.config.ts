import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: 'incremental',
    clientSegmentCache: true,
  },
  images: {
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
      { source: '/user-account', destination: '/dashboard/account', permanent: true },
      { source: '/access-denied', destination: '/', permanent: true },
      { source: '/introducing-elina-ashimbayeva', destination: '/about', permanent: true },
      // Legacy event / conference URLs → current event slugs.
      { source: '/events-gec', destination: '/events/google-educator-conference', permanent: true },
      { source: '/conference/2024/google-educator2024', destination: '/events/google-educator-conference-2024', permanent: true },
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
    ];
  },
};

export default nextConfig;
