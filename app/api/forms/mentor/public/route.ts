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

// There is deliberately no GET handler. Until 2026-09-06 this route answered
// `GET ?email=<address>` for anyone, with no session and no rate limit, telling
// the caller whether that person had applied to be a She Sharp mentor and what
// their application status was. Nothing in the app ever called it. The apply
// page only POSTs, and `submitPublicMentorForm()` already handles a repeat
// application server-side, so the check was not needed to serve the flow.
