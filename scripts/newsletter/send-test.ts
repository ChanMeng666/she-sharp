/**
 * Sends a test render of a newsletter issue to one or more recipients.
 *
 * Loads and zod-validates the issue JSON, renders it ONCE in "preview" mode,
 * and then sends that same render to each recipient as a separate email via
 * the existing transactional `sendEmail` helper, with a `[TEST]` subject
 * prefix. This does NOT touch Resend broadcasts, segments, or topics — these
 * are plain one-off emails for eyeballing the render (e.g. a review round).
 *
 * `RESEND_API_KEY` must already be in the environment when `npx tsx` starts:
 * this script does not read `.env.local`, and the Resend client is built at
 * module load. Without it, `sendEmail` reports success while sending nothing,
 * hence the hard guard at the top of `main()`.
 *
 * Usage:
 *   RESEND_API_KEY=... npx tsx scripts/newsletter/send-test.ts <issue.json> <email>[,<email>…] [--dry-run]
 */

import { readFileSync } from "fs";
import { newsletterIssueSchema } from "../../lib/newsletter/schema";
import { renderNewsletter } from "../../lib/newsletter/render";
import { sendEmail } from "../../lib/email/service";

/** Upper bound on recipients, so a mis-pasted roster can never be blasted. */
const MAX_RECIPIENTS = 25;

const EMAIL_REGEX = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

const USAGE =
  "Usage: RESEND_API_KEY=... npx tsx scripts/newsletter/send-test.ts <path-to-issue.json> <email>[,<email>…] [--dry-run]";

/**
 * Expands recipient arguments (repeated and/or comma-separated) into a clean,
 * de-duplicated list preserving first-seen order.
 */
function parseRecipients(args: string[]): string[] {
  const seen = new Set<string>();
  const recipients: string[] = [];

  for (const arg of args) {
    for (const part of arg.split(",")) {
      const email = part.trim().toLowerCase();
      if (!email) continue;
      if (!EMAIL_REGEX.test(email)) {
        console.error(`Error: "${email}" is not a valid email address.`);
        process.exit(1);
      }
      if (seen.has(email)) continue;
      seen.add(email);
      recipients.push(email);
    }
  }

  return recipients;
}

/** Pauses for the given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error("Error: RESEND_API_KEY is not set. Run with:");
    console.error(`  ${USAGE}`);
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const positional = args.filter((arg) => arg !== "--dry-run");
  const [issuePath, ...recipientArgs] = positional;

  if (!issuePath || recipientArgs.length === 0) {
    console.error(USAGE);
    process.exit(1);
  }

  const recipients = parseRecipients(recipientArgs);
  if (recipients.length === 0) {
    console.error(USAGE);
    process.exit(1);
  }
  if (recipients.length > MAX_RECIPIENTS) {
    console.error(
      `Error: ${recipients.length} recipients exceeds the cap of ${MAX_RECIPIENTS}. Split the list or raise MAX_RECIPIENTS deliberately.`
    );
    process.exit(1);
  }

  let rawJson: string;
  try {
    rawJson = readFileSync(issuePath, "utf8");
  } catch {
    console.error(`Error: could not read issue file ${issuePath}`);
    process.exit(1);
  }

  const parsed = newsletterIssueSchema.safeParse(JSON.parse(rawJson));
  if (!parsed.success) {
    console.error("Error: issue JSON failed validation:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }
  const issue = parsed.data;

  const subject = `[TEST] ${issue.editorial.subjectLine}`;
  const total = recipients.length;
  const width = String(total).length;

  if (dryRun) {
    console.log(`Dry run — nothing will be sent.`);
    console.log(`Subject: ${subject}`);
    console.log(`Recipients (${total}):`);
    recipients.forEach((email, i) => {
      console.log(`  [${String(i + 1).padStart(width, "0")}/${total}] ${email}`);
    });
    return;
  }

  // Render once, outside the loop — every recipient gets the same email body.
  const { html, text, sizeKb } = await renderNewsletter(issue, "preview");
  console.log(`Rendered issue ${issue.id} (${sizeKb} KB).`);
  console.log(`Sending "${subject}" to ${total} recipient(s)…`);

  const failures: string[] = [];

  // One email per address, deliberately NOT a single send with an array `to:`.
  // An array would place every reviewer in one visible `To:` header and expose
  // their addresses to each other. The ~600 ms spacing is a margin rather than
  // the limit: Resend allows 10 requests/second per team, the same on every
  // plan, and that budget is shared with the live site's transactional mail.
  // This comment said "the free tier's 2 requests per second" until
  // 2026-08-30, which was wrong about both the number and the reason.
  for (let i = 0; i < total; i++) {
    const recipient = recipients[i];
    const label = `[${String(i + 1).padStart(width, "0")}/${total}]`;

    if (i > 0) await sleep(600);

    let ok = false;
    try {
      ok = await sendEmail({
        to: recipient,
        subject,
        html,
        text,
        stream: "internal",
        purpose: "internal",
      });
    } catch (err) {
      console.error(`${label} error for ${recipient}:`, err);
      ok = false;
    }

    if (!ok) failures.push(recipient);
    console.log(`${label} ${ok ? "OK  " : "FAIL"} ${recipient}`);
  }

  const sentCount = total - failures.length;
  console.log(`Done: ${sentCount} sent, ${failures.length} failed.`);

  if (failures.length > 0) {
    console.error(`Failed recipients:\n  ${failures.join("\n  ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Send-test failed:", err);
  process.exit(1);
});
