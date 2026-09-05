import { del, put, type PutBlobResult } from '@vercel/blob';

/**
 * User-upload storage on Vercel Blob — profile photos and CVs.
 *
 * Replaces `lib/cloudinary/config.ts` (deleted 2026-09-06). Cloudinary sat on a
 * personal account that has been handed back; the organisation already owns and
 * pays for the Vercel Blob store that serves the impact reports and the videos
 * (`lib/config/assets.ts`), so uploads now go there and there is one storage
 * account to administer instead of two.
 *
 * Two prefixes, mirroring the Cloudinary `public_id` layout that preceded them:
 *   profile-photos/<mentor|mentee|profile>/<sanitised-email>-<suffix>.<ext>
 *   cvs/<sanitised-email>-<suffix>.pdf
 */

/** Blob path prefix for profile photographs. */
export const PHOTO_PREFIX = 'profile-photos';

/** Blob path prefix for CVs and resumes. */
export const CV_PREFIX = 'cvs';

/**
 * Reduces an email address to a filesystem-safe stem, exactly as the Cloudinary
 * route did, so a migrated object keeps the same identifying stem as the object
 * it replaces and a path stays greppable back to the applicant.
 */
export function emailStem(email: string | null | undefined): string {
  const stem = email?.replace(/[^a-zA-Z0-9]/g, '_') ?? '';
  return stem.length > 0 ? stem : 'unknown';
}

/**
 * Public hostname of the Blob store this deployment writes to, derived from the
 * store id embedded in the R/W token (`vercel_blob_rw_<storeId>_<secret>`).
 *
 * Deriving it beats hard-coding it: the DELETE guard below then refuses a URL
 * from *another* Blob store as firmly as it refuses one from another host, and
 * a preview deployment pointed at a different store is guarded correctly with
 * no code change. Returns null when the token is absent or malformed, which the
 * caller must treat as "cannot verify, so refuse".
 */
export function blobStoreHost(token = process.env.BLOB_READ_WRITE_TOKEN): string | null {
  const storeId = token?.split('_')[3];
  if (!storeId) return null;
  return `${storeId.toLowerCase()}.public.blob.vercel-storage.com`;
}

/**
 * Whether `url` is an object in this store, under one of the two upload
 * prefixes.
 *
 * The Cloudinary routes guarded their DELETE with an "Invalid Cloudinary URL"
 * check, and dropping the equivalent here would turn `DELETE ?url=…` into a
 * request to delete an arbitrary attacker-supplied path — these routes are
 * public (the application forms are unauthenticated), so the guard is the only
 * thing standing between a stranger and the store. Host AND prefix are both
 * checked: the host alone would still allow deleting a newsletter photo or an
 * impact report, which live in the same store.
 */
export function isOwnUploadUrl(url: string, token = process.env.BLOB_READ_WRITE_TOKEN): boolean {
  const host = blobStoreHost(token);
  if (!host) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== host) return false;
  const pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
  return pathname.startsWith(`${PHOTO_PREFIX}/`) || pathname.startsWith(`${CV_PREFIX}/`);
}

/**
 * Uploads one user file to the store and returns the Blob result.
 *
 * `addRandomSuffix: true` is deliberate. These are personal documents, and
 * Vercel Blob serves `access: 'public'` objects to anyone holding the URL —
 * the same exposure model as the Cloudinary URLs being replaced, so this is
 * parity rather than a regression. The unguessable suffix is what keeps it
 * parity: without it the path is derivable from an applicant's email address
 * alone, which the Cloudinary path was not (it carried a millisecond
 * timestamp), and the store would become enumerable by guessing.
 */
export async function putUserUpload(
  pathname: string,
  file: File,
  contentType: string
): Promise<PutBlobResult> {
  return put(pathname, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
  });
}

/**
 * Deletes one previously uploaded object. Callers must have checked
 * `isOwnUploadUrl()` first; this is the raw call.
 */
export async function deleteUserUpload(url: string): Promise<void> {
  await del(url);
}
