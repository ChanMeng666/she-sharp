'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from 'lucide-react';

interface MatchSuggestion {
  id: number;
  mentorUserId: number;
  menteeUserId: number;
  mentorName: string;
  mentorEmail: string;
  menteeName: string;
  menteeEmail: string;
  overallScore: number;
  mbtiScore?: number;
  skillScore?: number;
  goalScore?: number;
  industryScore?: number;
  matchingFactors: {
    mbti?: { mentorType: string; menteeType: string; compatibilityReason: string };
    skills?: { matchedSkills: string[]; complementarySkills: string[] };
    goals?: { alignedGoals: string[]; mentorCanHelp: string[] };
    industry?: { mentorIndustries: string[]; menteePreferred: string[]; overlap: string[] };
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface MatchingRun {
  id: number;
  triggeredBy: number;
  totalMentees: number;
  totalMentors: number;
  matchesCreated: number;
  averageScore: number;
  completedAt: string;
}

interface MatchingStats {
  pendingMatches: number;
  approvedMatches: number;
  rejectedMatches: number;
  activeRelationships: number;
  averageMatchScore: number;
}

export default function MatchingManagementPage() {
  const [loading, setLoading] = useState(true);
  const [pendingMatches, setPendingMatches] = useState<MatchSuggestion[]>([]);
  const [runHistory, setRunHistory] = useState<MatchingRun[]>([]);
  const [stats, setStats] = useState<MatchingStats | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState<number[]>([]);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchSuggestion | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/matching');
      if (response.ok) {
        const data = await response.json();
        setPendingMatches(data.pendingMatches || []);
        setRunHistory(data.runHistory || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch matching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBatchMatching = async () => {
    setIsRunning(true);
    setError('');
    try {
      const response = await fetch('/api/admin/matching', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
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
        setPendingMatches(prev =>
          prev.filter(m => m.id !== selectedMatch.id)
        );
        setReviewDialog(false);
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            AI Matching Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Run AI-powered matching and review mentor-mentee suggestions
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
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Run Matching
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingMatches.length}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.approvedMatches || 0}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.rejectedMatches || 0}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeRelationships || 0}</p>
                <p className="text-xs text-muted-foreground">Active Pairs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.averageMatchScore?.toFixed(0) || 0}%</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Matches
            {pendingMatches.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingMatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingMatches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Matches</h3>
                <p className="text-muted-foreground mb-4">
                  Run the matching algorithm to generate new mentor-mentee suggestions.
                </p>
                <Button onClick={runBatchMatching} disabled={isRunning}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run Matching
                </Button>
              </CardContent>
            </Card>
          ) : (
            pendingMatches.map(match => {
              const isExpanded = expandedMatches.includes(match.id);
              return (
                <Card key={match.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold">{match.mentorName}</p>
                              <p className="text-xs text-muted-foreground">Mentor</p>
                            </div>
                          </div>
                          <div className="text-foreground font-bold">→</div>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{match.menteeName}</p>
                              <p className="text-xs text-muted-foreground">Mentee</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getScoreColor(match.overallScore)}>
                            {match.overallScore.toFixed(0)}% Match
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Generated {new Date(match.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(match.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      {/* Score Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {match.mbtiScore !== undefined && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Brain className="h-4 w-4 text-foreground" />
                              <span className="text-sm font-medium">MBTI</span>
                            </div>
                            <p className="text-lg font-bold">{match.mbtiScore.toFixed(0)}%</p>
                          </div>
                        )}
                        {match.skillScore !== undefined && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Skills</span>
                            </div>
                            <p className="text-lg font-bold">{match.skillScore.toFixed(0)}%</p>
                          </div>
                        )}
                        {match.goalScore !== undefined && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Heart className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium">Goals</span>
                            </div>
                            <p className="text-lg font-bold">{match.goalScore.toFixed(0)}%</p>
                          </div>
                        )}
                        {match.industryScore !== undefined && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Briefcase className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Industry</span>
                            </div>
                            <p className="text-lg font-bold">{match.industryScore.toFixed(0)}%</p>
                          </div>
                        )}
                      </div>

                      {/* Matching Factors */}
                      <div className="space-y-4 mb-6">
                        {match.matchingFactors.mbti && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">MBTI Compatibility</h4>
                            <div className="flex items-center gap-3 text-sm">
                              <Badge variant="outline">{match.matchingFactors.mbti.mentorType}</Badge>
                              <span>×</span>
                              <Badge variant="outline">{match.matchingFactors.mbti.menteeType}</Badge>
                              <span className="text-muted-foreground">
                                {match.matchingFactors.mbti.compatibilityReason}
                              </span>
                            </div>
                          </div>
                        )}
                        {match.matchingFactors.skills?.matchedSkills && match.matchingFactors.skills.matchedSkills.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Matched Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {match.matchingFactors.skills.matchedSkills.map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {match.matchingFactors.goals?.alignedGoals && match.matchingFactors.goals.alignedGoals.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Aligned Goals</h4>
                            <div className="flex flex-wrap gap-1">
                              {match.matchingFactors.goals.alignedGoals.map(goal => (
                                <Badge key={goal} variant="outline" className="text-xs">
                                  {goal}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => handleReview(match, 'reject')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleReview(match, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Match
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
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
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <Sparkles className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            Run #{run.id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(run.completedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{run.totalMentees}</p>
                          <p className="text-muted-foreground">Mentees</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{run.totalMentors}</p>
                          <p className="text-muted-foreground">Mentors</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-green-600">{run.matchesCreated}</p>
                          <p className="text-muted-foreground">Matches</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{run.averageScore?.toFixed(0) || 0}%</p>
                          <p className="text-muted-foreground">Avg Score</p>
                        </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Match
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? `This will create an official mentorship relationship between ${selectedMatch?.mentorName} and ${selectedMatch?.menteeName}.`
                : `This will reject the suggested match between ${selectedMatch?.mentorName} and ${selectedMatch?.menteeName}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Notes {reviewAction === 'reject' && '(Required)'}
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
              className={
                reviewAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
