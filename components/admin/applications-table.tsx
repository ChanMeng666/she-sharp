'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Brain } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import type { Application } from '@/components/admin/recruitment-dashboard';
import {
  getStageBadgeClass,
  getTypeBadgeClass,
  formatRecruitmentType,
  formatRecruitmentStage as formatStage,
} from '@/lib/recruitment/stages';

interface ApplicationsTableProps {
  applications: Application[];
  onRefresh: () => void;
}

// The table's type column is narrow, so it renders the abbreviated labels.
const formatType = (type: string) => formatRecruitmentType(type, { short: true });

function getAIScoreBadge(result: Application['aiScreeningResult']) {
  if (!result) return <span className="text-xs text-muted-foreground">--</span>;
  const pct = Math.round(result.confidence * 100);
  const colorClass = result.recommendation === 'accept'
    ? 'text-green-700'
    : result.recommendation === 'interview'
      ? 'text-yellow-700'
      : 'text-red-700';
  return (
    <span className={`text-xs font-medium ${colorClass}`}>
      {pct}%
    </span>
  );
}

export default function ApplicationsTable({ applications, onRefresh }: ApplicationsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStage, setBulkStage] = useState<string>('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const allSelected = selectedIds.size === applications.length && applications.length > 0;
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map(a => a.id)));
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bulk stage update
  const handleBulkUpdate = async () => {
    if (!bulkStage || selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/admin/recruitment/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recruitmentStage: bulkStage }),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      setBulkStage('');
      onRefresh();
    } catch (error) {
      console.error('Failed to bulk update:', error);
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {someSelected && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Select value={bulkStage} onValueChange={setBulkStage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Move to stage..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleBulkUpdate}
            disabled={!bulkStage || bulkUpdating}
          >
            {bulkUpdating && <Spinner className="mr-2" />}
            Update
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {applications.map(app => (
          <div key={app.id} className="p-4 rounded-lg border bg-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.has(app.id)}
                  onCheckedChange={() => toggleOne(app.id)}
                  aria-label={`Select ${app.firstName} ${app.lastName}`}
                />
                <div>
                  <p className="font-medium text-sm">{app.firstName} {app.lastName}</p>
                  <p className="text-xs text-muted-foreground break-all">{app.email}</p>
                </div>
              </div>
              <Link href={`/dashboard/admin/recruitment/${app.id}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${getTypeBadgeClass(app.type)} text-xs`}>
                {formatType(app.type)}
              </Badge>
              <Badge className={`${getStageBadgeClass(app.recruitmentStage)} text-xs`}>
                {formatStage(app.recruitmentStage)}
              </Badge>
              {app.aiScreeningResult ? (
                getAIScoreBadge(app.aiScreeningResult)
              ) : null}
              <span className="text-xs text-muted-foreground ml-auto">
                {app.submittedAt
                  ? new Date(app.submittedAt).toLocaleDateString()
                  : new Date(app.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium">Email</th>
              <th className="p-3 text-left font-medium">Type</th>
              <th className="p-3 text-left font-medium">Stage</th>
              <th className="p-3 text-left font-medium">Submitted</th>
              <th className="p-3 text-center font-medium">AI</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <Checkbox
                    checked={selectedIds.has(app.id)}
                    onCheckedChange={() => toggleOne(app.id)}
                    aria-label={`Select ${app.firstName} ${app.lastName}`}
                  />
                </td>
                <td className="p-3 font-medium">
                  {app.firstName} {app.lastName}
                </td>
                <td className="p-3 text-muted-foreground">
                  {app.email}
                </td>
                <td className="p-3">
                  <Badge className={`${getTypeBadgeClass(app.type)} text-xs`}>
                    {formatType(app.type)}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge className={`${getStageBadgeClass(app.recruitmentStage)} text-xs`}>
                    {formatStage(app.recruitmentStage)}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {app.submittedAt
                    ? new Date(app.submittedAt).toLocaleDateString()
                    : new Date(app.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 text-center">
                  {app.aiScreeningResult ? (
                    getAIScoreBadge(app.aiScreeningResult)
                  ) : (
                    <Brain className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                  )}
                </td>
                <td className="p-3 text-right">
                  <Link href={`/dashboard/admin/recruitment/${app.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
