import type { Metadata } from "next";

// Deck styles are loaded only here, so the 26 public pages pay nothing for them.
// Order matters: `deck-skins.css` overrides the house treatment per event and
// must come second.
import "@/styles/components/deck.css";
import "@/styles/components/deck-skins.css";

/**
 * Presentation decks are internal tooling for event hosts, not site content.
 *
 * `noindex` only — deliberately NOT a `Disallow` in `app/robots.ts`, because a
 * disallowed path is never crawled and therefore never reads the noindex.
 * `/present/*` must also stay out of `app/sitemap.ts`: a noindex URL in the
 * sitemap is exactly the contradiction Search Console reports as
 * "Submitted URL marked 'noindex'".
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function PresentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
