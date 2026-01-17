"use client";

import { Linkedin, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Event, EventSpeaker } from "@/types/event";
import { cn } from "@/lib/utils";

interface EventSpeakersProps {
  event: Event;
  className?: string;
}

function CornerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={cn("h-6 w-6 text-foreground/20", className)}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
}

function SpeakerItem({
  speaker,
  isLast,
}: {
  speaker: EventSpeaker;
  isLast: boolean;
}) {
  const initials = speaker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "flex items-start gap-6 py-4",
        !isLast && "border-b border-foreground/5"
      )}
    >
      <Avatar className="w-24 h-24 shrink-0">
        {speaker.image ? (
          <AvatarImage src={speaker.image} alt={speaker.name} />
        ) : null}
        <AvatarFallback className="bg-foreground/5 text-foreground text-base">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-foreground font-sans">
              {speaker.name}
            </h4>
            <p className="text-base text-muted-foreground">{speaker.title}</p>
            {speaker.company && (
              <p className="text-base text-muted-foreground/70">
                {speaker.company}
              </p>
            )}
          </div>
          {speaker.linkedIn && (
            <a
              href={speaker.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
        </div>
        {speaker.bio && (
          <p className="text-base text-muted-foreground mt-2 line-clamp-2">
            {speaker.bio}
          </p>
        )}
      </div>
    </div>
  );
}

export function EventSpeakers({ event, className }: EventSpeakersProps) {
  if (!event.speakers || event.speakers.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <div className="relative border border-foreground/10 overflow-hidden rounded-3xl bg-white p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-300">
        <CornerIcon className="absolute -top-3 -left-3" />
        <CornerIcon className="absolute -top-3 -right-3" />
        <CornerIcon className="absolute -bottom-3 -left-3" />
        <CornerIcon className="absolute -bottom-3 -right-3" />

        <div className="space-y-4">
          <p className="flex items-center gap-2 text-base md:text-lg font-semibold text-foreground uppercase">
            {event.speakers.length === 1 ? "Speaker" : "Speakers"}
          </p>
          <div>
            {event.speakers.map((speaker, index) => (
              <SpeakerItem
                key={index}
                speaker={speaker}
                isLast={index === event.speakers!.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
