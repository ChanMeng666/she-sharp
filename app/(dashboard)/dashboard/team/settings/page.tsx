'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Crown,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserX,
  Send
} from 'lucide-react';
import { inviteTeamMember, removeTeamMember } from '@/app/(login)/actions';

interface TeamMember {
  id: number;
  userId: number;
  teamId: number;
  role: string;
  joinedAt: Date;
  user: {
    id: number;
    name: string | null;
    email: string;
    emailVerifiedAt: Date | null;
  };
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  status: string;
  invitedAt: Date;
  invitedBy: number;
}

export default function TeamSettingsPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      // Fetch current user data
      const userResponse = await fetch('/api/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);
      }

      // Fetch team data
      const teamResponse = await fetch('/api/team');
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamMembers(teamData.members || []);
        setInvitations(teamData.invitations || []);
      }
    } catch (err) {
      console.error('Failed to fetch team data:', err);
      setError('Failed to load team information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('email', inviteEmail);
      formData.append('role', inviteRole);
      
      const result = await inviteTeamMember({ email: inviteEmail, role: inviteRole as 'member' | 'owner' }, formData);
      
      if (result && 'error' in result && result.error) {
        setError(result.error);
      } else if (result && 'success' in result && result.success) {
        setMessage(result.success);
        setInviteEmail('');
        setInviteRole('member');
        fetchTeamData(); // Refresh the team data
      }
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      const formData = new FormData();
      formData.append('memberId', memberId.toString());
      
      const result = await removeTeamMember({ memberId }, formData);
      
      if (result && 'error' in result && result.error) {
        setError(result.error);
      } else if (result && 'success' in result && result.success) {
        setMessage(result.success);
        fetchTeamData(); // Refresh the team data
      }
    } catch (err) {
      setError('Failed to remove team member');
    } finally {
      setMemberToRemove(null);
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'owner' ? <Crown className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    return role === 'owner' ? 'default' : 'secondary';
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired':
        return <UserX className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  const isOwner = teamMembers.some(
    member => member.userId === currentUser?.id && member.role === 'owner'
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-6">
        Team Settings
      </h1>

      {/* Messages */}
      {message && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Team Members */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team members and their roles</CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto">
              <Users className="mr-2 h-4 w-4" />
              {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{member.user.name || 'Unnamed User'}</p>
                      {member.userId === currentUser?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1 capitalize">{member.role}</span>
                      </Badge>
                      {!member.user.emailVerifiedAt && (
                        <Badge variant="secondary" className="text-xs">
                          <Mail className="mr-1 h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {isOwner && member.userId !== currentUser?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMemberToRemove(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Team Member */}
      {isOwner && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>
              Send an invitation to add new members to your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">
                        <div className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Member
                        </div>
                      </SelectItem>
                      <SelectItem value="owner">
                        <div className="flex items-center">
                          <Crown className="mr-2 h-4 w-4" />
                          Owner
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isInviting}
              >
                {isInviting ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations that have been sent but not yet accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={getRoleBadgeVariant(invitation.role)}>
                          {getRoleIcon(invitation.role)}
                          <span className="ml-1 capitalize">{invitation.role}</span>
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(invitation.status)}>
                          {getStatusIcon(invitation.status)}
                          <span className="ml-1 capitalize">{invitation.status}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Invited {new Date(invitation.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={memberToRemove !== null} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from your team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}