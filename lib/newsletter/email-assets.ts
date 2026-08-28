/**
 * Mapping site images to versions an email client can actually display.
 *
 * The website serves WebP everywhere, which is right for a browser and wrong for
 * an inbox: **Outlook on the desktop cannot decode WebP at all** and renders a
 * broken-image placeholder in its place. `lib/email/gates.ts` fails any send
 * carrying one, which is what surfaced this — the newsletter's event cards pull
 * their covers straight from the site's event data, so every issue embedded WebP
 * and would have reached every Outlook reader broken.
 *
 * The fix is a committed JPEG twin beside each cover, named `<base>-email.jpg`,
 * and this module is the one place that knows the naming rule. It is a pure path
 * mapping so that `assemble.ts` can use it on the server, where no image
 * processing is possible; `scripts/newsletter/email-covers.ts` generates the
 * files the mapping names.
 *
 * **The loop is closed by `scripts/verify-image-paths.ts`, not by discipline.**
 * A mapped path whose JPEG has not been generated is a broken reference and
 * fails CI; a generated JPEG no issue refers to any more is an orphan and also
 * fails CI. So the mapping cannot drift away from the files in either direction.
 *
 * Not to be confused with `email.jpg`, which already exists in some event
 * folders: that is the 1200×600 mailing-list *banner* built by
 * `/make-event-poster`, a different composition for a different job, and
 * `public/img/events/README.md` explicitly forbids pointing a cover at it.
 */

/** Extensions no major email client can be trusted to render. */
const UNSAFE_EXTENSIONS = [".webp", ".avif"];

/** Suffix marking the email-safe twin of a site image. */
export const EMAIL_ASSET_SUFFIX = "-email.jpg";

/**
 * Maps a site image path to the email-safe twin, when it needs one.
 *
 * @param path A site-relative path such as `/img/events/x/cover.webp`, an
 *   absolute URL, or null.
 * @returns The mapped path for a format email cannot render; the input
 *   unchanged for anything else. Absolute URLs pass through untouched — Blob
 *   assets are already JPEG, having been transcoded when they were uploaded.
 */
export function toEmailSafeAsset(path: string | null | undefined): string | null {
  const trimmed = path?.trim();
  if (!trimmed) return null;

  // Already-absolute URLs are Blob or a third party; we do not own their format
  // and rewriting the name would point at something that does not exist.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  const unsafe = UNSAFE_EXTENSIONS.find((ext) => lower.endsWith(ext));
  if (!unsafe) return trimmed;

  return `${trimmed.slice(0, -unsafe.length)}${EMAIL_ASSET_SUFFIX}`;
}

/**
 * Reports whether a path is one this module would rewrite.
 *
 * Used by the generator to decide what to transcode, so the generator and the
 * mapper cannot disagree about which files need a twin.
 *
 * @param path A site-relative path.
 * @returns True when the path names a format email cannot render.
 */
export function needsEmailSafeTwin(path: string | null | undefined): boolean {
  const trimmed = path?.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  return UNSAFE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
