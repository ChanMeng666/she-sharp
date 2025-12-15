'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Calendar,
  BookOpen,
  BarChart,
  Search,
  Clock,
  Target,
  MessageSquare,
  FileText,
  Video,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bell,
  Info
} from 'lucide-react';

interface Notification {
  id: number;
  type: 'event' | 'mentorship' | 'resource' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    emailVerified: boolean;
    roles: string[];
  };
  stats: {
    menteesCount: number;
    mentorsCount: number;
    totalMeetings: number;
    completedMeetings: number;
    totalMeetingHours: number;
    eventsAttended: number;
    eventsRegistered: number;
    resourcesUploaded: number;
    resourcesAccessed: number;
  };
  points: {
    current: number;
    lifetime: number;
    level: number;
    levelName: string;
    progressToNextLevel: number;
    nextLevel: {
      name: string;
      minPoints: number;
    } | null;
  };
  formStatus: {
    mentor: {
      status: string;
      submittedAt: string | null;
      reviewedAt: string | null;
    } | null;
    mentee: {
      status: string;
      submittedAt: string | null;
      reviewedAt: string | null;
    } | null;
  };
  mentor?: {
    profile: any;
    isAcceptingMentees: boolean;
    currentMentees: number;
    maxMentees: number;
    mentees: any[];
    upcomingMeetings: any[];
  };
  mentee?: {
    profile: any;
    mentors: any[];
    upcomingMeetings: any[];
  };
  upcomingEvents: any[];
  recentResources: any[];
  quickActions: any[];
}

export default function DynamicDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/overview');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        const formattedNotifications = data.notifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.created_at,
          actionUrl: n.action_url,
        }));
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds: [id],
        }),
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
        }),
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'mentorship':
        return <Users className="h-4 w-4" />;
      case 'resource':
        return <FileText className="h-4 w-4" />;
      case 'system':
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { user, stats, formStatus, mentor, mentee, upcomingEvents, recentResources } = data;

  return (
    <div className="@container/main flex flex-col gap-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.name || 'there'}!
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {user.roles.map(role => (
            <Badge key={role} variant="secondary">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          ))}
          {!user.emailVerified && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Email not verified
            </Badge>
          )}
        </div>
      </div>

      {/* Compact Notifications */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-foreground" />
              <CardTitle className="text-lg">Notifications</CardTitle>
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {notifications.filter(n => !n.read).length} new
                </Badge>
              )}
            </div>
            {notifications.filter(n => !n.read).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {notifications.filter(n => !n.read).length > 0 ? (
            <div className="space-y-2">
              {notifications
                .filter(n => !n.read)
                .slice(0, 3)
                .map(notification => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex-shrink-0 p-1.5 rounded-md bg-background">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{notification.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {getTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              <span>No new notifications</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Status Alerts */}
      {formStatus?.mentee?.status && formStatus.mentee.status !== 'approved' && (
        <Alert className={formStatus.mentee.status === 'rejected' ? 'border-destructive/30 bg-destructive/5' : 'border-info/30 bg-navy-light'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {formStatus.mentee.status === 'not_started' && (
              <>Your mentee application form has not been started. <Link href="/dashboard/mentee-profile" className="font-medium underline">Complete your profile</Link> to get matched with a mentor.</>
            )}
            {formStatus.mentee.status === 'in_progress' && (
              <>Your mentee application is in progress. <Link href="/dashboard/mentee-profile" className="font-medium underline">Continue your application</Link> to submit.</>
            )}
            {formStatus.mentee.status === 'submitted' && (
              <>Your mentee application is under review. We&apos;ll notify you once it&apos;s processed.</>
            )}
            {formStatus.mentee.status === 'rejected' && (
              <>Your mentee application was not approved. Please <Link href="/contact" className="font-medium underline">contact support</Link> for more information.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {formStatus?.mentor?.status && formStatus.mentor.status !== 'approved' && (
        <Alert className={formStatus.mentor.status === 'rejected' ? 'border-destructive/30 bg-destructive/5' : 'border-brand/30 bg-surface-purple'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {formStatus.mentor.status === 'not_started' && (
              <>Your mentor application form has not been started. <Link href="/dashboard/mentor-profile" className="font-medium underline">Apply to become a mentor</Link>.</>
            )}
            {formStatus.mentor.status === 'in_progress' && (
              <>Your mentor application is in progress. <Link href="/dashboard/mentor-profile" className="font-medium underline">Continue your application</Link>.</>
            )}
            {formStatus.mentor.status === 'submitted' && (
              <>Your mentor application is awaiting admin review. We&apos;ll notify you once approved.</>
            )}
            {formStatus.mentor.status === 'rejected' && (
              <>Your mentor application was not approved. Please <Link href="/contact" className="font-medium underline">contact support</Link> for feedback.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Role-specific Sections */}
      {/* Mentor Section */}
      {mentor && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="h-6 w-6 text-brand" />
              Mentor Dashboard
            </h2>
            <Badge className={mentor.isAcceptingMentees ? 'bg-badge-success-bg text-badge-success-fg' : ''} variant={mentor.isAcceptingMentees ? undefined : 'secondary'}>
              {mentor.isAcceptingMentees ? 'Accepting Mentees' : 'Not Accepting'}
            </Badge>
          </div>

          {/* Mentor Stats */}
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card bg-gradient-to-t from-brand/10 to-card shadow-xs">
              <CardHeader>
                <CardDescription>Current Mentees</CardDescription>
                <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
                  {mentor.currentMentees}/{mentor.maxMentees}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    {mentor.currentMentees >= mentor.maxMentees ? (
                      <>
                        <Target className="h-3 w-3" />
                        At capacity
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3" />
                        {mentor.maxMentees - mentor.currentMentees} spots
                      </>
                    )}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <Progress
                  value={(mentor.currentMentees / mentor.maxMentees) * 100}
                  className="h-2 w-full"
                />
                <div className="text-muted-foreground">
                  {Math.round((mentor.currentMentees / mentor.maxMentees) * 100)}% capacity
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card bg-gradient-to-t from-periwinkle/10 to-card shadow-xs">
              <CardHeader>
                <CardDescription>Total Meetings</CardDescription>
                <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
                  {stats.totalMeetings}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <CheckCircle2 className="h-3 w-3" />
                    {stats.completedMeetings} done
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="flex gap-2 font-medium">
                  Completion rate: {stats.totalMeetings > 0
                    ? Math.round((stats.completedMeetings / stats.totalMeetings) * 100)
                    : 0}%
                </div>
                <div className="text-muted-foreground">
                  {stats.completedMeetings} completed sessions
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card bg-gradient-to-t from-info/10 to-card shadow-xs">
              <CardHeader>
                <CardDescription>Meeting Hours</CardDescription>
                <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
                  {stats.totalMeetingHours}h
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3" />
                    Mentoring time
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="flex gap-2 font-medium">
                  Total mentoring impact
                </div>
                <div className="text-muted-foreground">
                  Avg {stats.totalMeetings > 0
                    ? (stats.totalMeetingHours / stats.totalMeetings).toFixed(1)
                    : 0}h per session
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card bg-gradient-to-t from-mint/20 to-card shadow-xs">
              <CardHeader>
                <CardDescription>Resources Shared</CardDescription>
                <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
                  {stats.resourcesUploaded}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <BookOpen className="h-3 w-3" />
                    Materials
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="flex gap-2 font-medium">
                  Knowledge sharing
                </div>
                <div className="text-muted-foreground">
                  Uploaded by you
                </div>
              </CardFooter>
            </Card>
          </div>

        </div>
      )}

      {/* Mentee Section */}
      {mentee && (
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-periwinkle" />
            Mentee Dashboard
          </h2>

          {/* Mentee Stats */}
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card bg-gradient-to-t from-periwinkle/10 to-card shadow-xs">
              <CardHeader>
                <CardDescription>Active Mentors</CardDescription>
                <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
                  {mentee.mentors.length}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Users className="h-3 w-3" />
                    Connected
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="flex gap-2 font-medium">
                  Active relationships
                </div>
                <div className="text-muted-foreground">
                  Currently learning from {mentee.mentors.length} mentor{mentee.mentors.length !== 1 ? 's' : ''}
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card bg-gradient-to-t from-brand/10 to-card shadow-xs">
              <CardHeader>
                <CardDescription>Sessions Attended</CardDescription>
                <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
                  {stats.completedMeetings}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <CheckCircle2 className="h-3 w-3" />
                    {Math.round((stats.completedMeetings / Math.max(stats.totalMeetings, 1)) * 100)}%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="flex gap-2 font-medium">
                  {stats.completedMeetings} of {stats.totalMeetings} scheduled
                </div>
                <div className="text-muted-foreground">
                  Strong attendance record
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card bg-gradient-to-t from-info/10 to-card shadow-xs">
              <CardHeader>
                <CardDescription>Events Registered</CardDescription>
                <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
                  {stats.eventsRegistered}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3" />
                    {stats.eventsAttended} attended
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="flex gap-2 font-medium">
                  Community engagement
                </div>
                <div className="text-muted-foreground">
                  {Math.round((stats.eventsAttended / Math.max(stats.eventsRegistered, 1)) * 100)}% attendance rate
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card bg-gradient-to-t from-mint/20 to-card shadow-xs">
              <CardHeader>
                <CardDescription>Resources Accessed</CardDescription>
                <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
                  {stats.resourcesAccessed}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <BookOpen className="h-3 w-3" />
                    Materials
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="flex gap-2 font-medium">
                  Learning progress
                </div>
                <div className="text-muted-foreground">
                  Knowledge resources
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}


      {/* Common Sections */}
      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Don't miss these opportunities</CardDescription>
              </div>
              <Link href="/dashboard/events">
                <Button variant="outline" size="sm">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent">
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.isRegistered && (
                      <Badge variant="default">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Registered
                      </Badge>
                    )}
                    <Badge variant="outline">{event.eventType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Resources */}
      {recentResources.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Resources</CardTitle>
                <CardDescription>Latest learning materials</CardDescription>
              </div>
              <Link href="/dashboard/resources">
                <Button variant="outline" size="sm">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentResources.slice(0, 3).map((resource: any) => (
                <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {getResourceIcon(resource.resourceType)}
                    </div>
                    <div>
                      <p className="font-medium">{resource.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{resource.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{resource.accessLevel}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getIcon(iconName: string) {
  const icons: { [key: string]: any } = {
    Users: <Users className="h-4 w-4" />,
    Calendar: <Calendar className="h-4 w-4" />,
    Search: <Search className="h-4 w-4" />,
    BookOpen: <BookOpen className="h-4 w-4" />,
    BarChart: <BarChart className="h-4 w-4" />,
  };
  return icons[iconName] || <Sparkles className="h-4 w-4" />;
}

function getResourceIcon(type: string) {
  switch (type) {
    case 'document':
      return <FileText className="h-5 w-5 text-primary" />;
    case 'video':
      return <Video className="h-5 w-5 text-primary" />;
    case 'link':
      return <MessageSquare className="h-5 w-5 text-primary" />;
    default:
      return <BookOpen className="h-5 w-5 text-primary" />;
  }
}