'use client';

import { Event, AgendaItem } from '@/types/event';
import { cn } from '@/lib/utils';
import { CalendarClock } from 'lucide-react';

interface EventAgendaProps {
  event: Event;
  className?: string;
}

function AgendaItemRow({ item, isLast }: { item: AgendaItem; isLast: boolean }) {
  return (
    <div className={cn('flex gap-4 sm:gap-6 py-4', !isLast && 'border-b border-foreground/5')}>
      {/* Time */}
      <div className="w-16 sm:w-20">
        <span className="text-base text-muted-foreground">{item.time}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium font-sans">{item.title}</h4>
        {item.speaker && (
          <p className="text-base text-muted-foreground/70 mt-1">{item.speaker}</p>
        )}
        {item.description && (
          <p className="text-base text-muted-foreground/70 mt-1">{item.description}</p>
        )}
      </div>

      {/* Type Badge */}
      {item.type && (
        <div className="shrink-0">
          <span className="text-base text-muted-foreground capitalize">
            {item.type}
          </span>
        </div>
      )}
    </div>
  );
}

export function EventAgenda({ event, className }: EventAgendaProps) {
  if (!event.agenda || event.agenda.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <div className="relative overflow-hidden py-6 md:py-8 pr-0">

        <div className="space-y-4">
          <p className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-semibold text-foreground uppercase">
            Schedule
          </p>
          <div>
            {event.agenda.map((item, index) => (
              <AgendaItemRow
                key={index}
                item={item}
                isLast={index === event.agenda!.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
