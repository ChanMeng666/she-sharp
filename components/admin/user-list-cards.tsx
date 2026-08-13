'use client';

import {
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  Link as LinkIcon,
  MapPin,
  MessageSquare,
  Star,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

interface UserListCardsProps {
  users: UnifiedUser[];
  selectedUsers: string[];
  expandedRows: Set<string>;
  onSelectUser: (recordId: string, checked: boolean) => void;
  onToggleExpansion: (recordId: string) => void;
  onReview: (user: UnifiedUser, action: 'approve' | 'reject') => void;
  onEdit: (user: UnifiedUser) => void;
}

/** Mobile (below `lg`) card list; the desktop table is the sibling view. */
export function UserListCards({
  users,
  selectedUsers,
  expandedRows,
  onSelectUser,
  onToggleExpansion,
  onReview,
  onEdit,
}: UserListCardsProps) {
  return (
    <div className="block lg:hidden space-y-3">
      {users.map((user) => (
        <Card key={user.recordId} className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <Checkbox
              className="mt-1 shrink-0"
              checked={selectedUsers.includes(user.recordId)}
              onCheckedChange={(checked) => onSelectUser(user.recordId, checked as boolean)}
            />
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={user.image || undefined} alt={user.name || ''} />
              <AvatarFallback className="bg-muted text-foreground">
                {getAvatarInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground break-words">
                {user.name || 'Unknown User'}
                {user.isTestUser && <Badge variant="outline" className="ml-2 text-orange-600 border-orange-400 text-xs">TEST</Badge>}
              </p>
              <p className="text-sm text-muted-foreground break-all">{user.email}</p>
              {(user.jobTitle || user.company) && (
                <p className="text-xs text-muted-foreground break-words mt-0.5">
                  {user.jobTitle}{user.jobTitle && user.company ? ' @ ' : ''}{user.company}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => onToggleExpansion(user.recordId)}>
              {expandedRows.has(user.recordId) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Summary badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {user.roles.length > 0 ? user.roles.map((role) => (
              <Badge key={role} variant="secondary" className={cn('text-xs', getRoleBadgeColor(role))}>
                {role}
              </Badge>
            )) : <Badge variant="secondary" className="text-xs">No roles</Badge>}
            {getStatusBadge(user.accountStatus)}
            <Badge variant="secondary" className={cn('text-xs', getMembershipBadgeColor(user.membershipTier))}>
              {user.membershipTier}
            </Badge>
            {user.recordType === 'public_application' && (
              <Badge className="bg-muted text-foreground text-xs">
                <UserPlus className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
            {user.applicationStatus === 'pending' && getApplicationBadge(user.applicationStatus)}
            {user.mentorInfo?.isVerified && getMentorStatusBadge(user.mentorInfo.status)}
          </div>

          {/* Quick info row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            <span>Active: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</span>
            {user.city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {user.city}
              </span>
            )}
            {user.mbtiType && (
              <Badge className="text-[10px] px-1.5 py-0 bg-badge-mentee-bg text-badge-mentee-fg border border-periwinkle/30">
                <Brain className="w-2.5 h-2.5 mr-0.5" />
                {user.mbtiType}
              </Badge>
            )}
          </div>

          {/* Expanded content - matches desktop */}
          {expandedRows.has(user.recordId) && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Profile Details */}
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

              {/* Mentor metrics */}
              {user.mentorInfo && user.mentorInfo.isVerified && (
                <div className="pt-2 border-t space-y-1.5">
                  <p className="text-xs text-brand font-medium">Mentor Metrics</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-brand fill-brand" />
                      <span className="font-medium">{user.mentorInfo.avgRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-periwinkle" />
                      <span>{user.mentorInfo.activeMentees}/{user.mentorInfo.totalMentees} mentees</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-info" />
                      <span>{user.mentorInfo.totalSessions} sessions</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mentee info */}
              {user.menteeInfo && (
                <div className="pt-2 border-t space-y-1.5">
                  <p className="text-xs text-periwinkle font-medium">Mentee Info</p>
                  {user.menteeInfo.careerStage && (
                    <p className="text-xs">Career Stage: <span className="capitalize">{user.menteeInfo.careerStage.replace(/_/g, ' ')}</span></p>
                  )}
                  {user.menteeInfo.currentIndustry && (
                    <p className="text-xs text-muted-foreground">Industry: {formatIndustry(user.menteeInfo.currentIndustry)}</p>
                  )}
                </div>
              )}

              {/* Application info */}
              {user.applicationInfo && (
                <div className="pt-2 border-t space-y-1.5">
                  <p className="text-xs text-info font-medium">Application ({user.applicationInfo.type})</p>
                  <div className="text-xs space-y-1">
                    <p>Status: <Badge variant="outline" className="ml-1 text-xs">{user.applicationInfo.status}</Badge></p>
                    {user.applicationInfo.submittedAt && (
                      <p className="text-muted-foreground">
                        Submitted: {new Date(user.applicationInfo.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                    {user.applicationInfo.availabilityHoursPerMonth && (
                      <p className="text-muted-foreground">
                        Availability: {user.applicationInfo.availabilityHoursPerMonth}h/month
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Application actions */}
              {user.applicationStatus === 'pending' && user.applicationInfo && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => onReview(user, 'approve')}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => onReview(user, 'reject')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-2 pt-2">
                {user.recordType === 'registered_user' && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
