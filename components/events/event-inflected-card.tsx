'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, Clock } from 'lucide-react';
import { InflectedCard } from '@/components/ui/inflected-card';
import { Event } from '@/lib/data/events';
import { cn } from '@/lib/utils';

// Sample images from Unsplash for demo purposes
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', // Conference
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80', // Workshop
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80', // Networking
  'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80', // Tech event
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80', // Team meetup
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80', // Business meeting
];

interface EventInflectedCardProps {
  event: Event;
  className?: string;
  index?: number;
}

export function EventInflectedCard({ event, className, index = 0 }: EventInflectedCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/events/${event.slug}`);
  };

  // Use sample image based on index
  const sampleImage = SAMPLE_IMAGES[index % SAMPLE_IMAGES.length];

  // Format date parts for prominent display
  const eventDate = new Date(event.startDate);
  const dayOfWeek = eventDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const day = eventDate.getDate();

  // Location string (always in-person)
  const locationStr = event.location.venueName || event.location.city || '';

  return (
    <div className={cn('relative', className)}>
      <InflectedCard
        id={event.slug}
        image={sampleImage}
        title={event.title}
        description={event.shortDescription || event.description.slice(0, 120) + '...'}
        tags={[]}
        parentBackgroundColor="#f4f4fa"
        onClick={handleClick}
        cardRounding={16}
        fontSizes={{
          title: '1.25rem',
          description: '0.875rem',
          tags: '0.75rem',
        }}
        margins={{
          title: '0 0 8px 0',
          description: '0 0 0 0',
          tags: '0',
        }}
        buttonIcon={<ArrowRight />}
        buttonIconSize={24}
        buttonIconColor="#ffffff"
        buttonIconHoverColor="#ffffff"
        buttonBackgroundColor="#000000"
        buttonBackgroundHoverColor="#333333"
        imageHoverScale={1.08}
        titleColor="#000000"
        descriptionColor="#525252"
        titleAlignment="left"
        descriptionAlignment="left"
        tagsAlignment="left"
        maxWidth="100%"
      />

      {/* Date, time and location info below the card */}
      <div className="mt-3 px-2.5 flex items-start gap-4">
        {/* Prominent date display */}
        <div className="text-center shrink-0">
          <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground">
            {dayOfWeek}
          </p>
          <p className="text-2xl font-bold text-foreground leading-tight">
            <span className="text-base font-medium mr-0.5">{month}</span>
            {day}
          </p>
        </div>

        {/* Time and location */}
        <div className="space-y-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-[#8982ff] shrink-0" />
            <span>{event.startTime}</span>
          </div>
          {locationStr && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate">{locationStr}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
