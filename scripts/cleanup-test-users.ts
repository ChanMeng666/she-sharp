/**
 * Test User Cleanup Script
 *
 * Removes all test users (is_test_user = true) and their associated data
 * from the database. Handles FK constraints by deleting dependent records
 * before the user rows.
 *
 * Usage:
 *   npx tsx scripts/cleanup-test-users.ts           # Execute cleanup
 *   npx tsx scripts/cleanup-test-users.ts --dry-run  # Preview only
 */

import { db } from '../lib/db/drizzle';
import { sql } from 'drizzle-orm';

const isDryRun = process.argv.includes('--dry-run');

async function getTestUserIds(): Promise<number[]> {
  const result = await db.execute(sql`
    SELECT id FROM users WHERE is_test_user = true
  `);
  return (result as any[]).map((r: any) => r.id);
}

async function checkCrossTypeRelationships(testUserIds: number[]): Promise<{
  hasCrossType: boolean;
  details: string[];
}> {
  if (testUserIds.length === 0) return { hasCrossType: false, details: [] };

  const idList = testUserIds.join(',');
  const details: string[] = [];

  // Check mentorship relationships where one side is test and the other is real
  const crossRelationships = await db.execute(sql.raw(`
    SELECT mr.id, mr.mentor_user_id, mr.mentee_user_id,
      mentor.is_test_user as mentor_is_test,
      mentee.is_test_user as mentee_is_test
    FROM mentorship_relationships mr
    JOIN users mentor ON mr.mentor_user_id = mentor.id
    JOIN users mentee ON mr.mentee_user_id = mentee.id
    WHERE (mr.mentor_user_id IN (${idList}) OR mr.mentee_user_id IN (${idList}))
      AND (mentor.is_test_user != mentee.is_test_user)
  `));

  if ((crossRelationships as any[]).length > 0) {
    details.push(`  Found ${(crossRelationships as any[]).length} cross-type mentorship relationship(s) (test <-> real user)`);
  }

  // Check events created by test users that have real user registrations
  const crossEvents = await db.execute(sql.raw(`
    SELECT e.id, e.title, COUNT(er.id) as real_registrations
    FROM events e
    JOIN event_registrations er ON er.event_id = e.id
    JOIN users u ON er.user_id = u.id AND u.is_test_user = false
    WHERE e.created_by IN (${idList})
    GROUP BY e.id, e.title
    HAVING COUNT(er.id) > 0
  `));

  if ((crossEvents as any[]).length > 0) {
    for (const event of crossEvents as any[]) {
      details.push(`  Event "${event.title}" (id: ${event.id}) created by test user has ${event.real_registrations} real user registration(s)`);
    }
  }

  return {
    hasCrossType: details.length > 0,
    details,
  };
}

async function deleteCount(tableName: string, query: string): Promise<number> {
  if (isDryRun) {
    const countResult = await db.execute(sql.raw(query.replace(/^DELETE FROM/, 'SELECT COUNT(*) as count FROM')));
    return (countResult as any[])[0]?.count || 0;
  }
  const result = await db.execute(sql.raw(query));
  return (result as any).rowCount || 0;
}

async function setNullCount(tableName: string, query: string): Promise<number> {
  if (isDryRun) {
    // Extract WHERE clause for counting
    const whereMatch = query.match(/WHERE (.+)$/);
    const baseTable = query.match(/UPDATE "?(\w+)"?/)?.[1];
    if (whereMatch && baseTable) {
      const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${baseTable}" WHERE ${whereMatch[1]}`));
      return (countResult as any[])[0]?.count || 0;
    }
    return 0;
  }
  const result = await db.execute(sql.raw(query));
  return (result as any).rowCount || 0;
}

async function cleanupTestUsers() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  if (isDryRun) {
    console.log('  🔍  TEST USER CLEANUP - DRY RUN (no changes will be made)');
  } else {
    console.log('  🧹  TEST USER CLEANUP SCRIPT');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Get all test user IDs
  const testUserIds = await getTestUserIds();

  if (testUserIds.length === 0) {
    console.log('✅ No test users found in the database. Nothing to clean up.\n');
    return;
  }

  console.log(`Found ${testUserIds.length} test user(s): IDs [${testUserIds.join(', ')}]\n`);

  // 2. Check for cross-type relationships
  const { hasCrossType, details } = await checkCrossTypeRelationships(testUserIds);
  if (hasCrossType) {
    console.log('⚠️  WARNING: Cross-type relationships detected:');
    details.forEach(d => console.log(d));
    console.log('');
    if (!isDryRun) {
      console.log('These cross-type records will be included in cleanup.');
      console.log('Events with real user registrations will have created_by set to NULL.\n');
    }
  }

  const idList = testUserIds.join(',');
  const summary: { table: string; count: number; action: string }[] = [];

  // 3. Delete dependent records (tables WITHOUT onDelete cascade)
  console.log(`${isDryRun ? '📋 Would delete' : '🗑️  Deleting'} dependent records...\n`);

  // 3a. Meetings (via relationships involving test users)
  let count = await deleteCount('meetings', `
    DELETE FROM meetings WHERE relationship_id IN (
      SELECT id FROM mentorship_relationships
      WHERE mentor_user_id IN (${idList}) OR mentee_user_id IN (${idList})
    )
  `);
  summary.push({ table: 'meetings', count, action: 'DELETE' });

  // 3b. Mentorship relationships
  count = await deleteCount('mentorship_relationships', `
    DELETE FROM mentorship_relationships
    WHERE mentor_user_id IN (${idList}) OR mentee_user_id IN (${idList})
  `);
  summary.push({ table: 'mentorship_relationships', count, action: 'DELETE' });

  // 3c. AI match results
  count = await deleteCount('ai_match_results', `
    DELETE FROM ai_match_results
    WHERE mentor_user_id IN (${idList}) OR mentee_user_id IN (${idList})
  `);
  summary.push({ table: 'ai_match_results', count, action: 'DELETE' });

  // 3d. AI matching runs
  count = await deleteCount('ai_matching_runs', `
    DELETE FROM ai_matching_runs
    WHERE triggered_by IN (${idList}) OR mentee_user_id IN (${idList})
  `);
  summary.push({ table: 'ai_matching_runs', count, action: 'DELETE' });

  // 3e. Mentor programme assignments
  count = await deleteCount('mentor_programme_assignments', `
    DELETE FROM mentor_programme_assignments
    WHERE mentor_user_id IN (${idList})
  `);
  summary.push({ table: 'mentor_programme_assignments', count, action: 'DELETE' });

  // 3f. Invitation code usages
  count = await deleteCount('invitation_code_usages', `
    DELETE FROM invitation_code_usages
    WHERE used_by_user_id IN (${idList})
  `);
  summary.push({ table: 'invitation_code_usages', count, action: 'DELETE' });

  // 3g. Invitation codes - SET NULL for generated_by
  count = await setNullCount('invitation_codes', `
    UPDATE invitation_codes SET generated_by = NULL
    WHERE generated_by IN (${idList})
  `);
  summary.push({ table: 'invitation_codes', count, action: 'SET NULL (generated_by)' });

  // 3h. Events created by test users - check for real user registrations
  // For events with real registrations: SET NULL on created_by
  // For events with only test user registrations or no registrations: DELETE
  count = await setNullCount('events', `
    UPDATE events SET created_by = (SELECT id FROM users WHERE is_test_user = false LIMIT 1)
    WHERE created_by IN (${idList})
    AND id IN (
      SELECT e.id FROM events e
      JOIN event_registrations er ON er.event_id = e.id
      JOIN users u ON er.user_id = u.id AND u.is_test_user = false
      WHERE e.created_by IN (${idList})
    )
  `);
  summary.push({ table: 'events (with real registrations)', count, action: 'REASSIGN created_by' });

  // Delete events created by test users that have no real registrations
  count = await deleteCount('events (test-only)', `
    DELETE FROM events
    WHERE created_by IN (${idList})
    AND id NOT IN (
      SELECT DISTINCT e.id FROM events e
      JOIN event_registrations er ON er.event_id = e.id
      JOIN users u ON er.user_id = u.id AND u.is_test_user = false
      WHERE e.created_by IN (${idList})
    )
  `);
  summary.push({ table: 'events (test-only)', count, action: 'DELETE' });

  // 3i. Resources - SET NULL for uploaded_by
  count = await setNullCount('resources', `
    UPDATE resources SET uploaded_by = (SELECT id FROM users WHERE is_test_user = false LIMIT 1)
    WHERE uploaded_by IN (${idList})
  `);
  summary.push({ table: 'resources', count, action: 'REASSIGN uploaded_by' });

  // 3j. Activity logs - SET NULL
  count = await setNullCount('activity_logs', `
    UPDATE activity_logs SET user_id = NULL
    WHERE user_id IN (${idList})
  `);
  summary.push({ table: 'activity_logs', count, action: 'SET NULL' });

  // 3k. Volunteer form submissions - SET NULL for reviewer fields
  count = await setNullCount('volunteer_form_submissions', `
    UPDATE volunteer_form_submissions SET reviewed_by = NULL
    WHERE reviewed_by IN (${idList})
  `);
  summary.push({ table: 'volunteer_form_submissions', count, action: 'SET NULL (reviewed_by)' });

  // 3l. Contact form submissions - SET NULL for reviewer
  count = await setNullCount('contact_form_submissions', `
    UPDATE contact_form_submissions SET reviewed_by = NULL
    WHERE reviewed_by IN (${idList})
  `);
  summary.push({ table: 'contact_form_submissions', count, action: 'SET NULL (reviewed_by)' });

  // 4. Delete test users (CASCADE handles: userRoles, userMemberships,
  //    mentorProfiles, menteeProfiles, eventRegistrations, eventRoleAssignments,
  //    resourceAccessLogs, notifications, emailVerifications, passwordResets,
  //    passwordHistory, adminPermissions, mentorFormSubmissions,
  //    menteeFormSubmissions, menteeWaitingQueue)
  console.log(`\n${isDryRun ? '📋 Would delete' : '🗑️  Deleting'} test users (CASCADE handles 15+ dependent tables)...\n`);

  count = await deleteCount('users', `
    DELETE FROM users WHERE is_test_user = true
  `);
  summary.push({ table: 'users (+ cascaded tables)', count, action: 'DELETE CASCADE' });

  // 5. Print summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(isDryRun ? '  📋 DRY RUN SUMMARY' : '  ✅ CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('Table'.padEnd(42) + 'Action'.padEnd(30) + 'Count');
  console.log('─'.repeat(80));
  for (const { table, count: c, action } of summary) {
    if (c > 0) {
      console.log(table.padEnd(42) + action.padEnd(30) + c.toString());
    }
  }
  console.log('─'.repeat(80));

  const totalDeleted = summary.reduce((sum, s) => sum + s.count, 0);
  if (totalDeleted === 0) {
    console.log('\nNo records affected.\n');
  } else {
    console.log(`\nTotal records affected: ${totalDeleted}\n`);
  }

  if (isDryRun) {
    console.log('💡 Run without --dry-run to execute the cleanup.\n');
  } else {
    console.log('📝 Note: Cloudinary photos uploaded by test users need manual cleanup.\n');
  }
}

async function main() {
  try {
    await cleanupTestUsers();
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
  process.exit(0);
}

main();
