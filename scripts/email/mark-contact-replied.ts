/**
 * Close out one `contact_form_submissions` row after it has been answered.
 *
 * The contact inbox has no "replied" flag of its own, and adding one would mean
 * a migration for a workflow that four existing columns already express. This
 * script writes exactly those four — `reviewed_at`, `status`, `review_notes`,
 * `reviewed_by` — so a reply leaves an audit trail (which Resend message
 * answered it, with what subject) and drops out of the pending queue that
 * `audience-report.ts` counts.
 *
 * ZERO migrations. It never sends mail; run it AFTER the reply has actually
 * gone out and you have the Resend message id in hand.
 *
 * Usage:
 *   npx tsx scripts/email/mark-contact-replied.ts --id <n> --outcome replied \
 *     --resend-id <id> --subject "..." [--by-email <admin@…>] [--dry-run] [--force]
 *
 *   npx tsx scripts/email/mark-contact-replied.ts --id <n> --outcome no-reply-needed \
 *     --reason "QA test row" [--dry-run] [--force]
 *
 *   --id <n>            contact_form_submissions.id to close. Required.
 *   --outcome <o>       "replied" → status=approved; "no-reply-needed" → status=rejected.
 *   --resend-id <id>    Resend message id of the reply. Required for "replied".
 *   --subject "..."     Subject line that was sent. Required for "replied".
 *   --reason "..."      Why no reply is needed. Required for "no-reply-needed".
 *   --by-email <addr>   Admin who handled it; resolved to users.id for reviewed_by.
 *                       An unknown address warns and leaves reviewed_by null.
 *   --force             Overwrite a row that already has reviewed_at set.
 *   --dry-run           Print the exact UPDATE values, including the full
 *                       composed review_notes, and write nothing.
 *
 * Output:
 *   The before/after of every field it touches, then a one-line confirmation.
 *   Exit code 1 on a missing row, a bad argument, or an already-reviewed row
 *   without --force.
 */

import "dotenv/config";

import { eq } from "drizzle-orm";
import { db, client } from "@/lib/db/drizzle";
import { contactFormSubmissions, users } from "@/lib/db/schema";

type Outcome = "replied" | "no-reply-needed";

interface Args {
  id: number;
  outcome: Outcome;
  resendId: string | null;
  subject: string | null;
  reason: string | null;
  byEmail: string | null;
  dryRun: boolean;
  force: boolean;
}

const USAGE = [
  "Usage:",
  '  npx tsx scripts/email/mark-contact-replied.ts --id <n> --outcome replied --resend-id <id> --subject "..." [--by-email <addr>] [--dry-run] [--force]',
  '  npx tsx scripts/email/mark-contact-replied.ts --id <n> --outcome no-reply-needed --reason "..." [--dry-run] [--force]',
].join("\n");

/**
 * Parses argv and enforces the per-outcome required flags.
 *
 * @param argv `process.argv.slice(2)`.
 * @returns Validated arguments.
 * @throws Error with the usage block on any missing or unknown flag.
 */
function parseArgs(argv: string[]): Args {
  let id: number | null = null;
  let outcome: Outcome | null = null;
  let resendId: string | null = null;
  let subject: string | null = null;
  let reason: string | null = null;
  let byEmail: string | null = null;
  let dryRun = false;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--id": {
        const value = argv[++i];
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          throw new Error(`--id must be a positive integer, got: ${value ?? "(nothing)"}`);
        }
        id = parsed;
        break;
      }
      case "--outcome": {
        const value = argv[++i];
        if (value !== "replied" && value !== "no-reply-needed") {
          throw new Error(
            `--outcome must be "replied" or "no-reply-needed", got: ${value ?? "(nothing)"}`
          );
        }
        outcome = value;
        break;
      }
      case "--resend-id":
        resendId = argv[++i] ?? null;
        break;
      case "--subject":
        subject = argv[++i] ?? null;
        break;
      case "--reason":
        reason = argv[++i] ?? null;
        break;
      case "--by-email":
        byEmail = argv[++i] ?? null;
        break;
      case "--dry-run":
        dryRun = true;
        break;
      case "--force":
        force = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}\n${USAGE}`);
    }
  }

  if (id === null) throw new Error(`--id is required.\n${USAGE}`);
  if (outcome === null) throw new Error(`--outcome is required.\n${USAGE}`);

  if (outcome === "replied") {
    if (!resendId) throw new Error(`--outcome replied requires --resend-id.\n${USAGE}`);
    if (!subject) throw new Error(`--outcome replied requires --subject.\n${USAGE}`);
  } else if (!reason) {
    throw new Error(`--outcome no-reply-needed requires --reason.\n${USAGE}`);
  }

  return { id, outcome, resendId, subject, reason, byEmail, dryRun, force };
}

/**
 * Appends one audit line to existing notes without destroying them.
 *
 * @param existing Current `review_notes`, possibly null.
 * @param line The line to append.
 * @returns The full new value for the column.
 */
function appendNote(existing: string | null, line: string): string {
  const base = (existing ?? "").trimEnd();
  return base.length === 0 ? line : `${base}\n${line}`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // ---------- load the target row ----------

  const rows = await db
    .select({
      id: contactFormSubmissions.id,
      fullName: contactFormSubmissions.fullName,
      email: contactFormSubmissions.email,
      status: contactFormSubmissions.status,
      submittedAt: contactFormSubmissions.submittedAt,
      reviewedAt: contactFormSubmissions.reviewedAt,
      reviewedBy: contactFormSubmissions.reviewedBy,
      reviewNotes: contactFormSubmissions.reviewNotes,
    })
    .from(contactFormSubmissions)
    .where(eq(contactFormSubmissions.id, args.id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new Error(
      `No contact_form_submissions row with id=${args.id}. ` +
        "Run `npx tsx scripts/email/audience-report.ts` or the inbox reconcile step to list open ids."
    );
  }

  // ---------- idempotency guard ----------

  if (row.reviewedAt !== null && !args.force) {
    console.error(
      `ERROR: contact #${args.id} was already reviewed at ${row.reviewedAt.toISOString()} ` +
        `(status=${row.status}). Refusing to overwrite.`
    );
    console.error("Existing review_notes:");
    console.error(row.reviewNotes ? `  ${row.reviewNotes.split("\n").join("\n  ")}` : "  (empty)");
    console.error("Re-run with --force if you really mean to append another line.");
    await client.end();
    process.exit(1);
  }

  // ---------- resolve reviewed_by ----------

  let reviewedBy: number | null = row.reviewedBy;
  if (args.byEmail) {
    const admins = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, args.byEmail))
      .limit(1);
    if (admins[0]) {
      reviewedBy = admins[0].id;
    } else {
      // Never fail the close-out over an unmatched admin address — the audit
      // line in review_notes is the record that matters.
      console.warn(
        `WARNING: no users row with email=${args.byEmail}; leaving reviewed_by as ` +
          `${reviewedBy ?? "null"}.`
      );
    }
  }

  // ---------- compose the update ----------

  const now = new Date();
  const stamp = now.toISOString();
  const status = args.outcome === "replied" ? "approved" : "rejected";
  const noteLine =
    args.outcome === "replied"
      ? `Replied ${stamp} · resend=${args.resendId} · subject="${args.subject}"`
      : `No reply needed ${stamp} · ${args.reason}`;
  const reviewNotes = appendNote(row.reviewNotes, noteLine);

  console.log("");
  console.log(`Contact #${row.id} — ${row.fullName} <${row.email}>`);
  console.log(`  submitted:   ${row.submittedAt.toISOString()}`);
  console.log(`  outcome:     ${args.outcome}`);
  console.log("");
  console.log("UPDATE contact_form_submissions SET");
  console.log(`  reviewed_at  = ${stamp}            (was ${row.reviewedAt?.toISOString() ?? "null"})`);
  console.log(`  status       = ${status}${" ".repeat(Math.max(0, 12 - status.length))}(was ${row.status})`);
  console.log(`  reviewed_by  = ${reviewedBy ?? "null"}${" ".repeat(4)}(was ${row.reviewedBy ?? "null"})`);
  console.log(`  review_notes =`);
  console.log(reviewNotes.split("\n").map((line) => `    ${line}`).join("\n"));
  console.log(`WHERE id = ${row.id};`);
  console.log("");

  if (args.dryRun) {
    console.log("DRY RUN — nothing was written.");
    console.log("");
    await client.end();
    return;
  }

  await db
    .update(contactFormSubmissions)
    .set({
      reviewedAt: now,
      status,
      reviewedBy,
      reviewNotes,
    })
    .where(eq(contactFormSubmissions.id, row.id));

  console.log(`Done — contact #${row.id} closed as "${args.outcome}" (status=${status}).`);
  console.log("Next: re-run the inbox reconcile step to see what is still open.");
  console.log("");

  await client.end();
}

void main().catch(async (error: unknown) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  await client.end().catch(() => undefined);
  process.exit(1);
});
