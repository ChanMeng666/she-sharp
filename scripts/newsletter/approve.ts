/**
 * Approves and schedules a monthly newsletter issue via the admin approve
 * endpoint. This does NOT send email itself — it triggers the server, which
 * creates + schedules the Resend broadcast from the deployed JSON fixture.
 *
 * Usage:
 *   BASE_URL=https://www.shesharp.org.nz CRON_SECRET=... \
 *     npx tsx scripts/newsletter/approve.ts 2026-07 [--send-now]
 *
 * The issue MUST already be committed to lib/data/json/newsletter-issues/ and
 * deployed (the endpoint reads the deployed bundle, never the Redis draft).
 * Pass --send-now only when the canonical send slot has already passed and you
 * want an immediate send (the server queues it 5 minutes out).
 */

import { issueIdSchema } from "../../lib/newsletter/schema";

/** Formats an ISO instant as a readable NZ-local date+time. */
function formatNz(iso: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Pacific/Auckland",
  }).format(new Date(iso));
}

async function main(): Promise<void> {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl || baseUrl.includes("localhost")) {
    console.error("ERROR: BASE_URL must be set to the production URL.");
    console.error(
      "Usage: BASE_URL=https://www.shesharp.org.nz CRON_SECRET=... npx tsx scripts/newsletter/approve.ts 2026-07 [--send-now]"
    );
    process.exit(1);
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("ERROR: CRON_SECRET must be set (used as the Bearer token).");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const sendNow = args.includes("--send-now");
  const issueId = args.find((a) => !a.startsWith("--"));
  if (!issueId || !issueIdSchema.safeParse(issueId).success) {
    console.error(`ERROR: provide a valid issue id ("YYYY-MM"). Got: ${issueId ?? "(none)"}`);
    process.exit(1);
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/admin/newsletter/${issueId}/approve`;
  console.log(`\nApproving ${issueId} via ${url}`);
  console.log(`Mode: ${sendNow ? "SEND NOW (immediate)" : "scheduled send slot"}\n`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sendNow }),
  });

  const result = (await response.json().catch(() => ({}))) as {
    issueId?: string;
    broadcastId?: string;
    scheduledAt?: string;
    error?: string;
    message?: string;
  };

  if (response.ok) {
    console.log("Scheduled successfully.");
    console.log(`  Issue:       ${result.issueId ?? issueId}`);
    console.log(`  Broadcast:   ${result.broadcastId ?? "(unknown)"}`);
    if (result.scheduledAt) {
      console.log(`  Send time:   ${formatNz(result.scheduledAt)} NZT`);
      console.log(`  (ISO: ${result.scheduledAt})`);
    }
    process.exit(0);
  }

  // Non-2xx: surface the server's instruction verbatim so the operator can act.
  console.error(`Request failed (HTTP ${response.status}).`);
  if (result.error) console.error(`  ${result.error}`);
  if (result.message) console.error(`  ${result.message}`);
  process.exit(1);
}

main().catch((err) => {
  console.error("Approve script failed:", err);
  process.exit(1);
});
