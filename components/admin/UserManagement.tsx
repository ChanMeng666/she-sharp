'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  MoreVertical,
  UserX,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Shield,
  Eye,
  MapPin,
  Briefcase,
  GraduationCap,
  CheckCircle,
  Clock,
  Brain,
  Users,
  Star,
  MessageSquare,
  Ban,
  RefreshCw,
  UserPlus,
  Link as LinkIcon,
  Check,
  X,
  Phone,
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Unified User interface matching the new API response
interface MentorInfo {
  isVerified: boolean;
  verifiedAt: string | null;
  isAccepting: boolean;
  maxMentees: number;
  currentMentees: number;
  yearsExperience: number | null;
  expertise: string[];
  bio: string | null;
  linkedinUrl: string | null;
  activeMentees: number;
  totalMentees: number;
  totalSessions: number;
  avgRating: number | null;
  status: 'active' | 'busy' | 'paused';
}

interface MenteeInfo {
  careerStage: string | null;
  currentIndustry: string | null;
  learningGoals: string[];
  bio: string | null;
}

interface ApplicationInfo {
  id: number;
  type: 'mentor' | 'mentee';
  status: 'pending' | 'under_review';
  submittedAt: string | null;
  yearsExperience?: number;
  expertise?: string[];
  availabilityHoursPerMonth?: number;
  bio?: string;
  linkedinUrl?: string;
  reviewNotes?: string;
  maxMentees?: number;
}

interface UnifiedUser {
  id: number;
  recordType: 'registered_user' | 'public_application';
  recordId: string;
  userId: number | null;
  applicationId: number | null;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  roles: string[];
  membershipTier: 'free' | 'basic' | 'premium';
  accountStatus: 'active' | 'inactive' | 'suspended' | 'pending_registration';
  createdAt: string;
  lastLoginAt: string | null;
  company: string | null;
  jobTitle: string | null;
  city: string | null;
  mbtiType: string | null;
  applicationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  applicationInfo: ApplicationInfo | null;
  mentorInfo: MentorInfo | null;
  menteeInfo: MenteeInfo | null;
}

interface Stats {
  totalUsers: number;
  totalPublicApplications: number;
  pendingApplications: number;
  byRole: { admin: number; mentor: number; mentee: number };
  byStatus: { active: number; inactive: number; suspended: number; pending_registration: number };
}

export default function UserManagement() {
  // Read URL search params for initial filter values
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') || 'all';
  const initialStatus = searchParams.get('status') || 'all';
  const initialMembership = searchParams.get('membership') || 'all';
  const initialApplication = searchParams.get('application') || 'all';

  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(initialRole);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [membershipFilter, setMembershipFilter] = useState<string>(initialMembership);
  const [applicationFilter, setApplicationFilter] = useState<string>(initialApplication);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewingUser, setReviewingUser] = useState<UnifiedUser | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // User action dialog state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'delete' | null>(null);
  const [actionUser, setActionUser] = useState<UnifiedUser | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Bulk action state
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Edit user dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UnifiedUser | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const itemsPerPage = 10;

  const fetchUsers = useCallback(async () => {
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
      if (applicationFilter !== 'all') params.append('application', applicationFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/users?${params}`);

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, statusFilter, membershipFilter, applicationFilter, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sync URL params to state when they change
  useEffect(() => {
    const urlRole = searchParams.get('role') || 'all';
    const urlStatus = searchParams.get('status') || 'all';
    const urlMembership = searchParams.get('membership') || 'all';
    const urlApplication = searchParams.get('application') || 'all';

    if (urlRole !== roleFilter) setRoleFilter(urlRole);
    if (urlStatus !== statusFilter) setStatusFilter(urlStatus);
    if (urlMembership !== membershipFilter) setMembershipFilter(urlMembership);
    if (urlApplication !== applicationFilter) setApplicationFilter(urlApplication);
  }, [searchParams]);

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
          if (user.id === userId && user.recordType === 'registered_user') {
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

  // Handle application review
  const openReviewDialog = (user: UnifiedUser, action: 'approve' | 'reject') => {
    setReviewingUser(user);
    setReviewAction(action);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewingUser?.applicationInfo) return;

    setSubmittingReview(true);
    try {
      const response = await fetch(`/api/admin/mentors/applications/${reviewingUser.applicationInfo.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes,
        }),
      });

      if (response.ok) {
        setReviewDialogOpen(false);
        fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to process application');
      }
    } catch (error) {
      console.error('Failed to process application:', error);
      alert('Failed to process application');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(u => u.recordId));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, recordId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== recordId));
    }
  };

  const toggleRowExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRows(newExpanded);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    setBulkActionLoading(true);
    try {
      switch (action) {
        case 'export': {
          const response = await fetch('/api/admin/users/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'export', recordIds: selectedUsers }),
          });

          if (response.ok) {
            const result = await response.json();
            // Create CSV and download
            const csvContent = convertToCSV(result.data);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
          }
          break;
        }
        case 'suspend': {
          if (!confirm(`Are you sure you want to suspend ${selectedUsers.length} user(s)?`)) {
            break;
          }
          const response = await fetch('/api/admin/users/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'suspend', recordIds: selectedUsers }),
          });

          if (response.ok) {
            const result = await response.json();
            alert(result.message);
            fetchUsers();
            setSelectedUsers([]);
          } else {
            const error = await response.json();
            alert(error.error || 'Failed to suspend users');
          }
          break;
        }
        case 'delete': {
          if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
            break;
          }
          const response = await fetch('/api/admin/users/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', recordIds: selectedUsers }),
          });

          if (response.ok) {
            const result = await response.json();
            alert(result.message);
            fetchUsers();
            setSelectedUsers([]);
          } else {
            const error = await response.json();
            alert(error.error || 'Failed to delete users');
          }
          break;
        }
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('An error occurred while performing the action');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Convert data to CSV format
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
      const values = headers.map(h => {
        const val = row[h];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  // Open user action dialog
  const openUserActionDialog = (user: UnifiedUser, action: 'suspend' | 'delete') => {
    setActionUser(user);
    setActionType(action);
    setActionDialogOpen(true);
  };

  // Open edit user dialog
  const openEditDialog = (user: UnifiedUser) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      phone: user.phone || '',
    });
    setEditDialogOpen(true);
  };

  // Handle edit user save
  const handleEditSave = async () => {
    if (!editingUser) return;

    setSavingEdit(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          phone: editFormData.phone,
        }),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Edit user error:', error);
      alert('An error occurred while updating user');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle individual user suspend/delete
  const handleUserAction = async () => {
    if (!actionUser || !actionType) return;

    setProcessingAction(true);
    try {
      if (actionType === 'suspend') {
        const response = await fetch(`/api/admin/users/${actionUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'suspend' }),
        });

        if (response.ok) {
          setActionDialogOpen(false);
          fetchUsers();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to suspend user');
        }
      } else if (actionType === 'delete') {
        const response = await fetch(`/api/admin/users/${actionUser.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setActionDialogOpen(false);
          fetchUsers();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to delete user');
        }
      }
    } catch (error) {
      console.error('User action error:', error);
      alert('An error occurred');
    } finally {
      setProcessingAction(false);
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
        return 'bg-[#1f1e44] text-white';
      case 'mentor':
        return 'bg-[#f7e5f3] text-[#9b2e83]';
      case 'mentee':
        return 'bg-[#f4f4fa] text-[#8982ff]';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getMembershipBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-[#9b2e83] text-white';
      case 'basic':
        return 'bg-[#eaf2ff] text-[#1378d1]';
      case 'free':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-[#effefb] text-[#1f1e44] text-xs"><CheckCircle className="w-3 h-3 mr-1 text-[#9b2e83]" />Active</Badge>;
      case 'inactive':
        return <Badge className="bg-muted text-muted-foreground text-xs">Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-[#d72f40]/10 text-[#d72f40] text-xs"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>;
      case 'pending_registration':
        return <Badge className="bg-[#eaf2ff] text-[#1378d1] text-xs"><UserPlus className="w-3 h-3 mr-1" />Pending Registration</Badge>;
      default:
        return null;
    }
  };

  const getApplicationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-[#effefb] text-[#1f1e44] text-xs"><CheckCircle className="w-3 h-3 mr-1 text-[#9b2e83]" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-[#eaf2ff] text-[#1378d1] text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-[#d72f40]/10 text-[#d72f40] text-xs"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const getMentorStatusBadge = (status: string) => {
    const variants = {
      active: { text: 'Active', className: 'bg-[#effefb] text-[#1f1e44]', icon: <CheckCircle className="w-3 h-3 mr-1 text-[#9b2e83]" /> },
      busy: { text: 'Busy', className: 'bg-[#f7e5f3] text-[#9b2e83]', icon: <Clock className="w-3 h-3 mr-1" /> },
      paused: { text: 'Paused', className: 'bg-muted text-muted-foreground', icon: null },
    };
    const variant = variants[status as keyof typeof variants] || variants.paused;
    return <Badge className={cn("text-xs", variant.className)}>{variant.icon}{variant.text}</Badge>;
  };

  // Render expanded row content
  const renderExpandedContent = (user: UnifiedUser) => (
    <TableRow className="bg-muted/30">
      <TableCell colSpan={8} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-[#9b2e83] uppercase tracking-wide flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Profile Details
            </h4>

            {(user.mentorInfo?.bio || user.menteeInfo?.bio || user.applicationInfo?.bio) && (
              <div>
                <p className="text-xs text-[#1f1e44] font-medium mb-1">Bio</p>
                <p className="text-sm line-clamp-3">
                  {user.mentorInfo?.bio || user.menteeInfo?.bio || user.applicationInfo?.bio}
                </p>
              </div>
            )}

            {(user.mentorInfo?.expertise || user.applicationInfo?.expertise) && (
              <div>
                <p className="text-xs text-[#8982ff] font-medium mb-1">Expertise</p>
                <div className="flex flex-wrap gap-1">
                  {(user.mentorInfo?.expertise || user.applicationInfo?.expertise || []).map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-[#f4f4fa] text-[#8982ff]">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {(user.mentorInfo?.linkedinUrl || user.applicationInfo?.linkedinUrl) && (
              <div className="flex items-center gap-2 text-sm">
                <LinkIcon className="w-3 h-3 text-[#1378d1]" />
                <a
                  href={user.mentorInfo?.linkedinUrl || user.applicationInfo?.linkedinUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1378d1] hover:underline truncate"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}

            {user.applicationInfo && (
              <div className="pt-2 border-t">
                <p className="text-xs text-[#1378d1] font-medium mb-1">Application ({user.applicationInfo.type})</p>
                <div className="space-y-1 text-sm">
                  <p>Status: <Badge variant="outline" className="ml-1 text-xs">{user.applicationInfo.status}</Badge></p>
                  {user.applicationInfo.submittedAt && (
                    <p className="text-muted-foreground text-xs">
                      Submitted: {new Date(user.applicationInfo.submittedAt).toLocaleDateString()}
                    </p>
                  )}
                  {user.applicationInfo.availabilityHoursPerMonth && (
                    <p className="text-muted-foreground text-xs">
                      Availability: {user.applicationInfo.availabilityHoursPerMonth}h/month
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Metrics & Activity */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-[#1f1e44] uppercase tracking-wide flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Metrics & Activity
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Joined</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Active</span>
                <span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>

            {user.mentorInfo && user.mentorInfo.isVerified && (
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs text-[#9b2e83] font-medium mb-1">Mentor Metrics</p>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-[#9b2e83] fill-[#9b2e83]" />
                  <span className="font-medium">{user.mentorInfo.avgRating?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 text-[#8982ff]" />
                  <span>{user.mentorInfo.activeMentees} active / {user.mentorInfo.totalMentees} total mentees</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4 text-[#1378d1]" />
                  <span>{user.mentorInfo.totalSessions} sessions</span>
                </div>
              </div>
            )}

            {user.menteeInfo && (
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs text-[#8982ff] font-medium mb-1">Mentee Info</p>
                {user.menteeInfo.careerStage && (
                  <p className="text-sm">Career Stage: <span className="capitalize">{user.menteeInfo.careerStage.replace(/_/g, ' ')}</span></p>
                )}
                {user.menteeInfo.currentIndustry && (
                  <p className="text-sm text-muted-foreground">Industry: {user.menteeInfo.currentIndustry}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Stats Summary */}
        {stats && (
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1f1e44]" />
              <span className="text-[#1f1e44] font-medium">Total Users</span>
              <span className="font-bold text-lg">{stats.totalUsers}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1378d1]" />
              <span className="text-[#1378d1] font-medium">Pending Applications</span>
              <span className="font-bold text-lg">{stats.pendingApplications}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#9b2e83]" />
              <span className="text-[#9b2e83] font-medium">Mentors</span>
              <span className="font-bold text-lg">{stats.byRole.mentor}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#8982ff]" />
              <span className="text-[#8982ff] font-medium">Mentees</span>
              <span className="font-bold text-lg">{stats.byRole.mentee}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1f1e44]" />
              <span className="text-[#1f1e44] font-medium">Admins</span>
              <span className="font-bold text-lg">{stats.byRole.admin}</span>
            </div>
          </div>
        )}

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage all users, roles, and applications in one place
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => fetchUsers()}>
                  <RefreshCw className={cn("w-4 h-4 mr-1", loading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
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

              <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:gap-2 gap-2">
                <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full lg:w-32">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="mentee">Mentee</SelectItem>
                    <SelectItem value="no_role">No Role</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending_registration">Pending Registration</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={membershipFilter} onValueChange={(v) => { setMembershipFilter(v); setCurrentPage(1); }}>
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

                <Select value={applicationFilter} onValueChange={(v) => { setApplicationFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Application" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="has_pending">Has Pending</SelectItem>
                    <SelectItem value="no_application">No Application</SelectItem>
                  </SelectContent>
                </Select>
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
                    disabled={bulkActionLoading}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction('suspend')}
                    disabled={bulkActionLoading}
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    {bulkActionLoading ? 'Processing...' : 'Suspend'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    disabled={bulkActionLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUsers([])}
                    disabled={bulkActionLoading}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching your criteria</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-3">
                  {users.map((user) => (
                    <Card key={user.recordId} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1">
                          <Checkbox
                            checked={selectedUsers.includes(user.recordId)}
                            onCheckedChange={(checked) => handleSelectUser(user.recordId, checked as boolean)}
                          />
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                            <AvatarFallback className="bg-muted text-foreground">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">{user.name || 'Unknown User'}</p>
                              {user.recordType === 'public_application' && (
                                <Badge className="bg-muted text-foreground text-xs">
                                  <UserPlus className="w-3 h-3 mr-1" />
                                  Pending Reg
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            {(user.jobTitle || user.company) && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {user.jobTitle}{user.jobTitle && user.company ? ' @ ' : ''}{user.company}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => toggleRowExpansion(user.recordId)}>
                          {expandedRows.has(user.recordId) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[#9b2e83] font-medium flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Roles:
                          </span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {user.roles.length > 0 ? user.roles.map((role) => (
                              <Badge key={role} variant="secondary" className={cn('text-xs', getRoleBadgeColor(role))}>
                                {role}
                              </Badge>
                            )) : <span className="text-xs text-muted-foreground">None</span>}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#1f1e44] font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Status:
                          </span>
                          {getStatusBadge(user.accountStatus)}
                        </div>

                        {user.applicationStatus === 'pending' && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#1378d1] font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Application:
                            </span>
                            {getApplicationBadge(user.applicationStatus)}
                          </div>
                        )}
                      </div>

                      {expandedRows.has(user.recordId) && (
                        <div className="mt-4 pt-4 border-t">
                          {/* Simplified mobile expanded content */}
                          <div className="space-y-3">
                            {user.applicationStatus === 'pending' && user.applicationInfo && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="flex-1"
                                  onClick={() => openReviewDialog(user, 'approve')}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => openReviewDialog(user, 'reject')}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.length === users.length && users.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Membership</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <React.Fragment key={user.recordId}>
                          <TableRow className={cn(expandedRows.has(user.recordId) && "border-b-0")}>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleRowExpansion(user.recordId)}>
                                {expandedRows.has(user.recordId) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.includes(user.recordId)}
                                onCheckedChange={(checked) => handleSelectUser(user.recordId, checked as boolean)}
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
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground">{user.name || 'Unknown User'}</p>
                                    {user.recordType === 'public_application' && (
                                      <Badge className="bg-muted text-foreground text-xs">
                                        <UserPlus className="w-3 h-3 mr-1" />
                                        Pending Reg
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  {(user.jobTitle || user.company) && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {user.jobTitle}{user.jobTitle && user.company ? ' @ ' : ''}{user.company}
                                    </p>
                                  )}
                                  {(user.city || user.mbtiType) && (
                                    <div className="flex items-center gap-2 mt-1">
                                      {user.city && (
                                        <span className="flex items-center gap-0.5 text-xs text-[#1378d1]">
                                          <MapPin className="w-3 h-3" />
                                          {user.city}
                                        </span>
                                      )}
                                      {user.mbtiType && (
                                        <Badge className="text-xs px-1.5 py-0 bg-[#f4f4fa] text-[#8982ff] border border-[#8982ff]/30">
                                          <Brain className="w-2.5 h-2.5 mr-0.5" />
                                          {user.mbtiType}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.roles.length > 0 ? user.roles.map((role) => (
                                  <Badge key={role} variant="secondary" className={cn('text-xs', getRoleBadgeColor(role))}>
                                    {role}
                                  </Badge>
                                )) : <span className="text-xs text-muted-foreground">None</span>}
                              </div>
                              {user.mentorInfo?.isVerified && (
                                <div className="mt-1">
                                  {getMentorStatusBadge(user.mentorInfo.status)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {getStatusBadge(user.accountStatus)}
                                {user.applicationStatus === 'pending' && getApplicationBadge(user.applicationStatus)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={cn('text-xs', getMembershipBadgeColor(user.membershipTier))}>
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
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => toggleRowExpansion(user.recordId)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {user.recordType === 'registered_user' && (
                                    <>
                                      <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit User
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <Shield className="w-4 h-4 mr-2" />
                                          Manage Roles
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          {(['admin', 'mentor', 'mentee'] as const).map((roleType) => {
                                            const hasRole = user.roles.includes(roleType);
                                            const isUpdating = updatingRole === `${user.id}-${roleType}`;
                                            return (
                                              <div
                                                key={roleType}
                                                className="flex items-center justify-between px-2 py-1.5"
                                              >
                                                <span className="capitalize text-sm">{roleType}</span>
                                                <Switch
                                                  checked={hasRole}
                                                  disabled={isUpdating}
                                                  onCheckedChange={() => handleRoleToggle(user.id, roleType, hasRole)}
                                                />
                                              </div>
                                            );
                                          })}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                    </>
                                  )}
                                  {user.applicationStatus === 'pending' && user.applicationInfo && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openReviewDialog(user, 'approve')}
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        Approve Application
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => openReviewDialog(user, 'reject')}
                                      >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject Application
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {user.recordType === 'registered_user' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openUserActionDialog(user, 'suspend')}
                                      >
                                        <Ban className="w-4 h-4 mr-2" />
                                        Suspend Account
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => openUserActionDialog(user, 'delete')}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          {expandedRows.has(user.recordId) && renderExpandedContent(user)}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
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
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-8 h-8 p-0",
                              currentPage === page && "bg-muted font-semibold"
                            )}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && <span className="px-2">...</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewAction === 'approve' ? 'Approve Application' : 'Reject Application'}
              </DialogTitle>
              <DialogDescription>
                {reviewAction === 'approve'
                  ? `Are you sure you want to approve ${reviewingUser?.name || 'this user'}'s mentor application?`
                  : `Are you sure you want to reject ${reviewingUser?.name || 'this user'}'s mentor application?`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="review-notes" className={cn(
                  "flex items-center gap-2",
                  reviewAction === 'approve' ? "text-[#9b2e83]" : "text-[#d72f40]"
                )}>
                  {reviewAction === 'approve' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {reviewAction === 'approve' ? 'Notes (optional)' : 'Reason for rejection (required)'}
                </Label>
                <Textarea
                  id="review-notes"
                  placeholder={reviewAction === 'approve'
                    ? 'Add any notes about this approval...'
                    : 'Please provide a reason for rejecting this application...'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReviewSubmit}
                disabled={submittingReview || (reviewAction === 'reject' && !reviewNotes.trim())}
                variant={reviewAction === 'reject' ? 'destructive' : 'default'}
              >
                {submittingReview ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Action Confirmation Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'suspend' ? 'Suspend User' : 'Delete User'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'suspend'
                  ? `Are you sure you want to suspend ${actionUser?.name || 'this user'}? They will no longer be able to access their account.`
                  : `Are you sure you want to delete ${actionUser?.name || 'this user'}? This action cannot be undone.`
                }
              </DialogDescription>
            </DialogHeader>
            {actionUser && (
              <div className="py-4">
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={actionUser.image || undefined} alt={actionUser.name || ''} />
                    <AvatarFallback>{getInitials(actionUser.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{actionUser.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{actionUser.email}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={processingAction}>
                Cancel
              </Button>
              <Button
                onClick={handleUserAction}
                disabled={processingAction}
                variant="destructive"
              >
                {processingAction
                  ? 'Processing...'
                  : actionType === 'suspend'
                    ? 'Suspend User'
                    : 'Delete User'
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information for {editingUser?.name || 'this user'}
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4 py-4">
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={editingUser.image || undefined} alt={editingUser.name || ''} />
                    <AvatarFallback>{getInitials(editingUser.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{editingUser.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-[#1f1e44] flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="User name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-[#8982ff] flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
