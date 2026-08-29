/**
 * Checks for the Resend delivery telemetry.
 *
 * Run: npx tsx lib/email/events.test.ts
 *
 * These cover the failure modes that would stay invisible until the first
 * self-hosted newsletter had already gone to 1,545 people: a retried webhook
 * double-counting a complaint (the account-wide ceiling is 0.08%, about 1.25
 * complaints, so one phantom event spends a quarter of the budget), a delivery
 * or engagement signal being mistaken for something that should suppress an
 * address, and an analytics failure escalating into the 500 that loses a real
 * bounce.
 *
 * **No database and no network.** The dispatcher takes its side effects as an
 * argument, so the fake store below stands in for `email_events` — including its
 * unique constraint on `svix_id`, which is the whole idempotency story. A test
 * that needed production Postgres is a test nobody runs.
 *
 * It does need `POSTGRES_URL` to be *present* in `.env`, never reachable:
 * importing the module pulls in the Drizzle client for the one function that
 * writes, and that client throws at import when the variable is missing. The
 * same constraint every script under `scripts/` already carries.
 *
 * Everything asynchronous sits inside `main()` — `tsx` compiles this file to
 * CommonJS, where a top-level `await` is a transform error.
 */

import { createHmac } from "node:crypto";

import type { NewEmailEvent } from "@/lib/db/schema";

import {
  buildEmailEventRow,
  handleResendEvent,
  readTagValue,
  type ResendEventEffects,
  type ResendWebhookEvent,
} from "./events";
import { hashEmail } from "./hash";
import { verifySvixSignature } from "./webhook-verify";

let failures = 0;

/** Records one assertion and keeps going, so one break does not hide the rest. */
function check(label: string, ok: boolean): void {
  console.log(`  ${ok ? "ok" : "FAIL"} - ${label}`);
  if (!ok) failures++;
}

const RECIPIENT = "someone@example.com";
const RECIPIENT_HASH = hashEmail(RECIPIENT);

/**
 * A stand-in for `email_events` that enforces the same unique key.
 *
 * The dedupe assertion is only meaningful if the fake refuses a repeated
 * `svixId` the way the real `onConflictDoNothing({ target: svixId })` does.
 *
 * @param options `throwOnRecord` simulates the analytics insert failing.
 */
function fakeEffects(options: { throwOnRecord?: boolean } = {}) {
  const rows: NewEmailEvent[] = [];
  const seen = new Set<string>();
  const suppressed: { recipients: string[]; reason: string }[] = [];
  const alerts: string[][] = [];

  const effects: ResendEventEffects = {
    async recordEvent(row) {
      if (options.throwOnRecord) throw new Error("simulated insert failure");
      if (seen.has(row.svixId)) return; // onConflictDoNothing
      seen.add(row.svixId);
      rows.push(row);
    },
    async suppress(recipients, reason) {
      suppressed.push({ recipients, reason });
    },
    async alertComplaint(recipients) {
      alerts.push(recipients);
    },
  };

  return { effects, rows, suppressed, alerts };
}

/**
 * Builds a payload carrying the tags the newsletter batch builder really stamps.
 *
 * @param type The Resend event type.
 * @param extra Fields to merge into `data`.
 */
function payload(
  type: string,
  extra: Partial<NonNullable<ResendWebhookEvent["data"]>> = {}
): ResendWebhookEvent {
  return {
    type,
    data: {
      to: [RECIPIENT],
      email_id: "b1f2c3d4-0000-4444-8888-aaaabbbbcccc",
      created_at: "2026-09-01T02:03:04.000Z",
      tags: [
        { name: "stream", value: "marketing" },
        { name: "newsletter", value: "2026-08" },
      ],
      ...extra,
    },
  };
}

// The signature check belongs to this path: the `svix-id` that becomes the
// idempotency key is the same id the signature was computed over, so a verified
// request cannot carry a spoofed key.
const SECRET = `whsec_${Buffer.from("a-test-signing-key").toString("base64")}`;
const OPENED_BODY = JSON.stringify(payload("email.opened"));
const SVIX_ID = "msg_2abcOPENED";
const NOW = String(Math.floor(Date.now() / 1000));
const SIGNATURE = createHmac("sha256", Buffer.from(SECRET.replace(/^whsec_/, ""), "base64"))
  .update(`${SVIX_ID}.${NOW}.${OPENED_BODY}`)
  .digest("base64");

/** Runs every asynchronous check. */
async function main(): Promise<void> {
  // --- A signed email.opened payload ---------------------------------------

  check(
    "the opened payload verifies against its svix-id",
    verifySvixSignature(
      OPENED_BODY,
      { id: SVIX_ID, timestamp: NOW, signature: `v1,${SIGNATURE}` },
      SECRET
    )
  );

  {
    const { effects, rows, suppressed } = fakeEffects();
    await handleResendEvent(JSON.parse(OPENED_BODY) as ResendWebhookEvent, SVIX_ID, effects);

    check("a signed email.opened writes exactly one row", rows.length === 1);
    check("the row is keyed on the address hash", rows[0]?.emailHash === RECIPIENT_HASH);
    check("no plaintext address reaches the row", !JSON.stringify(rows[0]).includes(RECIPIENT));
    check("the stream tag is parsed", rows[0]?.stream === "marketing");
    check("the issue tag is parsed and prefixed", rows[0]?.issueTag === "newsletter:2026-08");
    check(
      "occurredAt comes from the payload, not the clock",
      rows[0]?.occurredAt instanceof Date &&
        (rows[0].occurredAt as Date).toISOString() === "2026-09-01T02:03:04.000Z"
    );
    check("an open suppresses nobody", suppressed.length === 0);

    // The retry. Resend replays an event after any 500, and the route returns
    // 500 on purpose, so this is guaranteed rather than hypothetical.
    await handleResendEvent(JSON.parse(OPENED_BODY) as ResendWebhookEvent, SVIX_ID, effects);
    check("replaying the same svix-id writes no second row", rows.length === 1);

    // A genuinely different delivery of a different event must still land.
    await handleResendEvent(payload("email.delivered"), "msg_2abcDELIVERED", effects);
    check("a different svix-id does write a second row", rows.length === 2);
    check("a delivery suppresses nobody", suppressed.length === 0);
  }

  // --- Clicks ---------------------------------------------------------------

  {
    const { effects, rows, suppressed } = fakeEffects();
    await handleResendEvent(
      payload("email.clicked", {
        click: {
          link: "https://www.shesharp.org.nz/events",
          ipAddress: "203.0.113.7",
          userAgent: "Mozilla/5.0",
        },
      }),
      "msg_click",
      effects
    );

    check("a click records the link", rows[0]?.linkUrl === "https://www.shesharp.org.nz/events");
    check("a click suppresses nobody", suppressed.length === 0);
    // The IP and user agent arrive on the payload and must not be stored: an IP
    // beside a hash undoes the reason the hash was chosen.
    const stored = JSON.stringify(rows[0]);
    check("the click IP is not stored", !stored.includes("203.0.113.7"));
    check("the click user agent is not stored", !stored.includes("Mozilla"));
  }

  {
    const { effects, rows } = fakeEffects();
    await handleResendEvent(payload("email.opened"), "msg_no_link", effects);
    check("a non-click event stores no link", rows[0]?.linkUrl === null);
  }

  // --- Bounces and complaints still do exactly what they did -----------------

  {
    const { effects, rows, suppressed } = fakeEffects();
    await handleResendEvent(
      payload("email.bounced", { bounce: { type: "Permanent", subType: "General" } }),
      "msg_bounce",
      effects
    );
    check("a bounce still suppresses", suppressed[0]?.reason === "bounce");
    check("a bounce suppresses the right recipient", suppressed[0]?.recipients[0] === RECIPIENT);
    check(
      "a bounce also writes a telemetry row",
      rows.length === 1 && rows[0]?.type === "email.bounced"
    );
  }

  {
    const { effects, rows, suppressed } = fakeEffects();
    await handleResendEvent(
      payload("email.bounced", { bounce: { type: "Transient", subType: "MailboxFull" } }),
      "msg_soft_bounce",
      effects
    );
    check("a transient bounce does not suppress", suppressed.length === 0);
    check("a transient bounce is still counted", rows.length === 1);
  }

  {
    const { effects, rows, suppressed, alerts } = fakeEffects();
    await handleResendEvent(payload("email.complained"), "msg_complaint", effects);
    check("a complaint still suppresses", suppressed[0]?.reason === "complaint");
    check("a complaint still alerts Slack", alerts.length === 1);
    check("a complaint also writes a telemetry row", rows.length === 1);
  }

  // --- An analytics failure must never cost us a bounce ---------------------

  {
    const { effects, suppressed } = fakeEffects({ throwOnRecord: true });
    let threw = false;
    try {
      await handleResendEvent(
        payload("email.bounced", { bounce: { type: "Permanent" } }),
        "msg_bounce_row_fails",
        effects
      );
    } catch {
      threw = true;
    }
    check("a failed telemetry insert does not throw", !threw);
    check("a failed telemetry insert still suppresses the bounce", suppressed[0]?.reason === "bounce");
  }

  // --- Row construction edge cases -----------------------------------------

  check(
    "an unrecognised event type produces no row",
    buildEmailEventRow(payload("email.something_new"), "msg_x") === null
  );
  check(
    "an event with no recipient produces no row",
    buildEmailEventRow({ type: "email.opened", data: { to: [] } }, "msg_x") === null
  );
  check(
    "a missing svix-id produces no row",
    buildEmailEventRow(payload("email.opened"), "") === null
  );
  check(
    "a delivery_delayed is deliberately not recorded",
    buildEmailEventRow(payload("email.delivery_delayed"), "msg_x") === null
  );
  check(
    "a failed send is recorded",
    buildEmailEventRow(payload("email.failed"), "msg_x")?.type === "email.failed"
  );
  check(
    "an untagged transactional message records null tags",
    buildEmailEventRow({ type: "email.sent", data: { to: RECIPIENT } }, "msg_x")?.issueTag === null
  );

  // --- Tag shapes -----------------------------------------------------------
  //
  // Both shapes are accepted because Resend's send API takes an array and its
  // webhook examples have shown an object, and no real payload can be observed
  // until tracking is switched on in the dashboard.

  check(
    "tags as an array are read",
    readTagValue([{ name: "stream", value: "marketing" }], "stream") === "marketing"
  );
  check("tags as an object are read", readTagValue({ stream: "marketing" }, "stream") === "marketing");
  check("an absent tag reads null", readTagValue([], "stream") === null);
  check("absent tags read null", readTagValue(undefined, "stream") === null);
}

main()
  .then(() => {
    if (failures > 0) {
      console.error(`\n${failures} check(s) FAILED.`);
      process.exit(1);
    }
    console.log("\nAll delivery telemetry checks passed.");
    // The Drizzle client is imported transitively and keeps no open socket until
    // a query, but exiting explicitly keeps the runner deterministic.
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
