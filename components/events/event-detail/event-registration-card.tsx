'use client';

import { Calendar, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Event,
  formatEventDate,
  formatEventTime,
  isRegistrationOpen,
  getSpotsRemaining,
} from '@/lib/data/events';
import { cn } from '@/lib/utils';

interface EventRegistrationCardProps {
  event: Event;
  className?: string;
}

export function EventRegistrationCard({
  event,
  className,
}: EventRegistrationCardProps) {
  const isPast = event.status === 'completed';
  const isCancelled = event.status === 'cancelled';
  const registrationOpen = isRegistrationOpen(event);
  const spotsRemaining = getSpotsRemaining(event);
  const isFull =
    spotsRemaining !== null && spotsRemaining === 0 && !event.registration?.waitlistEnabled;

  const capacityPercent =
    event.registration?.capacity && event.registration?.attendeeCount
      ? Math.min(
          100,
          (event.registration.attendeeCount / event.registration.capacity) * 100
        )
      : 0;

  const getButtonText = () => {
    if (isPast) return 'Event Ended';
    if (isCancelled) return 'Event Cancelled';
    if (isFull) return 'Event Full';
    if (spotsRemaining !== null && spotsRemaining <= 5 && spotsRemaining > 0) {
      return `Register - ${spotsRemaining} spots left!`;
    }
    if (event.registration?.waitlistEnabled && spotsRemaining === 0) {
      return 'Join Waitlist';
    }
    return 'Register Now';
  };

  const handleRegister = () => {
    if (event.registration?.externalUrl) {
      window.open(event.registration.externalUrl, '_blank');
    }
  };

  return (
    <Card className={cn('sticky top-24', className)}>
      <CardHeader className="pb-4">
        {/* Price Display */}
        <div className="text-center">
          {event.registration?.isFree ? (
            <div className="text-2xl font-bold text-foreground">Free</div>
          ) : event.registration?.price ? (
            <div className="text-2xl font-bold text-foreground">
              ${event.registration.price.amount}{' '}
              <span className="text-sm font-normal text-gray-500">
                {event.registration.price.currency}
              </span>
            </div>
          ) : (
            <div className="text-lg text-gray-500">Registration required</div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date & Time */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-foreground" />
            <span className="text-gray-700">{formatEventDate(event, 'full')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-foreground" />
            <span className="text-gray-700">{formatEventTime(event)}</span>
          </div>
        </div>

        {/* Capacity Progress */}
        {event.registration?.capacity && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Registration</span>
              <span className="font-medium text-foreground">
                {event.registration.attendeeCount || 0} /{' '}
                {event.registration.capacity}
              </span>
            </div>
            <Progress value={capacityPercent} className="h-2" />
            {spotsRemaining !== null && spotsRemaining <= 10 && spotsRemaining > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Only {spotsRemaining} spots remaining!
              </p>
            )}
          </div>
        )}

        {/* Attendee Avatars */}
        {event.registration?.attendeeCount &&
          event.registration.attendeeCount > 0 && (
            <div className="flex items-center gap-3">
              {event.attendeeAvatars && event.attendeeAvatars.length > 0 && (
                <div className="flex -space-x-2">
                  {event.attendeeAvatars.slice(0, 4).map((avatar, index) => (
                    <Avatar
                      key={index}
                      className="w-8 h-8 border-2 border-white"
                    >
                      <AvatarImage src={avatar} alt="Attendee" />
                      <AvatarFallback className="text-xs bg-muted text-foreground">
                        {index + 1}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{event.registration.attendeeCount} attending</span>
              </div>
            </div>
          )}

        {/* Status Messages */}
        {isPast && (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span>This event has ended</span>
          </div>
        )}
        {isCancelled && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>This event has been cancelled</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <Button
          className={cn(
            'w-full',
            !registrationOpen && !event.registration?.waitlistEnabled && 'bg-gray-400 cursor-not-allowed'
          )}
          size="lg"
          disabled={!registrationOpen && !event.registration?.waitlistEnabled}
          onClick={handleRegister}
        >
          {getButtonText()}
        </Button>
        {event.registration?.deadline && registrationOpen && (
          <p className="text-xs text-gray-500 text-center">
            Registration closes{' '}
            {new Date(event.registration.deadline).toLocaleDateString('en-NZ', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
