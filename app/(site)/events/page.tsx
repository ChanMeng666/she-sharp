'use client';

import { useState, useMemo } from 'react';
import { EventsTimelineHero } from '@/components/events/events-timeline-hero';
import { EventsFilter } from '@/components/events/events-filter';
import { EventsCalendarView } from '@/components/events/events-calendar-view';
import { GoogleCalendarSection } from '@/components/events/google-calendar-section';
import { EventTicketCard } from '@/components/events/event-ticket-card';
import { EventMiniCard } from '@/components/events/event-mini-card';
import { PastEventsGallery } from '@/components/events/past-events-gallery';
import { Container } from '@/components/layout/container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Grid3X3, Loader2, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { layoutSystem, layoutClasses } from '@/lib/layout-system';

// Mock data - replace with actual API calls
const mockEvents = [
  {
    id: 'thrive-your-career-your-story',
    title: 'THRIVE: Your Career, Your Story',
    date: new Date('2025-03-15'),
    dateString: 'March 15, 2025',
    time: '6:00 PM - 8:30 PM',
    location: 'Auckland CBD',
    image: 'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
    type: 'in-person' as const,
    spotsLeft: 12,
    totalSpots: 50,
    isNew: true,
    isFeatured: true,
    description: 'Join us for an inspiring evening of career stories and networking.'
  },
  {
    id: 'tech-talk-ai-healthcare',
    title: 'Tech Talk: AI in Healthcare',
    date: new Date('2025-03-22'),
    dateString: 'March 22, 2025',
    time: '12:00 PM - 1:00 PM',
    location: 'Online via Zoom',
    image: 'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
    type: 'online' as const,
    spotsLeft: 45,
    totalSpots: 100,
    isNew: true,
    description: 'Explore the latest developments in AI applications for healthcare.'
  },
  {
    id: 'coding-workshop-react-fundamentals',
    title: 'Coding Workshop: React Fundamentals',
    date: new Date('2025-03-29'),
    dateString: 'March 29, 2025',
    time: '10:00 AM - 2:00 PM',
    location: 'Wellington Tech Hub',
    image: 'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
    type: 'workshop' as const,
    spotsLeft: 8,
    totalSpots: 20,
    description: 'Hands-on workshop to learn React from scratch.'
  },
  {
    id: 'women-in-leadership-panel',
    title: 'Women in Leadership Panel',
    date: new Date('2025-04-05'),
    dateString: 'April 5, 2025',
    time: '5:30 PM - 7:30 PM',
    location: 'Christchurch Convention Centre',
    image: 'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
    type: 'in-person' as const,
    spotsLeft: 25,
    totalSpots: 80,
    description: 'Hear from successful women leaders in tech.'
  },
  {
    id: 'cybersecurity-basics',
    title: 'Cybersecurity Basics',
    date: new Date('2025-04-12'),
    dateString: 'April 12, 2025',
    time: '2:00 PM - 3:30 PM',
    location: 'Online via Zoom',
    image: 'https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg',
    type: 'online' as const,
    spotsLeft: 60,
    totalSpots: 150,
    description: 'Learn the fundamentals of cybersecurity.'
  }
];

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

const locations = ['Auckland CBD', 'Wellington Tech Hub', 'Christchurch Convention Centre', 'Online via Zoom'];

export default function EventsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'google-calendar'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    month: 'all',
    location: 'all',
    search: ''
  });

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return mockEvents.filter(event => {
      // Type filter
      if (filters.type !== 'all' && event.type !== filters.type) return false;
      
      // Month filter
      if (filters.month !== 'all') {
        const eventMonth = (event.date.getMonth() + 1).toString().padStart(2, '0');
        if (eventMonth !== filters.month) return false;
      }
      
      // Location filter
      if (filters.location !== 'all' && event.location !== filters.location) return false;
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return event.title.toLowerCase().includes(searchLower) ||
               event.description.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  }, [filters]);

  const handleEventClick = (event: any) => {
    // Simulate navigation to event detail page
    toast.success(`Navigating to ${event.title}`);
    router.push(`/events/${event.id}`);
  };

  const handleLoadMore = () => {
    setIsLoading(true);
    // Simulate loading more events
    setTimeout(() => {
      setIsLoading(false);
      toast.success('More events loaded!');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <EventsTimelineHero />

      {/* Main Content */}
      <section className="py-16 md:py-24" id="all-events">
        <Container size="wide">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-dark dark:text-white mb-4">
              All Upcoming Events
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover workshops, networking events, and learning opportunities designed for women in tech.
            </p>
          </div>

          {/* Member Benefits CTA */}
          <div className="bg-gradient-to-r from-purple-light/40 to-mint-light/40 border border-purple-mid/20 rounded-xl p-6 mb-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-semibold text-navy-dark mb-2">
                  Want to register for events and track your bookings?
                </h3>
                <p className="text-gray-600 text-sm">
                  Join She Sharp to register for events, connect with mentors, and access exclusive member resources.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="default" className="bg-purple-dark hover:bg-purple-mid">
                  <Link href="/sign-up">Join Now</Link>
                </Button>
                <Button asChild variant="outline" className="border-purple-mid text-purple-dark hover:bg-purple-light/30">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-center mb-8">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'calendar' | 'google-calendar')}>
              <TabsList className="bg-muted text-muted-foreground p-1">
                <TabsTrigger value="grid" className="gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  Grid View
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="google-calendar" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Official Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filters */}
          {viewMode !== 'google-calendar' && (
            <EventsFilter 
              onFilterChange={setFilters}
              locations={locations}
            />
          )}

          {/* Events Display */}
          <div className="mt-8">
            {viewMode === 'grid' ? (
              <>
                {/* Featured Event */}
                {(() => {
                  const featuredEvent = filteredEvents.find(e => e.isFeatured);
                  if (!featuredEvent) return null;
                  
                  return (
                    <div className="mb-8">
                      <EventTicketCard 
                        event={{
                          id: featuredEvent.id,
                          title: featuredEvent.title,
                          date: featuredEvent.dateString,
                          time: featuredEvent.time,
                          location: featuredEvent.location,
                          image: featuredEvent.image,
                          type: featuredEvent.type,
                          spotsLeft: featuredEvent.spotsLeft,
                          totalSpots: featuredEvent.totalSpots,
                          isNew: featuredEvent.isNew,
                          isFeatured: featuredEvent.isFeatured
                        }}
                        className="max-w-4xl mx-auto"
                      />
                    </div>
                  );
                })()}

                {/* Events Grid */}
                <div className={layoutClasses(
                  "grid",
                  layoutSystem.grids.content.cols1,
                  layoutSystem.grids.content.cols2,
                  layoutSystem.grids.content.cols3,
                  layoutSystem.grids.content.gap
                )}>
                  {filteredEvents
                    .filter(e => !e.isFeatured)
                    .map((event) => (
                      <EventMiniCard 
                        key={event.id} 
                        event={{
                          id: event.id,
                          title: event.title,
                          date: event.dateString,
                          time: event.time,
                          location: event.location,
                          image: event.image,
                          type: event.type,
                          spotsLeft: event.spotsLeft,
                          isNew: event.isNew
                        }} 
                      />
                    ))}
                </div>

                {/* Load More */}
                <div className="text-center mt-12">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Events'
                    )}
                  </Button>
                </div>
              </>
            ) : viewMode === 'calendar' ? (
              /* Calendar View */
              <EventsCalendarView 
                events={filteredEvents.map(e => ({
                  id: e.id,
                  title: e.title,
                  date: e.date,
                  time: e.time,
                  location: e.location,
                  type: e.type
                }))}
                onEventClick={handleEventClick}
              />
            ) : (
              /* Google Calendar View */
              <div className="mx-auto max-w-none">
                <GoogleCalendarSection />
              </div>
            )}
          </div>

          {/* No Results */}
          {filteredEvents.length === 0 && viewMode !== 'google-calendar' && (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No events found matching your filters.
              </p>
              <Button
                onClick={() => setFilters({ type: 'all', month: 'all', location: 'all', search: '' })}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Container>
      </section>

      {/* Past Events Gallery */}
      <PastEventsGallery events={mockPastEvents} />

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-purple-dark mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading events...</p>
          </div>
        </div>
      )}
    </div>
  );
}