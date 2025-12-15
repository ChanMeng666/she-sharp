'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Search,
  Calendar,
  Video,
  Users,
  MessageSquare,
  Star,
  FileText,
  Timer,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Eye,
  Edit,
  Monitor,
  RefreshCw
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
import { cn } from '@/lib/utils';

interface Meeting {
  id: number;
  relationshipId: number;
  mentor: string;
  mentee: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  rating: number | null;
  topics: string[];
  notes: string | null;
  recordingAvailable: boolean;
}

interface Stats {
  total: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  avgDuration: number;
  avgRating: number;
  totalRatings: number;
  completionRate: number;
}

interface TrendData {
  month: string;
  meetings: number;
  avgDuration: number;
}

interface TypeDistribution {
  type: string;
  value: number;
}

interface ApiResponse {
  meetings: Meeting[];
  stats: Stats;
  trends: TrendData[];
  typeDistribution: TypeDistribution[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const TYPE_COLORS = [
  'hsl(312, 54%, 40%)',  // Purple Dark - Video calls (brand)
  'hsl(242, 38%, 19%)',  // Navy Dark - In person (navy)
];

export default function MentorMeetingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, scheduled: 0, cancelled: 0, avgDuration: 0, avgRating: 0, totalRatings: 0, completionRate: 0 });
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [typeDistribution, setTypeDistribution] = useState<TypeDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/mentors/meetings?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }
      const data: ApiResponse = await response.json();
      setMeetings(data.meetings);
      setStats(data.stats);
      setTrends(data.trends);
      setTypeDistribution(data.typeDistribution);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { text: 'Completed', className: 'bg-foreground text-background', icon: CheckCircle },
      scheduled: { text: 'Scheduled', className: 'bg-periwinkle-light text-foreground', icon: Calendar },
      cancelled: { text: 'Cancelled', className: 'bg-muted-foreground text-background', icon: XCircle },
      no_show: { text: 'No Show', className: 'bg-destructive/10 text-destructive', icon: AlertCircle },
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
      video: { icon: Video, color: 'text-brand' },
      in_person: { icon: Users, color: 'text-navy' },
    };
    const config = icons[type as keyof typeof icons];
    const Icon = config?.icon || Video;
    return <Icon className={`w-4 h-4 ${config?.color || 'text-muted-foreground'}`} />;
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = searchQuery === '' ||
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
          <Button variant="outline" onClick={fetchMeetings} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-muted bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-foreground">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Summary */}
      {!loading && (
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-navy" />
            <span className="text-navy font-medium">Total Meetings</span>
            <span className="font-bold text-lg">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-brand" />
            <span className="text-brand font-medium">Completed</span>
            <span className="font-bold text-lg">{stats.completed}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-info" />
            <span className="text-info font-medium">Scheduled</span>
            <span className="font-bold text-lg">{stats.scheduled}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-periwinkle" />
            <span className="text-periwinkle font-medium">Avg Duration</span>
            <span className="font-bold text-lg">{stats.avgDuration} min</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-navy" />
            <span className="text-navy font-medium">Completion Rate</span>
            <span className="font-bold text-lg">{stats.completionRate}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-brand fill-brand" />
            <span className="text-brand font-medium">Avg Rating</span>
            <span className="font-bold text-lg">{stats.avgRating || 'N/A'}</span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Trends</CardTitle>
            <CardDescription>Monthly meeting count and average duration</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : trends.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No trend data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trends}>
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
                    stroke="hsl(312, 54%, 40%)"
                    strokeWidth={2}
                    name="Total Meetings"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgDuration"
                    stroke="hsl(208, 83%, 45%)"
                    strokeWidth={2}
                    name="Avg Duration (min)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meeting Types</CardTitle>
            <CardDescription>Distribution by communication method</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : typeDistribution.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No type data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, value }) => `${type}: ${value}%`}
                    outerRadius={80}
                    fill="hsl(244, 100%, 75%)"
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Meetings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting History</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${filteredMeetings.length} meetings found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No meetings found</p>
              </div>
            ) : (
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
                        {(meeting.topics || []).map(topic => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {(meeting.topics || []).length === 0 && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
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
                          <Star className="w-4 h-4 text-brand fill-brand" />
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
                              <DropdownMenuItem className="text-foreground">
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
