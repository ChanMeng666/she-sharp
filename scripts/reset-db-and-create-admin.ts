/**
 * Database Reset and Admin Creation Script
 *
 * This script clears all data from the database and creates an initial admin user.
 * Dry run by default. To actually wipe and seed:
 *   ADMIN_SEED_PASSWORD=... npx tsx scripts/reset-db-and-create-admin.ts --apply
 * and, against any non-local database, also --confirm-host=<host>.
 *
 * The password used to be the literal 'Admin123!', which meant a successful run
 * against a hosted database left a known-credential admin account on it. It is
 * now required from the environment and never defaulted.
 */

import { db } from '../lib/db/drizzle';
// Only the three tables the admin-creation step inserts into are imported.
// Clearing is done with raw `DELETE FROM "<name>"` against the string list
// below, so importing every table object was dead weight — and two of them
// (`notificationPreferences`, `failedLoginAttempts`) had already been dropped
// from the schema, which is what broke this file's type-check.
import { users, userRoles, userMemberships } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/session';
import { sql } from 'drizzle-orm';
import { authorizeDestructive } from './lib/destructive';

async function resetDatabase() {
  console.log('🗑️  Clearing database tables...');

  // Tables to clear in order (respecting foreign key constraints)
  const tableNames = [
    // Dependent tables first
    'activity_logs',
    'resource_access_logs',
    'event_registrations',
    'meetings',
    'mentorship_relationships',
    'notifications',
    'invitation_code_usages',
    'password_history',
    'password_resets',
    'email_verifications',
    // Then parent tables
    'mentor_form_submissions',
    'mentee_form_submissions',
    'mentor_profiles',
    'mentee_profiles',
    'membership_purchases',
    'invitation_codes',
    'resources',
    'events',
    'user_memberships',
    'user_roles',
    'users',
  ];

  for (const tableName of tableNames) {
    try {
      await db.execute(sql.raw(`DELETE FROM "${tableName}"`));
      console.log(`  ✓ Cleared ${tableName}`);
    } catch (error: any) {
      console.log(`  ⚠ Skipped ${tableName}: ${error.message}`);
    }
  }

  console.log('✅ Database cleared successfully!\n');
}

async function createAdminUser() {
  console.log('👤 Creating admin user...');

  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@shesharp.org.nz';
  // Required, never defaulted: a literal here means every run of this script
  // leaves an account whose password is public knowledge in the repo.
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_SEED_PASSWORD is not set — refusing to seed an admin with a known password.');
  }
  const adminName = 'System Admin';

  // Hash password
  const hashedPassword = await hashPassword(adminPassword);

  // Create user
  const [adminUser] = await db.insert(users).values({
    name: adminName,
    email: adminEmail,
    passwordHash: hashedPassword,
    emailVerified: new Date(),
    emailVerifiedAt: new Date(),
  }).returning();

  console.log(`  ✓ Created user: ${adminEmail}`);

  // Create admin role
  await db.insert(userRoles).values({
    userId: adminUser.id,
    roleType: 'admin',
    isActive: true,
  });

  console.log(`  ✓ Assigned admin role`);

  // Create membership
  await db.insert(userMemberships).values({
    userId: adminUser.id,
    tier: 'premium',
    featuresAccess: {
      maxMentorApplications: true,
      accessBasicResources: true,
      joinFreeEvents: true,
      viewMentorProfiles: true,
      priorityEventAccess: true,
      accessPremiumResources: true,
    },
    eventPriorityAccess: true,
  });

  console.log(`  ✓ Created premium membership`);

  console.log('\n✅ Admin user created successfully!');
  console.log('═══════════════════════════════════════');
  console.log(`📧 Email:    ${adminEmail}`);
  console.log(`🔑 Password: ${adminPassword}`);
  console.log('═══════════════════════════════════════');
  console.log('⚠️  Please change the password after first login!\n');
}

async function main() {
  console.log('\n🚀 Database Reset and Admin Creation Script\n');
  console.log('═══════════════════════════════════════════\n');

  // Checked before the wipe, not inside createAdminUser(): failing this after
  // resetDatabase() has run would leave an empty database with no way in.
  if (!process.env.ADMIN_SEED_PASSWORD) {
    console.error('ADMIN_SEED_PASSWORD is not set — refusing to wipe a database it could not then seed an admin for.');
    process.exit(1);
  }

  if (!authorizeDestructive('clear every table and seed a fresh admin')) return;

  try {
    await resetDatabase();
    await createAdminUser();
    console.log('🎉 All done! You can now log in as admin.\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
