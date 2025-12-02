'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  Users,
  GraduationCap,
  User,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserRole {
  type: string;
  isActive: boolean;
  activatedAt: string | null;
}

interface UserPermissions {
  canViewAllData: boolean;
  canEditUsers: boolean;
  canManageContent: boolean;
  canManageEvents: boolean;
  canManageRelationships: boolean;
  canAccessAnalytics: boolean;
  canVerifyMentors: boolean;
}

interface UserWithRoles {
  id: number;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  roles: UserRole[];
  permissions: UserPermissions | null;
}

interface RoleStats {
  [key: string]: { total: number; active: number };
}

interface ApiResponse {
  users: UserWithRoles[];
  roleStats: RoleStats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const roleConfig = {
  admin: { name: 'Administrator', icon: Shield, color: 'bg-muted text-foreground', description: 'Full system access' },
  mentor: { name: 'Mentor', icon: GraduationCap, color: 'bg-green-100 text-green-700', description: 'Can mentor students' },
  mentee: { name: 'Mentee', icon: Users, color: 'bg-blue-100 text-blue-700', description: 'Can receive mentorship' },
};

const permissionLabels: Record<string, string> = {
  canViewAllData: 'View All Data',
  canEditUsers: 'Edit Users',
  canManageContent: 'Manage Content',
  canManageEvents: 'Manage Events',
  canManageRelationships: 'Manage Relationships',
  canAccessAnalytics: 'Access Analytics',
  canVerifyMentors: 'Verify Mentors',
};

export default function RolesAndPermissionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats>({});
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch users with roles
  const fetchUsersWithRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users/roles?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch user roles');
      }
      const data: ApiResponse = await response.json();
      setUsers(data.users);
      setRoleStats(data.roleStats);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersWithRoles();
  }, [fetchUsersWithRoles]);

  // Update user role
  const handleRoleToggle = async (userId: number, roleType: string, currentActive: boolean) => {
    setUpdating(`${userId}-${roleType}`);
    try {
      const response = await fetch('/api/admin/users/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleType, isActive: !currentActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Refresh data
      await fetchUsersWithRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' ||
      user.roles.some(r => r.type === selectedRole && r.isActive);
    return matchesSearch && matchesRole;
  });

  // Get users with permissions for the Permissions tab
  const usersWithPermissions = users.filter(u => u.permissions !== null);

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage user roles and admin permissions across the platform
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsersWithRoles} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
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

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {Object.entries(roleConfig).map(([roleId, config]) => {
          const Icon = config.icon;
          const stats = roleStats[roleId] || { total: 0, active: 0 };

          return (
            <Card key={roleId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-sm font-medium">{config.name}</CardTitle>
                  </div>
                  {loading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <Badge variant="secondary" className={config.color}>
                      {stats.active} active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{config.description}</p>
                {!loading && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.total} total assigned
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs for Roles and Permissions */}
      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="permissions">Admin Permissions</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>User Role Assignments</CardTitle>
                  <CardDescription>
                    {loading ? 'Loading...' : `${filteredUsers.length} users found`}
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {Object.entries(roleConfig).map(([id, config]) => (
                        <SelectItem key={id} value={id}>{config.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="search"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
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
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Mentor</TableHead>
                        <TableHead>Mentee</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const activeRoles = user.roles.filter(r => r.isActive).length;

                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            {['admin', 'mentor', 'mentee'].map((roleType) => {
                              const role = user.roles.find(r => r.type === roleType);
                              const isActive = role?.isActive ?? false;
                              const isUpdating = updating === `${user.id}-${roleType}`;

                              return (
                                <TableCell key={roleType}>
                                  <Switch
                                    checked={isActive}
                                    disabled={isUpdating}
                                    onCheckedChange={() => handleRoleToggle(user.id, roleType, isActive)}
                                  />
                                </TableCell>
                              );
                            })}
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  activeRoles > 0 ? "text-green-600 border-green-600" : "text-muted-foreground"
                                )}
                              >
                                {activeRoles} active
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Admin Permissions</CardTitle>
              <CardDescription>
                View and manage admin-level permissions for users with the admin role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[300px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : usersWithPermissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No admin users with permissions found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin User</TableHead>
                        {Object.values(permissionLabels).map(label => (
                          <TableHead key={label} className="text-center">{label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersWithPermissions.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          {Object.keys(permissionLabels).map((permKey) => {
                            const hasPermission = user.permissions?.[permKey as keyof UserPermissions];
                            return (
                              <TableCell key={permKey} className="text-center">
                                {hasPermission ? (
                                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                                )}
                              </TableCell>
                            );
                          })}
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
    </div>
  );
}
