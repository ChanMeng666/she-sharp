'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, Users, MessageSquare, Target, CheckCircle, XCircle, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Meeting {
  id: number;
  relationshipId: number;
  scheduledAt: string;
  durationMinutes: number;
  meetingType: string;
  meetingLink?: string;
  status: string;
  topicsDiscussed?: string[];
  goalsSet?: string[];
  actionItems?: any[];
  mentorNotes?: string;
  menteeFeedback?: string;
  rating?: number;
  userRole: string;
  otherUser: {
    name: string;
    email: string;
    image?: string;
  };
  relationship: {
    id: number;
    status: string;
  };
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<{
    upcoming: Meeting[];
    past: Meeting[];
    cancelled: Meeting[];
  }>({ upcoming: [], past: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [relationships, setRelationships] = useState<any[]>([]);

  useEffect(() => {
    fetchMeetings();
    fetchRelationships();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await fetch('/api/meetings');
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationships = async () => {
    try {
      const response = await fetch('/api/mentorship/relationships');
      if (response.ok) {
        const data = await response.json();
        // Only active relationships can schedule meetings
        setRelationships(data.active || []);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  };

  const handleScheduleMeeting = async (data: any) => {
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Meeting scheduled successfully');
        setShowScheduleDialog(false);
        fetchMeetings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to schedule meeting');
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error('Failed to schedule meeting');
    }
  };

  const handleCancelMeeting = async (meetingId: number) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        toast.success('Meeting cancelled');
        fetchMeetings();
      } else {
        toast.error('Failed to cancel meeting');
      }
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      toast.error('Failed to cancel meeting');
    }
  };

  const handleCompleteMeeting = async (meetingId: number, data: any) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', ...data }),
      });

      if (response.ok) {
        toast.success('Meeting marked as completed');
        fetchMeetings();
      } else {
        toast.error('Failed to update meeting');
      }
    } catch (error) {
      console.error('Error completing meeting:', error);
      toast.error('Failed to update meeting');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              Meeting with {meeting.otherUser.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {formatDate(meeting.scheduledAt)} at {formatTime(meeting.scheduledAt)}
            </CardDescription>
          </div>
          <Badge variant={
            meeting.status === 'scheduled' ? 'default' :
            meeting.status === 'completed' ? 'outline' : 'secondary'
          }>
            {meeting.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {meeting.durationMinutes} min
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {meeting.userRole}
          </div>
          {meeting.meetingLink && (
            <div className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              Online
            </div>
          )}
        </div>

        {meeting.topicsDiscussed && meeting.topicsDiscussed.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Topics Discussed:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {meeting.topicsDiscussed.map((topic, i) => (
                <li key={i}>{topic}</li>
              ))}
            </ul>
          </div>
        )}

        {meeting.goalsSet && meeting.goalsSet.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Goals Set:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {meeting.goalsSet.map((goal, i) => (
                <li key={i}>{goal}</li>
              ))}
            </ul>
          </div>
        )}

        {meeting.rating && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rating:</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < meeting.rating! ? 'text-yellow-500' : 'text-gray-300'}>
                  ★
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {meeting.status === 'scheduled' && new Date(meeting.scheduledAt) > new Date() && (
          <>
            {meeting.meetingLink && (
              <Button asChild>
                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                </a>
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => handleCancelMeeting(meeting.id)}
            >
              Cancel
            </Button>
          </>
        )}
        {meeting.status === 'scheduled' && new Date(meeting.scheduledAt) < new Date() && (
          <Button 
            onClick={() => handleCompleteMeeting(meeting.id, {})}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground mt-2">Manage your mentorship meetings</p>
        </div>
        {relationships.length > 0 && (
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule a Meeting</DialogTitle>
                <DialogDescription>
                  Schedule a meeting with your mentor or mentee
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleScheduleMeeting({
                  relationshipId: formData.get('relationshipId'),
                  scheduledAt: formData.get('scheduledAt'),
                  durationMinutes: parseInt(formData.get('durationMinutes') as string),
                  meetingType: formData.get('meetingType'),
                  meetingLink: formData.get('meetingLink'),
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="relationshipId">Select Relationship</Label>
                    <Select name="relationshipId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a mentorship relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationships.map((rel) => (
                          <SelectItem key={rel.id} value={rel.id.toString()}>
                            {rel.mentorName || rel.menteeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="scheduledAt">Date & Time</Label>
                    <Input
                      type="datetime-local"
                      name="scheduledAt"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                    <Input
                      type="number"
                      name="durationMinutes"
                      defaultValue="60"
                      min="15"
                      max="180"
                      step="15"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="meetingType">Meeting Type</Label>
                    <Select name="meetingType" defaultValue="regular">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular Check-in</SelectItem>
                        <SelectItem value="initial">Initial Meeting</SelectItem>
                        <SelectItem value="milestone">Milestone Review</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="meetingLink">Meeting Link (optional)</Label>
                    <Input
                      type="url"
                      name="meetingLink"
                      placeholder="https://zoom.us/..."
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit">Schedule Meeting</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({meetings.upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({meetings.past.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({meetings.cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {meetings.upcoming.length > 0 ? (
            <div className="grid gap-6">
              {meetings.upcoming.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming meetings</p>
                {relationships.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Schedule a meeting with your mentor or mentee
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {meetings.past.length > 0 ? (
            <div className="grid gap-6">
              {meetings.past.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No past meetings</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {meetings.cancelled.length > 0 ? (
            <div className="grid gap-6">
              {meetings.cancelled.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No cancelled meetings</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}