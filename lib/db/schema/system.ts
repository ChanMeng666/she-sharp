/**
 * Cross-cutting platform tables: resources, activity logging, notifications,
 * invitation codes, the volunteer and contact forms, the grant crawler's
 * findings and the email do-not-contact register.
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
  communicationMethodEnum,
  experienceRatingEnum,
  formStatusEnum,
  fundingSourceEnum,
  howHeardAboutEnum,
  invitationCodeStatusEnum,
  invitationCodeTypeEnum,
  recruitmentStageEnum,
  resourceAccessLevelEnum,
  resourceTypeEnum,
  userRoleEnum,
  volunteerCurrentStatusEnum,
  volunteerTypeEnum,
} from './enums';
import { users } from './users';

// Resources
export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  resourceType: resourceTypeEnum('resource_type').notNull(),
  
  // File information
  fileUrl: varchar('file_url', { length: 500 }),
  fileSize: integer('file_size'), // in bytes
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Access control
  accessLevel: resourceAccessLevelEnum('access_level').notNull().default('member'),
  requiredRoles: jsonb('required_roles').$type<string[]>(), // ['mentor', 'mentee']
  
  // Categorization
  categories: jsonb('categories').$type<string[]>(),
  tags: jsonb('tags').$type<string[]>(),
  
  // Metadata
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  downloadCount: integer('download_count').default(0),
  viewCount: integer('view_count').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
}, (table) => ({
  typeIdx: index('resources_type_idx').on(table.resourceType),
  accessLevelIdx: index('resources_access_level_idx').on(table.accessLevel),
  uploadedByIdx: index('resources_uploaded_by_idx').on(table.uploadedBy),
}));

// Resource access logs
export const resourceAccessLogs = pgTable('resource_access_logs', {
  id: serial('id').primaryKey(),
  resourceId: integer('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessedAt: timestamp('accessed_at').notNull().defaultNow(),
  action: varchar('action', { length: 20 }).notNull(), // view, download, share
  ipAddress: varchar('ip_address', { length: 45 }),
}, (table) => ({
  resourceIdx: index('access_logs_resource_idx').on(table.resourceId),
  userIdx: index('access_logs_user_idx').on(table.userId),
}));

// Activity logs (keeping for audit trail)
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: varchar('entity_type', { length: 50 }), // user, relationship, event, resource
  entityId: integer('entity_id'),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
}, (table) => ({
  userIdx: index('activity_logs_user_idx').on(table.userId),
  entityIdx: index('activity_logs_entity_idx').on(table.entityType, table.entityId),
}));

// Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'event', 'mentorship', 'resource', 'system', 'meeting'
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false),
  actionUrl: varchar('action_url', { length: 500 }),
  actionLabel: varchar('action_label', { length: 100 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow(),
  readAt: timestamp('read_at'),
}, (table) => ({
  userIdIdx: index('idx_notifications_user_id').on(table.userId),
  readIdx: index('idx_notifications_read').on(table.read),
  createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
}));

// ============================================================================
// INVITATION CODES
// ============================================================================

// Invitation codes system
export const invitationCodes = pgTable('invitation_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  codeType: invitationCodeTypeEnum('code_type').notNull().default('payment'),
  status: invitationCodeStatusEnum('status').notNull().default('active'),
  maxUses: integer('max_uses').default(1),
  currentUses: integer('current_uses').default(0).notNull(),
  expiresAt: timestamp('expires_at'),
  purchaseId: integer('purchase_id'), // FK to membershipPurchases
  generatedBy: integer('generated_by').references(() => users.id),
  generatedFor: varchar('generated_for', { length: 255 }), // Expected recipient email
  // New fields for role-based registration
  targetRole: userRoleEnum('target_role'), // Role to assign on registration: 'mentor', 'mentee', 'admin'
  linkedFormId: integer('linked_form_id'), // Link to form submission (mentor or mentee)
  linkedFormType: varchar('linked_form_type', { length: 20 }), // 'mentor' or 'mentee'
  notes: text('notes'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  codeIdx: index('invitation_codes_code_idx').on(table.code),
  statusIdx: index('invitation_codes_status_idx').on(table.status),
  expiresAtIdx: index('invitation_codes_expires_at_idx').on(table.expiresAt),
  targetRoleIdx: index('invitation_codes_target_role_idx').on(table.targetRole),
}));

// Invitation code usage records
export const invitationCodeUsages = pgTable('invitation_code_usages', {
  id: serial('id').primaryKey(),
  codeId: integer('code_id').notNull().references(() => invitationCodes.id),
  usedByUserId: integer('used_by_user_id').notNull().references(() => users.id),
  usedAt: timestamp('used_at').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
}, (table) => ({
  codeIdIdx: index('invitation_code_usages_code_id_idx').on(table.codeId),
  userIdIdx: index('invitation_code_usages_user_id_idx').on(table.usedByUserId),
}));

// ============================================================================
// PUBLIC FORMS
// ============================================================================

// Volunteer/Ambassador form submissions
export const volunteerFormSubmissions = pgTable('volunteer_form_submissions', {
  id: serial('id').primaryKey(),
  type: volunteerTypeEnum('type').notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  status: formStatusEnum('status').notNull().default('submitted'),
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  // Common fields (both types)
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  currentStatus: volunteerCurrentStatusEnum('current_status'),
  currentStatusOther: varchar('current_status_other', { length: 200 }),
  organisation: varchar('organisation', { length: 200 }),
  howHeardAbout: text('how_heard_about'),
  skillSets: text('skill_sets'),
  // New shared fields
  phone: varchar('phone', { length: 50 }),
  howHeardAboutOption: howHeardAboutEnum('how_heard_about_option'),
  howHeardAboutOther: varchar('how_heard_about_other', { length: 200 }),
  // Ambassador-only fields (nullable)
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  itIndustryInterest: text('it_industry_interest'),
  volunteerHoursPerWeek: varchar('volunteer_hours_per_week', { length: 20 }),
  cvUrl: varchar('cv_url', { length: 500 }),
  cvFileName: varchar('cv_file_name', { length: 255 }),
  // Volunteer-only fields (nullable)
  eventsPerYear: varchar('events_per_year', { length: 20 }),
  // Ex-ambassador specific fields
  currentRoleTitle: varchar('current_role_title', { length: 200 }),
  joinedSheSharpYear: integer('joined_she_sharp_year'),
  leftRoleYear: integer('left_role_year'),
  stillAmbassador: boolean('still_ambassador'),
  experienceRating: experienceRatingEnum('experience_rating'),
  mostValuablePart: varchar('most_valuable_part', { length: 100 }),
  mostValuablePartOther: varchar('most_valuable_part_other', { length: 200 }),
  wouldRecommend: boolean('would_recommend'),
  wantFeatured: boolean('want_featured'),
  preferredCommunication: communicationMethodEnum('preferred_communication'),
  additionalComments: text('additional_comments'),
  // Recruitment pipeline fields
  recruitmentStage: recruitmentStageEnum('recruitment_stage').default('new'),
  recruitmentStageUpdatedAt: timestamp('recruitment_stage_updated_at'),
  recruitmentStageUpdatedBy: integer('recruitment_stage_updated_by').references(() => users.id),
  interviewRequestedBy: varchar('interview_requested_by', { length: 100 }),
  interviewScheduledAt: timestamp('interview_scheduled_at'),
  interviewNotes: text('interview_notes'),
  joinedDate: timestamp('joined_date'),
  ndaSentAt: timestamp('nda_sent_at'),
  ndaSignedAt: timestamp('nda_signed_at'),
  slackInvitedAt: timestamp('slack_invited_at'),
  adminNotes: text('admin_notes'),
  // AI screening fields
  aiScreeningResult: jsonb('ai_screening_result').$type<{
    summary: string;
    recommendation: 'accept' | 'interview' | 'reject';
    confidence: number;
    strengths: string[];
    concerns: string[];
    reasoning: string;
  }>(),
  aiScreenedAt: timestamp('ai_screened_at'),
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('volunteer_form_status_idx').on(table.status),
  emailIdx: index('volunteer_form_email_idx').on(table.email),
  typeIdx: index('volunteer_form_type_idx').on(table.type),
  recruitmentStageIdx: index('volunteer_form_recruitment_stage_idx').on(table.recruitmentStage),
}));

// Contact form submissions
export const contactFormSubmissions = pgTable('contact_form_submissions', {
  id: serial('id').primaryKey(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  organisation: varchar('organisation', { length: 200 }),
  message: text('message').notNull(),
  status: formStatusEnum('status').notNull().default('submitted'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
}, (table) => ({
  emailIdx: index('contact_form_email_idx').on(table.email),
  statusIdx: index('contact_form_status_idx').on(table.status),
}));

// ============================================================================
// FUNDING OPPORTUNITIES (weekly NZ government / community grant crawler)
// ============================================================================

export const fundingOpportunities = pgTable('funding_opportunities', {
  id: serial('id').primaryKey(),
  source: fundingSourceEnum('source').notNull(),
  externalId: varchar('external_id', { length: 500 }).notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  url: varchar('url', { length: 1000 }).notNull(),
  summary: text('summary'),
  publishedAt: timestamp('published_at'),
  deadline: timestamp('deadline'),
  relevanceScore: integer('relevance_score'),
  relevanceReason: text('relevance_reason'),
  rawMetadata: jsonb('raw_metadata').$type<Record<string, unknown>>(),
  postedToSlackAt: timestamp('posted_to_slack_at'),
  firstSeenAt: timestamp('first_seen_at').notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at').notNull().defaultNow(),
}, (table) => ({
  sourceExternalUnique: unique('funding_source_external_unique').on(table.source, table.externalId),
  hashIdx: index('idx_funding_content_hash').on(table.contentHash),
  scoreIdx: index('idx_funding_relevance_score').on(table.relevanceScore),
  firstSeenIdx: index('idx_funding_first_seen').on(table.firstSeenAt),
}));

// ============================================================================
// EMAIL OPT-OUTS (one-click unsubscribe, bounces, spam complaints)
// ============================================================================

/**
 * The runtime do-not-contact register.
 *
 * Keyed on `sha256(lowercased, trimmed email)` rather than the address itself,
 * mirroring the committed, PII-free register in
 * `lib/data/json/email-suppression-hashes.json`. Because both sides use the
 * same `hashEmail()` from `lib/email/hash.ts`, reconciling them is a set union
 * with no PII crossing the boundary (`suppression.ts sync`).
 *
 * Deliberately NOT keyed on `user_id`: half the notification-class mail goes to
 * applicants who have no `users` row, so a foreign key would silently drop
 * exactly the people most likely to unsubscribe.
 *
 * `stream` is `'notification'` (opted out of recurring mail only) or `'all'`
 * (bounced or complained — stop everything except transactional).
 */
export const emailOptouts = pgTable('email_optouts', {
  emailHash: varchar('email_hash', { length: 64 }).primaryKey(),
  stream: varchar('stream', { length: 32 }).notNull(),
  reason: varchar('reason', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  createdAtIdx: index('idx_email_optouts_created_at').on(table.createdAt),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [resources.uploadedBy],
    references: [users.id],
  }),
  accessLogs: many(resourceAccessLogs),
}));

export const resourceAccessLogsRelations = relations(resourceAccessLogs, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceAccessLogs.resourceId],
    references: [resources.id],
  }),
  user: one(users, {
    fields: [resourceAccessLogs.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const invitationCodesRelations = relations(invitationCodes, ({ one, many }) => ({
  generatedBy: one(users, {
    fields: [invitationCodes.generatedBy],
    references: [users.id],
  }),
  usages: many(invitationCodeUsages),
}));

export const invitationCodeUsagesRelations = relations(invitationCodeUsages, ({ one }) => ({
  code: one(invitationCodes, {
    fields: [invitationCodeUsages.codeId],
    references: [invitationCodes.id],
  }),
  user: one(users, {
    fields: [invitationCodeUsages.usedByUserId],
    references: [users.id],
  }),
}));

export const volunteerFormSubmissionsRelations = relations(volunteerFormSubmissions, ({ one }) => ({
  reviewer: one(users, {
    fields: [volunteerFormSubmissions.reviewedBy],
    references: [users.id],
    relationName: 'volunteerFormReviewer',
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type ResourceAccessLog = typeof resourceAccessLogs.$inferSelect;
export type NewResourceAccessLog = typeof resourceAccessLogs.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type InvitationCode = typeof invitationCodes.$inferSelect;
export type NewInvitationCode = typeof invitationCodes.$inferInsert;
export type InvitationCodeUsage = typeof invitationCodeUsages.$inferSelect;
export type NewInvitationCodeUsage = typeof invitationCodeUsages.$inferInsert;
export type VolunteerFormSubmission = typeof volunteerFormSubmissions.$inferSelect;
export type NewVolunteerFormSubmission = typeof volunteerFormSubmissions.$inferInsert;
export type ContactFormSubmission = typeof contactFormSubmissions.$inferSelect;
export type NewContactFormSubmission = typeof contactFormSubmissions.$inferInsert;
export type FundingOpportunity = typeof fundingOpportunities.$inferSelect;
export type NewFundingOpportunity = typeof fundingOpportunities.$inferInsert;
export type EmailOptout = typeof emailOptouts.$inferSelect;
export type NewEmailOptout = typeof emailOptouts.$inferInsert;

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

// Activity types enum (for activity logging)
export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  REQUEST_PASSWORD_RESET = 'REQUEST_PASSWORD_RESET',
  RESET_PASSWORD = 'RESET_PASSWORD',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  
  // New activity types for mentorship
  ACTIVATE_MENTOR_ROLE = 'ACTIVATE_MENTOR_ROLE',
  ACTIVATE_MENTEE_ROLE = 'ACTIVATE_MENTEE_ROLE',
  UPDATE_MENTOR_PROFILE = 'UPDATE_MENTOR_PROFILE',
  UPDATE_MENTEE_PROFILE = 'UPDATE_MENTEE_PROFILE',
  REQUEST_MENTOR = 'REQUEST_MENTOR',
  ACCEPT_MENTEE = 'ACCEPT_MENTEE',
  REJECT_MENTEE = 'REJECT_MENTEE',
  END_MENTORSHIP = 'END_MENTORSHIP',
  SCHEDULE_MEETING = 'SCHEDULE_MEETING',
  COMPLETE_MEETING = 'COMPLETE_MEETING',
  CANCEL_MEETING = 'CANCEL_MEETING',
  REGISTER_EVENT = 'REGISTER_EVENT',
  ATTEND_EVENT = 'ATTEND_EVENT',
  UPLOAD_RESOURCE = 'UPLOAD_RESOURCE',
  ACCESS_RESOURCE = 'ACCESS_RESOURCE',
  UPGRADE_MEMBERSHIP = 'UPGRADE_MEMBERSHIP',
  CANCEL_MEMBERSHIP = 'CANCEL_MEMBERSHIP',
  // New activity types for business logic update
  SUBMIT_MENTOR_FORM = 'SUBMIT_MENTOR_FORM',
  SUBMIT_MENTEE_FORM = 'SUBMIT_MENTEE_FORM',
  REVIEW_APPLICATION = 'REVIEW_APPLICATION',
  GENERATE_INVITATION_CODE = 'GENERATE_INVITATION_CODE',
  USE_INVITATION_CODE = 'USE_INVITATION_CODE',
  AI_MATCH_GENERATED = 'AI_MATCH_GENERATED',
  AI_MATCH_CONFIRMED = 'AI_MATCH_CONFIRMED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  SUBMIT_VOLUNTEER_FORM = 'SUBMIT_VOLUNTEER_FORM',
  REVIEW_VOLUNTEER_APPLICATION = 'REVIEW_VOLUNTEER_APPLICATION',
  UPDATE_RECRUITMENT_STAGE = 'UPDATE_RECRUITMENT_STAGE',
  AI_SCREEN_VOLUNTEER = 'AI_SCREEN_VOLUNTEER',
  SUBMIT_EX_AMBASSADOR_FORM = 'SUBMIT_EX_AMBASSADOR_FORM',
  SUBMIT_CONTACT_FORM = 'SUBMIT_CONTACT_FORM',
  SUBMIT_EVENT_FEEDBACK = 'SUBMIT_EVENT_FEEDBACK',
  /** One row per event digest posted, and the guard against posting it twice. */
  SEND_EVENT_FEEDBACK_DIGEST = 'SEND_EVENT_FEEDBACK_DIGEST',
  // Programme activity types
  CREATE_PROGRAMME = 'CREATE_PROGRAMME',
  UPDATE_PROGRAMME = 'UPDATE_PROGRAMME',
  COMPLETE_PROGRAMME = 'COMPLETE_PROGRAMME',
  ASSIGN_MENTOR_TO_PROGRAMME = 'ASSIGN_MENTOR_TO_PROGRAMME',
  REMOVE_MENTOR_FROM_PROGRAMME = 'REMOVE_MENTOR_FROM_PROGRAMME',
}
