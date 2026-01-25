/**
 * Database Clear All Data Script
 *
 * This script clears ALL data from the database without creating any new records.
 * Use this when you need to reset the database to a clean state.
 *
 * Run with: npx tsx scripts/clear-all-data.ts
 */

import { db } from '../lib/db/drizzle';
import { sql } from 'drizzle-orm';

/**
 * All tables in the database that need to be cleared.
 * Listed in dependency order (child tables first, parent tables last).
 */
const ALL_TABLES = [
  // AI Matching
  'ai_match_results',
  'ai_matching_runs',
  'mentee_waiting_queue',

  // Points & Gamification
  'reward_redemptions',
  'user_milestones',
  'points_transactions',
  'user_points',
  'rewards',
  'milestones',
  'points_rules',
  'experience_levels',

  // Meetings & Relationships
  'meetings',
  'mentorship_relationships',

  // Events
  'event_role_assignments',
  'event_registrations',
  'events',

  // Resources
  'resource_access_logs',
  'resources',

  // Form Submissions
  'mentor_form_submissions',
  'mentee_form_submissions',

  // Profiles
  'mentor_profiles',
  'mentee_profiles',

  // Invitation System
  'invitation_code_usages',
  'invitation_codes',

  // Membership
  'membership_purchases',
  'membership_benefits',
  'membership_features',
  'user_memberships',

  // User Statistics
  'user_mentorship_stats',

  // Notifications
  'notifications',

  // Activity Logs
  'activity_logs',

  // Authentication
  'password_history',
  'password_resets',
  'email_verifications',
  'verification_token',
  'session',
  'account',

  // Admin
  'admin_permissions',

  // User Roles
  'user_roles',

  // Configuration tables
  'skill_options',
  'industry_options',

  // Legacy tables
  'invitations',
  'team_members',
  'teams',

  // Core user table (last, as many tables reference it)
  'users',
];

async function clearAllData() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ⚠️   WARNING: DATABASE CLEAR ALL DATA SCRIPT   ⚠️');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\nThis script will DELETE ALL DATA from the database including:');
  console.log('  • All user accounts (including admin accounts)');
  console.log('  • All mentor and mentee profiles');
  console.log('  • All mentorship relationships and meetings');
  console.log('  • All events and registrations');
  console.log('  • All form submissions');
  console.log('  • All AI matching results');
  console.log('  • All points and rewards data');
  console.log('  • All other application data');
  console.log('\nDatabase structure (tables) will remain intact.');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('🗑️  Starting database clear operation...\n');

  // Use TRUNCATE with CASCADE to efficiently clear all tables
  // This handles foreign key constraints automatically
  try {
    // Build a single TRUNCATE command for all tables
    // This is more efficient and handles all constraints at once
    const tableList = ALL_TABLES.map((t) => `"${t}"`).join(', ');
    const truncateQuery = `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`;

    console.log('📋 Executing TRUNCATE CASCADE on all tables...');
    await db.execute(sql.raw(truncateQuery));
    console.log('✅ All tables truncated successfully!\n');
  } catch (error: unknown) {
    // If batch truncate fails, fall back to individual deletes
    console.log('⚠️  Batch truncate failed, falling back to individual table clears...\n');

    let successCount = 0;
    let skipCount = 0;

    for (const tableName of ALL_TABLES) {
      try {
        await db.execute(sql.raw(`DELETE FROM "${tableName}"`));
        console.log(`  ✓ Cleared: ${tableName}`);
        successCount++;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        // Skip tables that don't exist or have other issues
        console.log(`  ⚠ Skipped: ${tableName} (${errorMessage})`);
        skipCount++;
      }
    }

    console.log(`\n📊 Summary: ${successCount} tables cleared, ${skipCount} tables skipped`);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✅ DATABASE CLEAR COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n📝 Next steps:');
  console.log('  1. Manually delete files from Cloudinary storage if needed');
  console.log('  2. Create a new admin account when ready');
  console.log('  3. Run: npx tsx scripts/reset-db-and-create-admin.ts');
  console.log('     (if you want to create a default admin account)\n');
}

async function main() {
  try {
    await clearAllData();
  } catch (error) {
    console.error('\n❌ Error during database clear:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
