/**
 * Sends a single test render of a newsletter issue to one recipient.
 *
 * Loads and zod-validates the issue JSON, renders it in "preview" mode, and
 * sends exactly one email via the existing transactional `sendEmail` helper
 * with a `[TEST]` subject prefix. This does NOT touch Resend broadcasts,
 * segments, or topics — it is a plain one-off email for eyeballing the render.
 *
 * Usage:
 *   RESEND_API_KEY=... npx tsx scripts/newsletter/send-test.ts <issue.json> <recipient-email>
 */

import { readFileSync } from "fs";
import { newsletterIssueSchema } from "../../lib/newsletter/schema";
import { renderNewsletter } from "../../lib/newsletter/render";
import { sendEmail } from "../../lib/email/service";

async function main(): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error("Error: RESEND_API_KEY is not set. Run with:");
    console.error(
      "  RESEND_API_KEY=... npx tsx scripts/newsletter/send-test.ts <issue.json> <recipient-email>"
    );
    process.exit(1);
  }

  const [issuePath, recipient] = process.argv.slice(2);
  if (!issuePath || !recipient) {
    console.error(
      "Usage: npx tsx scripts/newsletter/send-test.ts <path-to-issue.json> <recipient-email>"
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

  const { html, text, sizeKb } = await renderNewsletter(issue, "preview");
  console.log(`Rendered issue ${issue.id} (${sizeKb} KB).`);

  const subject = `[TEST] ${issue.editorial.subjectLine}`;
  const sent = await sendEmail({ to: recipient, subject, html, text });

  if (!sent) {
    console.error(`Failed to send test email to ${recipient}.`);
    process.exit(1);
  }
  console.log(`Test email sent to ${recipient} with subject "${subject}".`);
}

main().catch((err) => {
  console.error("Send-test failed:", err);
  process.exit(1);
});
