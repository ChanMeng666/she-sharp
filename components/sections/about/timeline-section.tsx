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
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          She# Launch Event
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          She Sharp was founded with a mission to bridge the gender gap in STEM
          fields. Our inaugural launch event with Orion Health marked the
          beginning of a movement to create a supportive community for women in
          technology across New Zealand.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Partnership with Orion Health
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Auckland launch
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1528901166007-3784c7dd3653?w=500&h=500&fit=crop"
            alt="She Sharp founding event"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&h=500&fit=crop"
            alt="Initial community"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2015",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          Wellington Launch with Xero
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Expanded our reach beyond Auckland with the Wellington launch,
          partnering with Xero to bring She Sharp&apos;s mission to the capital
          city. This expansion marked our commitment to supporting women in tech
          nationwide.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Partnership with Xero
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ First regional expansion
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=500&fit=crop"
            alt="Wellington launch event"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=500&fit=crop"
            alt="Xero partnership"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2016",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          First 100-Attendee Event with Google
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          A major milestone as we hosted our first event reaching 100 attendees,
          in partnership with Google. This growth demonstrated the strong demand
          for community and support among women in New Zealand&apos;s tech
          sector.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Partnership with Google
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 100 attendees milestone
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&h=500&fit=crop"
            alt="Google partnership event"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&h=500&fit=crop"
            alt="100 attendees milestone"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2017",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          Auckland Tech Grand Tour
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          An ambitious 6.5-hour tour showcasing some of New Zealand&apos;s
          biggest tech companies. Participants got exclusive behind-the-scenes
          access to leading organisations, gaining insights into diverse career
          paths and company cultures in the tech industry.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 6.5 hours of exclusive access
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Multiple top tech companies
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Behind-the-scenes experience
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=500&h=500&fit=crop"
            alt="Tech company tour"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=500&h=500&fit=crop"
            alt="Auckland tech scene"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2020",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          Going Virtual During COVID-19
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Adapted to the global pandemic by pivoting to virtual events,
          dramatically expanding our reach and accessibility. Despite the
          challenges, we hosted 12 events throughout the year—10 of which were
          online—keeping our community connected and engaged.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 12 events during COVID year
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 10 online events
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Community stayed connected
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=500&fit=crop"
            alt="Virtual event"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=500&h=500&fit=crop"
            alt="Online collaboration"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2022",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          First Female-Led Hackathon
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Made history by hosting New Zealand&apos;s first female-led hackathon,
          creating a space where women could lead, innovate, and showcase their
          technical skills. This groundbreaking event set a new standard for
          inclusive tech events in the country.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ First female-led hackathon in NZ
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Women-led innovation
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Technical skills showcase
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=500&fit=crop"
            alt="Female-led hackathon"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop"
            alt="Hackathon teams"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2023",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          Expanding Horizons
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          A transformative year with multiple landmark initiatives. Partnered
          with Google for an Educator Conference, launched &quot;Inspire
          Her&quot; to empower Māori and Pasifika school students, and expanded
          to Hamilton with HCLTech—bringing She Sharp&apos;s mission to more
          communities than ever.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Google Educator Conference
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Inspire Her: Māori & Pasifika students
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Hamilton launch with HCLTech
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&h=500&fit=crop"
            alt="Google Educator Conference"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&h=500&fit=crop"
            alt="Inspire Her programme"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2024",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          A Decade of Impact
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Celebrating 10 years of bridging the gender gap in STEM. Hosted
          another successful hackathon with Fisher & Paykel Healthcare and
          launched our flagship mentoring programme—connecting aspiring women in
          tech with experienced industry professionals.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Hackathon with F&P Healthcare
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ Mentoring programme launched
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ 10 years of impact
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=500&fit=crop"
            alt="F&P Healthcare Hackathon"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=500&fit=crop"
            alt="Mentoring programme"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2025",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          Building Momentum
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          An incredible year of growth with 6 major events reaching over 500
          registered attendees from 135 unique companies. From celebrating
          International Women&apos;s Day at AcademyEX to hosting AI Hackathon
          Festival with AI Forum NZ—each event strengthened our community and
          advanced our mission.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ March: AcademyEX — International Women&apos;s Day
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ April: #IAmRemarkable Workshop
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ May: MYOB — Tech That Matches Your Vibe
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ July: HPE — THRIVE: Your Career, Your Story
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ August: AI Forum — AI Hackathon Festival
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            ✦ September: Fonterra — Business & Tech Transformation
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=500&h=500&fit=crop"
            alt="2025 events"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=500&h=500&fit=crop"
            alt="Community growth"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=500&fit=crop"
            alt="AI Hackathon Festival"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=500&h=500&fit=crop"
            alt="Women in tech community"
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
          <h2 className="text-display-sm text-white">Our Journey</h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            From a small launch event in 2014 to a thriving community of 2200+
            members across New Zealand
          </p>
        </div>
        <Timeline data={timelineData} />
      </Container>
    </Section>
  );
}
