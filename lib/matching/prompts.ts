/**
 * AI Prompt Templates for Mentor-Mentee Matching
 */

import type { MentorMatchInput, MenteeMatchInput } from './types';

/**
 * System prompt for the AI matching assistant
 */
export const SYSTEM_PROMPT = `You are an expert mentor-mentee matching specialist for She Sharp, a non-profit organization dedicated to empowering women in STEM. Your task is to analyze mentor and mentee profiles and provide detailed compatibility assessments.

## About She Sharp
She Sharp bridges the gender gap in STEM through mentorship, networking events, and career development resources. With 2200+ members and 84+ events since 2014, we connect aspiring professionals with experienced mentors.

## Your Role
Analyze the compatibility between mentor and mentee profiles across multiple dimensions and provide actionable matching recommendations.

## Scoring Guidelines
- 90-100: Exceptional match with strong alignment across all factors. Highly recommended.
- 75-89: Good match with complementary strengths and clear mutual benefit.
- 60-74: Moderate match with some areas of alignment. Could work with effort.
- 40-59: Fair match requiring extra effort. Consider as backup option.
- Below 40: Poor match, not recommended.

## Evaluation Dimensions

1. **MBTI Compatibility (15% weight)**
   - Consider complementary cognitive functions
   - Evaluate communication style compatibility
   - Assess potential for productive mentor-mentee dynamic

2. **Skill Alignment (35% weight)**
   - Match mentor's expert skills with mentee's learning goals
   - Consider transferable skills
   - Evaluate depth of expertise vs. breadth of learning needs

3. **Goal Alignment (30% weight)**
   - Analyze career trajectory compatibility
   - Consider mentor's ability to guide mentee toward goals
   - Evaluate shared professional values

4. **Industry Match (10% weight)**
   - Direct industry experience is valuable but not required
   - Consider adjacent/related industries
   - Evaluate transferable industry knowledge

5. **Logistics (10% weight)**
   - Meeting format preferences (online/in-person/hybrid)
   - Location proximity for in-person meetings
   - Time availability considerations

## Response Format
Always respond with a valid JSON object. Be specific and actionable in your explanations.`;

/**
 * Build the user prompt for matching analysis
 */
export function buildMatchingPrompt(
  mentor: MentorMatchInput,
  mentee: MenteeMatchInput
): string {
  return `Analyze the compatibility between this mentor and mentee for a mentorship relationship.

## MENTOR PROFILE
- **Name**: ${mentor.name}
- **MBTI Type**: ${mentor.mbtiType || 'Not specified'}
- **Current Role**: ${mentor.jobTitle || 'Not specified'} at ${mentor.company || 'Not specified'}
- **Years of Experience**: ${mentor.yearsExperience || 'Not specified'}
- **Expert Soft Skills**: ${mentor.softSkillsExpert.join(', ') || 'None specified'}
- **Expert Industry Skills**: ${mentor.industrySkillsExpert.join(', ') || 'None specified'}
- **Basic Soft Skills**: ${mentor.softSkillsBasic.join(', ') || 'None specified'}
- **Basic Industry Skills**: ${mentor.industrySkillsBasic.join(', ') || 'None specified'}
- **Expected Mentee Goals (Long-term)**: ${mentor.expectedMenteeGoalsLongTerm || 'Not specified'}
- **Expected Mentee Goals (Short-term)**: ${mentor.expectedMenteeGoalsShortTerm || 'Not specified'}
- **Preferred Mentee Types**: ${mentor.preferredMenteeTypes.join(', ') || 'Any'}
- **Preferred Industries**: ${mentor.preferredIndustries.join(', ') || 'Any'}
- **Location**: ${mentor.city || 'Not specified'}
- **Meeting Preference**: ${mentor.preferredMeetingFormat || 'Flexible'}
- **Current Capacity**: ${mentor.currentMenteesCount}/${mentor.maxMentees} mentees

## MENTEE PROFILE
- **Name**: ${mentee.name}
- **MBTI Type**: ${mentee.mbtiType || 'Not specified'}
- **Career Stage**: ${mentee.currentStage || 'Not specified'}
- **Current Role**: ${mentee.currentJobTitle || 'Not specified'} in ${mentee.currentIndustry || 'Not specified'}
- **Learning Goals (Soft Skills)**: ${mentee.softSkillsBasic.join(', ') || 'None specified'}
- **Learning Goals (Industry Skills)**: ${mentee.industrySkillsBasic.join(', ') || 'None specified'}
- **Existing Expert Soft Skills**: ${mentee.softSkillsExpert.join(', ') || 'None'}
- **Existing Expert Industry Skills**: ${mentee.industrySkillsExpert.join(', ') || 'None'}
- **Long-term Goals**: ${mentee.longTermGoals || 'Not specified'}
- **Short-term Goals**: ${mentee.shortTermGoals || 'Not specified'}
- **Why Seeking Mentor**: ${mentee.whyMentor || 'Not specified'}
- **Preferred Industries**: ${mentee.preferredIndustries.join(', ') || 'Any'}
- **Location**: ${mentee.city || 'Not specified'}
- **Meeting Preference**: ${mentee.preferredMeetingFormat || 'Flexible'}

## REQUIRED OUTPUT FORMAT
Provide your analysis as a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "scores": {
    "mbtiCompatibility": <number 0-100>,
    "skillAlignment": <number 0-100>,
    "goalAlignment": <number 0-100>,
    "industryMatch": <number 0-100>,
    "logistics": <number 0-100>
  },
  "explanation": "<2-3 sentences explaining the overall match quality>",
  "recommendation": "<specific advice for this mentorship pair>",
  "confidenceLevel": "high" | "medium" | "low",
  "matchingFactors": {
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "challenges": ["<potential challenge 1>", "<potential challenge 2>"],
    "growthOpportunities": ["<opportunity 1>", "<opportunity 2>"]
  }
}`;
}

/**
 * Build batch matching prompt for multiple candidates
 */
export function buildBatchMatchingPrompt(
  pairs: Array<{ mentor: MentorMatchInput; mentee: MenteeMatchInput }>
): string {
  const pairDescriptions = pairs.map((pair, index) => {
    return `
## PAIR ${index + 1}

### MENTOR: ${pair.mentor.name}
- MBTI: ${pair.mentor.mbtiType || 'N/A'}
- Role: ${pair.mentor.jobTitle || 'N/A'} at ${pair.mentor.company || 'N/A'}
- Experience: ${pair.mentor.yearsExperience || 'N/A'} years
- Expert Skills: ${[...pair.mentor.softSkillsExpert, ...pair.mentor.industrySkillsExpert].join(', ') || 'N/A'}
- Location: ${pair.mentor.city || 'N/A'}, Meeting: ${pair.mentor.preferredMeetingFormat || 'Flexible'}
- Capacity: ${pair.mentor.currentMenteesCount}/${pair.mentor.maxMentees}

### MENTEE: ${pair.mentee.name}
- MBTI: ${pair.mentee.mbtiType || 'N/A'}
- Career Stage: ${pair.mentee.currentStage || 'N/A'}
- Current: ${pair.mentee.currentJobTitle || 'N/A'} in ${pair.mentee.currentIndustry || 'N/A'}
- Learning Goals: ${[...pair.mentee.softSkillsBasic, ...pair.mentee.industrySkillsBasic].join(', ') || 'N/A'}
- Location: ${pair.mentee.city || 'N/A'}, Meeting: ${pair.mentee.preferredMeetingFormat || 'Flexible'}`;
  }).join('\n\n---\n');

  return `Analyze the following ${pairs.length} mentor-mentee pairs and provide compatibility scores.

${pairDescriptions}

## REQUIRED OUTPUT FORMAT
Provide your analysis as a JSON array with ${pairs.length} objects, one for each pair in order:
[
  {
    "pairIndex": 1,
    "overallScore": <number>,
    "scores": {
      "mbtiCompatibility": <number>,
      "skillAlignment": <number>,
      "goalAlignment": <number>,
      "industryMatch": <number>,
      "logistics": <number>
    },
    "explanation": "<brief explanation>",
    "recommendation": "<brief recommendation>",
    "confidenceLevel": "high" | "medium" | "low",
    "matchingFactors": {
      "strengths": ["<str1>", "<str2>"],
      "challenges": ["<ch1>"],
      "growthOpportunities": ["<opp1>"]
    }
  },
  ...
]`;
}

/**
 * Extract and validate JSON from AI response
 */
export function extractJsonFromResponse(response: string): string {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  // Try to find JSON object or array directly
  const objectMatch = response.match(/\{[\s\S]*\}/);
  const arrayMatch = response.match(/\[[\s\S]*\]/);

  if (objectMatch && (!arrayMatch || objectMatch.index! < arrayMatch.index!)) {
    return objectMatch[0];
  }

  if (arrayMatch) {
    return arrayMatch[0];
  }

  return response.trim();
}

/**
 * Fix common JSON parsing errors
 */
export function fixCommonJsonErrors(json: string): string {
  return json
    .replace(/,\s*}/g, '}')     // Remove trailing commas before }
    .replace(/,\s*]/g, ']')     // Remove trailing commas before ]
    .replace(/'/g, '"')         // Convert single quotes to double quotes
    .replace(/(\w+):/g, '"$1":') // Add quotes to unquoted property names
    .replace(/""(\w+)""/g, '"$1"'); // Fix double-quoted property names
}
