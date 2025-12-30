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

  const isOnline = featuredEvent.location.format === "online";
  const locationText = isOnline
    ? "Online Event"
    : `${featuredEvent.location.venueName || ""}, ${featuredEvent.location.city || ""}`;

  return (
    <Section
      id="upcoming-event"
      className="bg-surface-periwinkle rounded-[50px]"
    >
      <Container size="full">
        <AnimateOnScroll
          variant="fade-up"
          className="text-center mb-8 sm:mb-20"
        >
          <h2 className="text-display-sm text-foreground">Upcoming Event</h2>
        </AnimateOnScroll>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left side - Large image */}
          <AnimateOnScroll variant="fade-right" className="w-full lg:w-1/2">
            <div className="relative aspect-600/380 max-w-[600px] mx-auto lg:mx-0">
              {/* Background div with slight tilt - responsive */}
              <div className="absolute inset-0 bg-muted-foreground/20 rounded-[50px] transform rotate-0 md:rotate-[-4deg] translate-x-0 md:translate-x-[-10px] translate-y-[-10px]"></div>
              {/* Image positioned on top */}
              <Image
                src={featuredEvent.coverImage}
                alt={featuredEvent.title}
                fill
                className="rounded-[50px] relative z-10 object-cover"
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
              <div className="absolute -left-4 -top-2 opacity-20">
                <BauhausQuarterCircle
                  size={40}
                  color="hsl(var(--brand))"
                  rotation={-45}
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
                  className="h-1 w-28 rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, hsl(var(--brand)), hsl(var(--periwinkle)))",
                  }}
                ></div>
                <div
                  className="absolute left-32 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full opacity-60"
                  style={{ backgroundColor: "hsl(var(--brand))" }}
                ></div>
                <div
                  className="absolute left-32 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full opacity-40"
                  style={{ backgroundColor: "hsl(var(--periwinkle))" }}
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
                featuredEvent.description.slice(0, 200) + "..."}
            </p>

            <Button asChild size="lg" className="w-fit">
              <Link href={`/events/${featuredEvent.slug}`}>
                Register Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>

            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/events">View all events</Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>
      </Container>
    </Section>
  );
}

export default UpcomingEventSection;
