'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-dark"></div>
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
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-dark mb-2">
          Welcome back, {user.name || 'there'}!
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {user.roles.map(role => (
            <Badge key={role} variant="secondary" className="bg-purple-light text-purple-dark">
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

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action: any, index: number) => (
            <Link key={index} href={action.href}>
              <Button
                variant="outline"
                className="w-full h-full justify-start"
              >
                {getIcon(action.icon)}
                <span className="ml-2">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      )}

      {/* Role-specific Sections */}
      <div className="grid gap-8">
        {/* Mentor Section */}
        {mentor && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-navy-dark">Mentor Dashboard</h2>
              <Badge className={mentor.isAcceptingMentees ? 'bg-mint-dark text-white' : 'bg-gray text-white'}>
                {mentor.isAcceptingMentees ? 'Accepting Mentees' : 'Not Accepting'}
              </Badge>
            </div>

            {/* Mentor Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Current Mentees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-dark">
                    {mentor.currentMentees}/{mentor.maxMentees}
                  </div>
                  <Progress 
                    value={(mentor.currentMentees / mentor.maxMentees) * 100} 
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Meetings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-dark">{stats.totalMeetings}</div>
                  <p className="text-xs text-gray mt-1">
                    {stats.completedMeetings} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Meeting Hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-dark">{stats.totalMeetingHours}h</div>
                  <p className="text-xs text-gray mt-1">Total mentoring time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Resources Shared</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-dark">{stats.resourcesUploaded}</div>
                  <p className="text-xs text-gray mt-1">Uploaded by you</p>
                </CardContent>
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
                      <div key={mentee.relationshipId} className="flex items-center justify-between p-3 rounded-lg bg-purple-light/20">
                        <div>
                          <p className="font-medium text-navy-dark">{mentee.name}</p>
                          <p className="text-sm text-gray">{mentee.email}</p>
                        </div>
                        {mentee.nextMeeting && (
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            Next: {new Date(mentee.nextMeeting).toLocaleDateString()}
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-navy-dark">Mentee Dashboard</h2>

            {/* Mentee Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Mentors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-periwinkle-dark">
                    {mentee.mentors.length}
                  </div>
                  <p className="text-xs text-gray mt-1">Currently connected</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Sessions Attended</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-periwinkle-dark">{stats.completedMeetings}</div>
                  <p className="text-xs text-gray mt-1">Of {stats.totalMeetings} scheduled</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Events Registered</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-periwinkle-dark">{stats.eventsRegistered}</div>
                  <p className="text-xs text-gray mt-1">{stats.eventsAttended} attended</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Resources Accessed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-periwinkle-dark">{stats.resourcesAccessed}</div>
                  <p className="text-xs text-gray mt-1">Learning materials</p>
                </CardContent>
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
                      <div key={mentor.relationshipId} className="flex items-center justify-between p-3 rounded-lg bg-periwinkle-light/20">
                        <div>
                          <p className="font-medium text-navy-dark">{mentor.name}</p>
                          <p className="text-sm text-gray">
                            {mentor.title} {mentor.company && `at ${mentor.company}`}
                          </p>
                        </div>
                        {mentor.nextMeeting && (
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            Next: {new Date(mentor.nextMeeting).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="h-12 w-12 text-gray mx-auto mb-4" />
                  <p className="text-gray mb-4">You don't have any mentors yet</p>
                  <Link href="/dashboard/mentors">
                    <Button variant="secondary">
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
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-navy-dark">{event.title}</p>
                      <p className="text-sm text-gray">
                        {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.isRegistered && (
                        <Badge variant="secondary" className="bg-mint-light text-navy-dark">
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
                  <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-light">
                        {getResourceIcon(resource.resourceType)}
                      </div>
                      <div>
                        <p className="font-medium text-navy-dark">{resource.title}</p>
                        <p className="text-sm text-gray">{resource.description}</p>
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
      return <FileText className="h-5 w-5 text-purple-dark" />;
    case 'video':
      return <Video className="h-5 w-5 text-purple-dark" />;
    case 'link':
      return <MessageSquare className="h-5 w-5 text-purple-dark" />;
    default:
      return <BookOpen className="h-5 w-5 text-purple-dark" />;
  }
}