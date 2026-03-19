'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
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
  Plus,
  Loader2,
  Users,
  Calendar,
  Building2,
  CheckCircle,
  Edit,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';

interface ProgrammeStats {
  menteeApplications: number;
  mentorCount: number;
  activeRelationships: number;
  pendingApplications: number;
}

interface Programme {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  applicationDeadline: string | null;
  maxMentees: number | null;
  currentMenteeCount: number;
  requiresPayment: boolean;
  partnerOrganisation: string | null;
  createdAt: string;
  stats: ProgrammeStats;
}

interface ProgrammeMentor {
  id: number;
  mentorUserId: number;
  name: string | null;
  email: string;
  company: string | null;
  jobTitle: string | null;
  maxMenteesInProgramme: number | null;
  currentMenteesInProgramme: number;
  assignedAt: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-200 text-gray-500',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProgrammeManagementPage() {
  const [programmesList, setProgrammesList] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMentorsDialog, setShowMentorsDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [programmeMentors, setProgrammeMentors] = useState<ProgrammeMentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formMaxMentees, setFormMaxMentees] = useState('');
  const [formRequiresPayment, setFormRequiresPayment] = useState(true);
  const [formPartner, setFormPartner] = useState('');

  const fetchProgrammes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/programmes');
      const data = await res.json();
      setProgrammesList(data.programmes || []);
    } catch (error) {
      console.error('Error fetching programmes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgrammes();
  }, [fetchProgrammes]);

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormStatus('draft');
    setFormStartDate('');
    setFormEndDate('');
    setFormDeadline('');
    setFormMaxMentees('');
    setFormRequiresPayment(true);
    setFormPartner('');
  };

  const openCreate = () => {
    resetForm();
    setEditingProgramme(null);
    setShowCreateDialog(true);
  };

  const openEdit = (p: Programme) => {
    setEditingProgramme(p);
    setFormName(p.name);
    setFormSlug(p.slug);
    setFormDescription(p.description || '');
    setFormStatus(p.status);
    setFormStartDate(p.startDate ? p.startDate.split('T')[0] : '');
    setFormEndDate(p.endDate ? p.endDate.split('T')[0] : '');
    setFormDeadline(p.applicationDeadline ? p.applicationDeadline.split('T')[0] : '');
    setFormMaxMentees(p.maxMentees?.toString() || '');
    setFormRequiresPayment(p.requiresPayment);
    setFormPartner(p.partnerOrganisation || '');
    setShowCreateDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        name: formName,
        slug: formSlug,
        description: formDescription || null,
        status: formStatus,
        startDate: formStartDate || null,
        endDate: formEndDate || null,
        applicationDeadline: formDeadline || null,
        maxMentees: formMaxMentees ? parseInt(formMaxMentees) : null,
        requiresPayment: formRequiresPayment,
        partnerOrganisation: formPartner || null,
      };

      if (editingProgramme) {
        await fetch(`/api/admin/programmes/${editingProgramme.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/admin/programmes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      setShowCreateDialog(false);
      fetchProgrammes();
    } catch (error) {
      console.error('Error saving programme:', error);
    } finally {
      setSaving(false);
    }
  };

  const openMentors = async (p: Programme) => {
    setSelectedProgramme(p);
    setShowMentorsDialog(true);
    setMentorsLoading(true);
    try {
      const res = await fetch(`/api/admin/programmes/${p.id}/mentors`);
      const data = await res.json();
      setProgrammeMentors(data.mentors || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setMentorsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedProgramme) return;
    setCompleting(true);
    try {
      await fetch(`/api/admin/programmes/${selectedProgramme.id}/complete`, {
        method: 'POST',
      });
      setShowCompleteDialog(false);
      fetchProgrammes();
    } catch (error) {
      console.error('Error completing programme:', error);
    } finally {
      setCompleting(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editingProgramme) {
      setFormSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programme Management</h1>
          <p className="text-muted-foreground">
            Manage mentorship programmes, assign mentors, and track progress
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Programme
        </Button>
      </div>

      {/* Programme Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programmesList.map((p) => (
          <Card key={p.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  {p.partnerOrganisation && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {p.partnerOrganisation}
                    </div>
                  )}
                </div>
                <Badge className={statusColors[p.status] || 'bg-gray-100'}>
                  {p.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date range */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(p.startDate)} &mdash; {formatDate(p.endDate)}
              </div>

              {/* Capacity bar */}
              {p.maxMentees && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mentees</span>
                    <span className="font-medium">
                      {p.currentMenteeCount}/{p.maxMentees}
                    </span>
                  </div>
                  <Progress
                    value={(p.currentMenteeCount / p.maxMentees) * 100}
                    className="h-2"
                  />
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{p.stats.mentorCount} mentors</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{p.stats.activeRelationships} active</span>
                </div>
              </div>

              {/* Payment */}
              <div className="text-xs text-muted-foreground">
                {p.requiresPayment ? 'Requires payment' : 'Free (no payment required)'}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => openMentors(p)}>
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Mentors
                </Button>
                {(p.status === 'active' || p.status === 'closed') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700"
                    onClick={() => {
                      setSelectedProgramme(p);
                      setShowCompleteDialog(true);
                    }}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {programmesList.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No programmes yet. Create your first programme to get started.
          </div>
        )}
      </div>

      {/* Create/Edit Programme Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProgramme ? 'Edit Programme' : 'Create Programme'}
            </DialogTitle>
            <DialogDescription>
              {editingProgramme ? 'Update programme details.' : 'Set up a new mentorship programme.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prog-name">Name *</Label>
              <Input
                id="prog-name"
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., HER WAKA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prog-slug">Slug *</Label>
              <Input
                id="prog-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g., her-waka"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs: /mentorship/mentee/apply?programme={formSlug || '...'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prog-desc">Description</Label>
              <Textarea
                id="prog-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Programme description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prog-partner">Partner Organisation</Label>
              <Input
                id="prog-partner"
                value={formPartner}
                onChange={(e) => setFormPartner(e.target.value)}
                placeholder="e.g., Ministry of Social Development"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prog-start">Start Date</Label>
                <Input
                  id="prog-start"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prog-end">End Date</Label>
                <Input
                  id="prog-end"
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prog-deadline">Application Deadline</Label>
              <Input
                id="prog-deadline"
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prog-max">Max Mentees</Label>
                <Input
                  id="prog-max"
                  type="number"
                  value={formMaxMentees}
                  onChange={(e) => setFormMaxMentees(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prog-status">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Requires Payment</Label>
                <p className="text-xs text-muted-foreground">
                  When off, mentees skip payment silently
                </p>
              </div>
              <Switch
                checked={formRequiresPayment}
                onCheckedChange={setFormRequiresPayment}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName || !formSlug}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProgramme ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Mentors Dialog */}
      <Dialog open={showMentorsDialog} onOpenChange={setShowMentorsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Mentors &mdash; {selectedProgramme?.name}
            </DialogTitle>
            <DialogDescription>
              Assigned mentors for this programme. Use the admin matching page to assign new mentors.
            </DialogDescription>
          </DialogHeader>

          {mentorsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : programmeMentors.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {programmeMentors.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">{m.name || m.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {m.jobTitle}{m.company ? ` at ${m.company}` : ''}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {m.currentMenteesInProgramme}/{m.maxMenteesInProgramme ?? '?'} mentees
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No mentors assigned yet.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Programme Confirmation */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Complete Programme
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will end all active mentorship relationships in the{' '}
              <strong>{selectedProgramme?.name}</strong> programme. Affected mentees and mentors
              will be notified. This action cannot be undone.
              {selectedProgramme && (
                <div className="mt-3 space-y-1 text-sm">
                  <div>Active relationships: {selectedProgramme.stats.activeRelationships}</div>
                  <div>Assigned mentors: {selectedProgramme.stats.mentorCount}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              disabled={completing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {completing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete Programme
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
