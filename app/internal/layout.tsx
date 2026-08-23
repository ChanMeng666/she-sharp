import type { Metadata } from "next";

// Playbook styles are loaded only here, so no public page pays for them.
import "@/styles/components/playbook.css";

/**
 * `/internal/*` is documentation for the people who run She Sharp, not site
 * content. It is written for organisers and volunteers, quotes internal file
 * paths and command lines, and would be noise in search results and worse in a
 * generative answer about the charity.
 *
 * `noindex` only — deliberately NOT a `Disallow` in `app/robots.ts`, because a
 * disallowed path is never crawled and therefore never reads the noindex.
 * `/internal/*` must also stay out of `app/sitemap.ts`: a noindex URL in the
 * sitemap is exactly the contradiction Search Console reports as
 * "Submitted URL marked 'noindex'". Same reasoning as `app/present/layout.tsx`.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
