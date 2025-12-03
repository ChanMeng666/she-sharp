import { db } from '@/lib/db/drizzle';
import {
  users,
  emailVerifications,
  passwordResets,
  passwordHistory,
  accounts,
  sessions,
  mentorProfiles,
  menteeProfiles,
  mentorFormSubmissions,
  menteeFormSubmissions,
  activityLogs,
  mentorshipRelationships,
  meetings,
  invitationCodes,
  aiMatchResults,
  rewardRedemptions,
  ActivityType,
} from '@/lib/db/schema';
import { eq, or, sql } from 'drizzle-orm';

export interface DeletionResult {
  success: boolean;
  deletedTables: string[];
  anonymizedTables: string[];
  errors: string[];
}

/**
 * Process user account deletion with comprehensive data cleanup.
 * This performs a soft delete with data anonymization for privacy compliance.
 *
 * Data handling strategy:
 * - Immediate delete: Authentication tokens and security data
 * - Anonymize: Personal identifiable information (PII)
 * - Retain anonymized: Activity logs and business records for audit
 */
export async function processUserDeletion(
  userId: number,
  ipAddress?: string
): Promise<DeletionResult> {
  const result: DeletionResult = {
    success: false,
    deletedTables: [],
    anonymizedTables: [],
    errors: [],
  };

  try {
    await db.transaction(async (tx) => {
      // Step 1: Delete authentication and security data (immediate delete)
      // These contain sensitive tokens that should be removed immediately

      await tx.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
      result.deletedTables.push('emailVerifications');

      await tx.delete(passwordResets).where(eq(passwordResets.userId, userId));
      result.deletedTables.push('passwordResets');

      await tx.delete(passwordHistory).where(eq(passwordHistory.userId, userId));
      result.deletedTables.push('passwordHistory');

      // Delete OAuth accounts and sessions
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      result.deletedTables.push('accounts');

      await tx.delete(sessions).where(eq(sessions.userId, userId));
      result.deletedTables.push('sessions');

      // Step 2: Anonymize mentor profile (if exists)
      await tx
        .update(mentorProfiles)
        .set({
          bio: null,
          company: null,
          jobTitle: null,
          linkedinUrl: null,
          photoUrl: null,
        })
        .where(eq(mentorProfiles.userId, userId));
      result.anonymizedTables.push('mentorProfiles');

      // Step 3: Anonymize mentee profile (if exists)
      await tx
        .update(menteeProfiles)
        .set({
          bio: null,
          photoUrl: null,
          currentChallenge: null,
        })
        .where(eq(menteeProfiles.userId, userId));
      result.anonymizedTables.push('menteeProfiles');

      // Step 4: Anonymize form submissions
      await tx
        .update(mentorFormSubmissions)
        .set({
          fullName: null,
          email: null,
          phone: null,
          bio: null,
          photoUrl: null,
          linkedinUrl: null,
          city: null,
          company: null,
          jobTitle: null,
        })
        .where(eq(mentorFormSubmissions.userId, userId));
      result.anonymizedTables.push('mentorFormSubmissions');

      await tx
        .update(menteeFormSubmissions)
        .set({
          fullName: null,
          email: null,
          phone: null,
          bio: null,
          photoUrl: null,
          city: null,
        })
        .where(eq(menteeFormSubmissions.userId, userId));
      result.anonymizedTables.push('menteeFormSubmissions');

      // Step 5: Anonymize activity logs (preserve for audit but remove PII)
      await tx
        .update(activityLogs)
        .set({
          ipAddress: null,
        })
        .where(eq(activityLogs.userId, userId));
      result.anonymizedTables.push('activityLogs');

      // Step 6: Anonymize mentorship relationship notes
      await tx
        .update(mentorshipRelationships)
        .set({
          mentorNotes: null,
          menteeNotes: null,
          relationshipGoals: null,
        })
        .where(
          or(
            eq(mentorshipRelationships.mentorUserId, userId),
            eq(mentorshipRelationships.menteeUserId, userId)
          )
        );
      result.anonymizedTables.push('mentorshipRelationships');

      // Step 7: Anonymize meeting records
      // First get relationship IDs for this user
      const relationships = await tx
        .select({ id: mentorshipRelationships.id })
        .from(mentorshipRelationships)
        .where(
          or(
            eq(mentorshipRelationships.mentorUserId, userId),
            eq(mentorshipRelationships.menteeUserId, userId)
          )
        );

      if (relationships.length > 0) {
        const relationshipIds = relationships.map((r) => r.id);
        for (const relId of relationshipIds) {
          await tx
            .update(meetings)
            .set({
              mentorNotes: null,
              menteeFeedback: null,
              meetingLink: null,
              recordingUrl: null,
            })
            .where(eq(meetings.relationshipId, relId));
        }
        result.anonymizedTables.push('meetings');
      }

      // Step 8: Anonymize invitation codes generated by this user
      await tx
        .update(invitationCodes)
        .set({
          generatedFor: null,
          notes: null,
        })
        .where(eq(invitationCodes.generatedBy, userId));
      result.anonymizedTables.push('invitationCodes');

      // Step 9: Anonymize AI match results
      await tx
        .update(aiMatchResults)
        .set({
          aiExplanation: null,
          aiRecommendation: null,
          reviewNotes: null,
        })
        .where(
          or(
            eq(aiMatchResults.mentorUserId, userId),
            eq(aiMatchResults.menteeUserId, userId)
          )
        );
      result.anonymizedTables.push('aiMatchResults');

      // Step 10: Anonymize reward redemptions
      await tx
        .update(rewardRedemptions)
        .set({
          notes: null,
        })
        .where(eq(rewardRedemptions.userId, userId));
      result.anonymizedTables.push('rewardRedemptions');

      // Step 11: Soft delete and anonymize user record
      await tx
        .update(users)
        .set({
          name: 'Deleted User',
          email: sql`CONCAT(email, '-', ${userId}, '-deleted')`,
          phone: null,
          image: null,
          passwordHash: null,
          gender: null,
          age: null,
          deletedAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(users.id, userId));
      result.anonymizedTables.push('users');

      // Step 12: Log the deletion activity (with anonymized IP)
      await tx.insert(activityLogs).values({
        userId: null, // Anonymize the user reference in the log
        action: ActivityType.DELETE_ACCOUNT,
        entityType: 'user',
        entityId: userId,
        ipAddress: ipAddress ? ipAddress.substring(0, 10) + '***' : null, // Partial IP for audit
        metadata: {
          softDelete: true,
          deletedAt: new Date().toISOString(),
          dataAnonymized: true,
        },
      });
    });

    result.success = true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    console.error('Error processing user deletion:', error);
  }

  return result;
}
