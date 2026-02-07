'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MessageSquare,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Briefcase,
  Building2,
  Linkedin,
  Brain,
  Target,
  Sparkles,
  GraduationCap,
  Globe,
  Loader2
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

interface MentorFormData {
  fullName: string | null;
  gender: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: string | null;
  photoUrl: string | null;
  city: string | null;
  preferredMeetingFormat: string | null;
  bio: string | null;
  softSkillsBasic: string[] | null;
  industrySkillsBasic: string[] | null;
  softSkillsExpert: string[] | null;
  industrySkillsExpert: string[] | null;
  expectedMenteeGoalsLongTerm: string | null;
  expectedMenteeGoalsShortTerm: string | null;
  programExpectations: string | null;
  preferredMenteeTypes: string[] | null;
  preferredIndustries: string[] | null;
  mbtiType: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null;
  availabilityHoursPerMonth: number | null;
  maxMentees: number | null;
}

interface MentorDetails {
  id: number;
  userId: number;
  name: string;
  email: string;
  image: string | null;
  expertiseAreas: string[];
  yearsExperience: number;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  availabilityHoursPerMonth: number;
  maxMentees: number;
  currentMenteesCount: number;
  isAcceptingMentees: boolean;
  activeMenteesCount: number;
  spotsAvailable: number;
  formData: MentorFormData | null;
}

interface MenteeFormData {
  fullName: string | null;
  gender: string | null;
  age: number | null;
  phone: string | null;
  currentStage: string | null;
  photoUrl: string | null;
  bio: string | null;
  city: string | null;
  preferredMeetingFormat: string | null;
  currentJobTitle: string | null;
  currentIndustry: string | null;
  preferredIndustries: string[] | null;
  softSkillsBasic: string[] | null;
  industrySkillsBasic: string[] | null;
  softSkillsExpert: string[] | null;
  industrySkillsExpert: string[] | null;
  longTermGoals: string | null;
  shortTermGoals: string | null;
  whyMentor: string | null;
  programExpectations: string | null;
  mbtiType: string | null;
  preferredMeetingFrequency: string | null;
}

interface MenteeDetails {
  id: number;
  userId: number;
  name: string;
  email: string;
  image: string | null;
  learningGoals: string[];
  careerStage: string | null;
  preferredExpertiseAreas: string[];
  preferredMeetingFrequency: string | null;
  bio: string | null;
  currentChallenge: string | null;
  profileCompletedAt: string | null;
  relationshipStatus: string | null;
  formData: MenteeFormData | null;
}

// City options mapping (value -> label)
const cityOptionsMap: Record<string, string> = {
  'auckland': 'Auckland',
  'wellington': 'Wellington',
  'christchurch': 'Christchurch',
  'hamilton': 'Hamilton',
  'tauranga': 'Tauranga',
  'dunedin': 'Dunedin',
  'palmerston_north': 'Palmerston North',
  'napier_hastings': 'Napier-Hastings',
  'nelson': 'Nelson',
  'rotorua': 'Rotorua',
  'other_nz': 'Other (New Zealand)',
  'international': 'International',
};

// Meeting format options mapping (value -> label)
const meetingFormatOptionsMap: Record<string, string> = {
  'online': 'Online (Virtual meetings only)',
  'in_person': 'In-Person (Face-to-face meetings)',
  'hybrid': 'Hybrid (Both online and in-person)',
};

// Years of experience mapping (value -> label)
const yearsExperienceMap: Record<number, string> = {
  3: '3-5 years',
  5: '5-10 years',
  10: '10-15 years',
  15: '15+ years',
};

// Availability hours mapping (value -> label)
const availabilityHoursMap: Record<number, string> = {
  2: '2 hours',
  4: '4 hours',
  6: '6 hours',
  8: '8+ hours',
};

// Max mentees mapping (value -> label)
const maxMenteesMap: Record<number, string> = {
  1: '1 mentee',
  2: '2 mentees',
  3: '3 mentees',
  4: '4 mentees',
  5: '5 mentees',
};

// Career stage mapping (value -> label)
const careerStageMap: Record<string, string> = {
  'undergraduate': 'Undergraduate Student',
  'postgraduate': 'Postgraduate Student',
  'early_career': 'Early Career (0-3 years)',
  'mid_career': 'Mid Career (4-10 years)',
  'senior': 'Senior (10+ years)',
  'career_transition': 'Career Transition',
};

// Meeting frequency mapping (value -> label)
const meetingFrequencyMap: Record<string, string> = {
  'weekly': 'Weekly',
  'biweekly': 'Bi-weekly (Every 2 weeks)',
  'monthly': 'Monthly',
  'as_needed': 'As Needed',
};

// Industry options mapping (value -> label)
const industryOptionsMap: Record<string, string> = {
  'engineering': 'Engineering',
  'it_cs': 'Information Technology (IT) and Computer Science',
  'healthcare': 'Healthcare and Medicine',
  'biotech': 'Biotechnology and Life Sciences',
  'renewable_energy': 'Renewable Energy',
  'agriculture': 'Agriculture and Food Science',
  'environmental': 'Environmental Science and Sustainability',
  'telecom': 'Telecommunications',
  'robotics': 'Robotics and Automation',
  'manufacturing': 'Manufacturing and Materials Science',
  'aerospace': 'Aerospace and Defense',
  'finance': 'Finance and Banking',
  'consulting': 'Consulting',
  'education': 'Education',
  'other': 'Other',
};

// Preferred mentee types mapping (value -> label)
const menteeTypesMap: Record<string, string> = {
  'undergraduate': 'Undergraduate/Graduate',
  'postgraduate': 'Post Graduate',
  'professional': 'Professional',
};

export default function MentorshipDashboard() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [pendingApplications, setPendingApplications] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee' | 'both'>('mentee');
  const [selectedApplication, setSelectedApplication] = useState<Relationship | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mentor details sheet state
  const [selectedMentorDetails, setSelectedMentorDetails] = useState<MentorDetails | null>(null);
  const [isLoadingMentorDetails, setIsLoadingMentorDetails] = useState(false);
  const [isMentorSheetOpen, setIsMentorSheetOpen] = useState(false);

  // Mentee details sheet state
  const [selectedMenteeDetails, setSelectedMenteeDetails] = useState<MenteeDetails | null>(null);
  const [isLoadingMenteeDetails, setIsLoadingMenteeDetails] = useState(false);
  const [isMenteeSheetOpen, setIsMenteeSheetOpen] = useState(false);

  useEffect(() => {
    fetchMentorshipData();
  }, []);

  const fetchMentorshipData = async () => {
    try {
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

  const fetchMentorDetails = async (mentorUserId: number) => {
    setIsLoadingMentorDetails(true);
    setIsMentorSheetOpen(true);
    try {
      const response = await fetch(`/api/mentors/${mentorUserId}?byUserId=true&includeFormData=true`);
      if (response.ok) {
        const data = await response.json();
        setSelectedMentorDetails(data.mentor);
      } else {
        toast.error('Failed to load mentor details');
        setIsMentorSheetOpen(false);
      }
    } catch (error) {
      console.error('Failed to fetch mentor details:', error);
      toast.error('Failed to load mentor details');
      setIsMentorSheetOpen(false);
    } finally {
      setIsLoadingMentorDetails(false);
    }
  };

  const fetchMenteeDetails = async (menteeUserId: number) => {
    setIsLoadingMenteeDetails(true);
    setIsMenteeSheetOpen(true);
    try {
      const response = await fetch(`/api/mentees/${menteeUserId}?byUserId=true&includeFormData=true`);
      if (response.ok) {
        const data = await response.json();
        setSelectedMenteeDetails(data.mentee);
      } else {
        toast.error('Failed to load mentee details');
        setIsMenteeSheetOpen(false);
      }
    } catch (error) {
      console.error('Failed to fetch mentee details:', error);
      toast.error('Failed to load mentee details');
      setIsMenteeSheetOpen(false);
    } finally {
      setIsLoadingMenteeDetails(false);
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

  const getRoleLabel = () => {
    if (userRole === 'both') return 'Mentor & Mentee';
    return userRole.charAt(0).toUpperCase() + userRole.slice(1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasNoData = relationships.length === 0 && pendingApplications.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mentorship Dashboard</h1>
        <p className="text-muted-foreground">
          You are active as <span className="font-medium">{getRoleLabel()}</span>
        </p>
      </div>

      {hasNoData ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No mentorship relationships or applications yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active Relationships */}
          {relationships.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Active Relationships ({relationships.length})
              </h2>
              {relationships.map((relationship) => (
                <Card
                  key={relationship.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    if (userRole === 'mentee' && relationship.mentorId) {
                      fetchMentorDetails(relationship.mentorId);
                    } else if (userRole === 'mentor' && relationship.menteeId) {
                      fetchMenteeDetails(relationship.menteeId);
                    }
                  }}
                >
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
                      <Badge className="bg-badge-success-bg text-badge-success-fg">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Started {new Date(relationship.startedAt!).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {relationship.totalMeetings || 0} meetings
                      </span>
                      {userRole === 'mentee' && (
                        <span className="text-primary text-xs ml-auto">Click to view mentor profile</span>
                      )}
                      {userRole === 'mentor' && (
                        <span className="text-primary text-xs ml-auto">Click to view mentee profile</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pending Applications */}
          {pendingApplications.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Pending Applications ({pendingApplications.length})
              </h2>
              {pendingApplications.map((application) => (
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (application.menteeId) {
                              fetchMenteeDetails(application.menteeId);
                            }
                          }}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          View Profile
                        </Button>
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
                                variant="destructive"
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mentor Details Sheet */}
      <Sheet open={isMentorSheetOpen} onOpenChange={setIsMentorSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
          {/* Fixed Header */}
          <div className="px-8 pt-8 pb-4 border-b bg-background shrink-0">
            <SheetHeader>
              <SheetTitle className="text-2xl">Mentor Profile</SheetTitle>
              <SheetDescription>
                View your mentor's complete profile and background
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Scrollable Content */}
          {isLoadingMentorDetails ? (
            <div className="flex items-center justify-center flex-1 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedMentorDetails ? (
            <div className="flex-1 overflow-y-auto">
                <div className="px-8 py-8 space-y-8">
                  {/* Profile Header Card */}
                  <div className="bg-surface-purple rounded-xl p-6">
                    <div className="flex items-start gap-5">
                      <Avatar className="h-20 w-20 border-2 border-brand/20 shadow-md">
                        <AvatarImage src={selectedMentorDetails.formData?.photoUrl || selectedMentorDetails.image || undefined} />
                        <AvatarFallback className="text-lg bg-brand/10 text-brand">{getInitials(selectedMentorDetails.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-semibold mb-1">
                          {selectedMentorDetails.formData?.fullName || selectedMentorDetails.name}
                        </h3>
                        {(selectedMentorDetails.formData?.jobTitle || selectedMentorDetails.jobTitle) && (
                          <p className="text-muted-foreground text-base">
                            {selectedMentorDetails.formData?.jobTitle || selectedMentorDetails.jobTitle}
                            {(selectedMentorDetails.formData?.company || selectedMentorDetails.company) && (
                              <> at <span className="font-medium">{selectedMentorDetails.formData?.company || selectedMentorDetails.company}</span></>
                            )}
                          </p>
                        )}
                        {(selectedMentorDetails.formData?.linkedinUrl || selectedMentorDetails.linkedinUrl) && (
                          <a
                            href={selectedMentorDetails.formData?.linkedinUrl || selectedMentorDetails.linkedinUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Linkedin className="h-4 w-4" />
                            View LinkedIn Profile
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedMentorDetails.formData?.city && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-navy-light">
                        <MapPin className="h-5 w-5 text-info shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm font-medium">
                            {cityOptionsMap[selectedMentorDetails.formData.city] || selectedMentorDetails.formData.city}
                          </p>
                        </div>
                      </div>
                    )}
                    {(selectedMentorDetails.formData?.yearsExperience || selectedMentorDetails.yearsExperience) && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-mint-light">
                        <Briefcase className="h-5 w-5 text-navy shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Experience</p>
                          <p className="text-sm font-medium">
                            {yearsExperienceMap[selectedMentorDetails.formData?.yearsExperience || selectedMentorDetails.yearsExperience] ||
                              `${selectedMentorDetails.formData?.yearsExperience || selectedMentorDetails.yearsExperience} years`}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedMentorDetails.formData?.preferredMeetingFormat && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-periwinkle-light">
                        <Globe className="h-5 w-5 text-periwinkle shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Meeting Format</p>
                          <p className="text-sm font-medium">
                            {meetingFormatOptionsMap[selectedMentorDetails.formData.preferredMeetingFormat] ||
                              selectedMentorDetails.formData.preferredMeetingFormat}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedMentorDetails.formData?.mbtiType && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-purple">
                        <Brain className="h-5 w-5 text-brand shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">MBTI Type</p>
                          <p className="text-sm font-medium">{selectedMentorDetails.formData.mbtiType}</p>
                        </div>
                      </div>
                    )}
                    {(selectedMentorDetails.formData?.availabilityHoursPerMonth || selectedMentorDetails.availabilityHoursPerMonth) && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-navy-light">
                        <Clock className="h-5 w-5 text-info shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Availability</p>
                          <p className="text-sm font-medium">
                            {availabilityHoursMap[selectedMentorDetails.formData?.availabilityHoursPerMonth || selectedMentorDetails.availabilityHoursPerMonth] ||
                              `${selectedMentorDetails.formData?.availabilityHoursPerMonth || selectedMentorDetails.availabilityHoursPerMonth} hrs/month`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bio Section */}
                  {(selectedMentorDetails.formData?.bio || selectedMentorDetails.bio) && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-base flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        About
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pl-7">
                        {selectedMentorDetails.formData?.bio || selectedMentorDetails.bio}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Skills Section */}
                  {(selectedMentorDetails.formData?.softSkillsExpert?.length ||
                    selectedMentorDetails.formData?.industrySkillsExpert?.length ||
                    selectedMentorDetails.formData?.softSkillsBasic?.length ||
                    selectedMentorDetails.formData?.industrySkillsBasic?.length) && (
                    <div className="space-y-6">
                      {/* Expert Skills */}
                      {(selectedMentorDetails.formData?.softSkillsExpert?.length || selectedMentorDetails.formData?.industrySkillsExpert?.length) && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-base flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Expert Skills
                          </h4>
                          <div className="flex flex-wrap gap-2 pl-7">
                            {selectedMentorDetails.formData?.softSkillsExpert?.map((skill, i) => (
                              <Badge key={`soft-expert-${i}`} variant="default" className="px-3 py-1">{skill}</Badge>
                            ))}
                            {selectedMentorDetails.formData?.industrySkillsExpert?.map((skill, i) => (
                              <Badge key={`industry-expert-${i}`} variant="default" className="px-3 py-1">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Skills */}
                      {(selectedMentorDetails.formData?.softSkillsBasic?.length || selectedMentorDetails.formData?.industrySkillsBasic?.length) && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-base flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Additional Skills
                          </h4>
                          <div className="flex flex-wrap gap-2 pl-7">
                            {selectedMentorDetails.formData?.softSkillsBasic?.map((skill, i) => (
                              <Badge key={`soft-basic-${i}`} variant="secondary" className="px-3 py-1">{skill}</Badge>
                            ))}
                            {selectedMentorDetails.formData?.industrySkillsBasic?.map((skill, i) => (
                              <Badge key={`industry-basic-${i}`} variant="secondary" className="px-3 py-1">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Industry Focus */}
                  {selectedMentorDetails.formData?.preferredIndustries?.length && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-base flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Industry Focus
                      </h4>
                      <div className="flex flex-wrap gap-2 pl-7">
                        {selectedMentorDetails.formData.preferredIndustries.map((industry, i) => (
                          <Badge key={i} variant="outline" className="px-3 py-1">
                            {industryOptionsMap[industry] || industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mentorship Expectations Section */}
                  {(selectedMentorDetails.formData?.expectedMenteeGoalsShortTerm ||
                    selectedMentorDetails.formData?.expectedMenteeGoalsLongTerm ||
                    selectedMentorDetails.formData?.programExpectations ||
                    selectedMentorDetails.formData?.preferredMenteeTypes?.length) && (
                    <>
                      <Separator />

                      <div className="space-y-6">
                        <h4 className="font-semibold text-lg">Mentorship Expectations</h4>

                        {/* Mentee Goals */}
                        {(selectedMentorDetails.formData?.expectedMenteeGoalsShortTerm || selectedMentorDetails.formData?.expectedMenteeGoalsLongTerm) && (
                          <div className="space-y-4 bg-muted/30 rounded-xl p-5">
                            <p className="font-medium text-sm">What I Expect from Mentees</p>
                            {selectedMentorDetails.formData?.expectedMenteeGoalsShortTerm && (
                              <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Short-term Goals</p>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {selectedMentorDetails.formData.expectedMenteeGoalsShortTerm}
                                </p>
                              </div>
                            )}
                            {selectedMentorDetails.formData?.expectedMenteeGoalsLongTerm && (
                              <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Long-term Goals</p>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {selectedMentorDetails.formData.expectedMenteeGoalsLongTerm}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Programme Expectations */}
                        {selectedMentorDetails.formData?.programExpectations && (
                          <div className="space-y-2">
                            <p className="font-medium text-sm">Programme Expectations</p>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {selectedMentorDetails.formData.programExpectations}
                            </p>
                          </div>
                        )}

                        {/* Preferred Mentee Types */}
                        {selectedMentorDetails.formData?.preferredMenteeTypes?.length && (
                          <div className="space-y-3">
                            <p className="font-medium text-sm">Preferred Mentee Types</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedMentorDetails.formData.preferredMenteeTypes.map((type, i) => (
                                <Badge key={i} variant="outline" className="px-3 py-1">
                                  {menteeTypesMap[type] || type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Bottom spacing */}
                  <div className="h-4" />
                </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 py-12">
              <p className="text-muted-foreground">No mentor details available</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mentee Details Sheet */}
      <Sheet open={isMenteeSheetOpen} onOpenChange={setIsMenteeSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
          {/* Fixed Header */}
          <div className="px-8 pt-8 pb-4 border-b bg-background shrink-0">
            <SheetHeader>
              <SheetTitle className="text-2xl">Mentee Profile</SheetTitle>
              <SheetDescription>
                View your mentee's complete profile and background
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Scrollable Content */}
          {isLoadingMenteeDetails ? (
            <div className="flex items-center justify-center flex-1 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedMenteeDetails ? (
            <div className="flex-1 overflow-y-auto">
              <div className="px-8 py-8 space-y-8">
                {/* Profile Header Card */}
                <div className="bg-periwinkle-light rounded-xl p-6">
                  <div className="flex items-start gap-5">
                    <Avatar className="h-20 w-20 border-2 border-periwinkle/20 shadow-md">
                      <AvatarImage src={selectedMenteeDetails.formData?.photoUrl || selectedMenteeDetails.image || undefined} />
                      <AvatarFallback className="text-lg bg-periwinkle/10 text-periwinkle">{getInitials(selectedMenteeDetails.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-semibold mb-1">
                        {selectedMenteeDetails.formData?.fullName || selectedMenteeDetails.name}
                      </h3>
                      {selectedMenteeDetails.formData?.currentJobTitle && (
                        <p className="text-muted-foreground text-base">
                          {selectedMenteeDetails.formData.currentJobTitle}
                          {selectedMenteeDetails.formData.currentIndustry && (
                            <> in <span className="font-medium">
                              {industryOptionsMap[selectedMenteeDetails.formData.currentIndustry] || selectedMenteeDetails.formData.currentIndustry}
                            </span></>
                          )}
                        </p>
                      )}
                      {selectedMenteeDetails.formData?.currentStage && (
                        <Badge variant="secondary" className="mt-2">
                          {careerStageMap[selectedMenteeDetails.formData.currentStage] || selectedMenteeDetails.formData.currentStage}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedMenteeDetails.formData?.city && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-navy-light">
                      <MapPin className="h-5 w-5 text-info shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium">
                          {cityOptionsMap[selectedMenteeDetails.formData.city] || selectedMenteeDetails.formData.city}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedMenteeDetails.formData?.preferredMeetingFormat && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-mint-light">
                      <Globe className="h-5 w-5 text-navy shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Meeting Format</p>
                        <p className="text-sm font-medium">
                          {meetingFormatOptionsMap[selectedMenteeDetails.formData.preferredMeetingFormat] ||
                            selectedMenteeDetails.formData.preferredMeetingFormat}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedMenteeDetails.formData?.mbtiType && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-purple">
                      <Brain className="h-5 w-5 text-brand shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">MBTI Type</p>
                        <p className="text-sm font-medium">{selectedMenteeDetails.formData.mbtiType}</p>
                      </div>
                    </div>
                  )}
                  {(selectedMenteeDetails.formData?.preferredMeetingFrequency || selectedMenteeDetails.preferredMeetingFrequency) && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-periwinkle-light">
                      <Calendar className="h-5 w-5 text-periwinkle shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Meeting Frequency</p>
                        <p className="text-sm font-medium">
                          {meetingFrequencyMap[selectedMenteeDetails.formData?.preferredMeetingFrequency || selectedMenteeDetails.preferredMeetingFrequency || ''] ||
                            selectedMenteeDetails.formData?.preferredMeetingFrequency || selectedMenteeDetails.preferredMeetingFrequency}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bio Section */}
                {(selectedMenteeDetails.formData?.bio || selectedMenteeDetails.bio) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      About
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pl-7">
                      {selectedMenteeDetails.formData?.bio || selectedMenteeDetails.bio}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Skills Section */}
                {(selectedMenteeDetails.formData?.softSkillsExpert?.length ||
                  selectedMenteeDetails.formData?.industrySkillsExpert?.length ||
                  selectedMenteeDetails.formData?.softSkillsBasic?.length ||
                  selectedMenteeDetails.formData?.industrySkillsBasic?.length) && (
                  <div className="space-y-6">
                    {/* Expert Skills */}
                    {(selectedMenteeDetails.formData?.softSkillsExpert?.length || selectedMenteeDetails.formData?.industrySkillsExpert?.length) && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Expert Skills
                        </h4>
                        <div className="flex flex-wrap gap-2 pl-7">
                          {selectedMenteeDetails.formData?.softSkillsExpert?.map((skill, i) => (
                            <Badge key={`soft-expert-${i}`} variant="default" className="px-3 py-1">{skill}</Badge>
                          ))}
                          {selectedMenteeDetails.formData?.industrySkillsExpert?.map((skill, i) => (
                            <Badge key={`industry-expert-${i}`} variant="default" className="px-3 py-1">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills to Develop */}
                    {(selectedMenteeDetails.formData?.softSkillsBasic?.length || selectedMenteeDetails.formData?.industrySkillsBasic?.length) && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          Skills to Develop
                        </h4>
                        <div className="flex flex-wrap gap-2 pl-7">
                          {selectedMenteeDetails.formData?.softSkillsBasic?.map((skill, i) => (
                            <Badge key={`soft-basic-${i}`} variant="secondary" className="px-3 py-1">{skill}</Badge>
                          ))}
                          {selectedMenteeDetails.formData?.industrySkillsBasic?.map((skill, i) => (
                            <Badge key={`industry-basic-${i}`} variant="secondary" className="px-3 py-1">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Industry Interests */}
                {selectedMenteeDetails.formData?.preferredIndustries?.length && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Industry Interests
                    </h4>
                    <div className="flex flex-wrap gap-2 pl-7">
                      {selectedMenteeDetails.formData.preferredIndustries.map((industry, i) => (
                        <Badge key={i} variant="outline" className="px-3 py-1">
                          {industryOptionsMap[industry] || industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goals Section */}
                {(selectedMenteeDetails.formData?.shortTermGoals ||
                  selectedMenteeDetails.formData?.longTermGoals ||
                  selectedMenteeDetails.formData?.whyMentor ||
                  selectedMenteeDetails.formData?.programExpectations) && (
                  <>
                    <Separator />

                    <div className="space-y-6">
                      <h4 className="font-semibold text-lg">Goals & Expectations</h4>

                      {/* Goals */}
                      {(selectedMenteeDetails.formData?.shortTermGoals || selectedMenteeDetails.formData?.longTermGoals) && (
                        <div className="space-y-4 bg-muted/30 rounded-xl p-5">
                          <p className="font-medium text-sm">Career Goals</p>
                          {selectedMenteeDetails.formData?.shortTermGoals && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Short-term Goals</p>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedMenteeDetails.formData.shortTermGoals}
                              </p>
                            </div>
                          )}
                          {selectedMenteeDetails.formData?.longTermGoals && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Long-term Goals</p>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedMenteeDetails.formData.longTermGoals}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Why They Need a Mentor */}
                      {selectedMenteeDetails.formData?.whyMentor && (
                        <div className="space-y-2">
                          <p className="font-medium text-sm">Why They Need Mentorship</p>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {selectedMenteeDetails.formData.whyMentor}
                          </p>
                        </div>
                      )}

                      {/* Programme Expectations */}
                      {selectedMenteeDetails.formData?.programExpectations && (
                        <div className="space-y-2">
                          <p className="font-medium text-sm">Program Expectations</p>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {selectedMenteeDetails.formData.programExpectations}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Bottom spacing */}
                <div className="h-4" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 py-12">
              <p className="text-muted-foreground">No mentee details available</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
