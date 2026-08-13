"use client";

import { EventV3, EventSpeakerGroup, EventSpeakerV3 } from "@/types/event";
import { MemberCard, MemberCardData } from "@/components/ui/member-card";
import { cn } from "@/lib/utils";
import { hasAnySpeakers, isUpcomingEvent } from "@/lib/data/event-utils";

interface EventSpeakersProps {
  event: EventV3;
  className?: string;
}

function normalizeHeading(heading: string): string {
  if (heading === heading.toUpperCase() && heading.length > 3) {
    return heading.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return heading;
}

interface SpeakerGroupSectionProps {
  group: EventSpeakerGroup;
  startIndex: number;
  isFutureEvent: boolean;
}

function SpeakerGroupSection({ group, startIndex, isFutureEvent }: SpeakerGroupSectionProps) {
  if (!group.speakers || group.speakers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <p className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground">
        {normalizeHeading(group.heading)}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-stretch">
        {group.speakers.map((speaker, index) => {
          const memberCardData: MemberCardData = {
            id: startIndex + index,
            name: speaker.name,
            image: speaker.image || "",
            description: speaker.bio || "",
            title: speaker.title
              ? [speaker.title, speaker.company].filter(Boolean).join(", ")
              : "",
            linkedin: speaker.linkedin || undefined,
          };
          return (
            <div key={startIndex + index} className="w-full h-full flex">
              <MemberCard
                member={memberCardData}
                index={startIndex + index}
                hideDescriptionOnCard={true}
                background="bg-white"
                isFutureEvent={isFutureEvent}
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

  const isFuture = isUpcomingEvent(event);
  const speakers = event.detailPageData.speakers;
  let currentIndex = 0;

  // Calculate speaker groups with their start indices
  const groups: { group: EventSpeakerGroup; startIndex: number }[] = [];

  // Render groups in a stable order; any additional string-keyed groups on
  // `speakers` render last in insertion order (e.g. hosts, mentors, panelists).
  const orderedKeys = [
    "hosts",
    "keynote_speakers",
    "demo_facilitators",
    "workshop_facilitators",
    "panel_facilitators",
    "readiness_workshop_facilitators",
    "panel_speakers",
    "panelists",
    "guest_speakers",
    "mentors",
  ] as const;

  for (const key of orderedKeys) {
    const group = speakers[key];
    if (group?.speakers?.length) {
      groups.push({ group, startIndex: currentIndex });
      currentIndex += group.speakers.length;
    }
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
                isFutureEvent={isFuture}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
