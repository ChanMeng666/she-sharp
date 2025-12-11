/**
 * Events Data
 *
 * This file contains all event data for the She Sharp website.
 * Developers can easily add, edit, or remove events by modifying this array.
 *
 * To add a new event:
 * 1. Copy an existing event object as a template
 * 2. Update all fields with the new event information
 * 3. Set a unique slug (URL-friendly identifier)
 * 4. Set isFeatured: true if this should be the featured event
 */

import { Event } from '@/types/event';

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
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
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
    registration: {
      isRequired: true,
      capacity: 100,
      attendeeCount: 67,
      isFree: true,
    },
    coverImage:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop',
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

This event features experts from leading healthcare technology companies discussing real-world applications of AI in medical diagnosis, patient care, and healthcare operations.

Topics covered include machine learning for medical imaging, predictive analytics for patient outcomes, and ethical considerations in healthcare AI.`,
    category: 'conference',
    status: 'upcoming',
    startDate: '2025-03-22',
    startTime: '12:00',
    endTime: '13:00',
    timezone: 'Pacific/Auckland',
    location: {
      format: 'in_person',
      venueName: 'Auckland Technology Centre',
      address: '120 Mayoral Drive',
      city: 'Auckland',
      mapUrl: 'https://maps.google.com/?q=Auckland+Technology+Centre',
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
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=630&fit=crop',
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
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&h=630&fit=crop',
  },
  {
    slug: 'workshop-resume-building-2025',
    title: 'Workshop: Resume Building for Tech Careers',
    shortDescription:
      'Hands-on workshop to create a standout resume for tech industry jobs.',
    description: `Learn how to craft a resume that gets noticed by tech recruiters and hiring managers.

In this interactive workshop, you'll learn:
- How to highlight technical skills effectively
- Best practices for showcasing projects and achievements
- ATS optimization tips to pass automated screening
- Real examples of successful tech resumes

Bring your current resume for personalized feedback!`,
    category: 'workshop',
    status: 'upcoming',
    startDate: '2025-04-05',
    startTime: '10:00',
    endTime: '12:00',
    timezone: 'Pacific/Auckland',
    location: {
      format: 'in_person',
      venueName: 'She Sharp Hub',
      address: '25 College Hill',
      city: 'Auckland',
      mapUrl: 'https://maps.google.com/?q=25+College+Hill+Auckland',
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
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=630&fit=crop',
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
    registration: {
      isRequired: true,
      attendeeCount: 150,
      isFree: true,
    },
    coverImage:
      'https://images.unsplash.com/photo-1591115765373-5207764f72e4?w=1200&h=630&fit=crop',
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
    startDate: '2024-10-20',
    startTime: '18:00',
    endTime: '20:00',
    timezone: 'Pacific/Auckland',
    location: {
      format: 'in_person',
      venueName: 'BizDojo Ponsonby',
      address: '189 Ponsonby Road',
      city: 'Auckland',
      mapUrl: 'https://maps.google.com/?q=BizDojo+Ponsonby+Auckland',
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
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=630&fit=crop',
  },
];
