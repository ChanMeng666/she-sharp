/**
 * Events: the Postgres event records, registrations, role assignments and the
 * public post-event feedback form.
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
  eventAttendAgainEnum,
  eventFeedbackSourceEnum,
  eventTypeEnum,
  formStatusEnum,
  locationTypeEnum,
  membershipTierEnum,
} from './enums';
import { users } from './users';

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

// Post-event attendee feedback, collected from a public form with no login.
//
// Three shape decisions that look like omissions and are not:
//
//  1. `eventSlug` is a plain varchar, NOT a foreign key to `events`. The public
//     site's source of truth for events is `lib/data/json/events-custom.json`;
//     the Postgres `events` table is a separate, unrelated store that most live
//     events never appear in. A FK here would reject feedback for the very
//     events people actually attend.
//  2. This cannot live in `event_registrations` — that table's `userId` is NOT
//     NULL, and this form deliberately has no sign-in step. Nobody fills in a
//     feedback form that asks them to make an account first.
//  3. No unique constraint on (eventSlug, email). Two people sharing one
//     household or work address is real, and losing the second person's answers
//     is a worse outcome than a duplicate row. De-duplication is a soft,
//     time-boxed rule in `lib/forms/event-feedback-service.ts` instead.
export const eventFeedbackSubmissions = pgTable('event_feedback_submissions', {
  id: serial('id').primaryKey(),
  eventSlug: varchar('event_slug', { length: 200 }).notNull(),
  // Snapshot of the event title as it read when this person rated it; the JSON
  // title can be edited later and the row should not silently follow it.
  eventTitle: varchar('event_title', { length: 300 }),
  overallRating: integer('overall_rating').notNull(),
  recommendScore: integer('recommend_score'),
  wouldAttendAgain: eventAttendAgainEnum('would_attend_again'),
  whatWorked: text('what_worked'),
  whatToImprove: text('what_to_improve'),
  // Ticking these expresses interest to She Sharp. It is explicitly NOT consent
  // to marketing email — the four-way consent gate in
  // `.claude/skills/update-mailing-list/references/consent-rules.md` governs the
  // mailing list, and nothing in this public path may write to Resend. Someone
  // acts on these by hand, through that skill.
  interestedInMentorship: boolean('interested_in_mentorship').notNull().default(false),
  interestedInVolunteering: boolean('interested_in_volunteering').notNull().default(false),
  interestedInNewsletter: boolean('interested_in_newsletter').notNull().default(false),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  source: eventFeedbackSourceEnum('source').notNull().default('direct_link'),
  status: formStatusEnum('status').notNull().default('submitted'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
}, (table) => ({
  eventSlugIdx: index('event_feedback_event_slug_idx').on(table.eventSlug),
  submittedAtIdx: index('event_feedback_submitted_at_idx').on(table.submittedAt),
  emailIdx: index('event_feedback_email_idx').on(table.email),
  statusIdx: index('event_feedback_status_idx').on(table.status),
}));

// ============================================================================
// RELATIONS
// ============================================================================

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

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;
export type EventRoleAssignment = typeof eventRoleAssignments.$inferSelect;
export type NewEventRoleAssignment = typeof eventRoleAssignments.$inferInsert;
export type EventFeedbackSubmission = typeof eventFeedbackSubmissions.$inferSelect;
export type NewEventFeedbackSubmission = typeof eventFeedbackSubmissions.$inferInsert;
