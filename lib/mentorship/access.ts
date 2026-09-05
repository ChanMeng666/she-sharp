import { db } from '@/lib/db/drizzle';
import { mentorshipRelationships, userRoles } from '@/lib/db/schema';
import { and, eq, or } from 'drizzle-orm';

/**
 * Whether a viewer may see the private half of another member's mentorship
 * profile — their email address and their application form record.
 *
 * The public half (name, photo, bio, expertise, availability) is what a mentor
 * directory is for; the private half is contact details plus everything the
 * applicant wrote on the form (phone, gender, age, city, goals, MBTI). Until
 * 2026-09-06 both halves were served to anyone at all, with no session.
 *
 * Three viewers pass, and the rule is derived from the only real call site,
 * `app/(dashboard)/dashboard/mentorship/page.tsx`, which fetches with
 * `includeFormData=true` in exactly three situations: a mentee opening their
 * matched mentor, a mentor opening a matched mentee, and a mentor reviewing a
 * *pending* application. So the relationship check must accept any status, not
 * just `active`.
 *
 * 1. The member themselves.
 * 2. An admin — checked against the `user_roles` table, which is default-DENY.
 *    Deliberately not `requiredAdminPermissions`, which is default-GRANT: a
 *    missing `admin_permissions` row means every permission, so it cannot
 *    decide who may read someone else's PII.
 * 3. The counterpart in a `mentorship_relationships` row with this member, in
 *    either direction and in any status.
 */
export async function canViewMentorshipPrivateDetails(
  viewerUserId: number,
  targetUserId: number
): Promise<boolean> {
  if (viewerUserId === targetUserId) return true;

  const [adminRole] = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, viewerUserId),
        eq(userRoles.roleType, 'admin'),
        eq(userRoles.isActive, true)
      )
    )
    .limit(1);

  if (adminRole) return true;

  const [relationship] = await db
    .select({ id: mentorshipRelationships.id })
    .from(mentorshipRelationships)
    .where(
      or(
        and(
          eq(mentorshipRelationships.mentorUserId, viewerUserId),
          eq(mentorshipRelationships.menteeUserId, targetUserId)
        ),
        and(
          eq(mentorshipRelationships.mentorUserId, targetUserId),
          eq(mentorshipRelationships.menteeUserId, viewerUserId)
        )
      )
    )
    .limit(1);

  return Boolean(relationship);
}
