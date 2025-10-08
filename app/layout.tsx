import './globals.css';
import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import { CookieBanner } from '@/components/cookie-banner';
import { Toaster } from '@/components/ui/sonner';
import { ChatbotProvider } from '@/components/chatbot/chatbot-provider';
import { Providers } from './providers';

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

const dmSans = DM_Sans({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-background text-foreground ${dmSans.className}`}
    >
      <body className="min-h-[100dvh]">
        <Providers>
          <SWRConfig
            value={{
              fallback: {
                // We do NOT await here
                // Only components that read this data will suspend
                '/api/user': getUser(),
                '/api/team': getTeamForUser()
              }
            }}
          >
            {children}
            <CookieBanner />
            <Toaster />
            <ChatbotProvider />
          </SWRConfig>
        </Providers>
      </body>
    </html>
  );
}
