'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Brain,
  Save,
  Mail,
  Phone,
  Linkedin,
  Building2,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface ApplicationData {
  id: number;
  type: 'ambassador' | 'volunteer' | 'ex_ambassador';
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  recruitmentStage: string;
  submittedAt: string | null;
  createdAt: string;
  currentStatus: string | null;
  currentStatusOther: string | null;
  organisation: string | null;
  howHeardAbout: string | null;
  howHeardAboutOption: string | null;
  howHeardAboutOther: string | null;
  skillSets: string | null;
  linkedinUrl: string | null;
  itIndustryInterest: string | null;
  volunteerHoursPerWeek: string | null;
  cvUrl: string | null;
  cvFileName: string | null;
  eventsPerYear: string | null;
  currentRoleTitle: string | null;
  joinedSheSharpYear: number | null;
  leftRoleYear: number | null;
  stillAmbassador: boolean | null;
  experienceRating: string | null;
  mostValuablePart: string | null;
  mostValuablePartOther: string | null;
  wouldRecommend: boolean | null;
  wantFeatured: boolean | null;
  preferredCommunication: string | null;
  additionalComments: string | null;
  adminNotes: string | null;
  interviewNotes: string | null;
  interviewRequestedBy: string | null;
  interviewScheduledAt: string | null;
  reviewNotes: string | null;
  aiScreeningResult: {
    summary: string;
    recommendation: 'accept' | 'interview' | 'reject';
    confidence: number;
    strengths: string[];
    concerns: string[];
    reasoning: string;
  } | null;
  aiScreenedAt: string | null;
}

interface ApplicationDetailProps {
  id: number;
}

// Stage badge styling
function getStageBadgeClass(stage: string): string {
  switch (stage) {
    case 'new': return 'bg-gray-100 text-gray-700';
    case 'contacted': return 'bg-blue-100 text-blue-700';
    case 'screening': return 'bg-yellow-100 text-yellow-700';
    case 'interview_requested': return 'bg-indigo-100 text-indigo-700';
    case 'interview_scheduled': return 'bg-purple-100 text-purple-700';
    case 'approved': return 'bg-green-100 text-green-700';
    case 'rejected': return 'bg-red-100 text-red-700';
    case 'onboarding': return 'bg-orange-100 text-orange-700';
    case 'nda_sent': return 'bg-sky-100 text-sky-700';
    case 'nda_signed': return 'bg-teal-100 text-teal-700';
    case 'active': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

// Type badge styling
function getTypeBadgeClass(type: string): string {
  switch (type) {
    case 'ambassador': return 'bg-purple-100 text-purple-700';
    case 'volunteer': return 'bg-blue-100 text-blue-700';
    case 'ex_ambassador': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function formatType(type: string): string {
  switch (type) {
    case 'ambassador': return 'Ambassador';
    case 'volunteer': return 'Volunteer';
    case 'ex_ambassador': return 'Ex-Ambassador';
    default: return type;
  }
}

function formatStage(stage: string): string {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function ApplicationDetail({ id }: ApplicationDetailProps) {
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/recruitment/${id}`);
      if (response.ok) {
        const data = await response.json();
        setApplication(data.application);
        setSelectedStage(data.application.recruitmentStage);
        setAdminNotes(data.application.adminNotes || '');
      } else {
        setError('Failed to load application details.');
      }
    } catch (err) {
      console.error('Failed to fetch application:', err);
      setError('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  // Update recruitment stage
  const handleStageUpdate = async () => {
    if (!application || selectedStage === application.recruitmentStage) return;
    setUpdatingStage(true);
    try {
      const response = await fetch(`/api/admin/recruitment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruitmentStage: selectedStage }),
      });
      if (response.ok) {
        setApplication(prev => prev ? { ...prev, recruitmentStage: selectedStage } : null);
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    } finally {
      setUpdatingStage(false);
    }
  };

  // Save admin notes
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/admin/recruitment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (response.ok) {
        setApplication(prev => prev ? { ...prev, adminNotes } : null);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Trigger AI screening
  const handleAIScreening = async () => {
    setScreeningLoading(true);
    try {
      const response = await fetch(`/api/admin/recruitment/${id}/ai-screen`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchApplication();
      }
    } catch (err) {
      console.error('Failed to run AI screening:', err);
    } finally {
      setScreeningLoading(false);
    }
  };

  // Submit approve/reject review
  const handleSubmitReview = async () => {
    if (!reviewAction) return;
    setSubmittingReview(true);
    try {
      const newStage = reviewAction === 'approve' ? 'approved' : 'rejected';
      const response = await fetch(`/api/admin/recruitment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruitmentStage: newStage,
          reviewNotes: reviewNotes,
        }),
      });
      if (response.ok) {
        setReviewDialog(false);
        setReviewNotes('');
        await fetchApplication();
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Application Not Found</h3>
          <p className="text-muted-foreground mb-4">{error || 'The application could not be loaded.'}</p>
          <Link href="/dashboard/admin/recruitment">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/admin/recruitment">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Recruitment
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {application.firstName} {application.lastName}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getTypeBadgeClass(application.type)}>
              {formatType(application.type)}
            </Badge>
            <Badge className={getStageBadgeClass(application.recruitmentStage)}>
              {formatStage(application.recruitmentStage)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{application.email}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setReviewAction('reject'); setReviewDialog(true); }}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() => { setReviewAction('approve'); setReviewDialog(true); }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Application Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{application.email}</p>
                  </div>
                </div>
                {application.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{application.phone}</p>
                    </div>
                  </div>
                )}
                {application.linkedinUrl && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">LinkedIn</p>
                      <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-brand hover:underline">
                        View Profile
                      </a>
                    </div>
                  </div>
                )}
                {application.organisation && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Organisation</p>
                      <p className="text-sm">{application.organisation}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Details</CardTitle>
              <CardDescription>
                Submitted {application.submittedAt
                  ? new Date(application.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : new Date(application.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.currentStatus && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Current Status</p>
                  <p className="text-sm capitalize">
                    {application.currentStatus.replace(/_/g, ' ')}
                    {application.currentStatusOther && ` - ${application.currentStatusOther}`}
                  </p>
                </div>
              )}

              {application.skillSets && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Skills</p>
                  <p className="text-sm">{application.skillSets}</p>
                </div>
              )}

              {application.howHeardAbout && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">How They Heard About Us</p>
                  <p className="text-sm">{application.howHeardAbout}</p>
                </div>
              )}

              {application.howHeardAboutOption && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Referral Source</p>
                  <p className="text-sm capitalize">
                    {application.howHeardAboutOption.replace(/_/g, ' ')}
                    {application.howHeardAboutOther && ` - ${application.howHeardAboutOther}`}
                  </p>
                </div>
              )}

              {application.preferredCommunication && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Preferred Communication</p>
                  <p className="text-sm capitalize">{application.preferredCommunication.replace(/_/g, ' ')}</p>
                </div>
              )}

              <Separator />

              {/* Type-specific fields */}
              {application.type === 'ambassador' && (
                <>
                  {application.itIndustryInterest && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">IT Industry Interest</p>
                      <p className="text-sm">{application.itIndustryInterest}</p>
                    </div>
                  )}
                  {application.volunteerHoursPerWeek && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Volunteer Hours/Week</p>
                      <p className="text-sm">{application.volunteerHoursPerWeek}</p>
                    </div>
                  )}
                  {application.cvUrl && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">CV/Resume</p>
                        <a href={application.cvUrl} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-brand hover:underline">
                          {application.cvFileName || 'Download CV'}
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

              {application.type === 'volunteer' && application.eventsPerYear && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Events Per Year</p>
                  <p className="text-sm">{application.eventsPerYear}</p>
                </div>
              )}

              {application.type === 'ex_ambassador' && (
                <>
                  {application.currentRoleTitle && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Current Role</p>
                      <p className="text-sm">{application.currentRoleTitle}</p>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {application.joinedSheSharpYear && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Joined She Sharp</p>
                        <p className="text-sm">{application.joinedSheSharpYear}</p>
                      </div>
                    )}
                    {application.leftRoleYear && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Left Role</p>
                        <p className="text-sm">{application.leftRoleYear}</p>
                      </div>
                    )}
                  </div>
                  {application.experienceRating && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Experience Rating</p>
                      <p className="text-sm capitalize">{application.experienceRating.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {application.mostValuablePart && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Most Valuable Part</p>
                      <p className="text-sm capitalize">
                        {application.mostValuablePart.replace(/_/g, ' ')}
                        {application.mostValuablePartOther && ` - ${application.mostValuablePartOther}`}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-6">
                    {application.wouldRecommend !== null && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Would Recommend</p>
                        <p className="text-sm">{application.wouldRecommend ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {application.wantFeatured !== null && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Wants to be Featured</p>
                        <p className="text-sm">{application.wantFeatured ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {application.additionalComments && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Additional Comments</p>
                    <p className="text-sm">{application.additionalComments}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* AI Screening Results */}
          {application.aiScreeningResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-brand" />
                  AI Screening Result
                </CardTitle>
                <CardDescription>
                  Screened on {application.aiScreenedAt
                    ? new Date(application.aiScreenedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Unknown date'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={
                    application.aiScreeningResult.recommendation === 'accept'
                      ? 'bg-green-100 text-green-700'
                      : application.aiScreeningResult.recommendation === 'interview'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }>
                    {application.aiScreeningResult.recommendation.charAt(0).toUpperCase() +
                      application.aiScreeningResult.recommendation.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {Math.round(application.aiScreeningResult.confidence * 100)}%
                  </span>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                  <p className="text-sm">{application.aiScreeningResult.summary}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Reasoning</p>
                  <p className="text-sm">{application.aiScreeningResult.reasoning}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {application.aiScreeningResult.strengths.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs font-medium text-green-700 mb-2">Strengths</p>
                      <ul className="text-sm space-y-1">
                        {application.aiScreeningResult.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {application.aiScreeningResult.concerns.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-xs font-medium text-red-700 mb-2">Concerns</p>
                      <ul className="text-sm space-y-1">
                        {application.aiScreeningResult.concerns.map((c, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Actions Panel */}
        <div className="space-y-6">
          {/* Stage Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pipeline Stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview_requested">Interview Requested</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="nda_sent">NDA Sent</SelectItem>
                  <SelectItem value="nda_signed">NDA Signed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleStageUpdate}
                disabled={updatingStage || selectedStage === application.recruitmentStage}
                className="w-full"
              >
                {updatingStage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Update Stage
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => { setReviewAction('approve'); setReviewDialog(true); }}
              >
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Approve Application
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => { setReviewAction('reject'); setReviewDialog(true); }}
              >
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                Reject Application
              </Button>
              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAIScreening}
                disabled={screeningLoading}
              >
                {screeningLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2 text-brand" />
                )}
                {application.aiScreeningResult ? 'Re-run AI Screening' : 'Run AI Screening'}
              </Button>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Admin Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this application..."
                rows={5}
              />
              <Button
                variant="outline"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="w-full"
              >
                {savingNotes ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {/* Interview Details (if applicable) */}
          {(application.interviewScheduledAt || application.interviewNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.interviewScheduledAt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Scheduled</p>
                    <p className="text-sm">
                      {new Date(application.interviewScheduledAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {application.interviewRequestedBy && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Requested By</p>
                    <p className="text-sm">{application.interviewRequestedBy}</p>
                  </div>
                )}
                {application.interviewNotes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{application.interviewNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Application
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? `Approve ${application.firstName} ${application.lastName}'s ${formatType(application.type).toLowerCase()} application. They will be moved to the approved stage.`
                : `Reject ${application.firstName} ${application.lastName}'s application. Please provide a reason.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Notes {reviewAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <Textarea
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
              onClick={handleSubmitReview}
              disabled={submittingReview || (reviewAction === 'reject' && !reviewNotes.trim())}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {submittingReview && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
