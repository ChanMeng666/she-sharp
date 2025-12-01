/**
 * Migration Script: Populate mentor_profiles and mentee_profiles tables
 *
 * This script creates profile records for users who have mentor/mentee roles
 * but don't yet have corresponding profile entries.
 *
 * Usage: npx tsx scripts/migrate-profiles.ts
 */

import { db } from '../lib/db/drizzle';
import { users, userRoles, mentorProfiles, menteeProfiles } from '../lib/db/schema';
import { eq, and, sql, notExists } from 'drizzle-orm';

async function migrateProfiles() {
  console.log('Starting profile migration...\n');

  try {
    // 1. Get all users with mentor role who don't have a mentor profile
    const mentorsWithoutProfile = await db
      .select({
        userId: userRoles.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(
        and(
          eq(userRoles.roleType, 'mentor'),
          eq(userRoles.isActive, true),
          notExists(
            db.select().from(mentorProfiles).where(eq(mentorProfiles.userId, userRoles.userId))
          )
        )
      );

    console.log(`Found ${mentorsWithoutProfile.length} mentors without profiles`);

    // Create mentor profiles
    for (const mentor of mentorsWithoutProfile) {
      await db.insert(mentorProfiles).values({
        userId: mentor.userId,
        maxMentees: 3,
        currentMenteesCount: 0,
        isAcceptingMentees: true,
      });
      console.log(`  ✓ Created mentor profile for: ${mentor.userName || mentor.userEmail}`);
    }

    // 2. Get all users with mentee role who don't have a mentee profile
    const menteesWithoutProfile = await db
      .select({
        userId: userRoles.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(
        and(
          eq(userRoles.roleType, 'mentee'),
          eq(userRoles.isActive, true),
          notExists(
            db.select().from(menteeProfiles).where(eq(menteeProfiles.userId, userRoles.userId))
          )
        )
      );

    console.log(`\nFound ${menteesWithoutProfile.length} mentees without profiles`);

    // Create mentee profiles
    for (const mentee of menteesWithoutProfile) {
      await db.insert(menteeProfiles).values({
        userId: mentee.userId,
      });
      console.log(`  ✓ Created mentee profile for: ${mentee.userName || mentee.userEmail}`);
    }

    // 3. Summary
    console.log('\n--- Migration Summary ---');

    const [mentorCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mentorProfiles);
    const [menteeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(menteeProfiles);

    console.log(`Total mentor profiles: ${mentorCount?.count || 0}`);
    console.log(`Total mentee profiles: ${menteeCount?.count || 0}`);
    console.log('\nMigration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

migrateProfiles();
