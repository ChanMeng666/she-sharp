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

import { Event } from "@/types/event";

export const events: Event[] = [
  {
    slug: "thrive-your-career-your-story-2025",
    title: "THRIVE: Your Career, Your Story",
    shortDescription:
      "An inspiring evening of career stories from women leaders in tech.",
    description: `Join She Sharp for an empowering evening where accomplished women in technology share their career journeys, challenges, and triumphs.

This event brings together aspiring and established professionals for an evening of inspiration, networking, and mentorship. Hear firsthand accounts of breaking barriers, navigating career pivots, and building successful careers in STEM.

Whether you're just starting your career or looking to take the next step, THRIVE offers valuable insights and connections that can help shape your professional journey.`,
    category: "thrive",
    status: "upcoming",
    isFeatured: true,
    startDate: "2025-03-15",
    startTime: "18:00",
    endTime: "20:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "GridAKL",
      address: "101 Pakenham Street West",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=GridAKL+Auckland",
    },
    organizer: {
      name: "Dr. Mahsa McCauley",
      title: "Founder & Chair",
      company: "She Sharp",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
    },
    speakers: [
      {
        name: "Sarah Chen",
        title: "Chief Technology Officer",
        company: "Tech Corp NZ",
        bio: "Sarah has over 15 years of experience in software engineering and technology leadership.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      },
      {
        name: "Emily Rodriguez",
        title: "Engineering Lead",
        company: "Xero",
        bio: "Emily leads a team of 20 engineers and is passionate about diversity in tech.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
      },
      {
        name: "Priya Sharma",
        title: "Data Science Director",
        company: "Fisher & Paykel Healthcare",
        bio: "Priya specializes in machine learning applications in healthcare.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      },
    ],
    agenda: [
      { time: "18:00", title: "Registration & Networking", type: "networking" },
      {
        time: "18:30",
        title: "Welcome & Introduction",
        speaker: "Dr. Mahsa McCauley",
        type: "keynote",
      },
      {
        time: "18:45",
        title: "Panel: Breaking Barriers in Tech",
        description:
          "Our panelists share their experiences navigating challenges in the tech industry.",
        type: "panel",
      },
      { time: "19:30", title: "Refreshment Break", type: "break" },
      {
        time: "19:45",
        title: "Speed Mentoring Sessions",
        description:
          "Connect one-on-one with industry professionals for personalized advice.",
        type: "networking",
      },
      {
        time: "20:15",
        title: "Closing Remarks & Networking",
        type: "networking",
      },
    ],
    registration: {
      isRequired: true,
      capacity: 100,
      attendeeCount: 67,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop",
    attendeeAvatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=attendee1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=attendee2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=attendee3",
    ],
  },
  {
    slug: "tech-talk-ai-in-healthcare-2025",
    title: "Tech Talk: AI in Healthcare",
    shortDescription:
      "Exploring the intersection of artificial intelligence and healthcare technology.",
    description: `Discover how artificial intelligence is transforming healthcare in New Zealand and beyond.

This event features experts from leading healthcare technology companies discussing real-world applications of AI in medical diagnosis, patient care, and healthcare operations.

Topics covered include machine learning for medical imaging, predictive analytics for patient outcomes, and ethical considerations in healthcare AI.`,
    category: "conference",
    status: "upcoming",
    startDate: "2025-03-22",
    startTime: "12:00",
    endTime: "13:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "Auckland Technology Centre",
      address: "120 Mayoral Drive",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=Auckland+Technology+Centre",
    },
    organizer: {
      name: "She Sharp",
      title: "Organization",
      company: "She Sharp",
    },
    speakers: [
      {
        name: "Dr. Lisa Wang",
        title: "Head of AI Research",
        company: "Healthcare AI Labs",
        bio: "Dr. Wang leads AI research initiatives focused on improving patient outcomes.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
      },
    ],
    registration: {
      isRequired: true,
      capacity: 200,
      attendeeCount: 89,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=630&fit=crop",
    attendeeAvatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=online1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=online2",
    ],
  },
  {
    slug: "networking-mixer-women-in-tech-2025",
    title: "Networking Mixer: Women in Tech",
    shortDescription:
      "Casual networking event for women in technology across Auckland.",
    description: `Connect with fellow women in technology over drinks and appetizers in a relaxed, supportive environment.

This casual networking event is perfect for making new connections, sharing experiences, and building your professional network. Whether you're a software developer, data scientist, product manager, or any other tech professional, you're welcome to join us.

No formal agenda - just great conversations and new connections!`,
    category: "networking",
    status: "upcoming",
    startDate: "2025-04-10",
    startTime: "17:30",
    endTime: "19:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "The Lula Inn",
      address: "149 Quay Street, Viaduct Harbour",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=The+Lula+Inn+Auckland",
    },
    registration: {
      isRequired: true,
      capacity: 50,
      attendeeCount: 32,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&h=630&fit=crop",
  },
  {
    slug: "workshop-resume-building-2025",
    title: "Workshop: Resume Building for Tech Careers",
    shortDescription:
      "Hands-on workshop to create a standout resume for tech industry jobs.",
    description: `Learn how to craft a resume that gets noticed by tech recruiters and hiring managers.

In this interactive workshop, you'll learn:
- How to highlight technical skills effectively
- Best practices for showcasing projects and achievements
- ATS optimization tips to pass automated screening
- Real examples of successful tech resumes

Bring your current resume for personalized feedback!`,
    category: "workshop",
    status: "upcoming",
    startDate: "2025-04-05",
    startTime: "10:00",
    endTime: "12:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "She Sharp Hub",
      address: "25 College Hill",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=25+College+Hill+Auckland",
    },
    speakers: [
      {
        name: "Rachel Kim",
        title: "Senior Tech Recruiter",
        company: "Talent Solutions NZ",
        bio: "Rachel has placed over 500 tech professionals in their dream roles.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=rachel",
      },
    ],
    registration: {
      isRequired: true,
      capacity: 30,
      attendeeCount: 24,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=630&fit=crop",
  },
  {
    slug: "google-educator-conference-2024",
    title: "Google Educator Conference 2024",
    shortDescription:
      "Annual conference for educators exploring Google tools in education.",
    description: `The Google Educator Conference brought together educators, technology specialists, and EdTech innovators for a full day of learning and collaboration.

Highlights from the event included hands-on AI workshops, Google Cloud certification sessions, and an EdTech innovation showcase featuring the latest tools transforming education.

Thank you to all attendees and sponsors who made this event a success!`,
    category: "conference",
    status: "completed",
    startDate: "2024-11-15",
    startTime: "09:00",
    endTime: "17:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "AUT University",
      address: "55 Wellesley Street East",
      city: "Auckland",
    },
    registration: {
      isRequired: true,
      attendeeCount: 150,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1591115765373-5207764f72e4?w=1200&h=630&fit=crop",
    photos: [
      "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/Google%20Educator/IMG_7989-min-K6iMGYwxVSVVRCUlThV8RTvnHjqPCE.JPG",
      "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/Google%20Educator/IMG_8044-min-HLQi94CuRaePCBuxOJ5I9GW3HY5xXs.JPG",
    ],
  },
  {
    slug: "panel-breaking-into-tech-2024",
    title: "Panel: Breaking into Tech",
    shortDescription:
      "Industry professionals share advice for starting a career in technology.",
    description: `This panel brought together professionals who successfully transitioned into tech careers from diverse backgrounds.

Panelists shared their journeys, including the challenges they faced, resources they found helpful, and advice for others looking to break into the tech industry.

Topics covered included bootcamps vs. degrees, building a portfolio, networking strategies, and overcoming imposter syndrome.`,
    category: "panel",
    status: "completed",
    startDate: "2024-10-20",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "BizDojo Ponsonby",
      address: "189 Ponsonby Road",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=BizDojo+Ponsonby+Auckland",
    },
    speakers: [
      {
        name: "Michael Torres",
        title: "Software Engineer",
        company: "Trade Me",
        bio: "Michael transitioned from accounting to software engineering.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
      },
      {
        name: "Amanda Liu",
        title: "UX Designer",
        company: "Spark NZ",
        bio: "Amanda pivoted from graphic design to UX after completing a bootcamp.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=amanda",
      },
    ],
    registration: {
      isRequired: true,
      attendeeCount: 75,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=630&fit=crop",
  },
  {
    slug: "dummy-workshop-react-advanced-2025",
    title: "Dummy Workshop: Advanced React Patterns",
    shortDescription:
      "Learn advanced React patterns and best practices for building scalable applications.",
    description: `Join us for an in-depth workshop on advanced React patterns and techniques.

This hands-on session will cover:
- Custom hooks and composition patterns
- Performance optimization strategies
- State management best practices
- Testing React applications
- Building reusable component libraries

Perfect for developers with intermediate React experience looking to level up their skills.`,
    category: "workshop",
    status: "upcoming",
    startDate: "2025-05-15",
    startTime: "14:00",
    endTime: "17:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "Tech Hub Auckland",
      address: "123 Innovation Street",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=Tech+Hub+Auckland",
    },
    organizer: {
      name: "She Sharp",
      title: "Organization",
      company: "She Sharp",
    },
    speakers: [
      {
        name: "Alex Morgan",
        title: "Senior Frontend Architect",
        company: "Tech Solutions NZ",
        bio: "Alex has 10+ years of experience building React applications at scale.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      },
    ],
    registration: {
      isRequired: true,
      capacity: 40,
      attendeeCount: 18,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&h=630&fit=crop",
    attendeeAvatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=dummy1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=dummy2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=dummy3",
    ],
  },
  {
    slug: "dummy-webinar-cloud-migration-2025",
    title: "Dummy Webinar: Cloud Migration Strategies",
    shortDescription:
      "Learn best practices for migrating applications to the cloud successfully.",
    description: `Join us for an informative webinar on cloud migration strategies and best practices.

This session will cover:
- Planning and assessment phases
- Choosing the right cloud platform
- Migration methodologies (lift-and-shift, refactor, re-architect)
- Cost optimization strategies
- Security and compliance considerations
- Common pitfalls and how to avoid them

Perfect for technical leads, architects, and decision-makers planning cloud migrations.`,
    category: "webinar",
    status: "upcoming",
    startDate: "2025-06-10",
    startTime: "19:00",
    endTime: "20:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "online",
      meetingUrl: "https://zoom.us/j/dummy-cloud-webinar",
      meetingPlatform: "zoom",
    },
    organizer: {
      name: "She Sharp",
      title: "Organization",
      company: "She Sharp",
    },
    speakers: [
      {
        name: "Jordan Taylor",
        title: "Cloud Solutions Architect",
        company: "AWS New Zealand",
        bio: "Jordan specializes in helping organizations migrate to cloud infrastructure.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
      },
    ],
    registration: {
      isRequired: true,
      capacity: 100,
      attendeeCount: 45,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop",
    attendeeAvatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=webinar1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=webinar2",
    ],
  },
  {
    slug: "dummy-meetup-data-science-2025",
    title: "Dummy Meetup: Data Science in Practice",
    shortDescription:
      "Monthly meetup for data scientists to share insights and network.",
    description: `Join our monthly data science meetup for an evening of learning and networking.

This month's meetup features:
- Lightning talks on recent data science projects
- Discussion on machine learning trends
- Networking opportunities with fellow data scientists
- Q&A session with industry experts

Whether you're a beginner or experienced data scientist, this meetup is a great opportunity to connect with the community and learn from each other.`,
    category: "meetup",
    status: "upcoming",
    startDate: "2025-07-08",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "The Workshop",
      address: "88 Parnell Road",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=The+Workshop+Auckland",
    },
    organizer: {
      name: "She Sharp",
      title: "Organization",
      company: "She Sharp",
    },
    speakers: [
      {
        name: "Samira Patel",
        title: "Senior Data Scientist",
        company: "Data Insights Ltd",
        bio: "Samira has extensive experience in predictive analytics and machine learning.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=samira",
      },
      {
        name: "Maria Santos",
        title: "ML Engineer",
        company: "AI Innovations",
        bio: "Maria focuses on deploying ML models in production environments.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
      },
    ],
    registration: {
      isRequired: true,
      capacity: 60,
      attendeeCount: 28,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop",
    attendeeAvatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=meetup1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=meetup2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=meetup3",
    ],
  },
  {
    slug: "dummy-training-typescript-advanced-2025",
    title: "Dummy Training: Advanced TypeScript",
    shortDescription:
      "Master advanced TypeScript features and patterns for enterprise applications.",
    description: `Deep dive into advanced TypeScript concepts and best practices.

This comprehensive training covers:
- Advanced type system features
- Generic programming patterns
- Type guards and discriminated unions
- Decorators and metadata
- Performance optimization techniques
- Building type-safe APIs

Ideal for developers looking to take their TypeScript skills to the next level.`,
    category: "training",
    status: "upcoming",
    startDate: "2025-08-12",
    startTime: "09:00",
    endTime: "17:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "Tech Academy",
      address: "200 Queen Street",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=Tech+Academy+Auckland",
    },
    organizer: {
      name: "She Sharp",
      title: "Organization",
      company: "She Sharp",
    },
    speakers: [
      {
        name: "David Chen",
        title: "TypeScript Expert",
        company: "TypeScript Solutions",
        bio: "David is a TypeScript contributor and author of several TypeScript books.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
      },
    ],
    registration: {
      isRequired: true,
      capacity: 25,
      attendeeCount: 15,
      isFree: false,
      price: {
        amount: 150,
        currency: "NZD",
      },
    },
    coverImage:
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=630&fit=crop",
    attendeeAvatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=training1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=training2",
    ],
  },
  {
    slug: "dummy-social-summer-bbq-2025",
    title: "Dummy Social: Summer BBQ & Networking",
    shortDescription:
      "Relaxed summer BBQ event for the She Sharp community to connect and unwind.",
    description: `Join us for a fun and relaxed summer BBQ event!

Enjoy delicious food, great company, and casual networking in a beautiful outdoor setting. This is a perfect opportunity to:
- Connect with fellow members in a relaxed atmosphere
- Meet new people in the tech community
- Share experiences and stories
- Have fun and unwind

All members and their guests are welcome. Food and drinks provided!`,
    category: "social",
    status: "upcoming",
    startDate: "2025-12-20",
    startTime: "16:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "Auckland Domain",
      address: "Park Road",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=Auckland+Domain",
    },
    registration: {
      isRequired: true,
      capacity: 80,
      attendeeCount: 52,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&h=630&fit=crop",
    attendeeAvatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=social1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=social2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=social3",
    ],
  },
  {
    slug: "dummy-conference-tech-summit-2025",
    title: "Dummy Conference: Tech Summit 2025",
    shortDescription:
      "Annual technology summit featuring keynotes, workshops, and networking opportunities.",
    description: `Join us for our annual Tech Summit, the premier event for women in technology.

This full-day conference features:
- Keynote presentations from industry leaders
- Technical workshops and hands-on sessions
- Panel discussions on current tech trends
- Networking opportunities throughout the day
- Career fair with top tech companies
- Closing reception

Don't miss this opportunity to learn, network, and grow your career!`,
    category: "conference",
    status: "upcoming",
    startDate: "2025-09-25",
    startTime: "08:00",
    endTime: "18:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "Auckland Convention Centre",
      address: "88 Federal Street",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=Auckland+Convention+Centre",
    },
    organizer: {
      name: "She Sharp",
      title: "Organization",
      company: "She Sharp",
    },
    speakers: [
      {
        name: "Dr. Sarah Johnson",
        title: "CTO",
        company: "Tech Innovations NZ",
        bio: "Dr. Johnson is a leading voice in technology innovation and diversity.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarahj",
      },
      {
        name: "Lisa Park",
        title: "VP of Engineering",
        company: "Global Tech Corp",
        bio: "Lisa has built engineering teams at scale across multiple companies.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisap",
      },
    ],
    agenda: [
      { time: "08:00", title: "Registration & Breakfast", type: "networking" },
      { time: "09:00", title: "Opening Keynote", type: "keynote" },
      { time: "10:30", title: "Morning Break", type: "break" },
      { time: "11:00", title: "Workshop Sessions", type: "workshop" },
      { time: "12:30", title: "Lunch & Networking", type: "networking" },
      { time: "14:00", title: "Panel Discussion", type: "panel" },
      { time: "15:30", title: "Afternoon Break", type: "break" },
      { time: "16:00", title: "Closing Keynote", type: "keynote" },
      { time: "17:00", title: "Networking Reception", type: "networking" },
    ],
    registration: {
      isRequired: true,
      capacity: 300,
      attendeeCount: 187,
      isFree: false,
      price: {
        amount: 200,
        currency: "NZD",
      },
    },
    coverImage:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop",
    attendeeAvatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=summit1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=summit2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=summit3",
    ],
  },
  {
    slug: "dummy-webinar-cybersecurity-2025",
    title: "Dummy Webinar: Cybersecurity Best Practices",
    shortDescription:
      "Learn essential cybersecurity practices to protect your applications and data.",
    description: `Join us for an informative webinar on cybersecurity best practices.

Topics covered:
- Common security vulnerabilities
- Secure coding practices
- Authentication and authorization
- Data encryption and protection
- Incident response planning
- Compliance and regulations

Essential knowledge for all developers and tech professionals.`,
    category: "webinar",
    status: "upcoming",
    startDate: "2025-10-05",
    startTime: "19:00",
    endTime: "20:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "online",
      meetingUrl: "https://zoom.us/j/dummy-cybersecurity-webinar",
      meetingPlatform: "zoom",
    },
    organizer: {
      name: "She Sharp",
      title: "Organization",
      company: "She Sharp",
    },
    speakers: [
      {
        name: "Emma Wilson",
        title: "Security Engineer",
        company: "SecureTech NZ",
        bio: "Emma specializes in application security and threat modeling.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      },
    ],
    registration: {
      isRequired: true,
      capacity: 150,
      attendeeCount: 78,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop",
    attendeeAvatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=cyber1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=cyber2",
    ],
  },
  {
    slug: "dummy-workshop-ui-ux-design-2025",
    title: "Dummy Workshop: UI/UX Design Fundamentals",
    shortDescription:
      "Learn the fundamentals of user interface and user experience design.",
    description: `Discover the principles of great UI/UX design in this hands-on workshop.

You'll learn:
- Design thinking methodology
- User research techniques
- Wireframing and prototyping
- Visual design principles
- Usability testing
- Design tools and workflows

Perfect for developers, designers, and product managers.`,
    category: "workshop",
    status: "upcoming",
    startDate: "2025-11-08",
    startTime: "10:00",
    endTime: "15:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "Design Studio",
      address: "45 High Street",
      city: "Auckland",
      mapUrl: "https://maps.google.com/?q=Design+Studio+Auckland",
    },
    organizer: {
      name: "She Sharp",
      title: "Organization",
      company: "She Sharp",
    },
    speakers: [
      {
        name: "Sophie Lee",
        title: "Senior UX Designer",
        company: "Design Co",
        bio: "Sophie has designed products used by millions of users worldwide.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophie",
      },
    ],
    registration: {
      isRequired: true,
      capacity: 35,
      attendeeCount: 22,
      isFree: true,
    },
    coverImage:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=630&fit=crop",
    attendeeAvatars: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=design1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=design2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=design3",
    ],
  },
];
