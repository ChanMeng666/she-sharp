'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  ShieldCheck,
  KeyRound,
  GraduationCap,
  Users,
  UserCheck,
  UserX,
  Calendar,
  CalendarCheck,
  CalendarX,
  FileUp,
  Download,
  CreditCard,
  XCircle,
  Filter,
  FileDown,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { toast } from 'sonner';

const iconMap: Record<string, LucideIcon> = {
  SIGN_UP: UserPlus,
  SIGN_IN: UserCog,
  SIGN_OUT: LogOut,
  UPDATE_PASSWORD: Lock,
  DELETE_ACCOUNT: UserMinus,
  UPDATE_ACCOUNT: Settings,
  VERIFY_EMAIL: Mail,
  REQUEST_PASSWORD_RESET: KeyRound,
  RESET_PASSWORD: Lock,
  ACCOUNT_LOCKED: Lock,
  ACCOUNT_UNLOCKED: ShieldCheck,
  ACTIVATE_MENTOR_ROLE: Users,
  ACTIVATE_MENTEE_ROLE: GraduationCap,
  UPDATE_MENTOR_PROFILE: Users,
  UPDATE_MENTEE_PROFILE: GraduationCap,
  REQUEST_MENTOR: UserCheck,
  ACCEPT_MENTEE: UserCheck,
  REJECT_MENTEE: UserX,
  END_MENTORSHIP: UserMinus,
  SCHEDULE_MEETING: Calendar,
  COMPLETE_MEETING: CalendarCheck,
  CANCEL_MEETING: CalendarX,
  REGISTER_EVENT: Calendar,
  ATTEND_EVENT: CalendarCheck,
  UPLOAD_RESOURCE: FileUp,
  ACCESS_RESOURCE: Download,
  UPGRADE_MEMBERSHIP: CreditCard,
  CANCEL_MEMBERSHIP: XCircle,
};

const actionColors: Record<string, string> = {
  SIGN_UP: 'bg-green-100 text-green-600',
  SIGN_IN: 'bg-blue-100 text-blue-600',
  SIGN_OUT: 'bg-accent text-muted-foreground',
  UPDATE_PASSWORD: 'bg-orange-100 text-orange-600',
  DELETE_ACCOUNT: 'bg-red-100 text-red-600',
  UPDATE_ACCOUNT: 'bg-muted text-primary',
  VERIFY_EMAIL: 'bg-green-100 text-green-600',
  REQUEST_PASSWORD_RESET: 'bg-yellow-100 text-yellow-600',
  RESET_PASSWORD: 'bg-orange-100 text-orange-600',
  ACCOUNT_LOCKED: 'bg-red-100 text-red-600',
  ACCOUNT_UNLOCKED: 'bg-green-100 text-green-600',
  ACTIVATE_MENTOR_ROLE: 'bg-indigo-100 text-indigo-600',
  ACTIVATE_MENTEE_ROLE: 'bg-indigo-100 text-indigo-600',
  UPDATE_MENTOR_PROFILE: 'bg-indigo-100 text-indigo-600',
  UPDATE_MENTEE_PROFILE: 'bg-indigo-100 text-indigo-600',
  REQUEST_MENTOR: 'bg-muted text-primary',
  ACCEPT_MENTEE: 'bg-green-100 text-green-600',
  REJECT_MENTEE: 'bg-red-100 text-red-600',
  END_MENTORSHIP: 'bg-accent text-muted-foreground',
  SCHEDULE_MEETING: 'bg-blue-100 text-blue-600',
  COMPLETE_MEETING: 'bg-green-100 text-green-600',
  CANCEL_MEETING: 'bg-red-100 text-red-600',
  REGISTER_EVENT: 'bg-muted text-primary',
  ATTEND_EVENT: 'bg-green-100 text-green-600',
  UPLOAD_RESOURCE: 'bg-blue-100 text-blue-600',
  ACCESS_RESOURCE: 'bg-cyan-100 text-cyan-600',
  UPGRADE_MEMBERSHIP: 'bg-yellow-100 text-yellow-600',
  CANCEL_MEMBERSHIP: 'bg-accent text-muted-foreground',
};

interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  entityType?: string;
  entityId?: number;
  metadata?: any;
  ipAddress?: string;
  timestamp: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    SIGN_UP: 'Signed up',
    SIGN_IN: 'Signed in',
    SIGN_OUT: 'Signed out',
    UPDATE_PASSWORD: 'Changed password',
    DELETE_ACCOUNT: 'Deleted account',
    UPDATE_ACCOUNT: 'Updated account',
    VERIFY_EMAIL: 'Verified email',
    REQUEST_PASSWORD_RESET: 'Requested password reset',
    RESET_PASSWORD: 'Reset password',
    ACCOUNT_LOCKED: 'Account locked',
    ACCOUNT_UNLOCKED: 'Account unlocked',
    ACTIVATE_MENTOR_ROLE: 'Activated mentor role',
    ACTIVATE_MENTEE_ROLE: 'Activated mentee role',
    UPDATE_MENTOR_PROFILE: 'Updated mentor profile',
    UPDATE_MENTEE_PROFILE: 'Updated mentee profile',
    REQUEST_MENTOR: 'Requested a mentor',
    ACCEPT_MENTEE: 'Accepted a mentee',
    REJECT_MENTEE: 'Rejected a mentee request',
    END_MENTORSHIP: 'Ended a mentorship',
    SCHEDULE_MEETING: 'Scheduled a meeting',
    COMPLETE_MEETING: 'Completed a meeting',
    CANCEL_MEETING: 'Cancelled a meeting',
    REGISTER_EVENT: 'Registered for an event',
    ATTEND_EVENT: 'Attended an event',
    UPLOAD_RESOURCE: 'Uploaded a resource',
    ACCESS_RESOURCE: 'Accessed a resource',
    UPGRADE_MEMBERSHIP: 'Upgraded membership',
    CANCEL_MEMBERSHIP: 'Cancelled membership',
  };
  return actionMap[action] || 'Performed action';
}

export default function ActivityPageClient() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [groupedLogs, setGroupedLogs] = useState<Record<string, ActivityLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('personal');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchActivityLogs();
  }, [scope, actionFilter, dateFilter, page]);

  const fetchActivityLogs = async () => {
    try {
      const params = new URLSearchParams({
        scope,
        page: page.toString(),
        limit: '50',
      });

      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = new Date(0);
        }
        
        params.append('startDate', startDate.toISOString());
      }

      const response = await fetch(`/api/activity-logs?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setGroupedLogs(data.groupedLogs || {});
        setHasMore(data.pagination.hasMore);
        
        // Check if user is admin (they can access 'all' scope)
        if (scope === 'all' && response.ok) {
          setIsAdmin(true);
        }
      } else if (response.status === 403) {
        // Not admin, switch back to personal
        setScope('personal');
        toast.error('Admin access required to view all logs');
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`Logs exported as ${format.toUpperCase()}`);
      } else {
        toast.error('Failed to export logs');
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">My Activity</SelectItem>
              <SelectItem value="team">Team Activity</SelectItem>
              {isAdmin && <SelectItem value="all">All Activity</SelectItem>}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="SIGN_IN">Sign Ins</SelectItem>
              <SelectItem value="UPDATE_ACCOUNT">Account Updates</SelectItem>
              <SelectItem value="REQUEST_MENTOR">Mentor Requests</SelectItem>
              <SelectItem value="SCHEDULE_MEETING">Meetings</SelectItem>
              <SelectItem value="ACCESS_RESOURCE">Resource Access</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        )}
      </div>

      {Object.keys(groupedLogs).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([date, dayLogs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
              <div className="space-y-2">
                {dayLogs.map((log) => {
                  const Icon = iconMap[log.action] || Settings;
                  const colorClass = actionColors[log.action] || 'bg-accent text-muted-foreground';
                  
                  return (
                    <Card key={log.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`rounded-full p-2 ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {formatAction(log.action)}
                              </p>
                              {log.entityType && (
                                <Badge variant="secondary" className="text-xs">
                                  {log.entityType}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {getRelativeTime(new Date(log.timestamp))}
                              </p>
                              {log.ipAddress && (
                                <p className="text-xs text-muted-foreground">
                                  IP: {log.ipAddress}
                                </p>
                              )}
                              {scope !== 'personal' && log.userName && (
                                <p className="text-xs text-muted-foreground">
                                  by {log.userName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No activity found
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {dateFilter !== 'all' 
                ? 'Try adjusting your date filter to see more activity'
                : 'Activity logs will appear here as actions are performed'}
            </p>
          </CardContent>
        </Card>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}