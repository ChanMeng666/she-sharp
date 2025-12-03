'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Users,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Brain,
  Target,
  Heart,
  Briefcase,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Zap,
  Database,
  Info,
  UserPlus,
  Timer,
  GraduationCap,
  Building2,
  Mail,
  Calendar,
  Video,
  MessageSquare,
  Star,
} from 'lucide-react';

interface MentorProfileDetails {
  bio?: string | null;
  mbtiType?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  yearsExperience?: number | null;
  city?: string | null;
  maxMentees: number;
  currentMenteesCount: number;
  expertiseAreas?: string[];
  softSkillsExpert?: string[];
  industrySkillsExpert?: string[];
  preferredIndustries?: string[];
  preferredMeetingFormat?: string | null;
}

interface MenteeProfileDetails {
  bio?: string | null;
  mbtiType?: string | null;
  careerStage?: string | null;
  currentJobTitle?: string | null;
  currentIndustry?: string | null;
  city?: string | null;
  learningGoals?: string[];
  softSkillsBasic?: string[];
  industrySkillsBasic?: string[];
  preferredIndustries?: string[];
  longTermGoals?: string | null;
  shortTermGoals?: string | null;
  whyMentor?: string | null;
  preferredMeetingFormat?: string | null;
  currentChallenge?: string | null;
}

interface MatchSuggestion {
  id: number;
  mentorUserId: number;
  menteeUserId: number;
  mentorName: string;
  mentorEmail: string;
  mentorImage?: string | null;
  menteeName: string;
  menteeEmail: string;
  menteeImage?: string | null;
  overallScore: number;
  mbtiCompatibilityScore?: number;
  skillMatchScore?: number;
  goalAlignmentScore?: number;
  industryMatchScore?: number;
  logisticsScore?: number;
  aiExplanation?: string;
  aiRecommendation?: string;
  confidenceLevel?: 'high' | 'medium' | 'low';
  potentialChallenges?: string[];
  suggestedFocusAreas?: string[];
  matchingFactors?: {
    strengths?: string[];
    challenges?: string[];
    growthOpportunities?: string[];
  };
  status: string;
  createdAt: string;
  mentorProfile: MentorProfileDetails;
  menteeProfile: MenteeProfileDetails;
}

interface MentorWithCandidates {
  mentorUserId: number;
  mentorName: string;
  mentorEmail: string;
  company: string | null;
  jobTitle: string | null;
  currentMentees: number;
  maxMentees: number;
  availableSlots: number;
  candidates: MatchSuggestion[];
}

interface QueueEntry {
  id: number;
  menteeUserId: number;
  menteeName: string;
  menteeEmail: string;
  joinedAt: string;
  status: string;
  priority: number;
  bestMatchScore: number | null;
  matchAttempts: number;
  waitDays: number;
  preferredIndustries: string[];
  careerStage: string | null;
}

interface UnmatchedMentor {
  userId: number;
  name: string;
  email: string;
  image: string | null;
  company: string | null;
  jobTitle: string | null;
  yearsExperience: number | null;
  mbtiType: string | null;
  maxMentees: number;
  currentMenteesCount: number;
  availableSlots: number;
  expertiseAreas: string[];
  preferredIndustries: string[];
  city: string | null;
  createdAt: string;
}

interface UnmatchedMentee {
  userId: number;
  name: string;
  email: string;
  image: string | null;
  careerStage: string | null;
  currentJobTitle: string | null;
  currentIndustry: string | null;
  mbtiType: string | null;
  preferredIndustries: string[];
  city: string | null;
  createdAt: string;
  inQueue: boolean;
  queuePosition: number | null;
}

interface MatchingStats {
  pendingMatches: number;
  approvedMatches: number;
  rejectedMatches: number;
  activeRelationships: number;
  averageMatchScore: number;
  queueLength: number;
  averageWaitDays: number;
  highPriorityCount: number;
  mentorCapacity?: {
    totalMentors: number;
    totalCapacity: number;
    availableSlots: number;
  };
}

interface MatchingRun {
  id: number;
  runType: string;
  status: string;
  triggeredBy?: number;
  menteesProcessed: number;
  matchesGenerated: number;
  totalApiCalls?: number;
  totalTokensUsed?: number;
  averageProcessingTimeMs?: number;
  createdAt: string;
  completedAt?: string;
  summary?: {
    averageScore?: number;
    cacheHits?: number;
    queueUpdates?: number;
    errors?: string[];
  };
}

interface SystemStatus {
  openaiConfigured: boolean;
  redisAvailable: boolean;
  cacheInfo?: {
    available: boolean;
    matchCacheCount?: number;
  };
}

export default function MatchingManagementPage() {
  const [loading, setLoading] = useState(true);
  const [matchesData, setMatchesData] = useState<{
    type: 'list' | 'grouped';
    matches?: MatchSuggestion[];
    mentors?: MentorWithCandidates[];
  } | null>(null);
  const [runHistory, setRunHistory] = useState<MatchingRun[]>([]);
  const [stats, setStats] = useState<MatchingStats | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [unmatchedMentors, setUnmatchedMentors] = useState<UnmatchedMentor[]>([]);
  const [unmatchedMentees, setUnmatchedMentees] = useState<UnmatchedMentee[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState<number[]>([]);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchSuggestion | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/matching?view=${viewMode}&includeQueue=true&includeUnmatched=true`);
      if (response.ok) {
        const data = await response.json();
        setMatchesData(data.matches);
        setRunHistory(data.runHistory || []);
        setStats(data.stats || null);
        setSystemStatus(data.systemStatus || null);
        if (data.queue) {
          setQueueEntries(data.queue.entries || []);
          setQueueTotal(data.queue.total || 0);
        }
        if (data.unmatched) {
          setUnmatchedMentors(data.unmatched.mentors || []);
          setUnmatchedMentees(data.unmatched.mentees || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch matching data:', error);
      setError('Failed to load matching data');
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runBatchMatching = async () => {
    setIsRunning(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/admin/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyOnMatch: false }),
      });
      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(
          `Generated ${data.matchesGenerated} matches from ${data.totalProcessed} mentees. ` +
          `API calls: ${data.totalApiCalls}, Tokens used: ${data.totalTokensUsed}`
        );
        await fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to run matching');
      }
    } catch (error) {
      setError('Failed to run matching algorithm');
    } finally {
      setIsRunning(false);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedMatches(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleReview = (match: MatchSuggestion, action: 'approve' | 'reject') => {
    setSelectedMatch(match);
    setReviewAction(action);
    setReviewDialog(true);
    setReviewNotes('');
  };

  const submitReview = async () => {
    if (!selectedMatch || !reviewAction) return;

    try {
      const response = await fetch('/api/admin/matching', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          decision: reviewAction === 'approve' ? 'approved' : 'rejected',
          notes: reviewNotes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        setReviewDialog(false);
        await fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to process review');
      }
    } catch (error) {
      setError('Failed to submit review');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-foreground text-background';
    if (score >= 60) return 'bg-muted text-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const getConfidenceBadge = (level?: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-foreground text-background">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-muted text-foreground">Medium Confidence</Badge>;
      case 'low':
        return <Badge className="bg-muted text-muted-foreground">Low Confidence</Badge>;
      default:
        return null;
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

  const formatMeetingPreference = (format?: string | null) => {
    if (!format) return 'Not specified';
    switch (format) {
      case 'online': return 'Online Only';
      case 'in_person': return 'In Person Only';
      case 'both': return 'Online & In Person';
      default: return format;
    }
  };

  const renderMatchCard = (match: MatchSuggestion) => {
    const isExpanded = expandedMatches.includes(match.id);
    const mentor = match.mentorProfile;
    const mentee = match.menteeProfile;

    return (
      <Card key={match.id} className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Main Match Header */}
              <div className="flex items-center gap-4 mb-3">
                {/* Mentor Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-muted">
                    <AvatarImage src={match.mentorImage || undefined} alt={match.mentorName} />
                    <AvatarFallback className="bg-muted text-foreground font-semibold">
                      {getInitials(match.mentorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-base">{match.mentorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {mentor?.jobTitle || 'Mentor'}
                      {mentor?.company && ` @ ${mentor.company}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {mentor?.mbtiType && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {mentor.mbtiType}
                        </Badge>
                      )}
                      {mentor?.yearsExperience && (
                        <span className="text-[10px] text-muted-foreground">
                          {mentor.yearsExperience} yrs exp
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Arrow */}
                <div className="flex flex-col items-center px-3">
                  <Badge className={`${getScoreColor(match.overallScore)} font-bold`}>
                    {match.overallScore.toFixed(0)}%
                  </Badge>
                  <TrendingUp className="h-4 w-4 text-[#9b2e83] mt-1" />
                </div>

                {/* Mentee Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-muted">
                    <AvatarImage src={match.menteeImage || undefined} alt={match.menteeName} />
                    <AvatarFallback className="bg-muted text-foreground font-semibold">
                      {getInitials(match.menteeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-base">{match.menteeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {mentee?.currentJobTitle || mentee?.careerStage || 'Mentee'}
                      {mentee?.currentIndustry && ` in ${mentee.currentIndustry}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {mentee?.mbtiType && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {mentee.mbtiType}
                        </Badge>
                      )}
                      {mentee?.city && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {mentee.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {getConfidenceBadge(match.confidenceLevel)}
                {(mentor?.city && mentee?.city && mentor.city === mentee.city) && (
                  <Badge variant="outline" className="text-foreground border-muted bg-muted/50 text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Same City
                  </Badge>
                )}
                {(mentor?.preferredMeetingFormat && mentee?.preferredMeetingFormat &&
                  (mentor.preferredMeetingFormat === mentee.preferredMeetingFormat ||
                   mentor.preferredMeetingFormat === 'both' || mentee.preferredMeetingFormat === 'both')) && (
                  <Badge variant="outline" className="text-foreground border-muted bg-muted/50 text-xs">
                    <Video className="h-3 w-3 mr-1" />
                    Meeting Compatible
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {new Date(match.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(match.id)}
              className="ml-2"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-6">
            {/* Detailed Profile Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mentor Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Users className="h-4 w-4" />
                  Mentor Profile
                </h4>
                <div className="p-4 bg-muted/50 rounded-lg border border-muted space-y-3">
                  {mentor?.bio && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Bio</p>
                      <p className="text-sm">{mentor.bio}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Capacity</p>
                      <p>{mentor?.currentMenteesCount || 0}/{mentor?.maxMentees || 3} mentees</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Location</p>
                      <p>{mentor?.city || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Meeting</p>
                      <p>{formatMeetingPreference(mentor?.preferredMeetingFormat)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Experience</p>
                      <p>{mentor?.yearsExperience ? `${mentor.yearsExperience} years` : 'Not specified'}</p>
                    </div>
                  </div>
                  {(mentor?.softSkillsExpert && mentor.softSkillsExpert.length > 0) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Expert Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {mentor.softSkillsExpert.slice(0, 5).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {mentor.industrySkillsExpert?.slice(0, 3).map((skill, i) => (
                          <Badge key={`ind-${i}`} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(mentor?.preferredIndustries && mentor.preferredIndustries.length > 0) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Preferred Industries</p>
                      <p className="text-sm">{mentor.preferredIndustries.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mentee Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <GraduationCap className="h-4 w-4" />
                  Mentee Profile
                </h4>
                <div className="p-4 bg-muted/50 rounded-lg border border-muted space-y-3">
                  {mentee?.bio && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Bio</p>
                      <p className="text-sm">{mentee.bio}</p>
                    </div>
                  )}
                  {mentee?.currentChallenge && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Current Challenge</p>
                      <p className="text-sm">{mentee.currentChallenge}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Career Stage</p>
                      <p>{mentee?.careerStage?.replace(/_/g, ' ') || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Location</p>
                      <p>{mentee?.city || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Meeting</p>
                      <p>{formatMeetingPreference(mentee?.preferredMeetingFormat)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Industry</p>
                      <p>{mentee?.currentIndustry || 'Not specified'}</p>
                    </div>
                  </div>
                  {(mentee?.softSkillsBasic && mentee.softSkillsBasic.length > 0) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Skills to Develop</p>
                      <div className="flex flex-wrap gap-1">
                        {mentee.softSkillsBasic.slice(0, 5).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {mentee.industrySkillsBasic?.slice(0, 3).map((skill, i) => (
                          <Badge key={`ind-${i}`} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {mentee?.shortTermGoals && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Short-term Goals</p>
                      <p className="text-sm">{mentee.shortTermGoals}</p>
                    </div>
                  )}
                  {mentee?.longTermGoals && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Long-term Goals</p>
                      <p className="text-sm">{mentee.longTermGoals}</p>
                    </div>
                  )}
                  {mentee?.whyMentor && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Why Seeking Mentor</p>
                      <p className="text-sm">{mentee.whyMentor}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* AI Explanation */}
            {match.aiExplanation && (
              <div className="p-4 bg-[#f4f4fa] rounded-lg border border-[#8982ff]/20">
                <div className="flex items-start gap-2">
                  <Brain className="h-5 w-5 text-[#8982ff] mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">AI Analysis</p>
                    <p className="text-sm text-muted-foreground">{match.aiExplanation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Recommendation */}
            {match.aiRecommendation && (
              <div className="p-4 bg-[#f7e5f3] rounded-lg border border-[#9b2e83]/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-[#9b2e83] mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Recommendation</p>
                    <p className="text-sm text-muted-foreground">{match.aiRecommendation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Score Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {match.mbtiCompatibilityScore !== undefined && (
                  <div className="p-3 bg-[#f4f4fa] rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="h-4 w-4 text-[#8982ff]" />
                      <span className="text-xs font-medium">MBTI</span>
                    </div>
                    <Progress value={match.mbtiCompatibilityScore} className="h-2 mb-1" />
                    <p className="text-sm font-bold">{match.mbtiCompatibilityScore.toFixed(0)}%</p>
                  </div>
                )}
                {match.skillMatchScore !== undefined && (
                  <div className="p-3 bg-[#eaf2ff] rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-[#1378d1]" />
                      <span className="text-xs font-medium">Skills</span>
                    </div>
                    <Progress value={match.skillMatchScore} className="h-2 mb-1" />
                    <p className="text-sm font-bold">{match.skillMatchScore.toFixed(0)}%</p>
                  </div>
                )}
                {match.goalAlignmentScore !== undefined && (
                  <div className="p-3 bg-[#f7e5f3] rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-[#9b2e83]" />
                      <span className="text-xs font-medium">Goals</span>
                    </div>
                    <Progress value={match.goalAlignmentScore} className="h-2 mb-1" />
                    <p className="text-sm font-bold">{match.goalAlignmentScore.toFixed(0)}%</p>
                  </div>
                )}
                {match.industryMatchScore !== undefined && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-4 w-4 text-[#1f1e44]" />
                      <span className="text-xs font-medium">Industry</span>
                    </div>
                    <Progress value={match.industryMatchScore} className="h-2 mb-1" />
                    <p className="text-sm font-bold">{match.industryMatchScore.toFixed(0)}%</p>
                  </div>
                )}
                {match.logisticsScore !== undefined && (
                  <div className="p-3 bg-[#effefb] rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-[#1f1e44]" />
                      <span className="text-xs font-medium">Logistics</span>
                    </div>
                    <Progress value={match.logisticsScore} className="h-2 mb-1" />
                    <p className="text-sm font-bold">{match.logisticsScore.toFixed(0)}%</p>
                  </div>
                )}
              </div>
            </div>

            {/* Matching Factors */}
            <div className="grid md:grid-cols-3 gap-4">
              {match.matchingFactors?.strengths && match.matchingFactors.strengths.length > 0 && (
                <div className="p-3 bg-[#effefb] rounded-lg border border-[#b1f6e9]/50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-[#9b2e83]" />
                    <span className="text-sm font-medium text-foreground">Strengths</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {match.matchingFactors.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {match.matchingFactors?.challenges && match.matchingFactors.challenges.length > 0 && (
                <div className="p-3 bg-[#d72f40]/5 rounded-lg border border-[#d72f40]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-[#d72f40]" />
                    <span className="text-sm font-medium text-foreground">Challenges</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {match.matchingFactors.challenges.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {match.matchingFactors?.growthOpportunities && match.matchingFactors.growthOpportunities.length > 0 && (
                <div className="p-3 bg-[#eaf2ff] rounded-lg border border-[#1378d1]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-[#1378d1]" />
                    <span className="text-sm font-medium text-foreground">Growth Areas</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {match.matchingFactors.growthOpportunities.map((g, i) => (
                      <li key={i}>• {g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => handleReview(match, 'reject')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="default"
                onClick={() => handleReview(match, 'approve')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Match
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  const pendingCount = matchesData?.type === 'list'
    ? matchesData.matches?.length || 0
    : matchesData?.mentors?.reduce((sum, m) => sum + m.candidates.length, 0) || 0;

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              AI Matching Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              GPT-4o-mini powered mentor-mentee matching with intelligent analysis
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchData}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={runBatchMatching}
              disabled={isRunning}
              variant="brand"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running AI Matching...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run AI Matching
                </>
              )}
            </Button>
          </div>
        </div>

        {/* System Status */}
        {systemStatus && (
          <div className="flex gap-4 flex-wrap">
            <Tooltip>
              <TooltipTrigger>
                <Badge variant={systemStatus.openaiConfigured ? 'default' : 'destructive'} className="gap-1">
                  <Zap className="h-3 w-3" />
                  OpenAI: {systemStatus.openaiConfigured ? 'Active' : 'Not Configured'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {systemStatus.openaiConfigured
                  ? 'GPT-4o-mini is configured and ready'
                  : 'Set OPENAI_API_KEY to enable AI matching'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant={systemStatus.redisAvailable ? 'default' : 'secondary'} className="gap-1">
                  <Database className="h-3 w-3" />
                  Cache: {systemStatus.redisAvailable ? `${systemStatus.cacheInfo?.matchCacheCount || 0} entries` : 'Disabled'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {systemStatus.redisAvailable
                  ? 'Redis caching is reducing API costs'
                  : 'Set UPSTASH_REDIS_URL to enable caching'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="border-[#b1f6e9] bg-[#effefb]">
            <CheckCircle className="h-4 w-4 text-[#9b2e83]" />
            <AlertDescription className="text-foreground">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Stats Summary */}
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#1378d1]" />
            <span className="text-[#1378d1] font-medium">Pending</span>
            <span className="font-bold text-lg">{pendingCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#9b2e83]" />
            <span className="text-[#9b2e83] font-medium">Approved</span>
            <span className="font-bold text-lg">{stats?.approvedMatches || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Rejected</span>
            <span className="font-bold text-lg">{stats?.rejectedMatches || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#1f1e44]" />
            <span className="text-[#1f1e44] font-medium">Active</span>
            <span className="font-bold text-lg">{stats?.activeRelationships || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#8982ff]" />
            <span className="text-[#8982ff] font-medium">Avg Score</span>
            <span className="font-bold text-lg">{stats?.averageMatchScore?.toFixed(0) || 0}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-[#1378d1]" />
            <span className="text-[#1378d1] font-medium">In Queue</span>
            <span className="font-bold text-lg">{stats?.queueLength || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#9b2e83]" />
            <span className="text-[#9b2e83] font-medium">Slots Open</span>
            <span className="font-bold text-lg">{stats?.mentorCapacity?.availableSlots || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#d72f40]" />
            <span className="text-[#d72f40] font-medium">High Priority</span>
            <span className="font-bold text-lg">{stats?.highPriorityCount || 0}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="unmatched" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="unmatched">
                Unmatched Users
                {(unmatchedMentors.length + unmatchedMentees.length) > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unmatchedMentors.length + unmatchedMentees.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending Matches
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="queue">
                Waiting Queue
                {queueTotal > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {queueTotal}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">Run History</TabsTrigger>
            </TabsList>

            {/* View Toggle for Pending Matches */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grouped')}
              >
                By Mentor
              </Button>
            </div>
          </div>

          <TabsContent value="unmatched" className="space-y-4">
            {unmatchedMentors.length === 0 && unmatchedMentees.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Users Matched</h3>
                  <p className="text-muted-foreground">
                    All mentors and mentees have been matched or are in the matching queue.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Unmatched Mentors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#9b2e83]" />
                      Available Mentors
                    </CardTitle>
                    <CardDescription>
                      {unmatchedMentors.length} mentor{unmatchedMentors.length !== 1 ? 's' : ''} with available capacity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {unmatchedMentors.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No available mentors</p>
                    ) : (
                      <div className="space-y-3">
                        {unmatchedMentors.map(mentor => (
                          <div
                            key={mentor.userId}
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border">
                                <AvatarImage src={mentor.image || undefined} alt={mentor.name} />
                                <AvatarFallback className="bg-muted text-foreground font-semibold">
                                  {getInitials(mentor.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{mentor.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {mentor.jobTitle || 'Mentor'}
                                  {mentor.company && ` @ ${mentor.company}`}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {mentor.mbtiType && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      {mentor.mbtiType}
                                    </Badge>
                                  )}
                                  {mentor.city && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {mentor.city}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-[#9b2e83] text-white">
                                {mentor.availableSlots} slot{mentor.availableSlots !== 1 ? 's' : ''}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {mentor.currentMenteesCount}/{mentor.maxMentees} mentees
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(mentor.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Unmatched Mentees */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-[#1378d1]" />
                      Unmatched Mentees
                    </CardTitle>
                    <CardDescription>
                      {unmatchedMentees.length} mentee{unmatchedMentees.length !== 1 ? 's' : ''} awaiting matches
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {unmatchedMentees.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No unmatched mentees</p>
                    ) : (
                      <div className="space-y-3">
                        {unmatchedMentees.map(mentee => (
                          <div
                            key={mentee.userId}
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border">
                                <AvatarImage src={mentee.image || undefined} alt={mentee.name} />
                                <AvatarFallback className="bg-muted text-foreground font-semibold">
                                  {getInitials(mentee.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{mentee.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {mentee.currentJobTitle || mentee.careerStage?.replace(/_/g, ' ') || 'Mentee'}
                                  {mentee.currentIndustry && ` in ${mentee.currentIndustry}`}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {mentee.mbtiType && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      {mentee.mbtiType}
                                    </Badge>
                                  )}
                                  {mentee.city && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {mentee.city}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {mentee.inQueue ? (
                                <Badge className="bg-[#1378d1] text-white">
                                  Queue #{mentee.queuePosition}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Not in queue
                                </Badge>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Joined {new Date(mentee.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Call to Action */}
            {(unmatchedMentors.length > 0 || unmatchedMentees.length > 0) && (
              <Card className="border-[#9b2e83]/20 bg-[#f7e5f3]/30">
                <CardContent className="py-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-8 w-8 text-[#9b2e83]" />
                      <div>
                        <h3 className="font-semibold">Ready to Match?</h3>
                        <p className="text-sm text-muted-foreground">
                          Run the AI matching algorithm to generate match suggestions for these users.
                        </p>
                      </div>
                    </div>
                    <Button onClick={runBatchMatching} disabled={isRunning} variant="brand">
                      {isRunning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Run AI Matching
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingCount === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Matches</h3>
                  <p className="text-muted-foreground mb-4">
                    Run the AI matching algorithm to generate new mentor-mentee suggestions.
                  </p>
                  <Button onClick={runBatchMatching} disabled={isRunning} variant="brand">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run AI Matching
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'list' && matchesData?.matches ? (
              matchesData.matches.map(match => renderMatchCard(match))
            ) : viewMode === 'grouped' && matchesData?.mentors ? (
              matchesData.mentors.map(mentor => (
                <Card key={mentor.mentorUserId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-foreground" />
                          {mentor.mentorName}
                        </CardTitle>
                        <CardDescription>
                          {mentor.jobTitle}{mentor.company && ` at ${mentor.company}`}
                          <br />
                          Capacity: {mentor.currentMentees}/{mentor.maxMentees} mentees
                          ({mentor.availableSlots} slots available)
                        </CardDescription>
                      </div>
                      <Badge variant={mentor.availableSlots > 0 ? 'default' : 'secondary'}>
                        {mentor.candidates.length} candidate{mentor.candidates.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mentor.candidates.map(match => renderMatchCard(match))}
                  </CardContent>
                </Card>
              ))
            ) : null}
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            {queueEntries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
                  <p className="text-muted-foreground">
                    No mentees are currently waiting in the matching queue.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Mentees Waiting for Matches</CardTitle>
                  <CardDescription>
                    {queueTotal} mentee{queueTotal !== 1 ? 's' : ''} waiting • Average wait: {stats?.averageWaitDays || 0} days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {queueEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{entry.menteeName}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.careerStage || 'Career stage not specified'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-semibold">{entry.priority}</p>
                            <p className="text-muted-foreground text-xs">Priority</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{entry.waitDays}</p>
                            <p className="text-muted-foreground text-xs">Days</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{entry.matchAttempts}</p>
                            <p className="text-muted-foreground text-xs">Attempts</p>
                          </div>
                          {entry.bestMatchScore && (
                            <Badge className={getScoreColor(entry.bestMatchScore)}>
                              Best: {entry.bestMatchScore.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {runHistory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Matching History</h3>
                  <p className="text-muted-foreground">
                    Run the matching algorithm to see history here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Matching Runs</CardTitle>
                  <CardDescription>
                    History of AI matching algorithm executions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {runHistory.map(run => (
                      <div
                        key={run.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-muted">
                            <Sparkles className="h-5 w-5 text-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Run #{run.id}
                              <Badge variant="outline" className="ml-2">
                                {run.runType}
                              </Badge>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {run.completedAt
                                ? new Date(run.completedAt).toLocaleString()
                                : new Date(run.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-semibold">{run.menteesProcessed}</p>
                            <p className="text-muted-foreground text-xs">Processed</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{run.matchesGenerated}</p>
                            <p className="text-muted-foreground text-xs">Matches</p>
                          </div>
                          {run.totalApiCalls !== undefined && (
                            <div className="text-center">
                              <p className="font-semibold">{run.totalApiCalls}</p>
                              <p className="text-muted-foreground text-xs">API Calls</p>
                            </div>
                          )}
                          {run.totalTokensUsed !== undefined && (
                            <div className="text-center">
                              <p className="font-semibold">{run.totalTokensUsed.toLocaleString()}</p>
                              <p className="text-muted-foreground text-xs">Tokens</p>
                            </div>
                          )}
                          {run.summary?.averageScore !== undefined && (
                            <div className="text-center">
                              <p className="font-semibold">{run.summary.averageScore.toFixed(0)}%</p>
                              <p className="text-muted-foreground text-xs">Avg Score</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {reviewAction === 'approve' ? (
                  <CheckCircle className="h-5 w-5 text-foreground" />
                ) : (
                  <XCircle className="h-5 w-5 text-foreground" />
                )}
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Match
              </DialogTitle>
              <DialogDescription>
                {reviewAction === 'approve'
                  ? `This will create an official mentorship relationship between ${selectedMatch?.mentorName} and ${selectedMatch?.menteeName}. Both parties will be notified via email.`
                  : `This will reject the suggested match between ${selectedMatch?.mentorName} and ${selectedMatch?.menteeName}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Notes {reviewAction === 'reject' && <span className="text-foreground">*</span>}
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Optional: Add any notes about this match...'
                      : 'Please provide a reason for rejection...'
                  }
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                disabled={reviewAction === 'reject' && !reviewNotes.trim()}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              >
                {reviewAction === 'approve' ? 'Approve & Notify' : 'Reject Match'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
