/**
 * Seed Script: Create test mentor and mentee profiles
 *
 * This script creates test profiles for AI matching testing.
 * It will:
 * 1. Check existing user_roles and create profiles for them
 * 2. If no roles exist, create test mentor/mentee roles and profiles
 *
 * Usage: npx tsx scripts/seed-profiles.ts
 */

import { db } from '../lib/db/drizzle';
import {
  users,
  userRoles,
  mentorProfiles,
  menteeProfiles,
  mentorFormSubmissions,
  menteeFormSubmissions,
} from '../lib/db/schema';
import { eq, and, sql, notExists } from 'drizzle-orm';

async function seedProfiles() {
  console.log('Starting profile seeding...\n');

  try {
    // 1. Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users in database`);

    // 2. Check existing roles
    const existingRoles = await db.select().from(userRoles);
    console.log(`Found ${existingRoles.length} existing role assignments`);

    // 3. Check existing profiles
    const [existingMentorProfiles] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mentorProfiles);
    const [existingMenteeProfiles] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(menteeProfiles);

    console.log(`Existing mentor profiles: ${existingMentorProfiles?.count || 0}`);
    console.log(`Existing mentee profiles: ${existingMenteeProfiles?.count || 0}`);

    // If we have users but no roles/profiles, create test data
    if (allUsers.length > 0 && existingRoles.length === 0) {
      console.log('\nNo roles found. Creating test mentor and mentee assignments...');

      // Use first user as mentor, others as mentees
      const [firstUser, ...otherUsers] = allUsers;

      // Create mentor role and profile for first user
      console.log(`\nSetting up ${firstUser.email} as a test mentor...`);

      // Check if role already exists
      const [existingMentorRole] = await db
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, firstUser.id), eq(userRoles.roleType, 'mentor')));

      if (!existingMentorRole) {
        await db.insert(userRoles).values({
          userId: firstUser.id,
          roleType: 'mentor',
          isActive: true,
          activationStep: 3, // Completed
          verifiedAt: new Date(),
        });
        console.log(`  ✓ Created mentor role for ${firstUser.email}`);
      }

      // Create mentor profile
      const [existingMentorProfile] = await db
        .select()
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, firstUser.id));

      if (!existingMentorProfile) {
        await db.insert(mentorProfiles).values({
          userId: firstUser.id,
          expertiseAreas: ['Software Development', 'Career Growth', 'Leadership'],
          yearsExperience: 10,
          company: 'She Sharp',
          jobTitle: 'Senior Software Engineer',
          bio: 'Experienced software engineer passionate about mentoring women in tech.',
          maxMentees: 5,
          currentMenteesCount: 0,
          isAcceptingMentees: true,
          profileCompletedAt: new Date(),
          verifiedAt: new Date(),
          mbtiType: 'INTJ',
        });
        console.log(`  ✓ Created mentor profile for ${firstUser.email}`);
      }

      // Create mentor form submission
      const [existingMentorForm] = await db
        .select()
        .from(mentorFormSubmissions)
        .where(eq(mentorFormSubmissions.userId, firstUser.id));

      if (!existingMentorForm) {
        await db.insert(mentorFormSubmissions).values({
          userId: firstUser.id,
          mbtiType: 'INTJ',
          company: 'She Sharp',
          jobTitle: 'Senior Software Engineer',
          yearsExperience: 10,
          softSkillsExpert: ['Communication', 'Leadership', 'Problem Solving'],
          industrySkillsExpert: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
          softSkillsBasic: ['Project Management', 'Public Speaking'],
          industrySkillsBasic: ['Python', 'AWS'],
          expectedMenteeGoalsLongTerm: 'Career advancement in tech industry',
          expectedMenteeGoalsShortTerm: 'Improve technical skills and confidence',
          preferredMenteeTypes: ['Career Changer', 'Junior Developer', 'Student'],
          preferredIndustries: ['Technology', 'Software Development'],
          city: 'Auckland',
          preferredMeetingFormat: 'both',
        });
        console.log(`  ✓ Created mentor form submission for ${firstUser.email}`);
      }

      // Create mentee roles and profiles for other users
      for (const user of otherUsers) {
        console.log(`\nSetting up ${user.email} as a test mentee...`);

        // Create mentee role
        const [existingMenteeRole] = await db
          .select()
          .from(userRoles)
          .where(and(eq(userRoles.userId, user.id), eq(userRoles.roleType, 'mentee')));

        if (!existingMenteeRole) {
          await db.insert(userRoles).values({
            userId: user.id,
            roleType: 'mentee',
            isActive: true,
            activationStep: 3, // Completed
          });
          console.log(`  ✓ Created mentee role for ${user.email}`);
        }

        // Create mentee profile
        const [existingMenteeProfile] = await db
          .select()
          .from(menteeProfiles)
          .where(eq(menteeProfiles.userId, user.id));

        if (!existingMenteeProfile) {
          await db.insert(menteeProfiles).values({
            userId: user.id,
            learningGoals: ['Improve coding skills', 'Build professional network', 'Career guidance'],
            careerStage: 'early_career',
            preferredExpertiseAreas: ['Software Development', 'Career Growth'],
            preferredMeetingFrequency: 'biweekly',
            bio: 'Aspiring software developer looking for mentorship.',
            currentChallenge: 'Breaking into the tech industry',
            profileCompletedAt: new Date(),
            mbtiType: 'ENFP',
          });
          console.log(`  ✓ Created mentee profile for ${user.email}`);
        }

        // Create mentee form submission
        const [existingMenteeForm] = await db
          .select()
          .from(menteeFormSubmissions)
          .where(eq(menteeFormSubmissions.userId, user.id));

        if (!existingMenteeForm) {
          await db.insert(menteeFormSubmissions).values({
            userId: user.id,
            mbtiType: 'ENFP',
            currentStage: 'early_career',
            currentJobTitle: 'Junior Developer',
            currentIndustry: 'Technology',
            softSkillsBasic: ['Communication', 'Time Management'],
            industrySkillsBasic: ['JavaScript', 'HTML', 'CSS'],
            softSkillsExpert: [],
            industrySkillsExpert: [],
            longTermGoals: 'Become a senior software engineer',
            shortTermGoals: 'Build a portfolio and learn React',
            whyMentor: 'Looking for guidance from experienced professionals',
            preferredIndustries: ['Technology', 'Software Development'],
            city: 'Auckland',
            preferredMeetingFormat: 'both',
          });
          console.log(`  ✓ Created mentee form submission for ${user.email}`);
        }
      }
    } else if (existingRoles.length > 0) {
      // Migrate existing roles to profiles
      console.log('\nMigrating existing roles to profiles...');

      // Get mentors without profiles
      const mentorsToMigrate = await db
        .select({
          userId: userRoles.userId,
          email: users.email,
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

      for (const mentor of mentorsToMigrate) {
        await db.insert(mentorProfiles).values({
          userId: mentor.userId,
          maxMentees: 3,
          currentMenteesCount: 0,
          isAcceptingMentees: true,
        });
        console.log(`  ✓ Created mentor profile for ${mentor.email}`);
      }

      // Get mentees without profiles
      const menteesToMigrate = await db
        .select({
          userId: userRoles.userId,
          email: users.email,
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

      for (const mentee of menteesToMigrate) {
        await db.insert(menteeProfiles).values({
          userId: mentee.userId,
        });
        console.log(`  ✓ Created mentee profile for ${mentee.email}`);
      }
    }

    // Final summary
    console.log('\n--- Final Summary ---');
    const [finalMentorCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mentorProfiles);
    const [finalMenteeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(menteeProfiles);
    const [finalRoleCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userRoles);

    console.log(`Total user roles: ${finalRoleCount?.count || 0}`);
    console.log(`Total mentor profiles: ${finalMentorCount?.count || 0}`);
    console.log(`Total mentee profiles: ${finalMenteeCount?.count || 0}`);
    console.log('\nSeeding completed successfully!');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedProfiles();
