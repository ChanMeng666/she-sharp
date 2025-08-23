'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, activityRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch('/api/admin/activity?limit=10'),
      ]);

      if (metricsRes.ok && activityRes.ok) {
        const metricsData = await metricsRes.json();
        const activityData = await activityRes.json();
        
        setMetrics(metricsData);
        setRecentActivity(activityData.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  // Mock data for demonstration
  const mockMetrics: DashboardMetrics = {
    users: {
      total: 2247,
      active: 1823,
      new: 156,
      change: 12.5,
    },
    mentorship: {
      mentors: 184,
      mentees: 492,
      activePairs: 143,
      pendingApplications: 8,
    },
    events: {
      upcoming: 12,
      totalRegistrations: 384,
      thisMonth: 5,
      attendanceRate: 87.3,
    },
    content: {
      resources: 256,
      newsletters: 48,
      blogPosts: 92,
      mediaFiles: 384,
    },
  };

  const data = metrics || mockMetrics;

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900">{data.users.total.toLocaleString()}</p>
              <div className={cn(
                "flex items-center text-sm font-medium",
                data.users.change > 0 ? "text-green-600" : "text-red-600"
              )}>
                {data.users.change > 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                {Math.abs(data.users.change)}%
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">Active: {data.users.active.toLocaleString()}</span>
              <Badge variant="secondary" className="text-xs">
                +{data.users.new} this month
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Mentorship Card */}
        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Mentorship Program</CardTitle>
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900">{data.mentorship.activePairs}</p>
              <Badge variant="destructive" className="text-xs">
                {data.mentorship.pendingApplications} pending
              </Badge>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mentors</span>
                <span className="font-medium">{data.mentorship.mentors}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mentees</span>
                <span className="font-medium">{data.mentorship.mentees}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Card */}
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Events</CardTitle>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900">{data.events.upcoming}</p>
              <span className="text-sm text-gray-500">upcoming</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Registrations</span>
                <span className="font-medium">{data.events.totalRegistrations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Attendance</span>
                <div className="flex items-center space-x-2">
                  <Progress value={data.events.attendanceRate} className="w-16 h-2" />
                  <span className="text-sm font-medium">{data.events.attendanceRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Card */}
        <Card className="border-l-4 border-l-orange-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Content Library</CardTitle>
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900">
                {data.content.resources + data.content.blogPosts}
              </p>
              <span className="text-sm text-gray-500">total items</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Resources</span>
                <p className="font-medium">{data.content.resources}</p>
              </div>
              <div>
                <span className="text-gray-500">Blog Posts</span>
                <p className="font-medium">{data.content.blogPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Link
              href="/dashboard/admin/mentors/applications"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <UserCheck className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Verify Mentors</span>
              {data.mentorship.pendingApplications > 0 && (
                <Badge variant="destructive" className="mt-1 text-xs">
                  {data.mentorship.pendingApplications} pending
                </Badge>
              )}
            </Link>

            <Link
              href="/dashboard/admin/events/new"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Calendar className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Create Event</span>
            </Link>

            <Link
              href="/dashboard/admin/content/newsletters/new"
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <BookOpen className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Send Newsletter</span>
            </Link>

            <Link
              href="/dashboard/admin/analytics"
              className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">View Analytics</span>
            </Link>

            <Link
              href="/components-showcase"
              className="flex flex-col items-center justify-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
              target="_blank"
            >
              <Palette className="w-8 h-8 text-pink-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">UI Components</span>
              <Badge variant="secondary" className="mt-1 text-xs bg-pink-100 text-pink-700">
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
              <Link href="/dashboard/admin/users/activity" className="text-sm text-purple-600 hover:text-purple-700">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { icon: UserCheck, action: 'New user registered', user: 'Emily Chen', time: '2 minutes ago', type: 'success' },
                { icon: GraduationCap, action: 'Mentor application submitted', user: 'Sarah Johnson', time: '15 minutes ago', type: 'warning' },
                { icon: Calendar, action: 'Event created', user: 'THRIVE Workshop 2024', time: '1 hour ago', type: 'info' },
                { icon: Award, action: 'Mentorship completed', user: 'Alex & Jamie', time: '3 hours ago', type: 'success' },
                { icon: AlertCircle, action: 'Failed login attempt', user: 'unknown@email.com', time: '5 hours ago', type: 'error' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    activity.type === 'success' && "bg-green-100",
                    activity.type === 'warning' && "bg-yellow-100",
                    activity.type === 'info' && "bg-blue-100",
                    activity.type === 'error' && "bg-red-100"
                  )}>
                    <activity.icon className={cn(
                      "w-4 h-4",
                      activity.type === 'success' && "text-green-600",
                      activity.type === 'warning' && "text-yellow-600",
                      activity.type === 'info' && "text-blue-600",
                      activity.type === 'error' && "text-red-600"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Tasks</CardTitle>
              <Badge variant="outline">{data.mentorship.pendingApplications + 3} tasks</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { task: 'Review mentor applications', count: data.mentorship.pendingApplications, priority: 'high', href: '/dashboard/admin/mentors/applications' },
                { task: 'Approve event registrations', count: 12, priority: 'medium', href: '/dashboard/admin/events/registrations' },
                { task: 'Moderate content submissions', count: 3, priority: 'low', href: '/dashboard/admin/content/review' },
                { task: 'Process membership upgrades', count: 5, priority: 'medium', href: '/dashboard/admin/users/membership' },
                { task: 'Review system logs', count: 1, priority: 'low', href: '/dashboard/admin/settings/audit' },
              ].map((task, idx) => (
                <Link
                  key={idx}
                  href={task.href}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      task.priority === 'high' && "bg-red-500",
                      task.priority === 'medium' && "bg-yellow-500",
                      task.priority === 'low' && "bg-green-500"
                    )} />
                    <span className="text-sm font-medium text-gray-900">{task.task}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {task.count}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}