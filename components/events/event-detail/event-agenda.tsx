'use client';

import { Event, AgendaItem } from '@/types/event';
import { cn } from '@/lib/utils';

interface EventAgendaProps {
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

function AgendaItemRow({ item, isLast }: { item: AgendaItem; isLast: boolean }) {
  return (
    <div className={cn('flex gap-6 py-4', !isLast && 'border-b border-foreground/5')}>
      {/* Time */}
      <div className="w-20 shrink-0">
        <span className="text-sm text-muted-foreground">{item.time}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-foreground font-medium">{item.title}</h4>
        {item.speaker && (
          <p className="text-sm text-muted-foreground mt-1">{item.speaker}</p>
        )}
        {item.description && (
          <p className="text-sm text-muted-foreground/70 mt-1">{item.description}</p>
        )}
      </div>

      {/* Type Badge */}
      {item.type && (
        <div className="shrink-0">
          <span className="text-xs text-muted-foreground capitalize">
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
      <div className="relative border border-foreground/10 p-6">
        <CornerIcon className="absolute -top-3 -left-3" />
        <CornerIcon className="absolute -top-3 -right-3" />
        <CornerIcon className="absolute -bottom-3 -left-3" />
        <CornerIcon className="absolute -bottom-3 -right-3" />

        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
