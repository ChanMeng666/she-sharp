/**
 * Resend deliverability webhook.
 *
 * Bounces and spam complaints are the two signals that decide whether the
 * domain keeps reaching inboxes, and until now nothing in this codebase saw
 * them: they lived in the Resend dashboard until somebody thought to look.
 * This route turns them into rows in `email_optouts`, which `sendEmail()`
 * consults on every notification-class send.
 *
 * What each event does, and why:
 *  - `email.bounced`     — the address does not exist or refused delivery.
 *                          Suppress everything but transactional mail.
 *  - `email.complained`  — someone pressed "report spam". Suppress, and post to
 *                          Slack: a complaint rate above ~0.1% is what makes a
 *                          domain start landing in Junk, and it needs a human
 *                          to notice the same day, not at the next newsletter.
 *  - `email.failed`      — a provider-side send failure. Log only; the address
 *                          is not implicated.
 *  - `email.delivery_delayed` — a greylist or a temporarily full mailbox. Log
 *                          only. Suppressing on a delay would opt people out
 *                          for a problem that resolves itself in minutes.
 *
 * Register the endpoint in the Resend dashboard (Webhooks → Add Endpoint) and
 * put the signing secret in `RESEND_WEBHOOK_SECRET`. See
 * `docs/deployment/EMAIL_AUTHENTICATION.md`.
 */

import { NextRequest, NextResponse } from "next/server";

import { hashEmail } from "@/lib/email/hash";
import { recordOptout, type OptoutReason } from "@/lib/email/optouts";
import { readSvixHeaders, verifySvixSignature } from "@/lib/email/webhook-verify";

// node:crypto and the database driver both need the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The subset of the Resend event payload this route relies on. */
interface ResendWebhookEvent {
  type?: string;
  data?: {
    to?: string | string[];
    email_id?: string;
    subject?: string;
    bounce?: { type?: string; subType?: string };
  };
}

/** Normalizes the `to` field, which is a string for some event types. */
function readRecipients(data: ResendWebhookEvent["data"]): string[] {
  if (!data?.to) return [];
  return Array.isArray(data.to) ? data.to : [data.to];
}

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
    `Check the complaint rate before the next broadcast — above 0.1% is trouble.`;

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

  if (!verifySvixSignature(rawBody, readSvixHeaders(request), process.env.RESEND_WEBHOOK_SECRET)) {
    console.error("[email] Resend webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const recipients = readRecipients(event.data);

  try {
    switch (event.type) {
      case "email.bounced": {
        // Soft bounces (a full mailbox, a temporary block) resolve on their own;
        // opting the address out for one would be an overreaction.
        if (event.data?.bounce?.type?.toLowerCase() === "transient") {
          console.log("[email] Transient bounce; not suppressing.");
          break;
        }
        await suppressAll(recipients, "bounce");
        break;
      }

      case "email.complained": {
        await suppressAll(recipients, "complaint");
        await alertComplaint(recipients, event.data?.subject);
        break;
      }

      case "email.failed":
        console.error(
          `[email] Send failed (id ${event.data?.email_id ?? "unknown"}).`
        );
        break;

      case "email.delivery_delayed":
        console.warn(
          `[email] Delivery delayed (id ${event.data?.email_id ?? "unknown"}).`
        );
        break;

      default:
        // Resend adds event types over time; an unknown one is not an error.
        break;
    }
  } catch (error) {
    // Return 500 so Resend retries: losing a bounce means emailing a dead
    // address again, which is exactly what damages the domain's reputation.
    console.error("[email] Failed to handle Resend webhook:", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** Records an all-streams opt-out for every recipient of an event. */
async function suppressAll(
  recipients: string[],
  reason: OptoutReason
): Promise<void> {
  for (const recipient of recipients) {
    await recordOptout(hashEmail(recipient), "all", reason);
    console.log(`[email] Suppressed ${hashEmail(recipient).slice(0, 12)}… (${reason}).`);
  }
}
