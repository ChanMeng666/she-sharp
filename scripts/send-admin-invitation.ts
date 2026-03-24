/**
 * Send Admin Invitation Email Script
 *
 * Creates an admin invitation code and sends it to the specified email.
 * This script is developer-only and must be run from the local project directory.
 *
 * Usage:
 *   BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-admin-invitation.ts <email> [--dry-run]
 *
 * Examples:
 *   BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-admin-invitation.ts admin@example.com --dry-run
 *   BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-admin-invitation.ts admin@example.com
 */

import 'dotenv/config';

// ---------- validate inputs ----------

const targetEmail = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');

if (!targetEmail || !targetEmail.includes('@')) {
  console.error('\nUsage: BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-admin-invitation.ts <email> [--dry-run]\n');
  process.exit(1);
}

const baseUrl = process.env.BASE_URL;
if (!baseUrl || baseUrl.includes('localhost')) {
  console.error('ERROR: BASE_URL must be set to the production URL.');
  console.error('Usage: BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-admin-invitation.ts <email>');
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error('ERROR: RESEND_API_KEY is not set. Add it to .env or .env.local');
  process.exit(1);
}

// Force NODE_ENV to production so sendEmail uses Resend instead of console logging
process.env.NODE_ENV = 'production';

// ---------- imports (after env setup) ----------

import { db } from '../lib/db/drizzle';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { createAdminCode } from '../lib/invitations/service';
import { sendInvitationCodeEmail } from '../lib/email/service';

// ---------- main ----------

async function main() {
  console.log('\nAdmin Invitation Script');
  console.log('===================================');
  console.log(`  Target email: ${targetEmail}`);
  console.log(`  Base URL:     ${baseUrl}`);
  console.log(`  Mode:         ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('===================================\n');

  // Check if user already exists
  const [existingUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, targetEmail))
    .limit(1);

  if (existingUser) {
    console.warn(`WARNING: User ${targetEmail} already has an account (id: ${existingUser.id}).`);
    console.warn('Consider using "npx tsx scripts/create-admin.ts" to directly assign admin role instead.\n');
  }

  // Find an admin user to use as the creator (use the first admin, or user id 1)
  const adminUserId = 1;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  if (isDryRun) {
    console.log('[DRY RUN] Would create admin invitation code:');
    console.log(`  Recipient:  ${targetEmail}`);
    console.log(`  Role:       admin`);
    console.log(`  Expires:    ${expiresAt.toISOString()}`);
    console.log(`  Email URL:  ${baseUrl}/sign-up?code=<generated-code>`);
    console.log('\nRemove --dry-run to actually create and send.\n');
    process.exit(0);
  }

  // Create invitation code with admin target role
  const code = await createAdminCode(adminUserId, {
    maxUses: 1,
    expiresAt,
    recipientEmail: targetEmail,
    notes: `Admin invitation for ${targetEmail}`,
    targetRole: 'admin',
  });

  console.log(`Created invitation code: ${code.code}`);
  console.log(`  Sign-up URL: ${baseUrl}/sign-up?code=${code.code}`);
  console.log(`  Expires:     ${expiresAt.toISOString()}\n`);

  // Send email
  console.log(`Sending invitation email to ${targetEmail} ...`);

  const sent = await sendInvitationCodeEmail(targetEmail, {
    invitationCode: code.code,
    codeType: 'admin_generated',
    expiresAt,
  });

  if (sent) {
    console.log('Email sent successfully!\n');
  } else {
    console.error('Failed to send email.\n');
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
