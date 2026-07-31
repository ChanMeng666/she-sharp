/**
 * RFC 8058 one-click unsubscribe endpoint.
 *
 * Mail providers (Gmail, Yahoo, Outlook) render a native "Unsubscribe" control
 * when a message carries `List-Unsubscribe` plus
 * `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, and then POST here from
 * their own infrastructure. Three constraints follow from that, and breaking
 * any one of them silently breaks the button:
 *
 * 1. **No authentication and no CSRF check on POST.** The request arrives
 *    unauthenticated from a provider, not from the recipient's browser. The
 *    signed token in `?t=` is the entire authorization story.
 * 2. **Respond 200/202 with an empty body — never a redirect.** Providers treat
 *    a 3xx as a failure and may stop showing the control.
 * 3. **GET must not mutate.** Outlook Safe Links, corporate mail gateways and
 *    link scanners prefetch GET URLs; writing on GET would unsubscribe people
 *    who never clicked anything.
 *
 * The 48-hour processing rule is satisfied trivially: `sendEmail()` checks the
 * table at send time, so the opt-out is effective the moment the row lands.
 */

import { NextRequest, NextResponse } from "next/server";

import { recordOptout } from "@/lib/email/optouts";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

// node:crypto and the database driver both need the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records a one-click unsubscribe.
 *
 * Idempotent: providers retry, and a second POST for an address already on the
 * list must be indistinguishable from the first.
 *
 * @param request The provider's POST, carrying `?t=<signed token>`.
 * @returns 200 with an empty body on success; 400 for a missing or invalid
 *   token.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const emailHash = verifyUnsubscribeToken(
    request.nextUrl.searchParams.get("t")
  );
  if (!emailHash) {
    return new NextResponse("Invalid unsubscribe token", { status: 400 });
  }

  try {
    await recordOptout(emailHash, "notification", "one-click");
  } catch (error) {
    // A 5xx makes the provider retry, which is what we want — the recipient
    // asked to stop and we must not quietly lose that.
    console.error("[email] Failed to record one-click unsubscribe:", error);
    return new NextResponse("Could not record unsubscribe", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}

/**
 * Sends a human (or a link scanner) to the confirmation page without writing.
 *
 * @param request The GET, carrying `?t=<signed token>`.
 * @returns A redirect to `/email/unsubscribe`, preserving the token so the
 *   page can offer the confirm button.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const target = new URL("/email/unsubscribe", request.nextUrl.origin);
  if (token) target.searchParams.set("t", token);
  return NextResponse.redirect(target);
}
