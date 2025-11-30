'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Video, Users } from 'lucide-react';
import { Event, formatEventDate } from '@/lib/data/events';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function EventCard({
  event,
  variant = 'default',
  className,
}: EventCardProps) {
  const isOnline = event.location.format === 'online';
  const isHybrid = event.location.format === 'hybrid';
  const isPast = event.status === 'completed';

  return (
    <Link href={`/events/${event.slug}`} className={cn('block', className)}>
      <Card
        className={cn(
          'group h-full overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:-translate-y-1',
          'border border-gray-200 dark:border-gray-800',
          isPast && 'opacity-75'
        )}
      >
        {/* Cover Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              'object-cover transition-transform duration-300',
              'group-hover:scale-105'
            )}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            {/* Price Badge */}
            {event.registration?.isFree && (
              <Badge className="bg-mint-dark text-white border-0 shadow-md">
                Free
              </Badge>
            )}
            {event.registration?.price && event.registration.price.amount > 0 && (
              <Badge className="bg-purple-dark text-white border-0 shadow-md">
                ${event.registration.price.amount}
              </Badge>
            )}

            {/* Format Badge */}
            <Badge
              variant="secondary"
              className={cn(
                'shadow-md ml-auto',
                isOnline && 'bg-blue-500 text-white',
                isHybrid && 'bg-purple-500 text-white',
                !isOnline && !isHybrid && 'bg-white/90 text-navy-dark'
              )}
            >
              {isOnline ? (
                <>
                  <Video className="w-3 h-3 mr-1" />
                  Online
                </>
              ) : isHybrid ? (
                'Hybrid'
              ) : (
                'In Person'
              )}
            </Badge>
          </div>

          {/* Past Event Overlay */}
          {isPast && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="secondary" className="bg-white/90 text-navy-dark">
                Past Event
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-purple-dark font-medium">
            <Calendar className="w-4 h-4" />
            <span>
              {formatEventDate(event, 'short')} · {event.startTime}
            </span>
          </div>

          {/* Title */}
          <h3
            className={cn(
              'font-semibold text-navy-dark line-clamp-2',
              'group-hover:text-purple-dark transition-colors',
              variant === 'compact' ? 'text-base' : 'text-lg'
            )}
          >
            {event.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {isOnline ? (
              <>
                <Video className="w-4 h-4 text-blue-500" />
                <span>Online Event</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate">
                  {event.location.venueName || event.location.city}
                </span>
              </>
            )}
          </div>

          {/* Organizer */}
          {event.organizer && variant !== 'compact' && (
            <p className="text-sm text-gray-500 truncate">
              Hosted by {event.organizer.company || event.organizer.name}
            </p>
          )}

          {/* Attendees Section */}
          {event.registration?.attendeeCount &&
            event.registration.attendeeCount > 0 && (
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                {/* Avatar Stack */}
                {event.attendeeAvatars && event.attendeeAvatars.length > 0 && (
                  <div className="flex -space-x-2">
                    {event.attendeeAvatars.slice(0, 3).map((avatar, index) => (
                      <Avatar
                        key={index}
                        className="w-6 h-6 border-2 border-white"
                      >
                        <AvatarImage src={avatar} alt="Attendee" />
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-dark">
                          {index + 1}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}

                {/* Attendee Count */}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{event.registration.attendeeCount} attending</span>
                </div>
              </div>
            )}

          {/* Capacity indicator for upcoming events */}
          {!isPast &&
            event.registration?.capacity &&
            event.registration?.attendeeCount && (
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Registration</span>
                  <span>
                    {event.registration.attendeeCount} /{' '}
                    {event.registration.capacity}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-dark rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (event.registration.attendeeCount / event.registration.capacity) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Compact variant for sidebar or list views
export function EventCardCompact({
  event,
  className,
}: {
  event: Event;
  className?: string;
}) {
  return <EventCard event={event} variant="compact" className={className} />;
}
