import { NextRequest, NextResponse } from 'next/server';
import { submitVolunteerForm, submitExAmbassadorForm } from '@/lib/forms/volunteer-service';
import { z } from 'zod';

const volunteerCurrentStatuses = [
  'high_school_student', 'university_student', 'industry', 'sponsor_partner', 'other'
] as const;

const howHeardAboutOptions = [
  'attended_event', 'linkedin', 'word_of_mouth', 'search_engine', 'social_media', 'other'
] as const;

// Base schema for common fields (volunteer + ambassador)
const baseSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  currentStatus: z.enum(volunteerCurrentStatuses, { required_error: 'Please select your current status' }),
  currentStatusOther: z.string().optional(),
  organisation: z.string().optional(),
  howHeardAbout: z.string().optional(),
  howHeardAboutOption: z.enum(howHeardAboutOptions).optional(),
  howHeardAboutOther: z.string().optional(),
  skillSets: z.string().min(1, 'Please describe your skill sets'),
});

// Ambassador form schema
const ambassadorSchema = baseSchema.extend({
  type: z.literal('ambassador'),
  linkedinUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  itIndustryInterest: z.string().min(1, 'Please tell us what intrigues you about the IT industry'),
  volunteerHoursPerWeek: z.string().min(1, 'Please select your availability'),
  cvUrl: z.string().min(1, 'Please upload your CV'),
  cvFileName: z.string().optional(),
});

// Volunteer form schema
const volunteerSchema = baseSchema.extend({
  type: z.literal('volunteer'),
  eventsPerYear: z.string().min(1, 'Please select your availability'),
});

// Ex-ambassador form schema
const exAmbassadorSchema = z.object({
  type: z.literal('ex_ambassador'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  currentRoleTitle: z.string().optional(),
  joinedSheSharpYear: z.number().int().min(2010).max(new Date().getFullYear()),
  leftRoleYear: z.number().int().min(2010).max(new Date().getFullYear()).optional(),
  stillAmbassador: z.boolean(),
  experienceRating: z.enum(['excellent', 'good', 'average', 'below_average', 'poor']),
  mostValuablePart: z.string().min(1),
  mostValuablePartOther: z.string().optional(),
  wouldRecommend: z.boolean(),
  wantFeatured: z.boolean(),
  preferredCommunication: z.enum(['email', 'phone']),
  additionalComments: z.string().optional(),
});

// Discriminated union for all form types
const formSchema = z.discriminatedUnion('type', [ambassadorSchema, volunteerSchema, exAmbassadorSchema])
  .refine(
    (data) => {
      if (data.type === 'ex_ambassador') return true;
      return data.currentStatus !== 'other' || (data.currentStatusOther && data.currentStatusOther.trim().length > 0);
    },
    { message: 'Please specify your current status', path: ['currentStatusOther'] }
  );

/**
 * POST /api/forms/volunteer/public
 * Submits a volunteer, ambassador, or ex-ambassador application (no authentication required).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = formSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const data = validation.data;

    if (data.type === 'ex_ambassador') {
      const result = await submitExAmbassadorForm(data);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        submissionId: result.submissionId,
        message: 'Thank you for sharing your experience with us!',
      });
    }

    // Volunteer or Ambassador
    const result = await submitVolunteerForm({
      ...data,
      howHeardAbout: data.howHeardAbout || '',
      skillSets: data.skillSets,
      linkedinUrl: 'linkedinUrl' in data ? (data.linkedinUrl || undefined) : undefined,
      cvFileName: 'cvFileName' in data ? data.cvFileName : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      submissionId: result.submissionId,
      message: 'Your application has been submitted successfully. We will review it and get back to you soon.',
    });
  } catch (error) {
    console.error('Error processing volunteer form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// There is deliberately no GET handler. Until 2026-09-06 this route answered
// `GET ?email=<address>&type=<role>` for anyone, with no session and no rate
// limit, telling the caller whether that person had applied to volunteer for
// She Sharp and what their application status was. Nothing in the app ever
// called it — both apply pages only POST, and `submitVolunteerForm()` /
// `submitExAmbassadorForm()` already look up an existing submission by email
// server-side.
