'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: () => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  membershipFilter: string;
  onMembershipFilterChange: (value: string) => void;
  applicationFilter: string;
  onApplicationFilterChange: (value: string) => void;
  userTypeFilter: string;
  onUserTypeFilterChange: (value: string) => void;
}

/** Search box plus the five list filters above the user table. */
export function UserFilters({
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  membershipFilter,
  onMembershipFilterChange,
  applicationFilter,
  onApplicationFilterChange,
  userTypeFilter,
  onUserTypeFilterChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="search"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:gap-2 gap-2">
        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
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

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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

        <Select value={membershipFilter} onValueChange={onMembershipFilterChange}>
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

        <Select value={applicationFilter} onValueChange={onApplicationFilterChange}>
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Application" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="has_pending">Has Pending</SelectItem>
            <SelectItem value="no_application">No Application</SelectItem>
          </SelectContent>
        </Select>

        <Select value={userTypeFilter} onValueChange={onUserTypeFilterChange}>
          <SelectTrigger className="w-full lg:w-36">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="real">Real Users</SelectItem>
            <SelectItem value="test">Test Users</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
