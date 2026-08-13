import { NextRequest, NextResponse } from 'next/server';
import { withRoles, type AuthedContext } from '@/lib/auth/role-middleware';
import {
  getMenteeForm,
  saveMenteeForm,
  submitMenteeForm,
} from '@/lib/forms/service';
import { z } from 'zod';
import {
  genderEnum,
  meetingFormatEnum,
  careerStageEnum,
  mbtiTypeEnum,
} from '@/lib/db/schema';
import { invalidBody } from '@/lib/api/validation';

/**
 * Draft-save schema: every answer is optional (this endpoint saves a partial
 * form), but the list is closed. The body used to be spread straight into the
 * `mentee_form_submissions` row, which let a signed-in caller set `status`,
 * `paymentCompleted` or `reviewedBy` on their own application.
 */
const saveMenteeFormSchema = z.object({
  fullName: z.string().nullish(),
  gender: z.enum(genderEnum.enumValues).nullish(),
  age: z.number().int().nullish(),
  phone: z.string().nullish(),
  currentStage: z.enum(careerStageEnum.enumValues).nullish(),
  photoUrl: z.string().nullish(),
  bio: z.string().nullish(),
  city: z.string().nullish(),
  preferredMeetingFormat: z.enum(meetingFormatEnum.enumValues).nullish(),
  currentJobTitle: z.string().nullish(),
  currentIndustry: z.string().nullish(),
  preferredIndustries: z.array(z.string()).nullish(),
  softSkillsBasic: z.array(z.string()).nullish(),
  industrySkillsBasic: z.array(z.string()).nullish(),
  softSkillsExpert: z.array(z.string()).nullish(),
  industrySkillsExpert: z.array(z.string()).nullish(),
  longTermGoals: z.string().nullish(),
  shortTermGoals: z.string().nullish(),
  whyMentor: z.string().nullish(),
  programExpectations: z.string().nullish(),
  mbtiType: z.enum(mbtiTypeEnum.enumValues).nullish(),
  preferredMeetingFrequency: z.string().nullish(),
});

/**
 * GET /api/forms/mentee
 * Gets the current user's mentee form.
 */
export const GET = withRoles({}, async (_request: NextRequest, { user }: AuthedContext) => {
  try {
    const form = await getMenteeForm(user.id);
    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error getting mentee form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/forms/mentee
 * Saves mentee form data.
 */
export const POST = withRoles({}, async (request: NextRequest, { user }: AuthedContext) => {
  try {
    const parsed = saveMenteeFormSchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidBody(parsed.error);
    }
    const result = await saveMenteeForm(user.id, parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving mentee form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/forms/mentee
 * Submits mentee form.
 */
export const PUT = withRoles({}, async (_request: NextRequest, { user }: AuthedContext) => {
  try {
    const result = await submitMenteeForm(user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting mentee form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
