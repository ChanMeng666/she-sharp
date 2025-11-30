'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  UserX,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Crown,
  User
} from 'lucide-react';
import Link from 'next/link';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
  status: 'active' | 'pending';
  avatar?: string;
}

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<'owner' | 'member'>('member');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockMembers: TeamMember[] = [
        {
          id: 1,
          name: 'Sarah Chen',
          email: 'sarah.chen@example.com',
          role: 'owner',
          joinedAt: '2024-01-15',
          status: 'active',
        },
        {
          id: 2,
          name: 'Emily Johnson',
          email: 'emily.j@example.com',
          role: 'member',
          joinedAt: '2024-02-20',
          status: 'active',
        },
        {
          id: 3,
          name: 'Maria Garcia',
          email: 'maria.g@example.com',
          role: 'member',
          joinedAt: '2024-03-10',
          status: 'active',
        },
        {
          id: 4,
          name: 'Jessica Williams',
          email: 'jessica.w@example.com',
          role: 'member',
          joinedAt: '2024-03-25',
          status: 'pending',
        },
      ];
      setMembers(mockMembers);
      setUserRole('owner'); // Mock current user role
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRemoveMember = (memberId: number) => {
    console.log('Remove member:', memberId);
    // Implement remove member logic
  };

  const handleChangeRole = (memberId: number, newRole: 'owner' | 'member') => {
    console.log('Change role for member:', memberId, 'to:', newRole);
    // Implement role change logic
  };

  const handleResendInvite = (memberId: number) => {
    console.log('Resend invite to member:', memberId);
    // Implement resend invite logic
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-8 px-4 md:px-6 lg:px-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Team Members</h1>
          {userRole === 'owner' && (
            <Link href="/dashboard/team/settings">
              <Button className="text-sm sm:text-base">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Members
              </Button>
            </Link>
          )}
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your team members and their permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(m => m.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Verified members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(m => m.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Pending invitations</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>
            A list of all team members including their name, email, role, and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  {userRole === 'owner' && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={userRole === 'owner' ? 5 : 4} className="text-center py-8 text-muted-foreground">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-foreground text-background">
                              {getUserInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {member.role === 'owner' ? (
                            <>
                              <Crown className="h-4 w-4 text-amber-500" />
                              <Badge variant="outline">
                                Owner
                              </Badge>
                            </>
                          ) : (
                            <>
                              <User className="h-4 w-4 text-muted-foreground" />
                              <Badge variant="outline">Member</Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.status === 'active' ? (
                          <Badge className="bg-muted text-foreground">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(member.joinedAt)}</TableCell>
                      {userRole === 'owner' && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="lg">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {member.status === 'pending' ? (
                                <DropdownMenuItem onClick={() => handleResendInvite(member.id)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Resend Invite
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  {member.role !== 'owner' && (
                                    <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'owner')}>
                                      <Shield className="mr-2 h-4 w-4" />
                                      Make Owner
                                    </DropdownMenuItem>
                                  )}
                                  {member.role === 'owner' && members.filter(m => m.role === 'owner').length > 1 && (
                                    <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'member')}>
                                      <User className="mr-2 h-4 w-4" />
                                      Make Member
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              {member.id !== 1 && ( // Don't allow removing the primary owner
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Remove Member
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations Notice */}
      {members.filter(m => m.status === 'pending').length > 0 && userRole === 'owner' && (
        <Alert className="mt-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            You have {members.filter(m => m.status === 'pending').length} pending invitation(s). 
            Members will appear as active once they accept their invitations.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}