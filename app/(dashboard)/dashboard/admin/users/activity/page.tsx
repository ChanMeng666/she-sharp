'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { 
  Activity, 
  User, 
  Calendar, 
  Clock, 
  Monitor, 
  Smartphone, 
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
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

const activityTypes = {
  login: { icon: LogIn, color: 'text-green-600', bg: 'bg-green-100' },
  logout: { icon: LogOut, color: 'text-muted-foreground', bg: 'bg-accent' },
  create: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' },
  update: { icon: Edit, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  delete: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' },
  security: { icon: Shield, color: 'text-foreground', bg: 'bg-muted' },
};

const mockActivities = [
  { id: 1, user: 'Sarah Johnson', email: 'sarah@example.com', action: 'login', description: 'User logged in', ipAddress: '192.168.1.1', device: 'desktop', browser: 'Chrome', timestamp: '2024-12-20T10:30:00Z', status: 'success' },
  { id: 2, user: 'Emily Chen', email: 'emily@example.com', action: 'update', description: 'Updated profile information', ipAddress: '192.168.1.2', device: 'mobile', browser: 'Safari', timestamp: '2024-12-20T10:25:00Z', status: 'success' },
  { id: 3, user: 'System', email: 'system@shesharp.org', action: 'security', description: 'Failed login attempt detected', ipAddress: '203.0.113.0', device: 'desktop', browser: 'Unknown', timestamp: '2024-12-20T10:20:00Z', status: 'warning' },
  { id: 4, user: 'Jessica Martinez', email: 'jessica@example.com', action: 'create', description: 'Created new event', ipAddress: '192.168.1.3', device: 'desktop', browser: 'Firefox', timestamp: '2024-12-20T10:15:00Z', status: 'success' },
  { id: 5, user: 'Admin', email: 'admin@shesharp.org', action: 'delete', description: 'Deleted expired content', ipAddress: '192.168.1.4', device: 'desktop', browser: 'Chrome', timestamp: '2024-12-20T10:10:00Z', status: 'success' },
];

export default function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  const filteredActivities = mockActivities.filter(activity => {
    const matchesSearch = activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          activity.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || activity.action === actionFilter;
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const getDeviceIcon = (device: string) => {
    return device === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Monitor user activities and system events
          </p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1,247</p>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">342</p>
            <p className="text-xs text-muted-foreground">Unique users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Security Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">12</p>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">98.5%</p>
            <p className="text-xs text-muted-foreground">Successful actions</p>
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
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Showing {filteredActivities.length} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Device/Location</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredActivities.map((activity) => {
                const actionType = activityTypes[activity.action as keyof typeof activityTypes];
                const Icon = actionType?.icon || Activity;
                
                return (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{activity.user}</p>
                        <p className="text-sm text-muted-foreground">{activity.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={cn("p-1.5 rounded", actionType?.bg)}>
                          <Icon className={cn("w-4 h-4", actionType?.color)} />
                        </div>
                        <span className="capitalize">{activity.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1 text-sm">
                        <div className="flex items-center space-x-1">
                          {getDeviceIcon(activity.device)}
                          <span>{activity.browser}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span className="text-xs">{activity.ipAddress}</span>
                        </div>
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
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(activity.status)}
                        <span className={cn(
                          "text-sm capitalize",
                          activity.status === 'success' && "text-green-600",
                          activity.status === 'warning' && "text-yellow-600",
                          activity.status === 'error' && "text-red-600"
                        )}>
                          {activity.status}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}