'use client';

import { EventsTimelineHero } from '@/components/events/events-timeline-hero';
import { GoogleCalendarSection } from '@/components/events/google-calendar-section';
import { PastEventsGallery } from '@/components/events/past-events-gallery';

// Past events mock data (kept for gallery)

const mockPastEvents = [
  {
    id: 'thrive-july-2025',
    title: 'THRIVE: Your Career, Your Story',
    date: 'July 30, 2025',
    attendees: 90,
    images: [
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg'
    ],
    description: 'Career development evening with keynote, panel discussion, and speed mentoring sessions. A collaboration between She Sharp and TechBabesNZ.'
  },
  {
    id: 'p1',
    title: 'International Women\'s Day 2024',
    date: 'March 8, 2024',
    attendees: 120,
    images: [
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg'
    ],
    description: 'A celebration of women in tech with inspiring talks and networking.'
  },
  {
    id: 'p2',
    title: 'Code & Coffee Meetup',
    date: 'February 15, 2024',
    attendees: 35,
    images: [
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg'
    ],
    description: 'Casual coding session with mentorship opportunities.'
  },
  {
    id: 'p3',
    title: 'She Sharp Annual Gala',
    date: 'December 10, 2023',
    attendees: 200,
    images: [
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
      'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg'
    ],
    description: 'Our biggest event of the year celebrating achievements in tech.'
  }
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <EventsTimelineHero />
      <GoogleCalendarSection />
      <PastEventsGallery events={mockPastEvents} />
    </div>
  );
}