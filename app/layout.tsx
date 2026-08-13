import './globals.css';
import type { Metadata, Viewport } from 'next';
import { heading, sans, brandScript } from '@/lib/fonts';
import { CookieBanner } from '@/components/cookie-banner';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from './providers';
import { JsonLd } from '@/components/seo/json-ld';
import { organizationSchema, websiteSchema } from '@/lib/seo/schema';

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
      { url: '/logos/she-sharp-logo-purple-dark-192x192.png', sizes: '192x192', type: 'image/png' },
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

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-background text-foreground ${heading.variable} ${sans.variable} ${brandScript.variable}`}
    >
      <body className="min-h-[100dvh]">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <Providers>
          {children}
          <CookieBanner />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
