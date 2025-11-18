'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  User,
  UserCheck,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Activity,
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Palette,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  userId: number;
}

interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    new: number;
    change: number;
  };
  mentorship: {
    mentors: number;
    mentees: number;
    activePairs: number;
    pendingApplications: number;
  };
  events: {
    upcoming: number;
    totalRegistrations: number;
    thisMonth: number;
    attendanceRate: number;
  };
  content: {
    resources: number;
    newsletters: number;
    blogPosts: number;
    mediaFiles: number;
  };
}

export default function AdminDashboard({ userId }: AdminDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, activityRes, tasksRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/activity?limit=5'),
        fetch('/api/admin/tasks/pending'),
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.activities || []);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setPendingTasks(tasksData.tasks || []);
        setTotalTasksCount(tasksData.totalCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get icon and type based on activity action
  const getActivityDisplay = (action: string) => {
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes('user') && lowerAction.includes('register')) {
      return { icon: User, type: 'success' as const };
    } else if (lowerAction.includes('mentor') && lowerAction.includes('appli')) {
      return { icon: GraduationCap, type: 'warning' as const };
    } else if (lowerAction.includes('mentor') && lowerAction.includes('approv')) {
      return { icon: CheckCircle, type: 'success' as const };
    } else if (lowerAction.includes('mentor') && lowerAction.includes('reject')) {
      return { icon: XCircle, type: 'error' as const };
    } else if (lowerAction.includes('event')) {
      return { icon: Calendar, type: 'info' as const };
    } else if (lowerAction.includes('mentorship') && lowerAction.includes('complet')) {
      return { icon: Award, type: 'success' as const };
    } else if (lowerAction.includes('login') && lowerAction.includes('fail')) {
      return { icon: AlertCircle, type: 'error' as const };
    } else {
      return { icon: Activity, type: 'info' as const };
    }
  };

  // Helper function to format relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground mb-4">Please try refreshing the page</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  const data = metrics;

  return (
    <div className="@container/main flex flex-col gap-6">
      {/* Key Metrics Cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {/* Total Users Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
              {data.users.total.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {data.users.change > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    +{data.users.change}%
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3" />
                    {data.users.change}%
                  </>
                )}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              {data.users.active.toLocaleString()} active users
            </div>
            <div className="text-muted-foreground">
              +{data.users.new} new this month
            </div>
          </CardFooter>
        </Card>

        {/* Mentorship Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Mentorship Program</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
              {data.mentorship.activePairs}
            </CardTitle>
            <CardAction>
              <Badge variant={data.mentorship.pendingApplications > 0 ? 'destructive' : 'outline'}>
                <GraduationCap className="h-3 w-3" />
                {data.mentorship.pendingApplications} pending
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex w-full justify-between font-medium">
              <span>{data.mentorship.mentors} mentors</span>
              <span>{data.mentorship.mentees} mentees</span>
            </div>
            <div className="text-muted-foreground">
              Active mentorship pairs
            </div>
          </CardFooter>
        </Card>

        {/* Events Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Events</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
              {data.events.upcoming}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Calendar className="h-3 w-3" />
                Upcoming
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium items-center">
              <Progress value={data.events.attendanceRate} className="h-2 flex-1" />
              <span>{data.events.attendanceRate}%</span>
            </div>
            <div className="text-muted-foreground">
              {data.events.totalRegistrations} total registrations
            </div>
          </CardFooter>
        </Card>

        {/* Content Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Content Library</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
              {data.content.resources + data.content.blogPosts}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <BookOpen className="h-3 w-3" />
                Items
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex w-full justify-between font-medium">
              <span>{data.content.resources} resources</span>
              <span>{data.content.blogPosts} posts</span>
            </div>
            <div className="text-muted-foreground">
              Published content
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Link
              href="/dashboard/admin/mentors/applications"
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mb-2">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Verify Mentors</span>
              {data.mentorship.pendingApplications > 0 && (
                <Badge variant="destructive" className="mt-2 text-xs">
                  {data.mentorship.pendingApplications}
                </Badge>
              )}
            </Link>

            <Link
              href="/dashboard/admin/events/new"
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mb-2">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Create Event</span>
            </Link>

            <Link
              href="/dashboard/admin/content/newsletters"
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mb-2">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Newsletters</span>
            </Link>

            <Link
              href="/dashboard/admin/analytics"
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mb-2">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Analytics</span>
            </Link>

            <Link
              href="/components-showcase"
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors group"
              target="_blank"
            >
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mb-2">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Components</span>
              <Badge variant="secondary" className="mt-2 text-xs">
                New
              </Badge>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/dashboard/admin/users/activity">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const { icon: Icon, type } = getActivityDisplay(activity.action);
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        type === 'success' && "bg-green-500/10",
                        type === 'warning' && "bg-yellow-500/10",
                        type === 'info' && "bg-blue-500/10",
                        type === 'error' && "bg-red-500/10"
                      )}>
                        <Icon className={cn(
                          "w-4 h-4",
                          type === 'success' && "text-green-600 dark:text-green-400",
                          type === 'warning' && "text-yellow-600 dark:text-yellow-400",
                          type === 'info' && "text-blue-600 dark:text-blue-400",
                          type === 'error' && "text-red-600 dark:text-red-400"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.userName || activity.userEmail || 'System'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {getRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Tasks</CardTitle>
              <Badge variant="outline">{totalTasksCount} tasks</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingTasks.length > 0 ? (
              <div className="space-y-2">
                {pendingTasks.map((task, idx) => (
                  <Link
                    key={idx}
                    href={task.href}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        task.priority === 'high' && "bg-red-500",
                        task.priority === 'medium' && "bg-yellow-500",
                        task.priority === 'low' && "bg-green-500"
                      )} />
                      <span className="text-sm font-medium">{task.task}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {task.count}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No pending tasks</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}