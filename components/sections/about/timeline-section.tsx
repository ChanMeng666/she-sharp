"use client";

import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Timeline } from "@/components/ui/timeline";

const timelineData = [
  {
    title: "March",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          AcademyEX — International Women&apos;s Day
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Kicked off 2025 with a powerful International Women&apos;s Day
          celebration at AcademyEX. Featuring an inspiring keynote speaker and
          engaging panel discussions, 57 attendees from 43 unique companies came
          together to network, share stories, and celebrate women in tech.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 75 registered attendees
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 43 companies represented
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 8 returning community members
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1528901166007-3784c7dd3653?w=500&h=500&fit=crop"
            alt="International Women's Day event"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&h=500&fit=crop"
            alt="Networking session"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "April",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          #IAmRemarkable Workshop
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          The global #IAmRemarkable movement took centre stage with a powerful
          60-minute workshop led by our founder Dr. Mahsa McCauley. Participants
          embraced and celebrated their achievements, challenging social
          perceptions around self-promotion through stories, research, and
          practical exercises.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 63 registered attendees
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 44 companies represented
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Empowering self-promotion skills
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=500&fit=crop"
            alt="Workshop session"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=500&fit=crop"
            alt="Group discussion"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "May",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          MYOB — Tech That Matches Your Vibe
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Partnered with MYOB to help attendees discover their perfect fit in
          the tech industry. The event featured inspiring keynotes and panel
          discussions focused on finding alignment between personal values and
          career paths in technology.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 63 registered attendees
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 39 companies represented
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Career alignment focus
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&h=500&fit=crop"
            alt="MYOB event"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&h=500&fit=crop"
            alt="Tech career discussion"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "July",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          HPE — THRIVE: Your Career, Your Story
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Our largest event of the year at Hewlett Packard Enterprise brought
          together 68 attendees from 65 unique companies. The THRIVE programme
          featured powerful keynotes and panels about owning your career
          narrative, with passionate discussions about helping others in the
          community.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 98 registered attendees
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 65 companies represented
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Career storytelling focus
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=500&h=500&fit=crop"
            alt="HPE THRIVE event"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=500&h=500&fit=crop"
            alt="Panel discussion"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "August",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          AI Forum — AI Hackathon Festival 2025
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Partnered with AI Forum New Zealand and AUT to host an exciting AI
          Hackathon Festival. With 36 returning community members—our highest
          return rate of the year—this event showcased the growing strength of
          our network and the increasing interest in AI across industries.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 98 registered attendees
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 64 companies represented
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 36 returning members (highest of 2025)
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=500&fit=crop"
            alt="AI Hackathon"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=500&h=500&fit=crop"
            alt="Tech collaboration"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "September",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          Fonterra — Business & Technology Transformation
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Closed out our 2025 event series at Fonterra, exploring business and
          technology transformation platforms. With strong representation from
          Fonterra and Deloitte, attendees gained insights into enterprise-scale
          digital transformation and product development strategies.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 96 registered attendees
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 46 companies represented
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Enterprise transformation focus
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=500&fit=crop"
            alt="Fonterra event"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop"
            alt="Technology discussion"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
];

export function TimelineSection() {
  return (
    <Section noPadding className="bg-[#1f1e44]">
      <Container size="full">
        <div className="text-center pt-16 md:pt-24 px-4 md:px-8 lg:px-10">
          <h2 className="text-display-sm text-white">
            Our 2025 Journey
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            6 events, 500+ attendees, 135 unique companies — a year of
            empowerment, learning, and community
          </p>
        </div>
        <Timeline data={timelineData} />
      </Container>
    </Section>
  );
}
