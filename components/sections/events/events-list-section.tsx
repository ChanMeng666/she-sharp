"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getAllEvents, formatEventDate } from "@/lib/data/events";

export function EventsListSection() {
  const [showMore, setShowMore] = useState(false);
  const allEvents = getAllEvents();
  const displayedEvents = showMore ? allEvents : allEvents.slice(0, 3);

  return (
    <Section className="py-16 bg-gray-50">
      <Container>
        <h2 className="text-3xl font-bold text-navy mb-8">Find an Event</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayedEvents.map((event) => (
            <Card key={event.slug} className="overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/events/${event.slug}`}>
                <div className="relative aspect-[16/9]">
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <CalendarDays className="h-4 w-4" />
                    <span>{formatEventDate(event)}</span>
                  </div>
                  {event.registration?.attendeeCount && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Users className="h-4 w-4" />
                      <span>{event.registration.attendeeCount} attendees</span>
                    </div>
                  )}
                  <h3 className="font-semibold text-lg text-navy line-clamp-2">
                    {event.title}
                  </h3>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
        {!showMore && allEvents.length > 3 && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowMore(true)}
              className="text-purple-dark border-purple-dark hover:bg-purple-light"
            >
              Load more
            </Button>
          </div>
        )}
      </Container>
    </Section>
  );
}