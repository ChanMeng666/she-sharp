'use server';

import { db } from '@/lib/db/drizzle';
import {
  contactFormSubmissions,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { sendContactSlackNotification } from '@/lib/slack/service';

interface ContactFormData {
  fullName: string;
  email: string;
  organisation?: string;
  message: string;
}

interface SubmitResult {
  success: boolean;
  submissionId?: number;
  error?: string;
}

/**
 * Submits a contact form: inserts into DB, logs activity, and sends Slack notification.
 */
export async function submitContactForm(data: ContactFormData): Promise<SubmitResult> {
  try {
    const [submission] = await db
      .insert(contactFormSubmissions)
      .values({
        fullName: data.fullName.trim(),
        email: data.email.toLowerCase().trim(),
        organisation: data.organisation?.trim() || null,
        message: data.message.trim(),
        status: 'submitted',
      })
      .returning();

    // Log activity
    await db.insert(activityLogs).values({
      action: ActivityType.SUBMIT_CONTACT_FORM,
      entityType: 'contact_form',
      entityId: submission.id,
      metadata: {
        email: data.email,
        name: data.fullName,
      },
    });

    // Send Slack notification (non-blocking)
    try {
      await sendContactSlackNotification({
        fullName: data.fullName,
        email: data.email,
        organisation: data.organisation,
        message: data.message,
      });
    } catch (err) {
      console.error('Slack contact notification error:', err);
    }

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return { success: false, error: 'Failed to save contact submission.' };
  }
}
