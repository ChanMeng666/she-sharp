/**
 * Canonical URLs for the large binary assets served from Vercel Blob.
 *
 * The three impact/pitch PDFs and the five MP4s are ~63 MB between them. Kept
 * in `public/` they ride along in every build artifact, every `git clone` and
 * every deployment upload, for files that never change and are requested by a
 * small fraction of visitors. Blob serves them from the same edge network with
 * a one-year immutable cache and keeps them out of the build entirely.
 *
 * WHY THE URLs ARE HARD-CODED RATHER THAN BUILT FROM AN ENV VAR
 * -------------------------------------------------------------
 * This project has no Vercel Git connection — GitHub Actions prebuilds on push
 * to `main`, so a newly added environment variable is NOT picked up by the
 * dashboard's "Redeploy" button and needs a fresh commit anyway (see CLAUDE.md,
 * "Vercel Environment Variable Rules"). An env var would therefore buy no
 * deploy-time flexibility while adding a whole class of failure: an unset or
 * newline-corrupted `NEXT_PUBLIC_BLOB_BASE` renders a broken `<video>` and a
 * dead PDF link with no build error. A literal URL cannot be misconfigured, is
 * reviewable in the diff, and is greppable when the store is ever migrated.
 *
 * Blob pathnames are stable (no random suffix) and versioned by filename, so
 * replacing an asset means uploading a NEW filename and changing the constant
 * here — never overwriting in place, which a one-year cache would ignore.
 *
 * NOTE: the `public/` copies still exist and are still served at their original
 * same-origin paths. They are removed in a follow-up PR, once these URLs are
 * confirmed working on production.
 */

/** Public base of the She Sharp Vercel Blob store (`store_vqfhbpoqrf3jfw3s`). */
export const BLOB_BASE = "https://vqfhbpoqrf3jfw3s.public.blob.vercel-storage.com";

// --- Documents (application/pdf, Cache-Control: public, max-age=31536000) ---

/** Annual impact report, 2024 edition (41 MB) — linked from `/resources`. */
export const IMPACT_REPORT_2024_PDF = `${BLOB_BASE}/docs/she-sharp-impact-report-2024.pdf`;

/** Annual impact report, 2025 edition (12 MB) — linked from `/resources`. */
export const IMPACT_REPORT_2025_PDF = `${BLOB_BASE}/docs/she-sharp-impact-report-2025.pdf`;

/**
 * AI Forum's six-page hackathon pitch template — where the file actually lives.
 *
 * This is the DESTINATION of the redirect below, not the URL anything links to.
 * The only consumer is `next.config.ts`'s `redirects()`.
 */
export const PITCH_DECK_TEMPLATE_2026_PDF = `${BLOB_BASE}/docs/pitch-deck-template-2026.pdf`;

/**
 * The short, public, QR-facing URL for the same PDF. 308s to the Blob URL.
 *
 * URL LENGTH IS LOAD-BEARING and is the entire reason this indirection exists.
 * The hackathon deck projects this as a QR code sharing a slide with two others,
 * so each is drawn small. Measured with `qrcode` at level M:
 *
 *   this URL (61 bytes)          → version 4, 33×33
 *   the Blob URL above (89 bytes) → version 6, 41×41
 *
 * Encoding Blob directly would cost a quarter of the module size in the same
 * physical square. `redirects()` is evaluated before the filesystem, so the hop
 * works whether or not the `public/docs/` copy still exists.
 *
 * The two impact reports deliberately have no equivalent — they are ordinary
 * text links where nothing reads the URL off a wall, so they point at Blob
 * directly and skip the redirect.
 */
export const PITCH_DECK_TEMPLATE_2026_URL =
  "https://www.shesharp.org.nz/docs/pitch-deck-template-2026.pdf";

/** Same-origin path form of the above — the `source` half of the redirect. */
export const PITCH_DECK_TEMPLATE_2026_PATH = "/docs/pitch-deck-template-2026.pdf";

// --- Video (video/mp4, Cache-Control: public, max-age=31536000) ---

/** Muted, autoplaying event footage behind the home page hero (2.1 MB). */
export const HOME_HERO_VIDEO = `${BLOB_BASE}/video/home-page-hero.mp4`;

/** Programme overview video on `/mentorship`. */
export const MENTORSHIP_VIDEO = `${BLOB_BASE}/video/Mentorship.mp4`;

/** "Become a mentor" video on `/mentorship/mentor`. */
export const MENTOR_VIDEO = `${BLOB_BASE}/video/Mentor-Video.mp4`;

/** "Become a mentee" video on `/mentorship/mentee`. */
export const MENTEE_VIDEO = `${BLOB_BASE}/video/Mentee-Video.mp4`;

/**
 * 2024 AI Hackathon challenge briefing, embedded on that event's detail page.
 *
 * The event pages are driven by `lib/data/json/shesharp_events_v3.json`, which
 * cannot import from TypeScript, so its `specialSections` entry carries the
 * absolute URL literally. This constant is the readable record of it; the two
 * must be changed together.
 */
export const AI_HACKATHON_2024_PROBLEMS_VIDEO = `${BLOB_BASE}/video/events/ai-hackathon-2024-problems-to-solve.mp4`;
