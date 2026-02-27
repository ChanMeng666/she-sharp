import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getAllEvents,
  getEventBySlug,
  getUpcomingEvents,
  hasAnySpeakers,
  hasPhotos,
  hasSpecialSections,
} from "@/lib/data/events";
import {
  EventHeader,
  EventDescription,
  EventSpeakers,
  EventSidebarPanel,
  EventPhotos,
  EventSponsorship,
  EventSponsors,
  EventSpecialSections,
} from "@/components/events/event-detail";
import { EventCard } from "@/components/events/event-card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

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
      title: "Event Not Found | She Sharp",
    };
  }

  const description =
    event.shortDescription ||
    event.detailPageData.fullDescription[0]?.slice(0, 160) ||
    "";

  return {
    title: `${event.title} | She Sharp Events`,
    description,
    openGraph: {
      title: event.title,
      description,
      images: [event.coverImage.url],
      type: "website",
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
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div>
          <EventHeader event={event} />
        </div>
      </div>

      {/* Main Content Section */}
      <Section spacing="section">
        <Container size="full">
          {/* Back to Events Link */}
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-brand transition-all duration-300 font-bold group mb-6 uppercase"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ">
              <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5 text-brand" />
            </span>
            <span className="relative text-brand">
              Back to Events
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand transition-all duration-300 group-hover:w-full" />
            </span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-12">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-12">
                {event.title}
              </h1>

              {/* Subtitle if available */}
              {event.detailPageData.subtitle && (
                <p className="text-xl text-muted-foreground -mt-8">
                  {event.detailPageData.subtitle}
                </p>
              )}

              <EventDescription event={event} />

              {/* Special Sections (workshop prep, videos, etc.) */}
              {hasSpecialSections(event) && (
                <EventSpecialSections
                  sections={event.detailPageData.specialSections}
                />
              )}

              <div className="w-full md:pr-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.coverImage.url}
                  alt={event.coverImage.alt || event.title}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="lg:col-span-5 xl:col-span-4">
              <EventSidebarPanel event={event} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Speakers Section */}
      {hasAnySpeakers(event) && (
        <div>
          <EventSpeakers event={event} />
        </div>
      )}

      {/* Event Sponsors (logos) */}
      <div >
        <EventSponsors event={event} />
      </div>

      {/* Sponsorship Section */}
      <div>
        <EventSponsorship event={event} />
      </div>

      {/* Photos Section */}
      {hasPhotos(event) && (
        <div className="bg-white">
          <EventPhotos event={event} />
        </div>
      )}

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <Section spacing="section" className="bg-muted pb-24">
          <Container size="full">
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground mb-8 uppercase">
              More Events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
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
