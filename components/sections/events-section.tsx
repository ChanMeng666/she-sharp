"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CalendarDays, Clock, MapPin, Users, Video, Sparkles } from "lucide-react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const upcomingEvents = [
  {
    id: 1,
    title: "THRIVE: Your Career, Your Story",
    date: new Date(2025, 2, 15), // March 15, 2025
    time: "6:00 PM - 8:30 PM",
    location: "Auckland CBD",
    type: "Networking",
    typeColor: "bg-purple-dark text-white",
    attendees: 150,
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    description: "An evening of inspiring stories and career insights from women leaders in tech.",
  },
  {
    id: 2,
    title: "Tech Skills Workshop: Cloud Computing",
    date: new Date(2025, 2, 22), // March 22, 2025
    time: "10:00 AM - 2:00 PM",
    location: "Online",
    type: "Workshop",
    typeColor: "bg-periwinkle-dark text-white",
    attendees: 80,
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    description: "Hands-on workshop covering cloud fundamentals and practical applications.",
    isOnline: true,
  },
  {
    id: 3,
    title: "Mentorship Speed Dating",
    date: new Date(2025, 3, 5), // April 5, 2025
    time: "5:30 PM - 7:30 PM",
    location: "Wellington",
    type: "Mentorship",
    typeColor: "bg-mint-dark text-white",
    attendees: 60,
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    description: "Meet potential mentors in a fun, fast-paced environment.",
  },
];


export function EventsSection() {
  return (
    <Section className="bg-white">
      <Container size="wide">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy-dark mb-4">
            Events that connect, engage, and inspire
          </h2>
          <p className="text-base sm:text-lg text-gray max-w-3xl mx-auto px-4">
            Keynote speakers, panels, workshops, networking events, hackathons and more! 
            Whether you're in school, university or a young professional, our events are 
            designed to be inclusive, interactive and fun.
          </p>
        </div>

        <div className="space-y-12">
          {/* Google Calendar Card */}
          <Card className="border-purple-light overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-dark" />
                Event Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full">
                <iframe
                  src="https://calendar.google.com/calendar/embed?src=be0a13dc6a2867f7da1144d4370ef222ce6aaf3b15b062fa35e79f60c8ed22ba%40group.calendar.google.com&ctz=Pacific%2FAuckland&bgcolor=%23f7e5f3&color=%239b2e83&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1&mode=MONTH&wkst=2"
                  style={{ border: 0 }}
                  width="100%"
                  height="600"
                  frameBorder="0"
                  scrolling="no"
                  className="h-[400px] sm:h-[500px] lg:h-[600px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-navy-dark flex items-center gap-2">
                <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-purple-dark" />
                Upcoming Events
              </h3>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-purple-dark hover:text-purple-mid"
              >
                <Link href="/events">View All Events →</Link>
              </Button>
            </div>

            {/* Event Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, index) => (
                <Card key={event.id} className={`overflow-hidden hover:shadow-md transition-shadow h-full ${index === 0 ? 'ring-2 ring-purple-dark' : ''}`}>
                  {/* Event Image */}
                  <AspectRatio ratio={16 / 9}>
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </AspectRatio>

                  {/* Event Details */}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-wrap gap-1">
                        {index === 0 && (
                          <Badge className="bg-mint-light text-navy-dark border-mint-mid">
                            🎉 Next
                          </Badge>
                        )}
                        <Badge className={event.typeColor}>{event.type}</Badge>
                        {event.isOnline && (
                          <Badge variant="outline">
                            <Video className="w-3 h-3 mr-1" />
                            Online
                          </Badge>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-semibold text-navy-dark mb-2 line-clamp-2">
                      {event.title}
                    </h4>
                    
                    <div className="space-y-1 text-xs text-gray mb-3">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {event.date.toLocaleDateString('en-NZ', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-purple-dark hover:bg-purple-mid transition-colors duration-150"
                    >
                      <Link href={`/events/${event.id}`}>Register</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* View All Events CTA */}
            <div className="text-center pt-6">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-purple-dark text-purple-dark hover:bg-purple-light transition-colors duration-150"
              >
                <Link href="/events">Explore All Events</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-12 sm:mt-16 bg-purple-light/10 rounded-lg p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-dark">84+</div>
              <div className="text-xs sm:text-sm text-gray mt-1">Events Hosted</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-dark">10K+</div>
              <div className="text-xs sm:text-sm text-gray mt-1">Total Attendees</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-dark">50+</div>
              <div className="text-xs sm:text-sm text-gray mt-1">Partner Companies</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-dark">5</div>
              <div className="text-xs sm:text-sm text-gray mt-1">Cities Reached</div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}