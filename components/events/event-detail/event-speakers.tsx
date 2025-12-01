'use client';

import Image from 'next/image';
import { Linkedin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Event, EventSpeaker } from '@/types/event';
import { cn } from '@/lib/utils';

interface EventSpeakersProps {
  event: Event;
  className?: string;
}

function SpeakerCard({ speaker }: { speaker: EventSpeaker }) {
  const initials = speaker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border-2 border-border">
            {speaker.image ? (
              <AvatarImage src={speaker.image} alt={speaker.name} />
            ) : null}
            <AvatarFallback className="bg-muted text-foreground text-lg font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-foreground">{speaker.name}</h4>
                <p className="text-sm text-gray-600">{speaker.title}</p>
                {speaker.company && (
                  <p className="text-sm text-foreground">{speaker.company}</p>
                )}
              </div>
              {speaker.linkedIn && (
                <a
                  href={speaker.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#0077b5] transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
            {speaker.bio && (
              <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                {speaker.bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EventSpeakers({ event, className }: EventSpeakersProps) {
  if (!event.speakers || event.speakers.length === 0) {
    return null;
  }

  return (
    <section className={cn('space-y-6', className)}>
      <h2 className="text-xl font-semibold text-foreground">
        {event.speakers.length === 1 ? 'Featured Speaker' : 'Speakers'}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {event.speakers.map((speaker, index) => (
          <SpeakerCard key={index} speaker={speaker} />
        ))}
      </div>
    </section>
  );
}
