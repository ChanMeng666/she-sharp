/**
 * Scans public/img/sponsors/ at runtime and returns the canonical slugs.
 *
 * Used as context for the AI extractor: when a sponsor matches one of
 * these slugs, the bot reuses the existing logo instead of proposing
 * a new event-scoped copy.
 */

import { readdirSync, existsSync } from "fs";
import { join, extname, basename } from "path";

const IMAGE_EXTS = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp"]);
const CANDIDATE_ROOTS = [
  "public/img/sponsors",
  // Next.js serverless functions run from `.next/standalone/` on Vercel
  // where `public/` may be a sibling path; try both variants.
  ".next/standalone/public/img/sponsors",
];

let cache: string[] | null = null;

/**
 * Returns the list of canonical sponsor slugs.
 *
 * Cached for the lifetime of the serverless function instance (cleared
 * on cold start). Safe to call from hot request paths.
 */
export function getSponsorSlugs(): string[] {
  if (cache) return cache;

  for (const root of CANDIDATE_ROOTS) {
    const abs = join(process.cwd(), root);
    if (!existsSync(abs)) continue;
    const slugs = readdirSync(abs)
      .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
      .map((f) => basename(f, extname(f)).toLowerCase());
    cache = [...new Set(slugs)].sort();
    return cache;
  }

  // If we can't scan the directory at runtime, fall back to empty list —
  // the AI will still work, it just won't know about existing sponsors and
  // will propose placeholder paths (admin can correct manually).
  cache = [];
  return cache;
}

/**
 * Returns true if the given sponsor slug has a canonical logo file.
 */
export function hasSponsorLogo(slug: string): boolean {
  return getSponsorSlugs().includes(slug.toLowerCase());
}
