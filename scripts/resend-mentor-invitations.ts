/**
 * Resend Mentor Invitation Emails Script
 *
 * Re-sends invitation emails for mentors whose original emails
 * contained incorrect (localhost) URLs.
 *
 * Usage:
 *   BASE_URL=https://she-sharp.vercel.app npx tsx scripts/resend-mentor-invitations.ts --dry-run
 *   BASE_URL=https://she-sharp.vercel.app npx tsx scripts/resend-mentor-invitations.ts
 */

import { db } from '../lib/db/drizzle';
import {
  invitationCodes,
  mentorFormSubmissions,
} from '../lib/db/schema';
import { sendInvitationCodeEmail } from '../lib/email/service';
import { eq, and } from 'drizzle-orm';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl || baseUrl.includes('localhost')) {
    console.error('ERROR: BASE_URL must be set to the production URL.');
    console.error('Usage: BASE_URL=https://she-sharp.vercel.app npx tsx scripts/resend-mentor-invitations.ts');
    process.exit(1);
  }

  console.log(`\nBase URL: ${baseUrl}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Find unused mentor_approved invitation codes
  const codes = await db
    .select({
      id: invitationCodes.id,
      code: invitationCodes.code,
      generatedFor: invitationCodes.generatedFor,
      expiresAt: invitationCodes.expiresAt,
      linkedFormId: invitationCodes.linkedFormId,
      currentUses: invitationCodes.currentUses,
    })
    .from(invitationCodes)
    .where(
      and(
        eq(invitationCodes.codeType, 'mentor_approved'),
        eq(invitationCodes.status, 'active'),
        eq(invitationCodes.currentUses, 0)
      )
    );

  if (codes.length === 0) {
    console.log('No unused mentor invitation codes found.');
    process.exit(0);
  }

  console.log(`Found ${codes.length} unused mentor invitation codes:\n`);

  let sent = 0;
  let skipped = 0;

  for (const code of codes) {
    const email = code.generatedFor;
    if (!email) {
      console.log(`  SKIP: Code ${code.code} has no generatedFor email`);
      skipped++;
      continue;
    }

    const signUpUrl = `${baseUrl}/sign-up?code=${code.code}`;
    console.log(`  ${isDryRun ? '[DRY RUN] ' : ''}${email}`);
    console.log(`    Code: ${code.code}`);
    console.log(`    URL: ${signUpUrl}`);
    console.log(`    Expires: ${code.expiresAt?.toISOString() || 'never'}`);

    if (!isDryRun) {
      try {
        await sendInvitationCodeEmail(email, {
          invitationCode: code.code,
          codeType: 'mentor_approved',
          expiresAt: code.expiresAt || undefined,
        });
        sent++;
        console.log(`    Status: SENT\n`);
      } catch (error) {
        console.error(`    Status: FAILED - ${error}\n`);
      }
    } else {
      sent++;
      console.log('');
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Total codes found: ${codes.length}`);
  console.log(`  ${isDryRun ? 'Would send' : 'Sent'}: ${sent}`);
  console.log(`  Skipped: ${skipped}`);

  if (isDryRun) {
    console.log('\nThis was a dry run. Remove --dry-run to actually send emails.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
