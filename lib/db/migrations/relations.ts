import { relations } from "drizzle-orm/relations";
import { users, userRoles, userMemberships, menteeWaitingQueue, notifications, mentorProfiles, activityLogs, teams, invitations, teamMembers, emailVerifications, passwordHistory, passwordResets, adminPermissions, mentorshipRelationships, meetings, session, resources, resourceAccessLogs, events, eventRegistrations, menteeProfiles, eventRoleAssignments, userMentorshipStats, aiMatchResults, membershipPurchases, invitationCodes, invitationCodeUsages, pointsTransactions, rewardRedemptions, rewards, skillOptions, userMilestones, milestones, userPoints, menteeFormSubmissions, mentorFormSubmissions, aiMatchingRuns, account } from "./schema";

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userRoles: many(userRoles),
	userMemberships: many(userMemberships),
	menteeWaitingQueues: many(menteeWaitingQueue),
	notifications: many(notifications),
	mentorProfiles_userId: many(mentorProfiles, {
		relationName: "mentorProfiles_userId_users_id"
	}),
	mentorProfiles_verifiedBy: many(mentorProfiles, {
		relationName: "mentorProfiles_verifiedBy_users_id"
	}),
	activityLogs: many(activityLogs),
	invitations: many(invitations),
	teamMembers: many(teamMembers),
	emailVerifications: many(emailVerifications),
	passwordHistories: many(passwordHistory),
	passwordResets: many(passwordResets),
	adminPermissions_userId: many(adminPermissions, {
		relationName: "adminPermissions_userId_users_id"
	}),
	adminPermissions_grantedBy: many(adminPermissions, {
		relationName: "adminPermissions_grantedBy_users_id"
	}),
	mentorshipRelationships_mentorUserId: many(mentorshipRelationships, {
		relationName: "mentorshipRelationships_mentorUserId_users_id"
	}),
	mentorshipRelationships_menteeUserId: many(mentorshipRelationships, {
		relationName: "mentorshipRelationships_menteeUserId_users_id"
	}),
	sessions: many(session),
	resourceAccessLogs: many(resourceAccessLogs),
	eventRegistrations_userId: many(eventRegistrations, {
		relationName: "eventRegistrations_userId_users_id"
	}),
	eventRegistrations_attendanceConfirmedBy: many(eventRegistrations, {
		relationName: "eventRegistrations_attendanceConfirmedBy_users_id"
	}),
	events: many(events),
	resources: many(resources),
	menteeProfiles: many(menteeProfiles),
	eventRoleAssignments_userId: many(eventRoleAssignments, {
		relationName: "eventRoleAssignments_userId_users_id"
	}),
	eventRoleAssignments_assignedBy: many(eventRoleAssignments, {
		relationName: "eventRoleAssignments_assignedBy_users_id"
	}),
	userMentorshipStats: many(userMentorshipStats),
	aiMatchResults_mentorUserId: many(aiMatchResults, {
		relationName: "aiMatchResults_mentorUserId_users_id"
	}),
	aiMatchResults_menteeUserId: many(aiMatchResults, {
		relationName: "aiMatchResults_menteeUserId_users_id"
	}),
	aiMatchResults_reviewedBy: many(aiMatchResults, {
		relationName: "aiMatchResults_reviewedBy_users_id"
	}),
	membershipPurchases: many(membershipPurchases),
	invitationCodeUsages: many(invitationCodeUsages),
	pointsTransactions_userId: many(pointsTransactions, {
		relationName: "pointsTransactions_userId_users_id"
	}),
	pointsTransactions_confirmedBy: many(pointsTransactions, {
		relationName: "pointsTransactions_confirmedBy_users_id"
	}),
	rewardRedemptions_userId: many(rewardRedemptions, {
		relationName: "rewardRedemptions_userId_users_id"
	}),
	rewardRedemptions_fulfilledBy: many(rewardRedemptions, {
		relationName: "rewardRedemptions_fulfilledBy_users_id"
	}),
	skillOptions: many(skillOptions),
	userMilestones: many(userMilestones),
	userPoints: many(userPoints),
	invitationCodes: many(invitationCodes),
	menteeFormSubmissions_userId: many(menteeFormSubmissions, {
		relationName: "menteeFormSubmissions_userId_users_id"
	}),
	menteeFormSubmissions_reviewedBy: many(menteeFormSubmissions, {
		relationName: "menteeFormSubmissions_reviewedBy_users_id"
	}),
	mentorFormSubmissions_userId: many(mentorFormSubmissions, {
		relationName: "mentorFormSubmissions_userId_users_id"
	}),
	mentorFormSubmissions_reviewedBy: many(mentorFormSubmissions, {
		relationName: "mentorFormSubmissions_reviewedBy_users_id"
	}),
	aiMatchingRuns_triggeredBy: many(aiMatchingRuns, {
		relationName: "aiMatchingRuns_triggeredBy_users_id"
	}),
	aiMatchingRuns_menteeUserId: many(aiMatchingRuns, {
		relationName: "aiMatchingRuns_menteeUserId_users_id"
	}),
	accounts: many(account),
}));

export const userMembershipsRelations = relations(userMemberships, ({one}) => ({
	user: one(users, {
		fields: [userMemberships.userId],
		references: [users.id]
	}),
}));

export const menteeWaitingQueueRelations = relations(menteeWaitingQueue, ({one}) => ({
	user: one(users, {
		fields: [menteeWaitingQueue.menteeUserId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const mentorProfilesRelations = relations(mentorProfiles, ({one}) => ({
	user_userId: one(users, {
		fields: [mentorProfiles.userId],
		references: [users.id],
		relationName: "mentorProfiles_userId_users_id"
	}),
	user_verifiedBy: one(users, {
		fields: [mentorProfiles.verifiedBy],
		references: [users.id],
		relationName: "mentorProfiles_verifiedBy_users_id"
	}),
}));

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	}),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	team: one(teams, {
		fields: [invitations.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [invitations.invitedBy],
		references: [users.id]
	}),
}));

export const teamsRelations = relations(teams, ({many}) => ({
	invitations: many(invitations),
	teamMembers: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id]
	}),
}));

export const emailVerificationsRelations = relations(emailVerifications, ({one}) => ({
	user: one(users, {
		fields: [emailVerifications.userId],
		references: [users.id]
	}),
}));

export const passwordHistoryRelations = relations(passwordHistory, ({one}) => ({
	user: one(users, {
		fields: [passwordHistory.userId],
		references: [users.id]
	}),
}));

export const passwordResetsRelations = relations(passwordResets, ({one}) => ({
	user: one(users, {
		fields: [passwordResets.userId],
		references: [users.id]
	}),
}));

export const adminPermissionsRelations = relations(adminPermissions, ({one}) => ({
	user_userId: one(users, {
		fields: [adminPermissions.userId],
		references: [users.id],
		relationName: "adminPermissions_userId_users_id"
	}),
	user_grantedBy: one(users, {
		fields: [adminPermissions.grantedBy],
		references: [users.id],
		relationName: "adminPermissions_grantedBy_users_id"
	}),
}));

export const meetingsRelations = relations(meetings, ({one}) => ({
	mentorshipRelationship: one(mentorshipRelationships, {
		fields: [meetings.relationshipId],
		references: [mentorshipRelationships.id]
	}),
}));

export const mentorshipRelationshipsRelations = relations(mentorshipRelationships, ({one, many}) => ({
	meetings: many(meetings),
	user_mentorUserId: one(users, {
		fields: [mentorshipRelationships.mentorUserId],
		references: [users.id],
		relationName: "mentorshipRelationships_mentorUserId_users_id"
	}),
	user_menteeUserId: one(users, {
		fields: [mentorshipRelationships.menteeUserId],
		references: [users.id],
		relationName: "mentorshipRelationships_menteeUserId_users_id"
	}),
	aiMatchResults: many(aiMatchResults),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(users, {
		fields: [session.userId],
		references: [users.id]
	}),
}));

export const resourceAccessLogsRelations = relations(resourceAccessLogs, ({one}) => ({
	resource: one(resources, {
		fields: [resourceAccessLogs.resourceId],
		references: [resources.id]
	}),
	user: one(users, {
		fields: [resourceAccessLogs.userId],
		references: [users.id]
	}),
}));

export const resourcesRelations = relations(resources, ({one, many}) => ({
	resourceAccessLogs: many(resourceAccessLogs),
	user: one(users, {
		fields: [resources.uploadedBy],
		references: [users.id]
	}),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({one}) => ({
	event: one(events, {
		fields: [eventRegistrations.eventId],
		references: [events.id]
	}),
	user_userId: one(users, {
		fields: [eventRegistrations.userId],
		references: [users.id],
		relationName: "eventRegistrations_userId_users_id"
	}),
	user_attendanceConfirmedBy: one(users, {
		fields: [eventRegistrations.attendanceConfirmedBy],
		references: [users.id],
		relationName: "eventRegistrations_attendanceConfirmedBy_users_id"
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	eventRegistrations: many(eventRegistrations),
	user: one(users, {
		fields: [events.createdBy],
		references: [users.id]
	}),
	eventRoleAssignments: many(eventRoleAssignments),
}));

export const menteeProfilesRelations = relations(menteeProfiles, ({one}) => ({
	user: one(users, {
		fields: [menteeProfiles.userId],
		references: [users.id]
	}),
}));

export const eventRoleAssignmentsRelations = relations(eventRoleAssignments, ({one}) => ({
	event: one(events, {
		fields: [eventRoleAssignments.eventId],
		references: [events.id]
	}),
	user_userId: one(users, {
		fields: [eventRoleAssignments.userId],
		references: [users.id],
		relationName: "eventRoleAssignments_userId_users_id"
	}),
	user_assignedBy: one(users, {
		fields: [eventRoleAssignments.assignedBy],
		references: [users.id],
		relationName: "eventRoleAssignments_assignedBy_users_id"
	}),
}));

export const userMentorshipStatsRelations = relations(userMentorshipStats, ({one}) => ({
	user: one(users, {
		fields: [userMentorshipStats.userId],
		references: [users.id]
	}),
}));

export const aiMatchResultsRelations = relations(aiMatchResults, ({one}) => ({
	user_mentorUserId: one(users, {
		fields: [aiMatchResults.mentorUserId],
		references: [users.id],
		relationName: "aiMatchResults_mentorUserId_users_id"
	}),
	user_menteeUserId: one(users, {
		fields: [aiMatchResults.menteeUserId],
		references: [users.id],
		relationName: "aiMatchResults_menteeUserId_users_id"
	}),
	user_reviewedBy: one(users, {
		fields: [aiMatchResults.reviewedBy],
		references: [users.id],
		relationName: "aiMatchResults_reviewedBy_users_id"
	}),
	mentorshipRelationship: one(mentorshipRelationships, {
		fields: [aiMatchResults.relationshipId],
		references: [mentorshipRelationships.id]
	}),
}));

export const membershipPurchasesRelations = relations(membershipPurchases, ({one}) => ({
	user: one(users, {
		fields: [membershipPurchases.userId],
		references: [users.id]
	}),
}));

export const invitationCodeUsagesRelations = relations(invitationCodeUsages, ({one}) => ({
	invitationCode: one(invitationCodes, {
		fields: [invitationCodeUsages.codeId],
		references: [invitationCodes.id]
	}),
	user: one(users, {
		fields: [invitationCodeUsages.usedByUserId],
		references: [users.id]
	}),
}));

export const invitationCodesRelations = relations(invitationCodes, ({one, many}) => ({
	invitationCodeUsages: many(invitationCodeUsages),
	user: one(users, {
		fields: [invitationCodes.generatedBy],
		references: [users.id]
	}),
}));

export const pointsTransactionsRelations = relations(pointsTransactions, ({one}) => ({
	user_userId: one(users, {
		fields: [pointsTransactions.userId],
		references: [users.id],
		relationName: "pointsTransactions_userId_users_id"
	}),
	user_confirmedBy: one(users, {
		fields: [pointsTransactions.confirmedBy],
		references: [users.id],
		relationName: "pointsTransactions_confirmedBy_users_id"
	}),
}));

export const rewardRedemptionsRelations = relations(rewardRedemptions, ({one}) => ({
	user_userId: one(users, {
		fields: [rewardRedemptions.userId],
		references: [users.id],
		relationName: "rewardRedemptions_userId_users_id"
	}),
	reward: one(rewards, {
		fields: [rewardRedemptions.rewardId],
		references: [rewards.id]
	}),
	user_fulfilledBy: one(users, {
		fields: [rewardRedemptions.fulfilledBy],
		references: [users.id],
		relationName: "rewardRedemptions_fulfilledBy_users_id"
	}),
}));

export const rewardsRelations = relations(rewards, ({many}) => ({
	rewardRedemptions: many(rewardRedemptions),
}));

export const skillOptionsRelations = relations(skillOptions, ({one}) => ({
	user: one(users, {
		fields: [skillOptions.createdBy],
		references: [users.id]
	}),
}));

export const userMilestonesRelations = relations(userMilestones, ({one}) => ({
	user: one(users, {
		fields: [userMilestones.userId],
		references: [users.id]
	}),
	milestone: one(milestones, {
		fields: [userMilestones.milestoneId],
		references: [milestones.id]
	}),
}));

export const milestonesRelations = relations(milestones, ({many}) => ({
	userMilestones: many(userMilestones),
}));

export const userPointsRelations = relations(userPoints, ({one}) => ({
	user: one(users, {
		fields: [userPoints.userId],
		references: [users.id]
	}),
}));

export const menteeFormSubmissionsRelations = relations(menteeFormSubmissions, ({one}) => ({
	user_userId: one(users, {
		fields: [menteeFormSubmissions.userId],
		references: [users.id],
		relationName: "menteeFormSubmissions_userId_users_id"
	}),
	user_reviewedBy: one(users, {
		fields: [menteeFormSubmissions.reviewedBy],
		references: [users.id],
		relationName: "menteeFormSubmissions_reviewedBy_users_id"
	}),
}));

export const mentorFormSubmissionsRelations = relations(mentorFormSubmissions, ({one}) => ({
	user_userId: one(users, {
		fields: [mentorFormSubmissions.userId],
		references: [users.id],
		relationName: "mentorFormSubmissions_userId_users_id"
	}),
	user_reviewedBy: one(users, {
		fields: [mentorFormSubmissions.reviewedBy],
		references: [users.id],
		relationName: "mentorFormSubmissions_reviewedBy_users_id"
	}),
}));

export const aiMatchingRunsRelations = relations(aiMatchingRuns, ({one}) => ({
	user_triggeredBy: one(users, {
		fields: [aiMatchingRuns.triggeredBy],
		references: [users.id],
		relationName: "aiMatchingRuns_triggeredBy_users_id"
	}),
	user_menteeUserId: one(users, {
		fields: [aiMatchingRuns.menteeUserId],
		references: [users.id],
		relationName: "aiMatchingRuns_menteeUserId_users_id"
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(users, {
		fields: [account.userId],
		references: [users.id]
	}),
}));