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
    <div className={cn("py-6 md:py-8 space-y-5", className)}>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
        About this event
      </h2>
      <div className="space-y-4 max-w-prose">
        {fullDescription.map((paragraph, index) => (
          <p key={index} className="text-ink-700 leading-relaxed text-pretty">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
