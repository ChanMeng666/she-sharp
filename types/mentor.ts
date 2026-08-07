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
  /**
   * Approximate, taken from each mentor's own bio. Surfaced by the chatbot
   * (lib/chatbot/tools.ts), so it does reach visitors — treat it as the
   * mentor's own claim about themselves rather than a measured figure.
   */
  yearsOfExperience: number;
  languages: string[];
  linkedIn?: string;
  email?: string;
  bio?: string;
  achievements?: string[];
  availability?: MentorAvailability;
}

/*
 * `menteeCount` and `rating` used to live here. Every mentor carried a mentee
 * count and a score to one decimal place — 4.8, 5.0 — and there was never any
 * system that produced them: no feedback form, no pairing record, nothing. No
 * component read them either, so nothing visible changed when they went. They
 * are removed rather than left dormant because the next person to build a
 * "top-rated mentors" list would have found ready-made data sitting there and
 * had no way to know it was invented. If real ratings are ever collected, add
 * the fields back alongside whatever produces them.
 */

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