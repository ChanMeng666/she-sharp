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
  isFutureDate,
} from "@/lib/data/events";

const DISPLAY_COUNT = 4;

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
      className="group block h-full rounded-2xl border border-muted-foreground/10 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Cover image */}
      <div className="relative aspect-16/10 overflow-hidden">
        <Image
          src={displayImage}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized={displayImage.startsWith("/img/")}
        />
      </div>

      {/* Content */}
      <div className="p-2 md:p-4 flex flex-col gap-3">
        {/* Format label */}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {isUpcoming ? "Upcoming" : "Past Event"}
        </span>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-brand transition-colors duration-200">
          {event.title.length > 30
            ? `${event.title.slice(0, 30)}...`
            : event.title}
        </h3>

        {/* Date */}
        <div className="flex items-center text-sm text-muted-foreground">
          <span>{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
}

export function RecentEventsSection() {
  const featured = getFeaturedEvent();
  const featuredSlug = featured?.slug;

  const upcoming = getUpcomingEvents()
    .filter((e) => e.slug !== featuredSlug)
    .slice(0, DISPLAY_COUNT);

  const shortfall = DISPLAY_COUNT - upcoming.length;
  const past = shortfall > 0 ? getPastEvents(shortfall) : [];
  const events = [...upcoming, ...past].slice(0, DISPLAY_COUNT);

  if (events.length === 0) return null;

  return (
    <Section className="bg-white px-4 md:px-8 lg:px-12 pt-4 md:pt-8">
      <Container size="full">
        <AnimateOnScroll variant="fade-up" className="mb-6 md:mb-8">
          <div className="flex items-center gap-4 md:gap-6">
          <h2 className="text-xl md:text-2xl text-foreground font-bold">More Events</h2>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="hidden md:inline-flex"
            >
              <Link href="/events">
                View All Events
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {events.map((event, index) => (
            <AnimateOnScroll
              key={event.slug}
              variant="fade-up"
              delay={index * 80}
            >
              <SimpleEventCard event={event} />
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll variant="fade-up" className="mt-8 text-center md:hidden">
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
