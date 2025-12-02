'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  BrainCircuit,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
    completedRelationships: number;
    avgMatchScore: number;
  };
}

interface GrowthData {
  month: string;
  newUsers: number;
  cumulativeUsers: number;
}

export default function AdminDashboard({ userId }: AdminDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m');
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [userId, timeRange]);

  const fetchDashboardData = async () => {
    try {
      // Calculate date range
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

      const [metricsRes, tasksRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/tasks/pending'),
        fetch(`/api/admin/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setPendingTasks(tasksData.tasks || []);
        setTotalTasksCount(tasksData.totalCount || 0);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData.growth?.monthlyData) {
          setGrowthData(analyticsData.growth.monthlyData.slice(-6));
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart configuration
  const chartConfig = {
    users: {
      label: "Total Users",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  // Transform growth data for chart
  const chartData = growthData.map((item) => {
    const date = new Date(item.month + '-01');
    return {
      month: date.toLocaleString('en-US', { month: 'short' }),
      users: item.cumulativeUsers,
    };
  });

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
              {data.users.active.toLocaleString()} active
            </div>
            <div className="text-muted-foreground">
              +{data.users.new} new this month
            </div>
          </CardFooter>
        </Card>

        {/* Active Mentorships Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Active Mentorships</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
              {data.mentorship.activePairs}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Users className="h-3 w-3" />
                {data.mentorship.mentors}:{data.mentorship.mentees}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              {data.mentorship.completedRelationships || 0} completed
            </div>
            <div className="text-muted-foreground">
              Mentor to mentee ratio
            </div>
          </CardFooter>
        </Card>

        {/* Pending Applications Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Pending Applications</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
              {data.mentorship.pendingApplications}
            </CardTitle>
            <CardAction>
              <Badge variant={data.mentorship.pendingApplications > 0 ? 'destructive' : 'outline'}>
                <GraduationCap className="h-3 w-3" />
                {data.mentorship.pendingApplications > 0 ? 'Action needed' : 'All clear'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              Mentor applications
            </div>
            <div className="text-muted-foreground">
              Awaiting review
            </div>
          </CardFooter>
        </Card>

        {/* AI Match Score Card */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>AI Match Score</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[300px]/card:text-3xl @[400px]/card:text-4xl">
              {data.mentorship.avgMatchScore ? `${Math.round(data.mentorship.avgMatchScore)}%` : 'N/A'}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <BrainCircuit className="h-3 w-3" />
                Average
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              Matching quality
            </div>
            <div className="text-muted-foreground">
              AI compatibility analysis
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* User Growth Chart */}
      {chartData.length > 0 && (
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              Platform user growth over time
            </CardDescription>
            <CardAction>
              <ToggleGroup
                type="single"
                value={timeRange}
                onValueChange={(value) => value && setTimeRange(value)}
                variant="outline"
                className="hidden *:data-[slot=toggle-group-item]:!px-4 @[540px]/card:flex"
              >
                <ToggleGroupItem value="3m">3M</ToggleGroupItem>
                <ToggleGroupItem value="6m">6M</ToggleGroupItem>
                <ToggleGroupItem value="12m">1Y</ToggleGroupItem>
              </ToggleGroup>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger
                  className="w-24 @[540px]/card:hidden"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3M</SelectItem>
                  <SelectItem value="6m">6M</SelectItem>
                  <SelectItem value="12m">1Y</SelectItem>
                </SelectContent>
              </Select>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.1} />
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
                  stroke="var(--color-users)"
                  fill="url(#fillUsers)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Pending Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pending Tasks</CardTitle>
            <Badge variant="outline">{totalTasksCount} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingTasks.length > 0 ? (
            <div className="space-y-2">
              {pendingTasks.map((task, idx) => (
                <Link
                  key={idx}
                  href={task.href}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
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
  );
}
