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
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-brand shrink-0" />
        <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground ">
          About This Event
        </h2>
      </div>
      <div className="space-y-4 max-w-prose">
        {fullDescription.map((paragraph, index) => (
          <p key={index} className="text-muted-foreground leading-relaxed text-pretty">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
