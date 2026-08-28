/**
 * Approves a monthly newsletter issue via the admin approve endpoint.
 *
 * This sends NOTHING, and neither does the endpoint any more. Approving marks
 * the deployed issue as cleared to go and records the intended send slot; the
 * mail is built and sent afterwards, by hand, from this repo — the same shape as
 * the other outbound email skills, where repo scripts render and the `resend`
 * CLI sends. The two build commands are printed on success.
 *
 * Usage:
 *   BASE_URL=https://www.shesharp.org.nz CRON_SECRET=... \
 *     npx tsx scripts/newsletter/approve.ts 2026-07 [--send-now]
 *
 * The issue MUST already be committed to lib/data/json/newsletter-issues/ and
 * deployed (the endpoint reads the deployed bundle, never the Redis draft).
 * Pass --send-now only when the canonical send slot has already passed and you
 * intend to send immediately by hand; it relaxes the endpoint's refusal and
 * records a send instant five minutes out, nothing more.
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

/**
 * The commands that actually produce the mail, in order.
 *
 * The server returns these in `nextSteps`; this local copy is the fallback for
 * an older deployment that does not, so the operator is never left at "approved"
 * with no idea what comes next.
 */
function fallbackNextSteps(issueId: string): string[] {
  return [
    `npx tsx scripts/email/recipients-from-db.ts --key newsletter-${issueId}`,
    `npx tsx scripts/newsletter/build-newsletter-batch.ts ${issueId} --recipients tmp/emails/recipients-newsletter-${issueId}.json`,
  ];
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
  console.log(`Mode: ${sendNow ? "SEND NOW (immediate slot)" : "canonical send slot"}\n`);

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
    status?: string;
    scheduledAt?: string;
    scheduledAtNz?: string;
    renderedKb?: number;
    nextSteps?: string[];
    error?: string;
    message?: string;
  };

  if (response.ok) {
    console.log("Approved. NOTHING HAS BEEN SENT.");
    console.log(`  Issue:       ${result.issueId ?? issueId}`);
    console.log(`  Status:      ${result.status ?? "approved"}`);
    if (result.renderedKb !== undefined) {
      console.log(`  Rendered:    ${result.renderedKb} KB (under the 100KB Gmail clip limit)`);
    }
    if (result.scheduledAt) {
      console.log(`  Send slot:   ${result.scheduledAtNz ?? `${formatNz(result.scheduledAt)} NZT`}`);
      console.log(`  (ISO: ${result.scheduledAt})`);
    }

    const steps = result.nextSteps?.length ? result.nextSteps : fallbackNextSteps(issueId);
    console.log("\nNext, build the batch locally:\n");
    for (const step of steps) console.log(`  ${step}`);
    console.log("\nThen send the built batch with the Resend CLI (see /monthly-newsletter).");
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
