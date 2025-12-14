import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'unread'
    const type = searchParams.get('type'); // 'event', 'mentorship', 'resource', 'system', 'meeting'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = sql`
      SELECT 
        id,
        user_id,
        type,
        title,
        message,
        read,
        action_url,
        action_label,
        metadata,
        created_at,
        read_at
      FROM notifications
      WHERE user_id = ${user.id}
    `;

    if (filter === 'unread') {
      query = sql`${query} AND read = false`;
    }

    if (type) {
      query = sql`${query} AND type = ${type}`;
    }

    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const notifications = await db.execute(query);

    // Get counts
    const countsResult = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE read = false) as unread_count,
        COUNT(*) as total_count
      FROM notifications
      WHERE user_id = ${user.id}
    `);

    const counts = countsResult[0] as any;

    return NextResponse.json({
      notifications,
      counts: {
        unread: parseInt(counts?.unread_count || '0'),
        total: parseInt(counts?.total_count || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { action } = data;

    if (action === 'mark_read') {
      const { notificationIds } = data;
      
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          { error: 'Invalid notification IDs' },
          { status: 400 }
        );
      }

      // Mark notifications as read
      await db.execute(sql`
        UPDATE notifications
        SET read = true, read_at = NOW()
        WHERE id = ANY(${notificationIds}::int[])
          AND user_id = ${user.id}
      `);

      return NextResponse.json({ message: 'Notifications marked as read' });
      
    } else if (action === 'mark_all_read') {
      // Mark all notifications as read
      await db.execute(sql`
        UPDATE notifications
        SET read = true, read_at = NOW()
        WHERE user_id = ${user.id}
          AND read = false
      `);

      return NextResponse.json({ message: 'All notifications marked as read' });
      
    } else if (action === 'delete') {
      const { notificationIds } = data;
      
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          { error: 'Invalid notification IDs' },
          { status: 400 }
        );
      }

      // Delete notifications
      await db.execute(sql`
        DELETE FROM notifications
        WHERE id = ANY(${notificationIds}::int[])
          AND user_id = ${user.id}
      `);

      return NextResponse.json({ message: 'Notifications deleted' });
      
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}