import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import {
  userRoles,
  mentorProfiles,
  menteeProfiles,
  mentorshipRelationships,
  meetings,
  events,
  eventRegistrations,
  resources,
  mentorFormSubmissions,
  menteeFormSubmissions,
} from '@/lib/db/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user roles
    const roles = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, user.id),
          eq(userRoles.isActive, true)
        )
      );

    const activeRoles = roles.map(r => r.roleType);
    const isMentor = activeRoles.includes('mentor');
    const isMentee = activeRoles.includes('mentee');
    const isAdmin = activeRoles.includes('admin');

    // Get form submission status
    const [mentorForm] = await db
      .select()
      .from(mentorFormSubmissions)
      .where(eq(mentorFormSubmissions.userId, user.id))
      .limit(1);

    const [menteeForm] = await db
      .select()
      .from(menteeFormSubmissions)
      .where(eq(menteeFormSubmissions.userId, user.id))
      .limit(1);

    const dashboardData: any = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: !!user.emailVerifiedAt,
        roles: activeRoles
      },
      formStatus: {
        mentor: mentorForm ? {
          status: mentorForm.status,
          submittedAt: mentorForm.submittedAt,
          reviewedAt: mentorForm.reviewedAt
        } : null,
        mentee: menteeForm ? {
          status: menteeForm.status,
          submittedAt: menteeForm.submittedAt,
          reviewedAt: menteeForm.reviewedAt
        } : null
      },
      quickActions: [],
      sections: []
    };

    // Mentor-specific data
    if (isMentor) {
      const [mentorProfile] = await db
        .select()
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, user.id))
        .limit(1);

      // Get active mentees
      const activeMentorships = await db
        .select({
          relationship: mentorshipRelationships,
          menteeName: sql<string>`(SELECT name FROM users WHERE id = ${mentorshipRelationships.menteeUserId})`,
          menteeEmail: sql<string>`(SELECT email FROM users WHERE id = ${mentorshipRelationships.menteeUserId})`
        })
        .from(mentorshipRelationships)
        .where(
          and(
            eq(mentorshipRelationships.mentorUserId, user.id),
            eq(mentorshipRelationships.status, 'active')
          )
        );

      // Get upcoming meetings as mentor
      const upcomingMentorMeetings = await db
        .select({
          meeting: meetings,
          menteeName: sql<string>`(SELECT name FROM users WHERE id = ${mentorshipRelationships.menteeUserId})`
        })
        .from(meetings)
        .innerJoin(mentorshipRelationships, eq(meetings.relationshipId, mentorshipRelationships.id))
        .where(
          and(
            eq(mentorshipRelationships.mentorUserId, user.id),
            eq(meetings.status, 'scheduled'),
            gte(meetings.scheduledAt, new Date())
          )
        )
        .orderBy(meetings.scheduledAt)
        .limit(5);

      dashboardData.mentor = {
        profile: mentorProfile,
        isAcceptingMentees: mentorProfile?.isAcceptingMentees || false,
        currentMentees: activeMentorships.length,
        maxMentees: mentorProfile?.maxMentees || 3,
        mentees: activeMentorships.map(m => ({
          relationshipId: m.relationship.id,
          name: m.menteeName,
          email: m.menteeEmail,
          startedAt: m.relationship.startedAt,
          nextMeeting: m.relationship.nextMeetingDate
        })),
        upcomingMeetings: upcomingMentorMeetings.map(m => ({
          ...m.meeting,
          menteeName: m.menteeName
        }))
      };

      dashboardData.quickActions.push(
        { label: 'View Mentees', href: '/dashboard/mentorship', icon: 'Users' },
        { label: 'Schedule Meeting', href: '/dashboard/meetings/new', icon: 'Calendar' }
      );

      dashboardData.sections.push({
        id: 'mentor-overview',
        title: 'Mentor Dashboard',
        type: 'mentor'
      });
    }

    // Mentee-specific data
    if (isMentee) {
      const [menteeProfile] = await db
        .select()
        .from(menteeProfiles)
        .where(eq(menteeProfiles.userId, user.id))
        .limit(1);

      // Get active mentors with form → profile fallback
      const activeMentors = await db
        .select({
          relationship: mentorshipRelationships,
          mentorName: sql<string>`(SELECT name FROM users WHERE id = ${mentorshipRelationships.mentorUserId})`,
          mentorEmail: sql<string>`(SELECT email FROM users WHERE id = ${mentorshipRelationships.mentorUserId})`,
          mentorImage: sql<string>`(
            SELECT COALESCE(
              (SELECT photo_url FROM mentor_form_submissions WHERE user_id = ${mentorshipRelationships.mentorUserId} LIMIT 1),
              (SELECT photo_url FROM mentor_profiles WHERE user_id = ${mentorshipRelationships.mentorUserId} LIMIT 1),
              (SELECT image FROM users WHERE id = ${mentorshipRelationships.mentorUserId})
            )
          )`,
          mentorTitle: sql<string>`(
            SELECT COALESCE(
              (SELECT job_title FROM mentor_form_submissions WHERE user_id = ${mentorshipRelationships.mentorUserId} LIMIT 1),
              (SELECT job_title FROM mentor_profiles WHERE user_id = ${mentorshipRelationships.mentorUserId})
            )
          )`,
          mentorCompany: sql<string>`(
            SELECT COALESCE(
              (SELECT company FROM mentor_form_submissions WHERE user_id = ${mentorshipRelationships.mentorUserId} LIMIT 1),
              (SELECT company FROM mentor_profiles WHERE user_id = ${mentorshipRelationships.mentorUserId})
            )
          )`,
        })
        .from(mentorshipRelationships)
        .where(
          and(
            eq(mentorshipRelationships.menteeUserId, user.id),
            eq(mentorshipRelationships.status, 'active')
          )
        );

      // Get upcoming meetings as mentee
      const upcomingMenteeMeetings = await db
        .select({
          meeting: meetings,
          mentorName: sql<string>`(SELECT name FROM users WHERE id = ${mentorshipRelationships.mentorUserId})`
        })
        .from(meetings)
        .innerJoin(mentorshipRelationships, eq(meetings.relationshipId, mentorshipRelationships.id))
        .where(
          and(
            eq(mentorshipRelationships.menteeUserId, user.id),
            eq(meetings.status, 'scheduled'),
            gte(meetings.scheduledAt, new Date())
          )
        )
        .orderBy(meetings.scheduledAt)
        .limit(5);

      dashboardData.mentee = {
        profile: menteeProfile,
        mentors: activeMentors.map(m => ({
          relationshipId: m.relationship.id,
          name: m.mentorName,
          email: m.mentorEmail,
          image: m.mentorImage || null,
          title: m.mentorTitle,
          company: m.mentorCompany,
          startedAt: m.relationship.startedAt,
          nextMeeting: m.relationship.nextMeetingDate
        })),
        upcomingMeetings: upcomingMenteeMeetings.map(m => ({
          ...m.meeting,
          mentorName: m.mentorName
        }))
      };

      dashboardData.quickActions.push(
        { label: 'Find Mentors', href: '/mentorship', icon: 'Search' },
        { label: 'My Mentors', href: '/dashboard/mentorship', icon: 'Users' }
      );

      dashboardData.sections.push({
        id: 'mentee-overview',
        title: 'Mentee Dashboard',
        type: 'mentee'
      });
    }

    // Admin-specific data removed - admins are redirected to /dashboard/admin
    // This endpoint now only serves mentor/mentee dashboard data

    // Common data for all users
    // Upcoming events
    const upcomingEvents = await db
      .select({
        event: events,
        registration: eventRegistrations
      })
      .from(events)
      .leftJoin(
        eventRegistrations,
        and(
          eq(eventRegistrations.eventId, events.id),
          eq(eventRegistrations.userId, user.id)
        )
      )
      .where(gte(events.startTime, new Date()))
      .orderBy(events.startTime)
      .limit(5);

    dashboardData.upcomingEvents = upcomingEvents.map(e => ({
      ...e.event,
      isRegistered: !!e.registration
    }));

    // Recent resources
    const recentResources = await db
      .select()
      .from(resources)
      .orderBy(desc(resources.uploadedAt))
      .limit(5);

    dashboardData.recentResources = recentResources;

    dashboardData.quickActions.push(
      { label: 'Browse Events', href: '/events', icon: 'Calendar' },
      { label: 'Resources', href: '/resources', icon: 'BookOpen' }
    );

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}