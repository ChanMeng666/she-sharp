/**
 * AI Screening Service for volunteer/ambassador applications.
 * Uses OpenAI GPT-4o-mini to evaluate applicant fit and generate recommendations.
 */

import OpenAI from 'openai';
import { db } from '@/lib/db/drizzle';
import {
  volunteerFormSubmissions,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendAIScreeningNotification } from '@/lib/slack/service';

export interface AIScreeningResult {
  summary: string;
  recommendation: 'accept' | 'interview' | 'reject';
  confidence: number;
  strengths: string[];
  concerns: string[];
  reasoning: string;
}

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

const SCREENING_SYSTEM_PROMPT = `You are an application screening assistant for She Sharp, a non-profit organisation dedicated to bridging the gender gap in STEM fields. Your job is to evaluate volunteer and ambassador applications objectively and fairly.

Evaluate each application on these criteria:
1. **Motivation & Alignment**: Does the applicant show genuine interest in She Sharp's mission of empowering women in STEM?
2. **Commitment Level**: Is their stated availability realistic and sufficient for the role?
3. **Communication Quality**: Is the writing clear and thoughtful? Does it show effort?
4. **Background Fit**: Does their current status and experience align with the role?
5. **Skills & Value Add**: What skills or perspectives could they bring to the team?

Respond with a JSON object matching this exact structure:
{
  "summary": "A 1-2 sentence overall assessment",
  "recommendation": "accept" | "interview" | "reject",
  "confidence": 0-100,
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "reasoning": "Detailed reasoning for the recommendation"
}

Guidelines:
- Be generous with "accept" for volunteers — they have flexible commitment
- For ambassadors, lean toward "interview" to assess leadership potential
- Only recommend "reject" if there are clear red flags (spam, offensive content, completely irrelevant)
- Confidence should reflect how clearly the application supports your recommendation
- Keep strengths and concerns to 2-4 items each
- Be constructive and respectful in all assessments`;

function buildScreeningPrompt(submission: {
  type: string;
  firstName: string;
  lastName: string;
  email: string;
  currentStatus: string | null;
  currentStatusOther: string | null;
  organisation: string | null;
  howHeardAbout: string | null;
  howHeardAboutOption: string | null;
  skillSets: string | null;
  linkedinUrl: string | null;
  itIndustryInterest: string | null;
  volunteerHoursPerWeek: string | null;
  eventsPerYear: string | null;
}): string {
  const typeLabel = submission.type === 'ambassador' ? 'Ambassador' : 'Event Volunteer';
  const status = submission.currentStatusOther || submission.currentStatus || 'Not specified';
  const howHeard = submission.howHeardAbout || submission.howHeardAboutOption || 'Not specified';

  let prompt = `Please evaluate this ${typeLabel} application for She Sharp:

**Applicant**: ${submission.firstName} ${submission.lastName}
**Email**: ${submission.email}
**Current Status**: ${status}
**Organisation**: ${submission.organisation || 'Not specified'}
**How They Heard About She Sharp**: ${howHeard}
**Skills**: ${submission.skillSets || 'Not specified'}`;

  if (submission.type === 'ambassador') {
    prompt += `\n**LinkedIn**: ${submission.linkedinUrl || 'Not provided'}`;
    prompt += `\n**IT Industry Interest**: ${submission.itIndustryInterest || 'Not specified'}`;
    prompt += `\n**Hours Per Week Available**: ${submission.volunteerHoursPerWeek || 'Not specified'}`;
  } else {
    prompt += `\n**Events Per Year**: ${submission.eventsPerYear || 'Not specified'}`;
  }

  prompt += '\n\nPlease provide your screening assessment as JSON.';

  return prompt;
}

function parseScreeningResponse(content: string): AIScreeningResult {
  let jsonStr = content.trim();

  // Extract JSON from markdown code blocks if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // Validate required fields
  if (!parsed.summary || !parsed.recommendation || typeof parsed.confidence !== 'number') {
    throw new Error('Invalid AI screening response: missing required fields');
  }

  if (!['accept', 'interview', 'reject'].includes(parsed.recommendation)) {
    throw new Error(`Invalid recommendation value: ${parsed.recommendation}`);
  }

  return {
    summary: String(parsed.summary),
    recommendation: parsed.recommendation as 'accept' | 'interview' | 'reject',
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence))),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns.map(String) : [],
    reasoning: String(parsed.reasoning || ''),
  };
}

/**
 * Screens a single volunteer/ambassador application using AI.
 * Fetches the submission, calls OpenAI, stores the result, and sends notifications.
 */
export async function screenVolunteerApplication(
  submissionId: number,
  adminUserId: number
): Promise<AIScreeningResult> {
  // Fetch submission
  const [submission] = await db
    .select()
    .from(volunteerFormSubmissions)
    .where(eq(volunteerFormSubmissions.id, submissionId))
    .limit(1);

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  if (submission.type === 'ex_ambassador') {
    throw new Error('AI screening is not applicable to ex-ambassador feedback forms');
  }

  // Build prompt and call OpenAI
  const prompt = buildScreeningPrompt(submission);
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SCREENING_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const result = parseScreeningResponse(content);
  const now = new Date();

  // Store result in DB
  await db
    .update(volunteerFormSubmissions)
    .set({
      aiScreeningResult: result,
      aiScreenedAt: now,
    })
    .where(eq(volunteerFormSubmissions.id, submissionId));

  // Log activity
  await db.insert(activityLogs).values({
    action: ActivityType.AI_SCREEN_VOLUNTEER,
    userId: adminUserId,
    entityType: 'volunteer_form',
    entityId: submissionId,
    metadata: {
      recommendation: result.recommendation,
      confidence: result.confidence,
      summary: result.summary,
    },
  });

  // Send Slack notification (non-blocking)
  const typeLabel = submission.type === 'ambassador' ? 'Ambassador' : 'Event Volunteer';
  try {
    await sendAIScreeningNotification({
      applicantName: `${submission.firstName} ${submission.lastName}`,
      applicationType: typeLabel,
      recommendation: result.recommendation,
      confidence: result.confidence,
      summary: result.summary,
    });
  } catch (err) {
    console.error('AI screening Slack notification error:', err);
  }

  return result;
}

/**
 * Screens multiple applications in batch with rate limiting.
 */
export async function batchScreenApplications(
  submissionIds: number[],
  adminUserId: number
): Promise<Map<number, AIScreeningResult | { error: string }>> {
  const results = new Map<number, AIScreeningResult | { error: string }>();

  for (const id of submissionIds) {
    try {
      const result = await screenVolunteerApplication(id, adminUserId);
      results.set(id, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`AI screening failed for submission ${id}:`, message);
      results.set(id, { error: message });
    }

    // Rate limit: small delay between calls
    if (submissionIds.indexOf(id) < submissionIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}
