/**
 * OpenAI Integration Service for AI Matching
 * Uses GPT-4o-mini for intelligent mentor-mentee compatibility analysis
 */

import OpenAI from 'openai';
import type {
  MentorMatchInput,
  MenteeMatchInput,
  AIMatchResponse,
  TokenUsage,
  OpenAIServiceOptions,
} from './types';
import { AIMatchResponseSchema } from './types';
import {
  SYSTEM_PROMPT,
  buildMatchingPrompt,
  extractJsonFromResponse,
  fixCommonJsonErrors,
} from './prompts';
import { getCachedAIMatch, setCachedAIMatch } from './cache';

// Default options
const DEFAULT_OPTIONS: Required<OpenAIServiceOptions> = {
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 1000,
  maxRetries: 3,
  retryDelay: 1000,
};

// Initialize OpenAI client (lazy)
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

/**
 * Error types for matching
 */
export class AIMatchingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIMatchingError';
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is rate limit related
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('429') ||
           error.message.includes('rate_limit') ||
           error.message.includes('Rate limit');
  }
  return false;
}

/**
 * Check if error is timeout related
 */
function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('timeout') ||
           error.message.includes('ETIMEDOUT') ||
           error.message.includes('ECONNRESET');
  }
  return false;
}

/**
 * Parse and validate AI response
 */
function parseAIResponse(content: string): AIMatchResponse {
  // Extract JSON from response
  let jsonStr = extractJsonFromResponse(content);

  // Try to parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Try fixing common errors
    jsonStr = fixCommonJsonErrors(jsonStr);
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      throw new AIMatchingError(
        'Failed to parse AI response as JSON',
        'PARSE_ERROR',
        false
      );
    }
  }

  // Validate with Zod schema
  const result = AIMatchResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.error('Zod validation errors:', result.error.errors);
    throw new AIMatchingError(
      `AI response validation failed: ${result.error.errors.map(e => e.message).join(', ')}`,
      'VALIDATION_ERROR',
      false
    );
  }

  return result.data;
}

/**
 * Generate AI match analysis for a mentor-mentee pair
 */
export async function generateAIMatch(
  mentor: MentorMatchInput,
  mentee: MenteeMatchInput,
  options: OpenAIServiceOptions = {}
): Promise<{
  result: AIMatchResponse;
  usage: TokenUsage;
  processingTime: number;
  fromCache: boolean;
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check cache first
  const cached = await getCachedAIMatch(mentor.userId, mentee.userId);
  if (cached) {
    return {
      result: cached,
      usage: { prompt: 0, completion: 0, total: 0 },
      processingTime: 0,
      fromCache: true,
    };
  }

  const startTime = Date.now();
  const prompt = buildMatchingPrompt(mentor, mentee);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      const openai = getOpenAI();

      const response = await openai.chat.completions.create({
        model: opts.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIMatchingError('Empty response from OpenAI', 'EMPTY_RESPONSE', true);
      }

      const result = parseAIResponse(content);
      const processingTime = Date.now() - startTime;

      const usage: TokenUsage = {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      };

      // Cache the result
      await setCachedAIMatch(mentor.userId, mentee.userId, result);

      return {
        result,
        usage,
        processingTime,
        fromCache: false,
      };
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (isRateLimitError(error) || isTimeoutError(error)) {
        if (attempt < opts.maxRetries) {
          // Exponential backoff
          const delay = opts.retryDelay * Math.pow(2, attempt - 1);
          console.warn(`AI matching attempt ${attempt} failed, retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
      }

      // Non-retryable error or max retries reached
      break;
    }
  }

  throw new AIMatchingError(
    `AI matching failed after ${opts.maxRetries} attempts: ${lastError?.message}`,
    'MAX_RETRIES_EXCEEDED',
    false
  );
}

/**
 * Generate AI matches for multiple pairs (batch processing)
 */
export async function generateAIMatchesBatch(
  pairs: Array<{ mentor: MentorMatchInput; mentee: MenteeMatchInput }>,
  options: OpenAIServiceOptions & { maxConcurrent?: number } = {}
): Promise<Map<string, { result: AIMatchResponse; usage: TokenUsage; processingTime: number; fromCache: boolean }>> {
  const { maxConcurrent = 5, ...aiOptions } = options;
  const results = new Map<string, { result: AIMatchResponse; usage: TokenUsage; processingTime: number; fromCache: boolean }>();

  // Process in batches to respect rate limits
  for (let i = 0; i < pairs.length; i += maxConcurrent) {
    const batch = pairs.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (pair) => {
      const key = `${pair.mentor.userId}:${pair.mentee.userId}`;
      try {
        const result = await generateAIMatch(pair.mentor, pair.mentee, aiOptions);
        results.set(key, result);
      } catch (error) {
        console.error(`AI matching failed for pair ${key}:`, error);
        // Don't add to results, will be handled as missing
      }
    });

    await Promise.all(batchPromises);

    // Small delay between batches to be nice to the API
    if (i + maxConcurrent < pairs.length) {
      await sleep(100);
    }
  }

  return results;
}

/**
 * Fallback rule-based scoring when AI is unavailable
 */
export function calculateFallbackScore(
  mentor: MentorMatchInput,
  mentee: MenteeMatchInput
): AIMatchResponse {
  // Simple rule-based scoring as fallback

  // MBTI compatibility (simplified)
  const mbtiScore = mentor.mbtiType && mentee.mbtiType ? 60 : 50;

  // Skill alignment
  const mentorSkills = new Set([
    ...mentor.softSkillsExpert.map(s => s.toLowerCase()),
    ...mentor.industrySkillsExpert.map(s => s.toLowerCase()),
  ]);
  const menteeDesiredSkills = [
    ...mentee.softSkillsBasic.map(s => s.toLowerCase()),
    ...mentee.industrySkillsBasic.map(s => s.toLowerCase()),
  ];
  const matchedSkillsCount = menteeDesiredSkills.filter(s => mentorSkills.has(s)).length;
  const skillScore = menteeDesiredSkills.length > 0
    ? Math.round((matchedSkillsCount / menteeDesiredSkills.length) * 100)
    : 50;

  // Industry match
  const industryScore = mentor.preferredIndustries.some(
    i => mentee.preferredIndustries.includes(i)
  ) ? 80 : 50;

  // Logistics
  let logisticsScore = 70; // Default moderate
  if (mentor.city && mentee.city && mentor.city.toLowerCase() === mentee.city.toLowerCase()) {
    logisticsScore = 90;
  }
  if (mentor.preferredMeetingFormat === 'online' || mentee.preferredMeetingFormat === 'online') {
    logisticsScore = Math.max(logisticsScore, 80);
  }

  // Goal alignment (simplified - would need NLP for real analysis)
  const goalScore = 50; // Default without AI analysis

  // Overall weighted score
  const overallScore = Math.round(
    mbtiScore * 0.15 +
    skillScore * 0.35 +
    goalScore * 0.30 +
    industryScore * 0.10 +
    logisticsScore * 0.10
  );

  return {
    overallScore,
    scores: {
      mbtiCompatibility: mbtiScore,
      skillAlignment: skillScore,
      goalAlignment: goalScore,
      industryMatch: industryScore,
      logistics: logisticsScore,
    },
    explanation: 'Match generated using rule-based algorithm (AI unavailable). Manual review recommended.',
    recommendation: 'Please review mentor and mentee profiles manually to assess compatibility.',
    confidenceLevel: 'low',
    matchingFactors: {
      strengths: skillScore > 60 ? ['Skill alignment'] : [],
      challenges: ['AI analysis unavailable - limited insights'],
      growthOpportunities: ['Potential for skill development'],
    },
  };
}

/**
 * Generate AI match with fallback to rule-based scoring
 */
export async function generateAIMatchWithFallback(
  mentor: MentorMatchInput,
  mentee: MenteeMatchInput,
  options: OpenAIServiceOptions = {}
): Promise<{
  result: AIMatchResponse;
  usage: TokenUsage;
  processingTime: number;
  fromCache: boolean;
  usedFallback: boolean;
}> {
  try {
    const result = await generateAIMatch(mentor, mentee, options);
    return { ...result, usedFallback: false };
  } catch (error) {
    console.warn('AI matching failed, using fallback scoring:', error);
    const fallbackResult = calculateFallbackScore(mentor, mentee);
    return {
      result: fallbackResult,
      usage: { prompt: 0, completion: 0, total: 0 },
      processingTime: 0,
      fromCache: false,
      usedFallback: true,
    };
  }
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
