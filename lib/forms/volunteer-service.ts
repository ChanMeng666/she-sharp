'use server';

import { db } from '@/lib/db/drizzle';
import {
  volunteerFormSubmissions,
  activityLogs,
  ActivityType,
  type VolunteerFormSubmission,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendVolunteerSlackNotification, sendExAmbassadorSlackNotification } from '@/lib/slack/service';

export interface VolunteerFormData {
  type: 'ambassador' | 'volunteer';
  email: string;
  firstName: string;
  lastName: string;
  currentStatus: 'high_school_student' | 'university_student' | 'industry' | 'sponsor_partner' | 'other';
  currentStatusOther?: string;
  organisation?: string;
  howHeardAbout: string;
  howHeardAboutOption?: string;
  howHeardAboutOther?: string;
  skillSets: string;
  // Ambassador-only
  linkedinUrl?: string;
  itIndustryInterest?: string;
  volunteerHoursPerWeek?: string;
  cvUrl?: string;
  cvFileName?: string;
  // Volunteer-only
  eventsPerYear?: string;
}

export interface ExAmbassadorFormData {
  type: 'ex_ambassador';
  firstName: string;
  lastName: string;
  email: string;
  currentRoleTitle?: string;
  joinedSheSharpYear: number;
  leftRoleYear?: number;
  stillAmbassador: boolean;
  experienceRating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  mostValuablePart: string;
  mostValuablePartOther?: string;
  wouldRecommend: boolean;
  wantFeatured: boolean;
  preferredCommunication: 'email' | 'phone';
  additionalComments?: string;
}

interface SubmitResult {
  success: boolean;
  submissionId?: number;
  error?: string;
}

/**
 * Submits a volunteer or ambassador application form.
 * Checks for duplicates, inserts into DB, logs activity, and sends Slack notification.
 */
export async function submitVolunteerForm(data: VolunteerFormData): Promise<SubmitResult> {
  try {
    const existing = await getVolunteerFormByEmail(data.email, data.type);

    if (existing) {
      if (existing.status !== 'rejected') {
        return {
          success: false,
          error: `You have already submitted an application with this email. Current status: ${existing.status}.`,
        };
      }
    }

    const now = new Date();
    const howHeardAboutOption = data.howHeardAboutOption as 'attended_event' | 'linkedin' | 'word_of_mouth' | 'search_engine' | 'social_media' | 'other' | undefined;

    const [submission] = await db
      .insert(volunteerFormSubmissions)
      .values({
        type: data.type,
        email: data.email.toLowerCase().trim(),
        status: 'submitted',
        submittedAt: now,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        currentStatus: data.currentStatus,
        currentStatusOther: data.currentStatus === 'other' ? data.currentStatusOther?.trim() : null,
        organisation: data.organisation?.trim() || null,
        howHeardAbout: data.howHeardAbout?.trim() || null,
        howHeardAboutOption: howHeardAboutOption || null,
        howHeardAboutOther: howHeardAboutOption === 'other' ? data.howHeardAboutOther?.trim() : null,
        skillSets: data.skillSets.trim(),
        recruitmentStage: 'new',
        // Ambassador-only
        linkedinUrl: data.type === 'ambassador' ? data.linkedinUrl?.trim() || null : null,
        itIndustryInterest: data.type === 'ambassador' ? data.itIndustryInterest?.trim() || null : null,
        volunteerHoursPerWeek: data.type === 'ambassador' ? data.volunteerHoursPerWeek || null : null,
        cvUrl: data.type === 'ambassador' ? data.cvUrl || null : null,
        cvFileName: data.type === 'ambassador' ? data.cvFileName || null : null,
        // Volunteer-only
        eventsPerYear: data.type === 'volunteer' ? data.eventsPerYear || null : null,
      })
      .returning();

    // Log activity
    await db.insert(activityLogs).values({
      action: ActivityType.SUBMIT_VOLUNTEER_FORM,
      entityType: 'volunteer_form',
      entityId: submission.id,
      metadata: {
        type: data.type,
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
      },
    });

    // Send Slack notification
    try {
      await sendVolunteerSlackNotification({
        type: data.type,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        currentStatus: data.currentStatus,
        organisation: data.organisation,
        howHeardAbout: data.howHeardAbout,
        skillSets: data.skillSets,
        linkedinUrl: data.linkedinUrl,
        itIndustryInterest: data.itIndustryInterest,
        volunteerHoursPerWeek: data.volunteerHoursPerWeek,
        cvUrl: data.cvUrl,
        eventsPerYear: data.eventsPerYear,
      });
    } catch (err) {
      console.error('Slack notification error:', err);
    }

    // Send confirmation email (non-blocking)
    try {
      const { sendApplicationConfirmationEmail } = await import('@/lib/email/recruitment-emails');
      await sendApplicationConfirmationEmail(data.email, {
        applicantName: `${data.firstName} ${data.lastName}`,
        applicantEmail: data.email,
        applicationType: data.type,
        submittedAt: now,
      });
    } catch (err) {
      console.error('Confirmation email error:', err);
    }

    // Auto-screen with AI if enabled (non-blocking)
    if (process.env.AUTO_SCREEN_APPLICATIONS === 'true') {
      try {
        const { screenVolunteerApplication } = await import('@/lib/recruitment/ai-screening');
        await screenVolunteerApplication(submission.id, 0);
      } catch (err) {
        console.error('Auto AI screening error:', err);
      }
    }

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error('Error submitting volunteer form:', error);
    return { success: false, error: 'Failed to submit application. Please try again.' };
  }
}

/**
 * Submits an ex-ambassador feedback form.
 */
export async function submitExAmbassadorForm(data: ExAmbassadorFormData): Promise<SubmitResult> {
  try {
    const existing = await getVolunteerFormByEmail(data.email, 'ex_ambassador');

    if (existing) {
      if (existing.status !== 'rejected') {
        return {
          success: false,
          error: 'You have already submitted feedback with this email.',
        };
      }
    }

    const now = new Date();

    const [submission] = await db
      .insert(volunteerFormSubmissions)
      .values({
        type: 'ex_ambassador',
        email: data.email.toLowerCase().trim(),
        status: 'submitted',
        submittedAt: now,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        currentRoleTitle: data.currentRoleTitle?.trim() || null,
        joinedSheSharpYear: data.joinedSheSharpYear,
        leftRoleYear: data.stillAmbassador ? null : data.leftRoleYear || null,
        stillAmbassador: data.stillAmbassador,
        experienceRating: data.experienceRating,
        mostValuablePart: data.mostValuablePart,
        mostValuablePartOther: data.mostValuablePart === 'other' ? data.mostValuablePartOther?.trim() : null,
        wouldRecommend: data.wouldRecommend,
        wantFeatured: data.wantFeatured,
        preferredCommunication: data.preferredCommunication,
        additionalComments: data.additionalComments?.trim() || null,
        recruitmentStage: 'new',
      })
      .returning();

    // Log activity
    await db.insert(activityLogs).values({
      action: ActivityType.SUBMIT_EX_AMBASSADOR_FORM,
      entityType: 'volunteer_form',
      entityId: submission.id,
      metadata: {
        type: 'ex_ambassador',
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
      },
    });

    // Send Slack notification
    try {
      await sendExAmbassadorSlackNotification({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        currentRoleTitle: data.currentRoleTitle,
        joinedSheSharpYear: data.joinedSheSharpYear,
        stillAmbassador: data.stillAmbassador,
        experienceRating: data.experienceRating,
        wouldRecommend: data.wouldRecommend,
      });
    } catch (err) {
      console.error('Slack notification error:', err);
    }

    // Send confirmation email
    try {
      const { sendApplicationConfirmationEmail } = await import('@/lib/email/recruitment-emails');
      await sendApplicationConfirmationEmail(data.email, {
        applicantName: `${data.firstName} ${data.lastName}`,
        applicantEmail: data.email,
        applicationType: 'ex_ambassador',
        submittedAt: now,
      });
    } catch (err) {
      console.error('Confirmation email error:', err);
    }

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error('Error submitting ex-ambassador form:', error);
    return { success: false, error: 'Failed to submit feedback. Please try again.' };
  }
}

/**
 * Checks if an existing submission exists for the given email and type.
 */
export async function getVolunteerFormByEmail(
  email: string,
  type: 'ambassador' | 'volunteer' | 'ex_ambassador'
): Promise<VolunteerFormSubmission | null> {
  const [form] = await db
    .select()
    .from(volunteerFormSubmissions)
    .where(
      and(
        eq(volunteerFormSubmissions.email, email.toLowerCase().trim()),
        eq(volunteerFormSubmissions.type, type)
      )
    )
    .limit(1);

  return form || null;
}
