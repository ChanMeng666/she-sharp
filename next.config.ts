import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: 'incremental',
    clientSegmentCache: true,
  },
  // Temporarily hide the mentorship application forms while the programme is
  // paused. Visitors hitting these routes directly are sent to the coming-soon
  // placeholder. Remove this block to re-open applications.
  async redirects() {
    return [
      {
        source: '/mentorship/mentee/apply',
        destination: '/mentorship/coming-soon',
        permanent: false,
      },
      {
        source: '/mentorship/mentor/apply',
        destination: '/mentorship/coming-soon',
        permanent: false,
      },
    ];
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
};

export default nextConfig;
