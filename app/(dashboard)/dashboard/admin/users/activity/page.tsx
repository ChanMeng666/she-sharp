'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  Calendar,
  Clock,
  Globe,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  UserPlus,
  Download,
  Filter,
  Search,
  Eye,
  FileText,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string | number;
  userId: string | number | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | number | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: string;
}

interface ActivityResponse {
  activities: ActivityLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Map action types to icons and styles
const getActionStyle = (action: string) => {
  const actionMap: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
    login: { icon: LogIn, color: 'text-green-600', bg: 'bg-green-100' },
    logout: { icon: LogOut, color: 'text-muted-foreground', bg: 'bg-accent' },
    create: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' },
    update: { icon: Edit, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    delete: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' },
    view: { icon: Eye, color: 'text-purple-600', bg: 'bg-purple-100' },
    export: { icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    security: { icon: Shield, color: 'text-foreground', bg: 'bg-muted' },
  };
  return actionMap[action.toLowerCase()] || { icon: Activity, color: 'text-muted-foreground', bg: 'bg-accent' };
};

export default function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, uniqueUsers: 0, securityEvents: 0, successRate: 0 });

  // Fetch activity logs from API
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/activity?limit=100&offset=0`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      const data: ActivityResponse = await response.json();
      setActivities(data.activities);
      setPagination(data.pagination);

      // Calculate stats from fetched data
      const uniqueUsers = new Set(data.activities.map(a => a.userId).filter(Boolean)).size;
      const securityEvents = data.activities.filter(a =>
        a.action.toLowerCase().includes('security') ||
        a.action.toLowerCase().includes('failed')
      ).length;

      setStats({
        total: data.pagination.total,
        uniqueUsers,
        securityEvents,
        successRate: data.pagination.total > 0
          ? Math.round(((data.pagination.total - securityEvents) / data.pagination.total) * 100 * 10) / 10
          : 100
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Filter activities based on search and action filter
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchQuery === '' ||
      (activity.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (activity.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.entityType?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesAction = actionFilter === 'all' || activity.action.toLowerCase() === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Monitor user activities and system events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchActivities} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-xs text-muted-foreground">Unique users</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Security Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className={cn("text-2xl font-bold", stats.securityEvents > 0 && "text-yellow-600")}>
                  {stats.securityEvents}
                </p>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                <p className="text-xs text-muted-foreground">Successful actions</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="search"
                placeholder="Search by user, email, or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Showing {filteredActivities.length} of {pagination.total} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activity logs found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => {
                    const actionStyle = getActionStyle(activity.action);
                    const Icon = actionStyle.icon;

                    return (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{activity.userName || 'Unknown User'}</p>
                            <p className="text-sm text-muted-foreground">{activity.userEmail || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={cn("p-1.5 rounded", actionStyle.bg)}>
                              <Icon className={cn("w-4 h-4", actionStyle.color)} />
                            </div>
                            <span className="capitalize">{activity.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {activity.entityType && (
                              <span className="capitalize">{activity.entityType}</span>
                            )}
                            {activity.entityId && (
                              <span className="text-muted-foreground ml-1">#{String(activity.entityId).slice(0, 8)}</span>
                            )}
                            {!activity.entityType && !activity.entityId && '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Globe className="w-3 h-3" />
                            <span>{activity.ipAddress || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1 text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}