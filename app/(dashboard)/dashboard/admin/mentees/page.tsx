'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  UserCheck,
  UserX,
  FileText,
  MapPin,
  Briefcase,
  Brain,
} from 'lucide-react';

interface MenteeApplication {
  id: number;
  userId: number | null;
  isPublicApplication: boolean;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  bio: string;
  city: string;
  currentStage: string;
  currentJobTitle: string;
  currentIndustry: string;
  longTermGoals: string;
  shortTermGoals: string;
  whyMentor: string;
  programExpectations: string;
  mbtiType: string | null;
  submittedAt: string;
  reviewedAt?: string;
  programmeId: number | null;
  programmeName: string | null;
  reviewNotes: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
}

interface Stats {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'default' },
  under_review: { label: 'Under Review', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'outline' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

export default function MenteeApplicationsPage() {
  const [applications, setApplications] = useState<MenteeApplication[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, underReview: 0, approved: 0, rejected: 0 });
  const [programmeBreakdown, setProgrammeBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [programmeFilter, setProgrammeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (programmeFilter !== 'all') params.set('programmeId', programmeFilter);

      const response = await fetch(`/api/admin/mentees/applications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        setStats(data.stats || { pending: 0, underReview: 0, approved: 0, rejected: 0 });
        setProgrammeBreakdown(data.programmeBreakdown || {});
      }
    } catch (error) {
      console.error('Failed to fetch mentee applications:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, programmeFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleReview = async (applicationId: number, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/mentees/applications/${applicationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: reviewNotes }),
      });

      if (response.ok) {
        setReviewingId(null);
        setReviewNotes('');
        fetchApplications();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to review application');
      }
    } catch (error) {
      console.error('Failed to review application:', error);
      alert('Failed to review application');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.user.name.toLowerCase().includes(q) ||
      app.user.email.toLowerCase().includes(q) ||
      app.city.toLowerCase().includes(q) ||
      app.currentJobTitle.toLowerCase().includes(q)
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mentee Applications</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Review and manage mentee programme applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('under_review')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                <p className="text-2xl font-bold">{stats.underReview}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('approved')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, city, or job title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={programmeFilter} onValueChange={setProgrammeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Programme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programmes</SelectItem>
            {Object.entries(programmeBreakdown).map(([name, count]) => (
              <SelectItem key={name} value={name}>
                {name} ({count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchApplications} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No applications found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map(app => {
            const isExpanded = expandedId === app.id;
            const isReviewing = reviewingId === app.id;
            const statusBadge = STATUS_BADGES[app.status] || STATUS_BADGES.pending;

            return (
              <Card key={app.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Summary Row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={app.user.image || undefined} alt={app.user.name} />
                      <AvatarFallback>{getInitials(app.user.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{app.user.name}</span>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        {app.programmeName && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {app.programmeName}
                          </Badge>
                        )}
                        {app.isPublicApplication && (
                          <Badge variant="outline" className="text-xs">Public</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                        <span>{app.user.email}</span>
                        {app.currentStage && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {app.currentStage}
                          </span>
                        )}
                        {app.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {app.city}
                          </span>
                        )}
                        {app.mbtiType && (
                          <span className="flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            {app.mbtiType}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground hidden md:block">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {app.currentJobTitle && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Job Title</p>
                            <p className="text-sm">{app.currentJobTitle}</p>
                          </div>
                        )}
                        {app.currentIndustry && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Industry</p>
                            <p className="text-sm">{app.currentIndustry}</p>
                          </div>
                        )}
                      </div>

                      {app.bio && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Bio</p>
                          <p className="text-sm whitespace-pre-wrap">{app.bio}</p>
                        </div>
                      )}

                      {app.longTermGoals && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Long-term Goals</p>
                          <p className="text-sm whitespace-pre-wrap">{app.longTermGoals}</p>
                        </div>
                      )}

                      {app.shortTermGoals && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Short-term Goals</p>
                          <p className="text-sm whitespace-pre-wrap">{app.shortTermGoals}</p>
                        </div>
                      )}

                      {app.whyMentor && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Why a Mentor?</p>
                          <p className="text-sm whitespace-pre-wrap">{app.whyMentor}</p>
                        </div>
                      )}

                      {app.programExpectations && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Program Expectations</p>
                          <p className="text-sm whitespace-pre-wrap">{app.programExpectations}</p>
                        </div>
                      )}

                      {app.reviewNotes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Review Notes</p>
                          <p className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">{app.reviewNotes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {app.status === 'pending' && (
                        <div className="border-t pt-4">
                          {isReviewing ? (
                            <div className="space-y-3">
                              <Textarea
                                placeholder="Review notes (optional)..."
                                value={reviewNotes}
                                onChange={e => setReviewNotes(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleReview(app.id, 'approve')}
                                  disabled={actionLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReview(app.id, 'reject')}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                                  Reject
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                                  disabled={actionLoading}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button onClick={() => setReviewingId(app.id)}>
                              Review Application
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
