"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, Video, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { getFeaturedEvent, getUpcomingEvents, formatEventDate, formatEventTime } from "@/lib/data/events";

export function UpcomingEventSection() {
  const featuredEvent = getFeaturedEvent() || getUpcomingEvents(1)[0];

  if (!featuredEvent) {
    return null;
  }

  const isOnline = featuredEvent.location.format === 'online';
  const locationText = isOnline
    ? 'Online Event'
    : `${featuredEvent.location.venueName || ''}, ${featuredEvent.location.city || ''}`;

  return (
    <Section id="upcoming-event" className="bg-muted">
        <div className="mx-auto max-w-7xl">
          <AnimateOnScroll variant="fade-up" className="text-center mb-8 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Upcoming Event
            </h2>
          </AnimateOnScroll>

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left side - Large image */}
            <AnimateOnScroll variant="fade-right" className="w-full lg:w-1/2">
              <div className="relative">
                {/* Background div with slight tilt */}
                <div
                  className="absolute bg-muted-foreground/20 rounded-4xl transform rotate-[-4deg] translate-x-[-10px] translate-y-[-10px]"
                  style={{ width: '600px', height: '380px' }}
                ></div>
                {/* Image positioned on top */}
                <Image
                  src={featuredEvent.coverImage}
                  alt={featuredEvent.title}
                  width={600}
                  height={380}
                  className="rounded-4xl relative z-10 object-cover"
                />
              </div>
            </AnimateOnScroll>

            {/* Right side - Text content */}
            <AnimateOnScroll variant="fade-left" className="w-full lg:w-1/2 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-foreground mb-12">
                {featuredEvent.title}
              </h3>

              <div className="space-y-2 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatEventDate(featuredEvent, 'full')}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatEventTime(featuredEvent)}
                </div>
                <div className="flex items-center gap-2">
                  {isOnline ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  {locationText}
                </div>
              </div>

              <p className="text-muted-foreground text-base leading-relaxed mb-8">
                {featuredEvent.shortDescription || featuredEvent.description.slice(0, 200) + '...'}
              </p>

              <Button asChild size="lg" className="w-fit">
                <Link href={`/events/${featuredEvent.slug}`}>
                  Register Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>

              <div className="mt-4">
                <Button variant="outline" className="underline-offset-4 hover:underline" asChild>
                  <Link href="/events">View all events</Link>
                </Button>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
    </Section>
  );
}

export default UpcomingEventSection;
