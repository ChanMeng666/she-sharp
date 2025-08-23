"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Info } from "lucide-react";
import Link from "next/link";

export function GoogleCalendarSection() {
  return (
    <Section className="bg-white py-12 md:py-16">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-purple-dark" />
            <Badge variant="outline" className="border-purple-dark text-purple-dark">
              Official Calendar
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy-dark mb-4">
            She Sharp Event Calendar
          </h2>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            Stay up to date with all our events, workshops, and community gatherings. 
            Add events directly to your personal calendar or subscribe to our full calendar feed.
          </p>
        </div>

        {/* Google Calendar Embed */}
        <Card className="border-purple-light overflow-hidden shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-light/10 to-periwinkle-light/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-navy-dark">
                  Monthly Calendar View
                </CardTitle>
                <CardDescription>
                  Click on any event to view details and registration information
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link 
                  href="https://calendar.google.com/calendar/u/0?cid=YmUwYTEzZGM2YTI4NjdmN2RhMTE0NGQ0MzcwZWYyMjJjZTZhYWYzYjE1YjA2MmZhMzVlNzlmNjBjOGVkMjJiYUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Google
                </Link>
              </Button>
            </div>
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
                title="She Sharp Events Calendar"
              />
            </div>
          </CardContent>
        </Card>

        {/* Calendar Actions */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-purple-dark mx-auto mb-3" />
              <h3 className="font-semibold text-navy-dark mb-2">Subscribe to Calendar</h3>
              <p className="text-sm text-gray mb-4">
                Add our calendar to your Google Calendar, Outlook, or Apple Calendar
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link 
                  href="https://calendar.google.com/calendar/ical/be0a13dc6a2867f7da1144d4370ef222ce6aaf3b15b062fa35e79f60c8ed22ba%40group.calendar.google.com/public/basic.ics"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Subscribe
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Info className="w-8 h-8 text-periwinkle-dark mx-auto mb-3" />
              <h3 className="font-semibold text-navy-dark mb-2">Time Zone</h3>
              <p className="text-sm text-gray mb-4">
                All events are displayed in Pacific/Auckland time zone (NZST/NZDT)
              </p>
              <Badge variant="secondary" className="bg-periwinkle-light/20 text-periwinkle-dark">
                UTC+12/+13
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-6 text-center">
              <ExternalLink className="w-8 h-8 text-mint-dark mx-auto mb-3" />
              <h3 className="font-semibold text-navy-dark mb-2">Can't see the calendar?</h3>
              <p className="text-sm text-gray mb-4">
                Open the calendar in a new window or check your browser settings
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link 
                  href="https://calendar.google.com/calendar/embed?src=be0a13dc6a2867f7da1144d4370ef222ce6aaf3b15b062fa35e79f60c8ed22ba%40group.calendar.google.com&ctz=Pacific%2FAuckland"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Calendar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
