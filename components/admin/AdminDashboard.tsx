'use client';

import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
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
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  userId: number;
}

interface GrowthData {
  month: string;
  newUsers: number;
  cumulativeUsers: number;
}

export default function AdminDashboard({ userId }: AdminDashboardProps) {
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
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

      const [tasksRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/tasks/pending'),
        fetch(`/api/admin/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setPendingTasks(tasksData.tasks || []);
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

  return (
    <div className="flex flex-col gap-6">
      {/* Pending Tasks - Top Priority */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Tasks</CardTitle>
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
                      task.priority === 'high' && "bg-[#d72f40]",
                      task.priority === 'medium' && "bg-[#9b2e83]",
                      task.priority === 'low' && "bg-muted-foreground"
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
              <CheckCircle className="h-12 w-12 text-[#9b2e83]/50 mb-3" />
              <p className="text-sm text-muted-foreground">No pending tasks</p>
            </div>
          )}
        </CardContent>
      </Card>

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

    </div>
  );
}
