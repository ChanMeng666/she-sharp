"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { Reveal, CurtainReveal } from "@/components/ui/reveal";
import { EventV3 } from "@/types/event";
import {
  getUpcomingEvents,
  getPastEvents,
  getFeaturedEvent,
  parseDateString,
  formatEventDate,
  isFutureDate,
} from "@/lib/data/events";

const SIDE_CARD_COUNT = 4;
const TITLE_MAX_LENGTH = 80;

function truncateTitle(title: string): string {
  if (title.length <= TITLE_MAX_LENGTH) return title;
  return `${title.slice(0, TITLE_MAX_LENGTH)}...`;
}

function StatusBadge({ upcoming }: { upcoming: boolean }) {
  return upcoming ? (
    <span className="inline-flex items-center gap-2 rounded-[12px] bg-brand px-3 py-1.5 text-xs font-semibold text-white">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      Upcoming
    </span>
  ) : (
    <span className="inline-flex items-center rounded-[12px] bg-foreground/80 px-3 py-1.5 text-xs font-semibold text-white">
      Past event
    </span>
  );
}

function FeaturedEventCard({ event }: { event: EventV3 }) {
  const dateLabel = formatEventDate(event);
  const isUpcoming = isFutureDate(event.date);
  const location = event.detailPageData.location;
  const formatLabel = location.format === "online" ? "Virtual" : "In person";

  const description =
    event.shortDescription ||
    event.detailPageData.fullDescription[0]?.slice(0, 160) + "...";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block h-full overflow-hidden rounded-[32px] border border-border bg-white transition-colors duration-300 hover:border-foreground/30"
    >
      <CurtainReveal className="relative aspect-4/5 md:aspect-square lg:aspect-4/5 overflow-hidden">
        <Image
          src={event.coverImage.url}
          alt={event.coverImage.alt || event.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority
        />
        <div className="absolute left-4 top-4 z-10">
          <StatusBadge upcoming={isUpcoming} />
        </div>
      </CurtainReveal>

      <div className="flex flex-col gap-3 p-6 md:p-8 lg:p-10">
        <div className="flex items-center gap-3">
          <span className="text-label text-ink-500">{dateLabel}</span>
          <span className="text-sm text-ink-500">{formatLabel}</span>
        </div>

        <h3 className="text-2xl font-bold leading-snug text-foreground transition-colors duration-200 group-hover:text-brand md:text-3xl">
          {event.title}
        </h3>

        <p className="line-clamp-2 text-base leading-relaxed text-ink-600">
          {description}
        </p>

        <span className="mt-1 inline-flex items-center gap-1.5 text-base font-semibold text-brand">
          {isUpcoming ? "Register" : "View event"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function SimpleEventCard({ event }: { event: EventV3 }) {
  const isUpcoming = isFutureDate(event.date);
  const formattedDate = parseDateString(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const displayImage = event.coverImage?.url || "/logos/she-sharp-logo.svg";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[32px] border border-border bg-white transition-colors duration-300 hover:border-foreground/30"
    >
      <CurtainReveal className="relative aspect-4/3 overflow-hidden">
        <Image
          src={displayImage}
          alt={event.title}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized={displayImage.startsWith("/img/")}
        />
      </CurtainReveal>

      <div className="flex flex-col gap-2 p-4 md:p-5">
        <StatusBadge upcoming={isUpcoming} />
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors duration-200 group-hover:text-brand md:text-base">
          {truncateTitle(event.title)}
        </h3>
        <span className="text-label text-ink-500">{formattedDate}</span>
      </div>
    </Link>
  );
}

export function EventsShowcaseSection() {
  const featuredEvent = getFeaturedEvent() || getUpcomingEvents(1)[0];
  const featuredSlug = featuredEvent?.slug;

  const upcoming = getUpcomingEvents()
    .filter((e) => e.slug !== featuredSlug)
    .slice(0, SIDE_CARD_COUNT);

  const shortfall = SIDE_CARD_COUNT - upcoming.length;
  const past = shortfall > 0 ? getPastEvents(shortfall) : [];
  const sideEvents = [...upcoming, ...past]
    .sort(
      (a, b) =>
        parseDateString(b.date).getTime() - parseDateString(a.date).getTime()
    )
    .slice(0, SIDE_CARD_COUNT);

  if (!featuredEvent && sideEvents.length === 0) return null;

  // Vertical offsets stagger the side cards into an editorial rhythm on desktop.
  const sideOffsets = ["lg:mt-0", "lg:mt-10", "lg:mt-0", "lg:mt-10"];

  return (
    <Section bgColor="white" id="upcoming-event">
      <Container size="full">
        <Reveal className="mb-12 flex items-end justify-between gap-6 md:mb-16">
          <div>
            <span className="text-label mb-3 block text-brand">(01)</span>
            <h2 className="text-display-sm text-foreground">Upcoming events</h2>
          </div>
          <span className="text-outline hidden text-display-sm text-foreground md:block">
            gather
          </span>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Featured event — the wide editorial anchor. */}
          {featuredEvent && (
            <div className="lg:col-span-7 xl:col-span-6">
              <Reveal variant="fade-right">
                <FeaturedEventCard event={featuredEvent} />
              </Reveal>
            </div>
          )}

          {/* Four smaller image-top cards on staggered offsets. */}
          {sideEvents.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-5 lg:content-start xl:col-span-6">
              {sideEvents.map((event, index) => (
                <Reveal
                  key={event.slug}
                  variant="fade-up"
                  delay={index * 80}
                  className={sideOffsets[index]}
                >
                  <SimpleEventCard event={event} />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        <Reveal className="mt-14 text-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/events">
              View all events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </Container>
    </Section>
  );
}
