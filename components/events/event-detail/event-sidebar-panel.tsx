'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event } from '@/types/event';
import {
  formatEventDate,
  formatEventTime,
  isRegistrationOpen,
  getSpotsRemaining,
} from '@/lib/data/events';
import { cn } from '@/lib/utils';

interface EventSidebarPanelProps {
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

export function EventSidebarPanel({ event, className }: EventSidebarPanelProps) {
  const [copied, setCopied] = useState(false);

  const isPast = event.status === 'completed';
  const isCancelled = event.status === 'cancelled';
  const isOnline = event.location.format === 'online';
  const isHybrid = event.location.format === 'hybrid';
  const registrationOpen = isRegistrationOpen(event);
  const spotsRemaining = getSpotsRemaining(event);
  const isFull =
    spotsRemaining !== null && spotsRemaining === 0 && !event.registration?.waitlistEnabled;

  const platformLabels: Record<string, string> = {
    zoom: 'Zoom',
    teams: 'Microsoft Teams',
    'google-meet': 'Google Meet',
    other: 'Video Call',
  };

  const getButtonText = () => {
    if (isPast) return 'Event Ended';
    if (isCancelled) return 'Event Cancelled';
    if (isFull) return 'Event Full';
    if (spotsRemaining !== null && spotsRemaining <= 5 && spotsRemaining > 0) {
      return `Register - ${spotsRemaining} spots left`;
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

  const handleCopyAddress = async () => {
    if (event.location.address) {
      await navigator.clipboard.writeText(
        `${event.location.venueName}, ${event.location.address}, ${event.location.city}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Minimalist Card with Corner Icons */}
      <div
        className={cn(
          'relative border border-foreground/10 p-6',
          className
        )}
      >
        {/* Corner Decorations */}
        <CornerIcon className="absolute -top-3 -left-3" />
        <CornerIcon className="absolute -top-3 -right-3" />
        <CornerIcon className="absolute -bottom-3 -left-3" />
        <CornerIcon className="absolute -bottom-3 -right-3" />

        <div className="space-y-6">
          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{formatEventDate(event, 'full')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{formatEventTime(event)}</span>
            </div>
          </div>

          {/* Status */}
          {(isPast || isCancelled) && (
            <p className="text-sm text-muted-foreground text-center">
              {isPast ? 'This event has ended' : 'This event has been cancelled'}
            </p>
          )}

          {/* CTA */}
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            disabled={!registrationOpen && !event.registration?.waitlistEnabled}
            onClick={handleRegister}
          >
            {getButtonText()}
          </Button>

          {event.registration?.deadline && registrationOpen && (
            <p className="text-xs text-muted-foreground text-center">
              Registration closes{' '}
              {new Date(event.registration.deadline).toLocaleDateString('en-NZ', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Location Card */}
      <div className="relative border border-foreground/10 p-6 mt-6">
        <CornerIcon className="absolute -top-3 -left-3" />
        <CornerIcon className="absolute -top-3 -right-3" />
        <CornerIcon className="absolute -bottom-3 -left-3" />
        <CornerIcon className="absolute -bottom-3 -right-3" />

        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isOnline ? 'Online Event' : 'Location'}
          </p>

          {(isOnline || isHybrid) && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Video className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {platformLabels[event.location.meetingPlatform || 'other']}
                </span>
              </div>
              {event.location.meetingUrl && !isPast && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(event.location.meetingUrl, '_blank')}
                >
                  Join Online
                </Button>
              )}
            </div>
          )}

          {(!isOnline || isHybrid) && event.location.venueName && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="text-foreground">{event.location.venueName}</p>
                  {event.location.address && (
                    <p className="text-muted-foreground">{event.location.address}</p>
                  )}
                  {event.location.city && (
                    <p className="text-muted-foreground">{event.location.city}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {event.location.address && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleCopyAddress}
                  >
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                )}
                {event.location.mapUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(event.location.mapUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Map
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-foreground/10 lg:hidden z-50">
        <Button
          size="lg"
          className="w-full"
          disabled={!registrationOpen && !event.registration?.waitlistEnabled}
          onClick={handleRegister}
        >
          {getButtonText()}
        </Button>
      </div>
      <div className="h-20 lg:hidden" />
    </>
  );
}
