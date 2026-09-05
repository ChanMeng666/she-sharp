/**
 * Guard tests for the user-upload store helpers.
 *
 * `isOwnUploadUrl()` is the only thing standing between a stranger and the
 * organisation's Blob store: `DELETE /api/upload/{photo,cv}?url=…` is
 * unauthenticated, because the public application forms call it. So the cases
 * that matter here are the REFUSALS — a URL on another host, a URL in another
 * Blob store, a URL in this store but outside the two upload prefixes, and the
 * path-traversal and case tricks that could smuggle one past a naive check.
 *
 * Run: npx tsx lib/blob/uploads.test.ts
 */

import assert from "node:assert/strict";

import { blobStoreHost, emailStem, isOwnUploadUrl } from "./uploads";

/** A syntactically valid R/W token for a fictional store, so no secret is needed. */
const TOKEN = "vercel_blob_rw_TeStStOrE123_abcdefghijklmnop";
const HOST = "teststore123.public.blob.vercel-storage.com";

let failures = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures++;
    console.error(`not ok - ${name}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
  }
}

check("store host is derived from the token, lower-cased", () => {
  assert.equal(blobStoreHost(TOKEN), HOST);
});

check("no token means no host, so nothing can be verified", () => {
  assert.equal(blobStoreHost(undefined), null);
  assert.equal(blobStoreHost(""), null);
  assert.equal(blobStoreHost("not-a-token"), null);
});

check("accepts a photo object in this store", () => {
  assert.equal(
    isOwnUploadUrl(`https://${HOST}/profile-photos/mentor/a_b_com-Xk3f9Q.jpg`, TOKEN),
    true
  );
});

check("accepts a CV object in this store", () => {
  assert.equal(isOwnUploadUrl(`https://${HOST}/cvs/a_b_com-Xk3f9Q.pdf`, TOKEN), true);
});

// --- the refusals: each of these is a URL the guard exists to reject ---

check("refuses another host entirely", () => {
  assert.equal(isOwnUploadUrl("https://example.com/profile-photos/mentor/x.jpg", TOKEN), false);
});

check("refuses the Cloudinary host it replaced", () => {
  assert.equal(
    isOwnUploadUrl("https://res.cloudinary.com/demo/image/upload/v1/she-sharp/mentor/x.jpg", TOKEN),
    false
  );
});

check("refuses a DIFFERENT Vercel Blob store", () => {
  assert.equal(
    isOwnUploadUrl(
      "https://someoneelse9999.public.blob.vercel-storage.com/profile-photos/mentor/x.jpg",
      TOKEN
    ),
    false
  );
});

check("refuses this store's other prefixes — newsletter photos, impact reports", () => {
  assert.equal(isOwnUploadUrl(`https://${HOST}/docs/she-sharp-impact-report-2025.pdf`, TOKEN), false);
  assert.equal(isOwnUploadUrl(`https://${HOST}/newsletter/2026-09/photos/a.jpg`, TOKEN), false);
  assert.equal(isOwnUploadUrl(`https://${HOST}/she-sharp/she-sharp-logo-white.png`, TOKEN), false);
});

check("refuses the store root and a bare prefix with no object", () => {
  assert.equal(isOwnUploadUrl(`https://${HOST}/`, TOKEN), false);
  assert.equal(isOwnUploadUrl(`https://${HOST}/profile-photos`, TOKEN), false);
  assert.equal(isOwnUploadUrl(`https://${HOST}/cvs`, TOKEN), false);
});

check("refuses a host that merely ENDS WITH the store host", () => {
  // `attacker.com/…?x=<host>` and `evil-<host>` are the two shapes a substring
  // or endsWith check would wave through.
  assert.equal(isOwnUploadUrl(`https://evil-${HOST}/cvs/x.pdf`, TOKEN), false);
  assert.equal(isOwnUploadUrl(`https://attacker.example/${HOST}/cvs/x.pdf`, TOKEN), false);
});

check("refuses a prefix used as a path segment rather than the root", () => {
  assert.equal(isOwnUploadUrl(`https://${HOST}/docs/profile-photos/x.jpg`, TOKEN), false);
});

check("refuses percent-encoded traversal out of the prefix", () => {
  // Decoded before the prefix test, so `%2E%2E%2F` cannot hide a climb out.
  assert.equal(isOwnUploadUrl(`https://${HOST}/%2E%2E/docs/report.pdf`, TOKEN), false);
  assert.equal(isOwnUploadUrl(`https://${HOST}/%70rofile-photos/mentor/x.jpg`, TOKEN), true);
});

check("refuses http, so a downgraded URL cannot be laundered through", () => {
  assert.equal(isOwnUploadUrl(`http://${HOST}/cvs/x.pdf`, TOKEN), false);
});

check("refuses anything that is not a URL", () => {
  assert.equal(isOwnUploadUrl("", TOKEN), false);
  assert.equal(isOwnUploadUrl("profile-photos/mentor/x.jpg", TOKEN), false);
  assert.equal(isOwnUploadUrl("javascript:alert(1)", TOKEN), false);
});

check("fails CLOSED when the token is missing — cannot verify, so refuses", () => {
  assert.equal(isOwnUploadUrl(`https://${HOST}/cvs/x.pdf`, undefined), false);
});

// --- the path stem, which the migration script reuses ---

check("email stem matches the Cloudinary sanitiser it replaces", () => {
  assert.equal(emailStem("Jane.Doe+tag@example.co.nz"), "Jane_Doe_tag_example_co_nz");
  assert.equal(emailStem(null), "unknown");
  assert.equal(emailStem(""), "unknown");
  // Parity, not prettiness: the Cloudinary sanitiser also mapped every
  // character of "@@@" to an underscore rather than falling back to "unknown",
  // because only an EMPTY result triggered the fallback.
  assert.equal(emailStem("@@@"), "___");
});

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll upload-guard checks passed.");
