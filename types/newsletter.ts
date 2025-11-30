/**
 * Newsletter type definitions for She Sharp media content
 */

import { LucideIcon } from 'lucide-react';

export interface Newsletter {
  slug: string;
  month: string;
  year: string;
  title?: string;
  coverImage: string;
  pdfUrl?: string;
  webUrl?: string;
  highlights: string[];
  isFeatured?: boolean;
  issueNumber?: number;
}

export interface NewsletterTopic {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface RecentIssue {
  slug: string;
  edition: string;
  title: string;
  highlights: string[];
  readTime: string;
  category: string;
  icon: LucideIcon;
}
