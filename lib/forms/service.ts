'use server';

import { db } from '@/lib/db/drizzle';
import {
  mentorFormSubmissions,
  menteeFormSubmissions,
  mentorProfiles,
  menteeProfiles,
  userRoles,
  activityLogs,
  type NewMentorFormSubmission,
  type NewMenteeFormSubmission,
  type MentorFormSubmission,
  type MenteeFormSubmission,
  ActivityType,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createMentorApprovalCode, createMenteeApprovalCode } from '@/lib/invitations/service';
import { sendInvitationCodeEmail } from '@/lib/email/service';
import { programmes } from '@/lib/db/schema';

// =======================
// Mentor Form Operations
// =======================

/**
 * Gets or creates a mentor form submission for a user.
 */
export async function getMentorForm(userId: number): Promise<MentorFormSubmission | null> {
  const [form] = await db
    .select()
    .from(mentorFormSubmissions)
    .where(eq(mentorFormSubmissions.userId, userId))
    .limit(1);

  return form || null;
}

/**
 * Creates a new mentor form submission.
 */
export async function createMentorForm(userId: number): Promise<MentorFormSubmission> {
  const existing = await getMentorForm(userId);
  if (existing) {
    return existing;
  }

  const [form] = await db
    .insert(mentorFormSubmissions)
    .values({ userId, status: 'not_started' })
    .returning();

  return form;
}

/**
 * Saves mentor form data (draft or partial save).
 */
export async function saveMentorForm(
  userId: number,
  data: Partial<NewMentorFormSubmission>
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await getMentorForm(userId);

    if (!existing) {
      await db.insert(mentorFormSubmissions).values({
        userId,
        ...data,
        status: 'in_progress',
        lastSavedAt: new Date(),
      });
    } else {
      await db
        .update(mentorFormSubmissions)
        .set({
          ...data,
          status: existing.status === 'not_started' ? 'in_progress' : existing.status,
          lastSavedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mentorFormSubmissions.userId, userId));
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving mentor form:', error);
    return { success: false, error: 'Failed to save form' };
  }
}

/**
 * Submits mentor form for review.
 */
export async function submitMentorForm(
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const form = await getMentorForm(userId);
    if (!form) {
      return { success: false, error: 'Form not found' };
    }

    // Validate required fields
    const requiredFields = ['fullName', 'phone', 'jobTitle', 'company', 'bio'];
    for (const field of requiredFields) {
      if (!form[field as keyof MentorFormSubmission]) {
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    await db
      .update(mentorFormSubmissions)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mentorFormSubmissions.userId, userId));

    // Log activity
    await db.insert(activityLogs).values({
      userId,
      action: ActivityType.SUBMIT_MENTOR_FORM,
      entityType: 'mentor_form',
      entityId: form.id,
    });

    return { success: true };
  } catch (error) {
    console.error('Error submitting mentor form:', error);
    return { success: false, error: 'Failed to submit form' };
  }
}

/**
 * Reviews mentor form (admin action).
 */
export async function reviewMentorForm(
  formId: number,
  reviewerId: number,
  decision: 'approved' | 'rejected',
  notes?: string,
  isTestUser?: boolean
): Promise<{ success: boolean; invitationCode?: string; error?: string }> {
  try {
    const [form] = await db
      .select()
      .from(mentorFormSubmissions)
      .where(eq(mentorFormSubmissions.id, formId))
      .limit(1);

    if (!form) {
      return { success: false, error: 'Form not found' };
    }

    if (form.status !== 'submitted') {
      return { success: false, error: 'Form is not in submitted status' };
    }

    await db
      .update(mentorFormSubmissions)
      .set({
        status: decision,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(mentorFormSubmissions.id, formId));

    // Log activity
    await db.insert(activityLogs).values({
      userId: reviewerId,
      action: ActivityType.REVIEW_APPLICATION,
      entityType: 'mentor_form',
      entityId: formId,
      metadata: { decision, notes },
    });

    // If approved and user not registered, generate invitation code
    if (decision === 'approved' && form.email && !form.userId) {
      const invitationCode = await createMentorApprovalCode(
        form.email,
        reviewerId,
        form.id,  // Link to mentor form submission
        notes,
        isTestUser
      );

      // Send email with invitation code
      await sendInvitationCodeEmail(form.email, {
        invitationCode: invitationCode.code,
        codeType: 'mentor_approved',
        expiresAt: invitationCode.expiresAt || undefined,
        message: 'Your mentor application has been approved! Use this code to complete your registration.',
      });

      return { success: true, invitationCode: invitationCode.code };
    }

    // If approved and user exists, activate mentor role
    if (decision === 'approved' && form.userId) {
      // Check if mentor role already exists
      const [existingRole] = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, form.userId),
            eq(userRoles.roleType, 'mentor')
          )
        )
        .limit(1);

      if (!existingRole) {
        await db.insert(userRoles).values({
          userId: form.userId,
          roleType: 'mentor',
          isActive: true,
          verifiedAt: new Date(),
        });
      } else {
        await db
          .update(userRoles)
          .set({ isActive: true, verifiedAt: new Date() })
          .where(eq(userRoles.id, existingRole.id));
      }

      // Create or update mentor profile
      const [existingProfile] = await db
        .select()
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, form.userId))
        .limit(1);

      const profileData = {
        bio: form.bio,
        company: form.company,
        jobTitle: form.jobTitle,
        yearsExperience: form.yearsExperience,
        linkedinUrl: form.linkedinUrl,
        maxMentees: form.maxMentees,
        availabilityHoursPerMonth: form.availabilityHoursPerMonth,
        mbtiType: form.mbtiType,
        photoUrl: form.photoUrl,
        formSubmissionId: form.id,
        verifiedAt: new Date(),
        verifiedBy: reviewerId,
        expertiseAreas: [
          ...(form.softSkillsExpert || []),
          ...(form.industrySkillsExpert || []),
        ],
      };

      if (!existingProfile) {
        await db.insert(mentorProfiles).values({
          userId: form.userId,
          ...profileData,
        });
      } else {
        await db
          .update(mentorProfiles)
          .set(profileData)
          .where(eq(mentorProfiles.userId, form.userId));
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error reviewing mentor form:', error);
    return { success: false, error: 'Failed to review form' };
  }
}

/**
 * Reviews mentee form (admin action).
 */
export async function reviewMenteeForm(
  formId: number,
  reviewerId: number,
  decision: 'approved' | 'rejected',
  notes?: string,
  isTestUser?: boolean
): Promise<{ success: boolean; invitationCode?: string; error?: string }> {
  try {
    const [form] = await db
      .select()
      .from(menteeFormSubmissions)
      .where(eq(menteeFormSubmissions.id, formId))
      .limit(1);

    if (!form) {
      return { success: false, error: 'Form not found' };
    }

    if (form.status !== 'submitted') {
      return { success: false, error: 'Form is not in submitted status' };
    }

    await db
      .update(menteeFormSubmissions)
      .set({
        status: decision,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(menteeFormSubmissions.id, formId));

    // Log activity
    await db.insert(activityLogs).values({
      userId: reviewerId,
      action: ActivityType.REVIEW_APPLICATION,
      entityType: 'mentee_form',
      entityId: formId,
      metadata: { decision, notes },
    });

    // If approved and user not registered, generate invitation code
    if (decision === 'approved' && form.email && !form.userId) {
      const invitationCode = await createMenteeApprovalCode(
        form.email,
        reviewerId,
        form.id,
        notes,
        undefined, // programmeId
        isTestUser
      );

      await sendInvitationCodeEmail(form.email, {
        invitationCode: invitationCode.code,
        codeType: 'mentee_approved',
        expiresAt: invitationCode.expiresAt || undefined,
        message: 'Your mentee application has been approved! Use this code to complete your registration.',
      });

      return { success: true, invitationCode: invitationCode.code };
    }

    // If approved and user exists, activate mentee role and create profile
    if (decision === 'approved' && form.userId) {
      const [existingRole] = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, form.userId),
            eq(userRoles.roleType, 'mentee')
          )
        )
        .limit(1);

      if (!existingRole) {
        await db.insert(userRoles).values({
          userId: form.userId,
          roleType: 'mentee',
          isActive: true,
        });
      } else if (!existingRole.isActive) {
        await db
          .update(userRoles)
          .set({ isActive: true })
          .where(eq(userRoles.id, existingRole.id));
      }

      // Create or update mentee profile
      const [existingProfile] = await db
        .select()
        .from(menteeProfiles)
        .where(eq(menteeProfiles.userId, form.userId))
        .limit(1);

      const profileData = {
        bio: form.bio,
        careerStage: form.currentStage,
        learningGoals: [form.longTermGoals, form.shortTermGoals].filter(Boolean) as string[],
        preferredExpertiseAreas: form.preferredIndustries || [],
        preferredMeetingFrequency: form.preferredMeetingFrequency,
        currentChallenge: form.whyMentor,
        mbtiType: form.mbtiType,
        photoUrl: form.photoUrl,
        formSubmissionId: form.id,
        profileCompletedAt: new Date(),
      };

      if (!existingProfile) {
        await db.insert(menteeProfiles).values({
          userId: form.userId,
          ...profileData,
        });
      } else {
        await db
          .update(menteeProfiles)
          .set(profileData)
          .where(eq(menteeProfiles.userId, form.userId));
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error reviewing mentee form:', error);
    return { success: false, error: 'Failed to review form' };
  }
}

// =======================
// Mentee Form Operations
// =======================

/**
 * Gets or creates a mentee form submission for a user.
 */
export async function getMenteeForm(userId: number): Promise<MenteeFormSubmission | null> {
  const [form] = await db
    .select()
    .from(menteeFormSubmissions)
    .where(eq(menteeFormSubmissions.userId, userId))
    .limit(1);

  return form || null;
}

/**
 * Creates a new mentee form submission.
 */
export async function createMenteeForm(userId: number): Promise<MenteeFormSubmission> {
  const existing = await getMenteeForm(userId);
  if (existing) {
    return existing;
  }

  const [form] = await db
    .insert(menteeFormSubmissions)
    .values({ userId, status: 'not_started' })
    .returning();

  return form;
}

/**
 * Saves mentee form data (draft or partial save).
 */
export async function saveMenteeForm(
  userId: number,
  data: Partial<NewMenteeFormSubmission>
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await getMenteeForm(userId);

    if (!existing) {
      await db.insert(menteeFormSubmissions).values({
        userId,
        ...data,
        status: 'in_progress',
        lastSavedAt: new Date(),
      });
    } else {
      await db
        .update(menteeFormSubmissions)
        .set({
          ...data,
          status: existing.status === 'not_started' ? 'in_progress' : existing.status,
          lastSavedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(menteeFormSubmissions.userId, userId));
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving mentee form:', error);
    return { success: false, error: 'Failed to save form' };
  }
}

/**
 * Submits mentee form for review.
 */
export async function submitMenteeForm(
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const form = await getMenteeForm(userId);
    if (!form) {
      return { success: false, error: 'Form not found' };
    }

    // Validate required fields
    const requiredFields = ['fullName', 'phone', 'longTermGoals', 'shortTermGoals'];
    for (const field of requiredFields) {
      if (!form[field as keyof MenteeFormSubmission]) {
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    await db
      .update(menteeFormSubmissions)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(menteeFormSubmissions.userId, userId));

    // Log activity
    await db.insert(activityLogs).values({
      userId,
      action: ActivityType.SUBMIT_MENTEE_FORM,
      entityType: 'mentee_form',
      entityId: form.id,
    });

    return { success: true };
  } catch (error) {
    console.error('Error submitting mentee form:', error);
    return { success: false, error: 'Failed to submit form' };
  }
}

// =======================
// Admin Operations
// =======================

/**
 * Gets pending mentor applications for admin review.
 */
export async function getPendingMentorApplications() {
  return db
    .select()
    .from(mentorFormSubmissions)
    .where(eq(mentorFormSubmissions.status, 'submitted'))
    .orderBy(mentorFormSubmissions.submittedAt);
}

/**
 * Gets all mentor applications with optional status filter.
 */
export async function getMentorApplications(status?: string) {
  if (status) {
    return db
      .select()
      .from(mentorFormSubmissions)
      .where(eq(mentorFormSubmissions.status, status as any))
      .orderBy(mentorFormSubmissions.createdAt);
  }
  return db
    .select()
    .from(mentorFormSubmissions)
    .orderBy(mentorFormSubmissions.createdAt);
}

/**
 * Gets all mentee applications with optional status filter.
 */
export async function getMenteeApplications(status?: string) {
  if (status) {
    return db
      .select()
      .from(menteeFormSubmissions)
      .where(eq(menteeFormSubmissions.status, status as any))
      .orderBy(menteeFormSubmissions.createdAt);
  }
  return db
    .select()
    .from(menteeFormSubmissions)
    .orderBy(menteeFormSubmissions.createdAt);
}

// =======================
// Public Form Submissions
// =======================

export interface PublicMentorFormData {
  fullName: string;
  email: string;
  phone: string;
  gender?: string;
  // Location fields for matching
  city?: string;
  preferredMeetingFormat?: string;
  // Professional info
  jobTitle: string;
  company: string;
  yearsExperience: number;
  linkedinUrl?: string;
  // Bio
  bioMethod?: string;
  bio?: string;
  photoUrl?: string;
  // Skills
  softSkillsBasic?: string[];
  softSkillsExpert: string[];
  industrySkillsBasic?: string[];
  industrySkillsExpert: string[];
  // Goals and preferences
  expectedMenteeGoalsLongTerm: string;
  expectedMenteeGoalsShortTerm: string;
  programExpectations?: string;
  preferredMenteeTypes?: string[];
  preferredIndustries?: string[];
  // Personality
  mbtiType?: string;
  maxMentees: number;
  availabilityHoursPerMonth: number;
}

/**
 * Submits a public mentor application (no authentication required).
 * Creates a form submission with email instead of userId.
 */
export async function submitPublicMentorForm(
  data: PublicMentorFormData
): Promise<{ success: boolean; submissionId?: number; error?: string }> {
  try {
    // Check if email already has a submission
    const [existing] = await db
      .select()
      .from(mentorFormSubmissions)
      .where(eq(mentorFormSubmissions.email, data.email))
      .limit(1);

    if (existing) {
      if (existing.status === 'submitted') {
        return { success: false, error: 'An application with this email is already under review' };
      }
      if (existing.status === 'approved') {
        return { success: false, error: 'An application with this email has already been approved' };
      }
      if (existing.status === 'rejected') {
        // Allow resubmission if previously rejected
        await db
          .update(mentorFormSubmissions)
          .set({
            fullName: data.fullName,
            phone: data.phone,
            gender: data.gender as any,
            city: data.city,
            preferredMeetingFormat: data.preferredMeetingFormat as any,
            mbtiType: data.mbtiType as any,
            jobTitle: data.jobTitle,
            company: data.company,
            yearsExperience: data.yearsExperience,
            linkedinUrl: data.linkedinUrl,
            bioMethod: data.bioMethod as 'self_written' | 'ai_generated' | 'already_sent' | undefined,
            bio: data.bio,
            photoUrl: data.photoUrl,
            softSkillsBasic: data.softSkillsBasic,
            softSkillsExpert: data.softSkillsExpert,
            industrySkillsBasic: data.industrySkillsBasic,
            industrySkillsExpert: data.industrySkillsExpert,
            maxMentees: data.maxMentees,
            availabilityHoursPerMonth: data.availabilityHoursPerMonth,
            expectedMenteeGoalsLongTerm: data.expectedMenteeGoalsLongTerm,
            expectedMenteeGoalsShortTerm: data.expectedMenteeGoalsShortTerm,
            programExpectations: data.programExpectations,
            preferredMenteeTypes: data.preferredMenteeTypes,
            preferredIndustries: data.preferredIndustries,
            status: 'submitted',
            submittedAt: new Date(),
            reviewedAt: null,
            reviewedBy: null,
            reviewNotes: null,
            updatedAt: new Date(),
          })
          .where(eq(mentorFormSubmissions.id, existing.id));

        return { success: true, submissionId: existing.id };
      }
    }

    // Create new submission
    const [submission] = await db
      .insert(mentorFormSubmissions)
      .values({
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        gender: data.gender as any,
        city: data.city,
        preferredMeetingFormat: data.preferredMeetingFormat as any,
        mbtiType: data.mbtiType as any,
        jobTitle: data.jobTitle,
        company: data.company,
        yearsExperience: data.yearsExperience,
        linkedinUrl: data.linkedinUrl,
        bioMethod: data.bioMethod as 'self_written' | 'ai_generated' | 'already_sent' | undefined,
        bio: data.bio,
        photoUrl: data.photoUrl,
        softSkillsBasic: data.softSkillsBasic,
        softSkillsExpert: data.softSkillsExpert,
        industrySkillsBasic: data.industrySkillsBasic,
        industrySkillsExpert: data.industrySkillsExpert,
        maxMentees: data.maxMentees,
        availabilityHoursPerMonth: data.availabilityHoursPerMonth,
        expectedMenteeGoalsLongTerm: data.expectedMenteeGoalsLongTerm,
        expectedMenteeGoalsShortTerm: data.expectedMenteeGoalsShortTerm,
        programExpectations: data.programExpectations,
        preferredMenteeTypes: data.preferredMenteeTypes,
        preferredIndustries: data.preferredIndustries,
        status: 'submitted',
        submittedAt: new Date(),
      })
      .returning();

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error('Error submitting public mentor form:', error);
    return { success: false, error: 'Failed to submit application' };
  }
}

/**
 * Gets a public mentor form submission by email.
 */
export async function getPublicMentorFormByEmail(
  email: string
): Promise<MentorFormSubmission | null> {
  const [form] = await db
    .select()
    .from(mentorFormSubmissions)
    .where(eq(mentorFormSubmissions.email, email))
    .limit(1);

  return form || null;
}

// =======================
// PUBLIC MENTEE FORM (Pre-registration)
// =======================

export interface PublicMenteeFormData {
  email: string;
  fullName: string;
  phone: string;
  gender?: string;
  age?: number;
  bio?: string;
  // Location fields for matching
  city?: string;
  preferredMeetingFormat?: string;
  // Career fields
  currentStage?: string;
  currentJobTitle?: string;
  currentIndustry?: string;
  preferredIndustries?: string[];
  // Skills
  softSkillsBasic?: string[];
  industrySkillsBasic?: string[];
  softSkillsExpert?: string[];
  industrySkillsExpert?: string[];
  // Goals
  longTermGoals: string;
  shortTermGoals: string;
  whyMentor?: string;
  programExpectations?: string;
  // Personality
  mbtiType?: string;
  preferredMeetingFrequency?: string;
  photoUrl?: string;
  // Programme
  programmeSlug?: string;
}

/**
 * Resolves programme from slug and validates it is accepting applications.
 */
async function resolveProgramme(slug: string): Promise<{
  programmeId: number;
  programmeName: string;
  requiresPayment: boolean;
  error?: undefined;
} | { programmeId?: undefined; programmeName?: undefined; requiresPayment?: undefined; error: string }> {
  const [programme] = await db
    .select()
    .from(programmes)
    .where(eq(programmes.slug, slug))
    .limit(1);

  if (!programme) {
    return { error: 'Programme not found' };
  }

  if (programme.status !== 'active') {
    if (programme.applicationDeadline && new Date() <= programme.applicationDeadline) {
      // Allow late applications before deadline even if status is 'closed'
    } else {
      return { error: 'This programme is no longer accepting applications' };
    }
  }

  if (programme.maxMentees && programme.currentMenteeCount >= programme.maxMentees) {
    return { error: 'This programme is currently full. You can still apply as a general applicant.' };
  }

  return { programmeId: programme.id, programmeName: programme.name, requiresPayment: programme.requiresPayment };
}

/**
 * Submits a public mentee application (no authentication required).
 * Creates a form submission with email instead of userId.
 * User will pay after form submission (unless programme waives payment).
 */
export async function submitPublicMenteeForm(
  data: PublicMenteeFormData
): Promise<{ success: boolean; submissionId?: number; requiresPayment?: boolean; programmeName?: string; error?: string }> {
  try {
    // Resolve programme if specified
    let programmeId: number | null = null;
    let requiresPayment = true;
    let programmeName: string | undefined;

    if (data.programmeSlug) {
      const programmeResult = await resolveProgramme(data.programmeSlug);
      if (programmeResult.error) {
        return { success: false, error: programmeResult.error };
      }
      programmeId = programmeResult.programmeId!;
      requiresPayment = programmeResult.requiresPayment!;
      programmeName = programmeResult.programmeName;
    }

    // Check if email already has a submission
    const [existing] = await db
      .select()
      .from(menteeFormSubmissions)
      .where(eq(menteeFormSubmissions.email, data.email))
      .limit(1);

    if (existing) {
      // If payment already completed and same programme, don't allow resubmission
      if (existing.paymentCompleted && existing.programmeId === programmeId) {
        return { success: false, error: 'An application with this email has already been paid for' };
      }
      if (existing.status === 'approved') {
        return { success: false, error: 'An application with this email has already been approved' };
      }

      // Handle programme change: adjust counts
      const oldProgrammeId = existing.programmeId;
      if (oldProgrammeId && oldProgrammeId !== programmeId) {
        await db
          .update(programmes)
          .set({ currentMenteeCount: sql`${programmes.currentMenteeCount} - 1` })
          .where(eq(programmes.id, oldProgrammeId));
      }

      // Allow update if in progress or rejected
      await db
        .update(menteeFormSubmissions)
        .set({
          fullName: data.fullName,
          phone: data.phone,
          gender: data.gender as any,
          age: data.age,
          bio: data.bio,
          city: data.city,
          preferredMeetingFormat: data.preferredMeetingFormat as any,
          currentStage: data.currentStage as any,
          currentJobTitle: data.currentJobTitle,
          currentIndustry: data.currentIndustry,
          preferredIndustries: data.preferredIndustries,
          softSkillsBasic: data.softSkillsBasic,
          industrySkillsBasic: data.industrySkillsBasic,
          softSkillsExpert: data.softSkillsExpert,
          industrySkillsExpert: data.industrySkillsExpert,
          longTermGoals: data.longTermGoals,
          shortTermGoals: data.shortTermGoals,
          whyMentor: data.whyMentor,
          programExpectations: data.programExpectations,
          mbtiType: data.mbtiType as any,
          preferredMeetingFrequency: data.preferredMeetingFrequency,
          photoUrl: data.photoUrl,
          programmeId,
          paymentCompleted: !requiresPayment,
          paymentCompletedAt: !requiresPayment ? new Date() : null,
          status: 'submitted',
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
          reviewNotes: null,
          updatedAt: new Date(),
        })
        .where(eq(menteeFormSubmissions.id, existing.id));

      // Increment new programme count if changed
      if (programmeId && oldProgrammeId !== programmeId) {
        await db
          .update(programmes)
          .set({ currentMenteeCount: sql`${programmes.currentMenteeCount} + 1` })
          .where(eq(programmes.id, programmeId));
      }

      return { success: true, submissionId: existing.id, requiresPayment, programmeName };
    }

    // Create new submission
    const [submission] = await db
      .insert(menteeFormSubmissions)
      .values({
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        gender: data.gender as any,
        age: data.age,
        bio: data.bio,
        city: data.city,
        preferredMeetingFormat: data.preferredMeetingFormat as any,
        currentStage: data.currentStage as any,
        currentJobTitle: data.currentJobTitle,
        currentIndustry: data.currentIndustry,
        preferredIndustries: data.preferredIndustries,
        softSkillsBasic: data.softSkillsBasic,
        industrySkillsBasic: data.industrySkillsBasic,
        softSkillsExpert: data.softSkillsExpert,
        industrySkillsExpert: data.industrySkillsExpert,
        longTermGoals: data.longTermGoals,
        shortTermGoals: data.shortTermGoals,
        whyMentor: data.whyMentor,
        programExpectations: data.programExpectations,
        mbtiType: data.mbtiType as any,
        preferredMeetingFrequency: data.preferredMeetingFrequency,
        photoUrl: data.photoUrl,
        programmeId,
        status: 'submitted',
        submittedAt: new Date(),
        paymentCompleted: !requiresPayment,
        paymentCompletedAt: !requiresPayment ? new Date() : null,
      })
      .returning();

    // Increment programme mentee count
    if (programmeId) {
      await db
        .update(programmes)
        .set({ currentMenteeCount: sql`${programmes.currentMenteeCount} + 1` })
        .where(eq(programmes.id, programmeId));
    }

    return { success: true, submissionId: submission.id, requiresPayment, programmeName };
  } catch (error) {
    console.error('Error submitting public mentee form:', error);
    return { success: false, error: 'Failed to submit application' };
  }
}

/**
 * Gets a public mentee form submission by email.
 */
export async function getPublicMenteeFormByEmail(
  email: string
): Promise<MenteeFormSubmission | null> {
  const [form] = await db
    .select()
    .from(menteeFormSubmissions)
    .where(eq(menteeFormSubmissions.email, email))
    .limit(1);

  return form || null;
}

/**
 * Gets a mentee form submission by ID.
 */
export async function getMenteeFormById(
  id: number
): Promise<MenteeFormSubmission | null> {
  const [form] = await db
    .select()
    .from(menteeFormSubmissions)
    .where(eq(menteeFormSubmissions.id, id))
    .limit(1);

  return form || null;
}

/**
 * Gets a mentor form submission by ID.
 */
export async function getMentorFormById(
  id: number
): Promise<MentorFormSubmission | null> {
  const [form] = await db
    .select()
    .from(mentorFormSubmissions)
    .where(eq(mentorFormSubmissions.id, id))
    .limit(1);

  return form || null;
}
