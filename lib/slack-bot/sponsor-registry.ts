/**
 * Scans public/img/sponsors/ at runtime and returns the canonical slugs.
 *
 * Used as context for the AI extractor: when a sponsor matches one of
 * these slugs, the bot reuses the existing logo instead of proposing
 * a new event-scoped copy.
 */

import { readdirSync, existsSync } from "fs";
import { join, extname, basename } from "path";

const SPONSORS_DIR = "public/img/sponsors";
const IMAGE_EXTS = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp"]);

let cache: string[] | null = null;

/**
 * Returns the list of canonical sponsor slugs.
 *
 * Cached for the lifetime of the serverless function instance (cleared
 * on cold start). Safe to call from hot request paths.
 */
export function getSponsorSlugs(): string[] {
  if (cache) return cache;

  const abs = join(process.cwd(), SPONSORS_DIR);
  if (!existsSync(abs)) {
    cache = [];
    return cache;
  }

  const slugs = readdirSync(abs)
    .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
    .map((f) => basename(f, extname(f)).toLowerCase());

  cache = [...new Set(slugs)].sort();
  return cache;
}

/**
 * Returns true if the given sponsor slug has a canonical logo file.
 */
export function hasSponsorLogo(slug: string): boolean {
  return getSponsorSlugs().includes(slug.toLowerCase());
}
