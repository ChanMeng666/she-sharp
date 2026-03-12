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
  userMentorshipStats,
  adminPermissions,
  mentorFormSubmissions,
  menteeFormSubmissions,
} from '@/lib/db/schema';
import { eq, and, or, desc, gte, sql } from 'drizzle-orm';
import { getUserPoints, getUserLevelDetails } from '@/lib/points/service';

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

    // Get or create user stats
    let [stats] = await db
      .select()
      .from(userMentorshipStats)
      .where(eq(userMentorshipStats.userId, user.id))
      .limit(1);

    if (!stats) {
      // Create initial stats
      [stats] = await db
        .insert(userMentorshipStats)
        .values({
          userId: user.id,
          menteesCount: 0,
          mentorsCount: 0,
          totalMeetings: 0,
          completedMeetings: 0,
          totalMeetingHours: '0',
          eventsAttended: 0,
          eventsRegistered: 0,
          resourcesUploaded: 0,
          resourcesAccessed: 0,
          statsUpdatedAt: new Date()
        })
        .returning();
    }

    // Get points and level data
    const levelDetails = await getUserLevelDetails(user.id);

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
      stats: {
        menteesCount: stats.menteesCount,
        mentorsCount: stats.mentorsCount,
        totalMeetings: stats.totalMeetings,
        completedMeetings: stats.completedMeetings,
        totalMeetingHours: parseFloat(stats.totalMeetingHours || '0'),
        eventsAttended: stats.eventsAttended,
        eventsRegistered: stats.eventsRegistered,
        resourcesUploaded: stats.resourcesUploaded,
        resourcesAccessed: stats.resourcesAccessed
      },
      points: {
        current: levelDetails.currentPoints,
        lifetime: levelDetails.lifetimePoints,
        level: levelDetails.currentLevel.level,
        levelName: levelDetails.currentLevel.name,
        progressToNextLevel: levelDetails.progressToNextLevel,
        nextLevel: levelDetails.nextLevel ? {
          name: levelDetails.nextLevel.name,
          minPoints: levelDetails.nextLevel.minPoints
        } : null
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

      // Get active mentors
      const activeMentors = await db
        .select({
          relationship: mentorshipRelationships,
          mentorName: sql<string>`(SELECT name FROM users WHERE id = ${mentorshipRelationships.mentorUserId})`,
          mentorEmail: sql<string>`(SELECT email FROM users WHERE id = ${mentorshipRelationships.mentorUserId})`,
          mentorTitle: sql<string>`(SELECT job_title FROM mentor_profiles WHERE user_id = ${mentorshipRelationships.mentorUserId})`,
          mentorCompany: sql<string>`(SELECT company FROM mentor_profiles WHERE user_id = ${mentorshipRelationships.mentorUserId})`
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