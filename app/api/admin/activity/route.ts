import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import {
  activityLogs,
  users
} from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

// Admin-only activity logs endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canViewAllData']
  },
  async (req: NextRequest, context: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Fetch recent activity logs with user information
      const activities = await db
        .select({
          id: activityLogs.id,
          userId: activityLogs.userId,
          userName: sql<string>`(SELECT name FROM users WHERE id = ${activityLogs.userId})`,
          userEmail: sql<string>`(SELECT email FROM users WHERE id = ${activityLogs.userId})`,
          action: activityLogs.action,
          entityType: activityLogs.entityType,
          entityId: activityLogs.entityId,
          metadata: activityLogs.metadata,
          ipAddress: activityLogs.ipAddress,
          timestamp: activityLogs.timestamp
        })
        .from(activityLogs)
        .orderBy(desc(activityLogs.timestamp))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(activityLogs);

      return NextResponse.json({
        activities: activities.map(activity => ({
          id: activity.id,
          userId: activity.userId,
          userName: activity.userName,
          userEmail: activity.userEmail,
          action: activity.action,
          entityType: activity.entityType,
          entityId: activity.entityId,
          metadata: activity.metadata,
          ipAddress: activity.ipAddress,
          timestamp: activity.timestamp
        })),
        pagination: {
          total: count,
          limit,
          offset,
          hasMore: offset + limit < count
        }
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activity logs' },
        { status: 500 }
      );
    }
  }
);
