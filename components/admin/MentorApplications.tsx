'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Briefcase,
  Calendar,
  Globe,
  Star,
  MessageSquare,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MentorApplication {
  id: number;
  userId: number | null;
  isPublicApplication: boolean;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  expertiseAreas: string[];
  yearsExperience: number;
  company: string;
  jobTitle: string;
  bio: string;
  linkedinUrl: string;
  availabilityHoursPerMonth: number;
  maxMentees: number;
  mbtiType?: string;
  expectedMenteeGoals?: string;
  programExpectations?: string;
  submittedAt: string;
  reviewedAt?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewNotes?: string;
}

export default function MentorApplications() {
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<MentorApplication | null>(null);
  const [expandedApplications, setExpandedApplications] = useState<number[]>([]);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review'>('pending');

  useEffect(() => {
    fetchApplications();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/mentors/applications?status=${filter}`);

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch mentor applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedApplications((prev) =>
      prev.includes(id)
        ? prev.filter((appId) => appId !== id)
        : [...prev, id]
    );
  };

  const handleReview = (application: MentorApplication, action: 'approve' | 'reject') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewDialog(true);
    setReviewNotes('');
  };

  const submitReview = async () => {
    if (!selectedApplication || !reviewAction) return;

    try {
      const response = await fetch(`/api/admin/mentors/applications/${selectedApplication.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes,
        }),
      });

      if (response.ok) {
        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApplication.id
              ? { ...app, status: reviewAction === 'approve' ? 'approved' : 'rejected', reviewNotes }
              : app
          )
        );
        setReviewDialog(false);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'under_review':
        return 'bg-blue-100 text-blue-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-accent text-foreground';
    }
  };

  const getExperienceLevel = (years: number) => {
    if (years >= 10) return { label: 'Senior', color: 'text-primary' };
    if (years >= 5) return { label: 'Mid-level', color: 'text-blue-600' };
    return { label: 'Junior', color: 'text-green-600' };
  };

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-accent p-1 rounded-lg w-fit">
        {[
          { value: 'pending', label: 'Pending', count: applications.filter(a => a.status === 'pending').length },
          { value: 'under_review', label: 'Under Review', count: applications.filter(a => a.status === 'under_review').length },
          { value: 'all', label: 'All Applications', count: applications.length },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={cn(
              'px-4 py-2 rounded-md transition-colors text-sm font-medium',
              filter === tab.value
                ? 'bg-white text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No mentor applications found</p>
            </CardContent>
          </Card>
        ) : (
          applications.map((application) => {
            const isExpanded = expandedApplications.includes(application.id);
            const experienceLevel = getExperienceLevel(application.yearsExperience);
            
            return (
              <Card key={application.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={application.user.image || undefined} />
                        <AvatarFallback className="bg-muted text-purple-700">
                          {getInitials(application.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 flex-wrap gap-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {application.user.name}
                          </h3>
                          {application.isPublicApplication && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Public Application
                            </Badge>
                          )}
                          <Badge variant="secondary" className={getStatusColor(application.status)}>
                            {application.status.replace('_', ' ')}
                          </Badge>
                          <span className={cn('text-sm font-medium', experienceLevel.color)}>
                            {experienceLevel.label}
                          </span>
                          {application.mbtiType && (
                            <Badge variant="outline" className="text-purple-600 border-purple-200">
                              {application.mbtiType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{application.user.email}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {application.jobTitle} at {application.company}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {application.availabilityHoursPerMonth} hours/month
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(application.submittedAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(application.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Expertise Areas */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">Expertise Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {application.expertiseAreas.map((area) => (
                        <Badge key={area} variant="outline">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Bio */}
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Bio</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{application.bio}</p>
                      </div>

                      {/* Additional Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Years of Experience</p>
                          <p className="text-sm text-muted-foreground">{application.yearsExperience} years</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Max Mentees</p>
                          <p className="text-sm text-muted-foreground">{application.maxMentees} mentees</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">LinkedIn Profile</p>
                          {application.linkedinUrl ? (
                            <a
                              href={application.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:text-purple-700 flex items-center"
                            >
                              <Globe className="w-4 h-4 mr-1" />
                              View Profile
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not provided</span>
                          )}
                        </div>
                      </div>

                      {/* Mentoring Goals */}
                      {application.expectedMenteeGoals && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Goals for Mentees</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{application.expectedMenteeGoals}</p>
                        </div>
                      )}

                      {/* Program Expectations */}
                      {application.programExpectations && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Program Expectations</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{application.programExpectations}</p>
                        </div>
                      )}

                      {/* Public Application Notice */}
                      {application.isPublicApplication && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-900 mb-1">Public Application</p>
                          <p className="text-sm text-blue-700">
                            This applicant has not yet created an account. Upon approval, an invitation
                            code will be generated and sent to their email address.
                          </p>
                        </div>
                      )}

                      {/* Review Notes (if any) */}
                      {application.reviewNotes && (
                        <div className="p-3 bg-accent rounded-lg">
                          <p className="text-sm font-medium text-foreground mb-1">Review Notes</p>
                          <p className="text-sm text-muted-foreground">{application.reviewNotes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {application.status === 'pending' || application.status === 'under_review' ? (
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => handleReview(application, 'reject')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleReview(application, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end pt-4">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-sm px-3 py-1',
                              application.status === 'approved' && 'bg-green-100 text-green-700',
                              application.status === 'rejected' && 'bg-red-100 text-red-700'
                            )}
                          >
                            {application.status === 'approved' ? 'Approved' : 'Rejected'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Mentor Application
            </DialogTitle>
            <DialogDescription>
              You are about to {reviewAction} {selectedApplication?.user.name}'s mentor application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="review-notes" className="text-sm font-medium text-foreground">
                Review Notes {reviewAction === 'reject' && '(Required)'}
              </label>
              <Textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Optional: Add any notes about this approval...'
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
              className={cn(
                reviewAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              )}
            >
              Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}