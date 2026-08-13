/**
 * The one relation set that spans every domain.
 *
 * `usersRelations` names a table from each of the other modules, while all of
 * them import `users`. Defining it beside the `users` table would therefore make
 * ./users import ./mentorship, ./events, ./engagement and ./system while those
 * four import ./users — a cycle through every file in the directory. Hoisting
 * this single declaration into a leaf module keeps the graph a DAG:
 * enums -> users -> {mentorship, events, engagement, system} -> relations.
 */
import { relations } from 'drizzle-orm';

import { userMemberships } from './engagement';
import { eventRegistrations, eventRoleAssignments, events } from './events';
import {
  menteeProfiles,
  mentorProfiles,
  mentorshipRelationships,
} from './mentorship';
import {
  activityLogs,
  notifications,
  resourceAccessLogs,
  resources,
} from './system';
import {
  adminPermissions,
  emailVerifications,
  passwordHistory,
  passwordResets,
  userRoles,
  users,
} from './users';

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
