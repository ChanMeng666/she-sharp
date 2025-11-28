// Industry types - strictly typed for compile-time validation
export const INDUSTRIES = [
  'Technology',
  'Business & Management',
  'Healthcare',
  'Education',
  'Consulting',
  'Finance',
  'Engineering',
  'Research & Development',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

// Availability types
export type MentorAvailability = 'available' | 'busy' | 'unavailable';

export interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  image: string;
  description: string;
  expertise: string[];
  industry: Industry;
  yearsOfExperience: number;
  languages: string[];
  linkedIn?: string;
  email?: string;
  bio?: string;
  achievements?: string[];
  menteeCount?: number;
  rating?: number;
  availability?: MentorAvailability;
}

export interface MentorCategory {
  id: string;
  name: string;
  icon?: string;
  mentorCount: number;
}

// Category icon mapping for dynamic generation
export const CATEGORY_ICONS: Record<string, string> = {
  'technology': '💻',
  'business': '💼',
  'healthcare': '🏥',
  'education': '📚',
  'consulting': '🤝',
  'finance': '💰',
  'engineering': '⚙️',
  'research': '🔬',
};