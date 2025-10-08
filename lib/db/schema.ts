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

// Membership features configuration
export const membershipFeatures = pgTable('membership_features', {
  id: serial('id').primaryKey(),
  tier: membershipTierEnum('tier').notNull(),
  featureName: varchar('feature_name', { length: 100 }).notNull(),
  featureValue: jsonb('feature_value'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueTierFeature: unique().on(table.tier, table.featureName),
  tierIdx: index('membership_features_tier_idx').on(table.tier),
}));

// User mentorship statistics cache
export const userMentorshipStats = pgTable('user_mentorship_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  menteesCount: integer('mentees_count').default(0),
  mentorsCount: integer('mentors_count').default(0),
  totalMeetings: integer('total_meetings').default(0),
  completedMeetings: integer('completed_meetings').default(0),
  totalMeetingHours: decimal('total_meeting_hours', { precision: 10, scale: 2 }).default('0'),
  eventsAttended: integer('events_attended').default(0),
  eventsRegistered: integer('events_registered').default(0),
  resourcesUploaded: integer('resources_uploaded').default(0),
  resourcesAccessed: integer('resources_accessed').default(0),
  lastActivityAt: timestamp('last_activity_at'),
  statsUpdatedAt: timestamp('stats_updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('user_mentorship_stats_user_id_idx').on(table.userId),
  updatedIdx: index('user_mentorship_stats_updated_idx').on(table.statsUpdatedAt),
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
  mentorshipStats: one(userMentorshipStats),
  activityLogs: many(activityLogs),
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

export const membershipFeaturesRelations = relations(membershipFeatures, ({ }) => ({
  // No direct relations, this is a configuration table
}));

export const userMentorshipStatsRelations = relations(userMentorshipStats, ({ one }) => ({
  user: one(users, {
    fields: [userMentorshipStats.userId],
    references: [users.id],
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
export type MembershipFeature = typeof membershipFeatures.$inferSelect;
export type NewMembershipFeature = typeof membershipFeatures.$inferInsert;
export type UserMentorshipStat = typeof userMentorshipStats.$inferSelect;
export type NewUserMentorshipStat = typeof userMentorshipStats.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
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
}

// Legacy team-related tables (to be removed in future migration)
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  teamId: integer('team_id').notNull().references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by').notNull().references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// Legacy relations (kept for backward compatibility)
export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitations: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

// Legacy type exports
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};