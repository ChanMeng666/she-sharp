"use client";

import React from "react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Timeline } from "@/components/ui/timeline";

interface TimelineEntryData {
  title: string;
  eventTitle: string;
  description: string;
  highlights: string[];
}

const TimelineEntryContent = ({
  eventTitle,
  description,
  highlights,
}: Omit<TimelineEntryData, "title">) => (
  <div>
    <p className="text-foreground text-base md:text-xl font-bold mb-4">
      {eventTitle}
    </p>
    <p className="text-muted-foreground text-sm md:text-base mb-8">
      {description}
    </p>
    {highlights.length > 0 && (
      <div className="mb-8 space-y-2">
        {highlights.map((highlight, index) => (
          <div
            key={index}
            className="flex gap-2 items-center text-muted-foreground text-sm md:text-base"
          >
            ✦ {highlight}
          </div>
        ))}
      </div>
    )}
  </div>
);

const timelineData: TimelineEntryData[] = [
  {
    title: "2014",
    eventTitle: "She# Launch Event",
    description:
      "She Sharp was founded with a mission to bridge the gender gap in STEM fields. Our inaugural launch event with Orion Health marked the beginning of a movement to create a supportive community for women in technology across New Zealand.",
    highlights: ["Partnership with Orion Health", "Auckland launch"],
  },
  {
    title: "2015",
    eventTitle: "Wellington Launch with Xero",
    description:
      "Expanded our reach beyond Auckland with the Wellington launch, partnering with Xero to bring She Sharp's mission to the capital city. This expansion marked our commitment to supporting women in tech nationwide.",
    highlights: ["Partnership with Xero", "First regional expansion"],
  },
  {
    title: "2016",
    eventTitle: "First 100-Attendee Event with Google",
    description:
      "A major milestone as we hosted our first event reaching 100 attendees, in partnership with Google. This growth demonstrated the strong demand for community and support among women in New Zealand's tech sector.",
    highlights: ["Partnership with Google", "100 attendees milestone"],
  },
  {
    title: "2017",
    eventTitle: "Auckland Tech Grand Tour",
    description:
      "An ambitious 6.5-hour tour showcasing some of New Zealand's biggest tech companies. Participants got exclusive behind-the-scenes access to leading organisations, gaining insights into diverse career paths and company cultures in the tech industry.",
    highlights: [
      "6.5 hours of exclusive access",
      "Multiple top tech companies",
      "Behind-the-scenes experience",
    ],
  },
  {
    title: "2020",
    eventTitle: "Going Virtual During COVID-19",
    description:
      "Adapted to the global pandemic by pivoting to virtual events, dramatically expanding our reach and accessibility. Despite the challenges, we hosted 12 events throughout the year—10 of which were online—keeping our community connected and engaged.",
    highlights: [
      "12 events during COVID year",
      "10 online events",
      "Community stayed connected",
    ],
  },
  {
    title: "2022",
    eventTitle: "First Female-Led Hackathon",
    description:
      "Made history by hosting New Zealand's first female-led hackathon, creating a space where women could lead, innovate, and showcase their technical skills. This groundbreaking event set a new standard for inclusive tech events in the country.",
    highlights: [
      "First female-led hackathon in NZ",
      "Women-led innovation",
      "Technical skills showcase",
    ],
  },
  {
    title: "2023",
    eventTitle: "Expanding Horizons",
    description:
      'A transformative year with multiple landmark initiatives. Partnered with Google for an Educator Conference, launched "Inspire Her" to empower Māori and Pasifika school students, and expanded to Hamilton with HCLTech—bringing She Sharp\'s mission to more communities than ever.',
    highlights: [
      "Google Educator Conference",
      "Inspire Her: Māori & Pasifika students",
      "Hamilton launch with HCLTech",
    ],
  },
  {
    title: "2024",
    eventTitle: "A Decade of Impact",
    description:
      "Celebrating 10 years of bridging the gender gap in STEM. Hosted another successful hackathon with Fisher & Paykel Healthcare and launched our flagship mentoring programme—connecting aspiring women in tech with experienced industry professionals.",
    highlights: [
      "Hackathon with F&P Healthcare",
      "Mentoring programme launched",
      "10 years of impact",
    ],
  },
  {
    title: "2025",
    eventTitle: "Building Momentum",
    description:
      "An incredible year of growth with 6 major events reaching over 500 registered attendees from 135 unique companies. From celebrating International Women's Day at AcademyEX to hosting AI Hackathon Festival with AI Forum NZ—each event strengthened our community and advanced our mission.",
    highlights: [
      "March: AcademyEX — International Women's Day",
      "April: #IAmRemarkable Workshop",
      "May: MYOB — Tech That Matches Your Vibe",
      "July: HPE — THRIVE: Your Career, Your Story",
      "August: AI Forum — AI Hackathon Festival",
      "September: Fonterra — Business & Tech Transformation",
    ],
  },
];

const transformTimelineData = (
  data: TimelineEntryData[]
): Array<{ title: string; content: React.ReactNode }> =>
  data.map((entry) => ({
    title: entry.title,
    content: (
      <TimelineEntryContent
        eventTitle={entry.eventTitle}
        description={entry.description}
        highlights={entry.highlights}
      />
    ),
  }));

export function TimelineSection() {
  return (
    <Section noPadding className="bg-white">
      <Container size="full">
        <div className="text-center pt-16 md:pt-24 px-4">
          <h2 className="text-display-sm text-primary text-left">
            A Deep Dive into Our Journey
          </h2>
          <p className="mt-6 sm:mt-8 text-md lg:text-lg text-muted-foreground max-w-2xl text-left leading-relaxed">
            From a small launch event in 2014 to a thriving community of 2200+
            members across New Zealand
          </p>
        </div>
        <Timeline data={transformTimelineData(timelineData)} />
      </Container>
    </Section>
  );
}
