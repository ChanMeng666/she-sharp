'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TrendingUp, TrendingDown, Users, Calendar, GraduationCap, FileText, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AnalyticsAPIResponse {
  dateRange: {
    start: string;
    end: string;
  };
  overview: {
    totalUsers: number;
    newUsersInPeriod: number;
    totalActiveRelationships: number;
    newRelationshipsInPeriod: number;
  };
  roleDistribution: Array<{
    roleType: 'mentor' | 'mentee' | 'admin';
    count: number;
  }>;
  mentorshipStats: Array<{
    status: string;
    count: number;
  }>;
  meetingStats: Array<{
    status: string;
    count: number;
    totalHours: number;
  }>;
  eventStats: Array<{
    eventType: string;
    count: number;
    totalRegistrations: number;
  }>;
  resourceStats: Array<{
    resourceType: string;
    count: number;
    totalViews: number;
    totalDownloads: number;
  }>;
  engagement: {
    avgMeetingsPerRelationship: number;
    eventAttendanceRate: number;
  };
  growth: {
    monthlyData: Array<{
      month: string;
      newUsers: number;
      cumulativeUsers: number;
    }>;
  };
}

export default function AnalyticsDashboard() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState('6m');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsAPIResponse | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on selected timeRange
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '12m':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 6);
      }

      const response = await fetch(
        `/api/admin/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const userGrowthConfig = {
    users: {
      label: "Total Users",
      color: "var(--chart-1)",
    },
    mentees: {
      label: "Mentees",
      color: "var(--chart-2)",
    },
    mentors: {
      label: "Mentors",
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  const eventConfig = {
    value: {
      label: "Events",
    },
  } satisfies ChartConfig;

  const engagementConfig = {
    completedMeetings: {
      label: "Completed Meetings",
      color: "var(--chart-1)",
    },
    scheduledMeetings: {
      label: "Scheduled Meetings",
      color: "var(--chart-2)",
    },
    totalHours: {
      label: "Total Hours",
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Error Loading Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return null;
  }

  // Transform API data to component format
  const mentorCount = analyticsData.roleDistribution.find(r => r.roleType === 'mentor')?.count || 0;
  const menteeCount = analyticsData.roleDistribution.find(r => r.roleType === 'mentee')?.count || 0;
  const activePairs = analyticsData.mentorshipStats.find(s => s.status === 'active')?.count || 0;
  const pendingApplications = analyticsData.mentorshipStats.find(s => s.status === 'pending')?.count || 0;

  const completedMeetings = analyticsData.meetingStats.find(m => m.status === 'completed')?.count || 0;
  const totalMeetingHours = analyticsData.meetingStats.reduce((sum, m) => sum + (m.totalHours || 0), 0);

  const totalResources = analyticsData.resourceStats.reduce((sum, r) => sum + r.count, 0);
  const totalDownloads = analyticsData.resourceStats.reduce((sum, r) => sum + (r.totalDownloads || 0), 0);

  const mentorshipMetrics = [
    {
      metric: 'Active Pairs',
      value: activePairs,
      change: analyticsData.overview.newRelationshipsInPeriod > 0 ? 12 : -2,
      trend: analyticsData.overview.newRelationshipsInPeriod > 0 ? 'up' as const : 'down' as const
    },
    {
      metric: 'Completed Sessions',
      value: completedMeetings,
      change: 8.5,
      trend: 'up' as const
    },
    {
      metric: 'Average Meetings',
      value: Math.round(analyticsData.engagement.avgMeetingsPerRelationship * 10) / 10,
      change: 0.2,
      trend: 'up' as const
    },
    {
      metric: 'Event Attendance',
      value: Math.round(analyticsData.engagement.eventAttendanceRate),
      change: analyticsData.engagement.eventAttendanceRate > 85 ? 2 : -2,
      trend: analyticsData.engagement.eventAttendanceRate > 85 ? 'up' as const : 'down' as const
    },
  ];

  // Transform monthly growth data to chart format
  const userGrowthData = analyticsData.growth.monthlyData.slice(-6).map((item) => {
    const date = new Date(item.month + '-01');
    const monthName = date.toLocaleString('en-US', { month: 'short' });

    return {
      month: monthName,
      users: item.cumulativeUsers,
      mentors: Math.round(item.cumulativeUsers * (mentorCount / analyticsData.overview.totalUsers)),
      mentees: Math.round(item.cumulativeUsers * (menteeCount / analyticsData.overview.totalUsers)),
    };
  });

  // Transform event stats to pie chart format
  const eventColors = {
    workshop: '#9b2e83',
    networking: '#c05aac',
    training: '#e091d3',
    social: '#f3c4e8',
    thrive: '#fae5f5',
  };

  const eventData = analyticsData.eventStats.map((event) => ({
    name: event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1),
    value: event.count,
    color: eventColors[event.eventType as keyof typeof eventColors] || '#9b2e83',
  }));

  // Transform meeting stats to engagement data
  const engagementData = analyticsData.meetingStats.map((meeting, index) => ({
    status: meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1),
    completedMeetings: meeting.status === 'completed' ? meeting.count : 0,
    scheduledMeetings: meeting.status === 'scheduled' ? meeting.count : 0,
    totalHours: meeting.totalHours || 0,
  }));

  return (
    <div className="@container/main flex flex-col gap-6">
      {/* Key Metrics Summary */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {mentorshipMetrics.map((stat) => (
          <Card key={stat.metric} className="@container/card">
            <CardHeader>
              <CardDescription>{stat.metric}</CardDescription>
              <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
                {stat.metric === 'Average Meetings' ? stat.value.toFixed(1) : stat.value.toLocaleString()}
                {stat.metric === 'Event Attendance' && '%'}
              </CardTitle>
              <CardAction>
                <Badge variant={stat.trend === 'up' ? 'outline' : 'destructive'}>
                  {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="flex gap-2 font-medium">
                {stat.trend === 'up' ? 'Trending up' : 'Trending down'} this period
              </div>
              <div className="text-muted-foreground">
                Performance {stat.trend === 'up' ? 'increase' : 'decrease'}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* User Growth Chart */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>User Growth Trends</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">Total users, mentors, and mentees over time</span>
            <span className="@[540px]/card:hidden">User growth trends</span>
          </CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            >
              <ToggleGroupItem value="3m">Last 3 months</ToggleGroupItem>
              <ToggleGroupItem value="6m">Last 6 months</ToggleGroupItem>
              <ToggleGroupItem value="12m">Last year</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Select time range"
              >
                <SelectValue placeholder="Last 6 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="3m" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="6m" className="rounded-lg">
                  Last 6 months
                </SelectItem>
                <SelectItem value="12m" className="rounded-lg">
                  Last year
                </SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer config={userGrowthConfig} className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
            <AreaChart data={userGrowthData}>
              <defs>
                <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillMentees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mentees)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-mentees)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillMentors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mentors)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-mentors)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area
                type="monotone"
                dataKey="users"
                stackId="1"
                stroke="var(--color-users)"
                fill="url(#fillUsers)"
              />
              <Area
                type="monotone"
                dataKey="mentees"
                stackId="2"
                stroke="var(--color-mentees)"
                fill="url(#fillMentees)"
              />
              <Area
                type="monotone"
                dataKey="mentors"
                stackId="2"
                stroke="var(--color-mentors)"
                fill="url(#fillMentors)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
            <CardDescription>Breakdown of events by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={eventConfig} className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={eventData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="var(--color-value)"
                  dataKey="value"
                >
                  {eventData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Meeting Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Activity</CardTitle>
            <CardDescription>Meeting statistics and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={engagementConfig} className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="status"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="completedMeetings" fill="var(--color-completedMeetings)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="scheduledMeetings" fill="var(--color-scheduledMeetings)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Statistics</CardTitle>
          <CardDescription>Comprehensive platform metrics and KPIs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Current</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Period</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Change</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { category: 'Total Users', icon: Users, current: analyticsData.overview.totalUsers, period: analyticsData.overview.newUsersInPeriod },
                  { category: 'Active Mentors', icon: GraduationCap, current: mentorCount, period: Math.round(mentorCount * 0.1) },
                  { category: 'Active Mentees', icon: Users, current: menteeCount, period: Math.round(menteeCount * 0.12) },
                  { category: 'Mentorship Pairs', icon: Activity, current: activePairs, period: analyticsData.overview.newRelationshipsInPeriod },
                  { category: 'Total Events', icon: Calendar, current: analyticsData.eventStats.reduce((sum, e) => sum + e.count, 0), period: analyticsData.eventStats.reduce((sum, e) => sum + e.count, 0) },
                  { category: 'Resources', icon: FileText, current: totalResources, period: totalDownloads },
                ].map((row) => {
                  const change = row.current > 0 && row.period > 0
                    ? ((row.period / row.current) * 100).toFixed(1)
                    : '0.0';
                  const isPositive = parseFloat(change) > 0;

                  return (
                    <tr key={row.category} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <row.icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{row.category}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-semibold tabular-nums">
                        {row.current.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-muted-foreground tabular-nums hidden sm:table-cell">
                        {row.period.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge variant={isPositive ? 'default' : 'secondary'} className="tabular-nums">
                          {isPositive ? '+' : ''}{change}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
