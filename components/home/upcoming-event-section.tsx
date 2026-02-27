"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, Video, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import {
  getFeaturedEvent,
  getUpcomingEvents,
  formatEventDate,
  formatEventTime,
} from "@/lib/data/events";
import {
  BauhausQuarterCircle,
  BauhausCircle,
} from "@/components/ui/bauhaus-decorations";

export function UpcomingEventSection() {
  const featuredEvent = getFeaturedEvent() || getUpcomingEvents(1)[0];

  if (!featuredEvent) {
    return null;
  }

  const location = featuredEvent.detailPageData.location;
  const isOnline = location.format === "online";
  const locationText = isOnline
    ? "Online Event"
    : `${location.venueName || ""}, ${location.city || ""}`;

  return (
    <Section
      id="upcoming-event"
      className="px-4 md:px-8 lg:px-12 bg-white"
    >
      <Container size="full" className="mt-12 md:mt-16 lg:mt-20">
        <AnimateOnScroll
          variant="fade-up"
          className="text-center mb-12 md:mb-16 lg:mb-20"
        >
          <h2 className="text-display-sm text-foreground">Upcoming Event</h2>
        </AnimateOnScroll>

        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
          {/* Left side - Large image */}
          <AnimateOnScroll variant="fade-right" className="w-full lg:w-1/2">
            <div className="relative aspect-3/4 max-w-[400px] mx-auto lg:mx-0 border border-muted-foreground/20 rounded-2xl">
              {/* Background div with slight tilt - responsive */}
              <div className="absolute inset-0 border border-muted-foreground/20 rounded-2xl transform rotate-0 md:rotate-8 translate-x-0 md:translate-x-[-10px] translate-y-[-10px]"></div>
              {/* Image positioned on top */}
              <Image
                src={featuredEvent.coverImage.url}
                alt={featuredEvent.coverImage.alt || featuredEvent.title}
                fill
                className="rounded-2xl relative z-10 object-cover"
              />
            </div>
          </AnimateOnScroll>

          {/* Right side - Text content */}
          <AnimateOnScroll
            variant="fade-left"
            className="w-full lg:w-1/2 flex flex-col justify-center"
          >
            <div className="relative mb-12">
              {/* Decorative elements */}
              <div className="absolute -left-12 -top-4 opacity-20">
                <BauhausCircle
                  size={60}
                  color="hsl(var(--brand))"
 
                />
              </div>
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-15">
                <BauhausCircle size={24} color="hsl(var(--brand))" />
              </div>

              {/* Title with decorative underline */}
              <h3 className="text-2xl font-bold text-brand relative z-10">
                {featuredEvent.title}
              </h3>

              {/* Decorative underline */}
              <div className="relative mt-4">
                <div
                  className="h-1 w-40 rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, hsl(var(--brand)), hsl(var(--periwinkle)))",
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2 text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatEventDate(featuredEvent, "full")}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatEventTime(featuredEvent)}
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                {locationText}
              </div>
            </div>

            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              {featuredEvent.shortDescription ||
                (featuredEvent.detailPageData.fullDescription[0]?.slice(0, 200) + "...")}
            </p>

            <Button asChild size="lg" className="w-fit">
              <Link href={`/events/${featuredEvent.slug}`}>
                Register Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </AnimateOnScroll>
        </div>
      </Container>
    </Section>
  );
}

export default UpcomingEventSection;
