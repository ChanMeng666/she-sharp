import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  primaryKey,
  index,
  boolean,
  jsonb,
  decimal,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role_type', ['mentor', 'mentee', 'admin']);
export const membershipTierEnum = pgEnum('membership_tier', ['free', 'basic', 'premium']);
export const relationshipStatusEnum = pgEnum('relationship_status', ['pending', 'active', 'paused', 'completed', 'rejected']);
export const meetingStatusEnum = pgEnum('meeting_status', ['scheduled', 'completed', 'cancelled', 'no_show']);
export const meetingTypeEnum = pgEnum('meeting_type', ['intro', 'regular', 'milestone', 'final']);
export const eventTypeEnum = pgEnum('event_type', ['workshop', 'networking', 'training', 'social', 'thrive']);
export const locationTypeEnum = pgEnum('location_type', ['online', 'in_person', 'hybrid']);
export const resourceTypeEnum = pgEnum('resource_type', ['document', 'video', 'link', 'template', 'guide']);
export const resourceAccessLevelEnum = pgEnum('resource_access_level', ['public', 'member', 'premium']);

// New enums for business logic update
export const invitationCodeStatusEnum = pgEnum('invitation_code_status', ['active', 'used', 'expired', 'revoked']);
export const invitationCodeTypeEnum = pgEnum('invitation_code_type', ['payment', 'mentor_approved', 'mentee_approved', 'admin_generated']);
export const formStatusEnum = pgEnum('form_status', ['not_started', 'in_progress', 'submitted', 'approved', 'rejected']);
export const bioMethodEnum = pgEnum('bio_method', ['self_written', 'ai_generated', 'already_sent']);
export const careerStageEnum = pgEnum('career_stage', ['undergraduate', 'postgraduate', 'early_career', 'mid_career', 'senior', 'career_transition']);
export const menteeTypePreferenceEnum = pgEnum('mentee_type_preference', ['undergraduate', 'postgraduate', 'professional']);
export const matchStatusEnum = pgEnum('match_status', ['pending_review', 'approved', 'rejected', 'active', 'expired']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid']);
export const mbtiTypeEnum = pgEnum('mbti_type', ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']);
export const genderEnum = pgEnum('gender', ['female', 'male', 'non_binary', 'prefer_not_to_say', 'other']);
export const meetingFormatEnum = pgEnum('meeting_format', ['online', 'in_person', 'hybrid']);
export const queueStatusEnum = pgEnum('queue_status', ['waiting', 'matching_in_progress', 'matched', 'expired', 'cancelled']);
export const confidenceLevelEnum = pgEnum('confidence_level', ['high', 'medium', 'low']);

export const volunteerCurrentStatusEnum = pgEnum('volunteer_current_status', [
  'high_school_student', 'university_student', 'industry', 'sponsor_partner', 'other'
]);

export const volunteerTypeEnum = pgEnum('volunteer_type', ['ambassador', 'volunteer', 'ex_ambassador']);

export const howHeardAboutEnum = pgEnum('how_heard_about', [
  'attended_event', 'linkedin', 'word_of_mouth', 'search_engine', 'social_media', 'other'
]);

export const experienceRatingEnum = pgEnum('experience_rating', [
  'excellent', 'good', 'average', 'below_average', 'poor'
]);

export const recruitmentStageEnum = pgEnum('recruitment_stage', [
  'new', 'contacted', 'screening', 'interview_requested', 'interview_scheduled',
  'approved', 'rejected', 'onboarding', 'nda_sent', 'nda_signed', 'active'
]);

export const communicationMethodEnum = pgEnum('communication_method', ['email', 'phone']);

// Core user table (simplified - no role field)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  emailVerifiedAt: timestamp('email_verified_at'),
  lastLoginAt: timestamp('last_login_at'),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  // New fields for business logic update
  gender: genderEnum('gender'),
  phone: varchar('phone', { length: 50 }),
  age: integer('age'),
  registeredViaInviteCode: integer('registered_via_invite_code'), // FK added after invitationCodes table
  inviteCodeVerifiedAt: timestamp('invite_code_verified_at'), // For OAuth users who verified invitation code post-signup
});

// User roles activation table
export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleType: userRoleEnum('role_type').notNull(),
  activatedAt: timestamp('activated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  activationStep: integer('activation_step').default(0),
  verifiedAt: timestamp('verified_at'), // For mentor verification
}, (table) => ({
  userRoleUnique: unique().on(table.userId, table.roleType),
  userIdIdx: index('user_roles_user_id_idx').on(table.userId),
  roleTypeIdx: index('user_roles_role_type_idx').on(table.roleType),
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  mentorIdx: index('relationships_mentor_idx').on(table.mentorUserId),
  menteeIdx: index('relationships_mentee_idx').on(table.menteeUserId),
  statusIdx: index('relationships_status_idx').on(table.status),
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

// Events
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  eventType: eventTypeEnum('event_type').notNull(),
  
  // Time and location
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  timezone: varchar('timezone', { length: 50 }).default('America/Los_Angeles'),
  locationType: locationTypeEnum('location_type').notNull(),
  locationDetails: jsonb('location_details').$type<{
    address?: string;
    venue?: string;
    room?: string;
    meetingLink?: string;
    instructions?: string;
  }>(),
  
  // Registration management
  capacity: integer('capacity'),
  currentRegistrations: integer('current_registrations').default(0),
  registrationDeadline: timestamp('registration_deadline'),
  waitlistEnabled: boolean('waitlist_enabled').default(false),
  
  // Access control
  isMembersOnly: boolean('is_members_only').default(false),
  requiredMembershipTier: membershipTierEnum('required_membership_tier'),
  
  // Content
  agenda: jsonb('agenda').$type<{time: string; topic: string; speaker?: string}[]>(),
  speakers: jsonb('speakers').$type<{name: string; title: string; bio?: string}[]>(),
  materials: jsonb('materials').$type<{title: string; url: string; type: string}[]>(),
  
  // Statistics
  actualAttendance: integer('actual_attendance'),
  feedbackScore: decimal('feedback_score', { precision: 3, scale: 2 }),
  
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  eventTypeIdx: index('events_type_idx').on(table.eventType),
  startTimeIdx: index('events_start_time_idx').on(table.startTime),
  createdByIdx: index('events_created_by_idx').on(table.createdBy),
}));

// Event registrations
export const eventRegistrations = pgTable('event_registrations', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  registeredAt: timestamp('registered_at').notNull().defaultNow(),
  roleInEvent: varchar('role_in_event', { length: 50 }), // speaker, volunteer, attendee

  // Attendance tracking
  checkedInAt: timestamp('checked_in_at'),
  checkedOutAt: timestamp('checked_out_at'),
  attendanceDuration: integer('attendance_duration'), // in minutes

  // Feedback
  feedbackSubmitted: boolean('feedback_submitted').default(false),
  feedbackScore: integer('feedback_score'),
  feedbackComments: text('feedback_comments'),

  certificateIssued: boolean('certificate_issued').default(false),
  certificateUrl: varchar('certificate_url', { length: 500 }),

  // New fields for attendance confirmation and points
  attendanceConfirmed: boolean('attendance_confirmed').default(false),
  attendanceConfirmedBy: integer('attendance_confirmed_by').references(() => users.id),
  attendanceConfirmedAt: timestamp('attendance_confirmed_at'),
  pointsAwarded: integer('points_awarded').default(0),
}, (table) => ({
  eventUserUnique: unique().on(table.eventId, table.userId),
  eventIdx: index('registrations_event_idx').on(table.eventId),
  userIdx: index('registrations_user_idx').on(table.userId),
}));

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

// User memberships
export const userMemberships = pgTable('user_memberships', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  tier: membershipTierEnum('tier').notNull().default('free'),
  expiresAt: timestamp('expires_at'),
  featuresAccess: jsonb('features_access').$type<Record<string, boolean>>(),

  // Billing
  lastPaymentAt: timestamp('last_payment_at'),
  nextBillingDate: timestamp('next_billing_date'),
  cancelledAt: timestamp('cancelled_at'),

  // Stripe integration fields
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeCustomerId: text('stripe_customer_id'),
  currentPurchaseId: integer('current_purchase_id'), // FK added after membershipPurchases table

  // New membership benefits
  eventPriorityAccess: boolean('event_priority_access').default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('memberships_user_id_idx').on(table.userId),
  tierIdx: index('memberships_tier_idx').on(table.tier),
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

// Admin permissions
export const adminPermissions = pgTable('admin_permissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  canViewAllData: boolean('can_view_all_data').default(true),
  canEditUsers: boolean('can_edit_users').default(true),
  canManageRelationships: boolean('can_manage_relationships').default(true),
  canAccessAnalytics: boolean('can_access_analytics').default(true),
  canManageContent: boolean('can_manage_content').default(true),
  canVerifyMentors: boolean('can_verify_mentors').default(true),
  canManageEvents: boolean('can_manage_events').default(true),
  grantedBy: integer('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('admin_permissions_user_id_idx').on(table.userId),
}));

// Event role assignments for activity-specific roles
export const eventRoleAssignments = pgTable('event_role_assignments', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleType: varchar('role_type', { length: 50 }).notNull(), // 'mentor', 'mentee', 'facilitator', 'speaker'
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  assignedBy: integer('assigned_by').references(() => users.id),
  notes: text('notes'),
}, (table) => ({
  uniqueEventUserRole: unique().on(table.eventId, table.userId, table.roleType),
  eventIdx: index('event_role_assignments_event_idx').on(table.eventId),
  userIdx: index('event_role_assignments_user_idx').on(table.userId),
  roleTypeIdx: index('event_role_assignments_role_type_idx').on(table.roleType),
}));

// Keep existing auth-related tables
export const emailVerifications = pgTable('email_verifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  verifiedAt: timestamp('verified_at'),
});

export const passwordResets = pgTable('password_resets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  usedAt: timestamp('used_at'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
});

export const passwordHistory = pgTable('password_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// OAuth tables (keeping for potential OAuth integration)
export const accounts = pgTable(
  "account",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
);

export const sessions = pgTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 }).notNull().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  })
);

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  userRoles: many(userRoles),
  mentorProfile: one(mentorProfiles),
  menteeProfile: one(menteeProfiles),
  mentorRelationships: many(mentorshipRelationships, {
    relationName: 'mentor',
  }),
  menteeRelationships: many(mentorshipRelationships, {
    relationName: 'mentee',
  }),
  eventRegistrations: many(eventRegistrations),
  eventRoleAssignments: many(eventRoleAssignments),
  uploadedResources: many(resources),
  resourceAccessLogs: many(resourceAccessLogs),
  membership: one(userMemberships),
  adminPermissions: one(adminPermissions),
  activityLogs: many(activityLogs),
  notifications: many(notifications),
  emailVerifications: many(emailVerifications),
  passwordResets: many(passwordResets),
  passwordHistory: many(passwordHistory),
  createdEvents: many(events),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

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

export const eventsRelations = relations(events, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  registrations: many(eventRegistrations),
  roleAssignments: many(eventRoleAssignments),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRegistrations.userId],
    references: [users.id],
  }),
}));

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

export const userMembershipsRelations = relations(userMemberships, ({ one }) => ({
  user: one(users, {
    fields: [userMemberships.userId],
    references: [users.id],
  }),
}));

export const adminPermissionsRelations = relations(adminPermissions, ({ one }) => ({
  user: one(users, {
    fields: [adminPermissions.userId],
    references: [users.id],
  }),
  grantedBy: one(users, {
    fields: [adminPermissions.grantedBy],
    references: [users.id],
    relationName: 'granter',
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

export const emailVerificationsRelations = relations(emailVerifications, ({ one }) => ({
  user: one(users, {
    fields: [emailVerifications.userId],
    references: [users.id],
  }),
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

export const passwordHistoryRelations = relations(passwordHistory, ({ one }) => ({
  user: one(users, {
    fields: [passwordHistory.userId],
    references: [users.id],
  }),
}));

export const eventRoleAssignmentsRelations = relations(eventRoleAssignments, ({ one }) => ({
  event: one(events, {
    fields: [eventRoleAssignments.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRoleAssignments.userId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [eventRoleAssignments.assignedBy],
    references: [users.id],
    relationName: 'assigner',
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type MentorProfile = typeof mentorProfiles.$inferSelect;
export type NewMentorProfile = typeof mentorProfiles.$inferInsert;
export type MenteeProfile = typeof menteeProfiles.$inferSelect;
export type NewMenteeProfile = typeof menteeProfiles.$inferInsert;
export type MentorshipRelationship = typeof mentorshipRelationships.$inferSelect;
export type NewMentorshipRelationship = typeof mentorshipRelationships.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type ResourceAccessLog = typeof resourceAccessLogs.$inferSelect;
export type NewResourceAccessLog = typeof resourceAccessLogs.$inferInsert;
export type UserMembership = typeof userMemberships.$inferSelect;
export type NewUserMembership = typeof userMemberships.$inferInsert;
export type AdminPermission = typeof adminPermissions.$inferSelect;
export type NewAdminPermission = typeof adminPermissions.$inferInsert;
export type EventRoleAssignment = typeof eventRoleAssignments.$inferSelect;
export type NewEventRoleAssignment = typeof eventRoleAssignments.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;
export type PasswordHistory = typeof passwordHistory.$inferSelect;
export type NewPasswordHistory = typeof passwordHistory.$inferInsert;

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
}

// ============================================================================
// NEW TABLES FOR BUSINESS LOGIC UPDATE
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

// Membership purchases (Stripe integration)
export const membershipPurchases = pgTable('membership_purchases', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NZD').notNull(),
  membershipTier: membershipTierEnum('membership_tier').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull(),
  autoRenew: boolean('auto_renew').default(true),
  canceledAt: timestamp('canceled_at'),
  cancelReason: text('cancel_reason'),
  invoiceUrl: varchar('invoice_url', { length: 500 }),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('membership_purchases_user_id_idx').on(table.userId),
  stripeSubIdx: index('membership_purchases_stripe_sub_idx').on(table.stripeSubscriptionId),
  statusIdx: index('membership_purchases_status_idx').on(table.subscriptionStatus),
  periodEndIdx: index('membership_purchases_period_end_idx').on(table.periodEnd),
}));

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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('mentee_form_submissions_user_id_idx').on(table.userId),
  statusIdx: index('mentee_form_submissions_status_idx').on(table.status),
  emailIdx: index('mentee_form_submissions_email_idx').on(table.email),
  paymentIdx: index('mentee_form_submissions_payment_idx').on(table.paymentCompleted),
}));

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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  menteeUserIdIdx: index('waiting_queue_mentee_user_id_idx').on(table.menteeUserId),
  statusIdx: index('waiting_queue_status_idx').on(table.status),
  priorityIdx: index('waiting_queue_priority_idx').on(table.priority),
  bestScoreIdx: index('waiting_queue_best_score_idx').on(table.bestMatchScore),
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
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  mentorMenteeUnique: unique().on(table.mentorUserId, table.menteeUserId),
  mentorIdx: index('ai_match_results_mentor_idx').on(table.mentorUserId),
  menteeIdx: index('ai_match_results_mentee_idx').on(table.menteeUserId),
  statusIdx: index('ai_match_results_status_idx').on(table.status),
  scoreIdx: index('ai_match_results_score_idx').on(table.overallScore),
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
// RELATIONS FOR NEW TABLES
// ============================================================================

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

export const membershipPurchasesRelations = relations(membershipPurchases, ({ one }) => ({
  user: one(users, {
    fields: [membershipPurchases.userId],
    references: [users.id],
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

export const volunteerFormSubmissionsRelations = relations(volunteerFormSubmissions, ({ one }) => ({
  reviewer: one(users, {
    fields: [volunteerFormSubmissions.reviewedBy],
    references: [users.id],
    relationName: 'volunteerFormReviewer',
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
// TYPE EXPORTS FOR NEW TABLES
// ============================================================================

export type InvitationCode = typeof invitationCodes.$inferSelect;
export type NewInvitationCode = typeof invitationCodes.$inferInsert;
export type InvitationCodeUsage = typeof invitationCodeUsages.$inferSelect;
export type NewInvitationCodeUsage = typeof invitationCodeUsages.$inferInsert;
export type MembershipPurchase = typeof membershipPurchases.$inferSelect;
export type NewMembershipPurchase = typeof membershipPurchases.$inferInsert;
export type MentorFormSubmission = typeof mentorFormSubmissions.$inferSelect;
export type NewMentorFormSubmission = typeof mentorFormSubmissions.$inferInsert;
export type MenteeFormSubmission = typeof menteeFormSubmissions.$inferSelect;
export type NewMenteeFormSubmission = typeof menteeFormSubmissions.$inferInsert;
export type VolunteerFormSubmission = typeof volunteerFormSubmissions.$inferSelect;
export type NewVolunteerFormSubmission = typeof volunteerFormSubmissions.$inferInsert;
export type ContactFormSubmission = typeof contactFormSubmissions.$inferSelect;
export type NewContactFormSubmission = typeof contactFormSubmissions.$inferInsert;
export type AiMatchResult = typeof aiMatchResults.$inferSelect;
export type NewAiMatchResult = typeof aiMatchResults.$inferInsert;
export type AiMatchingRun = typeof aiMatchingRuns.$inferSelect;
export type NewAiMatchingRun = typeof aiMatchingRuns.$inferInsert;
export type MenteeWaitingQueue = typeof menteeWaitingQueue.$inferSelect;
export type NewMenteeWaitingQueue = typeof menteeWaitingQueue.$inferInsert;

