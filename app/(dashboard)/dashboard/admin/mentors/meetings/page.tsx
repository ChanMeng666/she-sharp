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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  Download,
  Calendar,
  Clock,
  Video,
  Users,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Star,
  FileText,
  BarChart3,
  Timer,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Send,
  PhoneCall,
  Monitor
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const meetingTrendData = [
  { month: 'Jul', meetings: 145, avgDuration: 48 },
  { month: 'Aug', meetings: 162, avgDuration: 52 },
  { month: 'Sep', meetings: 178, avgDuration: 50 },
  { month: 'Oct', meetings: 195, avgDuration: 55 },
  { month: 'Nov', meetings: 210, avgDuration: 53 },
  { month: 'Dec', meetings: 188, avgDuration: 51 },
];

const meetingTypeData = [
  { type: 'Video Call', value: 65, color: '#9b2e83' },
  { type: 'In-Person', value: 20, color: '#c05299' },
  { type: 'Phone Call', value: 10, color: '#60a5fa' },
  { type: 'Chat', value: 5, color: '#94a3b8' },
];

const mockMeetings = [
  {
    id: 1,
    mentor: 'Dr. Sarah Johnson',
    mentee: 'Alice Thompson',
    date: '2024-12-20T14:00:00Z',
    duration: 55,
    type: 'video',
    status: 'completed',
    rating: 5,
    topics: ['AWS Architecture', 'Career Planning'],
    notes: 'Discussed cloud migration strategies and Q1 goals',
    recordingAvailable: true
  },
  {
    id: 2,
    mentor: 'Emily Chen',
    mentee: 'Bob Wilson',
    date: '2024-12-21T15:00:00Z',
    duration: 0,
    type: 'video',
    status: 'scheduled',
    rating: null,
    topics: ['Machine Learning', 'Python'],
    notes: null,
    recordingAvailable: false
  },
  {
    id: 3,
    mentor: 'Jessica Martinez',
    mentee: 'Carol Davis',
    date: '2024-12-19T10:00:00Z',
    duration: 30,
    type: 'phone',
    status: 'completed',
    rating: 4,
    topics: ['Design Review'],
    notes: 'Reviewed portfolio projects',
    recordingAvailable: false
  },
  {
    id: 4,
    mentor: 'Dr. Rachel Williams',
    mentee: 'Diana Lee',
    date: '2024-12-18T16:00:00Z',
    duration: 45,
    type: 'in_person',
    status: 'completed',
    rating: 5,
    topics: ['Research Methods', 'Paper Writing'],
    notes: 'Finalized research proposal draft',
    recordingAvailable: false
  },
  {
    id: 5,
    mentor: 'Maria Rodriguez',
    mentee: 'Eve Brown',
    date: '2024-12-20T11:00:00Z',
    duration: 0,
    type: 'video',
    status: 'cancelled',
    rating: null,
    topics: ['Blockchain'],
    notes: 'Rescheduled due to conflict',
    recordingAvailable: false
  },
  {
    id: 6,
    mentor: 'Dr. Sarah Johnson',
    mentee: 'Frank Miller',
    date: '2024-12-22T09:00:00Z',
    duration: 0,
    type: 'video',
    status: 'scheduled',
    rating: null,
    topics: ['Team Management'],
    notes: null,
    recordingAvailable: false
  }
];

export default function MentorMeetingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { text: 'Completed', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      scheduled: { text: 'Scheduled', className: 'bg-blue-100 text-blue-800', icon: Calendar },
      cancelled: { text: 'Cancelled', className: 'bg-red-100 text-red-800', icon: XCircle },
      no_show: { text: 'No Show', className: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    };
    const variant = variants[status as keyof typeof variants];
    const Icon = variant?.icon || AlertCircle;
    return (
      <Badge className={variant?.className}>
        <Icon className="w-3 h-3 mr-1" />
        {variant?.text || status}
      </Badge>
    );
  };

  const getMeetingTypeIcon = (type: string) => {
    const icons = {
      video: { icon: Video, color: 'text-primary' },
      phone: { icon: PhoneCall, color: 'text-blue-600' },
      in_person: { icon: Users, color: 'text-green-600' },
      chat: { icon: MessageSquare, color: 'text-muted-foreground' },
    };
    const config = icons[type as keyof typeof icons];
    const Icon = config?.icon || Video;
    return <Icon className={`w-4 h-4 ${config?.color || 'text-muted-foreground'}`} />;
  };

  const filteredMeetings = mockMeetings.filter(meeting => {
    const matchesSearch = 
      meeting.mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.mentee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
    const matchesType = typeFilter === 'all' || meeting.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meeting Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Track and analyze mentorship meeting patterns and outcomes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button variant="outline" className="text-sm sm:text-base">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">342</p>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+15% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">52 min</p>
            <p className="text-xs text-muted-foreground mt-2">Target: 45-60 min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">94%</p>
            <Progress value={94} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">4.7</p>
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">From 298 reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Trends</CardTitle>
            <CardDescription>Monthly meeting count and average duration</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={meetingTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="meetings" 
                  stroke="#9b2e83" 
                  strokeWidth={2}
                  name="Total Meetings"
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="avgDuration" 
                  stroke="#60a5fa" 
                  strokeWidth={2}
                  name="Avg Duration (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meeting Types</CardTitle>
            <CardDescription>Distribution by communication method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={meetingTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, value }) => `${type}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {meetingTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
                placeholder="Search by participants or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
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

      {/* Meetings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting History</CardTitle>
          <CardDescription>
            {filteredMeetings.length} meetings found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participants</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead>Duration & Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredMeetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{meeting.mentor}</p>
                      <p className="text-xs text-muted-foreground">with {meeting.mentee}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{new Date(meeting.date).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {meeting.topics.map(topic => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getMeetingTypeIcon(meeting.type)}
                        <span className="text-sm capitalize">{meeting.type.replace('_', ' ')}</span>
                      </div>
                      {meeting.duration > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Timer className="w-3 h-3" />
                          <span>{meeting.duration} min</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(meeting.status)}
                  </TableCell>
                  <TableCell>
                    {meeting.rating ? (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{meeting.rating}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {meeting.recordingAvailable && (
                          <DropdownMenuItem>
                            <Monitor className="w-4 h-4 mr-2" />
                            View Recording
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          View Notes
                        </DropdownMenuItem>
                        {meeting.status === 'scheduled' && (
                          <>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel Meeting
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}