import { db } from '../lib/db/drizzle';
import { sql } from 'drizzle-orm';

async function cleanupTestUsers() {
  const adminEmail = 'admin@shesharp.co.nz';

  console.log('Starting cleanup of test users...');
  console.log(`Preserving admin account: ${adminEmail}`);

  try {
    // Get admin user ID first
    const adminResult = await db.execute(sql`
      SELECT id FROM users WHERE email = ${adminEmail}
    `);
    const adminId = (adminResult as any)[0]?.id;

    if (!adminId) {
      console.log('⚠️ Admin user not found! Will preserve no users.');
    } else {
      console.log(`Admin user ID: ${adminId}`);
    }

    // Simple approach: Delete tables that only contain test data
    // For tables with FK constraints, we need to be careful about order

    console.log('\nDeleting related data in dependency order...\n');

    // Clear all form submissions (these are test data)
    console.log('1. Clearing mentee_form_submissions...');
    await db.execute(sql`DELETE FROM mentee_form_submissions`);

    console.log('2. Clearing mentor_form_submissions...');
    await db.execute(sql`DELETE FROM mentor_form_submissions`);

    // Clear invitation codes and usages
    console.log('3. Clearing invitation_code_usages...');
    await db.execute(sql`DELETE FROM invitation_code_usages`);

    console.log('4. Clearing invitation_codes...');
    await db.execute(sql`DELETE FROM invitation_codes`);

    // Clear membership purchases
    console.log('5. Clearing membership_purchases...');
    await db.execute(sql`DELETE FROM membership_purchases`);

    // Clear user memberships
    console.log('6. Clearing user_memberships...');
    await db.execute(sql`DELETE FROM user_memberships`);

    // Clear meetings and mentorship relationships
    console.log('7. Clearing meetings...');
    await db.execute(sql`DELETE FROM meetings`);

    console.log('8. Clearing ai_match_results...');
    await db.execute(sql`DELETE FROM ai_match_results`);

    console.log('9. Clearing ai_matching_runs...');
    await db.execute(sql`DELETE FROM ai_matching_runs`);

    console.log('10. Clearing mentorship_relationships...');
    await db.execute(sql`DELETE FROM mentorship_relationships`);

    // Clear profiles
    console.log('11. Clearing mentee_profiles...');
    await db.execute(sql`DELETE FROM mentee_profiles`);

    console.log('12. Clearing mentor_profiles...');
    await db.execute(sql`DELETE FROM mentor_profiles`);

    // Clear user stats and points
    console.log('13. Clearing user_mentorship_stats...');
    await db.execute(sql`DELETE FROM user_mentorship_stats`);

    console.log('14. Clearing points_transactions...');
    await db.execute(sql`DELETE FROM points_transactions`);

    console.log('15. Clearing user_points...');
    await db.execute(sql`DELETE FROM user_points`);

    console.log('16. Clearing user_milestones...');
    await db.execute(sql`DELETE FROM user_milestones`);

    console.log('17. Clearing reward_redemptions...');
    await db.execute(sql`DELETE FROM reward_redemptions`);

    // Clear event related
    console.log('18. Clearing event_registrations...');
    await db.execute(sql`DELETE FROM event_registrations`);

    console.log('19. Clearing event_role_assignments...');
    await db.execute(sql`DELETE FROM event_role_assignments`);

    console.log('20. Clearing resource_access_logs...');
    await db.execute(sql`DELETE FROM resource_access_logs`);

    // Clear auth related
    console.log('21. Clearing session...');
    await db.execute(sql`DELETE FROM session`);

    console.log('22. Clearing account...');
    await db.execute(sql`DELETE FROM account`);

    console.log('23. Clearing email_verifications...');
    await db.execute(sql`DELETE FROM email_verifications`);

    console.log('24. Clearing password_resets...');
    await db.execute(sql`DELETE FROM password_resets`);

    console.log('25. Clearing password_history...');
    await db.execute(sql`DELETE FROM password_history`);

    // Clear activity logs
    console.log('26. Clearing activity_logs...');
    await db.execute(sql`DELETE FROM activity_logs`);

    // Clear admin permissions for non-admin users
    console.log('27. Clearing admin_permissions...');
    if (adminId) {
      await db.execute(sql`DELETE FROM admin_permissions WHERE user_id != ${adminId}`);
    } else {
      await db.execute(sql`DELETE FROM admin_permissions`);
    }

    // Clear user roles for non-admin users
    console.log('28. Clearing user_roles for non-admin users...');
    if (adminId) {
      await db.execute(sql`DELETE FROM user_roles WHERE user_id != ${adminId}`);
    } else {
      await db.execute(sql`DELETE FROM user_roles`);
    }

    // Clear team members
    console.log('29. Clearing team_members...');
    await db.execute(sql`DELETE FROM team_members`);

    // Finally delete the users (except admin)
    console.log('30. Deleting test users...');
    let deleteResult;
    if (adminId) {
      deleteResult = await db.execute(sql`
        DELETE FROM users WHERE id != ${adminId} RETURNING email
      `);
    } else {
      deleteResult = await db.execute(sql`
        DELETE FROM users RETURNING email
      `);
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`Deleted ${(deleteResult as any[]).length} test user(s)`);

    // Show remaining users
    const remaining = await db.execute(sql`SELECT id, email, name FROM users`);
    console.log('\nRemaining users:');
    if ((remaining as any[]).length === 0) {
      console.log('  (no users remaining)');
    } else {
      (remaining as any[]).forEach((user: any) => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }

  process.exit(0);
}

cleanupTestUsers();
