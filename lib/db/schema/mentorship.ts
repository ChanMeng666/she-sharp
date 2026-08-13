/**
 * Mentorship: programmes, mentor/mentee profiles and applications,
 * relationships, meetings, the matching queue and the AI matching records.
 */
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  index,
  boolean,
  jsonb,
  decimal,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import {
  bioMethodEnum,
  careerStageEnum,
  confidenceLevelEnum,
  formStatusEnum,
  genderEnum,
  matchStatusEnum,
  mbtiTypeEnum,
  meetingFormatEnum,
  meetingStatusEnum,
  meetingTypeEnum,
  programmeStatusEnum,
  queueStatusEnum,
  relationshipStatusEnum,
} from './enums';
import { users } from './users';

// ============================================================================
// PROGRAMME MANAGEMENT
// ============================================================================

// Programmes table
export const programmes = pgTable('programmes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  status: programmeStatusEnum('status').notNull().default('draft'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  applicationDeadline: timestamp('application_deadline'),
  maxMentees: integer('max_mentees'),
  currentMenteeCount: integer('current_mentee_count').notNull().default(0),
  requiresPayment: boolean('requires_payment').notNull().default(true),
  partnerOrganisation: varchar('partner_organisation', { length: 200 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('programmes_slug_idx').on(table.slug),
  statusIdx: index('programmes_status_idx').on(table.status),
}));

// Mentor programme assignments
export const mentorProgrammeAssignments = pgTable('mentor_programme_assignments', {
  id: serial('id').primaryKey(),
  mentorUserId: integer('mentor_user_id').notNull().references(() => users.id),
  programmeId: integer('programme_id').notNull().references(() => programmes.id),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  assignedBy: integer('assigned_by').references(() => users.id),
  maxMenteesInProgramme: integer('max_mentees_in_programme').default(2),
  currentMenteesInProgramme: integer('current_mentees_in_programme').notNull().default(0),
  notes: text('notes'),
}, (table) => ({
  mentorProgrammeUnique: unique().on(table.mentorUserId, table.programmeId),
  mentorIdx: index('mentor_programme_mentor_idx').on(table.mentorUserId),
  programmeIdx: index('mentor_programme_programme_idx').on(table.programmeId),
}));

// Mentor profiles
export const mentorProfiles = pgTable('mentor_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  expertiseAreas: jsonb('expertise_areas').$type<string[]>(),
  yearsExperience: integer('years_experience'),
  company: varchar('company', { length: 200 }),
  jobTitle: varchar('job_title', { length: 200 }),
  bio: text('bio'),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  availabilityHoursPerMonth: integer('availability_hours_per_month'),
  maxMentees: integer('max_mentees').default(3),
  currentMenteesCount: integer('current_mentees_count').default(0),
  isAcceptingMentees: boolean('is_accepting_mentees').default(true),
  profileCompletedAt: timestamp('profile_completed_at'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: integer('verified_by').references(() => users.id),
  // New fields for business logic update
  mbtiType: mbtiTypeEnum('mbti_type'),
  photoUrl: varchar('photo_url', { length: 500 }),
  formSubmissionId: integer('form_submission_id'), // FK added after mentorFormSubmissions table
}, (table) => ({
  userIdIdx: index('mentor_profiles_user_id_idx').on(table.userId),
}));

// Mentee profiles
export const menteeProfiles = pgTable('mentee_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  learningGoals: jsonb('learning_goals').$type<string[]>(),
  careerStage: varchar('career_stage', { length: 100 }),
  preferredExpertiseAreas: jsonb('preferred_expertise_areas').$type<string[]>(),
  preferredMeetingFrequency: varchar('preferred_meeting_frequency', { length: 50 }),
  bio: text('bio'),
  currentChallenge: text('current_challenge'),
  profileCompletedAt: timestamp('profile_completed_at'),
  // New fields for business logic update
  mbtiType: mbtiTypeEnum('mbti_type'),
  photoUrl: varchar('photo_url', { length: 500 }),
  formSubmissionId: integer('form_submission_id'), // FK added after menteeFormSubmissions table
}, (table) => ({
  userIdIdx: index('mentee_profiles_user_id_idx').on(table.userId),
}));

// Mentorship relationships
export const mentorshipRelationships = pgTable('mentorship_relationships', {
  id: serial('id').primaryKey(),
  mentorUserId: integer('mentor_user_id').notNull().references(() => users.id),
  menteeUserId: integer('mentee_user_id').notNull().references(() => users.id),
  status: relationshipStatusEnum('status').notNull().default('pending'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  pausedAt: timestamp('paused_at'),
  meetingFrequency: varchar('meeting_frequency', { length: 50 }),
  nextMeetingDate: timestamp('next_meeting_date'),
  relationshipGoals: text('relationship_goals'),
  mentorNotes: text('mentor_notes'),
  menteeNotes: text('mentee_notes'),
  programmeId: integer('programme_id').references(() => programmes.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  mentorIdx: index('relationships_mentor_idx').on(table.mentorUserId),
  menteeIdx: index('relationships_mentee_idx').on(table.menteeUserId),
  statusIdx: index('relationships_status_idx').on(table.status),
  programmeIdx: index('relationships_programme_idx').on(table.programmeId),
}));

// Meetings
export const meetings = pgTable('meetings', {
  id: serial('id').primaryKey(),
  relationshipId: integer('relationship_id').notNull().references(() => mentorshipRelationships.id),
  scheduledAt: timestamp('scheduled_at').notNull(),
  durationMinutes: integer('duration_minutes').default(60),
  meetingType: meetingTypeEnum('meeting_type').notNull().default('regular'),
  meetingLink: varchar('meeting_link', { length: 500 }),
  status: meetingStatusEnum('status').notNull().default('scheduled'),
  
  // Meeting records
  topicsDiscussed: jsonb('topics_discussed').$type<string[]>(),
  goalsSet: jsonb('goals_set').$type<string[]>(),
  actionItems: jsonb('action_items').$type<{task: string; deadline?: string; completed?: boolean}[]>(),
  mentorNotes: text('mentor_notes'),
  menteeFeedback: text('mentee_feedback'),
  rating: integer('rating'),
  
  // Statistics
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  recordingUrl: varchar('recording_url', { length: 500 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  relationshipIdx: index('meetings_relationship_idx').on(table.relationshipId),
  scheduledAtIdx: index('meetings_scheduled_at_idx').on(table.scheduledAt),
  statusIdx: index('meetings_status_idx').on(table.status),
}));

// ============================================================================
// APPLICATION FORMS
// ============================================================================

// Mentor form submissions
export const mentorFormSubmissions = pgTable('mentor_form_submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').unique().references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }), // For pre-registration submissions
  status: formStatusEnum('status').notNull().default('not_started'),
  lastSavedAt: timestamp('last_saved_at'),
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  // Personal info
  fullName: varchar('full_name', { length: 200 }),
  gender: genderEnum('gender'),
  phone: varchar('phone', { length: 50 }),
  jobTitle: varchar('job_title', { length: 200 }),
  company: varchar('company', { length: 200 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  photoUploadedAt: timestamp('photo_uploaded_at'),
  // Location (for matching)
  city: varchar('city', { length: 100 }),
  preferredMeetingFormat: meetingFormatEnum('preferred_meeting_format'),
  // Bio
  bioMethod: bioMethodEnum('bio_method'),
  bio: text('bio'),
  // Skills (JSONB for flexibility)
  softSkillsBasic: jsonb('soft_skills_basic').$type<string[]>(),
  industrySkillsBasic: jsonb('industry_skills_basic').$type<string[]>(),
  softSkillsExpert: jsonb('soft_skills_expert').$type<string[]>(),
  industrySkillsExpert: jsonb('industry_skills_expert').$type<string[]>(),
  // Goals and expectations
  expectedMenteeGoalsLongTerm: text('expected_mentee_goals_long_term'),
  expectedMenteeGoalsShortTerm: text('expected_mentee_goals_short_term'),
  programExpectations: text('program_expectations'),
  // Preferences
  preferredMenteeTypes: jsonb('preferred_mentee_types').$type<string[]>(),
  preferredIndustries: jsonb('preferred_industries').$type<string[]>(),
  // MBTI
  mbtiType: mbtiTypeEnum('mbti_type'),
  // Other
  yearsExperience: integer('years_experience'),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  availabilityHoursPerMonth: integer('availability_hours_per_month'),
  maxMentees: integer('max_mentees').default(3),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('mentor_form_submissions_user_id_idx').on(table.userId),
  statusIdx: index('mentor_form_submissions_status_idx').on(table.status),
  emailIdx: index('mentor_form_submissions_email_idx').on(table.email),
}));

// Mentee form submissions
export const menteeFormSubmissions = pgTable('mentee_form_submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').unique().references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }), // For pre-registration submissions
  status: formStatusEnum('status').notNull().default('not_started'),
  lastSavedAt: timestamp('last_saved_at'),
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  // Payment tracking (for pre-registration flow)
  paymentCompleted: boolean('payment_completed').default(false),
  paymentCompletedAt: timestamp('payment_completed_at'),
  purchaseId: integer('purchase_id'), // FK to membershipPurchases
  invitationCodeId: integer('invitation_code_id'), // FK to invitationCodes
  // Personal info
  fullName: varchar('full_name', { length: 200 }),
  gender: genderEnum('gender'),
  age: integer('age'),
  phone: varchar('phone', { length: 50 }),
  currentStage: careerStageEnum('current_stage'),
  photoUrl: varchar('photo_url', { length: 500 }),
  photoUploadedAt: timestamp('photo_uploaded_at'),
  bio: text('bio'),
  // Location (for matching)
  city: varchar('city', { length: 100 }),
  preferredMeetingFormat: meetingFormatEnum('preferred_meeting_format'),
  // Professional background
  currentJobTitle: varchar('current_job_title', { length: 200 }),
  currentIndustry: varchar('current_industry', { length: 200 }),
  preferredIndustries: jsonb('preferred_industries').$type<string[]>(),
  // Skills
  softSkillsBasic: jsonb('soft_skills_basic').$type<string[]>(),
  industrySkillsBasic: jsonb('industry_skills_basic').$type<string[]>(),
  softSkillsExpert: jsonb('soft_skills_expert').$type<string[]>(),
  industrySkillsExpert: jsonb('industry_skills_expert').$type<string[]>(),
  // Goals
  longTermGoals: text('long_term_goals'),
  shortTermGoals: text('short_term_goals'),
  whyMentor: text('why_mentor'),
  programExpectations: text('program_expectations'),
  // MBTI
  mbtiType: mbtiTypeEnum('mbti_type'),
  preferredMeetingFrequency: varchar('preferred_meeting_frequency', { length: 50 }),
  programmeId: integer('programme_id').references(() => programmes.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('mentee_form_submissions_user_id_idx').on(table.userId),
  statusIdx: index('mentee_form_submissions_status_idx').on(table.status),
  emailIdx: index('mentee_form_submissions_email_idx').on(table.email),
  paymentIdx: index('mentee_form_submissions_payment_idx').on(table.paymentCompleted),
  programmeIdx: index('mentee_form_submissions_programme_idx').on(table.programmeId),
}));

// ============================================================================
// MATCHING
// ============================================================================

// Mentee waiting queue for AI matching
export const menteeWaitingQueue = pgTable('mentee_waiting_queue', {
  id: serial('id').primaryKey(),
  menteeUserId: integer('mentee_user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  status: queueStatusEnum('status').notNull().default('waiting'),
  priority: integer('priority').default(0),
  bestMatchScore: decimal('best_match_score', { precision: 5, scale: 2 }),
  matchAttempts: integer('match_attempts').default(0),
  lastMatchAttemptAt: timestamp('last_match_attempt_at'),
  notifiedAt: timestamp('notified_at'),
  expiresAt: timestamp('expires_at'),
  notes: text('notes'),
  programmeId: integer('programme_id').references(() => programmes.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  menteeUserIdIdx: index('waiting_queue_mentee_user_id_idx').on(table.menteeUserId),
  statusIdx: index('waiting_queue_status_idx').on(table.status),
  priorityIdx: index('waiting_queue_priority_idx').on(table.priority),
  bestScoreIdx: index('waiting_queue_best_score_idx').on(table.bestMatchScore),
  programmeIdx: index('waiting_queue_programme_idx').on(table.programmeId),
}));

// AI match results
export const aiMatchResults = pgTable('ai_match_results', {
  id: serial('id').primaryKey(),
  mentorUserId: integer('mentor_user_id').notNull().references(() => users.id),
  menteeUserId: integer('mentee_user_id').notNull().references(() => users.id),
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }).notNull(),
  mbtiCompatibilityScore: decimal('mbti_compatibility_score', { precision: 5, scale: 2 }),
  skillMatchScore: decimal('skill_match_score', { precision: 5, scale: 2 }),
  goalAlignmentScore: decimal('goal_alignment_score', { precision: 5, scale: 2 }),
  industryMatchScore: decimal('industry_match_score', { precision: 5, scale: 2 }),
  // New fields for OpenAI integration
  logisticsScore: decimal('logistics_score', { precision: 5, scale: 2 }),
  aiExplanation: text('ai_explanation'),
  aiRecommendation: text('ai_recommendation'),
  confidenceLevel: confidenceLevelEnum('confidence_level'),
  potentialChallenges: jsonb('potential_challenges').$type<string[]>(),
  suggestedFocusAreas: jsonb('suggested_focus_areas').$type<string[]>(),
  processingTimeMs: integer('processing_time_ms'),
  tokenUsage: jsonb('token_usage').$type<{ prompt: number; completion: number; total: number }>(),
  matchingFactors: jsonb('matching_factors').$type<{
    mbti?: { mentorType: string; menteeType: string; compatibilityReason: string };
    skills?: { matchedSkills: string[]; complementarySkills: string[] };
    goals?: { alignedGoals: string[]; mentorCanHelp: string[] };
    industry?: { mentorIndustries: string[]; menteePreferred: string[]; overlap: string[] };
    strengths?: string[];
    challenges?: string[];
    growthOpportunities?: string[];
  }>(),
  aiModelVersion: varchar('ai_model_version', { length: 50 }),
  matchingAlgorithm: varchar('matching_algorithm', { length: 100 }),
  status: matchStatusEnum('status').notNull().default('pending_review'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  relationshipId: integer('relationship_id').references(() => mentorshipRelationships.id),
  programmeId: integer('programme_id').references(() => programmes.id),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  mentorMenteeUnique: unique().on(table.mentorUserId, table.menteeUserId),
  mentorIdx: index('ai_match_results_mentor_idx').on(table.mentorUserId),
  menteeIdx: index('ai_match_results_mentee_idx').on(table.menteeUserId),
  statusIdx: index('ai_match_results_status_idx').on(table.status),
  scoreIdx: index('ai_match_results_score_idx').on(table.overallScore),
  programmeIdx: index('ai_match_results_programme_idx').on(table.programmeId),
}));

// AI matching runs (batch records)
export const aiMatchingRuns = pgTable('ai_matching_runs', {
  id: serial('id').primaryKey(),
  runType: varchar('run_type', { length: 50 }).notNull(), // 'on_demand' | 'batch' | 'queue_processing'
  status: varchar('status', { length: 50 }).notNull().default('running'), // 'running' | 'completed' | 'failed'
  menteesProcessed: integer('mentees_processed').default(0),
  matchesGenerated: integer('matches_generated').default(0),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  triggeredBy: integer('triggered_by').references(() => users.id),
  // New fields for enhanced tracking
  menteeUserId: integer('mentee_user_id').references(() => users.id), // For on-demand single mentee runs
  totalApiCalls: integer('total_api_calls').default(0),
  totalTokensUsed: integer('total_tokens_used').default(0),
  averageProcessingTimeMs: integer('average_processing_time_ms'),
  errorDetails: jsonb('error_details').$type<{ errors: Array<{ menteeId: number; error: string; timestamp: string }> }>(),
  programmeId: integer('programme_id').references(() => programmes.id),
  summary: jsonb('summary').$type<{
    totalMentees: number;
    totalMentors: number;
    matchesCreated: number;
    averageScore: number;
    queueUpdates?: number;
    cacheHits?: number;
    errors: string[];
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const mentorProfilesRelations = relations(mentorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [mentorProfiles.userId],
    references: [users.id],
  }),
  verifiedBy: one(users, {
    fields: [mentorProfiles.verifiedBy],
    references: [users.id],
    relationName: 'verifier',
  }),
}));

export const menteeProfilesRelations = relations(menteeProfiles, ({ one }) => ({
  user: one(users, {
    fields: [menteeProfiles.userId],
    references: [users.id],
  }),
}));

export const mentorshipRelationshipsRelations = relations(mentorshipRelationships, ({ one, many }) => ({
  mentor: one(users, {
    fields: [mentorshipRelationships.mentorUserId],
    references: [users.id],
    relationName: 'mentor',
  }),
  mentee: one(users, {
    fields: [mentorshipRelationships.menteeUserId],
    references: [users.id],
    relationName: 'mentee',
  }),
  meetings: many(meetings),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  relationship: one(mentorshipRelationships, {
    fields: [meetings.relationshipId],
    references: [mentorshipRelationships.id],
  }),
}));

export const programmesRelations = relations(programmes, ({ many }) => ({
  mentorAssignments: many(mentorProgrammeAssignments),
  menteeFormSubmissions: many(menteeFormSubmissions),
  mentorshipRelationships: many(mentorshipRelationships),
  waitingQueue: many(menteeWaitingQueue),
  matchResults: many(aiMatchResults),
}));

export const mentorProgrammeAssignmentsRelations = relations(mentorProgrammeAssignments, ({ one }) => ({
  mentor: one(users, {
    fields: [mentorProgrammeAssignments.mentorUserId],
    references: [users.id],
  }),
  programme: one(programmes, {
    fields: [mentorProgrammeAssignments.programmeId],
    references: [programmes.id],
  }),
  assignedByUser: one(users, {
    fields: [mentorProgrammeAssignments.assignedBy],
    references: [users.id],
    relationName: 'programmeAssigner',
  }),
}));

export const mentorFormSubmissionsRelations = relations(mentorFormSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [mentorFormSubmissions.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [mentorFormSubmissions.reviewedBy],
    references: [users.id],
    relationName: 'mentorFormReviewer',
  }),
}));

export const menteeFormSubmissionsRelations = relations(menteeFormSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [menteeFormSubmissions.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [menteeFormSubmissions.reviewedBy],
    references: [users.id],
    relationName: 'menteeFormReviewer',
  }),
}));

export const aiMatchResultsRelations = relations(aiMatchResults, ({ one }) => ({
  mentor: one(users, {
    fields: [aiMatchResults.mentorUserId],
    references: [users.id],
    relationName: 'matchedMentor',
  }),
  mentee: one(users, {
    fields: [aiMatchResults.menteeUserId],
    references: [users.id],
    relationName: 'matchedMentee',
  }),
  reviewer: one(users, {
    fields: [aiMatchResults.reviewedBy],
    references: [users.id],
    relationName: 'matchReviewer',
  }),
  relationship: one(mentorshipRelationships, {
    fields: [aiMatchResults.relationshipId],
    references: [mentorshipRelationships.id],
  }),
}));

export const aiMatchingRunsRelations = relations(aiMatchingRuns, ({ one }) => ({
  triggeredBy: one(users, {
    fields: [aiMatchingRuns.triggeredBy],
    references: [users.id],
  }),
  mentee: one(users, {
    fields: [aiMatchingRuns.menteeUserId],
    references: [users.id],
    relationName: 'matchingRunMentee',
  }),
}));

export const menteeWaitingQueueRelations = relations(menteeWaitingQueue, ({ one }) => ({
  mentee: one(users, {
    fields: [menteeWaitingQueue.menteeUserId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Programme = typeof programmes.$inferSelect;
export type NewProgramme = typeof programmes.$inferInsert;
export type MentorProgrammeAssignment = typeof mentorProgrammeAssignments.$inferSelect;
export type NewMentorProgrammeAssignment = typeof mentorProgrammeAssignments.$inferInsert;
export type MentorProfile = typeof mentorProfiles.$inferSelect;
export type NewMentorProfile = typeof mentorProfiles.$inferInsert;
export type MenteeProfile = typeof menteeProfiles.$inferSelect;
export type NewMenteeProfile = typeof menteeProfiles.$inferInsert;
export type MentorshipRelationship = typeof mentorshipRelationships.$inferSelect;
export type NewMentorshipRelationship = typeof mentorshipRelationships.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type MentorFormSubmission = typeof mentorFormSubmissions.$inferSelect;
export type NewMentorFormSubmission = typeof mentorFormSubmissions.$inferInsert;
export type MenteeFormSubmission = typeof menteeFormSubmissions.$inferSelect;
export type NewMenteeFormSubmission = typeof menteeFormSubmissions.$inferInsert;
export type AiMatchResult = typeof aiMatchResults.$inferSelect;
export type NewAiMatchResult = typeof aiMatchResults.$inferInsert;
export type AiMatchingRun = typeof aiMatchingRuns.$inferSelect;
export type NewAiMatchingRun = typeof aiMatchingRuns.$inferInsert;
export type MenteeWaitingQueue = typeof menteeWaitingQueue.$inferSelect;
export type NewMenteeWaitingQueue = typeof menteeWaitingQueue.$inferInsert;
