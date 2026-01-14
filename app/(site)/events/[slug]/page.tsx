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
  EventSidebarPanel,
} from '@/components/events/event-detail';
import { EventCard } from '@/components/events/event-card';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

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
    <div className="min-h-screen">
      {/* Main Content Section */}
      <Section spacing="section">
        <Container size="full" className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-10">
              <EventHeader event={event} />
              <EventDescription event={event} />

              {event.agenda && event.agenda.length > 0 && (
                <EventAgenda event={event} />
              )}

              {event.speakers && event.speakers.length > 0 && (
                <EventSpeakers event={event} />
              )}

              {/* Event Photos Gallery (for past events) */}
              {event.photos && event.photos.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-medium text-foreground">Photos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {event.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="aspect-square overflow-hidden bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo}
                          alt={`${event.title} photo ${index + 1}`}
                          className="w-full h-full object-cover "
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar - Right Column */}
            <div className="lg:col-span-5 xl:col-span-4">
              <EventSidebarPanel event={event} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <Section spacing="section" className="bg-surface-periwinkle border-t border-foreground/5">
          <Container size="full">
            <h2 className="text-lg font-medium text-foreground mb-8">
              More Events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.map((relatedEvent) => (
                <EventCard key={relatedEvent.slug} event={relatedEvent} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </div>
  );
}
