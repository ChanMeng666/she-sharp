"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import type { EventV3 } from "@/types/event";
import {
  formatEventDate,
  getDaysUntilEvent,
  getEventDisplayTime,
} from "@/lib/data/events";

const FALLBACK_HERO_IMAGE = "/img/2026.jpg";

interface FeaturedEventHeroProps {
  event?: EventV3;
}

function HeroButtons({ slug, registrationUrl }: { slug: string; registrationUrl?: string }) {
  const [isHovered, setIsHovered] = useState<"details" | "register" | null>(
    null
  );

  const registerHref = registrationUrl || `/events/${slug}`;
  const isExternal = !!registrationUrl;

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={`/events/${slug}`}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300"
        style={{
          backgroundColor: isHovered === "details" ? "#333333" : "#000000",
          color: "#ffffff",
        }}
        onMouseEnter={() => setIsHovered("details")}
        onMouseLeave={() => setIsHovered(null)}
      >
        View Details
        <ArrowRight className="w-5 h-5" />
      </Link>
      <Link
        href={registerHref}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 border-2"
        style={{
          backgroundColor: isHovered === "register" ? "#000000" : "transparent",
          color: isHovered === "register" ? "#ffffff" : "#000000",
          borderColor: "#000000",
        }}
        onMouseEnter={() => setIsHovered("register")}
        onMouseLeave={() => setIsHovered(null)}
      >
        Register Now
      </Link>
    </div>
  );
}

function FallbackHero() {
  const [isImageHovered, setIsImageHovered] = useState(false);

  return (
    <div className="relative w-full h-[320px] sm:h-[400px] md:h-[500px] lg:h-[600px] card-md overflow-hidden mt-12">
      <div
        className="absolute inset-0 overflow-hidden card-md"
        onMouseEnter={() => setIsImageHovered(true)}
        onMouseLeave={() => setIsImageHovered(false)}
      >
        <Image
          src={FALLBACK_HERO_IMAGE}
          alt="She Sharp events"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top transition-transform duration-300"
          style={{
            transform: isImageHovered ? "scale(1.05)" : "scale(1)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-center justify-center">
          <div className="text-center px-6 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Events &amp; Workshops
            </h2>
            <p className="text-base md:text-lg text-white/80 mb-8 leading-relaxed">
              We bring women in tech together through workshops, panels, and networking events. Stay tuned for upcoming opportunities.
            </p>
            <Link
              href="#past-events"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-white text-black hover:bg-white/90 transition-colors"
            >
              See Past Events
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedEventContent({ event }: { event: EventV3 }) {
  const [isImageHovered, setIsImageHovered] = useState(false);

  const daysUntil = getDaysUntilEvent(event);
  const displayTime = getEventDisplayTime(event);
  const location = event.detailPageData.location;
  const locationLabel = location?.venueName
    ? `${location.venueName}${location.city ? `, ${location.city}` : ""}`
    : location?.city || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mt-12 items-stretch">
      {/* Left: Event information */}
      <div className="flex flex-col justify-center order-2 lg:order-1 py-2 lg:py-8">
        {/* Countdown badge */}
        {daysUntil > 0 && (
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9b2e83]/10 text-[#9b2e83] text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9b2e83] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9b2e83]" />
              </span>
              {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
            </span>
          </div>
        )}

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight mb-6">
          {event.title}
        </h2>

        {/* Event meta info */}
        <div className="flex flex-col gap-3 mb-6 text-muted-foreground">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 shrink-0" />
            <span className="text-base md:text-lg">{formatEventDate(event, "full")}</span>
          </div>
          {displayTime && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 shrink-0" />
              <span className="text-base md:text-lg">{displayTime}</span>
            </div>
          )}
          {locationLabel && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 shrink-0" />
              <span className="text-base md:text-lg">{locationLabel}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.shortDescription && (
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 line-clamp-3">
            {event.shortDescription}
          </p>
        )}

        {/* Action buttons */}
        <HeroButtons slug={event.slug} registrationUrl={event.detailPageData.registrationUrl} />
      </div>

      {/* Right: Cover image */}
      <div className="order-1 lg:order-2">
        <div
          className="relative w-full aspect-4/5 card-md overflow-hidden"
          onMouseEnter={() => setIsImageHovered(true)}
          onMouseLeave={() => setIsImageHovered(false)}
        >
          <Image
            src={event.coverImage.url}
            alt={event.coverImage.alt || event.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-top transition-transform duration-500"
            style={{
              transform: isImageHovered ? "scale(1.03)" : "scale(1)",
            }}
          />
        </div>
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
