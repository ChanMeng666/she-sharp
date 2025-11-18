import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/auth/role-middleware';
import { db } from '@/lib/db/drizzle';
import { events, users } from '@/lib/db/schema';
import { sql, eq, and, gte, lte } from 'drizzle-orm';

// Admin-only events management endpoint
export const GET = withRoles(
  {
    requiredRoles: ['admin'],
    requiredAdminPermissions: ['canManageEvents']
  },
  async (req: NextRequest, context: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const typeFilter = searchParams.get('type');
      const statusFilter = searchParams.get('status') || 'upcoming';

      const now = new Date();
      const conditions = [];

      // Apply type filter
      if (typeFilter && typeFilter !== 'all') {
        conditions.push(eq(events.eventType, typeFilter as any));
      }

      // Apply status filter based on time
      if (statusFilter && statusFilter !== 'all') {
        switch (statusFilter) {
          case 'upcoming':
            conditions.push(gte(events.startTime, now));
            break;
          case 'ongoing':
            conditions.push(
              and(
                lte(events.startTime, now),
                gte(events.endTime, now)
              )
            );
            break;
          case 'completed':
            conditions.push(lte(events.endTime, now));
            break;
        }
      }

      // Fetch events with creator information
      const eventsData = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          eventType: events.eventType,
          startTime: events.startTime,
          endTime: events.endTime,
          locationType: events.locationType,
          locationDetails: events.locationDetails,
          capacity: events.capacity,
          currentRegistrations: events.currentRegistrations,
          registrationDeadline: events.registrationDeadline,
          isMembersOnly: events.isMembersOnly,
          createdBy: sql<string>`(SELECT name FROM users WHERE id = ${events.createdBy})`,
        })
        .from(events)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(events.startTime);

      // Calculate status for each event
      const eventsWithStatus = eventsData.map(event => {
        let status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

        if (event.startTime && event.endTime) {
          const start = new Date(event.startTime);
          const end = new Date(event.endTime);

          if (now < start) {
            status = 'upcoming';
          } else if (now >= start && now <= end) {
            status = 'ongoing';
          } else {
            status = 'completed';
          }
        } else {
          status = 'upcoming';
        }

        return {
          id: event.id,
          title: event.title,
          description: event.description || '',
          eventType: event.eventType,
          startTime: event.startTime?.toISOString() || '',
          endTime: event.endTime?.toISOString() || '',
          locationType: event.locationType,
          locationDetails: event.locationDetails || {},
          capacity: event.capacity || 0,
          currentRegistrations: event.currentRegistrations || 0,
          registrationDeadline: event.registrationDeadline?.toISOString() || '',
          status,
          isMembersOnly: event.isMembersOnly || false,
          createdBy: event.createdBy || 'Unknown',
        };
      });

      return NextResponse.json({
        events: eventsWithStatus,
        total: eventsWithStatus.length
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }
  }
);
