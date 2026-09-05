import { NextRequest, NextResponse } from 'next/server';
import { submitPublicMenteeForm, type PublicMenteeFormData } from '@/lib/forms/service';
import { sendMenteeApplicationConfirmationEmail } from '@/lib/email/mentorship-emails';
import { z } from 'zod';

// Validation schema for public mentee form
const publicMenteeFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  gender: z.string().optional(),
  age: z.number().min(16).max(100).optional(),
  bio: z.string().optional(),
  // Location fields
  city: z.string().optional(),
  preferredMeetingFormat: z.string().optional(),
  // Career fields
  currentStage: z.string().optional(),
  currentJobTitle: z.string().optional(),
  currentIndustry: z.string().optional(),
  preferredIndustries: z.array(z.string()).optional(),
  // Skills
  softSkillsBasic: z.array(z.string()).optional(),
  industrySkillsBasic: z.array(z.string()).optional(),
  softSkillsExpert: z.array(z.string()).optional(),
  industrySkillsExpert: z.array(z.string()).optional(),
  // Goals
  longTermGoals: z.string().min(10, 'Please describe your long-term goals'),
  shortTermGoals: z.string().min(10, 'Please describe your short-term goals'),
  whyMentor: z.string().optional(),
  programExpectations: z.string().optional(),
  // Personality
  mbtiType: z.string().optional(),
  preferredMeetingFrequency: z.string().optional(),
  photoUrl: z.string().optional(),
  // Programme
  programmeSlug: z.string().optional(),
});

/**
 * POST /api/forms/mentee/public
 * Submits a public mentee application (no authentication required).
 * User will proceed to payment after form submission.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = publicMenteeFormSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data: PublicMenteeFormData = validation.data;

    const result = await submitPublicMenteeForm(data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, alreadyPaid: result.alreadyPaid ?? false },
        { status: 400 }
      );
    }

    // Fire-and-forget confirmation email
    sendMenteeApplicationConfirmationEmail(data.email, {
      applicantName: data.fullName,
      programmeName: result.programmeName,
      requiresPayment: result.requiresPayment ?? true,
    }).catch(err => console.error('Failed to send mentee confirmation email:', err));

    return NextResponse.json({
      success: true,
      submissionId: result.submissionId,
      requiresPayment: result.requiresPayment ?? true,
      message: result.requiresPayment === false
        ? 'Your application has been submitted successfully.'
        : 'Your application has been submitted successfully. Please proceed to payment.',
    });
  } catch (error) {
    console.error('Error processing public mentee form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/forms/mentee/public?id=<submissionId>
 *
 * The order summary the payment page shows the applicant before checkout. It is
 * unauthenticated because the applicant has no account yet.
 *
 * The `?email=<address>` lookup this handler also answered until 2026-09-06 is
 * gone. It told any anonymous caller whether a given person had applied to the
 * mentorship programme, with what status and when — a membership oracle over a
 * list of beneficiaries. Its only caller was the apply page's pre-flight check,
 * and `submitPublicMenteeForm()` already resolves a repeat application on POST:
 * it refuses one that is paid for or approved and otherwise updates the existing
 * row and returns its id. So the flow keeps working without the lookup.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { getMenteeFormById } = await import('@/lib/forms/service');
    const form = await getMenteeFormById(parseInt(id));

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json({
      exists: true,
      form: {
        id: form.id,
        email: form.email,
        fullName: form.fullName,
        status: form.status,
        paymentCompleted: form.paymentCompleted,
      },
    });
  } catch (error) {
    console.error('Error loading mentee form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
