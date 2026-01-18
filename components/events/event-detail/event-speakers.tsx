"use client";

import { Event } from "@/types/event";
import { MemberCard, MemberCardData } from "@/components/ui/member-card";
import { cn } from "@/lib/utils";

interface EventSpeakersProps {
  event: Event;
  className?: string;
}

export function EventSpeakers({ event, className }: EventSpeakersProps) {
  if (!event.speakers || event.speakers.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="space-y-8">
            <p className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-semibold text-foreground uppercase">
              {event.speakers.length === 1 ? "Speaker" : "Speakers"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 items-stretch">
              {event.speakers.map((speaker, index) => {
                const memberCardData: MemberCardData = {
                  id: index,
                  name: speaker.name,
                  image: speaker.image || "",
                  description: speaker.bio || "",
                  title: speaker.company
                    ? `${speaker.title}, ${speaker.company}`
                    : speaker.title,
                  linkedin: speaker.linkedIn,
                };
                return (
                  <div key={index} className="w-full h-full flex">
                    <MemberCard 
                      member={memberCardData} 
                      index={index}
                      hideDescriptionOnCard={true}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
