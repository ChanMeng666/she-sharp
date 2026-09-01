/**
 * Refuses to let a message carrying a `localhost` link reach a real recipient.
 *
 * **The failure this exists for has already happened once.** On 2026-03-19,
 * duplicated `process.env.BASE_URL || 'http://localhost:3000'` fallback logic
 * put `localhost:3000` into **25 real mentor invitation emails**. The rule that
 * came out of it — every URL goes through `getBaseUrl()`, and every script that
 * builds one requires an explicit `BASE_URL` — is in the root `CLAUDE.md`, and
 * `scripts/email/build-batch.ts` enforces it at the top of a marketing build.
 *
 * That left one path uncovered. The batch builders guard themselves, but
 * `sendEmail()` — the single Resend call site, and the one that sends the
 * **newsletter double opt-in confirmation** — guarded nothing. It sent whatever
 * `getBaseUrl()` returned. On 2026-09-01 six confirmation emails went out from
 * `noreply@shesharp.org.nz` carrying `http://localhost:3000/newsletter/confirm`
 * links, because an end-to-end test ran against a local server holding the
 * production Resend key. They reached only the tester's own mailbox and no real
 * subscriber was touched, but nothing in the code would have known the
 * difference, and the sign-up form has since moved from one surface to eight.
 *
 * **Why this reads the rendered body rather than `BASE_URL`.** An env var is a
 * proxy for the harm; the link in the message *is* the harm. A check keyed on
 * the proxy inherits every way a URL can be built without it — a hardcoded
 * string, a stale template, a second fallback somebody adds later — which is
 * the same blind spot as a check keyed on an annotation rather than on the
 * thing annotated. This reads the bytes that are about to be sent.
 */

/**
 * Matches a loopback host in a URL: `localhost`, `127.0.0.1`, or IPv6 `[::1]`,
 * with or without a port, in either an `href` or bare text.
 *
 * Deliberately NOT anchored to `href=`, because the plain-text part of a
 * message repeats the link as bare text — which is exactly how the 2026-09-01
 * confirmation emails displayed theirs ("Or copy and paste this link").
 *
 * **The lookahead is load-bearing.** Without it, `https://localhost.example/x`
 * matches: `localhost` is followed by `.example`, and a trailing `[^\s"'<>]*`
 * swallows it happily. That host is not loopback, and refusing a real send
 * because a hostname begins with the word would be the guard causing the harm
 * it exists to prevent. The host has to END here — at a port, a path, a query,
 * a fragment, whitespace, or the end of the string. The test carries both
 * `localhost.attacker.example` and `notlocalhost.example` for this reason.
 */
const LOOPBACK_URL =
  /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?=[/?#\s"'<>]|$)[^\s"'<>]*/i;

/**
 * Finds the first loopback URL in a message.
 *
 * @param parts The rendered message parts — HTML, and the plain-text
 *   alternative when there is one.
 * @returns The offending URL, or null when the message is clean.
 */
export function findLoopbackUrl(...parts: (string | undefined)[]): string | null {
  for (const part of parts) {
    const hit = part ? LOOPBACK_URL.exec(part) : null;
    if (hit) return hit[0];
  }
  return null;
}

/** What `decideLoopbackLink()` says to do about a message. */
export type LoopbackVerdict = "send" | "warn" | "refuse";

/**
 * Decides what a loopback link in an outgoing message means.
 *
 * The two cases are not the same harm and must not get the same answer:
 *
 * - **Deployed** (`VERCEL` is set) — the recipient is a real person on the
 *   internet and the link resolves to their own machine. There is no reading
 *   under which this is intended, so it is refused. A confirmation that never
 *   arrives is recoverable and visible; one that arrives broken is neither, and
 *   it is what the reader judges the organisation by.
 * - **Local** — somebody is testing the mail path on their own machine, which
 *   is a legitimate thing to do and the reason `getBaseUrl()` has a localhost
 *   fallback at all. Refusing would break the only honest way to exercise a
 *   real send. It warns instead, loudly enough to be seen in a terminal, so
 *   "these went out with localhost links" is noticed while the sender is still
 *   watching rather than when the recipient opens their inbox.
 *
 * Keying on `VERCEL` rather than `NODE_ENV` is deliberate: a local
 * `next start` sets `NODE_ENV=production` too, and that is precisely the local
 * case above.
 *
 * @param url The loopback URL found in the message, or null.
 * @param isDeployed Whether this process is running on Vercel.
 * @returns What the caller should do.
 */
export function decideLoopbackLink(
  url: string | null,
  isDeployed: boolean
): LoopbackVerdict {
  if (!url) return "send";
  return isDeployed ? "refuse" : "warn";
}

/**
 * Reports whether this process is a real deployment.
 *
 * @returns True on Vercel, where recipients are real people.
 */
export function isDeployedRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}
