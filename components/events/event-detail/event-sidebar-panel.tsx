"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Event } from "@/types/event";
import {
  formatEventDate,
  formatEventTime,
  isRegistrationOpen,
  getSpotsRemaining,
} from "@/lib/data/events";
import { cn } from "@/lib/utils";

interface EventSidebarPanelProps {
  event: Event;
  className?: string;
}

export function EventSidebarPanel({
  event,
  className,
}: EventSidebarPanelProps) {
  const [copied, setCopied] = useState(false);

  const isPast = event.status === "completed";
  const isCancelled = event.status === "cancelled";
  const isOnline = event.location.format === "online";
  const isHybrid = event.location.format === "hybrid";
  const registrationOpen = isRegistrationOpen(event);
  const spotsRemaining = getSpotsRemaining(event);
  const isFull =
    spotsRemaining !== null &&
    spotsRemaining === 0 &&
    !event.registration?.waitlistEnabled;

  // Check if event date is in the future
  const eventDate = new Date(event.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFutureEvent = eventDate >= today;

  const platformLabels: Record<string, string> = {
    zoom: "Zoom",
    teams: "Microsoft Teams",
    "google-meet": "Google Meet",
    other: "Video Call",
  };

  const getButtonText = () => {
    if (isPast && event.albumUrl) return "View Image";
    if (isPast) return "Event Ended";
    if (isCancelled) return "Event Cancelled";
    if (isFull) return "Event Full";
    if (spotsRemaining !== null && spotsRemaining <= 5 && spotsRemaining > 0) {
      return `Register - ${spotsRemaining} spots left`;
    }
    if (event.registration?.waitlistEnabled && spotsRemaining === 0) {
      return "Join Waitlist";
    }
    return "Register Now";
  };

  const handleRegister = () => {
    if (event.registration?.externalUrl) {
      window.open(event.registration.externalUrl, "_blank");
    }
  };

  const handleViewImages = () => {
    if (event.albumUrl) {
      window.open(event.albumUrl, "_blank");
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
      {/* Status Card - Only show if event is past or cancelled */}
      {(isPast || isCancelled) && (
        <div
          className={cn(
            "relative border border-white/20 overflow-hidden rounded-3xl bg-white/10 backdrop-blur-md p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-300",
            className
          )}
        >
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground text-center">
              {isPast
                ? "This event has ended"
                : "This event has been cancelled"}
            </p>
          </div>
        </div>
      )}

      {/* Location Card */}
      <div
        className={cn(
          "relative border border-white/20 overflow-hidden rounded-3xl bg-white/10 backdrop-blur-md p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-300",
          (isPast || isCancelled) && "mt-6"
        )}
      >
        <div className="space-y-8">
          <p className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground uppercase">
            Time & Location
          </p>

          <div className="space-y-4">
            {/* Date */}
            <div className="flex items-center gap-3 text-base">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">
                {formatEventDate(event, "full")}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 text-base">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">{formatEventTime(event)}</span>
            </div>

            {(isOnline || isHybrid) && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">
                    {platformLabels[event.location.meetingPlatform || "other"]}
                  </span>
                </div>
                {event.location.meetingUrl && !isPast && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      window.open(event.location.meetingUrl, "_blank")
                    }
                  >
                    Join Online
                  </Button>
                )}
              </div>
            )}

            {(!isOnline || isHybrid) && event.location.venueName && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-base">
                    <p className="text-foreground">
                      {event.location.venueName}
                    </p>
                    {event.location.address && (
                      <p className="text-muted-foreground">
                        {event.location.address}
                      </p>
                    )}
                    {event.location.city && (
                      <p className="text-muted-foreground">
                        {event.location.city}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pl-7">
                  {event.location.address && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleCopyAddress}
                    >
                      {copied ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  )}
                  {event.location.mapUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        window.open(event.location.mapUrl, "_blank")
                      }
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Map
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA - Show if event date is in the future or if past event has albumUrl */}
          {(isFutureEvent || (isPast && event.albumUrl)) && (
            <div className="space-y-4">
              <Button
                size="lg"
                variant="brand"
                className="w-full"
                disabled={
                  !isPast &&
                  !registrationOpen &&
                  !event.registration?.waitlistEnabled
                }
                onClick={
                  isPast && event.albumUrl
                    ? handleViewImages
                    : handleRegister
                }
              >
                {getButtonText()}
              </Button>

              {event.registration?.deadline && registrationOpen && (
                <p className="text-base text-muted-foreground text-center italic">
                  Registration closes{" "}
                  {new Date(event.registration.deadline).toLocaleDateString(
                    "en-NZ",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Button - Show if event date is in the future or if past event has albumUrl */}
      {(isFutureEvent || (isPast && event.albumUrl)) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-foreground/10 lg:hidden z-50">
          <Button
            size="lg"
            className="w-full"
            disabled={
              !isPast &&
              !registrationOpen &&
              !event.registration?.waitlistEnabled
            }
            onClick={
              isPast && event.albumUrl
                ? handleViewImages
                : handleRegister
            }
          >
            {getButtonText()}
          </Button>
        </div>
      )}
      <div className="h-20 lg:hidden" />
    </>
  );
}
