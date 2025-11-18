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
  Award,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  FileText,
  Video,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
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

  const { user, stats, mentor, mentee, upcomingEvents, recentResources, quickActions } = data;

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

      {/* Role-specific Sections */}
      {/* Mentor Section */}
      {mentor && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Mentor Dashboard</h2>
            <Badge variant={mentor.isAcceptingMentees ? 'default' : 'secondary'}>
              {mentor.isAcceptingMentees ? 'Accepting Mentees' : 'Not Accepting'}
            </Badge>
          </div>

          {/* Mentor Stats */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card">
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

            <Card className="@container/card">
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

            <Card className="@container/card">
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

            <Card className="@container/card">
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

          {/* Active Mentees */}
          {mentor.mentees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Mentees</CardTitle>
                <CardDescription>Currently mentoring {mentor.mentees.length} mentee(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mentor.mentees.map((mentee: any) => (
                    <div key={mentee.relationshipId} className="flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent">
                      <div>
                        <p className="font-medium">{mentee.name}</p>
                        <p className="text-sm text-muted-foreground">{mentee.email}</p>
                      </div>
                      {mentee.nextMeeting && (
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(mentee.nextMeeting).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Mentee Section */}
      {mentee && (
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold">Mentee Dashboard</h2>

          {/* Mentee Stats */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card">
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

            <Card className="@container/card">
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

            <Card className="@container/card">
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

            <Card className="@container/card">
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

          {/* Active Mentors */}
          {mentee.mentors.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Mentors</CardTitle>
                <CardDescription>Currently learning from {mentee.mentors.length} mentor(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mentee.mentors.map((mentor: any) => (
                    <div key={mentor.relationshipId} className="flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent">
                      <div>
                        <p className="font-medium">{mentor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {mentor.title} {mentor.company && `at ${mentor.company}`}
                        </p>
                      </div>
                      {mentor.nextMeeting && (
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(mentor.nextMeeting).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-1">No mentors yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with experienced professionals to guide your journey
                </p>
                <Link href="/dashboard/mentors">
                  <Button>
                    Find a Mentor
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
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
                <Button variant="ghost" size="sm">
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
                <Button variant="ghost" size="sm">
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