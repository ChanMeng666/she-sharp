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
  EventSessions,
  EventSchedule,
  EventInfoSections,
  EventSpeakers,
  EventSidebarPanel,
  EventPhotos,
  EventSponsorship,
  EventDonationCta,
  EventSponsors,
  EventSpecialSections,
  EventFeaturedPhoto,
  EventPosters,
} from "@/components/events/event-detail";
import { EventCard } from "@/components/events/event-card";
import { eventArchivePhotos } from "@/lib/data/event-archive-photos";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { JsonLd } from "@/components/seo/json-ld";
import { eventSchema, breadcrumbSchema } from "@/lib/seo/schema";

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
      title: { absolute: "Event Not Found | She Sharp" },
    };
  }

  const description =
    event.shortDescription ||
    event.detailPageData.fullDescription[0]?.slice(0, 160) ||
    "";

  return {
    title: { absolute: `${event.title} | She Sharp` },
    description,
    alternates: {
      canonical: `/events/${slug}`,
    },
    openGraph: {
      title: event.title,
      description,
      images: [event.coverImage.url],
      type: "article",
      url: `/events/${slug}`,
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

  // Past events that ship no on-page photos fall back to the harvested archive set.
  const archivePhotos = eventArchivePhotos[event.slug];
  const useArchivePhotos =
    !hasPhotos(event) && !!archivePhotos && archivePhotos.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          eventSchema(event),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: event.title, path: `/events/${event.slug}` },
          ]),
        ]}
      />
      {/* Header — full-bleed real event photo with navy scrim */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <EventHeader event={event} />
      </div>

      {/* Main Content Section */}
      <Section spacing="section">
        <Container size="full">
          {/* Back to Events Link */}
          <Link
            href="/events"
            className="group mb-6 inline-flex items-center gap-2 font-medium text-brand transition-colors hover:text-brand-hover"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to events
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12 items-start">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-8 md:space-y-12">
              {/* Cover image — full poster in a hairline editorial frame */}
              <figure className="overflow-hidden rounded-[32px] border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.coverImage.url}
                  alt={event.coverImage.alt || event.title}
                  className="w-full h-auto object-cover"
                />
              </figure>

              <EventDescription event={event} />

              {/* Special Sections (workshop prep, videos, etc.) */}
              {hasSpecialSections(event) && (
                <EventSpecialSections
                  sections={event.detailPageData.specialSections}
                />
              )}
            </div>

            {/* Sidebar - Right Column — sticky on desktop so "Time & location"
                floats alongside long left-column content instead of leaving the
                right side blank on scroll. */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 lg:self-start">
              <EventSidebarPanel event={event} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Promotional posters */}
      <EventPosters event={event} />

      {/* Sessions Section (conference agenda) */}
      <EventSessions event={event} />

      {/* Schedule / Agenda (day-of timetable) */}
      <EventSchedule event={event} />

      {/* Speakers Section */}
      {hasAnySpeakers(event) && (
        <div>
          <EventSpeakers event={event} />
        </div>
      )}


      {/* Featured group photo - displayed prominently before description */}
      <EventFeaturedPhoto event={event} />

      {/* Event Sponsors (logos) */}
      <div >
        <EventSponsors event={event} />
      </div>

      {/* Photos Section */}
      {(hasPhotos(event) || useArchivePhotos) && (
        <div className="bg-background">
          <EventPhotos
            event={event}
            archivePhotos={useArchivePhotos ? archivePhotos : undefined}
          />
        </div>
      )}

      {/* Info sections (resources, getting there, venue, key contact) */}
      <EventInfoSections event={event} />

      {/* Sponsorship Section */}
      <div>
        <EventSponsorship event={event} />
      </div>

      {/* Donation / attend CTA (mirrors the legacy conference closing block) */}
      <EventDonationCta />

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <Section spacing="section" className="bg-muted pb-20 lg:pb-24">
          <Container size="full">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-8">
              More events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
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
