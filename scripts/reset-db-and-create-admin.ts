/**
 * Database Reset and Admin Creation Script
 *
 * This script clears all data from the database and creates an initial admin user.
 * Run with: npx tsx scripts/reset-db-and-create-admin.ts
 */

import { db } from '../lib/db/drizzle';
import {
  users,
  userRoles,
  userMemberships,
  teams,
  teamMembers,
  activityLogs,
  mentorProfiles,
  menteeProfiles,
  mentorshipRelationships,
  meetings,
  events,
  eventRegistrations,
  resources,
  resourceAccessLogs,
  notifications,
  notificationPreferences,
  invitationCodes,
  invitationCodeUsages,
  membershipPurchases,
  mentorFormSubmissions,
  menteeFormSubmissions,
  passwordResets,
  passwordHistory,
  emailVerifications,
  failedLoginAttempts,
} from '../lib/db/schema';
import { hashPassword } from '../lib/auth/session';
import { sql } from 'drizzle-orm';

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
    'notification_preferences',
    'notifications',
    'invitation_code_usages',
    'password_history',
    'password_resets',
    'email_verifications',
    'failed_login_attempts',
    // Then parent tables
    'mentor_form_submissions',
    'mentee_form_submissions',
    'mentor_profiles',
    'mentee_profiles',
    'membership_purchases',
    'invitation_codes',
    'resources',
    'events',
    'team_members',
    'user_memberships',
    'user_roles',
    'teams',
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

  const adminEmail = 'admin@shesharp.co.nz';
  const adminPassword = 'Admin123!';  // Change this in production!
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

  // Create team for admin
  const [team] = await db.insert(teams).values({
    name: `${adminName}'s Team`,
  }).returning();

  await db.insert(teamMembers).values({
    userId: adminUser.id,
    teamId: team.id,
    role: 'owner',
  });

  console.log(`  ✓ Created team`);

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
