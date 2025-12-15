import { pgTable, index, foreignKey, unique, serial, integer, timestamp, boolean, text, jsonb, numeric, varchar, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const bioMethod = pgEnum("bio_method", ['self_written', 'ai_generated', 'already_sent'])
export const careerStage = pgEnum("career_stage", ['undergraduate', 'postgraduate', 'early_career', 'mid_career', 'senior', 'career_transition'])
export const confidenceLevel = pgEnum("confidence_level", ['high', 'medium', 'low'])
export const eventType = pgEnum("event_type", ['workshop', 'networking', 'training', 'social', 'thrive'])
export const formStatus = pgEnum("form_status", ['not_started', 'in_progress', 'submitted', 'approved', 'rejected'])
export const gender = pgEnum("gender", ['female', 'male', 'non_binary', 'prefer_not_to_say', 'other'])
export const invitationCodeStatus = pgEnum("invitation_code_status", ['active', 'used', 'expired', 'revoked'])
export const invitationCodeType = pgEnum("invitation_code_type", ['payment', 'mentor_approved', 'admin_generated'])
export const locationType = pgEnum("location_type", ['online', 'in_person', 'hybrid'])
export const matchStatus = pgEnum("match_status", ['pending_review', 'approved', 'rejected', 'active', 'expired'])
export const mbtiType = pgEnum("mbti_type", ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'])
export const meetingFormat = pgEnum("meeting_format", ['online', 'in_person', 'hybrid'])
export const meetingStatus = pgEnum("meeting_status", ['scheduled', 'completed', 'cancelled', 'no_show'])
export const meetingType = pgEnum("meeting_type", ['intro', 'regular', 'milestone', 'final'])
export const membershipTier = pgEnum("membership_tier", ['free', 'basic', 'premium'])
export const menteeTypePreference = pgEnum("mentee_type_preference", ['undergraduate', 'postgraduate', 'professional'])
export const pointsTransactionType = pgEnum("points_transaction_type", ['event_attendance', 'meeting_completed', 'referral_bonus', 'milestone_reward', 'redemption', 'admin_adjustment'])
export const queueStatus = pgEnum("queue_status", ['waiting', 'matching_in_progress', 'matched', 'expired', 'cancelled'])
export const relationshipStatus = pgEnum("relationship_status", ['pending', 'active', 'paused', 'completed', 'rejected'])
export const resourceAccessLevel = pgEnum("resource_access_level", ['public', 'member', 'premium'])
export const resourceType = pgEnum("resource_type", ['document', 'video', 'link', 'template', 'guide'])
export const skillCategory = pgEnum("skill_category", ['soft_basic', 'soft_expert', 'industry_basic', 'industry_expert'])
export const subscriptionStatus = pgEnum("subscription_status", ['active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid'])
export const userRoleType = pgEnum("user_role_type", ['mentor', 'mentee', 'admin'])


export const userRoles = pgTable("user_roles", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	roleType: userRoleType("role_type").notNull(),
	activatedAt: timestamp("activated_at", { mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	activationStep: integer("activation_step").default(0),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
}, (table) => [
	index("user_roles_role_type_idx").using("btree", table.roleType.asc().nullsLast().op("enum_ops")),
	index("user_roles_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_roles_user_id_role_type_unique").on(table.userId, table.roleType),
]);

export const userMemberships = pgTable("user_memberships", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	tier: membershipTier().default('free').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	stripeSubscriptionId: text("stripe_subscription_id"),
	featuresAccess: jsonb("features_access"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	lastPaymentAt: timestamp("last_payment_at", { mode: 'string' }),
	nextBillingDate: timestamp("next_billing_date", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	currentPurchaseId: integer("current_purchase_id"),
	eventPriorityAccess: boolean("event_priority_access").default(false),
}, (table) => [
	index("memberships_tier_idx").using("btree", table.tier.asc().nullsLast().op("enum_ops")),
	index("memberships_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_memberships_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_memberships_user_id_unique").on(table.userId),
	unique("user_memberships_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);

export const menteeWaitingQueue = pgTable("mentee_waiting_queue", {
	id: serial().primaryKey().notNull(),
	menteeUserId: integer("mentee_user_id").notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
	status: queueStatus().default('waiting').notNull(),
	priority: integer().default(0),
	bestMatchScore: numeric("best_match_score", { precision: 5, scale:  2 }),
	matchAttempts: integer("match_attempts").default(0),
	lastMatchAttemptAt: timestamp("last_match_attempt_at", { mode: 'string' }),
	notifiedAt: timestamp("notified_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("waiting_queue_best_score_idx").using("btree", table.bestMatchScore.asc().nullsLast().op("numeric_ops")),
	index("waiting_queue_mentee_user_id_idx").using("btree", table.menteeUserId.asc().nullsLast().op("int4_ops")),
	index("waiting_queue_priority_idx").using("btree", table.priority.asc().nullsLast().op("int4_ops")),
	index("waiting_queue_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.menteeUserId],
			foreignColumns: [users.id],
			name: "mentee_waiting_queue_mentee_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("mentee_waiting_queue_mentee_user_id_unique").on(table.menteeUserId),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	read: boolean().default(false),
	actionUrl: varchar("action_url", { length: 500 }),
	actionLabel: varchar("action_label", { length: 100 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	readAt: timestamp("read_at", { mode: 'string' }),
}, (table) => [
	index("idx_notifications_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_notifications_read").using("btree", table.read.asc().nullsLast().op("bool_ops")),
	index("idx_notifications_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const mentorProfiles = pgTable("mentor_profiles", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	expertiseAreas: jsonb("expertise_areas"),
	yearsExperience: integer("years_experience"),
	company: varchar({ length: 200 }),
	linkedinUrl: varchar("linkedin_url", { length: 500 }),
	bio: text(),
	availabilityHoursPerMonth: integer("availability_hours_per_month"),
	maxMentees: integer("max_mentees").default(3),
	currentMenteesCount: integer("current_mentees_count").default(0),
	isAcceptingMentees: boolean("is_accepting_mentees").default(true),
	profileCompletedAt: timestamp("profile_completed_at", { mode: 'string' }),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	jobTitle: varchar("job_title", { length: 200 }),
	verifiedBy: integer("verified_by"),
	mbtiType: mbtiType("mbti_type"),
	photoUrl: varchar("photo_url", { length: 500 }),
	formSubmissionId: integer("form_submission_id"),
}, (table) => [
	index("mentor_profiles_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "mentor_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "mentor_profiles_verified_by_users_id_fk"
		}),
	unique("mentor_profiles_user_id_unique").on(table.userId),
]);

export const activityLogs = pgTable("activity_logs", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	action: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	entityType: varchar("entity_type", { length: 50 }),
	entityId: integer("entity_id"),
	metadata: jsonb(),
	teamId: integer("team_id"),
}, (table) => [
	index("activity_logs_entity_idx").using("btree", table.entityType.asc().nullsLast().op("int4_ops"), table.entityId.asc().nullsLast().op("int4_ops")),
	index("activity_logs_user_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_logs_user_id_users_id_fk"
		}),
]);

export const teams = pgTable("teams", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	stripeProductId: text("stripe_product_id"),
	planName: varchar("plan_name", { length: 50 }),
	subscriptionStatus: varchar("subscription_status", { length: 20 }),
}, (table) => [
	unique("teams_stripe_customer_id_unique").on(table.stripeCustomerId),
	unique("teams_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);

export const invitations = pgTable("invitations", {
	id: serial().primaryKey().notNull(),
	teamId: integer("team_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).notNull(),
	invitedBy: integer("invited_by").notNull(),
	invitedAt: timestamp("invited_at", { mode: 'string' }).defaultNow().notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "invitations_team_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "invitations_invited_by_users_id_fk"
		}),
]);

export const teamMembers = pgTable("team_members", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	teamId: integer("team_id").notNull(),
	role: varchar({ length: 50 }).notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "team_members_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "team_members_team_id_teams_id_fk"
		}),
]);

export const emailVerifications = pgTable("email_verifications", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "email_verifications_user_id_users_id_fk"
		}),
	unique("email_verifications_token_unique").on(table.token),
]);

export const passwordHistory = pgTable("password_history", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_history_user_id_users_id_fk"
		}),
]);

export const passwordResets = pgTable("password_resets", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_resets_user_id_users_id_fk"
		}),
	unique("password_resets_token_unique").on(table.token),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	loginAttempts: integer("login_attempts").default(0),
	lockedUntil: timestamp("locked_until", { mode: 'string' }),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	image: text(),
	gender: gender(),
	phone: varchar({ length: 50 }),
	age: integer(),
	registeredViaInviteCode: integer("registered_via_invite_code"),
	inviteCodeVerifiedAt: timestamp("invite_code_verified_at", { mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const adminPermissions = pgTable("admin_permissions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	canViewAllData: boolean("can_view_all_data").default(true),
	canEditUsers: boolean("can_edit_users").default(true),
	canManageRelationships: boolean("can_manage_relationships").default(true),
	canManageEvents: boolean("can_manage_events").default(true),
	canAccessAnalytics: boolean("can_access_analytics").default(true),
	canManageContent: boolean("can_manage_content").default(true),
	canVerifyMentors: boolean("can_verify_mentors").default(true),
	grantedBy: integer("granted_by"),
	grantedAt: timestamp("granted_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("admin_permissions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "admin_permissions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.grantedBy],
			foreignColumns: [users.id],
			name: "admin_permissions_granted_by_users_id_fk"
		}),
	unique("admin_permissions_user_id_unique").on(table.userId),
]);

export const meetings = pgTable("meetings", {
	id: serial().primaryKey().notNull(),
	relationshipId: integer("relationship_id").notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }).notNull(),
	durationMinutes: integer("duration_minutes").default(60),
	meetingType: meetingType("meeting_type").default('regular').notNull(),
	meetingLink: varchar("meeting_link", { length: 500 }),
	status: meetingStatus().default('scheduled').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	topicsDiscussed: jsonb("topics_discussed"),
	goalsSet: jsonb("goals_set"),
	actionItems: jsonb("action_items"),
	mentorNotes: text("mentor_notes"),
	menteeFeedback: text("mentee_feedback"),
	rating: integer(),
	actualStartTime: timestamp("actual_start_time", { mode: 'string' }),
	actualEndTime: timestamp("actual_end_time", { mode: 'string' }),
	recordingUrl: varchar("recording_url", { length: 500 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("meetings_relationship_idx").using("btree", table.relationshipId.asc().nullsLast().op("int4_ops")),
	index("meetings_scheduled_at_idx").using("btree", table.scheduledAt.asc().nullsLast().op("timestamp_ops")),
	index("meetings_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.relationshipId],
			foreignColumns: [mentorshipRelationships.id],
			name: "meetings_relationship_id_mentorship_relationships_id_fk"
		}),
]);

export const mentorshipRelationships = pgTable("mentorship_relationships", {
	id: serial().primaryKey().notNull(),
	status: relationshipStatus().default('pending').notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	nextMeetingDate: timestamp("next_meeting_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	mentorUserId: integer("mentor_user_id").notNull(),
	menteeUserId: integer("mentee_user_id").notNull(),
	pausedAt: timestamp("paused_at", { mode: 'string' }),
	meetingFrequency: varchar("meeting_frequency", { length: 50 }),
	relationshipGoals: text("relationship_goals"),
	mentorNotes: text("mentor_notes"),
	menteeNotes: text("mentee_notes"),
}, (table) => [
	index("relationships_mentee_idx").using("btree", table.menteeUserId.asc().nullsLast().op("int4_ops")),
	index("relationships_mentor_idx").using("btree", table.mentorUserId.asc().nullsLast().op("int4_ops")),
	index("relationships_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.mentorUserId],
			foreignColumns: [users.id],
			name: "mentorship_relationships_mentor_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.menteeUserId],
			foreignColumns: [users.id],
			name: "mentorship_relationships_mentee_user_id_users_id_fk"
		}),
]);

export const session = pgTable("session", {
	sessionToken: varchar("session_token", { length: 255 }).primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("session_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "session_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const resourceAccessLogs = pgTable("resource_access_logs", {
	id: serial().primaryKey().notNull(),
	resourceId: integer("resource_id").notNull(),
	userId: integer("user_id").notNull(),
	accessedAt: timestamp("accessed_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	action: varchar({ length: 20 }).notNull(),
}, (table) => [
	index("access_logs_resource_idx").using("btree", table.resourceId.asc().nullsLast().op("int4_ops")),
	index("access_logs_user_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "resource_access_logs_resource_id_resources_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "resource_access_logs_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const eventRegistrations = pgTable("event_registrations", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	userId: integer("user_id").notNull(),
	registeredAt: timestamp("registered_at", { mode: 'string' }).defaultNow().notNull(),
	roleInEvent: varchar("role_in_event", { length: 50 }),
	checkedInAt: timestamp("checked_in_at", { mode: 'string' }),
	checkedOutAt: timestamp("checked_out_at", { mode: 'string' }),
	attendanceDuration: integer("attendance_duration"),
	feedbackSubmitted: boolean("feedback_submitted").default(false),
	feedbackScore: integer("feedback_score"),
	feedbackComments: text("feedback_comments"),
	certificateIssued: boolean("certificate_issued").default(false),
	certificateUrl: varchar("certificate_url", { length: 500 }),
	attendanceConfirmed: boolean("attendance_confirmed").default(false),
	attendanceConfirmedBy: integer("attendance_confirmed_by"),
	attendanceConfirmedAt: timestamp("attendance_confirmed_at", { mode: 'string' }),
	pointsAwarded: integer("points_awarded").default(0),
}, (table) => [
	index("registrations_event_idx").using("btree", table.eventId.asc().nullsLast().op("int4_ops")),
	index("registrations_user_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_registrations_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "event_registrations_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.attendanceConfirmedBy],
			foreignColumns: [users.id],
			name: "event_registrations_attendance_confirmed_by_users_id_fk"
		}),
	unique("event_registrations_event_id_user_id_unique").on(table.eventId, table.userId),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	eventType: eventType("event_type").notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	timezone: varchar({ length: 50 }).default('America/Los_Angeles'),
	locationType: locationType("location_type").notNull(),
	locationDetails: jsonb("location_details"),
	capacity: integer(),
	currentRegistrations: integer("current_registrations").default(0),
	registrationDeadline: timestamp("registration_deadline", { mode: 'string' }),
	waitlistEnabled: boolean("waitlist_enabled").default(false),
	isMembersOnly: boolean("is_members_only").default(false),
	requiredMembershipTier: membershipTier("required_membership_tier"),
	agenda: jsonb(),
	speakers: jsonb(),
	materials: jsonb(),
	actualAttendance: integer("actual_attendance"),
	feedbackScore: numeric("feedback_score", { precision: 3, scale:  2 }),
	createdBy: integer("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("events_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("int4_ops")),
	index("events_start_time_idx").using("btree", table.startTime.asc().nullsLast().op("timestamp_ops")),
	index("events_type_idx").using("btree", table.eventType.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "events_created_by_users_id_fk"
		}),
]);

export const resources = pgTable("resources", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	resourceType: resourceType("resource_type").notNull(),
	fileUrl: varchar("file_url", { length: 500 }),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	tags: jsonb(),
	viewCount: integer("view_count").default(0),
	downloadCount: integer("download_count").default(0),
	uploadedBy: integer("uploaded_by").notNull(),
	requiredRoles: jsonb("required_roles"),
	categories: jsonb(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow().notNull(),
	averageRating: numeric("average_rating", { precision: 3, scale:  2 }),
	accessLevel: resourceAccessLevel("access_level").default('member').notNull(),
}, (table) => [
	index("resources_access_level_idx").using("btree", table.accessLevel.asc().nullsLast().op("enum_ops")),
	index("resources_type_idx").using("btree", table.resourceType.asc().nullsLast().op("enum_ops")),
	index("resources_uploaded_by_idx").using("btree", table.uploadedBy.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "resources_uploaded_by_users_id_fk"
		}),
]);

export const menteeProfiles = pgTable("mentee_profiles", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	learningGoals: jsonb("learning_goals"),
	preferredExpertiseAreas: jsonb("preferred_expertise_areas"),
	preferredMeetingFrequency: varchar("preferred_meeting_frequency", { length: 50 }),
	bio: text(),
	profileCompletedAt: timestamp("profile_completed_at", { mode: 'string' }),
	careerStage: varchar("career_stage", { length: 100 }),
	currentChallenge: text("current_challenge"),
	mbtiType: mbtiType("mbti_type"),
	photoUrl: varchar("photo_url", { length: 500 }),
	formSubmissionId: integer("form_submission_id"),
}, (table) => [
	index("mentee_profiles_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "mentee_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("mentee_profiles_user_id_unique").on(table.userId),
]);

export const eventRoleAssignments = pgTable("event_role_assignments", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	userId: integer("user_id").notNull(),
	roleType: varchar("role_type", { length: 50 }).notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow().notNull(),
	assignedBy: integer("assigned_by"),
	notes: text(),
}, (table) => [
	index("event_role_assignments_event_idx").using("btree", table.eventId.asc().nullsLast().op("int4_ops")),
	index("event_role_assignments_role_type_idx").using("btree", table.roleType.asc().nullsLast().op("text_ops")),
	index("event_role_assignments_user_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_role_assignments_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "event_role_assignments_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [users.id],
			name: "event_role_assignments_assigned_by_users_id_fk"
		}),
	unique("event_role_assignments_event_id_user_id_role_type_unique").on(table.eventId, table.userId, table.roleType),
]);

export const userMentorshipStats = pgTable("user_mentorship_stats", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	menteesCount: integer("mentees_count").default(0),
	mentorsCount: integer("mentors_count").default(0),
	totalMeetings: integer("total_meetings").default(0),
	completedMeetings: integer("completed_meetings").default(0),
	totalMeetingHours: numeric("total_meeting_hours", { precision: 10, scale:  2 }).default('0'),
	eventsAttended: integer("events_attended").default(0),
	eventsRegistered: integer("events_registered").default(0),
	resourcesUploaded: integer("resources_uploaded").default(0),
	resourcesAccessed: integer("resources_accessed").default(0),
	lastActivityAt: timestamp("last_activity_at", { mode: 'string' }),
	statsUpdatedAt: timestamp("stats_updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_mentorship_stats_updated_idx").using("btree", table.statsUpdatedAt.asc().nullsLast().op("timestamp_ops")),
	index("user_mentorship_stats_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_mentorship_stats_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_mentorship_stats_user_id_unique").on(table.userId),
]);

export const membershipFeatures = pgTable("membership_features", {
	id: serial().primaryKey().notNull(),
	tier: membershipTier().notNull(),
	featureName: varchar("feature_name", { length: 100 }).notNull(),
	featureValue: jsonb("feature_value"),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("membership_features_tier_idx").using("btree", table.tier.asc().nullsLast().op("enum_ops")),
	unique("membership_features_tier_feature_name_unique").on(table.tier, table.featureName),
]);

export const experienceLevels = pgTable("experience_levels", {
	id: serial().primaryKey().notNull(),
	level: integer().notNull(),
	name: varchar({ length: 100 }).notNull(),
	minPoints: integer("min_points").notNull(),
	maxPoints: integer("max_points"),
	badgeImageUrl: varchar("badge_image_url", { length: 500 }),
	benefits: jsonb(),
	color: varchar({ length: 20 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("experience_levels_level_unique").on(table.level),
]);

export const industryOptions = pgTable("industry_options", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("industry_options_name_unique").on(table.name),
]);

export const membershipBenefits = pgTable("membership_benefits", {
	id: serial().primaryKey().notNull(),
	tier: membershipTier().notNull(),
	benefitKey: varchar("benefit_key", { length: 100 }).notNull(),
	benefitName: varchar("benefit_name", { length: 200 }).notNull(),
	description: text(),
	isIncluded: boolean("is_included").default(false),
	quantityLimit: integer("quantity_limit"),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("membership_benefits_tier_benefit_key_unique").on(table.tier, table.benefitKey),
]);

export const pointsRules = pgTable("points_rules", {
	id: serial().primaryKey().notNull(),
	transactionType: pointsTransactionType("transaction_type").notNull(),
	eventType: eventType("event_type"),
	pointsAmount: integer("points_amount").notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	validFrom: timestamp("valid_from", { mode: 'string' }),
	validUntil: timestamp("valid_until", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const aiMatchResults = pgTable("ai_match_results", {
	id: serial().primaryKey().notNull(),
	mentorUserId: integer("mentor_user_id").notNull(),
	menteeUserId: integer("mentee_user_id").notNull(),
	overallScore: numeric("overall_score", { precision: 5, scale:  2 }).notNull(),
	mbtiCompatibilityScore: numeric("mbti_compatibility_score", { precision: 5, scale:  2 }),
	skillMatchScore: numeric("skill_match_score", { precision: 5, scale:  2 }),
	goalAlignmentScore: numeric("goal_alignment_score", { precision: 5, scale:  2 }),
	industryMatchScore: numeric("industry_match_score", { precision: 5, scale:  2 }),
	matchingFactors: jsonb("matching_factors"),
	aiModelVersion: varchar("ai_model_version", { length: 50 }),
	matchingAlgorithm: varchar("matching_algorithm", { length: 100 }),
	status: matchStatus().default('pending_review').notNull(),
	reviewedBy: integer("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewNotes: text("review_notes"),
	relationshipId: integer("relationship_id"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	logisticsScore: numeric("logistics_score", { precision: 5, scale:  2 }),
	aiExplanation: text("ai_explanation"),
	aiRecommendation: text("ai_recommendation"),
	confidenceLevel: confidenceLevel("confidence_level"),
	potentialChallenges: jsonb("potential_challenges"),
	suggestedFocusAreas: jsonb("suggested_focus_areas"),
	processingTimeMs: integer("processing_time_ms"),
	tokenUsage: jsonb("token_usage"),
}, (table) => [
	index("ai_match_results_mentee_idx").using("btree", table.menteeUserId.asc().nullsLast().op("int4_ops")),
	index("ai_match_results_mentor_idx").using("btree", table.mentorUserId.asc().nullsLast().op("int4_ops")),
	index("ai_match_results_score_idx").using("btree", table.overallScore.asc().nullsLast().op("numeric_ops")),
	index("ai_match_results_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.mentorUserId],
			foreignColumns: [users.id],
			name: "ai_match_results_mentor_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.menteeUserId],
			foreignColumns: [users.id],
			name: "ai_match_results_mentee_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "ai_match_results_reviewed_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.relationshipId],
			foreignColumns: [mentorshipRelationships.id],
			name: "ai_match_results_relationship_id_mentorship_relationships_id_fk"
		}),
	unique("ai_match_results_mentor_user_id_mentee_user_id_unique").on(table.mentorUserId, table.menteeUserId),
]);

export const membershipPurchases = pgTable("membership_purchases", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
	stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
	stripePriceId: varchar("stripe_price_id", { length: 255 }),
	amountPaid: numeric("amount_paid", { precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 3 }).default('NZD').notNull(),
	membershipTier: membershipTier("membership_tier").notNull(),
	periodStart: timestamp("period_start", { mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { mode: 'string' }).notNull(),
	subscriptionStatus: subscriptionStatus("subscription_status").notNull(),
	autoRenew: boolean("auto_renew").default(true),
	canceledAt: timestamp("canceled_at", { mode: 'string' }),
	cancelReason: text("cancel_reason"),
	invoiceUrl: varchar("invoice_url", { length: 500 }),
	receiptUrl: varchar("receipt_url", { length: 500 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("membership_purchases_period_end_idx").using("btree", table.periodEnd.asc().nullsLast().op("timestamp_ops")),
	index("membership_purchases_status_idx").using("btree", table.subscriptionStatus.asc().nullsLast().op("enum_ops")),
	index("membership_purchases_stripe_sub_idx").using("btree", table.stripeSubscriptionId.asc().nullsLast().op("text_ops")),
	index("membership_purchases_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "membership_purchases_user_id_users_id_fk"
		}).onDelete("set null"),
	unique("membership_purchases_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);

export const invitationCodeUsages = pgTable("invitation_code_usages", {
	id: serial().primaryKey().notNull(),
	codeId: integer("code_id").notNull(),
	usedByUserId: integer("used_by_user_id").notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
}, (table) => [
	index("invitation_code_usages_code_id_idx").using("btree", table.codeId.asc().nullsLast().op("int4_ops")),
	index("invitation_code_usages_user_id_idx").using("btree", table.usedByUserId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.codeId],
			foreignColumns: [invitationCodes.id],
			name: "invitation_code_usages_code_id_invitation_codes_id_fk"
		}),
	foreignKey({
			columns: [table.usedByUserId],
			foreignColumns: [users.id],
			name: "invitation_code_usages_used_by_user_id_users_id_fk"
		}),
]);

export const pointsTransactions = pgTable("points_transactions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	transactionType: pointsTransactionType("transaction_type").notNull(),
	points: integer().notNull(),
	balanceAfter: integer("balance_after").notNull(),
	sourceEntityType: varchar("source_entity_type", { length: 50 }),
	sourceEntityId: integer("source_entity_id"),
	description: text(),
	confirmedBy: integer("confirmed_by"),
	confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("points_transactions_source_idx").using("btree", table.sourceEntityType.asc().nullsLast().op("int4_ops"), table.sourceEntityId.asc().nullsLast().op("int4_ops")),
	index("points_transactions_type_idx").using("btree", table.transactionType.asc().nullsLast().op("enum_ops")),
	index("points_transactions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "points_transactions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.confirmedBy],
			foreignColumns: [users.id],
			name: "points_transactions_confirmed_by_users_id_fk"
		}),
]);

export const rewardRedemptions = pgTable("reward_redemptions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	rewardId: integer("reward_id").notNull(),
	pointsSpent: integer("points_spent").notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	fulfilledAt: timestamp("fulfilled_at", { mode: 'string' }),
	fulfilledBy: integer("fulfilled_by"),
	notes: text(),
	redeemedAt: timestamp("redeemed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reward_redemptions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.rewardId],
			foreignColumns: [rewards.id],
			name: "reward_redemptions_reward_id_rewards_id_fk"
		}),
	foreignKey({
			columns: [table.fulfilledBy],
			foreignColumns: [users.id],
			name: "reward_redemptions_fulfilled_by_users_id_fk"
		}),
]);

export const rewards = pgTable("rewards", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	pointsCost: integer("points_cost").notNull(),
	imageUrl: varchar("image_url", { length: 500 }),
	category: varchar({ length: 100 }),
	quantityAvailable: integer("quantity_available"),
	quantityRedeemed: integer("quantity_redeemed").default(0),
	isActive: boolean("is_active").default(true),
	validFrom: timestamp("valid_from", { mode: 'string' }),
	validUntil: timestamp("valid_until", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const skillOptions = pgTable("skill_options", {
	id: serial().primaryKey().notNull(),
	category: skillCategory().notNull(),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	isSystemDefined: boolean("is_system_defined").default(true),
	usageCount: integer("usage_count").default(0),
	createdBy: integer("created_by"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("skill_options_category_idx").using("btree", table.category.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "skill_options_created_by_users_id_fk"
		}),
	unique("skill_options_category_name_unique").on(table.category, table.name),
]);

export const userMilestones = pgTable("user_milestones", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	milestoneId: integer("milestone_id").notNull(),
	achievedAt: timestamp("achieved_at", { mode: 'string' }).defaultNow().notNull(),
	pointsAwarded: integer("points_awarded"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_milestones_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.milestoneId],
			foreignColumns: [milestones.id],
			name: "user_milestones_milestone_id_milestones_id_fk"
		}),
	unique("user_milestones_user_id_milestone_id_unique").on(table.userId, table.milestoneId),
]);

export const milestones = pgTable("milestones", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	milestoneType: varchar("milestone_type", { length: 50 }).notNull(),
	targetValue: integer("target_value").notNull(),
	rewardPoints: integer("reward_points").default(0),
	badgeImageUrl: varchar("badge_image_url", { length: 500 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const userPoints = pgTable("user_points", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	currentPoints: integer("current_points").default(0).notNull(),
	lifetimePoints: integer("lifetime_points").default(0).notNull(),
	experienceLevel: integer("experience_level").default(1).notNull(),
	experienceLevelName: varchar("experience_level_name", { length: 100 }).default('Newcomer'),
	eventsAttended: integer("events_attended").default(0).notNull(),
	meetingsCompleted: integer("meetings_completed").default(0).notNull(),
	lastMilestoneAchieved: varchar("last_milestone_achieved", { length: 100 }),
	nextMilestoneTarget: integer("next_milestone_target"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_points_level_idx").using("btree", table.experienceLevel.asc().nullsLast().op("int4_ops")),
	index("user_points_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_points_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_points_user_id_unique").on(table.userId),
]);

export const invitationCodes = pgTable("invitation_codes", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 32 }).notNull(),
	codeType: invitationCodeType("code_type").default('payment').notNull(),
	status: invitationCodeStatus().default('active').notNull(),
	maxUses: integer("max_uses").default(1),
	currentUses: integer("current_uses").default(0).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	purchaseId: integer("purchase_id"),
	generatedBy: integer("generated_by"),
	generatedFor: varchar("generated_for", { length: 255 }),
	notes: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	targetRole: userRoleType("target_role"),
	linkedFormId: integer("linked_form_id"),
	linkedFormType: varchar("linked_form_type", { length: 20 }),
}, (table) => [
	index("invitation_codes_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("invitation_codes_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("invitation_codes_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("invitation_codes_target_role_idx").using("btree", table.targetRole.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.generatedBy],
			foreignColumns: [users.id],
			name: "invitation_codes_generated_by_users_id_fk"
		}),
	unique("invitation_codes_code_unique").on(table.code),
]);

export const menteeFormSubmissions = pgTable("mentee_form_submissions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	email: varchar({ length: 255 }),
	status: formStatus().default('not_started').notNull(),
	lastSavedAt: timestamp("last_saved_at", { mode: 'string' }),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewedBy: integer("reviewed_by"),
	reviewNotes: text("review_notes"),
	fullName: varchar("full_name", { length: 200 }),
	age: integer(),
	phone: varchar({ length: 50 }),
	currentStage: careerStage("current_stage"),
	photoUrl: varchar("photo_url", { length: 500 }),
	photoUploadedAt: timestamp("photo_uploaded_at", { mode: 'string' }),
	bio: text(),
	currentJobTitle: varchar("current_job_title", { length: 200 }),
	currentIndustry: varchar("current_industry", { length: 200 }),
	preferredIndustries: jsonb("preferred_industries"),
	softSkillsBasic: jsonb("soft_skills_basic"),
	industrySkillsBasic: jsonb("industry_skills_basic"),
	softSkillsExpert: jsonb("soft_skills_expert"),
	industrySkillsExpert: jsonb("industry_skills_expert"),
	longTermGoals: text("long_term_goals"),
	shortTermGoals: text("short_term_goals"),
	whyMentor: text("why_mentor"),
	programExpectations: text("program_expectations"),
	mbtiType: mbtiType("mbti_type"),
	preferredMeetingFrequency: varchar("preferred_meeting_frequency", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	paymentCompleted: boolean("payment_completed").default(false),
	paymentCompletedAt: timestamp("payment_completed_at", { mode: 'string' }),
	purchaseId: integer("purchase_id"),
	invitationCodeId: integer("invitation_code_id"),
	gender: gender(),
	city: varchar({ length: 100 }),
	preferredMeetingFormat: meetingFormat("preferred_meeting_format"),
}, (table) => [
	index("mentee_form_submissions_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("mentee_form_submissions_payment_idx").using("btree", table.paymentCompleted.asc().nullsLast().op("bool_ops")),
	index("mentee_form_submissions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("mentee_form_submissions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "mentee_form_submissions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "mentee_form_submissions_reviewed_by_users_id_fk"
		}),
	unique("mentee_form_submissions_user_id_unique").on(table.userId),
]);

export const mentorFormSubmissions = pgTable("mentor_form_submissions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	email: varchar({ length: 255 }),
	status: formStatus().default('not_started').notNull(),
	lastSavedAt: timestamp("last_saved_at", { mode: 'string' }),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewedBy: integer("reviewed_by"),
	reviewNotes: text("review_notes"),
	fullName: varchar("full_name", { length: 200 }),
	gender: gender(),
	phone: varchar({ length: 50 }),
	jobTitle: varchar("job_title", { length: 200 }),
	company: varchar({ length: 200 }),
	photoUrl: varchar("photo_url", { length: 500 }),
	photoUploadedAt: timestamp("photo_uploaded_at", { mode: 'string' }),
	bioMethod: bioMethod("bio_method"),
	bio: text(),
	softSkillsBasic: jsonb("soft_skills_basic"),
	industrySkillsBasic: jsonb("industry_skills_basic"),
	softSkillsExpert: jsonb("soft_skills_expert"),
	industrySkillsExpert: jsonb("industry_skills_expert"),
	expectedMenteeGoalsLongTerm: text("expected_mentee_goals_long_term"),
	expectedMenteeGoalsShortTerm: text("expected_mentee_goals_short_term"),
	programExpectations: text("program_expectations"),
	preferredMenteeTypes: jsonb("preferred_mentee_types"),
	preferredIndustries: jsonb("preferred_industries"),
	mbtiType: mbtiType("mbti_type"),
	yearsExperience: integer("years_experience"),
	linkedinUrl: varchar("linkedin_url", { length: 500 }),
	availabilityHoursPerMonth: integer("availability_hours_per_month"),
	maxMentees: integer("max_mentees").default(3),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	city: varchar({ length: 100 }),
	preferredMeetingFormat: meetingFormat("preferred_meeting_format"),
}, (table) => [
	index("mentor_form_submissions_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("mentor_form_submissions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("mentor_form_submissions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "mentor_form_submissions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "mentor_form_submissions_reviewed_by_users_id_fk"
		}),
	unique("mentor_form_submissions_user_id_unique").on(table.userId),
]);

export const aiMatchingRuns = pgTable("ai_matching_runs", {
	id: serial().primaryKey().notNull(),
	runType: varchar("run_type", { length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('running').notNull(),
	menteesProcessed: integer("mentees_processed").default(0),
	matchesGenerated: integer("matches_generated").default(0),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	triggeredBy: integer("triggered_by"),
	summary: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	menteeUserId: integer("mentee_user_id"),
	totalApiCalls: integer("total_api_calls").default(0),
	totalTokensUsed: integer("total_tokens_used").default(0),
	averageProcessingTimeMs: integer("average_processing_time_ms"),
	errorDetails: jsonb("error_details"),
}, (table) => [
	foreignKey({
			columns: [table.triggeredBy],
			foreignColumns: [users.id],
			name: "ai_matching_runs_triggered_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.menteeUserId],
			foreignColumns: [users.id],
			name: "ai_matching_runs_mentee_user_id_users_id_fk"
		}),
]);

export const verificationToken = pgTable("verification_token", {
	identifier: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_token_identifier_token_pk"}),
]);

export const account = pgTable("account", {
	userId: integer("user_id").notNull(),
	type: varchar({ length: 255 }).notNull(),
	provider: varchar({ length: 255 }).notNull(),
	providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: varchar("token_type", { length: 255 }),
	scope: varchar({ length: 255 }),
	idToken: text("id_token"),
	sessionState: varchar("session_state", { length: 255 }),
}, (table) => [
	index("account_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "account_user_id_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_provider_account_id_pk"}),
]);
