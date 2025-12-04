'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Clock, MapPin, Video, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { EventCard } from '@/components/events/event-card';
import { EventList } from '@/components/events/event-list';
import {
  getUpcomingEvents,
  getPastEvents,
  getFeaturedEvent,
  formatEventDate,
  formatEventTime,
  getDaysUntilEvent,
} from '@/lib/data/events';
import { cn } from '@/lib/utils';

export default function EventsPage() {
  const featuredEvent = getFeaturedEvent();
  const allUpcoming = getUpcomingEvents();
  const allPast = getPastEvents(6);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Featured Event */}
      {featuredEvent && (
        <Section className="bg-surface-periwinkle" spacing="section">
          <Container size="full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Event Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-[#8982ff] text-white border-0">
                    Featured Event
                  </Badge>
                  {getDaysUntilEvent(featuredEvent) <= 7 && (
                    <Badge variant="outline" className="border-[#8982ff] text-[#8982ff]">
                      Coming Soon!
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                  {featuredEvent.title}
                </h1>

                <p className="text-lg text-muted-foreground max-w-lg">
                  {featuredEvent.shortDescription || featuredEvent.description.slice(0, 150) + '...'}
                </p>

                <div className="flex flex-wrap gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#8982ff]" />
                    <span>{formatEventDate(featuredEvent, 'full')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#8982ff]" />
                    <span>{formatEventTime(featuredEvent)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {featuredEvent.location.format === 'online' ? (
                      <>
                        <Video className="w-5 h-5 text-[#8982ff]" />
                        <span>Online Event</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5 text-[#8982ff]" />
                        <span>
                          {featuredEvent.location.venueName},{' '}
                          {featuredEvent.location.city}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {featuredEvent.registration?.attendeeCount && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-5 h-5 text-[#8982ff]" />
                    <span>
                      {featuredEvent.registration.attendeeCount} people attending
                    </span>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button asChild size="lg">
                    <Link href={`/events/${featuredEvent.slug}`}>
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg">
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
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Upcoming Events Section */}
      <Section className="bg-surface-periwinkle" spacing="section">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Upcoming Events
              </h2>
              <p className="text-muted-foreground mt-1">
                Join us at our upcoming workshops, networking events, and more
              </p>
            </div>
          </div>

          {/* Events Grid */}
          <EventList
            events={allUpcoming}
            columns={3}
            emptyMessage="No upcoming events at the moment. Check back soon!"
          />
        </Container>
      </Section>

      {/* Past Events Section */}
      {allPast.length > 0 && (
        <Section className="bg-surface-periwinkle" spacing="section">
          <Container>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Past Events
                </h2>
                <p className="text-muted-foreground mt-1">
                  Explore highlights from our previous events
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPast.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </div>
          </Container>
        </Section>
      )}

    </div>
  );
}
