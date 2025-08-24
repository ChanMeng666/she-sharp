'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { layoutSystem, layoutClasses } from '@/lib/layout-system';
import Iridescence, { brandColors } from '@/components/effects/iridescence';

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'online' | 'in-person' | 'workshop';
  daysUntil: number;
  href: string;
}

// Mock data - replace with actual data
const upcomingEvents: UpcomingEvent[] = [
  {
    id: 'thrive-your-career-your-story',
    title: 'THRIVE: Your Career, Your Story',
    date: 'March 15, 2025',
    time: '6:00 PM - 8:30 PM',
    location: 'Auckland CBD',
    type: 'in-person',
    daysUntil: 7,
    href: '/events/thrive-your-career-your-story'
  },
  {
    id: 'tech-talk-ai-healthcare',
    title: 'Tech Talk: AI in Healthcare',
    date: 'March 22, 2025',
    time: '12:00 PM - 1:00 PM',
    location: 'Online via Zoom',
    type: 'online',
    daysUntil: 14,
    href: '#official-calendar'
  },
  {
    id: 'coding-workshop-react-fundamentals',
    title: 'Coding Workshop: React Fundamentals',
    date: 'March 29, 2025',
    time: '10:00 AM - 2:00 PM',
    location: 'Wellington Tech Hub',
    type: 'workshop',
    daysUntil: 21,
    href: '#official-calendar'
  }
];

export function EventsTimelineHero() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-white overflow-hidden">
      {/* Iridescence dynamic background */}
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
        <Iridescence 
          color={brandColors.navPrograms}
          mouseReact={false}
          amplitude={0.15}
          speed={0.35}
          className="w-full h-full"
        />
      </div>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 z-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-mint-light rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-mint-light rounded-full blur-3xl" />
      </div>
      <div className="relative z-10">
      <Container size="content" className="relative py-16 md:py-24">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-mint-dark text-white border-0">
            Upcoming Events
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-dark dark:text-white mb-4">
            Your Next Tech Journey
            <span className="block text-3xl md:text-4xl lg:text-5xl text-mint-dark mt-2">
              Starts Here
            </span>
          </h1>
          <p className="text-lg text-white max-w-2xl mx-auto">
            Connect, learn, and grow with She Sharp&apos;s upcoming events. 
            From workshops to networking sessions, find your next opportunity.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Timeline line */}
          <div className={cn(
            "absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-mint-light z-0",
            layoutSystem.patterns.timeline.line
          )} />

          {/* Events */}
          <div className="space-y-8">
            {upcomingEvents.map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  "relative flex items-center",
                  index % 2 === 0 ? "justify-start" : "justify-end"
                )}
              >
                {/* Timeline dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-mint-dark rounded-full ring-4 ring-white z-10" />

                {/* Event card */}
                <Link
                  href={event.href}
                  className={cn(
                    "group relative w-full md:w-5/12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 p-6 backdrop-blur-md bg-white/60 dark:bg-gray-900/40",
                    "border border-white/40 dark:border-gray-700/50 hover:border-mint-dark",
                    index % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
                  )}
                >
                  {/* Days until badge */}
                  <Badge className="absolute -top-3 -right-3 bg-mint-dark text-navy-dark border-0">
                    {event.daysUntil === 0 ? 'Today' : `${event.daysUntil} days`}
                  </Badge>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg text-navy-dark dark:text-white group-hover:text-mint-dark transition-colors">
                        {event.title}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-mint-dark transition-colors" />
                    </div>

                    <div className="space-y-2 text-sm text-gray">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-mint-dark" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-mint-dark" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-mint-dark" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <Badge 
                      variant="outline" 
                      className={cn(
                        "w-fit",
                        event.type === 'online' && "border-navy-dark text-navy-dark",
                        event.type === 'in-person' && "border-mint-dark text-mint-dark",
                        event.type === 'workshop' && "border-mint-mid text-mint-mid"
                      )}
                    >
                      {event.type === 'online' ? 'Online Event' : event.type === 'in-person' ? 'In Person' : 'Workshop'}
                    </Badge>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* View all events button */}
          <div className="text-center mt-12 relative z-20">
            <Link
              href="#official-calendar"
              className="inline-flex items-center gap-2 px-6 py-3 bg-mint-dark text-white rounded-lg hover:bg-mint-mid transition-colors duration-150"
            >
              View All Events
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Live clock */}
        <div className="text-center mt-8 text-sm text-white">
          Current time: {currentTime.toLocaleTimeString('en-NZ', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Pacific/Auckland'
          })} NZDT
        </div>
      </Container>
      </div>
    </section>
  );
}