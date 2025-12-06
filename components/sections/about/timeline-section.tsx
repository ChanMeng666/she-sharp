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
          She Sharp Founded
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          She Sharp was founded with a mission to bridge the gender gap in STEM
          fields. Started as a small group of passionate advocates, the
          organization set out to create a supportive community for women in
          technology.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1528901166007-3784c7dd3653?w=500&h=500&fit=crop"
            alt="Founding team"
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
    title: "2018",
    content: (
      <div>
        <p className="text-white text-xs md:text-sm font-normal mb-4">
          Mentorship Program Launch
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Launched our flagship mentorship program, connecting aspiring women in
          tech with experienced industry professionals to guide their career
          development.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=500&fit=crop"
            alt="Mentorship session"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=500&fit=crop"
            alt="Career coaching"
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
          Going Virtual
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Pivoted to virtual events, dramatically expanding our reach and
          accessibility. Our online workshops and networking sessions connected
          women in tech across geographic boundaries.
        </p>
        <div className="mb-8">
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            Virtual workshops and webinars launched
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            Remote mentorship program expansion
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            Global community engagement
          </div>
          <div className="flex gap-2 items-center text-white/70 text-xs md:text-sm">
            Digital networking events
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=500&h=500&fit=crop"
            alt="Virtual meeting"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=500&h=500&fit=crop"
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
          2000+ Members Milestone
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          Our community reached an incredible milestone of over 2000 active
          members, establishing She Sharp as one of the leading organizations
          for women in STEM.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&h=500&fit=crop"
            alt="Community celebration"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&h=500&fit=crop"
            alt="Networking event"
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
          Celebrating 10 years of impact
        </p>
        <p className="text-white/70 text-xs md:text-sm font-normal mb-8">
          A decade of bridging the gender gap in STEM. With 80+ events hosted
          and 2200+ active members, She Sharp continues to empower women in
          technology across the industry.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=500&fit=crop"
            alt="Team collaboration"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=500&h=500&fit=crop"
            alt="Women in tech event"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=500&fit=crop"
            alt="Tech mentorship session"
            width={500}
            height={500}
            className="rounded-[50px] object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop"
            alt="Team meeting"
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Our Journey
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            From a small group of advocates to a thriving community of 2200+
            members
          </p>
        </div>
        <Timeline data={timelineData} />
      </Container>
    </Section>
  );
}
