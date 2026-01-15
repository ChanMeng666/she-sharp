"use client";

import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Timeline } from "@/components/ui/timeline";

const timelineData = [
  {
    title: "2014",
    content: (
      <div>
        <p className="text-white text-base md:text-2xl font-bold mb-4">
          She# Launch Event
        </p>
        <p className="text-white/70 text-sm md:text-lg mb-8">
          She Sharp was founded with a mission to bridge the gender gap in STEM
          fields. Our inaugural launch event with Orion Health marked the
          beginning of a movement to create a supportive community for women in
          technology across New Zealand.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg ">
            ✦ Partnership with Orion Health
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg ">
            ✦ Auckland launch
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "2015",
    content: (
      <div>
        <p className="text-white text-base md:text-2xl font-bold mb-4">
          Wellington Launch with Xero
        </p>
        <p className="text-white/70 text-sm md:text-lg mb-8">
          Expanded our reach beyond Auckland with the Wellington launch,
          partnering with Xero to bring She Sharp&apos;s mission to the capital
          city. This expansion marked our commitment to supporting women in tech
          nationwide.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg ">
            ✦ Partnership with Xero
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg ">
            ✦ First regional expansion
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "2016",
    content: (
      <div>
        <p className="text-white text-base md:text-2xl font-bold mb-4">
          First 100-Attendee Event with Google
        </p>
        <p className="text-white/70 text-sm md:text-lg mb-8">
          A major milestone as we hosted our first event reaching 100 attendees,
          in partnership with Google. This growth demonstrated the strong demand
          for community and support among women in New Zealand&apos;s tech
          sector.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Partnership with Google
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ 100 attendees milestone
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "2017",
    content: (
      <div>
        <p className="text-white text-base md:text-2xl font-bold mb-4">
          Auckland Tech Grand Tour
        </p>
        <p className="text-white/70 text-sm md:text-lg mb-8">
          An ambitious 6.5-hour tour showcasing some of New Zealand&apos;s
          biggest tech companies. Participants got exclusive behind-the-scenes
          access to leading organisations, gaining insights into diverse career
          paths and company cultures in the tech industry.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ 6.5 hours of exclusive access
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Multiple top tech companies
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Behind-the-scenes experience
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "2020",
    content: (
      <div>
        <p className="text-white text-base md:text-2xl font-bold mb-4">
          Going Virtual During COVID-19
        </p>
        <p className="text-white/70 text-sm md:text-lg mb-8">
          Adapted to the global pandemic by pivoting to virtual events,
          dramatically expanding our reach and accessibility. Despite the
          challenges, we hosted 12 events throughout the year—10 of which were
          online—keeping our community connected and engaged.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ 12 events during COVID year
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ 10 online events
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Community stayed connected
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "2022",
    content: (
      <div>
        <p className="text-white text-base md:text-2xl font-bold mb-4">
          First Female-Led Hackathon
        </p>
        <p className="text-white/70 text-sm md:text-lg mb-8">
          Made history by hosting New Zealand&apos;s first female-led hackathon,
          creating a space where women could lead, innovate, and showcase their
          technical skills. This groundbreaking event set a new standard for
          inclusive tech events in the country.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ First female-led hackathon in NZ
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Women-led innovation
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Technical skills showcase
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "2023",
    content: (
      <div>
        <p className="text-white text-base md:text-2xl font-bold mb-4">
          Expanding Horizons
        </p>
        <p className="text-white/70 text-sm md:text-lg mb-8">
          A transformative year with multiple landmark initiatives. Partnered
          with Google for an Educator Conference, launched &quot;Inspire
          Her&quot; to empower Māori and Pasifika school students, and expanded
          to Hamilton with HCLTech—bringing She Sharp&apos;s mission to more
          communities than ever.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Google Educator Conference
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Inspire Her: Māori & Pasifika students
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Hamilton launch with HCLTech
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "2024",
    content: (
      <div>
        <p className="text-white text-base md:text-2xl font-bold mb-4">
          A Decade of Impact
        </p>
        <p className="text-white/70 text-sm md:text-lg mb-8">
          Celebrating 10 years of bridging the gender gap in STEM. Hosted
          another successful hackathon with Fisher & Paykel Healthcare and
          launched our flagship mentoring programme—connecting aspiring women in
          tech with experienced industry professionals.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Hackathon with F&P Healthcare
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ Mentoring programme launched
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ 10 years of impact
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "2025",
    content: (
      <div>
        <p className="text-white text-base md:text-2xl font-bold mb-4">
          Building Momentum
        </p>
        <p className="text-white/70 text-sm md:text-lg mb-8">
          An incredible year of growth with 6 major events reaching over 500
          registered attendees from 135 unique companies. From celebrating
          International Women&apos;s Day at AcademyEX to hosting AI Hackathon
          Festival with AI Forum NZ—each event strengthened our community and
          advanced our mission.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ March: AcademyEX — International Women&apos;s Day
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ April: #IAmRemarkable Workshop
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ May: MYOB — Tech That Matches Your Vibe
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ July: HPE — THRIVE: Your Career, Your Story
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ August: AI Forum — AI Hackathon Festival
          </div>
          <div className="flex gap-2 items-center text-white/70 text-sm md:text-lg">
            ✦ September: Fonterra — Business & Tech Transformation
          </div>
        </div>
      </div>
    ),
  },
];

export function TimelineSection() {
  return (
    <Section noPadding className="bg-navy">
      <Container size="full">
        <div className="text-center pt-16 md:pt-24 px-4 md:px-8 lg:px-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Our Journey
          </h2>
          <p className="mt-6 sm:mt-8 text-base sm:text-xl text-white/80 max-w-2xl mx-auto">
            From a small launch event in 2014 to a thriving community of 2200+
            members across New Zealand
          </p>
        </div>
        <Timeline data={timelineData} />
      </Container>
    </Section>
  );
}
