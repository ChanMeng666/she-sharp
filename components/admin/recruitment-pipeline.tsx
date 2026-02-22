'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Application } from '@/components/admin/recruitment-dashboard';

interface RecruitmentPipelineProps {
  applications: Application[];
  onStageChange: (id: number, newStage: string) => void;
}

// Pipeline columns configuration
const PIPELINE_COLUMNS = [
  { key: 'new', label: 'New', color: 'border-t-gray-400' },
  { key: 'contacted', label: 'Contacted', color: 'border-t-blue-400' },
  { key: 'screening', label: 'Screening', color: 'border-t-yellow-400' },
  { key: 'interview_scheduled', label: 'Interview', color: 'border-t-purple-400' },
  { key: 'approved', label: 'Approved', color: 'border-t-green-400' },
  { key: 'onboarding', label: 'Onboarding', color: 'border-t-orange-400' },
  { key: 'active', label: 'Active', color: 'border-t-emerald-400' },
] as const;

// Type badge colors
function getTypeBadgeClass(type: string): string {
  switch (type) {
    case 'ambassador':
      return 'bg-purple-100 text-purple-700';
    case 'volunteer':
      return 'bg-blue-100 text-blue-700';
    case 'ex_ambassador':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// Format type label
function formatType(type: string): string {
  switch (type) {
    case 'ambassador':
      return 'Ambassador';
    case 'volunteer':
      return 'Volunteer';
    case 'ex_ambassador':
      return 'Ex-Ambassador';
    default:
      return type;
  }
}

// Relative date formatting
function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// AI recommendation badge
function getRecommendationBadge(result: Application['aiScreeningResult']) {
  if (!result) return null;
  switch (result.recommendation) {
    case 'accept':
      return <Badge className="bg-green-100 text-green-700 text-[10px]">AI: Accept</Badge>;
    case 'interview':
      return <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">AI: Interview</Badge>;
    case 'reject':
      return <Badge className="bg-red-100 text-red-700 text-[10px]">AI: Reject</Badge>;
    default:
      return null;
  }
}

// Sortable pipeline card
function PipelineCard({ application }: { application: Application }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `app-${application.id}`,
    data: { application },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-background rounded-lg border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <p className="font-medium text-sm truncate">
        {application.firstName} {application.lastName}
      </p>
      <div className="flex flex-wrap items-center gap-1 mt-1.5">
        <Badge className={`${getTypeBadgeClass(application.type)} text-[10px] px-1.5 py-0`}>
          {formatType(application.type)}
        </Badge>
        {getRecommendationBadge(application.aiScreeningResult)}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">
        {formatRelativeDate(application.submittedAt || application.createdAt)}
      </p>
    </div>
  );
}

// Static card for drag overlay
function PipelineCardOverlay({ application }: { application: Application }) {
  return (
    <div className="p-3 bg-background rounded-lg border-2 border-brand shadow-lg w-56">
      <p className="font-medium text-sm truncate">
        {application.firstName} {application.lastName}
      </p>
      <div className="flex flex-wrap items-center gap-1 mt-1.5">
        <Badge className={`${getTypeBadgeClass(application.type)} text-[10px] px-1.5 py-0`}>
          {formatType(application.type)}
        </Badge>
      </div>
    </div>
  );
}

export default function RecruitmentPipeline({ applications, onStageChange }: RecruitmentPipelineProps) {
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Group applications by stage
  const columnData = PIPELINE_COLUMNS.map(col => ({
    ...col,
    applications: applications.filter(a => a.recruitmentStage === col.key),
  }));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const app = active.data.current?.application as Application | undefined;
    if (app) {
      setActiveApplication(app);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveApplication(null);
    const { active, over } = event;

    if (!over) return;

    const draggedApp = active.data.current?.application as Application | undefined;
    if (!draggedApp) return;

    // Determine which column was dropped on
    const overId = String(over.id);
    let targetStage: string | null = null;

    // Check if dropped on a column directly
    if (overId.startsWith('column-')) {
      targetStage = overId.replace('column-', '');
    } else if (overId.startsWith('app-')) {
      // Dropped on another card - find which column that card is in
      const targetAppId = parseInt(overId.replace('app-', ''), 10);
      const targetApp = applications.find(a => a.id === targetAppId);
      if (targetApp) {
        targetStage = targetApp.recruitmentStage;
      }
    }

    if (targetStage && targetStage !== draggedApp.recruitmentStage) {
      onStageChange(draggedApp.id, targetStage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columnData.map(column => (
          <div
            key={column.key}
            id={`column-${column.key}`}
            className={`flex-shrink-0 w-56 bg-muted/30 rounded-lg border border-t-4 ${column.color}`}
          >
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {column.applications.length}
                </Badge>
              </div>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              <SortableContext
                items={column.applications.map(a => `app-${a.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {column.applications.map(app => (
                  <PipelineCard key={app.id} application={app} />
                ))}
              </SortableContext>
              {column.applications.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                  Drop here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeApplication ? (
          <PipelineCardOverlay application={activeApplication} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
