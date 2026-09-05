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
import { eq, and, sql, type SQL } from 'drizzle-orm';
import { createMentorApprovalCode, createMenteeApprovalCode } from '@/lib/invitations/service';
import { sendInvitationCodeEmail } from '@/lib/email/service';
import { programmes } from '@/lib/db/schema';

// =========================================================
// Shared mentor/mentee plumbing
//
// The two application flows are the same workflow over two tables. Everything
// that differs — which table, which columns a profile is built from, whether an
// approval stamps a verification date — lives in the `FormKind` config below,
// so the workflow itself exists once. The public `*MentorForm` / `*MenteeForm`
// exports are thin wrappers because their callers import them by name.
// =========================================================

type SubmissionTable = typeof mentorFormSubmissions | typeof menteeFormSubmissions;
type FormSubmission = MentorFormSubmission | MenteeFormSubmission;
type FormDraft = Partial<NewMentorFormSubmission> | Partial<NewMenteeFormSubmission>;

type ProfileTable = typeof mentorProfiles | typeof menteeProfiles;
type ProfileValues =
  | Omit<typeof mentorProfiles.$inferInsert, 'userId'>
  | Omit<typeof menteeProfiles.$inferInsert, 'userId'>;

type MentorFormValues = typeof mentorFormSubmissions.$inferInsert;
type MenteeFormValues = typeof menteeFormSubmissions.$inferInsert;

/** How one role binds to the schema. Everything role-specific is here. */
interface FormKind<TForm extends FormSubmission> {
  /** Used in the error logs: "Error saving mentor form:". */
  label: 'mentor' | 'mentee';
  table: SubmissionTable;
  profileTable: ProfileTable;
  entityType: 'mentor_form' | 'mentee_form';
  roleType: 'mentor' | 'mentee';
  submitActivity: ActivityType;
  /** Checked before a form may move to `submitted`. */
  requiredFields: string[];
  /**
   * Mentor approvals record who verified the mentor and when; mentee approvals
   * carry no verification, so an already-active role is left untouched.
   */
  stampsRoleVerification: boolean;
  approvalCodeType: 'mentor_approved' | 'mentee_approved';
  approvalMessage: string;
  /** Issues the invitation code an approved applicant registers with. */
  createApprovalCode(
    form: TForm,
    email: string,
    reviewerId: number,
    notes: string | undefined,
    isTestUser: boolean | undefined
  ): Promise<{ code: string; expiresAt: Date | null }>;
  /** Maps an approved form onto that role's profile columns. */
  buildProfile(form: TForm, reviewerId: number): ProfileValues;
}

/**
 * Reads a single form row. The caller passes a table and a predicate over that
 * same table, so it — not this helper — knows the row type; the assertion
 * restores what the union parameter type discards.
 */
async function findForm<TForm extends FormSubmission>(
  table: SubmissionTable,
  where: SQL
): Promise<TForm | null> {
  const [form] = await db.select().from(table).where(where).limit(1);
  return (form as TForm | undefined) || null;
}

/**
 * Activates a role, creating it if the user has never held it.
 *
 * `stampVerification` is the one real difference between the two roles: a
 * mentor approval records the verification date every time, a mentee approval
 * records none and leaves an already-active role alone.
 */
async function activateRole(
  userId: number,
  roleType: 'mentor' | 'mentee',
  stampVerification: boolean
): Promise<void> {
  const [existingRole] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleType, roleType)))
    .limit(1);

  if (!existingRole) {
    await db.insert(userRoles).values({
      userId,
      roleType,
      isActive: true,
      ...(stampVerification ? { verifiedAt: new Date() } : {}),
    });
    return;
  }

  if (stampVerification) {
    await db
      .update(userRoles)
      .set({ isActive: true, verifiedAt: new Date() })
      .where(eq(userRoles.id, existingRole.id));
  } else if (!existingRole.isActive) {
    await db
      .update(userRoles)
      .set({ isActive: true })
      .where(eq(userRoles.id, existingRole.id));
  }
}

/** Creates or updates the role profile keyed on `userId`. */
async function upsertProfile(
  table: ProfileTable,
  userId: number,
  values: ProfileValues
): Promise<void> {
  const [existingProfile] = await db
    .select()
    .from(table)
    .where(eq(table.userId, userId))
    .limit(1);

  if (!existingProfile) {
    await db.insert(table).values({ userId, ...values });
  } else {
    await db.update(table).set(values).where(eq(table.userId, userId));
  }
}

/** Gets a form submission for a user. */
async function getForm<TForm extends FormSubmission>(
  kind: FormKind<TForm>,
  userId: number
): Promise<TForm | null> {
  return findForm<TForm>(kind.table, eq(kind.table.userId, userId));
}

/** Saves form data (draft or partial save). */
async function saveForm<TForm extends FormSubmission>(
  kind: FormKind<TForm>,
  userId: number,
  data: FormDraft
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await getForm(kind, userId);

    if (!existing) {
      await db.insert(kind.table).values({
        userId,
        ...data,
        status: 'in_progress',
        lastSavedAt: new Date(),
      });
    } else {
      await db
        .update(kind.table)
        .set({
          ...data,
          status: existing.status === 'not_started' ? 'in_progress' : existing.status,
          lastSavedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(kind.table.userId, userId));
    }

    return { success: true };
  } catch (error) {
    console.error(`Error saving ${kind.label} form:`, error);
    return { success: false, error: 'Failed to save form' };
  }
}

/** Submits a form for review. */
async function submitForm<TForm extends FormSubmission>(
  kind: FormKind<TForm>,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const form = await getForm(kind, userId);
    if (!form) {
      return { success: false, error: 'Form not found' };
    }

    // Validate required fields
    for (const field of kind.requiredFields) {
      if (!form[field as keyof TForm]) {
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    await db
      .update(kind.table)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(kind.table.userId, userId));

    // Log activity
    await db.insert(activityLogs).values({
      userId,
      action: kind.submitActivity,
      entityType: kind.entityType,
      entityId: form.id,
    });

    return { success: true };
  } catch (error) {
    console.error(`Error submitting ${kind.label} form:`, error);
    return { success: false, error: 'Failed to submit form' };
  }
}

/**
 * Reviews a submitted form (admin action). An approval either issues an
 * invitation code — when the applicant has no account yet — or activates the
 * role and writes the profile on the account they already have.
 */
async function reviewForm<TForm extends FormSubmission>(
  kind: FormKind<TForm>,
  formId: number,
  reviewerId: number,
  decision: 'approved' | 'rejected',
  notes?: string,
  isTestUser?: boolean
): Promise<{ success: boolean; invitationCode?: string; error?: string }> {
  try {
    const form = await findForm<TForm>(kind.table, eq(kind.table.id, formId));

    if (!form) {
      return { success: false, error: 'Form not found' };
    }

    if (form.status !== 'submitted') {
      return { success: false, error: 'Form is not in submitted status' };
    }

    await db
      .update(kind.table)
      .set({
        status: decision,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(kind.table.id, formId));

    // Log activity
    await db.insert(activityLogs).values({
      userId: reviewerId,
      action: ActivityType.REVIEW_APPLICATION,
      entityType: kind.entityType,
      entityId: formId,
      metadata: { decision, notes },
    });

    // If approved and user not registered, generate invitation code
    if (decision === 'approved' && form.email && !form.userId) {
      const invitationCode = await kind.createApprovalCode(
        form,
        form.email,
        reviewerId,
        notes,
        isTestUser
      );

      // Send email with invitation code
      await sendInvitationCodeEmail(form.email, {
        invitationCode: invitationCode.code,
        codeType: kind.approvalCodeType,
        expiresAt: invitationCode.expiresAt || undefined,
        message: kind.approvalMessage,
      });

      return { success: true, invitationCode: invitationCode.code };
    }

    // If approved and user exists, activate the role and write the profile
    if (decision === 'approved' && form.userId) {
      await activateRole(form.userId, kind.roleType, kind.stampsRoleVerification);
      await upsertProfile(kind.profileTable, form.userId, kind.buildProfile(form, reviewerId));
    }

    return { success: true };
  } catch (error) {
    console.error(`Error reviewing ${kind.label} form:`, error);
    return { success: false, error: 'Failed to review form' };
  }
}

const mentorForms: FormKind<MentorFormSubmission> = {
  label: 'mentor',
  table: mentorFormSubmissions,
  profileTable: mentorProfiles,
  entityType: 'mentor_form',
  roleType: 'mentor',
  submitActivity: ActivityType.SUBMIT_MENTOR_FORM,
  requiredFields: ['fullName', 'phone', 'jobTitle', 'company', 'bio'],
  stampsRoleVerification: true,
  approvalCodeType: 'mentor_approved',
  approvalMessage:
    'Your mentor application has been approved! Use this code to complete your registration.',
  createApprovalCode: (form, email, reviewerId, notes, isTestUser) =>
    createMentorApprovalCode(
      email,
      reviewerId,
      form.id, // Link to mentor form submission
      notes,
      isTestUser
    ),
  buildProfile: (form, reviewerId) => ({
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
  }),
};

const menteeForms: FormKind<MenteeFormSubmission> = {
  label: 'mentee',
  table: menteeFormSubmissions,
  profileTable: menteeProfiles,
  entityType: 'mentee_form',
  roleType: 'mentee',
  submitActivity: ActivityType.SUBMIT_MENTEE_FORM,
  requiredFields: ['fullName', 'phone', 'longTermGoals', 'shortTermGoals'],
  stampsRoleVerification: false,
  approvalCodeType: 'mentee_approved',
  approvalMessage:
    'Your mentee application has been approved! Use this code to complete your registration.',
  createApprovalCode: (form, email, reviewerId, notes, isTestUser) =>
    createMenteeApprovalCode(
      email,
      reviewerId,
      form.id,
      notes,
      undefined, // programmeId
      isTestUser
    ),
  buildProfile: (form) => ({
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
  }),
};

// =======================
// Mentor Form Operations
// =======================

/**
 * Gets or creates a mentor form submission for a user.
 */
export async function getMentorForm(userId: number): Promise<MentorFormSubmission | null> {
  return getForm(mentorForms, userId);
}

/**
 * Saves mentor form data (draft or partial save).
 */
export async function saveMentorForm(
  userId: number,
  data: Partial<NewMentorFormSubmission>
): Promise<{ success: boolean; error?: string }> {
  return saveForm(mentorForms, userId, data);
}

/**
 * Submits mentor form for review.
 */
export async function submitMentorForm(
  userId: number
): Promise<{ success: boolean; error?: string }> {
  return submitForm(mentorForms, userId);
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
  return reviewForm(mentorForms, formId, reviewerId, decision, notes, isTestUser);
}

// =======================
// Mentee Form Operations
// =======================

/**
 * Gets or creates a mentee form submission for a user.
 */
export async function getMenteeForm(userId: number): Promise<MenteeFormSubmission | null> {
  return getForm(menteeForms, userId);
}

/**
 * Saves mentee form data (draft or partial save).
 */
export async function saveMenteeForm(
  userId: number,
  data: Partial<NewMenteeFormSubmission>
): Promise<{ success: boolean; error?: string }> {
  return saveForm(menteeForms, userId, data);
}

/**
 * Submits mentee form for review.
 */
export async function submitMenteeForm(
  userId: number
): Promise<{ success: boolean; error?: string }> {
  return submitForm(menteeForms, userId);
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
  return reviewForm(menteeForms, formId, reviewerId, decision, notes, isTestUser);
}

// =======================
// Public Form Submissions
//
// The two public endpoints are NOT a mirrored pair and are deliberately left
// apart: the mentee flow resolves a programme, charges for it and keeps the
// programme's mentee count in step, and the two disagree on what an existing
// submission means (a mentor application in progress falls through to a second
// row, a mentee application is always updated in place). Folding them together
// would move all of that into per-role callbacks and leave nothing shared.
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
 * Maps the validated HTTP payload onto mentor submission columns.
 *
 * The route validates these as free strings while the columns are Postgres
 * enums, so the enum-backed fields are narrowed here — one place rather than
 * once per insert and once per update.
 */
function mentorFormValues(data: PublicMentorFormData) {
  return {
    fullName: data.fullName,
    phone: data.phone,
    gender: data.gender as MentorFormValues['gender'],
    city: data.city,
    preferredMeetingFormat: data.preferredMeetingFormat as MentorFormValues['preferredMeetingFormat'],
    mbtiType: data.mbtiType as MentorFormValues['mbtiType'],
    jobTitle: data.jobTitle,
    company: data.company,
    yearsExperience: data.yearsExperience,
    linkedinUrl: data.linkedinUrl,
    bioMethod: data.bioMethod as MentorFormValues['bioMethod'],
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
  };
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
            ...mentorFormValues(data),
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
        ...mentorFormValues(data),
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
  return findForm<MentorFormSubmission>(
    mentorFormSubmissions,
    eq(mentorFormSubmissions.email, email)
  );
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

/** Maps the validated HTTP payload onto mentee submission columns. */
function menteeFormValues(data: PublicMenteeFormData) {
  return {
    fullName: data.fullName,
    phone: data.phone,
    gender: data.gender as MenteeFormValues['gender'],
    age: data.age,
    bio: data.bio,
    city: data.city,
    preferredMeetingFormat: data.preferredMeetingFormat as MenteeFormValues['preferredMeetingFormat'],
    currentStage: data.currentStage as MenteeFormValues['currentStage'],
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
    mbtiType: data.mbtiType as MenteeFormValues['mbtiType'],
    preferredMeetingFrequency: data.preferredMeetingFrequency,
    photoUrl: data.photoUrl,
  };
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
): Promise<{ success: boolean; submissionId?: number; requiresPayment?: boolean; programmeName?: string; error?: string; alreadyPaid?: boolean }> {
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
        // `alreadyPaid` lets the apply page send the applicant to the success
        // page rather than show an error, which is what it used to do off the
        // back of a `GET ?email=` pre-flight check. That check was an anonymous
        // membership oracle and was removed on 2026-09-06.
        return {
          success: false,
          alreadyPaid: true,
          error: 'An application with this email has already been paid for',
        };
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
          ...menteeFormValues(data),
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
        ...menteeFormValues(data),
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
  return findForm<MenteeFormSubmission>(
    menteeFormSubmissions,
    eq(menteeFormSubmissions.email, email)
  );
}

/**
 * Gets a mentee form submission by ID.
 */
export async function getMenteeFormById(
  id: number
): Promise<MenteeFormSubmission | null> {
  return findForm<MenteeFormSubmission>(menteeFormSubmissions, eq(menteeFormSubmissions.id, id));
}
