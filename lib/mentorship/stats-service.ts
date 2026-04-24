/**
 * Mentorship statistics aggregation service.
 *
 * Produces a weekly snapshot of mentor/mentee pipeline counts plus follow-up
 * lists of people who need human attention (awaiting admin review,
 * approved-but-not-registered). Test users are excluded from every metric.
 */

import { and, asc, eq, isNull, ne, or, sql, type AnyColumn } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db/drizzle';
import {
  menteeFormSubmissions,
  menteeWaitingQueue,
  mentorFormSubmissions,
  mentorshipRelationships,
  users,
} from '@/lib/db/schema';

export const FOLLOWUP_LIST_LIMIT = 10;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface FormFunnelCounts {
  /** submitted + approved + rejected (drafts excluded) */
  total: number;
  awaitingReview: number;
  approved: number;
  approvedRegistered: number;
  approvedNotRegistered: number;
  rejected: number;
  drafts: number;
}

export interface FollowupEntry {
  fullName: string;
  email: string;
  waitingDays: number;
}

export interface FollowupList {
  total: number;
  entries: FollowupEntry[];
  truncated: boolean;
}

export interface MentorshipStatsSnapshot {
  generatedAt: Date;
  mentors: FormFunnelCounts;
  mentees: FormFunnelCounts;
  activeRelationships: number;
  waitingQueueLength: number;
  mentorAwaitingReview: FollowupList;
  menteeAwaitingReview: FollowupList;
  mentorApprovedNotRegistered: FollowupList;
  menteeApprovedNotRegistered: FollowupList;
}

/** A form row joined with the user is non-test when either userId is null OR users.isTestUser is false. */
function nonTestUser(formUserCol: AnyColumn) {
  return or(isNull(formUserCol), ne(users.isTestUser, true));
}

async function countForm(
  table: typeof mentorFormSubmissions | typeof menteeFormSubmissions,
  predicate: ReturnType<typeof and>,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .leftJoin(users, eq(table.userId, users.id))
    .where(predicate);
  return Number(row?.count ?? 0);
}

async function getFunnelCounts(
  table: typeof mentorFormSubmissions | typeof menteeFormSubmissions,
): Promise<FormFunnelCounts> {
  const baseFilter = nonTestUser(table.userId);

  const [
    awaitingReview,
    approved,
    approvedRegistered,
    approvedNotRegistered,
    rejected,
    drafts,
  ] = await Promise.all([
    countForm(table, and(baseFilter, eq(table.status, 'submitted'))),
    countForm(table, and(baseFilter, eq(table.status, 'approved'))),
    countForm(
      table,
      and(baseFilter, eq(table.status, 'approved'), sql`${table.userId} IS NOT NULL`),
    ),
    countForm(
      table,
      and(baseFilter, eq(table.status, 'approved'), isNull(table.userId)),
    ),
    countForm(table, and(baseFilter, eq(table.status, 'rejected'))),
    countForm(
      table,
      and(baseFilter, sql`${table.status} IN ('not_started', 'in_progress')`),
    ),
  ]);

  return {
    total: awaitingReview + approved + rejected,
    awaitingReview,
    approved,
    approvedRegistered,
    approvedNotRegistered,
    rejected,
    drafts,
  };
}

async function getAwaitingReviewList(
  table: typeof mentorFormSubmissions | typeof menteeFormSubmissions,
): Promise<FollowupList> {
  const where = and(nonTestUser(table.userId), eq(table.status, 'submitted'));

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(table)
    .leftJoin(users, eq(table.userId, users.id))
    .where(where);

  const rows = await db
    .select({
      fullName: table.fullName,
      formEmail: table.email,
      userEmail: users.email,
      submittedAt: table.submittedAt,
    })
    .from(table)
    .leftJoin(users, eq(table.userId, users.id))
    .where(where)
    .orderBy(asc(table.submittedAt))
    .limit(FOLLOWUP_LIST_LIMIT);

  const totalCount = Number(total ?? 0);
  const entries = rows.map((r) => toFollowupEntry(r.fullName, r.formEmail, r.userEmail, r.submittedAt));

  return {
    total: totalCount,
    entries,
    truncated: totalCount > entries.length,
  };
}

async function getApprovedNotRegisteredList(
  table: typeof mentorFormSubmissions | typeof menteeFormSubmissions,
): Promise<FollowupList> {
  // userId IS NULL by definition means form has no linked user, so test-user filter is moot.
  const where = and(eq(table.status, 'approved'), isNull(table.userId));

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(table)
    .where(where);

  const rows = await db
    .select({
      fullName: table.fullName,
      formEmail: table.email,
      reviewedAt: table.reviewedAt,
    })
    .from(table)
    .where(where)
    .orderBy(asc(table.reviewedAt))
    .limit(FOLLOWUP_LIST_LIMIT);

  const totalCount = Number(total ?? 0);
  const entries = rows.map((r) => toFollowupEntry(r.fullName, r.formEmail, null, r.reviewedAt));

  return {
    total: totalCount,
    entries,
    truncated: totalCount > entries.length,
  };
}

function toFollowupEntry(
  fullName: string | null,
  formEmail: string | null,
  userEmail: string | null,
  reference: Date | null,
): FollowupEntry {
  const waitingDays = reference
    ? Math.max(0, Math.floor((Date.now() - reference.getTime()) / MS_PER_DAY))
    : 0;
  return {
    fullName: fullName?.trim() || '(no name)',
    email: (formEmail || userEmail || '').trim() || '(no email)',
    waitingDays,
  };
}

async function getActiveRelationshipsCount(): Promise<number> {
  const mentorUser = alias(users, 'mentor_user');
  const menteeUser = alias(users, 'mentee_user');

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mentorshipRelationships)
    .leftJoin(mentorUser, eq(mentorUser.id, mentorshipRelationships.mentorUserId))
    .leftJoin(menteeUser, eq(menteeUser.id, mentorshipRelationships.menteeUserId))
    .where(
      and(
        eq(mentorshipRelationships.status, 'active'),
        ne(mentorUser.isTestUser, true),
        ne(menteeUser.isTestUser, true),
      ),
    );
  return Number(row?.count ?? 0);
}

async function getWaitingQueueLength(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(menteeWaitingQueue)
    .leftJoin(users, eq(menteeWaitingQueue.menteeUserId, users.id))
    .where(and(eq(menteeWaitingQueue.status, 'waiting'), ne(users.isTestUser, true)));
  return Number(row?.count ?? 0);
}

/**
 * Aggregate the full snapshot. Throws if the database is unreachable; individual
 * metric failures are not isolated (kept simple — cron handler will log + retry next week).
 */
export async function getMentorshipStatsSnapshot(): Promise<MentorshipStatsSnapshot> {
  const [
    mentors,
    mentees,
    activeRelationships,
    waitingQueueLength,
    mentorAwaitingReview,
    menteeAwaitingReview,
    mentorApprovedNotRegistered,
    menteeApprovedNotRegistered,
  ] = await Promise.all([
    getFunnelCounts(mentorFormSubmissions),
    getFunnelCounts(menteeFormSubmissions),
    getActiveRelationshipsCount(),
    getWaitingQueueLength(),
    getAwaitingReviewList(mentorFormSubmissions),
    getAwaitingReviewList(menteeFormSubmissions),
    getApprovedNotRegisteredList(mentorFormSubmissions),
    getApprovedNotRegisteredList(menteeFormSubmissions),
  ]);

  return {
    generatedAt: new Date(),
    mentors,
    mentees,
    activeRelationships,
    waitingQueueLength,
    mentorAwaitingReview,
    menteeAwaitingReview,
    mentorApprovedNotRegistered,
    menteeApprovedNotRegistered,
  };
}
