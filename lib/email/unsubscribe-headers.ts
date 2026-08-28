/**
 * RFC 8058 one-click unsubscribe headers, assembled in one place.
 *
 * This lives apart from `lib/email/service.ts` for two reasons that both turned
 * out to matter:
 *
 * - **`service.ts` imports the database client.** Anything that wants these
 *   headers but not a database connection — the offline batch builders under
 *   `scripts/email/`, and `hardening.test.ts` — could not import them. The test
 *   worked around that by re-implementing the assembly locally and asserting
 *   against its own copy, which proves the copy is self-consistent and nothing
 *   about the code that ships. Now it can assert the real function.
 * - **There are two senders, not one.** `sendEmail()` sends one message at a
 *   time; the newsletter and event batches are built offline and handed to the
 *   Resend CLI, never passing through `sendEmail()` at all. Both have to attach
 *   these headers, and a marketing send that attaches them in only one of the
 *   two paths is a send with no working opt-out.
 *
 * The HTTPS URL alone satisfies RFC 8058 and both the Gmail and Yahoo bulk
 * sender rules. A `mailto:` alternative is offered ONLY when
 * `EMAIL_UNSUBSCRIBE_MAILTO` names an address someone has confirmed is real and
 * monitored — some clients prefer the mailto, so an unverified address there
 * means opt-out requests bounce, which is worse than not offering one. It is
 * deliberately unset today: `unsub@` was probed on 2026-08-23 and does not exist.
 */

import { buildUnsubscribeToken } from "./unsubscribe-token";

/**
 * Builds the signed one-click unsubscribe URL for a recipient.
 *
 * @param email The recipient address the token is scoped to.
 * @param baseUrl The site origin, with no trailing slash.
 * @returns The URL, or null when `EMAIL_UNSUBSCRIBE_SECRET` is unset — in which
 *   case no token can be signed and the caller must decide whether to degrade
 *   (a single notification email) or refuse (a whole marketing batch).
 */
export function unsubscribeUrlFor(email: string, baseUrl: string): string | null {
  const token = buildUnsubscribeToken(email);
  if (!token) return null;
  return `${baseUrl}/api/email/unsubscribe?t=${token}`;
}

/**
 * Builds the `List-Unsubscribe` header pair for a recipient.
 *
 * @param email The recipient address.
 * @param baseUrl The site origin, with no trailing slash.
 * @returns The headers, or an empty object when no token could be signed. An
 *   empty object is a degradation, not a success — a caller sending marketing
 *   mail should treat it as a hard failure rather than shipping without an
 *   opt-out.
 */
export function buildUnsubscribeHeaders(
  email: string,
  baseUrl: string
): Record<string, string> {
  const url = unsubscribeUrlFor(email, baseUrl);
  if (!url) return {};

  const mailto = process.env.EMAIL_UNSUBSCRIBE_MAILTO?.trim();

  return {
    "List-Unsubscribe": mailto ? `<${url}>, <mailto:${mailto}>` : `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * The token an email template writes where a per-recipient unsubscribe URL goes.
 *
 * Templates are rendered once, or once per recipient, by code that does not know
 * the address at authoring time — so they emit this and a builder swaps in the
 * signed URL for each person. It replaces Resend's `{{{RESEND_UNSUBSCRIBE_URL}}}`,
 * which only ever worked for broadcasts against Resend-held contacts and would
 * have shipped as literal text through the batch endpoint.
 *
 * Deliberately not brace-delimited: `gateMergeTags` in `lib/email/gates.ts`
 * fails any unknown `{{…}}` or `{{{…}}}` tag, and this must not look like one.
 */
export const UNSUBSCRIBE_URL_PLACEHOLDER = "%%SHESHARP_UNSUBSCRIBE_URL%%";

/**
 * Replaces every unsubscribe placeholder with a recipient's signed URL.
 *
 * Applied to the HTML and the plain-text part alike — `@react-email/render`
 * writes the raw href into the text version, so a template that only had the
 * HTML substituted would ship the literal placeholder to anyone reading in
 * plain text.
 *
 * @param content Rendered HTML or text.
 * @param email The recipient the URL is signed for.
 * @param baseUrl The site origin, with no trailing slash.
 * @returns The content with the placeholder replaced.
 * @throws When no token can be signed, or when a placeholder survives. Both
 *   mean this recipient would receive a message with no working opt-out, and
 *   failing the build is the only safe response.
 */
export function substituteUnsubscribeUrl(
  content: string,
  email: string,
  baseUrl: string
): string {
  if (!content.includes(UNSUBSCRIBE_URL_PLACEHOLDER)) return content;

  const url = unsubscribeUrlFor(email, baseUrl);
  if (!url) {
    throw new Error(
      "Cannot substitute the unsubscribe URL: EMAIL_UNSUBSCRIBE_SECRET is unset, " +
        "so no token can be signed."
    );
  }

  const substituted = content.split(UNSUBSCRIBE_URL_PLACEHOLDER).join(url);

  if (substituted.includes(UNSUBSCRIBE_URL_PLACEHOLDER)) {
    throw new Error("An unsubscribe placeholder survived substitution.");
  }

  return substituted;
}
