'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  RefreshCw,
  Loader2,
  Inbox,
  Phone,
  ClipboardCheck,
  CalendarCheck,
  CheckCircle,
  UserCheck,
  Zap,
} from 'lucide-react';
import ApplicationsTable from '@/components/admin/applications-table';
import RecruitmentPipeline from '@/components/admin/recruitment-pipeline';

// Application type matching the volunteer_form_submissions schema
export interface Application {
  id: number;
  type: 'ambassador' | 'volunteer' | 'ex_ambassador';
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  recruitmentStage: string;
  submittedAt: string | null;
  createdAt: string;
  aiScreeningResult: {
    summary: string;
    recommendation: 'accept' | 'interview' | 'reject';
    confidence: number;
    strengths: string[];
    concerns: string[];
    reasoning: string;
  } | null;
  aiScreenedAt: string | null;
  organisation: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  skillSets: string | null;
  currentStatus: string | null;
  adminNotes: string | null;
}

// Stage configuration for display
const STAGES = [
  { key: 'new', label: 'New', icon: Inbox, color: 'bg-gray-100 text-gray-700' },
  { key: 'contacted', label: 'Contacted', icon: Phone, color: 'bg-blue-100 text-blue-700' },
  { key: 'screening', label: 'Screening', icon: ClipboardCheck, color: 'bg-yellow-100 text-yellow-700' },
  { key: 'interview_scheduled', label: 'Interview', icon: CalendarCheck, color: 'bg-purple-100 text-purple-700' },
  { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  { key: 'onboarding', label: 'Onboarding', icon: UserCheck, color: 'bg-orange-100 text-orange-700' },
  { key: 'active', label: 'Active', icon: Zap, color: 'bg-emerald-100 text-emerald-700' },
] as const;

export default function RecruitmentDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (stageFilter !== 'all') params.set('stage', stageFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const response = await fetch(`/api/admin/recruitment?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch recruitment data:', error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, stageFilter, searchQuery]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle stage change from pipeline drag-and-drop
  const handleStageChange = async (id: number, newStage: string) => {
    try {
      const response = await fetch(`/api/admin/recruitment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruitmentStage: newStage }),
      });
      if (response.ok) {
        setApplications(prev =>
          prev.map(app =>
            app.id === id ? { ...app, recruitmentStage: newStage } : app
          )
        );
      }
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  };

  // Count applications by stage
  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage.key] = applications.filter(a => a.recruitmentStage === stage.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {STAGES.map(stage => {
          const Icon = stage.icon;
          return (
            <Card key={stage.key} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStageFilter(stageFilter === stage.key ? 'all' : stage.key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{stage.label}</span>
                </div>
                <p className="text-2xl font-bold">{stageCounts[stage.key] || 0}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="applications" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="applications">
              <Users className="h-4 w-4 mr-2" />
              Applications
              {applications.length > 0 && (
                <Badge variant="secondary" className="ml-2">{applications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pipeline">
              Pipeline
            </TabsTrigger>
          </TabsList>

          <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ambassador">Ambassador</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="ex_ambassador">Ex-Ambassador</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="interview_requested">Interview Requested</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
                <p className="text-muted-foreground">
                  {typeFilter !== 'all' || stageFilter !== 'all' || searchQuery
                    ? 'Try adjusting your filters to see more results.'
                    : 'No recruitment applications have been submitted yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ApplicationsTable applications={applications} onRefresh={fetchApplications} />
          )}
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RecruitmentPipeline
              applications={applications}
              onStageChange={handleStageChange}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
