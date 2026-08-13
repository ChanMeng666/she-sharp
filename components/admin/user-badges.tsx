'use client';

import { Ban, CheckCircle, Clock, UserPlus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { industryOptions, labelMap } from '@/lib/mentorship/vocab';

// Industry mapping, shared with the mentor/mentee application forms.
const INDUSTRY_OPTIONS: Record<string, string> = labelMap(industryOptions);

/** Turns a stored industry key into its display label. */
export const formatIndustry = (industry: string | null): string => {
  if (!industry) return 'N/A';
  return INDUSTRY_OPTIONS[industry] || industry;
};

export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-badge-admin-bg text-badge-admin-fg';
    case 'mentor':
      return 'bg-badge-mentor-bg text-badge-mentor-fg';
    case 'mentee':
      return 'bg-badge-mentee-bg text-badge-mentee-fg';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getMembershipBadgeColor = (tier: string) => {
  switch (tier) {
    case 'premium':
      return 'bg-brand text-brand-foreground';
    case 'basic':
      return 'bg-badge-info-bg text-badge-info-fg';
    case 'free':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-badge-success-bg text-badge-success-fg text-xs"><CheckCircle className="w-3 h-3 mr-1 text-badge-success-icon" />Active</Badge>;
    case 'inactive':
      return <Badge className="bg-muted text-muted-foreground text-xs">Inactive</Badge>;
    case 'suspended':
      return <Badge className="bg-destructive/10 text-destructive text-xs"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>;
    case 'pending_registration':
      return <Badge className="bg-badge-info-bg text-badge-info-fg text-xs"><UserPlus className="w-3 h-3 mr-1" />Pending Registration</Badge>;
    default:
      return null;
  }
};

export const getApplicationBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-badge-success-bg text-badge-success-fg text-xs"><CheckCircle className="w-3 h-3 mr-1 text-badge-success-icon" />Approved</Badge>;
    case 'pending':
      return <Badge className="bg-badge-info-bg text-badge-info-fg text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case 'rejected':
      return <Badge className="bg-destructive/10 text-destructive text-xs"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
    default:
      return null;
  }
};

export const getMentorStatusBadge = (status: string) => {
  // These indicate whether the mentor is accepting new mentees, not account status
  const variants = {
    active: { text: 'Accepting', className: 'bg-mint/20 text-mint-dark border border-mint/30', icon: <UserPlus className="w-3 h-3 mr-1" /> },
    busy: { text: 'At Capacity', className: 'bg-badge-warning-bg text-badge-warning-fg', icon: <Clock className="w-3 h-3 mr-1" /> },
    paused: { text: 'Not Accepting', className: 'bg-muted text-muted-foreground', icon: <Ban className="w-3 h-3 mr-1" /> },
  };
  const variant = variants[status as keyof typeof variants] || variants.paused;
  return <Badge className={cn("text-xs", variant.className)}>{variant.icon}{variant.text}</Badge>;
};
