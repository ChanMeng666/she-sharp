/**
 * Send Mentor Reminder Emails Script
 *
 * Sends reminder emails to approved mentors who haven't completed registration.
 * Extends expired invitation codes by 14 days.
 *
 * All unregistered mentors receive reminders because the old deployment URL
 * (she-sharp.vercel.app) has been deleted — original email links are broken.
 *
 * Usage:
 *   BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-mentor-reminder.ts --dry-run
 *   BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-mentor-reminder.ts --test user@example.com
 *   BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-mentor-reminder.ts
 */

import 'dotenv/config';

// ---------- parse args ----------

const isDryRun = process.argv.includes('--dry-run');
const testIdx = process.argv.indexOf('--test');
const testEmail = testIdx !== -1 ? process.argv[testIdx + 1] : null;
const isTestMode = testIdx !== -1;

if (isTestMode && (!testEmail || !testEmail.includes('@'))) {
  console.error('ERROR: --test requires a valid email address.');
  console.error('Usage: BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-mentor-reminder.ts --test user@example.com');
  process.exit(1);
}

// ---------- validate env ----------

const baseUrl = process.env.BASE_URL;

if (!baseUrl || baseUrl.includes('localhost')) {
  console.error('ERROR: BASE_URL must be set to the production URL.');
  console.error('Usage: BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-mentor-reminder.ts');
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  if (isDryRun) {
    console.warn('WARNING: RESEND_API_KEY is not set (OK for dry-run).');
  } else {
    console.error('ERROR: RESEND_API_KEY is not set. Add it to .env or .env.local');
    process.exit(1);
  }
}

// Force production mode so sendEmail uses Resend, not console logging
process.env.NODE_ENV = 'production';

// ---------- imports (after env setup) ----------

import { db } from '../lib/db/drizzle';
import { invitationCodes, mentorFormSubmissions } from '../lib/db/schema';
import { sendMentorReminderEmail } from '../lib/email/service';
import { eq, and, isNull, ne, not } from 'drizzle-orm';

// ---------- helpers ----------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- main ----------

async function main() {
  const mode = isDryRun ? 'DRY RUN' : isTestMode ? `TEST (→ ${testEmail})` : 'LIVE';

  console.log('\nMentor Reminder Email Script');
  console.log('===================================');
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Mode:     ${mode}`);
  console.log('===================================\n');

  // Find all unregistered approved mentors with invitation codes
  const results = await db
    .select({
      formId: mentorFormSubmissions.id,
      email: mentorFormSubmissions.email,
      fullName: mentorFormSubmissions.fullName,
      codeId: invitationCodes.id,
      code: invitationCodes.code,
      codeStatus: invitationCodes.status,
      expiresAt: invitationCodes.expiresAt,
      currentUses: invitationCodes.currentUses,
      codeCreatedAt: invitationCodes.createdAt,
    })
    .from(mentorFormSubmissions)
    .innerJoin(
      invitationCodes,
      and(
        eq(invitationCodes.linkedFormId, mentorFormSubmissions.id),
        eq(invitationCodes.codeType, 'mentor_approved'),
        eq(invitationCodes.linkedFormType, 'mentor')
      )
    )
    .where(
      and(
        eq(mentorFormSubmissions.status, 'approved'),
        isNull(mentorFormSubmissions.userId),
        not(eq(invitationCodes.status, 'revoked'))
      )
    );

  if (results.length === 0) {
    console.log('No unregistered approved mentors found.');
    process.exit(0);
  }

  // Deduplicate by email — keep the most recently created code
  const byEmail = new Map<string, typeof results[0]>();
  for (const row of results) {
    if (!row.email) continue;
    const existing = byEmail.get(row.email);
    if (!existing || (row.codeCreatedAt && existing.codeCreatedAt && row.codeCreatedAt > existing.codeCreatedAt)) {
      byEmail.set(row.email, row);
    }
  }

  const mentors = Array.from(byEmail.values());
  console.log(`Found ${mentors.length} unregistered approved mentors:\n`);

  // In test mode, use the first mentor's data but send to the test email
  if (isTestMode) {
    const sample = mentors[0];
    console.log(`Sending test email to ${testEmail} using sample data:`);
    console.log(`  Name: ${sample.fullName || '(no name)'}`);
    console.log(`  Code: ${sample.code}`);
    console.log(`  Expires: ${sample.expiresAt?.toISOString() || 'never'}`);
    console.log(`  URL: ${baseUrl}/sign-up?code=${sample.code}\n`);

    const effectiveExpiry = sample.expiresAt && sample.expiresAt < new Date()
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      : sample.expiresAt;

    try {
      await sendMentorReminderEmail(testEmail!, {
        invitationCode: sample.code,
        expiresAt: effectiveExpiry || undefined,
        mentorName: sample.fullName || undefined,
      });
      console.log('Test email sent successfully! Check your inbox.\n');
    } catch (error) {
      console.error(`Failed to send test email: ${error}\n`);
    }
    process.exit(0);
  }

  let sent = 0;
  let skipped = 0;
  let extended = 0;
  let failed = 0;

  for (const mentor of mentors) {
    const email = mentor.email!;

    // Skip already-used codes
    if (mentor.currentUses && mentor.currentUses > 0) {
      console.log(`  SKIP (code used): ${email}`);
      skipped++;
      continue;
    }

    // Check if code needs expiration extension
    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const isExpiredOrSoon = mentor.expiresAt && mentor.expiresAt < tomorrow;
    let effectiveExpiry = mentor.expiresAt;

    if (isExpiredOrSoon) {
      const newExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const status = mentor.expiresAt! < now ? 'EXPIRED' : 'EXPIRING SOON';

      console.log(`  ${isDryRun ? '[DRY RUN] ' : ''}${email}`);
      console.log(`    Name: ${mentor.fullName || '(no name)'}`);
      console.log(`    Code: ${mentor.code}`);
      console.log(`    Expiry: ${mentor.expiresAt!.toISOString()} (${status} → extend to ${newExpiry.toISOString()})`);

      if (!isDryRun) {
        await db
          .update(invitationCodes)
          .set({
            expiresAt: newExpiry,
            status: 'active',
            updatedAt: now,
          })
          .where(eq(invitationCodes.id, mentor.codeId));
        extended++;
      }
      effectiveExpiry = newExpiry;
    } else {
      console.log(`  ${isDryRun ? '[DRY RUN] ' : ''}${email}`);
      console.log(`    Name: ${mentor.fullName || '(no name)'}`);
      console.log(`    Code: ${mentor.code}`);
      console.log(`    Expiry: ${mentor.expiresAt?.toISOString() || 'never'} (still valid)`);
    }

    console.log(`    URL: ${baseUrl}/sign-up?code=${mentor.code}`);

    if (!isDryRun) {
      try {
        await sendMentorReminderEmail(email, {
          invitationCode: mentor.code,
          expiresAt: effectiveExpiry || undefined,
          mentorName: mentor.fullName || undefined,
        });
        sent++;
        console.log(`    Status: SENT\n`);
      } catch (error) {
        failed++;
        console.error(`    Status: FAILED - ${error}\n`);
      }
      await sleep(500);
    } else {
      sent++;
      console.log('');
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Total unregistered mentors: ${mentors.length}`);
  console.log(`  Codes extended: ${isDryRun ? '(dry run)' : extended}`);
  console.log(`  ${isDryRun ? 'Would send' : 'Sent'}: ${sent}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Skipped: ${skipped}`);

  if (isDryRun) {
    console.log('\nThis was a dry run. Use --test <email> to preview, or remove flags to send.\n');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
