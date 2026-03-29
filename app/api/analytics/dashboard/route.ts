import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { adminPermissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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
    
    if (!adminRole || !adminRole.canAccessAnalytics) {
      return NextResponse.json(
        { error: 'Admin access required for analytics' },
        { status: 403 }
      );
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // 1. User Statistics (excludes test users)
    const userStats = await db.execute(sql`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= ${startDate} THEN 1 END) as new_users,
        COUNT(CASE WHEN email_verified_at IS NOT NULL THEN 1 END) as verified_users,
        COUNT(CASE WHEN last_login_at >= NOW() - INTERVAL '7 days' THEN 1 END) as active_users
      FROM users
      WHERE deleted_at IS NULL AND is_test_user = false
    `);

    // 2. Mentorship Statistics (excludes test users)
    const mentorshipStats = await db.execute(sql`
      SELECT
        COUNT(DISTINCT mr.mentor_user_id) as total_mentors,
        COUNT(DISTINCT mr.mentee_user_id) as total_mentees,
        COUNT(CASE WHEN mr.status = 'active' THEN 1 END) as active_relationships,
        COUNT(CASE WHEN mr.status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN mr.created_at >= ${startDate} THEN 1 END) as new_relationships
      FROM mentorship_relationships mr
      JOIN users mentor ON mr.mentor_user_id = mentor.id AND mentor.is_test_user = false
      JOIN users mentee ON mr.mentee_user_id = mentee.id AND mentee.is_test_user = false
    `);

    // 3. Event Statistics
    const eventStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN start_time >= NOW() THEN 1 END) as upcoming_events,
        COUNT(CASE WHEN start_time >= ${startDate} AND start_time <= ${endDate} THEN 1 END) as period_events,
        SUM(current_registrations) as total_registrations
      FROM events
    `);

    // 4. Resource Statistics
    const resourceStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_resources,
        SUM(view_count) as total_views,
        SUM(download_count) as total_downloads,
        AVG(average_rating)::numeric(3,2) as avg_rating
      FROM resources
    `);

    // 5. Meeting Statistics (excludes test users)
    const meetingStats = await db.execute(sql`
      SELECT
        COUNT(*) as total_meetings,
        COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_meetings,
        COUNT(CASE WHEN m.status = 'cancelled' THEN 1 END) as cancelled_meetings,
        AVG(CASE WHEN m.rating IS NOT NULL THEN m.rating END)::numeric(3,2) as avg_rating
      FROM meetings m
      JOIN mentorship_relationships mr ON m.relationship_id = mr.id
      JOIN users mentor ON mr.mentor_user_id = mentor.id AND mentor.is_test_user = false
      JOIN users mentee ON mr.mentee_user_id = mentee.id AND mentee.is_test_user = false
      WHERE m.scheduled_at >= ${startDate} AND m.scheduled_at <= ${endDate}
    `);

    // 6. Activity Trends (last 30 days, excludes test users)
    const activityTrends = await db.execute(sql`
      SELECT
        DATE(al.created_at) as date,
        COUNT(*) as count,
        al.action
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= NOW() - INTERVAL '30 days'
        AND (u.is_test_user = false OR al.user_id IS NULL)
      GROUP BY DATE(al.created_at), al.action
      ORDER BY date DESC
    `);

    // 7. User Growth Trend (last 12 months, excludes test users)
    const userGrowth = await db.execute(sql`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '12 months'
        AND is_test_user = false
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `);

    // 8. Top Mentors (excludes test users)
    const topMentors = await db.execute(sql`
      SELECT
        u.name,
        u.email,
        mp.years_experience,
        mp.current_mentees_count,
        COUNT(DISTINCT mr.id) as total_relationships,
        AVG(m.rating)::numeric(3,2) as avg_meeting_rating
      FROM mentor_profiles mp
      JOIN users u ON mp.user_id = u.id AND u.is_test_user = false
      LEFT JOIN mentorship_relationships mr ON mr.mentor_user_id = u.id
      LEFT JOIN meetings m ON m.relationship_id = mr.id AND m.status = 'completed'
      GROUP BY u.id, u.name, u.email, mp.years_experience, mp.current_mentees_count
      ORDER BY total_relationships DESC, avg_meeting_rating DESC NULLS LAST
      LIMIT 10
    `);

    // 9. Popular Resources
    const popularResources = await db.execute(sql`
      SELECT 
        title,
        resource_type,
        view_count,
        download_count,
        average_rating
      FROM resources
      ORDER BY (view_count + download_count * 2) DESC
      LIMIT 10
    `);

    // 10. System Health
    const systemHealth = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM email_queue WHERE status = 'pending') as pending_emails,
        (SELECT COUNT(*) FROM email_queue WHERE status = 'failed' AND attempts >= max_attempts) as failed_emails,
        (SELECT COUNT(*) FROM activity_logs WHERE created_at >= NOW() - INTERVAL '1 hour') as recent_activities,
        (SELECT COUNT(*) FROM users WHERE last_login_at >= NOW() - INTERVAL '24 hours' AND is_test_user = false) as daily_active_users
    `);

    return NextResponse.json({
      dateRange: { startDate, endDate },
      userStats: userStats[0],
      mentorshipStats: mentorshipStats[0],
      eventStats: eventStats[0],
      resourceStats: resourceStats[0],
      meetingStats: meetingStats[0],
      activityTrends,
      userGrowth,
      topMentors,
      popularResources,
      systemHealth: systemHealth[0],
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Export analytics data
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
    
    if (!adminRole || !adminRole.canAccessAnalytics) {
      return NextResponse.json(
        { error: 'Admin access required for analytics export' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { reportType, format = 'json', startDate, endDate } = data;

    // Generate report based on type
    let reportData: any = {};

    switch (reportType) {
      case 'users':
        reportData = await generateUserReport(startDate, endDate);
        break;
      case 'mentorship':
        reportData = await generateMentorshipReport(startDate, endDate);
        break;
      case 'events':
        reportData = await generateEventReport(startDate, endDate);
        break;
      case 'complete':
        reportData = await generateCompleteReport(startDate, endDate);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(reportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${reportType}-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}

async function generateUserReport(startDate: string, endDate: string) {
  const users = await db.execute(sql`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.created_at,
      u.last_login_at,
      u.email_verified_at,
      COUNT(DISTINCT mr.id) as mentorship_count,
      COUNT(DISTINCT er.id) as event_registrations,
      COUNT(DISTINCT al.id) as activity_count
    FROM users u
    LEFT JOIN mentorship_relationships mr ON (mr.mentor_user_id = u.id OR mr.mentee_user_id = u.id)
    LEFT JOIN event_registrations er ON er.user_id = u.id
    LEFT JOIN activity_logs al ON al.user_id = u.id
    WHERE u.created_at >= ${startDate} AND u.created_at <= ${endDate}
      AND u.is_test_user = false
    GROUP BY u.id, u.name, u.email, u.created_at, u.last_login_at, u.email_verified_at
    ORDER BY u.created_at DESC
  `);

  return { users, generated_at: new Date().toISOString() };
}

async function generateMentorshipReport(startDate: string, endDate: string) {
  const relationships = await db.execute(sql`
    SELECT 
      mr.*,
      mentor.name as mentor_name,
      mentee.name as mentee_name,
      COUNT(m.id) as meeting_count,
      AVG(m.rating)::numeric(3,2) as avg_rating
    FROM mentorship_relationships mr
    JOIN users mentor ON mr.mentor_user_id = mentor.id AND mentor.is_test_user = false
    JOIN users mentee ON mr.mentee_user_id = mentee.id AND mentee.is_test_user = false
    LEFT JOIN meetings m ON m.relationship_id = mr.id
    WHERE mr.created_at >= ${startDate} AND mr.created_at <= ${endDate}
    GROUP BY mr.id, mentor.name, mentee.name
    ORDER BY mr.created_at DESC
  `);

  return { relationships, generated_at: new Date().toISOString() };
}

async function generateEventReport(startDate: string, endDate: string) {
  const events = await db.execute(sql`
    SELECT 
      e.*,
      COUNT(er.id) as registration_count,
      AVG(e.feedback_score)::numeric(3,2) as avg_feedback
    FROM events e
    LEFT JOIN event_registrations er ON er.event_id = e.id
    WHERE e.start_time >= ${startDate} AND e.start_time <= ${endDate}
    GROUP BY e.id
    ORDER BY e.start_time DESC
  `);

  return { events, generated_at: new Date().toISOString() };
}

async function generateCompleteReport(startDate: string, endDate: string) {
  return {
    users: await generateUserReport(startDate, endDate),
    mentorship: await generateMentorshipReport(startDate, endDate),
    events: await generateEventReport(startDate, endDate),
    generated_at: new Date().toISOString(),
  };
}

function convertToCSV(data: any): string {
  // Simple CSV conversion for flat data structures
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => JSON.stringify(item[header] || '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
  
  // For nested structures, flatten first
  const firstKey = Object.keys(data)[0];
  if (Array.isArray(data[firstKey])) {
    return convertToCSV(data[firstKey]);
  }
  
  return JSON.stringify(data);
}