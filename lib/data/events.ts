import {
  Event,
  EventCategory,
  EventStatus,
  EventFormat,
  EVENT_CATEGORIES,
  AgendaItem,
} from '@/types/event';

export type { Event, EventCategory, EventStatus, EventFormat, AgendaItem };

export const events: Event[] = [
  {
    slug: 'thrive-your-career-your-story-2025',
    title: 'THRIVE: Your Career, Your Story',
    shortDescription:
      'An inspiring evening of career stories from women leaders in tech.',
    description: `Join She Sharp for an empowering evening where accomplished women in technology share their career journeys, challenges, and triumphs.

This event brings together aspiring and established professionals for an evening of inspiration, networking, and mentorship. Hear firsthand accounts of breaking barriers, navigating career pivots, and building successful careers in STEM.

Whether you're just starting your career or looking to take the next step, THRIVE offers valuable insights and connections that can help shape your professional journey.`,
    category: 'thrive',
    status: 'upcoming',
    isFeatured: true,
    tags: ['career', 'networking', 'women-in-tech', 'mentorship'],
    startDate: '2025-03-15',
    startTime: '18:00',
    endTime: '20:30',
    timezone: 'Pacific/Auckland',
    location: {
      format: 'in_person',
      venueName: 'GridAKL',
      address: '101 Pakenham Street West',
      city: 'Auckland',
      mapUrl: 'https://maps.google.com/?q=GridAKL+Auckland',
    },
    organizer: {
      name: 'Dr. Mahsa McCauley',
      title: 'Founder & Chair',
      company: 'She Sharp',
      image:
        'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64811ab760ae807f1dc87e65_Team_1_Masha.png',
    },
    speakers: [
      {
        name: 'Sarah Chen',
        title: 'Chief Technology Officer',
        company: 'Tech Corp NZ',
        bio: 'Sarah has over 15 years of experience in software engineering and technology leadership.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      },
      {
        name: 'Emily Rodriguez',
        title: 'Engineering Lead',
        company: 'Xero',
        bio: 'Emily leads a team of 20 engineers and is passionate about diversity in tech.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
      },
      {
        name: 'Priya Sharma',
        title: 'Data Science Director',
        company: 'Fisher & Paykel Healthcare',
        bio: 'Priya specializes in machine learning applications in healthcare.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
      },
    ],
    agenda: [
      { time: '18:00', title: 'Registration & Networking', type: 'networking' },
      {
        time: '18:30',
        title: 'Welcome & Introduction',
        speaker: 'Dr. Mahsa McCauley',
        type: 'keynote',
      },
      {
        time: '18:45',
        title: 'Panel: Breaking Barriers in Tech',
        description:
          'Our panelists share their experiences navigating challenges in the tech industry.',
        type: 'panel',
      },
      { time: '19:30', title: 'Refreshment Break', type: 'break' },
      {
        time: '19:45',
        title: 'Speed Mentoring Sessions',
        description:
          'Connect one-on-one with industry professionals for personalized advice.',
        type: 'networking',
      },
      { time: '20:15', title: 'Closing Remarks & Networking', type: 'networking' },
    ],
    highlights: [
      'Hear inspiring career journeys from women leaders',
      'Speed mentoring with industry professionals',
      'Network with the She Sharp community',
      'Free food and refreshments',
    ],
    registration: {
      isRequired: true,
      capacity: 100,
      attendeeCount: 67,
      isFree: true,
    },
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66e79f2fa69eb4a60dbb3741_Thrive.png',
    attendeeAvatars: [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=attendee1',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=attendee2',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=attendee3',
    ],
  },
  {
    slug: 'tech-talk-ai-in-healthcare-2025',
    title: 'Tech Talk: AI in Healthcare',
    shortDescription:
      'Exploring the intersection of artificial intelligence and healthcare technology.',
    description: `Discover how artificial intelligence is transforming healthcare in New Zealand and beyond.

This webinar features experts from leading healthcare technology companies discussing real-world applications of AI in medical diagnosis, patient care, and healthcare operations.

Topics covered include machine learning for medical imaging, predictive analytics for patient outcomes, and ethical considerations in healthcare AI.`,
    category: 'webinar',
    status: 'upcoming',
    tags: ['ai', 'healthcare', 'technology', 'webinar'],
    startDate: '2025-03-22',
    startTime: '12:00',
    endTime: '13:00',
    timezone: 'Pacific/Auckland',
    location: {
      format: 'online',
      meetingUrl: 'https://zoom.us/j/example',
      meetingPlatform: 'zoom',
    },
    organizer: {
      name: 'She Sharp',
      title: 'Organization',
      company: 'She Sharp',
    },
    speakers: [
      {
        name: 'Dr. Lisa Wang',
        title: 'Head of AI Research',
        company: 'Healthcare AI Labs',
        bio: 'Dr. Wang leads AI research initiatives focused on improving patient outcomes.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
      },
    ],
    registration: {
      isRequired: true,
      capacity: 200,
      attendeeCount: 89,
      isFree: true,
    },
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64be1e19df6dbe0feb5fe79c_Webpage-1.png',
    attendeeAvatars: [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=online1',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=online2',
    ],
  },
  {
    slug: 'networking-mixer-women-in-tech-2025',
    title: 'Networking Mixer: Women in Tech',
    shortDescription:
      'Casual networking event for women in technology across Auckland.',
    description: `Connect with fellow women in technology over drinks and appetizers in a relaxed, supportive environment.

This casual networking event is perfect for making new connections, sharing experiences, and building your professional network. Whether you're a software developer, data scientist, product manager, or any other tech professional, you're welcome to join us.

No formal agenda - just great conversations and new connections!`,
    category: 'networking',
    status: 'upcoming',
    tags: ['networking', 'women-in-tech', 'casual'],
    startDate: '2025-04-10',
    startTime: '17:30',
    endTime: '19:30',
    timezone: 'Pacific/Auckland',
    location: {
      format: 'in_person',
      venueName: 'The Lula Inn',
      address: '149 Quay Street, Viaduct Harbour',
      city: 'Auckland',
      mapUrl: 'https://maps.google.com/?q=The+Lula+Inn+Auckland',
    },
    registration: {
      isRequired: true,
      capacity: 50,
      attendeeCount: 32,
      isFree: true,
    },
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64be1e19df6dbe0feb5fe79c_Webpage-1.png',
  },
  {
    slug: 'workshop-resume-building-2025',
    title: 'Workshop: Resume Building for Tech Careers',
    shortDescription:
      'Hands-on workshop to create a standout resume for tech industry jobs.',
    description: `Learn how to craft a resume that gets noticed by tech recruiters and hiring managers.

In this interactive online workshop, you'll learn:
- How to highlight technical skills effectively
- Best practices for showcasing projects and achievements
- ATS optimization tips to pass automated screening
- Real examples of successful tech resumes

Bring your current resume for personalized feedback!`,
    category: 'workshop',
    status: 'upcoming',
    tags: ['career', 'workshop', 'resume', 'job-search'],
    startDate: '2025-04-05',
    startTime: '10:00',
    endTime: '12:00',
    timezone: 'Pacific/Auckland',
    location: {
      format: 'online',
      meetingUrl: 'https://teams.microsoft.com/example',
      meetingPlatform: 'teams',
    },
    speakers: [
      {
        name: 'Rachel Kim',
        title: 'Senior Tech Recruiter',
        company: 'Talent Solutions NZ',
        bio: 'Rachel has placed over 500 tech professionals in their dream roles.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rachel',
      },
    ],
    registration: {
      isRequired: true,
      capacity: 30,
      attendeeCount: 24,
      isFree: true,
    },
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64be1e19df6dbe0feb5fe79c_Webpage-1.png',
  },
  {
    slug: 'google-educator-conference-2024',
    title: 'Google Educator Conference 2024',
    shortDescription:
      'Annual conference for educators exploring Google tools in education.',
    description: `The Google Educator Conference brought together educators, technology specialists, and EdTech innovators for a full day of learning and collaboration.

Highlights from the event included hands-on AI workshops, Google Cloud certification sessions, and an EdTech innovation showcase featuring the latest tools transforming education.

Thank you to all attendees and sponsors who made this event a success!`,
    category: 'conference',
    status: 'completed',
    tags: ['education', 'google', 'edtech', 'conference'],
    startDate: '2024-11-15',
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'Pacific/Auckland',
    location: {
      format: 'in_person',
      venueName: 'AUT University',
      address: '55 Wellesley Street East',
      city: 'Auckland',
    },
    highlights: [
      'Hands-on AI workshops',
      'Google Cloud certification',
      'EdTech innovation showcase',
      '150+ educators attended',
    ],
    registration: {
      isRequired: true,
      attendeeCount: 150,
      isFree: true,
    },
    coverImage:
      'https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66fd93a6fdf5e3e3f22d29e1_Google%20Educator.webp',
    photos: [
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/Google%20Educator/IMG_7989-min-K6iMGYwxVSVVRCUlThV8RTvnHjqPCE.JPG',
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/Google%20Educator/IMG_8044-min-HLQi94CuRaePCBuxOJ5I9GW3HY5xXs.JPG',
    ],
  },
  {
    slug: 'panel-breaking-into-tech-2024',
    title: 'Panel: Breaking into Tech',
    shortDescription:
      'Industry professionals share advice for starting a career in technology.',
    description: `This panel brought together professionals who successfully transitioned into tech careers from diverse backgrounds.

Panelists shared their journeys, including the challenges they faced, resources they found helpful, and advice for others looking to break into the tech industry.

Topics covered included bootcamps vs. degrees, building a portfolio, networking strategies, and overcoming imposter syndrome.`,
    category: 'panel',
    status: 'completed',
    tags: ['career', 'panel', 'beginners', 'career-change'],
    startDate: '2024-10-20',
    startTime: '18:00',
    endTime: '20:00',
    timezone: 'Pacific/Auckland',
    location: {
      format: 'hybrid',
      venueName: 'BizDojo Ponsonby',
      address: '189 Ponsonby Road',
      city: 'Auckland',
      meetingUrl: 'https://zoom.us/j/example-past',
      meetingPlatform: 'zoom',
    },
    speakers: [
      {
        name: 'Michael Torres',
        title: 'Software Engineer',
        company: 'Trade Me',
        bio: 'Michael transitioned from accounting to software engineering.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
      },
      {
        name: 'Amanda Liu',
        title: 'UX Designer',
        company: 'Spark NZ',
        bio: 'Amanda pivoted from graphic design to UX after completing a bootcamp.',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amanda',
      },
    ],
    registration: {
      isRequired: true,
      attendeeCount: 75,
      isFree: true,
    },
    coverImage:
      'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64be1e19df6dbe0feb5fe79c_Webpage-1.png',
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get event by slug
 */
export function getEventBySlug(slug: string): Event | undefined {
  return events.find((e) => e.slug === slug);
}

/**
 * Get all events (excluding hidden)
 */
export function getAllEvents(): Event[] {
  return events;
}

/**
 * Get upcoming events sorted by date (nearest first)
 */
export function getUpcomingEvents(limit?: number): Event[] {
  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.startDate) >= now && e.status !== 'cancelled')
    .sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  return limit ? upcoming.slice(0, limit) : upcoming;
}

/**
 * Get past events sorted by date (most recent first)
 */
export function getPastEvents(limit?: number): Event[] {
  const now = new Date();
  const past = events
    .filter((e) => new Date(e.startDate) < now || e.status === 'completed')
    .sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  return limit ? past.slice(0, limit) : past;
}

/**
 * Get online events (upcoming only)
 */
export function getOnlineEvents(): Event[] {
  return getUpcomingEvents().filter((e) => e.location.format === 'online');
}

/**
 * Get in-person events (upcoming only)
 */
export function getInPersonEvents(): Event[] {
  return getUpcomingEvents().filter((e) => e.location.format !== 'online');
}

/**
 * Get featured event
 */
export function getFeaturedEvent(): Event | undefined {
  return events.find((e) => e.isFeatured && e.status === 'upcoming');
}

/**
 * Get events by category
 */
export function getEventsByCategory(category: EventCategory): Event[] {
  return events.filter((e) => e.category === category);
}

/**
 * Get events by format
 */
export function getEventsByFormat(format: EventFormat): Event[] {
  return events.filter((e) => e.location.format === format);
}

/**
 * Search events by title, description, or tags
 */
export function searchEvents(query: string): Event[] {
  const q = query.toLowerCase();
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.shortDescription?.toLowerCase().includes(q) ||
      e.tags?.some((t) => t.toLowerCase().includes(q))
  );
}

/**
 * Calculate days until event
 */
export function getDaysUntilEvent(event: Event): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.startDate);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil(
    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Format event date for display
 */
export function formatEventDate(
  event: Event,
  style: 'short' | 'long' | 'full' = 'long'
): string {
  const date = new Date(event.startDate);
  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { month: 'short', day: 'numeric' }
      : style === 'full'
        ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };

  return date.toLocaleDateString('en-NZ', options);
}

/**
 * Format event time range for display
 */
export function formatEventTime(event: Event): string {
  return `${event.startTime} - ${event.endTime}`;
}

/**
 * Check if registration is open
 */
export function isRegistrationOpen(event: Event): boolean {
  if (event.status !== 'upcoming') return false;
  if (!event.registration?.isRequired) return false;
  if (
    event.registration.deadline &&
    new Date(event.registration.deadline) < new Date()
  )
    return false;
  if (
    event.registration.capacity &&
    event.registration.attendeeCount &&
    event.registration.attendeeCount >= event.registration.capacity
  )
    return false;
  return true;
}

/**
 * Get spots remaining for event
 */
export function getSpotsRemaining(event: Event): number | null {
  if (!event.registration?.capacity) return null;
  const attendees = event.registration.attendeeCount || 0;
  return Math.max(0, event.registration.capacity - attendees);
}

/**
 * Get event statistics
 */
export function getEventStats() {
  const now = new Date();
  const upcoming = events.filter(
    (e) => new Date(e.startDate) >= now && e.status !== 'cancelled'
  );
  const past = events.filter(
    (e) => new Date(e.startDate) < now || e.status === 'completed'
  );

  const byCategory: Partial<Record<EventCategory, number>> = {};
  const byFormat: Partial<Record<EventFormat, number>> = {};

  events.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    byFormat[e.location.format] = (byFormat[e.location.format] || 0) + 1;
  });

  return {
    total: events.length,
    upcoming: upcoming.length,
    past: past.length,
    online: events.filter((e) => e.location.format === 'online').length,
    inPerson: events.filter((e) => e.location.format === 'in_person').length,
    hybrid: events.filter((e) => e.location.format === 'hybrid').length,
    byCategory,
    byFormat,
  };
}

/**
 * Get all unique categories from events
 */
export function getAllEventCategories(): EventCategory[] {
  return EVENT_CATEGORIES.filter((cat) =>
    events.some((e) => e.category === cat)
  );
}

/**
 * Get all unique tags from events
 */
export function getAllEventTags(): string[] {
  const tagSet = new Set<string>();
  events.forEach((e) => {
    e.tags?.forEach((t) => tagSet.add(t));
  });
  return Array.from(tagSet).sort();
}
