'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Briefcase, 
  Calendar, 
  Clock, 
  Globe, 
  Languages, 
  Linkedin, 
  MapPin, 
  Star, 
  Users,
  CheckCircle,
  XCircle,
  Send
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface MentorDetails {
  id: number;
  userId: number;
  name: string;
  email: string;
  image?: string;
  expertiseAreas: string[];
  yearsExperience: number;
  jobTitle?: string;
  company?: string;
  bio?: string;
  linkedinUrl?: string;
  availabilityHoursPerMonth: number;
  maxMentees: number;
  currentMenteesCount: number;
  isAcceptingMentees: boolean;
  profileCompletedAt?: string;
  verifiedAt?: string;
  createdAt: string;
  activeMenteesCount: number;
  relationshipStatus?: string;
  spotsAvailable: number;
}

export default function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [mentor, setMentor] = useState<MentorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchMentorDetails();
  }, [id]);

  const fetchMentorDetails = async () => {
    try {
      const response = await fetch(`/api/mentors/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMentor(data.mentor);
      } else if (response.status === 404) {
        router.push('/dashboard/mentors');
      }
    } catch (error) {
      console.error('Failed to fetch mentor details:', error);
      toast.error('Failed to load mentor profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyForMentorship = async () => {
    if (!applicationMessage.trim()) {
      toast.error('Please write a message to the mentor');
      return;
    }

    setIsApplying(true);
    try {
      const response = await fetch('/api/mentorship/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: mentor?.userId,
          message: applicationMessage,
        }),
      });

      if (response.ok) {
        toast.success('Application sent successfully!');
        setIsDialogOpen(false);
        setApplicationMessage('');
        // Refresh mentor details to update relationship status
        fetchMentorDetails();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send application');
      }
    } catch (error) {
      console.error('Failed to apply:', error);
      toast.error('Failed to send application');
    } finally {
      setIsApplying(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderRating = (rating?: number, sessions?: number) => {
    if (!rating) return <span className="text-muted-foreground">No ratings yet</span>;
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(rating) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-muted-foreground">({sessions} sessions)</span>
      </div>
    );
  };

  const getRelationshipBadge = () => {
    if (!mentor?.relationshipStatus) return null;
    
    const statusConfig = {
      pending: { label: 'Application Pending', variant: 'secondary' as const, icon: Clock },
      active: { label: 'Your Mentor', variant: 'default' as const, icon: CheckCircle },
      ended: { label: 'Past Mentorship', variant: 'outline' as const, icon: XCircle },
      rejected: { label: 'Application Declined', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[mentor.relationshipStatus as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-20 w-20 rounded-full mb-4" />
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Mentor not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/dashboard/mentors">
        <Button variant="outline" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mentors
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={mentor.image} />
                    <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl">{mentor.name}</CardTitle>
                      {mentor.verifiedAt && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {getRelationshipBadge()}
                    </div>
                    {mentor.jobTitle && (
                      <CardDescription className="flex items-center gap-2 text-base">
                        <Briefcase className="h-4 w-4" />
                        {mentor.jobTitle}
                        {mentor.company && ` at ${mentor.company}`}
                      </CardDescription>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {mentor.yearsExperience} years experience
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="expertise">Expertise</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {mentor.bio || 'No bio provided yet.'}
                  </p>
                </CardContent>
              </Card>

              {mentor.linkedinUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle>Connect</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={mentor.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      View LinkedIn Profile
                    </a>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="expertise" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Areas of Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertiseAreas.map((area, i) => (
                      <Badge key={i} variant="secondary" className="text-sm">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="availability" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Meeting Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Available Hours</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{mentor.availabilityHoursPerMonth} hours per month</span>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Mentorship Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rating</p>
                <p className="text-muted-foreground">Not yet rated</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
                <p className="text-2xl font-bold">0</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Mentees</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">
                    {mentor.activeMenteesCount} / {mentor.maxMentees}
                  </span>
                </div>
                {mentor.spotsAvailable > 0 ? (
                  <p className="text-sm text-green-600 mt-1">
                    {mentor.spotsAvailable} spot{mentor.spotsAvailable > 1 ? 's' : ''} available
                  </p>
                ) : (
                  <p className="text-sm text-red-600 mt-1">No spots available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Apply Button */}
          {!mentor.relationshipStatus && (
            <Card>
              <CardContent className="pt-6">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      size="lg"
                      disabled={!mentor.isAcceptingMentees || mentor.spotsAvailable === 0}
                    >
                      {mentor.isAcceptingMentees && mentor.spotsAvailable > 0
                        ? 'Apply for Mentorship'
                        : 'Not Accepting Applications'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Apply for Mentorship</DialogTitle>
                      <DialogDescription>
                        Send a message to {mentor.name} explaining why you'd like them as your mentor.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea
                        placeholder="Hi! I'm interested in your mentorship because..."
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        className="min-h-[150px]"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleApplyForMentorship} disabled={isApplying}>
                        {isApplying ? 'Sending...' : 'Send Application'}
                        <Send className="h-4 w-4 ml-2" />
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  The mentor will review your application and respond within 48 hours
                </p>
              </CardContent>
            </Card>
          )}

          {mentor.relationshipStatus === 'active' && (
            <Card>
              <CardContent className="pt-6">
                <Button className="w-full" size="lg" variant="outline">
                  View Mentorship Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}