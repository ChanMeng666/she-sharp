import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllEvents,
  getEventBySlug,
  getUpcomingEvents,
} from '@/lib/data/events';
import {
  EventHeader,
  EventDescription,
  EventAgenda,
  EventSpeakers,
  EventRegistrationCard,
  EventLocationCard,
  EventOrganizerCard,
} from '@/components/events/event-detail';
import { EventCard } from '@/components/events/event-card';

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const events = getAllEvents();
  return events.map((event) => ({
    slug: event.slug,
  }));
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    return {
      title: 'Event Not Found | She Sharp',
    };
  }

  return {
    title: `${event.title} | She Sharp Events`,
    description: event.shortDescription || event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.shortDescription || event.description.slice(0, 160),
      images: [event.coverImage],
      type: 'website',
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const relatedEvents = getUpcomingEvents(3).filter((e) => e.slug !== slug);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-8 space-y-8">
            <EventHeader event={event} />
            <EventDescription event={event} />
            <EventAgenda event={event} />
            <EventSpeakers event={event} />

            {/* Event Photos Gallery (for past events) */}
            {event.photos && event.photos.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-navy-dark">
                  Event Photos
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {event.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={photo}
                        alt={`${event.title} photo ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="lg:col-span-4 space-y-6">
            <EventRegistrationCard event={event} />
            <EventLocationCard event={event} />
            <EventOrganizerCard event={event} />
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <section className="mt-16 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-navy-dark mb-6">
              Other Upcoming Events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.map((relatedEvent) => (
                <EventCard key={relatedEvent.slug} event={relatedEvent} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
