'use client';

import { Event } from '@/lib/data/events';
import { EventCard } from './event-card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface EventListProps {
  events: Event[];
  columns?: 1 | 2 | 3 | 4;
  emptyMessage?: string;
  className?: string;
  renderCard?: (event: Event, index: number) => ReactNode;
}

export function EventList({
  events,
  columns = 3,
  emptyMessage = 'No events found',
  className,
  renderCard,
}: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-x-8 gap-y-20',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {events.map((event, index) =>
        renderCard ? (
          renderCard(event, index)
        ) : (
          <EventCard key={event.slug} event={event} />
        )
      )}
    </div>
  );
}

interface EventSectionProps {
  title: string;
  description?: string;
  events: Event[];
  columns?: 1 | 2 | 3 | 4;
  showSeeAll?: boolean;
  seeAllHref?: string;
  seeAllLabel?: string;
  emptyMessage?: string;
  className?: string;
}

export function EventSection({
  title,
  description,
  events,
  columns = 3,
  showSeeAll = false,
  seeAllHref,
  seeAllLabel = 'See all',
  emptyMessage,
  className,
}: EventSectionProps) {
  return (
    <section className={cn('space-y-6', className)}>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-gray-600">{description}</p>
          )}
        </div>
        {showSeeAll && seeAllHref && (
          <a
            href={seeAllHref}
            className="text-foreground hover:text-foreground/80 font-medium text-sm flex items-center gap-1"
          >
            {seeAllLabel}
            <span aria-hidden="true">→</span>
          </a>
        )}
      </div>

      <EventList
        events={events}
        columns={columns}
        emptyMessage={emptyMessage}
      />
    </section>
  );
}
