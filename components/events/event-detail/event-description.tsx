'use client';

import { Event } from '@/lib/data/events';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

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
      className={cn('h-6 w-6 text-foreground/20', className)}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
}

export function EventDescription({ event, className }: EventDescriptionProps) {
  return (
    <section className={className}>
      <div className="relative border border-foreground/10 overflow-hidden rounded-3xl bg-white p-8 md:p-10 pt-12 md:pt-14 shadow-sm hover:shadow-xl transition-all duration-300">
        <CornerIcon className="absolute -top-3 -left-3" />
        <CornerIcon className="absolute -top-3 -right-3" />
        <CornerIcon className="absolute -bottom-3 -left-3" />
        <CornerIcon className="absolute -bottom-3 -right-3" />

        <div className="space-y-4">
          <p className="flex items-center gap-2 text-base md:text-lg font-semibold text-foreground uppercase  ">
            <Info className="w-5 h-5 md:w-6 md:h-6 text-brand" />
            About this event
          </p>
          <div className="space-y-4">
            {event.description.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
