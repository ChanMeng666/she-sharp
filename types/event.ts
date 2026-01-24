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

// Event sponsor information
export interface EventSponsor {
  name: string;
  logo: string;
  type?: string;
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

// Main Event interface (Legacy - kept for backward compatibility)
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
  albumUrl?: string; // URL to photo album
  attendeeAvatars?: string[]; // For avatar stack display

  // Sponsors
  sponsors?: EventSponsor[];
}

// ============================================
// V3 Event Types (New JSON structure)
// ============================================

// Cover image with alt text
export interface EventCoverImage {
  url: string;
  alt: string;
}

// Speaker in V3 format
export interface EventSpeakerV3 {
  name: string;
  title: string;
  company: string;
  bio: string;
  image: string;
  linkedin: string;
}

// Speaker group with heading
export interface EventSpeakerGroup {
  heading: string;
  speakers: EventSpeakerV3[];
}

// Categorized speakers structure
export interface EventSpeakersV3 {
  keynote_speakers?: EventSpeakerGroup;
  panel_speakers?: EventSpeakerGroup;
  guest_speakers?: EventSpeakerGroup;
  panel_facilitators?: EventSpeakerGroup;
}

// Sponsor in V3 format
export interface EventSponsorV3 {
  name: string;
  logo: string;
}

// Sponsors grouped by type
export interface EventSponsorsV3 {
  main: EventSponsorV3[];
  other: EventSponsorV3[];
}

// Special section (workshop prep, video links, etc.)
export interface EventSpecialSection {
  type: string;
  title: string;
  content: string[];
}

// Photo with alt text
export interface EventPhotoV3 {
  url: string;
  alt: string;
}

// Location in V3 format
export interface EventLocationV3 {
  format: string;
  venueName: string;
  address: string;
  city: string;
  country: string;
  // Extended fields from Humanitix
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
}

// Detail page data structure
export interface EventDetailPageData {
  url: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  location: EventLocationV3;
  fullDescription: string[];
  speakers: EventSpeakersV3;
  organizers: EventSpeakerV3[];
  sponsors: EventSponsorsV3;
  specialSections: EventSpecialSection[];
  photos: EventPhotoV3[];
  galleryUrl: string;
  registrationUrl: string;
  images: EventPhotoV3[];
  category: string;
  status: string;
  isFeatured: boolean;
  // Extended fields from Humanitix
  dateTime?: string; // Full date/time string e.g. "Thu, 21 Nov 2024, 8am - 6pm NZDT"
  startTime?: string; // Extracted start time e.g. "8am"
  endTime?: string; // Extracted end time e.g. "6pm"
  timezone?: string; // Timezone e.g. "NZDT"
  refundPolicy?: string; // Refund policy text
  humanitixUrl?: string; // Humanitix registration URL
}

// Main V3 Event interface (matches JSON structure)
export interface EventV3 {
  id: number;
  slug: string;
  title: string;
  date: string; // "November 21, 2025" format
  coverImage: EventCoverImage;
  detailPageUrl: string;
  shortDescription: string;
  attendees: number | null;
  detailPageData: EventDetailPageData;
}
