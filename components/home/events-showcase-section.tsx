"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
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

function FeaturedEventCard({ event }: { event: EventV3 }) {
  const dateLabel = formatEventDate(event);
  const location = event.detailPageData.location;
  const isOnline = location.format === "online";
  const formatLabel = isOnline ? "Virtual" : "In Person";

  const description =
    event.shortDescription ||
    event.detailPageData.fullDescription[0]?.slice(0, 160) + "...";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block card-lg border border-muted-foreground/10 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
    >
      <div className="relative aspect-3/4 sm:aspect-4/5 md:aspect-square lg:h-[620px] xl:h-[720px] lg:aspect-auto overflow-hidden">
        <Image
          src={event.coverImage.url}
          alt={event.coverImage.alt || event.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      <div className="p-5 md:p-6 lg:p-8 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {dateLabel}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground">{formatLabel}</span>
        </div>

        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground leading-snug group-hover:text-brand transition-colors duration-200">
          {event.title}
        </h3>

        <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </p>

        <span className="inline-flex items-center gap-1.5 text-brand font-semibold text-sm md:text-lg group-hover:underline transition-all mt-1">
          Register
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function SimpleEventCard({ event }: { event: EventV3 }) {
  const isUpcoming = isFutureDate(event.date);
  const eventDate = parseDateString(event.date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const displayImage = event.coverImage?.url || "/logos/she-sharp-logo.svg";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col h-full card-sm border border-muted-foreground/10 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
    >
      <div className="relative aspect-4/5 lg:aspect-auto lg:flex-1 lg:min-h-0 overflow-hidden">
        <Image
          src={displayImage}
          alt={event.title}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized={displayImage.startsWith("/img/")}
        />
      </div>

      <div className="p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2">
        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {isUpcoming ? "Upcoming" : "Past Event"}
        </span>

        <h3 className="text-xs sm:text-sm md:text-base font-bold text-foreground leading-snug group-hover:text-brand transition-colors duration-200 line-clamp-2">
          {truncateTitle(event.title)}
        </h3>

        <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
          {formattedDate}
        </span>
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
  const sideEvents = [...upcoming, ...past].slice(0, SIDE_CARD_COUNT);

  if (!featuredEvent && sideEvents.length === 0) return null;

  return (
  <Section spacing="section"  id="upcoming-event" className="bg-white py-16 xl:py-24 2xl:py-32">
      <Container size="full">
        <AnimateOnScroll variant="fade-up" className="mb-12 md:mb-16 lg:mb-20">
          <h2 className="text-display-sm text-foreground">Recent events</h2>
        </AnimateOnScroll>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12 items-stretch">
          {/* Left: Featured event */}
          {featuredEvent && (
            <AnimateOnScroll variant="fade-right" className="w-full lg:w-1/2">
              <FeaturedEventCard event={featuredEvent} />
            </AnimateOnScroll>
          )}

          {/* Right: 2x2 grid */}
          {sideEvents.length > 0 && (
            <div className="w-full lg:w-1/2 grid grid-cols-2 lg:grid-rows-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {sideEvents.map((event, index) => (
                <AnimateOnScroll
                  key={event.slug}
                  variant="fade-up"
                  delay={index * 80}
                  className="h-full"
                >
                  <SimpleEventCard event={event} />
                </AnimateOnScroll>
              ))}
            </div>
          )}
        </div>

        <AnimateOnScroll variant="fade-up" className="mt-10 text-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/events">
              View All Events
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </AnimateOnScroll>
      </Container>
    </Section>
  );
}