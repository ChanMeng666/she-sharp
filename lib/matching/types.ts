/**
 * AI Mentor-Mentee Matching System Type Definitions
 */

import { z } from 'zod';

// Queue status types
export type QueueStatus = 'waiting' | 'matching_in_progress' | 'matched' | 'expired' | 'cancelled';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type MatchStatus = 'pending_review' | 'approved' | 'rejected' | 'active' | 'expired';
export type RunType = 'on_demand' | 'batch' | 'queue_processing';

// Mentor input for AI matching
export interface MentorMatchInput {
  userId: number;
  name: string;
  mbtiType: string | null;
  company: string | null;
  jobTitle: string | null;
  yearsExperience: number | null;
  softSkillsExpert: string[];
  industrySkillsExpert: string[];
  softSkillsBasic: string[];
  industrySkillsBasic: string[];
  expectedMenteeGoalsLongTerm: string | null;
  expectedMenteeGoalsShortTerm: string | null;
  preferredMenteeTypes: string[];
  preferredIndustries: string[];
  city: string | null;
  preferredMeetingFormat: string | null;
  maxMentees: number;
  currentMenteesCount: number;
}

// Mentee input for AI matching
export interface MenteeMatchInput {
  userId: number;
  name: string;
  mbtiType: string | null;
  currentStage: string | null;
  currentJobTitle: string | null;
  currentIndustry: string | null;
  softSkillsBasic: string[];
  industrySkillsBasic: string[];
  softSkillsExpert: string[];
  industrySkillsExpert: string[];
  longTermGoals: string | null;
  shortTermGoals: string | null;
  whyMentor: string | null;
  preferredIndustries: string[];
  city: string | null;
  preferredMeetingFormat: string | null;
}

// AI Match Response from OpenAI
export interface AIMatchResponse {
  overallScore: number;
  scores: {
    mbtiCompatibility: number;
    skillAlignment: number;
    goalAlignment: number;
    industryMatch: number;
    logistics: number;
  };
  explanation: string;
  recommendation: string;
  confidenceLevel: ConfidenceLevel;
  matchingFactors: {
    strengths: string[];
    challenges: string[];
    growthOpportunities: string[];
  };
}

// Zod schema for AI response validation
export const AIMatchResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  scores: z.object({
    mbtiCompatibility: z.number().min(0).max(100),
    skillAlignment: z.number().min(0).max(100),
    goalAlignment: z.number().min(0).max(100),
    industryMatch: z.number().min(0).max(100),
    logistics: z.number().min(0).max(100),
  }),
  explanation: z.string(),
  recommendation: z.string(),
  confidenceLevel: z.enum(['high', 'medium', 'low']),
  matchingFactors: z.object({
    strengths: z.array(z.string()),
    challenges: z.array(z.string()),
    growthOpportunities: z.array(z.string()),
  }),
});

// Pre-filter result for deterministic screening
export interface PreFilterResult {
  mentorUserId: number;
  menteeUserId: number;
  preScore: number;
  passesFilter: boolean;
  capacityPenalty: number;
  reason?: string;
}

// Full match result combining pre-filter and AI analysis
export interface MatchResult {
  mentorUserId: number;
  menteeUserId: number;
  overallScore: number;
  mbtiScore: number;
  skillScore: number;
  goalScore: number;
  industryScore: number;
  logisticsScore: number;
  aiExplanation: string;
  aiRecommendation: string;
  confidenceLevel: ConfidenceLevel;
  matchingFactors: {
    mbti?: { mentorType: string; menteeType: string; compatibilityReason: string };
    skills?: { matchedSkills: string[]; complementarySkills: string[] };
    goals?: { alignedGoals: string[]; mentorCanHelp: string[] };
    industry?: { mentorIndustries: string[]; menteePreferred: string[]; overlap: string[] };
    strengths?: string[];
    challenges?: string[];
    growthOpportunities?: string[];
  };
  tokenUsage?: { prompt: number; completion: number; total: number };
  processingTimeMs?: number;
  preFilterScore?: number;
  fromCache?: boolean;
}

// Token usage tracking
export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

// Batch matching options
export interface BatchMatchingOptions {
  maxCandidatesPerMentee?: number;
  preFilterThreshold?: number;
  enableBatching?: boolean;
  notifyOnMatch?: boolean;
  limit?: number;
}

// Queue entry with user details
export interface QueueEntryWithDetails {
  id: number;
  menteeUserId: number;
  menteeName: string;
  menteeEmail: string;
  menteeImage: string | null;
  joinedAt: Date;
  status: QueueStatus;
  priority: number;
  bestMatchScore: number | null;
  matchAttempts: number;
  waitDays: number;
  preferredIndustries: string[];
  careerStage: string | null;
  isTestUser: boolean;
}

// Detailed mentor profile for match display
export interface MentorProfileDetails {
  bio: string | null;
  mbtiType: string | null;
  company: string | null;
  jobTitle: string | null;
  yearsExperience: number | null;
  city: string | null;
  maxMentees: number;
  currentMenteesCount: number;
  expertiseAreas: string[];
  softSkillsExpert: string[];
  industrySkillsExpert: string[];
  preferredIndustries: string[];
  preferredMeetingFormat: string | null;
}

// Detailed mentee profile for match display
export interface MenteeProfileDetails {
  bio: string | null;
  mbtiType: string | null;
  careerStage: string | null;
  currentJobTitle: string | null;
  currentIndustry: string | null;
  city: string | null;
  learningGoals: string[];
  softSkillsBasic: string[];
  industrySkillsBasic: string[];
  preferredIndustries: string[];
  longTermGoals: string | null;
  shortTermGoals: string | null;
  whyMentor: string | null;
  preferredMeetingFormat: string | null;
  currentChallenge: string | null;
}

// Match suggestion for admin review
export interface MatchSuggestionWithDetails {
  id: number;
  mentorUserId: number;
  menteeUserId: number;
  mentorName: string;
  mentorEmail: string;
  mentorImage: string | null;
  menteeName: string;
  menteeEmail: string;
  menteeImage: string | null;
  overallScore: number;
  mbtiCompatibilityScore: number | null;
  skillMatchScore: number | null;
  goalAlignmentScore: number | null;
  industryMatchScore: number | null;
  logisticsScore: number | null;
  aiExplanation: string | null;
  aiRecommendation: string | null;
  confidenceLevel: ConfidenceLevel | null;
  potentialChallenges: string[] | null;
  suggestedFocusAreas: string[] | null;
  matchingFactors: MatchResult['matchingFactors'] | null;
  status: MatchStatus;
  createdAt: Date;
  mentorProfile: MentorProfileDetails;
  menteeProfile: MenteeProfileDetails;
}

// Mentor with candidates for multi-mentee view
export interface MentorWithCandidates {
  mentorUserId: number;
  mentorName: string;
  mentorEmail: string;
  mentorImage: string | null;
  company: string | null;
  jobTitle: string | null;
  currentMentees: number;
  maxMentees: number;
  availableSlots: number;
  candidates: MatchSuggestionWithDetails[];
}

// Queue processing result
export interface QueueProcessingResult {
  processed: number;
  matched: number;
  addedToQueue: number;
  errors: Array<{ menteeId: number; error: string }>;
}

// Batch matching run result
export interface BatchMatchingResult {
  runId: number;
  totalProcessed: number;
  matchesGenerated: number;
  queueUpdates: number;
  cacheHits: number;
  errors: string[];
  averageScore: number;
  totalApiCalls: number;
  totalTokensUsed: number;
  averageProcessingTimeMs: number;
}

// Admin matching statistics
export interface MatchingStats {
  pendingMatches: number;
  approvedMatches: number;
  rejectedMatches: number;
  activeRelationships: number;
  averageMatchScore: number;
  queueLength: number;
  averageWaitDays: number;
  highPriorityCount: number;
}

// Email notification data
export interface MatchApprovalEmailData {
  mentorName: string;
  mentorEmail: string;
  menteeName: string;
  menteeEmail: string;
  matchScore: number;
  aiRecommendation: string | null;
  focusAreas: string[];
}

// Cache key types
export type CacheKeyType = 'match' | 'mentor_profiles' | 'queue_positions';

// OpenAI service options
export interface OpenAIServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  retryDelay?: number;
}
