'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FlaskConical,
  GraduationCap,
  RefreshCw,
  Shield,
  Star,
  Trash2,
  UserX,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { UnifiedUser } from '@/types/admin';
import { useAdminUsers } from './use-admin-users';
import { UserFilters } from './user-filters';
import { UserListCards } from './user-list-cards';
import { UserListTable } from './user-list-table';
import {
  EditUserDialog,
  ReviewApplicationDialog,
  UserActionDialog,
} from './user-dialogs';

export default function UserManagement() {
  const admin = useAdminUsers();
  const {
    users,
    stats,
    loading,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    fetchUsers,
    selectedUsers,
    setSelectedUsers,
    handleBulkAction,
    bulkActionLoading,
  } = admin;

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewingUser, setReviewingUser] = useState<UnifiedUser | null>(null);
  const [reviewIsTestUser, setReviewIsTestUser] = useState(false);

  // User action dialog state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'delete' | null>(null);
  const [actionUser, setActionUser] = useState<UnifiedUser | null>(null);

  // Edit user dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UnifiedUser | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '' });

  const toggleRowExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRows(newExpanded);
  };

  const openReviewDialog = (user: UnifiedUser, action: 'approve' | 'reject') => {
    setReviewingUser(user);
    setReviewAction(action);
    setReviewNotes('');
    setReviewIsTestUser(false);
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewingUser) return;
    const reviewed = await admin.submitReview(reviewingUser, reviewAction, reviewNotes, reviewIsTestUser);
    if (reviewed) setReviewDialogOpen(false);
  };

  const openUserActionDialog = (user: UnifiedUser, action: 'suspend' | 'delete') => {
    setActionUser(user);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const handleUserAction = async () => {
    if (!actionUser || !actionType) return;
    const done = await admin.runUserAction(actionUser, actionType);
    if (done) setActionDialogOpen(false);
  };

  const openEditDialog = (user: UnifiedUser) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      phone: user.phone || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    const saved = await admin.saveUser(editingUser.id, editFormData);
    if (saved) setEditDialogOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Stats Summary */}
        {stats && (
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-navy" />
              <span className="text-navy font-medium">Total Users</span>
              <span className="font-bold text-lg">{stats.totalUsers}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-info" />
              <span className="text-info font-medium">Pending Applications</span>
              <span className="font-bold text-lg">{stats.pendingApplications}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-brand" />
              <span className="text-brand font-medium">Mentors</span>
              <span className="font-bold text-lg">{stats.byRole.mentor}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-periwinkle" />
              <span className="text-periwinkle font-medium">Mentees</span>
              <span className="font-bold text-lg">{stats.byRole.mentee}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-navy" />
              <span className="text-navy font-medium">Admins</span>
              <span className="font-bold text-lg">{stats.byRole.admin}</span>
            </div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-orange-500" />
              <span className="text-orange-500 font-medium">Test Users</span>
              <span className="font-bold text-lg">{stats.testUsers}</span>
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
            <UserFilters
              searchQuery={admin.searchQuery}
              onSearchQueryChange={admin.setSearchQuery}
              onSearchSubmit={fetchUsers}
              roleFilter={admin.roleFilter}
              onRoleFilterChange={(v) => { admin.setRoleFilter(v); setCurrentPage(1); }}
              statusFilter={admin.statusFilter}
              onStatusFilterChange={(v) => { admin.setStatusFilter(v); setCurrentPage(1); }}
              membershipFilter={admin.membershipFilter}
              onMembershipFilterChange={(v) => { admin.setMembershipFilter(v); setCurrentPage(1); }}
              applicationFilter={admin.applicationFilter}
              onApplicationFilterChange={(v) => { admin.setApplicationFilter(v); setCurrentPage(1); }}
              userTypeFilter={admin.userTypeFilter}
              onUserTypeFilterChange={(v) => { admin.setUserTypeFilter(v); setCurrentPage(1); }}
            />

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
                <UserListCards
                  users={users}
                  selectedUsers={selectedUsers}
                  expandedRows={expandedRows}
                  onSelectUser={admin.handleSelectUser}
                  onToggleExpansion={toggleRowExpansion}
                  onReview={openReviewDialog}
                  onEdit={openEditDialog}
                />

                {/* Desktop Table View */}
                <UserListTable
                  users={users}
                  selectedUsers={selectedUsers}
                  expandedRows={expandedRows}
                  updatingRole={admin.updatingRole}
                  verifyingEmail={admin.verifyingEmail}
                  togglingTestUser={admin.togglingTestUser}
                  onSelectAll={admin.handleSelectAll}
                  onSelectUser={admin.handleSelectUser}
                  onToggleExpansion={toggleRowExpansion}
                  onRoleToggle={admin.handleRoleToggle}
                  onVerifyEmail={admin.handleVerifyEmail}
                  onToggleTestUser={admin.handleToggleTestUser}
                  onReview={openReviewDialog}
                  onEdit={openEditDialog}
                  onUserAction={openUserActionDialog}
                />

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

        <ReviewApplicationDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          action={reviewAction}
          user={reviewingUser}
          notes={reviewNotes}
          onNotesChange={setReviewNotes}
          isTestUser={reviewIsTestUser}
          onIsTestUserChange={setReviewIsTestUser}
          submitting={admin.submittingReview}
          onSubmit={handleReviewSubmit}
        />

        <UserActionDialog
          open={actionDialogOpen}
          onOpenChange={setActionDialogOpen}
          actionType={actionType}
          user={actionUser}
          processing={admin.processingAction}
          onConfirm={handleUserAction}
        />

        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={editingUser}
          formData={editFormData}
          onFormDataChange={setEditFormData}
          saving={admin.savingEdit}
          onSave={handleEditSave}
        />
      </div>
    </TooltipProvider>
  );
}
