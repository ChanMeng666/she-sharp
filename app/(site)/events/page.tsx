'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Clock, MapPin, Video, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EventCard } from '@/components/events/event-card';
import { EventList } from '@/components/events/event-list';
import {
  EventFiltersBar,
  EventFilters,
} from '@/components/events/event-filters';
import {
  getAllEvents,
  getUpcomingEvents,
  getPastEvents,
  getFeaturedEvent,
  formatEventDate,
  formatEventTime,
  getDaysUntilEvent,
  getEventStats,
} from '@/lib/data/events';
import { EventFormat, EventCategory } from '@/types/event';
import { cn } from '@/lib/utils';

export default function EventsPage() {
  const [filters, setFilters] = useState<EventFilters>({
    format: 'all',
    category: 'all',
    search: '',
  });

  const featuredEvent = getFeaturedEvent();
  const allUpcoming = getUpcomingEvents();
  const allPast = getPastEvents(6);
  const stats = getEventStats();

  const filteredUpcoming = useMemo(() => {
    return allUpcoming.filter((event) => {
      // Format filter
      if (filters.format !== 'all') {
        if (filters.format === 'online' && event.location.format !== 'online')
          return false;
        if (
          filters.format === 'in_person' &&
          event.location.format !== 'in_person'
        )
          return false;
      }

      // Category filter
      if (filters.category !== 'all' && event.category !== filters.category)
        return false;

      // Search filter
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q) ||
          event.shortDescription?.toLowerCase().includes(q) ||
          event.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [allUpcoming, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Featured Event */}
      {featuredEvent && (
        <section className="relative bg-gradient-to-br from-purple-dark via-purple-mid to-periwinkle-dark text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-repeat" />
          </div>

          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Event Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    Featured Event
                  </Badge>
                  {getDaysUntilEvent(featuredEvent) <= 7 && (
                    <Badge className="bg-mint-dark text-white border-0">
                      Coming Soon!
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  {featuredEvent.title}
                </h1>

                <p className="text-lg text-white/90 max-w-lg">
                  {featuredEvent.shortDescription || featuredEvent.description.slice(0, 150) + '...'}
                </p>

                <div className="flex flex-wrap gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{formatEventDate(featuredEvent, 'full')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{formatEventTime(featuredEvent)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {featuredEvent.location.format === 'online' ? (
                      <>
                        <Video className="w-5 h-5" />
                        <span>Online Event</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5" />
                        <span>
                          {featuredEvent.location.venueName},{' '}
                          {featuredEvent.location.city}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {featuredEvent.registration?.attendeeCount && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Users className="w-5 h-5" />
                    <span>
                      {featuredEvent.registration.attendeeCount} people attending
                    </span>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-purple-dark hover:bg-white/90"
                  >
                    <Link href={`/events/${featuredEvent.slug}`}>
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Register Now
                  </Button>
                </div>
              </div>

              {/* Right: Event Image */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={featuredEvent.coverImage}
                  alt={featuredEvent.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-dark">
                {stats.upcoming}
              </div>
              <div className="text-sm text-gray-600">Upcoming Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-dark">
                {stats.past}
              </div>
              <div className="text-sm text-gray-600">Past Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-dark">
                {stats.online}
              </div>
              <div className="text-sm text-gray-600">Online Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-dark">
                {stats.inPerson}
              </div>
              <div className="text-sm text-gray-600">In-Person Events</div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-navy-dark">
                Upcoming Events
              </h2>
              <p className="text-gray-600 mt-1">
                Join us at our upcoming workshops, networking events, and more
              </p>
            </div>
          </div>

          {/* Filters */}
          <EventFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            showSearch={true}
            showCategory={false}
            className="mb-8"
          />

          {/* Events Grid */}
          <EventList
            events={filteredUpcoming}
            columns={3}
            emptyMessage="No upcoming events match your filters. Try adjusting your search or filters."
          />
        </div>
      </section>

      {/* Past Events Section */}
      {allPast.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-navy-dark">
                  Past Events
                </h2>
                <p className="text-gray-600 mt-1">
                  Explore highlights from our previous events
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPast.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-dark to-periwinkle-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Never Miss an Event
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">
            Subscribe to our newsletter and get notified about upcoming events,
            workshops, and networking opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-purple-dark hover:bg-white/90"
            >
              Subscribe to Newsletter
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Add to Calendar
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
