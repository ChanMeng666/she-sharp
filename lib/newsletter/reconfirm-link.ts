/**
 * The re-confirmation link that ships inside the newsletter.
 *
 * Deliberately separate from `./reconfirm.ts`, which imports the database
 * client — the same split, for the same reason, as
 * `lib/email/unsubscribe-headers.ts` against `lib/email/service.ts`. The email
 * template, the offline batch builder and the tests all need to build and
 * substitute this URL, and none of them has (or should need) a `POSTGRES_URL`;
 * `lib/db/drizzle.ts` throws at module load without one, so importing the
 * write path from the template would break every render.
 */

import { buildReconfirmToken } from "./reconfirm-token";


/**
 * The token an email template writes where a per-recipient re-confirmation URL
 * goes.
 *
 * The newsletter batch renders the template ONCE for the whole list and then
 * substitutes per recipient, so the template cannot know the address. Same
 * mechanism, and the same non-brace delimiter, as
 * `UNSUBSCRIBE_URL_PLACEHOLDER`: `gateMergeTags` in `lib/email/gates.ts` fails
 * any unknown `{{…}}` tag, and this must not look like one.
 */
export const RECONFIRM_URL_PLACEHOLDER = "%%SHESHARP_RECONFIRM_URL%%";

/**
 * Builds the signed re-confirmation URL for a recipient.
 *
 * It points at the **page**, not the API. The unsubscribe URL points at its API
 * route because RFC 8058 providers POST to it directly; nothing POSTs here
 * except a human who has pressed a button, so the link's job is to render one.
 *
 * The query parameter is `t`, not `token`: `gateSecrets` in `lib/email/gates.ts`
 * fails any body containing `?token=` on the assumption it is a leaked
 * credential, and a marketing send that cannot pass the gates cannot ship.
 *
 * @param email The recipient address the token is scoped to.
 * @param baseUrl The site origin, with no trailing slash.
 * @param issueId The `YYYY-MM` issue, recorded in the consent sentence.
 * @returns The URL, or null when `EMAIL_UNSUBSCRIBE_SECRET` is unset.
 */
export function reconfirmUrlFor(
  email: string,
  baseUrl: string,
  issueId: string
): string | null {
  const token = buildReconfirmToken(email);
  if (!token) return null;
  return `${baseUrl}/newsletter/reconfirm?t=${token}&i=${encodeURIComponent(issueId)}`;
}

/**
 * Replaces every re-confirmation placeholder with a recipient's signed URL.
 *
 * Applied to the HTML and the plain-text part alike — `@react-email/render`
 * writes the raw href into the text version, so substituting only the HTML would
 * ship the literal placeholder to anyone reading in plain text.
 *
 * @param content Rendered HTML or text.
 * @param email The recipient the URL is signed for.
 * @param baseUrl The site origin, with no trailing slash.
 * @param issueId The `YYYY-MM` issue.
 * @returns The content with the placeholder replaced.
 * @throws When no token can be signed, or when a placeholder survives. Either
 *   would put visibly broken markup in front of a real subscriber on a page
 *   about consent, and failing the build is the only safe response.
 */
export function substituteReconfirmUrl(
  content: string,
  email: string,
  baseUrl: string,
  issueId: string
): string {
  if (!content.includes(RECONFIRM_URL_PLACEHOLDER)) return content;

  const url = reconfirmUrlFor(email, baseUrl, issueId);
  if (!url) {
    throw new Error(
      "Cannot substitute the re-confirmation URL: EMAIL_UNSUBSCRIBE_SECRET is " +
        "unset, so no token can be signed."
    );
  }

  const substituted = content.split(RECONFIRM_URL_PLACEHOLDER).join(url);

  if (substituted.includes(RECONFIRM_URL_PLACEHOLDER)) {
    throw new Error("A re-confirmation placeholder survived substitution.");
  }

  return substituted;
}
