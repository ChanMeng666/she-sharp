'use client';

import React from 'react';
import {
  Ban,
  Brain,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  FlaskConical,
  Link as LinkIcon,
  MailCheck,
  MapPin,
  MessageSquare,
  MoreVertical,
  Shield,
  Star,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, getAvatarInitials } from '@/lib/utils';
import type { UnifiedUser } from '@/types/admin';
import {
  formatIndustry,
  getApplicationBadge,
  getMembershipBadgeColor,
  getMentorStatusBadge,
  getRoleBadgeColor,
  getStatusBadge,
} from './user-badges';

interface UserListTableProps {
  users: UnifiedUser[];
  selectedUsers: string[];
  expandedRows: Set<string>;
  updatingRole: string | null;
  verifyingEmail: number | null;
  togglingTestUser: number | null;
  onSelectAll: (checked: boolean) => void;
  onSelectUser: (recordId: string, checked: boolean) => void;
  onToggleExpansion: (recordId: string) => void;
  onRoleToggle: (userId: number, roleType: string, currentlyHasRole: boolean) => void;
  onVerifyEmail: (user: UnifiedUser) => void;
  onToggleTestUser: (user: UnifiedUser) => void;
  onReview: (user: UnifiedUser, action: 'approve' | 'reject') => void;
  onEdit: (user: UnifiedUser) => void;
  onUserAction: (user: UnifiedUser, action: 'suspend' | 'delete') => void;
}

/** The detail panel a row expands into. */
function ExpandedRow({ user }: { user: UnifiedUser }) {
  return (
    <TableRow className="bg-muted/30">
      <TableCell colSpan={8} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-brand uppercase tracking-wide flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Profile Details
            </h4>

            {(user.mentorInfo?.bio || user.menteeInfo?.bio || user.applicationInfo?.bio) && (
              <div>
                <p className="text-xs text-navy font-medium mb-1">Bio</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {user.mentorInfo?.bio || user.menteeInfo?.bio || user.applicationInfo?.bio}
                </p>
              </div>
            )}

            {(user.mentorInfo?.expertise || user.applicationInfo?.expertise) && (
              <div>
                <p className="text-xs text-periwinkle font-medium mb-1">Expertise</p>
                <div className="flex flex-wrap gap-1">
                  {(user.mentorInfo?.expertise || user.applicationInfo?.expertise || []).map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-badge-mentee-bg text-badge-mentee-fg">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {(user.mentorInfo?.linkedinUrl || user.applicationInfo?.linkedinUrl) && (
              <div className="flex items-center gap-2 text-sm">
                <LinkIcon className="w-3 h-3 text-info" />
                <a
                  href={user.mentorInfo?.linkedinUrl || user.applicationInfo?.linkedinUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info hover:underline break-words"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}

            {user.applicationInfo && (
              <div className="pt-2 border-t">
                <p className="text-xs text-info font-medium mb-1">Application ({user.applicationInfo.type})</p>
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
            <h4 className="font-semibold text-sm text-navy uppercase tracking-wide flex items-center gap-2">
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
                <p className="text-xs text-brand font-medium mb-1">Mentor Metrics</p>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-brand fill-brand" />
                  <span className="font-medium">{user.mentorInfo.avgRating?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 text-periwinkle" />
                  <span>{user.mentorInfo.activeMentees} active / {user.mentorInfo.totalMentees} total mentees</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4 text-info" />
                  <span>{user.mentorInfo.totalSessions} sessions</span>
                </div>
              </div>
            )}

            {user.menteeInfo && (
              <div className="pt-2 border-t space-y-2">
                <p className="text-xs text-periwinkle font-medium mb-1">Mentee Info</p>
                {user.menteeInfo.careerStage && (
                  <p className="text-sm">Career Stage: <span className="capitalize">{user.menteeInfo.careerStage.replace(/_/g, ' ')}</span></p>
                )}
                {user.menteeInfo.currentIndustry && (
                  <p className="text-sm text-muted-foreground">Industry: {formatIndustry(user.menteeInfo.currentIndustry)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

/** Desktop (`lg` and up) table view of the user list. */
export function UserListTable({
  users,
  selectedUsers,
  expandedRows,
  updatingRole,
  verifyingEmail,
  togglingTestUser,
  onSelectAll,
  onSelectUser,
  onToggleExpansion,
  onRoleToggle,
  onVerifyEmail,
  onToggleTestUser,
  onReview,
  onEdit,
  onUserAction,
}: UserListTableProps) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedUsers.length === users.length && users.length > 0}
                onCheckedChange={onSelectAll}
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleExpansion(user.recordId)}>
                    {expandedRows.has(user.recordId) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.recordId)}
                    onCheckedChange={(checked) => onSelectUser(user.recordId, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                      <AvatarFallback className="bg-muted text-foreground">
                        {getAvatarInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{user.name || 'Unknown User'}</p>
                        {user.isTestUser && (
                          <Badge variant="outline" className="text-orange-600 border-orange-400 text-xs">TEST</Badge>
                        )}
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
                            <span className="flex items-center gap-0.5 text-xs text-info">
                              <MapPin className="w-3 h-3" />
                              {user.city}
                            </span>
                          )}
                          {user.mbtiType && (
                            <Badge className="text-xs px-1.5 py-0 bg-badge-mentee-bg text-badge-mentee-fg border border-periwinkle/30">
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
                      <DropdownMenuItem onClick={() => onToggleExpansion(user.recordId)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {user.recordType === 'registered_user' && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(user)}>
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
                                      onCheckedChange={() => onRoleToggle(user.id, roleType, hasRole)}
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
                            onClick={() => onReview(user, 'approve')}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve Application
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onReview(user, 'reject')}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject Application
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.recordType === 'registered_user' && (
                        <>
                          {!user.emailVerifiedAt && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onVerifyEmail(user)}
                                disabled={verifyingEmail === user.id}
                              >
                                <MailCheck className="w-4 h-4 mr-2" />
                                Verify Email
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onToggleTestUser(user)}
                            disabled={togglingTestUser === user.id}
                          >
                            <FlaskConical className="w-4 h-4 mr-2" />
                            {user.isTestUser ? 'Remove Test User Mark' : 'Mark as Test User'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onUserAction(user, 'suspend')}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspend Account
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUserAction(user, 'delete')}
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
              {expandedRows.has(user.recordId) && <ExpandedRow user={user} />}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
