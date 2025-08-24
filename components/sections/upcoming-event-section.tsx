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
import Iridescence, { brandColors } from "@/components/effects/iridescence";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export function UpcomingEventSection() {
  const { ref, inView } = useInView();
  const reduceMotion = usePrefersReducedMotion();
  return (
    <Section id="upcoming-event" className="bg-white py-16 md:py-20">
      <div ref={ref} className="relative">
        {inView && !reduceMotion && (
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <Iridescence
              color={brandColors.eventsMinty}
              mouseReact={false}
              amplitude={0.05}
              speed={0.22}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/40 to-white/60" />
          </div>
        )}
      <Container>
        <div className="text-center mb-8 md:mb-12">
          <Badge className="mb-3 bg-purple-dark text-white">Upcoming Event</Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark">
            Don’t miss what’s next
          </h2>
        </div>

        <Card className="overflow-hidden border-2 border-purple-light">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative">
              <AspectRatio ratio={16 / 10}>
                <Image
                  src={upcomingEventDefault.image}
                  alt={upcomingEventDefault.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </AspectRatio>
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <h3 className="text-xl md:text-2xl font-bold text-navy-dark mb-2">
                {upcomingEventDefault.title}
              </h3>
              <div className="space-y-1 text-sm text-gray mb-4">
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
              <p className="text-gray mb-6">{upcomingEventDefault.description}</p>
              <Button asChild size="lg" className="w-fit bg-purple-dark hover:bg-purple-mid">
                <Link href={upcomingEventDefault.href}>
                  Register Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <div className="mt-3">
                <Button variant="link" asChild>
                  <Link href="/events">View all events</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Container>
      </div>
    </Section>
  );
}

export default UpcomingEventSection;


