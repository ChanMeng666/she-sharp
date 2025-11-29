import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  mentorProfiles,
  eventRegistrations,
  events,
  users,
} from '@/lib/db/schema';
import { sql, isNull, gte } from 'drizzle-orm';

// Admin-only pending tasks endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin']
  },
  async (req: NextRequest, context: any) => {
    try {
      const now = new Date().toISOString();

      // Get pending mentor applications count
      const [{ pendingMentors }] = await db
        .select({ pendingMentors: sql<number>`count(*)` })
        .from(mentorProfiles)
        .where(isNull(mentorProfiles.verifiedAt));

      // Get upcoming events with pending registrations that need approval
      // (Events that are upcoming and have registrations)
      const [{ pendingEventRegistrations }] = await db
        .select({ pendingEventRegistrations: sql<number>`count(DISTINCT ${events.id})` })
        .from(events)
        .innerJoin(eventRegistrations, sql`${eventRegistrations.eventId} = ${events.id}`)
        .where(
          sql`${events.startTime} >= ${now}::timestamp AND ${events.currentRegistrations} > 0`
        );

      // For content moderation, we'll use a placeholder count
      // In a real system, you would query resources table with a 'pending' status
      // For now, just return 0 until the resources moderation system is implemented
      const recentResources = 0;

      // For membership upgrades, count users who might have pending upgrade requests
      // In a real system, you might have a pending_upgrades table
      // For now, we'll use a placeholder count
      const membershipUpgrades = 0; // Placeholder - implement when you have upgrade system

      // For system logs that need review, use a simple count
      // In a real system, you might flag certain log entries for review
      const systemLogs = 0; // Placeholder - implement when you have log review system

      const tasks = [
        {
          task: 'Review mentor applications',
          count: pendingMentors,
          priority: 'high' as const,
          href: '/dashboard/admin/mentors/applications'
        },
        {
          task: 'Approve event registrations',
          count: pendingEventRegistrations,
          priority: 'medium' as const,
          href: '/dashboard/admin/events/registrations'
        },
        {
          task: 'Moderate content',
          count: recentResources,
          priority: 'low' as const,
          href: '/dashboard/admin/content/resources'
        },
        {
          task: 'Process membership upgrades',
          count: membershipUpgrades,
          priority: 'medium' as const,
          href: '/dashboard/admin/settings/membership'
        },
        {
          task: 'Review system logs',
          count: systemLogs,
          priority: 'low' as const,
          href: '/dashboard/admin/settings/audit'
        },
      ];

      // Calculate total pending tasks
      const totalCount = tasks.reduce((sum, task) => sum + task.count, 0);

      return NextResponse.json({
        tasks,
        totalCount
      });
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending tasks' },
        { status: 500 }
      );
    }
  }
);
