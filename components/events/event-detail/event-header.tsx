'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, Video, Share2, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event, formatEventDate, formatEventTime, getDaysUntilEvent } from '@/lib/data/events';
import { cn } from '@/lib/utils';

interface EventHeaderProps {
  event: Event;
  className?: string;
}

export function EventHeader({ event, className }: EventHeaderProps) {
  const isOnline = event.location.format === 'online';
  const isHybrid = event.location.format === 'hybrid';
  const isPast = event.status === 'completed';
  const daysUntil = getDaysUntilEvent(event);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: event.title,
        text: event.shortDescription || event.description,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Breadcrumb */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-dark transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      {/* Cover Image */}
      <div className="relative aspect-[21/9] sm:aspect-[3/1] rounded-xl overflow-hidden">
        <Image
          src={event.coverImage}
          alt={event.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 900px"
          className="object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {/* Price/Free Badge */}
          {event.registration?.isFree && (
            <Badge className="bg-mint-dark text-white border-0 shadow-lg">
              Free Event
            </Badge>
          )}
          {event.registration?.price && event.registration.price.amount > 0 && (
            <Badge className="bg-purple-dark text-white border-0 shadow-lg">
              ${event.registration.price.amount} {event.registration.price.currency}
            </Badge>
          )}
          {!event.registration?.isFree && !event.registration?.price && <div />}

          {/* Format Badge */}
          <Badge
            variant="secondary"
            className={cn(
              'shadow-lg',
              isOnline && 'bg-blue-500 text-white',
              isHybrid && 'bg-purple-500 text-white',
              !isOnline && !isHybrid && 'bg-white/90 text-navy-dark'
            )}
          >
            {isOnline ? (
              <>
                <Video className="w-3 h-3 mr-1" />
                Online Event
              </>
            ) : isHybrid ? (
              'Hybrid Event'
            ) : (
              <>
                <MapPin className="w-3 h-3 mr-1" />
                In Person
              </>
            )}
          </Badge>
        </div>

        {/* Past event overlay */}
        {isPast && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="bg-white text-navy-dark text-lg px-6 py-2">
              Past Event
            </Badge>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="space-y-4">
        {/* Category & Days Until */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="capitalize">
            {event.category.replace(/-/g, ' ')}
          </Badge>
          {!isPast && daysUntil >= 0 && (
            <span className="text-sm text-purple-dark font-medium">
              {daysUntil === 0
                ? 'Today!'
                : daysUntil === 1
                  ? 'Tomorrow'
                  : `${daysUntil} days away`}
            </span>
          )}
          {event.tags && event.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-navy-dark">
          {event.title}
        </h1>

        {/* Date, Time, Location */}
        <div className="flex flex-wrap gap-6 text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-dark" />
            <span>{formatEventDate(event, 'full')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-dark" />
            <span>{formatEventTime(event)}</span>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Video className="w-5 h-5 text-blue-500" />
                <span>Online via {event.location.meetingPlatform || 'Video Call'}</span>
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5 text-purple-dark" />
                <span>{event.location.venueName}, {event.location.city}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Bookmark className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
