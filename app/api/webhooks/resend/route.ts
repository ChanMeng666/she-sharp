/**
 * Resend deliverability webhook.
 *
 * Bounces and spam complaints are the two signals that decide whether the
 * domain keeps reaching inboxes, and until this route existed nothing in this
 * codebase saw them: they lived in the Resend dashboard until somebody thought
 * to look. It turns them into rows in `email_optouts`, which `sendEmail()`
 * consults on every notification-class send.
 *
 * Since the newsletter moved in-house it also has a second job. Resend's
 * account-wide complaint ceiling is **0.08%**, about 1.25 complaints on a full
 * 1,545-recipient send, and breaching it can take password resets and donation
 * receipts down with the newsletter. Suppression alone cannot see that coming —
 * it produces a numerator and no denominator — so every delivery and engagement
 * event is now also written to `email_events`, and
 * `scripts/email/send-stats.ts` reports the rate against the ceiling.
 *
 * What each event does, and why:
 *  - `email.sent` / `email.delivered` / `email.opened` / `email.clicked`
 *                          — recorded only. **None of them suppresses anything**;
 *                          no delivery or engagement signal implicates an
 *                          address, and suppressing on one would opt people out
 *                          for reading the newsletter.
 *  - `email.bounced`     — the address does not exist or refused delivery.
 *                          Recorded, then suppressed for everything but
 *                          transactional mail (transient bounces excepted).
 *  - `email.complained`  — someone pressed "report spam". Recorded, suppressed,
 *                          and posted to Slack: a complaint rate above ~0.1% is
 *                          what makes a domain start landing in Junk, and it
 *                          needs a human to notice the same day, not at the next
 *                          newsletter.
 *  - `email.failed`      — a provider-side send failure. Recorded, because it is
 *                          a terminal non-delivery; the address is not
 *                          implicated, so nothing is suppressed.
 *  - `email.delivery_delayed` — a greylist or a temporarily full mailbox. Log
 *                          only. Suppressing on a delay would opt people out for
 *                          a problem that resolves itself in minutes, and
 *                          recording one would invent an outcome the message has
 *                          not reached.
 *
 * The event dispatch itself lives in `lib/email/events.ts` so it can be tested
 * with fake effects — see `lib/email/events.test.ts`. This file keeps signature
 * verification and the two suppression writes, which are unchanged.
 *
 * Register the endpoint in the Resend dashboard (Webhooks → Add Endpoint) and
 * put the signing secret in `RESEND_WEBHOOK_SECRET`. The four new event types
 * must be ticked on that endpoint, and open/click tracking enabled on the
 * domain, before any of them arrive; until then this route behaves exactly as
 * it did. See `docs/deployment/EMAIL_AUTHENTICATION.md`.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  handleResendEvent,
  recordEmailEvent,
  type ResendWebhookEvent,
} from "@/lib/email/events";
import { hashEmail } from "@/lib/email/hash";
import { recordOptout, type OptoutReason } from "@/lib/email/optouts";
import {
  markBouncedByHash,
  markComplainedByHash,
} from "@/lib/newsletter/subscribers";
import { readSvixHeaders, verifySvixSignature } from "@/lib/email/webhook-verify";

// node:crypto and the database driver both need the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Posts a complaint alert to Slack, best-effort.
 *
 * Reuses the newsletter webhook (which itself falls back to the contact
 * webhook) rather than introducing another environment variable — a spam
 * complaint is newsletter-adjacent news for the same person.
 */
async function alertComplaint(recipients: string[], subject?: string): Promise<void> {
  const url =
    process.env.SLACK_NEWSLETTER_WEBHOOK_URL?.trim() ||
    process.env.SLACK_CONTACT_WEBHOOK_URL?.trim();
  if (!url) return;

  // The address itself is not posted: Slack is a wider audience than the
  // people who handle the mailing list, and the hash is enough to act on.
  const hashes = recipients.map((r) => hashEmail(r).slice(0, 12)).join(", ");
  const text =
    `:warning: Spam complaint received${subject ? ` for "${subject}"` : ""}. ` +
    `Recipient hash: ${hashes || "unknown"}. ` +
    `They are now suppressed for all non-transactional mail. ` +
    `Check the complaint rate before the next broadcast — above 0.1% is trouble. ` +
    `npx tsx scripts/email/send-stats.ts --tag newsletter:<YYYY-MM>`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    console.error("[email] Slack complaint alert failed:", error);
  }
}

/**
 * POST /api/webhooks/resend
 *
 * @param request The Svix-signed event from Resend.
 * @returns 200 once handled, 400 when the signature does not verify.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Must read the raw text before parsing — re-serialised JSON will not match
  // the signature.
  const rawBody = await request.text();

  const svixHeaders = readSvixHeaders(request);
  if (!verifySvixSignature(rawBody, svixHeaders, process.env.RESEND_WEBHOOK_SECRET)) {
    console.error("[email] Resend webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    // `svix-id` was read and discarded before telemetry existed. It is the only
    // value in the request that is stable across Resend's retries, which makes
    // it the natural idempotency key for the event row — and verification above
    // has already proved it is the id the signature was computed over, so it
    // cannot be spoofed to force a duplicate.
    await handleResendEvent(event, svixHeaders.id ?? "", {
      recordEvent: recordEmailEvent,
      suppress: suppressAll,
      alertComplaint,
    });
  } catch (error) {
    // Return 500 so Resend retries: losing a bounce means emailing a dead
    // address again, which is exactly what damages the domain's reputation.
    console.error("[email] Failed to handle Resend webhook:", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Records an all-streams opt-out for every recipient of an event, and takes them
 * off the newsletter list.
 *
 * Two stores, written in this order for the same reason as the one-click
 * endpoint: `email_optouts` is what actually stops mail, and
 * `newsletter_subscribers` is the enumerable record that has to agree with it.
 * A complaint is terminal in the subscriber table — `subscribe()` will not take
 * them back by any route — because the complaint ceiling is account-wide and a
 * second complaint from the same address is the most expensive mail we can send.
 *
 * Serial rather than `Promise.all`: Neon throttles bursts of concurrent
 * connection attempts, and a webhook that throws there is a bounce we lose.
 *
 * @param recipients Addresses named by the event.
 * @param reason What produced the suppression.
 */
async function suppressAll(
  recipients: string[],
  reason: OptoutReason
): Promise<void> {
  for (const recipient of recipients) {
    const emailHash = hashEmail(recipient);
    await recordOptout(emailHash, "all", reason);

    // Deliberately not inside the caller's try: `email_optouts` above is what
    // actually stops mail, and it has now succeeded. Letting a failure here
    // bubble would return 500, make Resend retry, and — once retries are
    // exhausted — lose the bounce record we already hold. The subscriber row is
    // the reportable copy, not the enforcing one, and `suppression.ts reconcile`
    // exists to catch exactly this drift.
    try {
      if (reason === "complaint") {
        await markComplainedByHash(emailHash);
      } else if (reason === "bounce") {
        await markBouncedByHash(emailHash);
      }
    } catch (error) {
      console.error("[email] Failed to update the subscriber row:", error);
    }

    console.log(`[email] Suppressed ${emailHash.slice(0, 12)}… (${reason}).`);
  }
}
