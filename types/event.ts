// Event status types
export const EVENT_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

// Event format types (online/in-person/hybrid)
export const EVENT_FORMATS = ['online', 'in_person', 'hybrid'] as const;
export type EventFormat = (typeof EVENT_FORMATS)[number];

// Event category types
export const EVENT_CATEGORIES = [
  'workshop',
  'networking',
  'training',
  'social',
  'thrive',
  'conference',
  'webinar',
  'meetup',
  'panel',
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

// Location details
export interface EventLocation {
  format: EventFormat;
  venueName?: string;
  address?: string;
  city?: string;
  mapUrl?: string;
  meetingUrl?: string;
  meetingPlatform?: 'zoom' | 'teams' | 'google-meet' | 'other';
}

// Speaker/Organizer information
export interface EventSpeaker {
  name: string;
  title: string;
  company?: string;
  bio?: string;
  image?: string;
  linkedIn?: string;
}

// Agenda item
export interface AgendaItem {
  time: string;
  title: string;
  description?: string;
  speaker?: string;
  type?: 'keynote' | 'panel' | 'workshop' | 'networking' | 'break';
}

// Registration configuration
export interface EventRegistration {
  isRequired: boolean;
  externalUrl?: string;
  capacity?: number;
  attendeeCount?: number;
  waitlistEnabled?: boolean;
  deadline?: string;
  price?: {
    amount: number;
    currency: string;
  };
  isFree?: boolean;
}

// Main Event interface
export interface Event {
  // Core identification
  slug: string;
  title: string;
  description: string;
  shortDescription?: string;

  // Categorization
  category: EventCategory;
  status: EventStatus;
  isFeatured?: boolean;

  // Date and Time
  startDate: string; // YYYY-MM-DD format
  endDate?: string;
  startTime: string; // HH:mm format
  endTime: string;
  timezone: string;

  // Location
  location: EventLocation;

  // People
  organizer?: EventSpeaker;
  speakers?: EventSpeaker[];

  // Content
  agenda?: AgendaItem[];

  // Registration
  registration?: EventRegistration;

  // Media
  coverImage: string;
  photos?: string[]; // Post-event photos
  attendeeAvatars?: string[]; // For avatar stack display
}
