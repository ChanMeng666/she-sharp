"use client";

import { Event } from "@/lib/data/events";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface EventDescriptionProps {
  event: Event;
  className?: string;
}


export function EventDescription({ event, className }: EventDescriptionProps) {
  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-3xl py-8 md:py-10 pr-8 md:pr-10 pl-0">

        <div className="space-y-4">
          <p className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-semibold text-foreground uppercase">
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
