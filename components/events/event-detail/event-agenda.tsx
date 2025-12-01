'use client';

import { Clock, Coffee, Mic, Users, Wrench, MessageSquare } from 'lucide-react';
import { Event, AgendaItem } from '@/types/event';
import { cn } from '@/lib/utils';

interface EventAgendaProps {
  event: Event;
  className?: string;
}

const agendaTypeIcons: Record<string, React.ElementType> = {
  keynote: Mic,
  panel: MessageSquare,
  workshop: Wrench,
  networking: Users,
  break: Coffee,
};

const agendaTypeColors: Record<string, string> = {
  keynote: 'bg-muted text-foreground border-border',
  panel: 'bg-muted text-foreground border-border',
  workshop: 'bg-muted text-foreground border-border',
  networking: 'bg-muted text-foreground border-border',
  break: 'bg-gray-100 text-gray-600 border-gray-200',
};

function AgendaItemCard({ item }: { item: AgendaItem }) {
  const Icon = item.type ? agendaTypeIcons[item.type] : Clock;
  const colorClasses = item.type
    ? agendaTypeColors[item.type]
    : 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div className="flex gap-4">
      {/* Time Column */}
      <div className="w-16 flex-shrink-0 text-right">
        <span className="text-sm font-medium text-gray-500">{item.time}</span>
      </div>

      {/* Timeline Dot */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center border-2',
            colorClasses
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div
          className={cn(
            'p-4 rounded-lg border',
            item.type === 'break' ? 'bg-gray-50' : 'bg-white'
          )}
        >
          <h4 className="font-medium text-foreground">{item.title}</h4>
          {item.speaker && (
            <p className="text-sm text-foreground mt-1">
              Speaker: {item.speaker}
            </p>
          )}
          {item.description && (
            <p className="text-sm text-gray-600 mt-2">{item.description}</p>
          )}
          {item.type && (
            <span
              className={cn(
                'inline-block mt-2 text-xs px-2 py-1 rounded-full capitalize',
                colorClasses
              )}
            >
              {item.type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventAgenda({ event, className }: EventAgendaProps) {
  if (!event.agenda || event.agenda.length === 0) {
    return null;
  }

  return (
    <section className={cn('space-y-6', className)}>
      <h2 className="text-xl font-semibold text-foreground">Event Schedule</h2>
      <div className="relative">
        {event.agenda.map((item, index) => (
          <AgendaItemCard key={index} item={item} />
        ))}
      </div>
    </section>
  );
}
