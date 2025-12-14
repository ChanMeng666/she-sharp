'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Pause,
  Play,
  X,
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
  pending: number;
  active: number;
  atRisk: number;
  completed: number;
  paused: number;
  rejected: number;
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
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, active: 0, atRisk: 0, completed: 0, paused: 0, rejected: 0, avgSatisfaction: 0, totalMeetings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [endReason, setEndReason] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [processing, setProcessing] = useState(false);

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

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { text: 'Pending', className: 'bg-periwinkle-light text-foreground', icon: Clock },
      active: { text: 'Active', className: 'bg-foreground text-background', icon: CheckCircle },
      at_risk: { text: 'At Risk', className: 'bg-surface-purple text-foreground', icon: AlertCircle },
      paused: { text: 'Paused', className: 'bg-muted text-muted-foreground', icon: Pause },
      completed: { text: 'Completed', className: 'bg-foreground text-background', icon: Target },
      rejected: { text: 'Rejected', className: 'bg-muted-foreground text-background', icon: X },
    };
    const variant = variants[status as keyof typeof variants] || { text: status, className: 'bg-muted text-foreground', icon: Clock };
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

  // Action handlers
  const handleViewDetails = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    setDetailsDialogOpen(true);
  };

  const handleChangeStatus = (relationship: Relationship, status: string) => {
    setSelectedRelationship(relationship);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const handleEndRelationship = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    setEndReason('');
    setEndDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedRelationship || !newStatus) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/mentors/relationships/${selectedRelationship.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSuccessMessage(`Relationship status updated to ${newStatus}`);
        setStatusDialogOpen(false);
        fetchRelationships();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Failed to update relationship status');
    } finally {
      setProcessing(false);
    }
  };

  const confirmEndRelationship = async () => {
    if (!selectedRelationship) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/mentors/relationships/${selectedRelationship.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          endReason: endReason || 'Ended by admin'
        }),
      });

      if (response.ok) {
        setSuccessMessage('Relationship ended successfully');
        setEndDialogOpen(false);
        fetchRelationships();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to end relationship');
      }
    } catch (err) {
      setError('Failed to end relationship');
    } finally {
      setProcessing(false);
    }
  };

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
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Card className="border-mint bg-mint-light">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle className="w-5 h-5 text-brand" />
              <span>{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span>{error}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-info" />
          <span className="text-info font-medium">Pending</span>
          <span className="font-bold text-lg">{stats.pending}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-brand" />
          <span className="text-brand font-medium">Active</span>
          <span className="font-bold text-lg">{stats.active}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive font-medium">At Risk</span>
          <span className="font-bold text-lg">{stats.atRisk}</span>
        </div>
        <div className="flex items-center gap-2">
          <Pause className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Paused</span>
          <span className="font-bold text-lg">{stats.paused}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-navy" />
          <span className="text-navy font-medium">Completed</span>
          <span className="font-bold text-lg">{stats.completed}</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-brand fill-brand" />
          <span className="text-brand font-medium">Avg Score</span>
          <span className="font-bold text-lg">{stats.avgSatisfaction || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-periwinkle" />
          <span className="text-periwinkle font-medium">Meetings</span>
          <span className="font-bold text-lg">{stats.totalMeetings}</span>
        </div>
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Relationships Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Relationships</CardTitle>
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
                          <div className="flex items-center space-x-1 text-foreground">
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
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(relationship)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {(relationship.status === 'active' || relationship.status === 'at_risk' || relationship.status === 'pending') && (
                            <DropdownMenuItem onClick={() => handleChangeStatus(relationship, 'paused')}>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause Relationship
                            </DropdownMenuItem>
                          )}
                          {relationship.status === 'paused' && (
                            <DropdownMenuItem onClick={() => handleChangeStatus(relationship, 'active')}>
                              <Play className="w-4 h-4 mr-2" />
                              Resume Relationship
                            </DropdownMenuItem>
                          )}
                          {relationship.status !== 'completed' && relationship.status !== 'rejected' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-foreground"
                                onClick={() => handleEndRelationship(relationship)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                End Relationship
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

      {/* View Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relationship Details</DialogTitle>
            <DialogDescription>
              View complete information about this mentorship relationship
            </DialogDescription>
          </DialogHeader>
          {selectedRelationship && (
            <div className="space-y-6">
              {/* Mentor Info */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-foreground">Mentor</h4>
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedRelationship.mentor.avatar || ''} />
                    <AvatarFallback>
                      {selectedRelationship.mentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{selectedRelationship.mentor.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRelationship.mentor.email}</p>
                    {(selectedRelationship.mentor.jobTitle || selectedRelationship.mentor.company) && (
                      <p className="text-sm">
                        {selectedRelationship.mentor.jobTitle}
                        {selectedRelationship.mentor.jobTitle && selectedRelationship.mentor.company && ' @ '}
                        {selectedRelationship.mentor.company}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRelationship.mentor.city && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {selectedRelationship.mentor.city}
                        </Badge>
                      )}
                      {selectedRelationship.mentor.mbtiType && (
                        <Badge variant="outline" className="text-xs">
                          {selectedRelationship.mentor.mbtiType}
                        </Badge>
                      )}
                      {selectedRelationship.mentor.yearsExperience && (
                        <Badge variant="outline" className="text-xs">
                          {selectedRelationship.mentor.yearsExperience} years exp
                        </Badge>
                      )}
                    </div>
                    {selectedRelationship.mentor.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedRelationship.mentor.expertise.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mentee Info */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-foreground">Mentee</h4>
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedRelationship.mentee.avatar || ''} />
                    <AvatarFallback>
                      {selectedRelationship.mentee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{selectedRelationship.mentee.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRelationship.mentee.email}</p>
                    {(selectedRelationship.mentee.jobTitle || selectedRelationship.mentee.industry) && (
                      <p className="text-sm">
                        {selectedRelationship.mentee.jobTitle}
                        {selectedRelationship.mentee.jobTitle && selectedRelationship.mentee.industry && ' in '}
                        {selectedRelationship.mentee.industry}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRelationship.mentee.city && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {selectedRelationship.mentee.city}
                        </Badge>
                      )}
                      {selectedRelationship.mentee.mbtiType && (
                        <Badge variant="outline" className="text-xs">
                          {selectedRelationship.mentee.mbtiType}
                        </Badge>
                      )}
                      {selectedRelationship.mentee.careerStage && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {selectedRelationship.mentee.careerStage.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                    {selectedRelationship.mentee.learningGoals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedRelationship.mentee.learningGoals.map((goal, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{goal}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Relationship Stats */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Relationship Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedRelationship.status)}</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={selectedRelationship.progress} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{selectedRelationship.progress}%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Sessions</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedRelationship.sessionsCompleted} / {selectedRelationship.totalSessions}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Satisfaction</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedRelationship.satisfactionScore ?? 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedRelationship.startedAt
                        ? new Date(selectedRelationship.startedAt).toLocaleDateString()
                        : 'Not started'}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Meeting Frequency</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedRelationship.meetingFrequency || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Goals */}
              {selectedRelationship.goals.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3">Relationship Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRelationship.goals.map((goal, i) => (
                      <Badge key={i} variant="outline">{goal}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newStatus === 'paused' ? 'Pause Relationship' : 'Resume Relationship'}
            </DialogTitle>
            <DialogDescription>
              {newStatus === 'paused'
                ? 'This will temporarily pause the mentorship relationship. Both parties will be notified.'
                : 'This will resume the mentorship relationship. Both parties will be notified.'}
            </DialogDescription>
          </DialogHeader>
          {selectedRelationship && (
            <div className="py-4">
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{selectedRelationship.mentor.name}</p>
                  <p className="text-sm text-muted-foreground">Mentor</p>
                </div>
                <span className="text-muted-foreground">↔</span>
                <div className="flex-1 text-right">
                  <p className="font-medium">{selectedRelationship.mentee.name}</p>
                  <p className="text-sm text-muted-foreground">Mentee</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={processing}>
              {processing ? 'Processing...' : newStatus === 'paused' ? 'Pause' : 'Resume'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Relationship Dialog */}
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Relationship</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this mentorship relationship? This action will mark it as completed.
            </DialogDescription>
          </DialogHeader>
          {selectedRelationship && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{selectedRelationship.mentor.name}</p>
                  <p className="text-sm text-muted-foreground">Mentor</p>
                </div>
                <span className="text-muted-foreground">↔</span>
                <div className="flex-1 text-right">
                  <p className="font-medium">{selectedRelationship.mentee.name}</p>
                  <p className="text-sm text-muted-foreground">Mentee</p>
                </div>
              </div>
              <div>
                <Label htmlFor="end-reason">Reason (optional)</Label>
                <Textarea
                  id="end-reason"
                  placeholder="Enter a reason for ending this relationship..."
                  value={endReason}
                  onChange={(e) => setEndReason(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmEndRelationship} disabled={processing}>
              {processing ? 'Processing...' : 'End Relationship'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
