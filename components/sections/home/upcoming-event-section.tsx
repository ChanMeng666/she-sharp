"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { upcomingEventDefault } from "@/lib/data/upcoming-event";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
export function UpcomingEventSection() {
  return (
    <Section id="upcoming-event" className="bg-gradient-to-b from-gray-950/95 via-black/95 to-gray-950/95">
        <div className="mx-auto max-w-7xl">
          <AnimateOnScroll variant="fade-up" className="text-center mb-8 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ghost-white">
              Upcoming Event
            </h2>
          </AnimateOnScroll>

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left side - Large image */}
            <AnimateOnScroll variant="fade-right" className="w-full lg:w-1/2">
              <div className="relative">
                {/* Background div with slight tilt */}
                <div 
                  className="absolute bg-purple-dark/30 rounded-4xl transform rotate-[-4deg] translate-x-[-10px] translate-y-[-10px]"
                  style={{ width: '600px', height: '380px' }}
                ></div>
                {/* Image positioned on top */}
                <Image
                  src={upcomingEventDefault.image}
                  alt={upcomingEventDefault.title}
                  width={600}
                  height={380}
                  className="rounded-4xl relative z-10"
                />
                {/* Dark overlay for better integration */}
                <div className="absolute inset-0 rounded-4xl bg-black/20 z-10 pointer-events-none" />
              </div>
            </AnimateOnScroll>

            {/* Right side - Text content */}
            <AnimateOnScroll variant="fade-left" className="w-full lg:w-1/2 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-ghost-white mb-12">
                {upcomingEventDefault.title}
              </h3>
              
              <div className="space-y-2 text-gray-200 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {upcomingEventDefault.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {upcomingEventDefault.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {upcomingEventDefault.location}
                </div>
              </div>

              <p className="text-gray-300 text-base leading-relaxed mb-8">
                {upcomingEventDefault.description}
              </p>

              <Button asChild size="lg" className="w-fit bg-purple-dark hover:bg-purple-dark/90 text-ghost-white">
                <Link href={upcomingEventDefault.href}>
                  Register Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              
              <div className="mt-4">
                <Button variant="link" asChild>
                  <Link href="/events" className="text-purple-dark hover:text-purple-dark/90">View all events</Link>
                </Button>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
    </Section>
  );
}

export default UpcomingEventSection;
