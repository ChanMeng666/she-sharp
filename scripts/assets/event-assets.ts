/**
 * Which event owns an image.
 *
 * `public/img/events/` is flat: ~170 files whose only link to an event is the
 * slug at the front of the filename. The migration to per-event folders is
 * generated entirely from the answers here, and a wrong answer is silent — the
 * file lands under the wrong event and every path still resolves, so no gate
 * fires. That is why this is one module with its own adversarial test
 * (`event-assets.test.ts`) rather than a regex inlined in the mover.
 *
 * Two rules carry the weight:
 *
 *   Longest-prefix matching. `her-waka` is a proper prefix of `her-waka-april-2026`,
 *   `her-waka-may-2026` and `her-waka-june-2026`; first-match would file all
 *   four events' photographs under the 2022 one.
 *
 *   Both layouts resolve. The flat form is today, the nested form is after the
 *   move, and `resolveOwner()` answers for either — which is what lets the CI
 *   ownership check pass before the move and keep passing after it.
 */

import { getAllEvents } from "@/lib/data/events";

/** Everything this module owns lives under here. */
export const EVENTS_PREFIX = "/img/events/";

/**
 * Filename prefixes that are not the event's slug.
 *
 * Three files-on-disk naming conventions predate the slugs: an abbreviation
 * (`iwd-2026`), a venue-and-date working name from the Slack sync
 * (`event-aut-linkedin-15-may-2026`), and a short form of the 2024 hackathon.
 * Each was verified against the event record before being written down; do not
 * add an entry here on a guess, because an alias overrides nothing and is
 * therefore never contradicted by anything.
 */
export const ALIASES: Record<string, string> = {
  "iwd-2026": "she-sharp-and-academyex-international-womens-day-2026",
  "event-aut-linkedin-15-may-2026": "making-linkedin-work-for-you-with-stuart-little",
  "ai-hackathon-2024": "ai-for-the-environment-hackathon-festival-2024",
};

let cachedSlugs: string[] | null = null;

/**
 * The authoritative slug list: the merged event list, not either JSON file.
 *
 * `getAllEvents()` merges the v3 export with the custom overrides on normalised
 * Humanitix URL first and slug second, so a slug list built from the raw files
 * would contain entries the site never serves.
 */
export function eventSlugs(): string[] {
  if (!cachedSlugs) cachedSlugs = getAllEvents().map((event) => event.slug);
  return cachedSlugs;
}

let cachedSlugSet: Set<string> | null = null;

function slugSet(): Set<string> {
  if (!cachedSlugSet) cachedSlugSet = new Set(eventSlugs());
  return cachedSlugSet;
}

/** The longest key of `candidates` that `name` starts with, followed by "-". */
function longestPrefix(name: string, candidates: Iterable<string>): string | null {
  let best: string | null = null;
  for (const candidate of candidates) {
    if (!name.startsWith(`${candidate}-`)) continue;
    if (best === null || candidate.length > best.length) best = candidate;
  }
  return best;
}

export type Owner = {
  slug: string;
  /** The path below the event's folder, POSIX-separated. */
  rest: string;
};

/**
 * The event a site-relative image path belongs to, or null when nothing owns it.
 *
 * Recognised, in order:
 *   archive/<slug>/<n>.webp   the harvested photo sets — "archive" is a bucket,
 *                             not a slug, so the owner is one level down
 *   <slug>/<rest>             already moved (and what the move produces)
 *   <slug>-<rest>             flat, longest-prefix
 *   <alias>-<rest>            flat, via ALIASES
 */
export function resolveOwner(sitePath: string): Owner | null {
  if (!sitePath.startsWith(EVENTS_PREFIX)) return null;
  const remainder = sitePath.slice(EVENTS_PREFIX.length);
  if (!remainder) return null;

  const segments = remainder.split("/").filter((s) => s.length > 0);
  if (segments.length === 0) return null;
  const slugs = slugSet();

  if (segments[0] === "archive" && segments.length >= 3 && slugs.has(segments[1])) {
    return { slug: segments[1], rest: ["archive", ...segments.slice(2)].join("/") };
  }

  if (segments.length >= 2 && slugs.has(segments[0])) {
    return { slug: segments[0], rest: segments.slice(1).join("/") };
  }

  const head = segments[0];
  const tail = segments.slice(1);

  const slugPrefix = longestPrefix(head, slugs);
  if (slugPrefix) {
    return { slug: slugPrefix, rest: [head.slice(slugPrefix.length + 1), ...tail].join("/") };
  }

  const aliasPrefix = longestPrefix(head, Object.keys(ALIASES));
  if (aliasPrefix) {
    return { slug: ALIASES[aliasPrefix], rest: [head.slice(aliasPrefix.length + 1), ...tail].join("/") };
  }

  return null;
}

/**
 * Where a path belongs under the per-event-folder convention.
 *
 * Idempotent by construction: feeding it its own output re-resolves through the
 * nested branch and returns the same string, so the migration can be re-run,
 * partially applied, or run against a half-moved tree without damage.
 */
export function plannedPath(sitePath: string): string | null {
  const owner = resolveOwner(sitePath);
  if (!owner) return null;
  return `${EVENTS_PREFIX}${owner.slug}/${owner.rest}`;
}
