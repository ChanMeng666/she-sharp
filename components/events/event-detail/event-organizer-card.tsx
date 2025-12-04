'use client';

import { Linkedin, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Event } from '@/types/event';
import { cn } from '@/lib/utils';

interface EventOrganizerCardProps {
  event: Event;
  className?: string;
}

export function EventOrganizerCard({ event, className }: EventOrganizerCardProps) {
  if (!event.organizer) {
    return null;
  }

  const { organizer } = event;
  const initials = organizer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hosted by</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-[#8982ff]/20">
            {organizer.image ? (
              <AvatarImage src={organizer.image} alt={organizer.name} />
            ) : null}
            <AvatarFallback className="bg-[#f4f4fa] text-foreground text-lg font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{organizer.name}</p>
            <p className="text-sm text-muted-foreground">{organizer.title}</p>
            {organizer.company && (
              <p className="text-sm text-foreground">{organizer.company}</p>
            )}
          </div>
        </div>

        {organizer.bio && (
          <p className="text-sm text-muted-foreground">{organizer.bio}</p>
        )}

        <div className="flex gap-2">
          {organizer.linkedIn && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(organizer.linkedIn, '_blank')}
            >
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1">
            <Mail className="w-4 h-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
