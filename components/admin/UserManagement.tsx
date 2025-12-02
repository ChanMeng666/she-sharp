'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  Download,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Shield,
  Eye,
  MapPin,
  Briefcase,
  Building2,
  GraduationCap,
  CheckCircle,
  Clock,
  Brain,
  Users,
  Star,
  MessageSquare,
  Award,
  Ban,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Verified Mentor interfaces
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
  city: string | null;
  mbtiType: string | null;
  preferredIndustries: string[];
  communicationPreference: string | null;
  monthlyAvailability: number | null;
}

interface MentorStats {
  totalVerified: number;
  totalActive: number;
  totalSessions: number;
  avgRating: number;
}

interface MentorInfo {
  isVerified: boolean;
  verifiedAt: string | null;
  isAccepting: boolean;
  maxMentees: number;
  currentMentees: number;
  yearsExperience: number | null;
  expertise: string[];
  bio: string | null;
}

interface MenteeInfo {
  careerStage: string | null;
  currentIndustry: string | null;
  learningGoals: string[];
  bio: string | null;
}

interface User {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  roles: string[];
  membershipTier: 'free' | 'basic' | 'premium';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt: string | null;
  // Extended info
  company: string | null;
  jobTitle: string | null;
  city: string | null;
  mbtiType: string | null;
  applicationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  mentorInfo: MentorInfo | null;
  menteeInfo: MenteeInfo | null;
}

// Role configuration
const roleConfig = {
  admin: { name: 'Admin', icon: Shield, color: 'bg-muted text-foreground' },
  mentor: { name: 'Mentor', icon: GraduationCap, color: 'bg-green-100 text-green-700' },
  mentee: { name: 'Mentee', icon: Users, color: 'bg-blue-100 text-blue-700' },
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users');

  // Verified Mentors state
  const [verifiedMentors, setVerifiedMentors] = useState<VerifiedMentor[]>([]);
  const [mentorStats, setMentorStats] = useState<MentorStats>({ totalVerified: 0, totalActive: 0, totalSessions: 0, avgRating: 0 });
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [mentorsError, setMentorsError] = useState<string | null>(null);
  const [mentorSearchQuery, setMentorSearchQuery] = useState('');
  const [mentorStatusFilter, setMentorStatusFilter] = useState('all');

  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter, membershipFilter, sortBy, sortOrder]);

  // Fetch verified mentors when tab changes
  const fetchVerifiedMentors = useCallback(async () => {
    setMentorsLoading(true);
    setMentorsError(null);
    try {
      const response = await fetch('/api/admin/mentors/verified?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch verified mentors');
      }
      const data = await response.json();
      setVerifiedMentors(data.mentors || []);
      setMentorStats(data.stats || { totalVerified: 0, totalActive: 0, totalSessions: 0, avgRating: 0 });
    } catch (err) {
      setMentorsError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setMentorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'mentors' && verifiedMentors.length === 0) {
      fetchVerifiedMentors();
    }
  }, [activeTab, verifiedMentors.length, fetchVerifiedMentors]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (membershipFilter !== 'all') params.append('membership', membershipFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/users?${params}`);

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Handle role toggle
  const handleRoleToggle = async (userId: number, roleType: string, currentlyHasRole: boolean) => {
    setUpdatingRole(`${userId}-${roleType}`);
    try {
      const response = await fetch('/api/admin/users/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleType, isActive: !currentlyHasRole }),
      });

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => {
          if (user.id === userId) {
            const newRoles = currentlyHasRole
              ? user.roles.filter(r => r !== roleType)
              : [...user.roles, roleType];
            return { ...user, roles: newRoles };
          }
          return user;
        }));
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    switch (action) {
      case 'export':
        console.log('Exporting users:', selectedUsers);
        break;
      case 'email':
        console.log('Sending email to:', selectedUsers);
        break;
      case 'suspend':
        console.log('Suspending users:', selectedUsers);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
          console.log('Deleting users:', selectedUsers);
        }
        break;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-muted text-foreground';
      case 'mentor':
        return 'bg-green-100 text-green-700';
      case 'mentee':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-accent text-foreground';
    }
  };

  const getMembershipBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-foreground text-background';
      case 'basic':
        return 'bg-muted text-foreground';
      case 'free':
        return 'bg-accent text-foreground';
      default:
        return 'bg-accent text-foreground';
    }
  };

  const getApplicationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>;
      default:
        return null;
    }
  };

  // Calculate role stats
  const roleStats = {
    admin: users.filter(u => u.roles.includes('admin')).length,
    mentor: users.filter(u => u.roles.includes('mentor')).length,
    mentee: users.filter(u => u.roles.includes('mentee')).length,
  };

  // Verified mentors helper functions
  const getMentorStatusBadge = (status: string) => {
    const variants = {
      active: { text: 'Active', className: 'bg-green-100 text-green-800' },
      busy: { text: 'Busy', className: 'bg-yellow-100 text-yellow-800' },
      paused: { text: 'Paused', className: 'bg-accent text-foreground' },
    };
    const variant = variants[status as keyof typeof variants] || variants.paused;
    return <Badge className={variant.className}>{variant.text}</Badge>;
  };

  // Filter verified mentors
  const filteredMentors = verifiedMentors.filter(mentor => {
    const searchLower = mentorSearchQuery.toLowerCase();
    const matchesSearch = mentorSearchQuery === '' ||
      mentor.name.toLowerCase().includes(searchLower) ||
      mentor.email.toLowerCase().includes(searchLower) ||
      (mentor.company?.toLowerCase().includes(searchLower) ?? false) ||
      (mentor.city?.toLowerCase().includes(searchLower) ?? false) ||
      (mentor.preferredIndustries || []).some(ind => ind.toLowerCase().includes(searchLower)) ||
      (mentor.expertiseAreas || []).some(skill => skill.toLowerCase().includes(searchLower));
    const matchesStatus = mentorStatusFilter === 'all' || mentor.status === mentorStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <TooltipProvider>
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="users">All Users</TabsTrigger>
        <TabsTrigger value="roles">Role Management</TabsTrigger>
        <TabsTrigger value="mentors">Verified Mentors</TabsTrigger>
      </TabsList>

      {/* All Users Tab */}
      <TabsContent value="users">
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>All Users</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedUsers.length > 0 && `${selectedUsers.length} selected`}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="search"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:gap-2 gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="mentee">Mentee</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={membershipFilter} onValueChange={setMembershipFilter}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="col-span-2 md:col-span-1">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium text-foreground">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('email')}
              >
                <Mail className="w-4 h-4 mr-1" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => handleBulkAction('suspend')}
              >
                <UserX className="w-4 h-4 mr-1" />
                Suspend
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                  />
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                    <AvatarFallback className="bg-muted text-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{user.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    {(user.jobTitle || user.company) && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {user.jobTitle}{user.jobTitle && user.company ? ' @ ' : ''}{user.company}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Shield className="w-4 h-4 mr-2" />
                      Manage Permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm">
                {/* Location and MBTI */}
                {(user.city || user.mbtiType) && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {user.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {user.city}
                      </span>
                    )}
                    {user.mbtiType && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {user.mbtiType}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Roles:</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className={cn('text-xs', getRoleBadgeColor(role))}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Application Status */}
                {user.applicationStatus !== 'none' && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Application:</span>
                    {getApplicationBadge(user.applicationStatus)}
                  </div>
                )}

                {/* Mentor Info */}
                {user.mentorInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mentor:</span>
                    <div className="flex items-center gap-1">
                      {user.mentorInfo.isVerified && (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      )}
                      <span className="text-xs">
                        {user.mentorInfo.currentMentees}/{user.mentorInfo.maxMentees} mentees
                      </span>
                    </div>
                  </div>
                )}

                {/* Mentee Info */}
                {user.menteeInfo && user.menteeInfo.careerStage && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Career Stage:</span>
                    <span className="text-xs capitalize">{user.menteeInfo.careerStage.replace(/_/g, ' ')}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Membership:</span>
                  <Badge
                    variant="secondary"
                    className={cn('text-xs', getMembershipBadgeColor(user.membershipTier))}
                  >
                    {user.membershipTier}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant={user.status === 'active' ? 'default' : 'secondary'}
                    className={cn(
                      'text-xs',
                      user.status === 'active' && 'bg-green-100 text-green-700',
                      user.status === 'inactive' && 'bg-accent text-foreground',
                      user.status === 'suspended' && 'bg-red-100 text-red-700'
                    )}
                  >
                    {user.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="text-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Active:</span>
                  <span className="text-foreground">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Roles & Status</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                        <AvatarFallback className="bg-muted text-foreground">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {(user.jobTitle || user.company) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {user.jobTitle}{user.jobTitle && user.company ? ' @ ' : ''}{user.company}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      {/* Location */}
                      {user.city && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{user.city}</span>
                        </div>
                      )}
                      {/* MBTI */}
                      {user.mbtiType && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          <Brain className="w-2.5 h-2.5 mr-1" />
                          {user.mbtiType}
                        </Badge>
                      )}
                      {/* Mentor Info */}
                      {user.mentorInfo && (
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 text-xs">
                              <GraduationCap className="w-3 h-3 text-purple-600" />
                              <span>
                                {user.mentorInfo.isVerified && <CheckCircle className="w-3 h-3 text-green-600 inline mr-1" />}
                                {user.mentorInfo.currentMentees}/{user.mentorInfo.maxMentees}
                              </span>
                              {user.mentorInfo.yearsExperience && (
                                <span className="text-muted-foreground">• {user.mentorInfo.yearsExperience}y</span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.mentorInfo.isVerified ? 'Verified Mentor' : 'Mentor'}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.mentorInfo.currentMentees} of {user.mentorInfo.maxMentees} mentees
                              {user.mentorInfo.yearsExperience && ` • ${user.mentorInfo.yearsExperience} years exp`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {/* Mentee Info */}
                      {user.menteeInfo && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Briefcase className="w-3 h-3 text-blue-600" />
                          <span className="capitalize">
                            {user.menteeInfo.careerStage?.replace(/_/g, ' ') || 'Mentee'}
                          </span>
                          {user.menteeInfo.currentIndustry && (
                            <span>• {user.menteeInfo.currentIndustry}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      {/* Roles */}
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="secondary"
                            className={cn('text-xs', getRoleBadgeColor(role))}
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                      {/* Application & Account Status */}
                      <div className="flex items-center gap-1">
                        {user.applicationStatus !== 'none' && getApplicationBadge(user.applicationStatus)}
                        <Badge
                          variant={user.status === 'active' ? 'default' : 'secondary'}
                          className={cn(
                            'text-xs',
                            user.status === 'active' && 'bg-green-100 text-green-700',
                            user.status === 'inactive' && 'bg-accent text-foreground',
                            user.status === 'suspended' && 'bg-red-100 text-red-700'
                          )}
                        >
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', getMembershipBadgeColor(user.membershipTier))}
                    >
                      {user.membershipTier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-0.5">
                      <p className="text-muted-foreground text-xs">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Active: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="w-4 h-4 mr-2" />
                          Manage Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, users.length * totalPages)} of{' '}
            {users.length * totalPages} users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
              {totalPages > 5 && <span className="px-2">...</span>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
      </TabsContent>

      {/* Role Management Tab */}
      <TabsContent value="roles">
        {/* Role Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(roleConfig).map(([roleId, config]) => {
            const Icon = config.icon;
            const count = roleStats[roleId as keyof typeof roleStats] || 0;

            return (
              <Card key={roleId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <CardTitle className="text-sm font-medium">{config.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className={config.color}>
                      {count} users
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Role Assignments</CardTitle>
            <CardDescription>
              Toggle roles for users. Changes are saved automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search for Role Management */}
            <div className="relative w-full mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="pl-10"
              />
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-center">Admin</TableHead>
                    <TableHead className="text-center">Mentor</TableHead>
                    <TableHead className="text-center">Mentee</TableHead>
                    <TableHead className="text-center">Active Roles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const activeRolesCount = user.roles.length;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                              <AvatarFallback className="bg-muted text-foreground text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.name || 'Unknown User'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        {(['admin', 'mentor', 'mentee'] as const).map((roleType) => {
                          const hasRole = user.roles.includes(roleType);
                          const isUpdating = updatingRole === `${user.id}-${roleType}`;

                          return (
                            <TableCell key={roleType} className="text-center">
                              <Switch
                                checked={hasRole}
                                disabled={isUpdating}
                                onCheckedChange={() => handleRoleToggle(user.id, roleType, hasRole)}
                              />
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              activeRolesCount > 0 ? "text-green-600 border-green-600" : "text-muted-foreground"
                            )}
                          >
                            {activeRolesCount}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Verified Mentors Tab */}
      <TabsContent value="mentors" className="space-y-6">
        {/* Error Message */}
        {mentorsError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>{mentorsError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Verified</CardTitle>
            </CardHeader>
            <CardContent>
              {mentorsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{mentorStats.totalVerified}</p>
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
              {mentorsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-green-600">{mentorStats.totalActive}</p>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {mentorStats.totalVerified > 0 ? Math.round((mentorStats.totalActive / mentorStats.totalVerified) * 100) : 0}% active rate
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
              {mentorsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{mentorStats.avgRating || 'N/A'}</p>
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
              {mentorsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{mentorStats.totalSessions.toLocaleString()}</p>
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
                  placeholder="Search by name, email, company, or expertise..."
                  value={mentorSearchQuery}
                  onChange={(e) => setMentorSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={mentorStatusFilter} onValueChange={setMentorStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchVerifiedMentors} disabled={mentorsLoading}>
                  <RefreshCw className={cn("w-4 h-4", mentorsLoading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mentors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mentor Directory</CardTitle>
            <CardDescription>
              {mentorsLoading ? 'Loading...' : `${filteredMentors.length} verified mentors`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {mentorsLoading ? (
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
                            {mentor.city && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>{mentor.city}</span>
                              </div>
                            )}
                            {mentor.preferredIndustries && mentor.preferredIndustries.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="w-3 h-3" />
                                <span>{mentor.preferredIndustries.slice(0, 2).join(', ')}</span>
                              </div>
                            )}
                            {mentor.mbtiType && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                <Brain className="w-2.5 h-2.5 mr-1" />
                                {mentor.mbtiType}
                              </Badge>
                            )}
                            {mentor.monthlyAvailability && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{mentor.monthlyAvailability}h/month</span>
                              </div>
                            )}
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
                            {getMentorStatusBadge(mentor.status)}
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
      </TabsContent>
    </Tabs>
    </TooltipProvider>
  );
}