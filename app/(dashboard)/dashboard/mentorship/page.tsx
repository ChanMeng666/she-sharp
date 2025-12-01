'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar,
  Clock,
  MessageSquare,
  User,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  Mail,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

interface Relationship {
  id: number;
  mentorId: number;
  menteeId: number;
  status: string;
  startedAt?: string;
  notes?: string;
  mentorName?: string;
  menteeName?: string;
  mentorEmail?: string;
  menteeEmail?: string;
  mentorImage?: string;
  menteeImage?: string;
  mentorRole?: string;
  menteeGoals?: string[];
  totalMeetings?: number;
  nextMeetingDate?: string;
}

export default function MentorshipDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [pendingApplications, setPendingApplications] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee' | 'both'>('mentee');
  const [selectedApplication, setSelectedApplication] = useState<Relationship | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchMentorshipData();
  }, []);

  const fetchMentorshipData = async () => {
    try {
      // Fetch user roles
      const rolesResponse = await fetch('/api/user/roles');
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        const roles = rolesData.activeRoles || [];
        if (roles.includes('mentor') && roles.includes('mentee')) {
          setUserRole('both');
        } else if (roles.includes('mentor')) {
          setUserRole('mentor');
        } else {
          setUserRole('mentee');
        }
      }

      // Fetch relationships
      const relationshipsResponse = await fetch('/api/mentorship/relationships');
      if (relationshipsResponse.ok) {
        const data = await relationshipsResponse.json();
        setRelationships(data.active || []);
        setPendingApplications(data.pending || []);
      }
    } catch (error) {
      console.error('Failed to fetch mentorship data:', error);
      toast.error('Failed to load mentorship data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationAction = async (relationshipId: number, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/mentorship/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationshipId,
          action,
          feedback: feedbackMessage,
        }),
      });

      if (response.ok) {
        toast.success(`Application ${action}d successfully`);
        setSelectedApplication(null);
        setFeedbackMessage('');
        fetchMentorshipData();
      } else {
        const error = await response.json();
        toast.error(error.message || `Failed to ${action} application`);
      }
    } catch (error) {
      console.error(`Failed to ${action} application:`, error);
      toast.error(`Failed to ${action} application`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12">
      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mentorship Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your mentorship relationships and applications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="relationships">
            Active ({relationships.length})
          </TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({pendingApplications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Relationships
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{relationships.length}</div>
                <p className="text-xs text-muted-foreground">
                  {userRole === 'mentor' ? 'Mentees' : userRole === 'mentee' ? 'Mentors' : 'Total'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Applications
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingApplications.length}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Your Role
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{userRole}</div>
                <p className="text-xs text-muted-foreground">
                  {userRole === 'both' ? 'Mentor & Mentee' : `Active as ${userRole}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          {relationships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline">
                  <Video className="h-4 w-4 mr-2" />
                  Start Video Call
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          {relationships.length === 0 ? (
            renderEmptyState('No active mentorship relationships yet')
          ) : (
            relationships.map((relationship) => (
              <Card key={relationship.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={userRole === 'mentee' ? relationship.mentorImage : relationship.menteeImage} 
                        />
                        <AvatarFallback>
                          {getInitials(userRole === 'mentee' ? relationship.mentorName : relationship.menteeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {userRole === 'mentee' ? relationship.mentorName : relationship.menteeName}
                        </CardTitle>
                        <CardDescription>
                          {userRole === 'mentee' ? 'Your Mentor' : 'Your Mentee'}
                          {relationship.mentorRole && userRole === 'mentee' && (
                            <span className="ml-2">• {relationship.mentorRole}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Started {new Date(relationship.startedAt!).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {relationship.totalMeetings || 0} meetings
                    </span>
                  </div>
                  
                  {relationship.nextMeetingDate && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium">Next Meeting</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(relationship.nextMeetingDate).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="lg" variant="outline">
                      <Mail className="h-3 w-3 mr-1" />
                      Message
                    </Button>
                    <Button size="lg" variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                    <Button size="lg" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {pendingApplications.length === 0 ? (
            renderEmptyState('No pending applications')
          ) : (
            pendingApplications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={userRole === 'mentor' ? application.menteeImage : application.mentorImage} 
                        />
                        <AvatarFallback>
                          {getInitials(userRole === 'mentor' ? application.menteeName : application.mentorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {userRole === 'mentor' ? application.menteeName : application.mentorName}
                        </CardTitle>
                        <CardDescription>
                          {userRole === 'mentor' ? 'Mentee Application' : 'Your Application'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {application.notes && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">Application Message</p>
                      <p className="text-sm text-muted-foreground">
                        {application.notes}
                      </p>
                    </div>
                  )}

                  {userRole === 'mentor' ? (
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedApplication(application)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve Application</DialogTitle>
                            <DialogDescription>
                              Accept {application.menteeName} as your mentee?
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder="Optional: Add a welcome message..."
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleApplicationAction(application.id, 'approve')}
                              disabled={isProcessing}
                            >
                              {isProcessing ? 'Processing...' : 'Approve'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Decline
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Decline Application</DialogTitle>
                            <DialogDescription>
                              Decline the application from {application.menteeName}?
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder="Optional: Provide feedback to help them improve..."
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                              Cancel
                            </Button>
                            <Button
                              variant="outline"
                              className="text-red-600 hover:text-white hover:bg-red-600 border-red-200 hover:border-red-600"
                              onClick={() => handleApplicationAction(application.id, 'reject')}
                              disabled={isProcessing}
                            >
                              {isProcessing ? 'Processing...' : 'Decline'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Waiting for mentor's response
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}