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
import {
  Search,
  Download,
  Mail,
  Star,
  Users,
  CheckCircle,
  Shield,
  Award,
  MessageSquare,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  MapPin,
  Brain,
  Building2,
  Clock,
  Briefcase
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface VerifiedMentor {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  company: string | null;
  jobTitle: string | null;
  expertiseAreas: string[];
  yearsExperience: number | null;
  bio: string | null;
  linkedinUrl: string | null;
  isAcceptingMentees: boolean;
  maxMentees: number;
  currentMenteesCount: number;
  verifiedAt: string;
  createdAt: string;
  activeMentees: number;
  totalMentees: number;
  totalSessions: number;
  avgRating: number | null;
  status: 'active' | 'busy' | 'paused';
  // Extended info from form submissions
  city: string | null;
  mbtiType: string | null;
  preferredIndustries: string[];
  communicationPreference: string | null;
  monthlyAvailability: number | null;
}

interface Stats {
  totalVerified: number;
  totalActive: number;
  totalSessions: number;
  avgRating: number;
}

interface ApiResponse {
  mentors: VerifiedMentor[];
  stats: Stats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function VerifiedMentorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mentors, setMentors] = useState<VerifiedMentor[]>([]);
  const [stats, setStats] = useState<Stats>({ totalVerified: 0, totalActive: 0, totalSessions: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch verified mentors
  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/mentors/verified?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch verified mentors');
      }
      const data: ApiResponse = await response.json();
      setMentors(data.mentors);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { text: 'Active', className: 'bg-green-100 text-green-800' },
      busy: { text: 'Busy', className: 'bg-yellow-100 text-yellow-800' },
      paused: { text: 'Paused', className: 'bg-accent text-foreground' },
    };
    const variant = variants[status as keyof typeof variants] || variants.paused;
    return <Badge className={variant.className}>{variant.text}</Badge>;
  };

  // Filter mentors
  const filteredMentors = mentors.filter(mentor => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      mentor.name.toLowerCase().includes(searchLower) ||
      mentor.email.toLowerCase().includes(searchLower) ||
      (mentor.company?.toLowerCase().includes(searchLower) ?? false) ||
      (mentor.city?.toLowerCase().includes(searchLower) ?? false) ||
      (mentor.preferredIndustries || []).some(ind => ind.toLowerCase().includes(searchLower)) ||
      (mentor.expertiseAreas || []).some(skill => skill.toLowerCase().includes(searchLower));
    const matchesStatus = statusFilter === 'all' || mentor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Verified Mentors</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage and monitor verified mentors in the program
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button variant="outline" onClick={fetchMentors} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Verified</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{stats.totalVerified}</p>
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Verified mentors</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Mentors</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-green-600">{stats.totalActive}</p>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.totalVerified > 0 ? Math.round((stats.totalActive / stats.totalVerified) * 100) : 0}% active rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{stats.avgRating || 'N/A'}</p>
                  <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">From mentee feedback</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{stats.totalSessions.toLocaleString()}</p>
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Completed meetings</p>
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
                placeholder="Search by name, email, or company..."
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
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mentors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mentor Directory</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${filteredMentors.length} verified mentors`}
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
            ) : filteredMentors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No verified mentors found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Expertise</TableHead>
                    <TableHead>Metrics</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMentors.map((mentor) => (
                    <TableRow key={mentor.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={mentor.avatar || ''} />
                            <AvatarFallback>
                              {mentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{mentor.name}</p>
                            <p className="text-sm text-muted-foreground">{mentor.jobTitle || 'Mentor'}</p>
                            <p className="text-xs text-muted-foreground">{mentor.company || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          {/* Location */}
                          {mentor.city && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{mentor.city}</span>
                            </div>
                          )}
                          {/* Industries */}
                          {mentor.preferredIndustries && mentor.preferredIndustries.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="w-3 h-3" />
                              <span>{mentor.preferredIndustries.slice(0, 2).join(', ')}</span>
                            </div>
                          )}
                          {/* MBTI */}
                          {mentor.mbtiType && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              <Brain className="w-2.5 h-2.5 mr-1" />
                              {mentor.mbtiType}
                            </Badge>
                          )}
                          {/* Availability */}
                          {mentor.monthlyAvailability && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{mentor.monthlyAvailability}h/month</span>
                            </div>
                          )}
                          {/* Contact */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{mentor.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(mentor.expertiseAreas || []).slice(0, 2).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {(mentor.expertiseAreas || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{mentor.expertiseAreas.length - 2}
                            </Badge>
                          )}
                          {(mentor.expertiseAreas || []).length === 0 && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {mentor.avgRating !== null && (
                            <div className="flex items-center space-x-2">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{mentor.avgRating}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">{mentor.activeMentees} active / {mentor.totalMentees} total</span>
                          </div>
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <MessageSquare className="w-3 h-3" />
                            <span className="text-xs">{mentor.totalSessions} sessions</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getStatusBadge(mentor.status)}
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Award className="w-3 h-3" />
                            <span>Since {new Date(mentor.verifiedAt).toLocaleDateString()}</span>
                          </div>
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
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend Mentor
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
