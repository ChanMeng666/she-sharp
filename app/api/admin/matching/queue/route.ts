import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { isUserAdmin } from '@/lib/auth/permissions';
import {
  getWaitingQueue,
  getQueueStats,
  getAvailableMentorCapacity,
  cancelQueueEntry,
  expireOldQueueEntries,
  updateQueuePriority,
} from '@/lib/matching/queue-service';

/**
 * Helper to safely serialize data for JSON response
 * Converts Date objects to ISO strings recursively before JSON.stringify
 */
function safeSerialize<T>(obj: T): T {
  function convertDates(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Array.isArray(value)) {
      return value.map(convertDates);
    }
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
        result[key] = convertDates((value as Record<string, unknown>)[key]);
      }
      return result;
    }
    return value;
  }

  return convertDates(obj) as T;
}

/**
 * GET /api/admin/matching/queue
 * Gets the waiting queue with statistics.
 *
 * Query parameters:
 * - limit?: number - Number of entries to return (default: 50)
 * - offset?: number - Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [queueData, stats, capacity] = await Promise.all([
      getWaitingQueue(limit, offset),
      getQueueStats(),
      getAvailableMentorCapacity(),
    ]);

    // Serialize all Date objects before returning JSON
    return NextResponse.json(safeSerialize({
      entries: queueData.entries,
      total: queueData.total,
      stats: {
        totalWaiting: stats.totalWaiting,
        averageWaitDays: stats.averageWaitDays,
        highPriorityCount: stats.highPriorityCount,
        expiringSoonCount: stats.expiringSoonCount,
      },
      mentorCapacity: capacity,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < queueData.total,
      },
    }));
  } catch (error) {
    console.error('Error fetching queue data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/matching/queue
 * Administrative actions on the queue.
 *
 * Request body:
 * - action: 'expire_old' | 'update_priority'
 * - menteeUserId?: number - Required for update_priority
 * - priority?: number - Required for update_priority
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, menteeUserId, priority } = body;

    switch (action) {
      case 'expire_old': {
        const expiredCount = await expireOldQueueEntries();
        return NextResponse.json({
          success: true,
          action: 'expire_old',
          expiredCount,
          message: `Expired ${expiredCount} queue entries.`,
        });
      }

      case 'update_priority': {
        if (!menteeUserId || priority === undefined) {
          return NextResponse.json(
            { error: 'menteeUserId and priority are required for update_priority' },
            { status: 400 }
          );
        }
        await updateQueuePriority(menteeUserId, priority);
        return NextResponse.json({
          success: true,
          action: 'update_priority',
          menteeUserId,
          newPriority: priority,
          message: 'Queue priority updated.',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: expire_old, update_priority' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing queue action:', error);
    return NextResponse.json(
      { error: 'Failed to process queue action' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/matching/queue
 * Remove a mentee from the queue.
 *
 * Request body:
 * - menteeUserId: number - The mentee to remove from queue
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { menteeUserId } = body;

    if (!menteeUserId) {
      return NextResponse.json(
        { error: 'menteeUserId is required' },
        { status: 400 }
      );
    }

    await cancelQueueEntry(menteeUserId);

    return NextResponse.json({
      success: true,
      menteeUserId,
      message: 'Mentee removed from queue.',
    });
  } catch (error) {
    console.error('Error removing from queue:', error);
    return NextResponse.json(
      { error: 'Failed to remove from queue' },
      { status: 500 }
    );
  }
}
