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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Download,
  Users,
  Calendar,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Video,
  FileText,
  BarChart,
  Link2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Star,
  MapPin,
  Brain,
  Briefcase,
  Building2,
  GraduationCap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MentorInfo {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  company: string | null;
  jobTitle: string | null;
  city: string | null;
  mbtiType: string | null;
  yearsExperience: number | null;
  expertise: string[];
}

interface MenteeInfo {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  city: string | null;
  mbtiType: string | null;
  jobTitle: string | null;
  industry: string | null;
  careerStage: string | null;
  learningGoals: string[];
}

interface Relationship {
  id: number;
  mentor: MentorInfo;
  mentee: MenteeInfo;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  meetingFrequency: string | null;
  nextMeetingDate: string | null;
  goals: string[];
  progress: number;
  sessionsCompleted: number;
  sessionsScheduled: number;
  totalSessions: number;
  satisfactionScore: number | null;
  lastActivity: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  atRisk: number;
  completed: number;
  paused: number;
  avgSatisfaction: number;
  totalMeetings: number;
}

interface ApiResponse {
  relationships: Relationship[];
  stats: Stats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function MentorRelationshipsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, atRisk: 0, completed: 0, paused: 0, avgSatisfaction: 0, totalMeetings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRelationships = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/mentors/relationships?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch relationships');
      }
      const data: ApiResponse = await response.json();
      setRelationships(data.relationships);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { text: 'Active', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      at_risk: { text: 'At Risk', className: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      paused: { text: 'Paused', className: 'bg-accent text-foreground', icon: Clock },
      completed: { text: 'Completed', className: 'bg-blue-100 text-blue-800', icon: Target },
    };
    const variant = variants[status as keyof typeof variants] || variants.paused;
    const Icon = variant.icon;
    return (
      <Badge className={variant.className}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.text}
      </Badge>
    );
  };

  const filteredRelationships = relationships.filter(rel => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      rel.mentor.name.toLowerCase().includes(searchLower) ||
      rel.mentee.name.toLowerCase().includes(searchLower) ||
      rel.mentor.email.toLowerCase().includes(searchLower) ||
      rel.mentee.email.toLowerCase().includes(searchLower) ||
      (rel.mentor.company?.toLowerCase().includes(searchLower) ?? false) ||
      (rel.mentor.city?.toLowerCase().includes(searchLower) ?? false) ||
      (rel.mentee.city?.toLowerCase().includes(searchLower) ?? false) ||
      (rel.mentee.industry?.toLowerCase().includes(searchLower) ?? false);
    const matchesStatus = statusFilter === 'all' || rel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mentorship Relationships</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Track and manage active mentor-mentee pairings
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button variant="outline" onClick={fetchRelationships} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="default">
            <Link2 className="w-4 h-4 mr-2" />
            New Pairing
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Active</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground mt-2">{stats.total} total relationships</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold text-yellow-600">{stats.atRisk}</p>
                <p className="text-xs text-muted-foreground mt-2">Need attention</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                <p className="text-xs text-muted-foreground mt-2">Successfully finished</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stats.avgSatisfaction || 'N/A'}</p>
                  {stats.avgSatisfaction > 0 && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Out of 5.0</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold">{stats.totalMeetings}</p>
                <p className="text-xs text-muted-foreground mt-2">Completed sessions</p>
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
                placeholder="Search by mentor or mentee name/email..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Relationships Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Relationships</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${filteredRelationships.length} relationships found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRelationships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No relationships found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Mentee</TableHead>
                    <TableHead>Progress & Goals</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredRelationships.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={relationship.mentor.avatar || ''} />
                          <AvatarFallback className="text-xs">
                            {relationship.mentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm">{relationship.mentor.name}</p>
                          {(relationship.mentor.jobTitle || relationship.mentor.company) && (
                            <p className="text-xs text-muted-foreground">
                              {relationship.mentor.jobTitle}
                              {relationship.mentor.jobTitle && relationship.mentor.company && ' @ '}
                              {relationship.mentor.company}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {relationship.mentor.city && (
                              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                <MapPin className="w-2.5 h-2.5" />
                                {relationship.mentor.city}
                              </span>
                            )}
                            {relationship.mentor.mbtiType && (
                              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                {relationship.mentor.mbtiType}
                              </Badge>
                            )}
                            {relationship.mentor.yearsExperience && (
                              <span className="text-xs text-muted-foreground">
                                {relationship.mentor.yearsExperience}y exp
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={relationship.mentee.avatar || ''} />
                          <AvatarFallback className="text-xs">
                            {relationship.mentee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm">{relationship.mentee.name}</p>
                          {(relationship.mentee.jobTitle || relationship.mentee.industry) && (
                            <p className="text-xs text-muted-foreground">
                              {relationship.mentee.jobTitle}
                              {relationship.mentee.jobTitle && relationship.mentee.industry && ' in '}
                              {relationship.mentee.industry}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {relationship.mentee.city && (
                              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                <MapPin className="w-2.5 h-2.5" />
                                {relationship.mentee.city}
                              </span>
                            )}
                            {relationship.mentee.mbtiType && (
                              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                {relationship.mentee.mbtiType}
                              </Badge>
                            )}
                            {relationship.mentee.careerStage && (
                              <span className="text-xs text-muted-foreground capitalize">
                                {relationship.mentee.careerStage.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={relationship.progress}
                            className="w-20 h-2"
                          />
                          <span className="text-xs font-medium">{relationship.progress}%</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Target className="w-3 h-3" />
                          <span>{relationship.sessionsCompleted}/{relationship.totalSessions} sessions</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(relationship.goals || []).slice(0, 2).map(goal => (
                            <Badge key={goal} variant="outline" className="text-xs">
                              {goal}
                            </Badge>
                          ))}
                          {(relationship.goals || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{relationship.goals.length - 2}
                            </Badge>
                          )}
                          {(relationship.goals || []).length === 0 && (
                            <span className="text-xs text-muted-foreground">No goals set</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {relationship.startedAt && (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">Started {new Date(relationship.startedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {relationship.meetingFrequency && (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{relationship.meetingFrequency}</span>
                          </div>
                        )}
                        {relationship.nextMeetingDate && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Video className="w-3 h-3" />
                            <span className="text-xs">
                              Next: {new Date(relationship.nextMeetingDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getStatusBadge(relationship.status)}
                        {relationship.satisfactionScore !== null && (
                          <div className="flex items-center space-x-1 text-xs">
                            <BarChart className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Score: {relationship.satisfactionScore}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            View Reports
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Pairing
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            End Relationship
                          </DropdownMenuItem>
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
