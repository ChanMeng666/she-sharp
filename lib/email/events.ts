/**
 * Delivery telemetry: turning Resend webhook events into rows we can count.
 *
 * She Sharp is about to send its first self-hosted newsletter to about 1,545
 * real people. Resend's Acceptable Use Policy sets an account-wide complaint
 * ceiling of **0.08%** — roughly 1.25 complaints on a full send — and breaching
 * it means the account "may be shut down without warning", taking password
 * resets and donation receipts down with the newsletter. Before this module
 * existed the webhook route suppressed the odd bouncing address and stored no
 * per-send record at all, so nobody could compute that rate: there was a
 * numerator arriving one complaint at a time and no denominator anywhere.
 *
 * Two things live here, and the split is deliberate:
 *
 *  - {@link buildEmailEventRow} and {@link readTagValue} are pure. They can be
 *    tested without a database, which matters because the repo has no test
 *    runner and no test Postgres, and because every field this code reads comes
 *    from a payload shape nobody in this repo has yet observed — open and click
 *    tracking are still switched off in the Resend dashboard. The code has to be
 *    right *before* those flags are flipped.
 *  - {@link handleResendEvent} is the event dispatch, with its side effects
 *    injected. It lives here rather than in the route for the house reason that
 *    work belongs in a service under `lib/`, and for the practical one that a
 *    dispatcher taking fake effects is testable and a route handler is not.
 *
 * The route keeps signature verification and the suppression writes; nothing
 * about suppression behaviour changed when the dispatch moved.
 */

import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/lib/db/drizzle";
import { emailEvents, type NewEmailEvent } from "@/lib/db/schema";

import { hashEmail } from "./hash";
import type { OptoutReason } from "./optouts";

/**
 * Tags as they arrive on a webhook payload.
 *
 * Accepts both shapes on purpose. The send API takes `[{ name, value }]` and
 * that is what `scripts/newsletter/build-newsletter-batch.ts` stamps, but
 * Resend's webhook examples have shown tags flattened to a plain object, and
 * this repo cannot observe a real payload until tracking is enabled in the
 * dashboard. Reading both costs six lines; guessing wrong costs the issue tag on
 * every row of the first send, which is the one send that matters most.
 */
export type ResendTags =
  | { name?: string; value?: string }[]
  | Record<string, string | undefined>;

/** The subset of the Resend event payload this codebase relies on. */
export interface ResendWebhookEvent {
  type?: string;
  created_at?: string;
  data?: {
    to?: string | string[];
    email_id?: string;
    subject?: string;
    created_at?: string;
    tags?: ResendTags;
    bounce?: { type?: string; subType?: string };
    /**
     * Present on `email.clicked` only. `ipAddress` and `userAgent` also arrive
     * and are deliberately never stored — see the `email_events` doc comment.
     */
    click?: { link?: string; ipAddress?: string; userAgent?: string };
  };
}

/** Event types that produce a stored row, mapped to nothing else. */
const RECORDED_TYPES = new Set([
  "email.sent",
  "email.delivered",
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.complained",
  "email.failed",
]);

/**
 * Normalizes the `to` field, which is a bare string for some event types.
 *
 * @param data The event payload's `data` object.
 * @returns Every recipient named by the event, possibly empty.
 */
export function readRecipients(data: ResendWebhookEvent["data"]): string[] {
  if (!data?.to) return [];
  return Array.isArray(data.to) ? data.to : [data.to];
}

/**
 * Reads one tag value off a payload, whichever shape the tags arrived in.
 *
 * @param tags The payload's `tags`, if any.
 * @param name The tag name, e.g. "stream" or "newsletter".
 * @returns The value, or null when the tag is absent or empty.
 */
export function readTagValue(tags: ResendTags | undefined, name: string): string | null {
  if (!tags) return null;
  if (Array.isArray(tags)) {
    const hit = tags.find((tag) => tag?.name === name);
    return hit?.value?.trim() || null;
  }
  return tags[name]?.trim() || null;
}

/**
 * Builds the row for one webhook event, or null when it is not one we store.
 *
 * Pure, so the whole field mapping is testable without a database.
 *
 * Two shapes worth explaining:
 *
 *  - **One row per event, not per recipient**, keyed to the first address. The
 *    unique key is `svixId` and there is exactly one `svix-id` per event, so a
 *    row per recipient would be N-1 silent conflict-drops. Every message this
 *    codebase sends has a single recipient — the batch builder emits one entry
 *    per person precisely so unsubscribe links can be per-recipient — so the
 *    first address is the address.
 *  - **`occurredAt` comes from the payload**, falling back to now. A retry that
 *    lands hours after the event must not be filed in the wrong window.
 *
 * @param event The parsed Resend webhook body.
 * @param svixId The `svix-id` header, which is the idempotency key.
 * @returns A row ready to insert, or null when the event type is not recorded
 *   or the payload names no recipient (there is nothing to key a row on).
 */
export function buildEmailEventRow(
  event: ResendWebhookEvent,
  svixId: string
): NewEmailEvent | null {
  if (!event.type || !RECORDED_TYPES.has(event.type)) return null;
  if (!svixId) return null;

  const [recipient] = readRecipients(event.data);
  if (!recipient) return null;

  const stamped = event.data?.created_at ?? event.created_at;
  const occurredAt = stamped ? new Date(stamped) : new Date();

  return {
    svixId: svixId.slice(0, 64),
    emailId: event.data?.email_id?.slice(0, 64) ?? null,
    type: event.type.slice(0, 32),
    emailHash: hashEmail(recipient),
    stream: readTagValue(event.data?.tags, "stream")?.slice(0, 32) ?? null,
    // The batch builder stamps `newsletter:<YYYY-MM>`; the tag NAME is
    // "newsletter" and its value is the issue id. Stored with the prefix so one
    // column can also hold a future campaign tag without ambiguity.
    issueTag: buildIssueTag(event.data?.tags),
    // Stored verbatim ("Permanent" / "Transient"), not normalised to a boolean.
    // The vault rule applies to any provider payload: record what the API said,
    // and let the reader classify. A boolean would also have thrown away
    // `subType`-adjacent detail the moment Resend adds a third value.
    bounceType:
      event.type === "email.bounced"
        ? event.data?.bounce?.type?.slice(0, 32) ?? null
        : null,
    occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
    linkUrl: event.type === "email.clicked" ? event.data?.click?.link ?? null : null,
  };
}

/**
 * Reports whether a stored bounce was the transient kind.
 *
 * The one place this classification is made, so the rate reported by
 * `send-stats.ts` and the suppression decision taken by the webhook cannot
 * drift apart. **A null or unrecognised value counts as hard**, matching what
 * suppression actually does: the route suppresses unless the type is explicitly
 * "transient", so a rate that treated an unknown as transient would report a
 * cleaner send than the one whose addresses we just opted out.
 *
 * @param bounceType The stored `bounceType`, as Resend sent it.
 */
export function isTransientBounce(bounceType: string | null | undefined): boolean {
  return bounceType?.toLowerCase() === "transient";
}

/**
 * Composes the `newsletter:<YYYY-MM>` value stored in `issue_tag`.
 *
 * @param tags The payload's tags.
 * @returns The prefixed tag, or null when the message carried no issue tag —
 *   which every transactional message legitimately does.
 */
function buildIssueTag(tags: ResendTags | undefined): string | null {
  const issue = readTagValue(tags, "newsletter");
  return issue ? `newsletter:${issue}`.slice(0, 64) : null;
}

/**
 * Inserts one event row, ignoring a delivery we have already stored.
 *
 * `onConflictDoNothing` on `svixId` is the whole idempotency story. It is not a
 * defensive nicety: the webhook route returns 500 on a handler failure *so that*
 * Resend retries, which makes duplicate deliveries a certainty. A duplicated
 * `email.complained` would inflate the exact rate this table exists to watch.
 *
 * @param row The row from {@link buildEmailEventRow}.
 */
export async function recordEmailEvent(row: NewEmailEvent): Promise<void> {
  await db.insert(emailEvents).values(row).onConflictDoNothing({
    target: emailEvents.svixId,
  });
}

/** One event type's totals for a single tagged send. */
export interface EmailEventTypeCount {
  type: string;
  /** Every stored event of this type. */
  events: number;
  /** Distinct recipients — the only figure a rate may be computed from. */
  people: number;
}

/**
 * Counts the stored events for one issue tag.
 *
 * Returns both totals because they answer different questions and are one
 * keystroke apart. A "unique open rate" divides *people* by recipients; opening
 * an issue four times contributes four `events` and one `person`, and quoting
 * the first as a rate produces a plausible-looking number that is wrong — the
 * same trap `types/mailchimp.ts` documents for `uniqueOpens` versus `opensTotal`.
 *
 * @param issueTag The stored tag, e.g. "newsletter:2026-08".
 * @returns One entry per event type present, unordered.
 */
export async function countEventsByTag(issueTag: string): Promise<EmailEventTypeCount[]> {
  return db
    .select({
      type: emailEvents.type,
      events: sql<number>`count(*)::int`,
      people: sql<number>`count(distinct ${emailEvents.emailHash})::int`,
    })
    .from(emailEvents)
    .where(eq(emailEvents.issueTag, issueTag))
    .groupBy(emailEvents.type);
}

/** Bounces for one send, split by the kind Resend reported. */
export interface BounceSplit {
  /** Recipients whose bounce was permanent, or whose type Resend did not give. */
  hard: number;
  /** Recipients whose bounce was transient — a full mailbox, a greylist. */
  transient: number;
}

/**
 * Splits one send's bounces into hard and transient.
 *
 * Kept apart from {@link countEventsByTag} because they are counted differently
 * and conflating them is the whole reason `bounceType` exists: a ramped send to
 * 1,545 people produces routine transient bounces, and folding those into the
 * hard-bounce rate would report OVER against the 2% house trigger on a healthy
 * send. Counts distinct recipients, like every other rate here.
 *
 * @param issueTag The stored tag, e.g. "newsletter:2026-08".
 */
export async function countBouncesByTag(issueTag: string): Promise<BounceSplit> {
  const rows = await db
    .select({
      bounceType: emailEvents.bounceType,
      people: sql<number>`count(distinct ${emailEvents.emailHash})::int`,
    })
    .from(emailEvents)
    .where(and(eq(emailEvents.issueTag, issueTag), eq(emailEvents.type, "email.bounced")))
    .groupBy(emailEvents.bounceType);

  let hard = 0;
  let transient = 0;
  for (const row of rows) {
    if (isTransientBounce(row.bounceType)) transient += row.people;
    else hard += row.people;
  }
  return { hard, transient };
}

/**
 * Lists the issue tags that have events, newest activity first.
 *
 * Exists so a mistyped `--tag` can be answered with "did you mean" rather than
 * a bare zero, which reads identically to a send that produced no events.
 *
 * @param limit How many tags to return.
 */
export async function listIssueTags(limit = 20): Promise<{ issueTag: string; events: number }[]> {
  const rows = await db
    .select({
      issueTag: emailEvents.issueTag,
      events: sql<number>`count(*)::int`,
      lastAt: sql<Date>`max(${emailEvents.occurredAt})`,
    })
    .from(emailEvents)
    .where(isNotNull(emailEvents.issueTag))
    .groupBy(emailEvents.issueTag)
    .orderBy(desc(sql`max(${emailEvents.occurredAt})`))
    .limit(limit);
  return rows.map((row) => ({ issueTag: row.issueTag ?? "", events: row.events }));
}

/** The side effects {@link handleResendEvent} performs, injected so it is testable. */
export interface ResendEventEffects {
  /** Stores one telemetry row. */
  recordEvent(row: NewEmailEvent): Promise<void>;
  /** Records an all-streams opt-out for every recipient. */
  suppress(recipients: string[], reason: OptoutReason): Promise<void>;
  /** Posts a same-day complaint alert to Slack. */
  alertComplaint(recipients: string[], subject?: string): Promise<void>;
}

/**
 * Stores the telemetry row without ever letting that failure reach the caller.
 *
 * The same reasoning the subscriber-row update in the route already carries: the
 * enforcing write is the suppression, this one is the reportable copy, and
 * letting an analytics insert bubble would return 500, make Resend retry and —
 * once retries are exhausted — lose the bounce we already hold.
 */
async function recordSafely(
  effects: ResendEventEffects,
  event: ResendWebhookEvent,
  svixId: string
): Promise<void> {
  const row = buildEmailEventRow(event, svixId);
  if (!row) return;
  try {
    await effects.recordEvent(row);
  } catch (error) {
    console.error("[email] Failed to store the delivery event:", error);
  }
}

/**
 * Dispatches one verified Resend webhook event.
 *
 * Every DB write below is serial rather than `Promise.all`: Neon throttles
 * bursts of concurrent connection attempts ("Failed to acquire permit"), and a
 * webhook that throws there is a bounce we lose.
 *
 * The telemetry row is written first in every arm, so a later suppression
 * failure still leaves the event counted — and if that failure does return 500,
 * the retry's insert is a no-op on `svixId` rather than a double count.
 *
 * @param event The parsed, signature-verified payload.
 * @param svixId The `svix-id` header value.
 * @param effects The side effects to perform.
 */
export async function handleResendEvent(
  event: ResendWebhookEvent,
  svixId: string,
  effects: ResendEventEffects
): Promise<void> {
  const recipients = readRecipients(event.data);

  switch (event.type) {
    // Delivery and engagement signals. **None of these may suppress anything.**
    // A send, a delivery, an open or a click says nothing bad about an address —
    // suppressing on one would opt people out for reading the newsletter. They
    // exist here only to give the complaint and bounce rates a denominator.
    case "email.sent":
    case "email.delivered":
    case "email.opened":
    case "email.clicked":
      await recordSafely(effects, event, svixId);
      break;

    case "email.bounced": {
      await recordSafely(effects, event, svixId);
      // Soft bounces (a full mailbox, a temporary block) resolve on their own;
      // opting the address out for one would be an overreaction. The row above
      // is still written, because a transient bounce is real delivery data —
      // and it carries `bounceType`, so `send-stats.ts` can report it on its own
      // line instead of inflating the hard-bounce rate. Same classifier both
      // places, so what is excluded from the rate is exactly what was not
      // suppressed.
      if (isTransientBounce(event.data?.bounce?.type)) {
        console.log("[email] Transient bounce; not suppressing.");
        break;
      }
      await effects.suppress(recipients, "bounce");
      break;
    }

    case "email.complained": {
      await recordSafely(effects, event, svixId);
      await effects.suppress(recipients, "complaint");
      await effects.alertComplaint(recipients, event.data?.subject);
      break;
    }

    case "email.failed":
      // Recorded, unlike `email.delivery_delayed` below: a failure is a terminal
      // non-delivery and belongs in the denominator, whereas a delay is a state
      // the same message leaves again — counting it would invent an outcome.
      // The address itself is not implicated either way, so neither suppresses.
      await recordSafely(effects, event, svixId);
      console.error(`[email] Send failed (id ${event.data?.email_id ?? "unknown"}).`);
      break;

    case "email.delivery_delayed":
      console.warn(`[email] Delivery delayed (id ${event.data?.email_id ?? "unknown"}).`);
      break;

    default:
      // Resend adds event types over time; an unknown one is not an error.
      break;
  }
}
