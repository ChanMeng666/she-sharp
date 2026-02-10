'use server';

import { db } from '@/lib/db/drizzle';
import {
  volunteerFormSubmissions,
  activityLogs,
  ActivityType,
  type VolunteerFormSubmission,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendVolunteerSlackNotification } from '@/lib/slack/service';

export interface VolunteerFormData {
  type: 'ambassador' | 'volunteer';
  email: string;
  firstName: string;
  lastName: string;
  currentStatus: 'high_school_student' | 'university_student' | 'industry' | 'sponsor_partner' | 'other';
  currentStatusOther?: string;
  organisation?: string;
  howHeardAbout: string;
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
    // Check for existing submission with same email and type
    const existing = await getVolunteerFormByEmail(data.email, data.type);

    if (existing) {
      // Allow resubmission if previous was rejected
      if (existing.status !== 'rejected') {
        return {
          success: false,
          error: `You have already submitted an application with this email. Current status: ${existing.status}.`,
        };
      }
    }

    const now = new Date();

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
        howHeardAbout: data.howHeardAbout.trim(),
        skillSets: data.skillSets.trim(),
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

    // Send Slack notification (await to ensure it completes before serverless function exits)
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

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error('Error submitting volunteer form:', error);
    return { success: false, error: 'Failed to submit application. Please try again.' };
  }
}

/**
 * Checks if an existing submission exists for the given email and type.
 */
export async function getVolunteerFormByEmail(
  email: string,
  type: 'ambassador' | 'volunteer'
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
