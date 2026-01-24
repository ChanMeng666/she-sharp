import './globals.css';
import type { Metadata, Viewport } from 'next';
import { DM_Sans, Plus_Jakarta_Sans, Carattere } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { serializeData } from '@/lib/utils';
import { SWRConfig } from 'swr';
import { CookieBanner } from '@/components/cookie-banner';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from './providers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'She Sharp - Connecting Women in Technology',
  description: 'She Sharp is on a mission to bridge the gender gap in STEM, one woman at a time. Through events, networking, and career development opportunities.',
  keywords: ['STEM', 'women', 'technology', 'mentorship', 'New Zealand', 'She Sharp'],
  icons: {
    icon: '/logos/she-sharp-logo-purple-dark-130x130.svg',
    shortcut: '/logos/she-sharp-logo-purple-dark-130x130.svg',
    apple: '/logos/she-sharp-logo-purple-dark-130x130.svg',
  },
  openGraph: {
    title: 'She Sharp - Connecting Women in Technology',
    description: 'She Sharp is on a mission to bridge the gender gap in STEM, one woman at a time. Through events, networking, and career development opportunities.',
    type: 'website',
    locale: 'en_NZ',
    url: 'https://www.shesharp.org.nz',
    siteName: 'She Sharp',
  },
};

export const viewport: Viewport = {
  maximumScale: 1
};

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans'
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading'
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

async function getSerializedTeam() {
  const team = await getTeamForUser();
  return serializeData(team);
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-background text-foreground ${dmSans.variable} ${plusJakartaSans.variable} ${carattere.variable}`}
    >
      <body className="min-h-[100dvh]">
        <Providers>
          <SWRConfig
            value={{
              fallback: {
                // Serialize data to convert Date objects to ISO strings
                // This prevents "Received an instance of Date" serialization errors
                '/api/user': getSerializedUser(),
                '/api/team': getSerializedTeam()
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
