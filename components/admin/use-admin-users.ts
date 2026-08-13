'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, isApiError } from '@/lib/api/client';
import { downloadCsv, toCsv } from '@/lib/export/csv';
import type { AdminUsersResponse, AdminUserStats, UnifiedUser } from '@/types/admin';

/** Rows per page; also drives the "showing X to Y" line. */
export const ADMIN_USERS_PAGE_SIZE = 10;

export type BulkAction = 'export' | 'suspend' | 'delete';

/**
 * Owns every server interaction behind the admin user table: the list query
 * and its filters, pagination, per-row mutations and the bulk operations.
 * Dialog visibility stays with the component — this hook only reports whether
 * an operation succeeded, so the caller can decide what to close.
 */
export function useAdminUsers() {
  // Read URL search params for initial filter values
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') || 'all';
  const initialStatus = searchParams.get('status') || 'all';
  const initialMembership = searchParams.get('membership') || 'all';
  const initialApplication = searchParams.get('application') || 'all';
  const initialUserType = searchParams.get('userType') || 'all';

  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(initialRole);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [membershipFilter, setMembershipFilter] = useState<string>(initialMembership);
  const [applicationFilter, setApplicationFilter] = useState<string>(initialApplication);
  const [userTypeFilter, setUserTypeFilter] = useState<string>(initialUserType);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [togglingTestUser, setTogglingTestUser] = useState<number | null>(null);
  const [verifyingEmail, setVerifyingEmail] = useState<number | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ADMIN_USERS_PAGE_SIZE.toString(),
        sortBy,
        sortOrder,
      });

      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (membershipFilter !== 'all') params.append('membership', membershipFilter);
      if (applicationFilter !== 'all') params.append('application', applicationFilter);
      if (userTypeFilter !== 'all') params.append('userType', userTypeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const data = await apiGet<AdminUsersResponse>(`/api/admin/users?${params}`);

      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // A non-2xx used to fall through the old `if (response.ok)` silently,
      // leaving the previous page on screen; only a transport failure cleared
      // the table. Preserved rather than "fixed" — that is a UX call, not this
      // change's business.
      if (!isApiError(error)) {
        setUsers([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, statusFilter, membershipFilter, applicationFilter, userTypeFilter, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sync URL params to state when they change
  useEffect(() => {
    const urlRole = searchParams.get('role') || 'all';
    const urlStatus = searchParams.get('status') || 'all';
    const urlMembership = searchParams.get('membership') || 'all';
    const urlApplication = searchParams.get('application') || 'all';

    const urlUserType = searchParams.get('userType') || 'all';

    if (urlRole !== roleFilter) setRoleFilter(urlRole);
    if (urlStatus !== statusFilter) setStatusFilter(urlStatus);
    if (urlMembership !== membershipFilter) setMembershipFilter(urlMembership);
    if (urlApplication !== applicationFilter) setApplicationFilter(urlApplication);
    if (urlUserType !== userTypeFilter) setUserTypeFilter(urlUserType);
  }, [searchParams]);

  // Handle role toggle
  const handleRoleToggle = async (userId: number, roleType: string, currentlyHasRole: boolean) => {
    setUpdatingRole(`${userId}-${roleType}`);
    try {
      await apiPut('/api/admin/users/roles', { userId, roleType, isActive: !currentlyHasRole });

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
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setUpdatingRole(null);
    }
  };

  // Handle toggle test user status
  const handleToggleTestUser = async (user: UnifiedUser) => {
    setTogglingTestUser(user.id);
    try {
      const data = await apiPatch<{ isTestUser: boolean }>(`/api/admin/users/${user.id}`, {
        action: 'toggle_test_user',
      });

      setUsers(prev => prev.map(u => {
        if (u.id === user.id) {
          return { ...u, isTestUser: data.isTestUser };
        }
        return u;
      }));
      // Refresh to update stats
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle test user status:', error);
    } finally {
      setTogglingTestUser(null);
    }
  };

  // Handle verify email
  const handleVerifyEmail = async (user: UnifiedUser) => {
    setVerifyingEmail(user.id);
    try {
      await apiPatch(`/api/admin/users/${user.id}`, { action: 'verify_email' });

      setUsers(prev => prev.map(u => {
        if (u.id === user.id) {
          return { ...u, emailVerifiedAt: new Date().toISOString() };
        }
        return u;
      }));
      fetchUsers();
    } catch (error) {
      console.error('Failed to verify email:', error);
    } finally {
      setVerifyingEmail(null);
    }
  };

  /**
   * Approves or rejects an application. Returns true when the review landed,
   * which is the caller's cue to close the dialog.
   */
  const submitReview = async (
    user: UnifiedUser,
    action: 'approve' | 'reject',
    notes: string,
    isTestUser: boolean
  ): Promise<boolean> => {
    if (!user.applicationInfo) return false;

    setSubmittingReview(true);
    try {
      const appType = user.applicationInfo.type === 'mentee' ? 'mentees' : 'mentors';
      await apiPost(`/api/admin/${appType}/applications/${user.applicationInfo.id}/review`, {
        action,
        notes,
        ...(action === 'approve' && isTestUser ? { isTestUser: true } : {}),
      });

      fetchUsers(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Failed to process application:', error);
      // This has always read `.message` off the body, and these routes return
      // `{ error }` — so the fallback is what the admin actually sees. Reading
      // `error.message` here instead would be a UX change, not a refactor.
      const bodyMessage = isApiError(error)
        ? (error.body as { message?: string } | null)?.message
        : undefined;
      alert(bodyMessage || 'Failed to process application');
      return false;
    } finally {
      setSubmittingReview(false);
    }
  };

  /** Saves the editable user fields. Returns true when the save landed. */
  const saveUser = async (userId: number, data: { name: string; phone: string }): Promise<boolean> => {
    setSavingEdit(true);
    try {
      await apiPatch(`/api/admin/users/${userId}`, {
        name: data.name,
        phone: data.phone,
      });

      fetchUsers();
      return true;
    } catch (error) {
      if (isApiError(error)) {
        alert(error.message || 'Failed to update user');
      } else {
        console.error('Edit user error:', error);
        alert('An error occurred while updating user');
      }
      return false;
    } finally {
      setSavingEdit(false);
    }
  };

  /** Suspends or deletes one user. Returns true when the action landed. */
  const runUserAction = async (
    user: UnifiedUser,
    actionType: 'suspend' | 'delete'
  ): Promise<boolean> => {
    setProcessingAction(true);
    try {
      if (actionType === 'suspend') {
        try {
          await apiPatch(`/api/admin/users/${user.id}`, { action: 'suspend' });
          fetchUsers();
          return true;
        } catch (error) {
          if (!isApiError(error)) throw error;
          alert(error.message || 'Failed to suspend user');
          return false;
        }
      }

      try {
        await apiDelete(`/api/admin/users/${user.id}`);
        fetchUsers();
        return true;
      } catch (error) {
        if (!isApiError(error)) throw error;
        alert(error.message || 'Failed to delete user');
        return false;
      }
    } catch (error) {
      console.error('User action error:', error);
      alert('An error occurred');
      return false;
    } finally {
      setProcessingAction(false);
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

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedUsers.length === 0) return;

    setBulkActionLoading(true);
    try {
      switch (action) {
        case 'export': {
          try {
            const result = await apiPost<{ data: Record<string, unknown>[] }>('/api/admin/users/bulk', {
              action: 'export',
              recordIds: selectedUsers,
            });

            // Create CSV and download
            downloadCsv(
              `users_export_${new Date().toISOString().split('T')[0]}.csv`,
              toCsv(result.data)
            );
          } catch (error) {
            // A failed export has always been silent here (no `else` branch on
            // the old `response.ok`). Left silent; making it speak is a UX
            // change for a separate PR.
            if (!isApiError(error)) throw error;
            console.error('Bulk export failed:', error);
          }
          break;
        }
        case 'suspend': {
          if (!confirm(`Are you sure you want to suspend ${selectedUsers.length} user(s)?`)) {
            break;
          }
          try {
            const result = await apiPost<{ message: string }>('/api/admin/users/bulk', {
              action: 'suspend',
              recordIds: selectedUsers,
            });
            alert(result.message);
            fetchUsers();
            setSelectedUsers([]);
          } catch (error) {
            if (!isApiError(error)) throw error;
            alert(error.message || 'Failed to suspend users');
          }
          break;
        }
        case 'delete': {
          if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
            break;
          }
          try {
            const result = await apiPost<{ message: string }>('/api/admin/users/bulk', {
              action: 'delete',
              recordIds: selectedUsers,
            });
            alert(result.message);
            fetchUsers();
            setSelectedUsers([]);
          } catch (error) {
            if (!isApiError(error)) throw error;
            alert(error.message || 'Failed to delete users');
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

  return {
    // List state
    users,
    stats,
    loading,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    itemsPerPage: ADMIN_USERS_PAGE_SIZE,
    fetchUsers,

    // Filters
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    membershipFilter,
    setMembershipFilter,
    applicationFilter,
    setApplicationFilter,
    userTypeFilter,
    setUserTypeFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Selection + bulk operations
    selectedUsers,
    setSelectedUsers,
    handleSelectAll,
    handleSelectUser,
    handleBulkAction,
    bulkActionLoading,

    // Per-row mutations
    handleRoleToggle,
    updatingRole,
    handleToggleTestUser,
    togglingTestUser,
    handleVerifyEmail,
    verifyingEmail,

    // Dialog-backed mutations
    submitReview,
    submittingReview,
    saveUser,
    savingEdit,
    runUserAction,
    processingAction,
  };
}
