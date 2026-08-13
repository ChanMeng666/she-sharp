/**
 * Browser-side plumbing behind the post-event feedback form.
 *
 * Three things live here and they are all storage: the per-device id the API
 * rate-limits on, the "already submitted" marker, and the in-progress draft.
 * None of it touches React, so it stays testable and the form component is left
 * with its questions.
 *
 * Client only — every function reaches for `window`.
 */

/**
 * Per-person rate-limit key. A whole venue shares one NAT'd IP, so the API
 * keys on this instead; it is generated once per browser and never leaves
 * `localStorage`.
 */
export const DEVICE_ID_KEY = "she-sharp-device-id";

/** The header the API reads the device id from. */
export const DEVICE_HEADER = "x-ss-device";

/**
 * Every storage read is wrapped: Safari in private mode throws on access to
 * `localStorage`, and a thrown exception here would take the whole form down
 * on the one device class most likely to be scanning a QR code.
 */
export function readStorage(
  store: "local" | "session",
  key: string,
): string | null {
  try {
    const target = store === "local" ? window.localStorage : window.sessionStorage;
    return target.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(
  store: "local" | "session",
  key: string,
  value: string,
) {
  try {
    const target = store === "local" ? window.localStorage : window.sessionStorage;
    target.setItem(key, value);
  } catch {
    // Nothing to do — losing the draft or the device id degrades the
    // experience, it does not break the form.
  }
}

export function removeStorage(store: "local" | "session", key: string) {
  try {
    const target = store === "local" ? window.localStorage : window.sessionStorage;
    target.removeItem(key);
  } catch {
    // See above.
  }
}

/**
 * The id this browser is rate-limited by, minted on first use.
 *
 * The fallback matters more than it looks: `crypto.randomUUID` is unavailable
 * on a non-secure origin, which is exactly what a venue's captive-portal wifi
 * can produce, and a form that threw there would fail for the whole room.
 */
export function deviceId(): string {
  const existing = readStorage("local", DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `d-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  writeStorage("local", DEVICE_ID_KEY, generated);
  return generated;
}

/** `localStorage` marker: this browser has already sent feedback for `slug`. */
export const submittedKey = (slug: string) => `she-sharp-feedback:${slug}`;

/** `sessionStorage` key holding the in-progress answers for `slug`. */
export const draftKey = (slug: string) => `she-sharp-feedback-draft:${slug}`;
