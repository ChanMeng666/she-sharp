/**
 * Dual-table fallback chain for mentor/mentee reads.
 *
 * Mentor and mentee data is split across `*_form_submissions` (primary) and
 * `*_profiles` (a subset), with `users` as the last resort. Every read must walk
 * the chain `form_submissions.field -> profiles.field -> users.field -> null`;
 * reading a single tier is what made avatars invisible for form-imported users
 * in the 2026-03-20 incident.
 *
 * These helpers are deliberately dependency-free (no `db`, no schema imports) so
 * server components, API routes and client components can all share one chain.
 *
 * See `docs/database/MENTOR_MENTEE_DATA_GUIDE.md`.
 */

/** A value is "present" only when it is neither nullish nor an empty string. */
function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== '';
}

/**
 * Returns the first present tier, or null when every tier is empty.
 *
 * Tiers must be passed in priority order (form submission first, users last).
 * Empty strings are treated as absent so this matches the `a || b || c` chains
 * it replaces.
 */
export function resolveField<T>(...tiers: (T | null | undefined)[]): T | null {
  for (const tier of tiers) {
    if (isPresent(tier)) return tier;
  }
  return null;
}

/** The three photo tiers, named after the table each one comes from. */
export interface PhotoTiers {
  /** `mentor_form_submissions.photo_url` / `mentee_form_submissions.photo_url` */
  formPhotoUrl?: string | null;
  /** `mentor_profiles.photo_url` / `mentee_profiles.photo_url` */
  profilePhotoUrl?: string | null;
  /** `users.image` — the OAuth avatar, null for most form-imported users */
  userImage?: string | null;
}

/**
 * Resolves an avatar URL across the full dual-table chain.
 *
 * Omitting a tier means "this query does not have it"; the remaining tiers still
 * apply. Never resolve an avatar from `users.image` alone.
 */
export function resolvePhoto({
  formPhotoUrl,
  profilePhotoUrl,
  userImage,
}: PhotoTiers): string | null {
  return resolveField(formPhotoUrl, profilePhotoUrl, userImage);
}
