import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Montserrat, Carattere } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { serializeData } from '@/lib/utils';
import { SWRConfig } from 'swr';
import { CookieBanner } from '@/components/cookie-banner';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from './providers';
import { JsonLd } from '@/components/seo/json-ld';
import { organizationSchema, websiteSchema } from '@/lib/seo/schema';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.shesharp.org.nz'),
  title: {
    default: 'She Sharp - Connecting Women in Technology',
    template: '%s | She Sharp',
  },
  description: 'She Sharp is on a mission to bridge the gender gap in STEM, one woman at a time. Through events, networking, and career development opportunities.',
  keywords: ['STEM', 'women', 'technology', 'mentorship', 'New Zealand', 'She Sharp'],
  // No root-level canonical: it would cascade to every page lacking its own and
  // make them all canonicalize to the homepage. The home page sets its own "/"
  // canonical; other pages self-canonicalize to their URL when none is set.
  icons: {
    icon: [
      { url: '/logos/she-sharp-logo-purple-dark-130x130.svg', type: 'image/svg+xml' },
      { url: '/logos/she-sharp-logo-purple-dark-130x130.png', sizes: '130x130', type: 'image/png' },
    ],
    shortcut: '/logos/she-sharp-logo-purple-dark-130x130.png',
    apple: '/logos/she-sharp-logo-purple-dark-500x500.png',
  },
  openGraph: {
    title: 'She Sharp - Connecting Women in Technology',
    description: 'She Sharp is on a mission to bridge the gender gap in STEM, one woman at a time. Through events, networking, and career development opportunities.',
    type: 'website',
    locale: 'en_NZ',
    url: 'https://www.shesharp.org.nz',
    siteName: 'She Sharp',
    images: [
      {
        url: '/og-cover.png',
        width: 1200,
        height: 630,
        alt: 'She Sharp — connecting women in technology',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'She Sharp - Connecting Women in Technology',
    description: 'Connecting women in tech through events, mentorship & careers.',
    images: ['/og-cover.png'],
  },
};

export const viewport: Viewport = {
  maximumScale: 1
};

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-sans'
});

const carattere = Carattere({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-brand-script'
});

/**
 * Helper to serialize async data for SWR fallback.
 * Wraps the promise to serialize Date objects to ISO strings.
 */
async function getSerializedUser() {
  const user = await getUser();
  return serializeData(user);
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-background text-foreground ${montserrat.variable} ${carattere.variable}`}
    >
      <body className="min-h-[100dvh]">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <Providers>
          <SWRConfig
            value={{
              fallback: {
                // Serialize data to convert Date objects to ISO strings
                // This prevents "Received an instance of Date" serialization errors
                '/api/user': getSerializedUser(),
              }
            }}
          >
            {children}
            <CookieBanner />
            <Toaster />
          </SWRConfig>
        </Providers>
      </body>
    </html>
  );
}
