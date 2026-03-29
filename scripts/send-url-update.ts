/**
 * Send URL Update Emails to Registered Mentors
 *
 * Notifies registered mentors that the She Sharp website has moved
 * to a new deployment URL and they should update their bookmarks.
 *
 * Usage:
 *   BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-url-update.ts --dry-run
 *   BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-url-update.ts --test user@example.com
 *   BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-url-update.ts
 */

import 'dotenv/config';

// ---------- parse args ----------

const isDryRun = process.argv.includes('--dry-run');
const testIdx = process.argv.indexOf('--test');
const testEmail = testIdx !== -1 ? process.argv[testIdx + 1] : null;
const isTestMode = testIdx !== -1;

if (isTestMode && (!testEmail || !testEmail.includes('@'))) {
  console.error('ERROR: --test requires a valid email address.');
  console.error('Usage: BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-url-update.ts --test user@example.com');
  process.exit(1);
}

// ---------- validate env ----------

const baseUrl = process.env.BASE_URL;

if (!baseUrl || baseUrl.includes('localhost')) {
  console.error('ERROR: BASE_URL must be set to the production URL.');
  console.error('Usage: BASE_URL=https://she-sharp-zeta.vercel.app npx tsx scripts/send-url-update.ts');
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
import { users, userRoles } from '../lib/db/schema';
import { sendUrlUpdateEmail } from '../lib/email/service';
import { eq, and, isNotNull } from 'drizzle-orm';

// ---------- helpers ----------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- main ----------

async function main() {
  const mode = isDryRun ? 'DRY RUN' : isTestMode ? `TEST (→ ${testEmail})` : 'LIVE';

  console.log('\nURL Update Email Script');
  console.log('===================================');
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Mode:     ${mode}`);
  console.log('===================================\n');

  // Find all registered mentors with active roles
  const rawResults = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .innerJoin(
      userRoles,
      eq(userRoles.userId, users.id)
    )
    .where(
      and(
        eq(userRoles.roleType, 'mentor'),
        eq(userRoles.isActive, true),
        isNotNull(users.email)
      )
    );

  // Deduplicate by user ID (in case of multiple role entries)
  const seen = new Set<number>();
  const results = rawResults.filter((r) => {
    if (seen.has(r.userId)) return false;
    seen.add(r.userId);
    return true;
  });

  if (results.length === 0) {
    console.log('No registered mentors found.');
    process.exit(0);
  }

  console.log(`Found ${results.length} registered mentors:\n`);

  // In test mode, send one email to the test address
  if (isTestMode) {
    const sample = results[0];
    console.log(`Sending test email to ${testEmail} using sample data:`);
    console.log(`  Name: ${sample.name || '(no name)'}`);
    console.log(`  Dashboard URL: ${baseUrl}/dashboard\n`);

    try {
      await sendUrlUpdateEmail(testEmail!, {
        userName: sample.name || undefined,
      });
      console.log('Test email sent successfully! Check your inbox.\n');
    } catch (error) {
      console.error(`Failed to send test email: ${error}\n`);
    }
    process.exit(0);
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of results) {
    if (!user.email) {
      console.log(`  SKIP (no email): userId ${user.userId}`);
      skipped++;
      continue;
    }

    console.log(`  ${isDryRun ? '[DRY RUN] ' : ''}${user.email}`);
    console.log(`    Name: ${user.name || '(no name)'}`);

    if (!isDryRun) {
      try {
        await sendUrlUpdateEmail(user.email, {
          userName: user.name || undefined,
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
  console.log(`  Total registered mentors: ${results.length}`);
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
