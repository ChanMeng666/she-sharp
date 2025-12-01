'use client';

import { MapPin, ExternalLink, Video, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Event } from '@/types/event';
import { cn } from '@/lib/utils';

interface EventLocationCardProps {
  event: Event;
  className?: string;
}

export function EventLocationCard({ event, className }: EventLocationCardProps) {
  const [copied, setCopied] = useState(false);
  const isOnline = event.location.format === 'online';
  const isHybrid = event.location.format === 'hybrid';
  const isPast = event.status === 'completed';

  const handleCopyAddress = async () => {
    if (event.location.address) {
      await navigator.clipboard.writeText(
        `${event.location.venueName}, ${event.location.address}, ${event.location.city}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const platformLabels: Record<string, string> = {
    zoom: 'Zoom',
    teams: 'Microsoft Teams',
    'google-meet': 'Google Meet',
    other: 'Video Call',
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {isOnline ? (
            <>
              <Video className="w-5 h-5 text-blue-500" />
              Online Event
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5 text-foreground" />
              Location
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Online Location */}
        {(isOnline || isHybrid) && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Platform</p>
              <p className="font-medium text-foreground">
                {platformLabels[event.location.meetingPlatform || 'other']}
              </p>
            </div>
            {event.location.meetingUrl && !isPast && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(event.location.meetingUrl, '_blank')}
              >
                <Video className="w-4 h-4 mr-2" />
                Join Online
              </Button>
            )}
            {isPast && (
              <p className="text-sm text-gray-500 italic">
                Meeting link is no longer available
              </p>
            )}
          </div>
        )}

        {/* Physical Location */}
        {(!isOnline || isHybrid) && event.location.venueName && (
          <div className="space-y-3">
            {isHybrid && (
              <div className="pb-3 mb-3 border-b border-gray-200">
                <p className="text-xs text-foreground font-medium uppercase tracking-wide">
                  In-Person Location
                </p>
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">
                {event.location.venueName}
              </p>
              {event.location.address && (
                <p className="text-sm text-gray-600">{event.location.address}</p>
              )}
              {event.location.city && (
                <p className="text-sm text-gray-600">{event.location.city}</p>
              )}
            </div>

            <div className="flex gap-2">
              {event.location.address && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleCopyAddress}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              )}
              {event.location.mapUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(event.location.mapUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Map
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Embedded Map Preview (placeholder) */}
        {(!isOnline || isHybrid) && event.location.mapUrl && (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <a
              href={event.location.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-foreground transition-colors"
            >
              View on Google Maps →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
