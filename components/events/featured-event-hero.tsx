"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { CurtainReveal } from "@/components/ui/reveal";
import { curatedImages } from "@/public/img/curated";
import type { EventListItem } from "@/lib/data/event-list-item";
import { daysUntilDate, formatDateString } from "@/lib/data/event-utils";
import { useTicketStatus } from "@/hooks/use-ticket-status";

const FALLBACK_HERO = curatedImages["hero-conference-crowd"];

interface FeaturedEventHeroProps {
  event?: EventListItem;
}

function FallbackHero() {
  return (
    <div className="relative isolate mt-12 flex min-h-[320px] items-center justify-center overflow-hidden rounded-[32px] border border-border sm:min-h-[400px] md:min-h-[500px] lg:min-h-[560px]">
      <Image
        src={FALLBACK_HERO.src}
        alt={FALLBACK_HERO.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Navy scrim — ambient veil kept light, deeper toward the base */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/40 to-foreground/25" />
      <div className="relative z-10 max-w-2xl px-6 text-center">
        {/* h2, not h1 — the page-level h1 lives in app/(site)/events/page.tsx
            so the heading order is identical whether or not a featured event
            exists. */}
        <h2 className="text-display-md text-white mb-4">
          Events &amp; workshops
        </h2>
        <p className="text-base md:text-lg text-white/80 mb-8 leading-relaxed">
          We bring women in tech together through workshops, panels, and
          networking events. Stay tuned for upcoming opportunities.
        </p>
        <Button asChild variant="brand" size="lg">
          <Link href="#past-events">
            See past events
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function FeaturedEventContent({ event }: { event: EventListItem }) {
  const daysUntil = daysUntilDate(event.date);
  const displayTime = event.displayTime;
  const locationLabel = event.venueName
    ? `${event.venueName}${event.city ? `, ${event.city}` : ""}`
    : event.city || null;

  const registerHref = event.registrationUrl || `/events/${event.slug}`;
  const isExternal = !!event.registrationUrl;

  // Live from Humanitix. `"unknown"` — the value while the request is in flight,
  // and the value for every failure — leaves the hero exactly as it is today.
  const ticketStatus = useTicketStatus(event.slug);
  const registrationBlocked =
    ticketStatus === "sold-out" || ticketStatus === "closed";
  const blockedLabel =
    ticketStatus === "sold-out" ? "Sold out" : "Registration closed";
  // Same reasoning as the event sidebar: a disabled button is not focusable, so
  // the explanation has to be a live region rather than `aria-describedby`.
  const statusNote =
    ticketStatus === "sold-out"
      ? "This event has sold out. Registration is closed."
      : ticketStatus === "closed"
        ? "Registration for this event has closed."
        : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mt-12 items-center">
      {/* Left: event information */}
      <div className="order-2 lg:order-1 flex flex-col justify-center py-2 lg:py-8">
        <p className="text-label text-ink-500 mb-4">Featured event</p>

        {/* Countdown chip */}
        {daysUntil > 0 && (
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f7e5f3] px-3 py-1 text-sm font-medium text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
            </span>
          </div>
        )}

        {/* Title */}
        <h2 className="text-display-sm text-foreground mb-6">{event.title}</h2>

        {/* Meta row */}
        <div className="flex flex-col gap-3 mb-6 text-ink-600">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 shrink-0 text-ink-500" />
            <span className="text-base md:text-lg">
              {formatDateString(event.date, "full")}
            </span>
          </div>
          {displayTime && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 shrink-0 text-ink-500" />
              <span className="text-base md:text-lg">{displayTime}</span>
            </div>
          )}
          {locationLabel && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 shrink-0 text-ink-500" />
              <span className="text-base md:text-lg">{locationLabel}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.shortDescription && (
          <p className="text-base md:text-lg text-ink-600 leading-relaxed mb-8 line-clamp-3">
            {event.shortDescription}
          </p>
        )}

        {/* Actions */}
        {statusNote && (
          <p role="status" className="text-base text-ink-600 mb-4">
            {statusNote}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {registrationBlocked ? (
            // A real <button disabled>, not the `asChild` Link: an anchor cannot
            // be disabled, and one that still navigates to a shut ticket page is
            // worse than no link at all.
            <Button variant="brand" size="lg" disabled>
              {blockedLabel}
            </Button>
          ) : (
            <Button asChild variant="brand" size="lg">
              <Link
                href={registerHref}
                {...(isExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                Register now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg">
            <Link href={`/events/${event.slug}`}>View details</Link>
          </Button>
        </div>
      </div>

      {/* Right: cover image in a hairline editorial frame */}
      <div className="order-1 lg:order-2">
        <CurtainReveal className="relative w-full aspect-4/5 overflow-hidden rounded-[32px] border border-border">
          <Image
            src={event.imageUrl}
            alt={event.imageAlt || event.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-top"
          />
        </CurtainReveal>
      </div>
    </div>
  );
}

export function FeaturedEventHero({ event }: FeaturedEventHeroProps) {
  return (
    <Section spacing="section">
      <Container size="full">
        {event ? <FeaturedEventContent event={event} /> : <FallbackHero />}
      </Container>
    </Section>
  );
}
