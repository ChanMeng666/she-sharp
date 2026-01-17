"use client";

import { Event } from "@/lib/data/events";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface EventDescriptionProps {
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

export function EventDescription({ event, className }: EventDescriptionProps) {
  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-3xl py-8 md:py-10 pr-8 md:pr-10 pl-0">
        <CornerIcon className="absolute -top-3 -left-3" />
        <CornerIcon className="absolute -top-3 -right-3" />
        <CornerIcon className="absolute -bottom-3 -left-3" />
        <CornerIcon className="absolute -bottom-3 -right-3" />

        <div className="space-y-4">
          <p className="flex items-center gap-2 text-base md:text-lg lg:text-xl font-semibold text-foreground uppercase">
            About this event
          </p>
          <div className="space-y-4">
            {event.description.split("\n\n").map((paragraph, index) => (
              <p key={index} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
