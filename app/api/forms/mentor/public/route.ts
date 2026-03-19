import { NextRequest, NextResponse } from 'next/server';
import { submitPublicMentorForm, type PublicMentorFormData } from '@/lib/forms/service';
import { sendMentorApplicationConfirmationEmail } from '@/lib/email/mentorship-emails';
import { z } from 'zod';

// Validation schema for public mentor form
const publicMentorFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  gender: z.string().optional(),
  // Location fields for matching
  city: z.string().optional(),
  preferredMeetingFormat: z.string().optional(),
  // Professional info
  jobTitle: z.string().min(2, 'Job title is required'),
  company: z.string().min(2, 'Company is required'),
  yearsExperience: z.number().min(1, 'Years of experience is required'),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  // Bio
  bioMethod: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  // Skills
  softSkillsBasic: z.array(z.string()).optional(),
  softSkillsExpert: z.array(z.string()).min(2, 'Select at least 2 soft skills'),
  industrySkillsBasic: z.array(z.string()).optional(),
  industrySkillsExpert: z.array(z.string()).min(2, 'Select at least 2 industry skills'),
  // Goals and preferences
  expectedMenteeGoalsLongTerm: z.string().min(20, 'Please describe long-term goals'),
  expectedMenteeGoalsShortTerm: z.string().min(20, 'Please describe short-term goals'),
  programExpectations: z.string().optional(),
  preferredMenteeTypes: z.array(z.string()).optional(),
  preferredIndustries: z.array(z.string()).optional(),
  // Personality
  mbtiType: z.string().optional(),
  maxMentees: z.number().min(1).max(10),
  availabilityHoursPerMonth: z.number().min(1).max(40),
});

/**
 * POST /api/forms/mentor/public
 * Submits a public mentor application (no authentication required).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = publicMentorFormSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data: PublicMentorFormData = {
      ...validation.data,
      linkedinUrl: validation.data.linkedinUrl || undefined,
    };

    const result = await submitPublicMentorForm(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Fire-and-forget confirmation email
    sendMentorApplicationConfirmationEmail(data.email, {
      applicantName: data.fullName,
    }).catch(err => console.error('Failed to send mentor confirmation email:', err));

    return NextResponse.json({
      success: true,
      submissionId: result.submissionId,
      message: 'Your application has been submitted successfully. We will review it and get back to you within 5-7 business days.',
    });
  } catch (error) {
    console.error('Error processing public mentor form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/forms/mentor/public
 * Checks if an email already has a pending application.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Import inline to avoid circular dependencies
    const { getPublicMentorFormByEmail } = await import('@/lib/forms/service');
    const form = await getPublicMentorFormByEmail(email);

    if (!form) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      status: form.status,
      submittedAt: form.submittedAt,
    });
  } catch (error) {
    console.error('Error checking mentor form status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
