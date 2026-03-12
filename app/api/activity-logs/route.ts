import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { activityLogs, users, adminPermissions } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const scope = searchParams.get('scope'); // 'personal', 'team', or 'all'
    const offset = (page - 1) * limit;

    // Check if user is admin for 'all' scope
    let isAdmin = false;
    if (scope === 'all') {
      const [adminRole] = await db
        .select()
        .from(adminPermissions)
        .where(eq(adminPermissions.userId, user.id))
        .limit(1);
      
      isAdmin = !!(adminRole && adminRole.canViewAllData);
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required to view all activity logs' },
          { status: 403 }
        );
      }
    }

    // Build query conditions
    const conditions = [];

    // Scope filtering
    if (scope === 'personal' || !scope) {
      conditions.push(eq(activityLogs.userId, user.id));
    }
    // For 'all' scope (admin only), no user filtering

    // Date filtering
    if (startDate) {
      conditions.push(gte(activityLogs.timestamp, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(activityLogs.timestamp, new Date(endDate)));
    }

    // Action filtering
    if (action) {
      conditions.push(eq(activityLogs.action, action as any));
    }

    // Entity type filtering
    if (entityType) {
      conditions.push(eq(activityLogs.entityType, entityType));
    }

    // Get logs with user info
    const logsQuery = db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        metadata: activityLogs.metadata,
        ipAddress: activityLogs.ipAddress,
        timestamp: activityLogs.timestamp,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id));

    if (conditions.length > 0) {
      logsQuery.where(and(...conditions));
    }

    // Get total count for pagination
    const countQuery = await db
      .select({ count: sql`COUNT(*)` })
      .from(activityLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = Number(countQuery[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated logs
    const logs = await logsQuery
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit)
      .offset(offset);

    // Group logs by date for better visualization
    const groupedLogs = logs.reduce((acc, log) => {
      const date = new Date(log.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {} as Record<string, typeof logs>);

    return NextResponse.json({
      logs,
      groupedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

// Export activity logs (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const [adminRole] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.userId, user.id))
      .limit(1);
    
    if (!adminRole || !adminRole.canViewAllData) {
      return NextResponse.json(
        { error: 'Admin access required to export activity logs' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { startDate, endDate, format = 'json' } = data;

    // Build query
    const conditions = [];
    if (startDate) {
      conditions.push(gte(activityLogs.timestamp, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(activityLogs.timestamp, new Date(endDate)));
    }

    // Get all logs in date range
    const logs = await db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        metadata: activityLogs.metadata,
        ipAddress: activityLogs.ipAddress,
        timestamp: activityLogs.timestamp,
        userName: users.name,
        userEmail: users.email,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(activityLogs.timestamp));

    if (format === 'csv') {
      // Convert to CSV format
      const headers = [
        'ID',
        'Date',
        'Time',
        'User',
        'Email',
        'Action',
        'Entity Type',
        'Entity ID',
        'IP Address',
        'User Agent',
      ];

      const rows = logs.map(log => [
        log.id,
        new Date(log.timestamp).toLocaleDateString(),
        new Date(log.timestamp).toLocaleTimeString(),
        log.userName || 'Unknown',
        log.userEmail || '',
        log.action,
        log.entityType || '',
        log.entityId || '',
        log.ipAddress || '',
        '', // userAgent field doesn't exist in activityLogs table
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="activity-logs-${Date.now()}.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      exportDate: new Date().toISOString(),
      totalRecords: logs.length,
      dateRange: {
        start: startDate || 'all',
        end: endDate || 'all',
      },
      logs,
    });
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to export activity logs' },
      { status: 500 }
    );
  }
}