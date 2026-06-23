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
      { source: '/media/news-and-press', destination: '/resources/in-the-press', permanent: true },
      { source: '/media/podcasts', destination: '/resources/podcasts', permanent: true },
      { source: '/media/newsletters', destination: '/resources/newsletters', permanent: true },
      { source: '/media/gallery', destination: '/resources/photo-gallery', permanent: true },
      // Catch-all for any remaining legacy /media/* path → resources hub.
      { source: '/media', destination: '/resources', permanent: true },
      { source: '/media/:path*', destination: '/resources', permanent: true },
    ];
  },
};

export default nextConfig;
