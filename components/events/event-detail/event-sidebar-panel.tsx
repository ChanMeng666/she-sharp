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
import { EventV3 } from "@/types/event";
import {
  formatEventDate,
  isFutureDate,
  isPastEvent,
} from "@/lib/data/events";
import { cn } from "@/lib/utils";

interface EventSidebarPanelProps {
  event: EventV3;
  className?: string;
}

export function EventSidebarPanel({
  event,
  className,
}: EventSidebarPanelProps) {
  const [copied, setCopied] = useState(false);

  const location = event.detailPageData.location;

  const getMapUrl = (): string | null => {
    // Prefer googleMapsUrl from Humanitix if available
    if (location.googleMapsUrl) {
      return location.googleMapsUrl;
    }

    const venueName = location.venueName?.trim();
    const address = location.address?.trim();
    const city = location.city?.trim();

    const parts = [venueName, address, city].filter(Boolean);
    if (parts.length === 0) {
      return null;
    }

    const query = encodeURIComponent(parts.join(", "));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // Format time display with timezone
  const getTimeDisplay = (): string | null => {
    const { startTime, endTime, timezone, time } = event.detailPageData;

    // If we have precise time info from Humanitix
    if (startTime && endTime) {
      const timePart = `${startTime} - ${endTime}`;
      return timezone ? `${timePart} ${timezone}` : timePart;
    }

    // Fall back to original time field
    return time || null;
  };

  const timeDisplay = getTimeDisplay();

  const isPast = isPastEvent(event);
  const isFuture = isFutureDate(event.date);
  const isOnline = location.format === "online";
  const isHybrid = location.format === "hybrid";

  const getButtonText = () => {
    if (isPast && event.detailPageData.galleryUrl) return "View Gallery";
    if (isPast) return "Event Ended";
    return "Register Now";
  };

  const handleRegister = () => {
    if (event.detailPageData.registrationUrl) {
      window.open(event.detailPageData.registrationUrl, "_blank");
    }
  };

  const handleViewGallery = () => {
    if (event.detailPageData.galleryUrl) {
      window.open(event.detailPageData.galleryUrl, "_blank");
    }
  };

  const handleCopyAddress = async () => {
    const fullAddress = [location.venueName, location.address, location.city]
      .filter(Boolean)
      .join(", ");
    if (fullAddress) {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mapUrl = getMapUrl();

  return (
    <>
      {/* Status Card - Only show if event is past */}
      {isPast && (
        <div
          className={cn(
            "relative border border-white/20 overflow-hidden rounded-3xl bg-white/10 backdrop-blur-md p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-300",
            className
          )}
        >
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground text-center">
              This event has ended
            </p>
          </div>
        </div>
      )}

      {/* Location Card */}
      <div
        className={cn(
          "relative border border-white/20 overflow-hidden rounded-3xl bg-white/10 backdrop-blur-md p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-300",
          isPast && "mt-6"
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

            {/* Time - only show if available */}
            {timeDisplay && (
              <div className="flex items-center gap-3 text-base">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">{timeDisplay}</span>
              </div>
            )}

            {(isOnline || isHybrid) && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">Online Event</span>
                </div>
              </div>
            )}

            {(!isOnline || isHybrid) && location.venueName && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-base">
                    <p className="text-foreground">{location.venueName}</p>
                    {location.address && (
                      <p className="text-muted-foreground">{location.address}</p>
                    )}
                    {location.city && (
                      <p className="text-muted-foreground">{location.city}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pl-7">
                  {(location.address || location.venueName) && (
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
                  {mapUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(mapUrl, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Map
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Refund Policy - only show for future events */}
          {isFuture && event.detailPageData.refundPolicy && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Refund Policy:</span>{" "}
                {event.detailPageData.refundPolicy}
              </p>
            </div>
          )}

          {/* CTA - Show if event date is in the future or if past event has gallery */}
          {(isFuture || (isPast && event.detailPageData.galleryUrl)) && (
            <div className="space-y-4">
              <Button
                size="lg"
                variant="brand"
                className="w-full"
                onClick={
                  isPast && event.detailPageData.galleryUrl
                    ? handleViewGallery
                    : handleRegister
                }
              >
                {getButtonText()}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Button */}
      {(isFuture || (isPast && event.detailPageData.galleryUrl)) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-foreground/10 lg:hidden z-50">
          <Button
            size="lg"
            className="w-full"
            onClick={
              isPast && event.detailPageData.galleryUrl
                ? handleViewGallery
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
