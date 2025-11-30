/**
 * Newsletter data and helper functions for She Sharp media content
 */

import {
  Calendar,
  Clock,
  TrendingUp,
  Lightbulb,
  Users,
  BookOpen,
} from 'lucide-react';
import type { Newsletter, NewsletterTopic, RecentIssue } from '@/types/newsletter';

export const newsletters: Newsletter[] = [
  {
    slug: 'may-2025',
    month: 'May',
    year: '2025',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/685b86a4122d34ad5ed64dae_2025_Newsletters%20may.png',
    webUrl: '#',
    highlights: [
      'AI in Education',
      'Women Tech Leaders Summit',
      'Career Growth Tips',
    ],
    isFeatured: true,
    issueNumber: 9,
  },
  {
    slug: 'april-2025',
    month: 'April',
    year: '2025',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/685b85f36c4d1ad7379ee334_2025_Newsletters%20april.png',
    webUrl: '#',
    highlights: [
      'Cybersecurity Special',
      'Mentorship Programs',
      'Tech Trends 2025',
    ],
    isFeatured: true,
    issueNumber: 8,
  },
  {
    slug: 'march-2025',
    month: 'March',
    year: '2025',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/685b844d30bd2eb9475f129c_2025_Newsletters%20march.png',
    webUrl: '#',
    highlights: [
      "International Women's Day",
      'STEM Scholarships',
      'Industry Insights',
    ],
    isFeatured: false,
    issueNumber: 7,
  },
  {
    slug: 'january-2025',
    month: 'January',
    year: '2025',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c3676dc0772575629f95cd_2025_Newsletters%20feb.png',
    webUrl: '#',
    highlights: [
      'New Year Tech Resolutions',
      '2025 Predictions',
      'Community Highlights',
    ],
    isFeatured: false,
    issueNumber: 6,
  },
  {
    slug: 'december-2024',
    month: 'December',
    year: '2024',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c13b51a3357846351d1e3c_2024_Newsletters%20dec.png',
    webUrl: '#',
    highlights: ['Year in Review', 'Holiday Tech Guide', 'Success Stories'],
    isFeatured: false,
    issueNumber: 5,
  },
  {
    slug: 'november-2024',
    month: 'November',
    year: '2024',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c13bf0b7ff2cc5c326e3f1_2024_Newsletters%20nov.png',
    webUrl: '#',
    highlights: [
      'Tech Conference Recap',
      'Career Advancement',
      'Innovation Spotlight',
    ],
    isFeatured: false,
    issueNumber: 4,
  },
  {
    slug: 'october-2024',
    month: 'October',
    year: '2024',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67230bb566a23c809666d347_2024_Newsletters%20oct.png',
    webUrl: '#',
    highlights: [
      '10th Anniversary Special',
      'Alumni Stories',
      'Future of Tech',
    ],
    isFeatured: false,
    issueNumber: 3,
  },
  {
    slug: 'september-2024',
    month: 'September',
    year: '2024',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66fa574d673d6538804201b6_2024_Newsletters%20sept.png',
    webUrl: '#',
    highlights: [
      'Back to School Tech',
      'Emerging Technologies',
      'Mentor Spotlight',
    ],
    isFeatured: false,
    issueNumber: 2,
  },
  {
    slug: 'august-2024',
    month: 'August',
    year: '2024',
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d7dbadf304d0a9becc2d75_2024_Newsletters%20aug.png',
    webUrl: '#',
    highlights: [
      'Summer Internships',
      'Tech Skills Workshop',
      'Community Events',
    ],
    isFeatured: false,
    issueNumber: 1,
  },
];

export const newsletterTopics: NewsletterTopic[] = [
  {
    icon: TrendingUp,
    title: 'Industry Insights',
    description: 'Latest trends and innovations in tech',
  },
  {
    icon: Users,
    title: 'Community Stories',
    description: 'Inspiring journeys from our members',
  },
  {
    icon: BookOpen,
    title: 'Learning Resources',
    description: 'Curated tools and tutorials',
  },
  {
    icon: Calendar,
    title: 'Event Highlights',
    description: 'Recap of recent events and upcoming opportunities',
  },
];

export const recentIssues: RecentIssue[] = [
  {
    slug: 'november-2024-issue',
    edition: 'November 2024',
    title: 'Breaking Barriers: Women Leading AI Innovation',
    highlights: [
      'Interview with Dr. Sarah Chen on ethical AI',
      '5 AI tools every developer should know',
      'Community spotlight: Auckland AI meetup recap',
    ],
    readTime: '5 min read',
    category: 'Technology',
    icon: TrendingUp,
  },
  {
    slug: 'october-2024-issue',
    edition: 'October 2024',
    title: 'Career Transitions: From Teacher to Tech Leader',
    highlights: [
      "Success story: Maria's journey to Product Management",
      'Top skills for career changers',
      'Free resources for learning to code',
    ],
    readTime: '7 min read',
    category: 'Career',
    icon: Lightbulb,
  },
  {
    slug: 'september-2024-issue',
    edition: 'September 2024',
    title: 'Building Your Personal Brand in Tech',
    highlights: [
      'LinkedIn optimization tips',
      'How to start technical blogging',
      'Networking strategies that actually work',
    ],
    readTime: '6 min read',
    category: 'Professional Development',
    icon: Users,
  },
];

// Helper functions

export function getNewsletterBySlug(slug: string): Newsletter | undefined {
  return newsletters.find((newsletter) => newsletter.slug === slug);
}

export function getNewslettersByYear(year: string): Newsletter[] {
  return newsletters.filter((newsletter) => newsletter.year === year);
}

export function getFeaturedNewsletters(limit?: number): Newsletter[] {
  const featured = newsletters.filter((newsletter) => newsletter.isFeatured);
  return limit ? featured.slice(0, limit) : featured;
}

export function getLatestNewsletters(limit?: number): Newsletter[] {
  const sorted = [...newsletters].sort((a, b) => {
    const dateA = new Date(`${a.month} 1, ${a.year}`);
    const dateB = new Date(`${b.month} 1, ${b.year}`);
    return dateB.getTime() - dateA.getTime();
  });
  return limit ? sorted.slice(0, limit) : sorted;
}

export function getRecentIssues(limit?: number): RecentIssue[] {
  return limit ? recentIssues.slice(0, limit) : recentIssues;
}

export function getAllNewsletterYears(): string[] {
  const years = new Set(newsletters.map((newsletter) => newsletter.year));
  return Array.from(years).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
}

export function getNewsletterStats(): {
  total: number;
  featured: number;
  years: number;
} {
  return {
    total: newsletters.length,
    featured: newsletters.filter((n) => n.isFeatured).length,
    years: getAllNewsletterYears().length,
  };
}

export function getNewsletterTopics(): NewsletterTopic[] {
  return newsletterTopics;
}
