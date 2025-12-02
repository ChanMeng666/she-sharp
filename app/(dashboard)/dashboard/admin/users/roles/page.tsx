'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Shield, Users, GraduationCap, UserPlus, Edit, Trash2, Search, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const roles = [
  { id: 'admin', name: 'Administrator', description: 'Full system access', color: 'bg-muted text-foreground', icon: Shield, userCount: 3 },
  { id: 'mentor', name: 'Mentor', description: 'Can mentor students and access mentorship features', color: 'bg-green-100 text-green-700', icon: GraduationCap, userCount: 184 },
  { id: 'mentee', name: 'Mentee', description: 'Can receive mentorship and access learning resources', color: 'bg-blue-100 text-blue-700', icon: Users, userCount: 492 },
  { id: 'moderator', name: 'Moderator', description: 'Can moderate content and verify mentors', color: 'bg-orange-100 text-orange-700', icon: UserPlus, userCount: 5 },
];

const mockUsers = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', roles: ['admin', 'mentor'] },
  { id: 2, name: 'Emily Chen', email: 'emily@example.com', roles: ['mentor'] },
  { id: 3, name: 'Jessica Martinez', email: 'jessica@example.com', roles: ['mentee'] },
  { id: 4, name: 'Alex Thompson', email: 'alex@example.com', roles: ['mentee'] },
  { id: 5, name: 'Maria Rodriguez', email: 'maria@example.com', roles: ['mentor', 'moderator'] },
];

export default function RoleManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.roles.includes(selectedRole);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Role Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage user roles and permissions across the platform
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input id="role-name" placeholder="Enter role name" />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Input id="role-description" placeholder="Describe the role's purpose" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-sm font-medium">{role.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className={role.color}>
                    {role.userCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{role.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User Role Assignments */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>User Role Assignments</CardTitle>
              <CardDescription>Assign and manage roles for users</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full sm:w-40 text-sm sm:text-base">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
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
                  className="pl-9 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((roleId) => {
                        const role = roles.find(r => r.id === roleId);
                        if (!role) return null;
                        return (
                          <Badge key={roleId} variant="secondary" className={role.color}>
                            {role.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
          <CardDescription>Visual representation of role relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium">Administrator</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm text-muted-foreground">Has all permissions</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
                <UserPlus className="w-5 h-5 text-orange-600" />
                <span className="font-medium">Moderator</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm text-muted-foreground">Can moderate content and verify users</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                <GraduationCap className="w-5 h-5 text-green-600" />
                <span className="font-medium">Mentor</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm text-muted-foreground">Can mentor students</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Mentee</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm text-muted-foreground">Can access learning resources</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}