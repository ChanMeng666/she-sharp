/**
 * Short codes for the post-event feedback form.
 *
 * A feedback QR is projected onto a wall and scanned from up to six metres
 * away, so the number of modules in the code is the whole ballgame. At error
 * correction level `M` — the level `components/deck/deck-qr.tsx` deliberately
 * uses for exactly this reason:
 *
 *   https://www.shesharp.org.nz/events/aotearoa-ai-hackathon-festival-2026/feedback
 *     79 bytes  ->  QR version 5, 37x37 modules
 *   https://www.shesharp.org.nz/f/aahf26
 *     36 bytes  ->  QR version 3, 29x29 modules
 *
 * Same physical area on the projector, modules 28% larger. That is the
 * difference between scanning from the back row and not. It is also short
 * enough to read aloud and to type, which matters because half the room
 * photographs the slide instead of scanning it.
 *
 * The long path never stops working — `eventSlugForFeedbackCode()` accepts a
 * full event slug too. The short code is an optimisation, never a dependency.
 */

import { getAllEvents, parseDateString } from "@/lib/data/events";
import { SITE_URL } from "@/lib/seo/site";

/**
 * Slug prefixes that carry no information — every event is a She Sharp event,
 * and `event-` is a naming artefact of the older sync scripts.
 */
const NOISE_PREFIXES = ["she-sharp-and", "she-sharp", "event"];

/**
 * Dropped before taking initials. `international-womens-day` reading as `iwd`
 * rather than `iwd` is the point; `ai-for-the-environment-hackathon-festival`
 * reading as `aehf` rather than `afthef` is the payoff.
 */
const STOP_WORDS = new Set([
  "a", "an", "and", "at", "for", "from", "in", "of", "on", "or",
  "the", "to", "with", "your", "you", "my", "our", "is", "be",
]);

/** Codes are lowercase alphanumeric; this is what the route accepts. */
export const FEEDBACK_CODE_PATTERN = /^[a-z0-9]{2,12}$/;

/**
 * Hand-assigned codes.
 *
 * Two reasons to add an entry, and only two:
 *
 *  1. A collision. `deck.test.ts` fails the build when two events derive to the
 *     same code. **The override always goes on the NEWER event.** Moving an old
 *     code silently re-points every already-exported deck PDF and every code a
 *     person has already scanned, and there is no way to reach those people.
 *  2. Somebody printed a vanity code on a physical thing before this file
 *     existed.
 *
 * Anything else should come out of `deriveFeedbackCode()`.
 */
export const FEEDBACK_CODE_OVERRIDES: Record<string, string> = {};

/**
 * Builds a short code from an event slug and its year.
 *
 * Initials of the meaningful slug segments (max 6) followed by a two-digit
 * year. Deterministic and pure — the same slug always yields the same code, so
 * a code that has been projected once keeps working forever.
 */
export function deriveFeedbackCode(slug: string, year: number): string {
  let segments = slug.toLowerCase().split("-").filter(Boolean);

  // Strip a leading noise prefix, longest match first so `she-sharp-and`
  // beats `she-sharp`.
  for (const prefix of NOISE_PREFIXES) {
    const parts = prefix.split("-");
    if (parts.every((part, i) => segments[i] === part)) {
      segments = segments.slice(parts.length);
      break;
    }
  }

  const meaningful = segments.filter((segment) => {
    if (STOP_WORDS.has(segment)) return false;
    // Three or more digits is a year or a stray identifier; the year is
    // appended separately and would otherwise appear twice.
    if (/^\d{3,}$/.test(segment)) return false;
    return true;
  });

  // A slug made entirely of noise (unlikely, but `she-sharp-2026` would do it)
  // still has to produce something, so fall back to the raw segments.
  const source = meaningful.length > 0 ? meaningful : segments;

  // Short numbers survive intact rather than collapsing to a first digit,
  // because they are usually the only thing distinguishing two runs of the same
  // series: `peyvand-academy-13-june-2026` and `peyvand-academy-20-june-2026`
  // both reduce to `paj26` on initials alone. Words still contribute one letter.
  const body = source
    .slice(0, 6)
    .map((segment) => (/^\d{1,2}$/.test(segment) ? segment : segment[0]))
    .join("")
    .slice(0, 8);

  return `${body}${String(year % 100).padStart(2, "0")}`;
}

/** slug -> code, built once. */
let codeBySlug: Map<string, string> | null = null;
/** code -> slug, built once. Also keyed by the full slug so long URLs resolve. */
let slugByKey: Map<string, string> | null = null;

function buildMaps(): void {
  if (codeBySlug && slugByKey) return;

  const codes = new Map<string, string>();
  const keys = new Map<string, string>();

  for (const event of getAllEvents()) {
    const slug = event.slug.toLowerCase();
    const override = FEEDBACK_CODE_OVERRIDES[event.slug];
    const code =
      override ?? deriveFeedbackCode(event.slug, parseDateString(event.date).getFullYear());

    codes.set(event.slug, code);

    // First writer wins for a duplicate code. `deck.test.ts` fails on duplicates
    // anyway; this only decides which event an ambiguous code resolves to in the
    // window before someone notices, and "the one that has been around longer"
    // is the safer of the two answers.
    if (!keys.has(code)) keys.set(code, event.slug);
    keys.set(slug, event.slug);
  }

  codeBySlug = codes;
  slugByKey = keys;
}

/** The short code for one event. Throws if the slug is not a known event. */
export function feedbackCodeForSlug(slug: string): string {
  buildMaps();
  const code = codeBySlug!.get(slug);
  if (!code) {
    throw new Error(
      `No event found for slug "${slug}" — a feedback code cannot be built for an event that does not exist.`,
    );
  }
  return code;
}

/** Site-relative short path, e.g. `/f/aahf26`. */
export function feedbackPathForSlug(slug: string): string {
  return `/f/${feedbackCodeForSlug(slug)}`;
}

/**
 * The absolute URL a feedback QR encodes.
 *
 * Built from `SITE_URL`, a compile-time constant, and deliberately NOT from
 * `process.env.BASE_URL` / `getBaseUrl()`. A deck is rendered in the browser
 * and projected; if this ever resolved to `http://localhost:3000` or to
 * `undefined/f/aahf26`, the code would render perfectly and fail on every
 * phone in the room, and nobody on the stage could tell.
 *
 * The redirect handler at `app/f/[code]/route.ts` has the opposite rule — it
 * must resolve against the request origin so local testing stays local.
 */
export function feedbackUrlForSlug(slug: string): string {
  return `${SITE_URL}${feedbackPathForSlug(slug)}`;
}

/** The canonical (long) form, for links in email and on the site itself. */
export function feedbackPagePathForSlug(slug: string): string {
  return `/events/${slug}/feedback`;
}

/**
 * Resolves a short code — or a full event slug — back to an event slug.
 *
 * Accepting the full slug is what keeps the long URL alive forever, so a link
 * pasted into a chat thread two years ago still works.
 */
export function eventSlugForFeedbackCode(code: string): string | undefined {
  buildMaps();
  return slugByKey!.get(code.trim().toLowerCase());
}

/** Every event's code, for the uniqueness assertion in `deck.test.ts`. */
export function allFeedbackCodes(): { slug: string; code: string }[] {
  buildMaps();
  return [...codeBySlug!.entries()].map(([slug, code]) => ({ slug, code }));
}
