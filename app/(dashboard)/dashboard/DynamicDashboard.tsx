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
  Target,
  MessageSquare,
  FileText,
  Video,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    emailVerified: boolean;
    roles: string[];
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

function ProgrammeStatusCard() {
  const [programme, setProgramme] = useState<{
    name: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    partnerOrganisation: string | null;
  } | null>(null);

  useEffect(() => {
    fetch('/api/user/mentee-profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.profile?.programmeInfo) {
          setProgramme(data.profile.programmeInfo);
        }
      })
      .catch(() => {});
  }, []);

  if (!programme) return null;

  const isCompleted = programme.status === 'completed';

  if (isCompleted) {
    return (
      <Card className="border-brand/30 bg-[#f7e5f3]/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-brand" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{programme.name} Programme Completed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Thank you for participating! Your mentorship relationship has concluded.
              </p>
              <div className="flex gap-2 mt-3">
                <Link href="/membership">
                  <Button size="sm" variant="brand">Become a Premium Member</Button>
                </Link>
                <Link href="/events">
                  <Button size="sm" variant="outline">Browse Events</Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand/30 bg-gradient-to-r from-[#f7e5f3]/30 to-card">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-brand" />
              <h3 className="font-semibold">{programme.name} Programme</h3>
            </div>
            {programme.startDate && programme.endDate && (
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(programme.startDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' '}&mdash;{' '}
                {new Date(programme.endDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            {programme.partnerOrganisation && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Partner: {programme.partnerOrganisation}
              </p>
            )}
          </div>
          <Badge className="bg-green-100 text-green-700">Active</Badge>
        </div>
      </CardContent>
    </Card>
  );
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

  const { user, formStatus, mentor, mentee, upcomingEvents, recentResources } = data;

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
            <Link href="/dashboard/account">
              <Badge variant="destructive" className="cursor-pointer hover:bg-destructive/80 transition-colors">
                <AlertCircle className="h-3 w-3 mr-1" />
                Email not verified
              </Badge>
            </Link>
          )}
        </div>
      </div>

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="h-6 w-6 text-brand" />
              Mentor Dashboard
            </h2>
            <Badge className={mentor.isAcceptingMentees ? 'bg-badge-success-bg text-badge-success-fg' : ''} variant={mentor.isAcceptingMentees ? undefined : 'secondary'}>
              {mentor.isAcceptingMentees ? 'Accepting Mentees' : 'Not Accepting'}
            </Badge>
          </div>

          {/* Mentor Stats */}
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
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

          <ProgrammeStatusCard />

          {/* Mentee Stats */}
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
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
              <Link href="/events">
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
                  <div className="flex-1 min-w-0">
                    <p className="font-medium break-words">{event.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
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
              <Link href="/resources">
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
                      <p className="text-sm text-muted-foreground break-words">{resource.description}</p>
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