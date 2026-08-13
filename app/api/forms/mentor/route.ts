import { NextRequest, NextResponse } from 'next/server';
import { withRoles, type AuthedContext } from '@/lib/auth/role-middleware';
import {
  getMentorForm,
  saveMentorForm,
  submitMentorForm,
} from '@/lib/forms/service';
import { z } from 'zod';
import {
  genderEnum,
  meetingFormatEnum,
  bioMethodEnum,
  mbtiTypeEnum,
} from '@/lib/db/schema';
import { invalidBody } from '@/lib/api/validation';

/**
 * Draft-save schema: every answer is optional (this endpoint saves a partial
 * form), but the list is closed. The body used to be spread straight into the
 * `mentor_form_submissions` row, which let a signed-in caller set `status`,
 * `reviewedBy` or `userId` on their own application.
 */
const saveMentorFormSchema = z.object({
  fullName: z.string().nullish(),
  gender: z.enum(genderEnum.enumValues).nullish(),
  phone: z.string().nullish(),
  jobTitle: z.string().nullish(),
  company: z.string().nullish(),
  photoUrl: z.string().nullish(),
  city: z.string().nullish(),
  preferredMeetingFormat: z.enum(meetingFormatEnum.enumValues).nullish(),
  bioMethod: z.enum(bioMethodEnum.enumValues).nullish(),
  bio: z.string().nullish(),
  softSkillsBasic: z.array(z.string()).nullish(),
  industrySkillsBasic: z.array(z.string()).nullish(),
  softSkillsExpert: z.array(z.string()).nullish(),
  industrySkillsExpert: z.array(z.string()).nullish(),
  expectedMenteeGoalsLongTerm: z.string().nullish(),
  expectedMenteeGoalsShortTerm: z.string().nullish(),
  programExpectations: z.string().nullish(),
  preferredMenteeTypes: z.array(z.string()).nullish(),
  preferredIndustries: z.array(z.string()).nullish(),
  mbtiType: z.enum(mbtiTypeEnum.enumValues).nullish(),
  yearsExperience: z.number().int().nullish(),
  linkedinUrl: z.string().nullish(),
  availabilityHoursPerMonth: z.number().int().nullish(),
  maxMentees: z.number().int().nullish(),
});

/**
 * GET /api/forms/mentor
 * Gets the current user's mentor form.
 */
export const GET = withRoles({}, async (_request: NextRequest, { user }: AuthedContext) => {
  try {
    const form = await getMentorForm(user.id);
    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error getting mentor form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/forms/mentor
 * Saves mentor form data.
 */
export const POST = withRoles({}, async (request: NextRequest, { user }: AuthedContext) => {
  try {
    const parsed = saveMentorFormSchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidBody(parsed.error);
    }
    const result = await saveMentorForm(user.id, parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving mentor form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/forms/mentor
 * Submits mentor form for review.
 */
export const PUT = withRoles({}, async (_request: NextRequest, { user }: AuthedContext) => {
  try {
    const result = await submitMentorForm(user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting mentor form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
