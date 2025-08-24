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
    <Section className="bg-white py-12 md:py-16" id="official-calendar">
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
            Add events directly to your personal calendar or subscribe to our full calendar feed.
          </p>
        </div>

        {/* Google Calendar Embed */}
        <Card className="border-purple-light overflow-hidden shadow-lg">
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
      </Container>
    </Section>
  );
}
