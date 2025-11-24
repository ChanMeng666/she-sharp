'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Search, UserCheck, Edit, Save, X, Eye, FileText, Users, Calendar, BarChart3, Settings } from 'lucide-react';
import { useState } from 'react';

const permissions = [
  { id: 'viewAllData', name: 'View All Data', description: 'Access to view all platform data', icon: Eye, category: 'Data Access' },
  { id: 'editUsers', name: 'Edit Users', description: 'Modify user accounts and profiles', icon: UserCheck, category: 'User Management' },
  { id: 'manageRelationships', name: 'Manage Relationships', description: 'Create and modify mentorship relationships', icon: Users, category: 'Mentorship' },
  { id: 'accessAnalytics', name: 'Access Analytics', description: 'View platform analytics and reports', icon: BarChart3, category: 'Analytics' },
  { id: 'manageContent', name: 'Manage Content', description: 'Create, edit, and delete content', icon: FileText, category: 'Content' },
  { id: 'verifyMentors', name: 'Verify Mentors', description: 'Review and approve mentor applications', icon: Shield, category: 'Mentorship' },
  { id: 'manageEvents', name: 'Manage Events', description: 'Create and manage platform events', icon: Calendar, category: 'Events' },
  { id: 'systemSettings', name: 'System Settings', description: 'Modify system configuration', icon: Settings, category: 'System' },
];

const mockUsers = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Admin', permissions: ['viewAllData', 'editUsers', 'manageRelationships', 'accessAnalytics', 'manageContent', 'verifyMentors', 'manageEvents'] },
  { id: 2, name: 'Emily Chen', email: 'emily@example.com', role: 'Moderator', permissions: ['viewAllData', 'verifyMentors', 'manageContent'] },
  { id: 3, name: 'Jessica Martinez', email: 'jessica@example.com', role: 'Content Manager', permissions: ['manageContent', 'manageEvents'] },
];

export default function AccessControlPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<number, string[]>>({});

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePermission = (userId: number, permissionId: string) => {
    setUserPermissions(prev => {
      const current = prev[userId] || mockUsers.find(u => u.id === userId)?.permissions || [];
      if (current.includes(permissionId)) {
        return { ...prev, [userId]: current.filter(p => p !== permissionId) };
      } else {
        return { ...prev, [userId]: [...current, permissionId] };
      }
    });
  };

  const getUserPermissions = (userId: number) => {
    return userPermissions[userId] || mockUsers.find(u => u.id === userId)?.permissions || [];
  };

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Access Control</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Configure access permissions for different user roles
          </p>
        </div>
      </div>

      {/* Permission Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {['Data Access', 'User Management', 'Mentorship', 'Content'].map((category) => {
          const categoryPerms = permissions.filter(p => p.category === category);
          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryPerms.map(perm => {
                    const Icon = perm.icon;
                    return (
                      <div key={perm.id} className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-xs text-foreground">{perm.name}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User Permissions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>User Permissions</CardTitle>
              <CardDescription>Manage individual user access rights</CardDescription>
            </div>
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
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredUsers.map((user) => {
                const isEditing = editingUser === user.id;
                const currentPermissions = getUserPermissions(user.id);
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          {permissions.map((perm) => (
                            <div key={perm.id} className="flex items-center space-x-2">
                              <Switch
                                id={`${user.id}-${perm.id}`}
                                checked={currentPermissions.includes(perm.id)}
                                onCheckedChange={() => togglePermission(user.id, perm.id)}
                              />
                              <Label htmlFor={`${user.id}-${perm.id}`} className="text-xs cursor-pointer">
                                {perm.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {currentPermissions.map((permId) => {
                            const perm = permissions.find(p => p.id === permId);
                            if (!perm) return null;
                            const Icon = perm.icon;
                            return (
                              <Badge key={permId} variant="outline" className="text-xs">
                                <Icon className="w-3 h-3 mr-1" />
                                {perm.name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" onClick={() => setEditingUser(null)}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingUser(null);
                            setUserPermissions(prev => {
                              const copy = { ...prev };
                              delete copy[user.id];
                              return copy;
                            });
                          }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingUser(user.id)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}