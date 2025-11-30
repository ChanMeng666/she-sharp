'use client';

import { CheckCircle2 } from 'lucide-react';
import { Event } from '@/lib/data/events';
import { cn } from '@/lib/utils';

interface EventDescriptionProps {
  event: Event;
  className?: string;
}

export function EventDescription({ event, className }: EventDescriptionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* About Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">About this event</h2>
        <div className="prose prose-gray max-w-none">
          {event.description.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-gray-600 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Highlights */}
      {event.highlights && event.highlights.length > 0 && (
        <section className="bg-muted rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            What you&apos;ll get
          </h3>
          <ul className="space-y-3">
            {event.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{highlight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
