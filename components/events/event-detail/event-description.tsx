"use client";

import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";

interface EventDescriptionProps {
  event: EventV3;
  className?: string;
}

export function EventDescription({ event, className }: EventDescriptionProps) {
  const fullDescription = event.detailPageData.fullDescription;

  if (!fullDescription || fullDescription.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="relative overflow-hidden py-6 md:py-8 pr-0">
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-semibold text-foreground uppercase">
            About this event
          </p>
          <div className="space-y-4">
            {fullDescription.map((paragraph, index) => (
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
