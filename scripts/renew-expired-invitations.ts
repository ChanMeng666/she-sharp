/**
 * Renew Expired Invitation Codes & Send Reminder Emails
 *
 * Handles two scenarios:
 * 1. Expired codes: marks old code as expired, generates new 30-day code, sends reminder email
 * 2. Soon-to-expire codes: extends expiry to 30 days from now, sends reminder email
 *
 * Usage:
 *   BASE_URL=https://shesharpnz.vercel.app npx tsx scripts/renew-expired-invitations.ts --dry-run
 *   BASE_URL=https://shesharpnz.vercel.app npx tsx scripts/renew-expired-invitations.ts
 */

import { db } from '../lib/db/drizzle';
import {
  invitationCodes,
  mentorFormSubmissions,
  menteeFormSubmissions,
} from '../lib/db/schema';
import { createInvitationCode, type CreateInvitationCodeParams } from '../lib/invitations/service';
import { sendMentorReminderEmail, sendInvitationCodeEmail } from '../lib/email/service';
import { eq } from 'drizzle-orm';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// --- Configuration: which codes to process ---

interface ExpiredCodeEntry {
  codeId: number;
  email: string;
  fullName: string;
  role: 'mentor' | 'mentee';
  linkedFormId: number;
  programmeId?: number;
}

interface ExtendCodeEntry {
  codeId: number;
  email: string;
  fullName: string;
  role: 'mentor' | 'mentee';
}

// 4 expired codes that need renewal
const expiredCodes: ExpiredCodeEntry[] = [
  { codeId: 6,  email: 'meenavallabh31@gmail.com',   fullName: 'Meena Vallabh',     role: 'mentor', linkedFormId: 6 },
  { codeId: 8,  email: 'yvonne.weidemann@myob.com',   fullName: 'Yvonne Weidemann',  role: 'mentor', linkedFormId: 8 },
  { codeId: 22, email: 'nikkirogers@google.com',       fullName: 'Nikki Rogers',      role: 'mentor', linkedFormId: 22 },
  { codeId: 31, email: 'ruth.norton.nz@gmail.com',     fullName: 'Ruth Norton',       role: 'mentee', linkedFormId: 3, programmeId: 1 },
];

// 1 code that needs expiry extension + reminder
const extendCodes: ExtendCodeEntry[] = [
  { codeId: 33, email: 'ma.tagharobi@gmail.com', fullName: 'Maryam Tagharobi', role: 'mentee' },
];

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl || baseUrl.includes('localhost')) {
    console.error('ERROR: BASE_URL must be set to the production URL.');
    console.error('Usage: BASE_URL=https://shesharpnz.vercel.app npx tsx scripts/renew-expired-invitations.ts');
    process.exit(1);
  }

  console.log(`\nBase URL: ${baseUrl}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const newExpiry = new Date(Date.now() + THIRTY_DAYS_MS);
  let processed = 0;
  let errors = 0;

  // --- Part 1: Renew expired codes ---
  console.log('=== PART 1: Renewing expired codes ===\n');

  for (const entry of expiredCodes) {
    console.log(`  ${entry.fullName} <${entry.email}> (${entry.role})`);
    console.log(`    Old code ID: ${entry.codeId}`);

    if (!isDryRun) {
      try {
        // Step 1: Mark old code as expired
        await db
          .update(invitationCodes)
          .set({ status: 'expired', updatedAt: new Date() })
          .where(eq(invitationCodes.id, entry.codeId));
        console.log(`    Old code marked as expired`);

        // Step 2: Generate new code with 30-day expiry
        const codeType = entry.role === 'mentor' ? 'mentor_approved' : 'mentee_approved';
        const params: CreateInvitationCodeParams = {
          codeType: codeType as 'mentor_approved' | 'mentee_approved',
          maxUses: 1,
          expiresAt: newExpiry,
          generatedBy: 1, // Admin user ID
          generatedFor: entry.email,
          notes: `Renewed code (original code ID ${entry.codeId} expired)`,
          targetRole: entry.role,
          linkedFormId: entry.linkedFormId,
          linkedFormType: entry.role,
          programmeId: entry.programmeId,
        };
        const newCode = await createInvitationCode(params);
        console.log(`    New code: ${newCode.code} (expires: ${newExpiry.toISOString().split('T')[0]})`);

        // Step 3: Send email
        if (entry.role === 'mentor') {
          await sendMentorReminderEmail(entry.email, {
            invitationCode: newCode.code,
            expiresAt: newExpiry,
            mentorName: entry.fullName,
          });
        } else {
          await sendInvitationCodeEmail(entry.email, {
            invitationCode: newCode.code,
            codeType: 'mentee_approved',
            expiresAt: newExpiry,
            message: `Hi ${entry.fullName.split(' ')[0]}, we noticed you haven't completed your registration yet. We've generated a new invitation code for you — it only takes a few minutes to get started!`,
          });
        }
        console.log(`    Email sent successfully\n`);
        processed++;
      } catch (error) {
        console.error(`    ERROR: ${error}\n`);
        errors++;
      }
    } else {
      console.log(`    [DRY RUN] Would expire old code, generate new 30-day code, and send email\n`);
      processed++;
    }
  }

  // --- Part 2: Extend and remind ---
  console.log('=== PART 2: Extending expiry and sending reminders ===\n');

  for (const entry of extendCodes) {
    console.log(`  ${entry.fullName} <${entry.email}> (${entry.role})`);
    console.log(`    Code ID: ${entry.codeId}`);

    if (!isDryRun) {
      try {
        // Step 1: Extend expiry to 30 days from now
        await db
          .update(invitationCodes)
          .set({ expiresAt: newExpiry, updatedAt: new Date() })
          .where(eq(invitationCodes.id, entry.codeId));
        console.log(`    Expiry extended to: ${newExpiry.toISOString().split('T')[0]}`);

        // Step 2: Get the current code string
        const [code] = await db
          .select({ code: invitationCodes.code })
          .from(invitationCodes)
          .where(eq(invitationCodes.id, entry.codeId))
          .limit(1);

        // Step 3: Send reminder email
        await sendInvitationCodeEmail(entry.email, {
          invitationCode: code.code,
          codeType: 'mentee_approved',
          expiresAt: newExpiry,
          message: `Hi ${entry.fullName.split(' ')[0]}, just a friendly reminder that your mentee application has been approved! Please complete your registration soon — your invitation code has been extended for your convenience.`,
        });
        console.log(`    Reminder email sent successfully\n`);
        processed++;
      } catch (error) {
        console.error(`    ERROR: ${error}\n`);
        errors++;
      }
    } else {
      console.log(`    [DRY RUN] Would extend expiry to ${newExpiry.toISOString().split('T')[0]} and send reminder\n`);
      processed++;
    }
  }

  // --- Summary ---
  console.log('=== SUMMARY ===');
  console.log(`  Total: ${expiredCodes.length + extendCodes.length}`);
  console.log(`  ${isDryRun ? 'Would process' : 'Processed'}: ${processed}`);
  console.log(`  Errors: ${errors}`);

  if (isDryRun) {
    console.log('\nThis was a dry run. Remove --dry-run to execute.');
  }

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
