"use client";

import { EventV3, EventSpeakerGroup, EventSpeakerV3 } from "@/types/event";
import { MemberCard, MemberCardData } from "@/components/ui/member-card";
import { cn } from "@/lib/utils";
import { hasAnySpeakers } from "@/lib/data/events";

interface EventSpeakersProps {
  event: EventV3;
  className?: string;
}

interface SpeakerGroupSectionProps {
  group: EventSpeakerGroup;
  startIndex: number;
}

function SpeakerGroupSection({ group, startIndex }: SpeakerGroupSectionProps) {
  if (!group.speakers || group.speakers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <p className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-bold text-foreground uppercase">
        {group.heading}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-stretch">
        {group.speakers.map((speaker, index) => {
          const memberCardData: MemberCardData = {
            id: startIndex + index,
            name: speaker.name,
            image: speaker.image || "",
            description: speaker.bio || "",
            title: speaker.company
              ? `${speaker.title}, ${speaker.company}`
              : speaker.title,
            linkedin: speaker.linkedin || undefined,
          };
          return (
            <div key={startIndex + index} className="w-full h-full flex">
              <MemberCard
                member={memberCardData}
                index={startIndex + index}
                hideDescriptionOnCard={true}
                background="bg-white"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EventSpeakers({ event, className }: EventSpeakersProps) {
  if (!hasAnySpeakers(event)) {
    return null;
  }

  const speakers = event.detailPageData.speakers;
  let currentIndex = 0;

  // Calculate speaker groups with their start indices
  const groups: { group: EventSpeakerGroup; startIndex: number }[] = [];

  if (speakers.keynote_speakers?.speakers?.length) {
    groups.push({ group: speakers.keynote_speakers, startIndex: currentIndex });
    currentIndex += speakers.keynote_speakers.speakers.length;
  }

  if (speakers.panel_speakers?.speakers?.length) {
    groups.push({ group: speakers.panel_speakers, startIndex: currentIndex });
    currentIndex += speakers.panel_speakers.speakers.length;
  }

  if (speakers.guest_speakers?.speakers?.length) {
    groups.push({ group: speakers.guest_speakers, startIndex: currentIndex });
    currentIndex += speakers.guest_speakers.speakers.length;
  }

  if (speakers.panel_facilitators?.speakers?.length) {
    groups.push({
      group: speakers.panel_facilitators,
      startIndex: currentIndex,
    });
  }

  return (
    <section  >
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] ">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-20 lg:pb-24">
          <div className="space-y-8 sm:space-y-10 md:space-y-12 lg:space-y-16">
            {groups.map((item, groupIndex) => (
              <SpeakerGroupSection
                key={groupIndex}
                group={item.group}
                startIndex={item.startIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
