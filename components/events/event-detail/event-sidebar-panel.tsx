"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  ExternalLink,
  Copy,
  Check,
  Users,
  GraduationCap,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deckForEvent } from "@/lib/deck/index-meta";
import { EventV3 } from "@/types/event";
import {
  formatEventDate,
  hasPhotos,
  isFutureDate,
  isPastEvent,
} from "@/lib/data/event-utils";
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

  const handleViewPhotos = () => {
    const el = document.getElementById("event-photos");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const hasLocalPhotos = hasPhotos(event);
  const showViewPhotosFallback =
    isPast && hasLocalPhotos && !event.detailPageData.galleryUrl;

  // The slides projected at this event, when one was built. Resolved from a
  // generated manifest rather than a field on the event: a deck's slug IS its
  // event slug, so the link is derived and the two cannot drift. The manifest
  // deliberately imports no deck — see `lib/deck/index-meta.ts` — which is what
  // keeps this client component's bundle to a few hundred bytes.
  const deck = deckForEvent(event.slug);

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

  const cardClass = "rounded-[16px] bg-background border border-border p-5 sm:p-6 md:p-8";

  const IconBox = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-center w-8 h-8 rounded-lg  shrink-0">
      {children}
    </div>
  );

  return (
    <>
      {/* Status Card - only for past events */}
      {isPast && (
        <div className={cn(cardClass, className)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-medium text-foreground">This event has ended</p>
            {event.attendees != null && event.attendees > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <IconBox>
                  <Users className="w-4 h-4 text-brand" />
                </IconBox>
                <span>{event.attendees} attended</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time & Location Card */}
      <div className={cn(cardClass, isPast && "mt-4")}>
        <div className="space-y-6">
          {/* Heading */}
          <div className="flex items-center gap-3">
                     <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground">
              Time & location
            </h2>
          </div>

          {/* Meta rows */}
          <div className="space-y-3">
            {/* Date */}
            <div className="flex items-center gap-3">
              <IconBox>
                <Calendar className="w-4 h-4 text-brand" />
              </IconBox>
              <span className="text-sm text-foreground">
                {formatEventDate(event, "full")}
              </span>
            </div>

            {/* Time */}
            {timeDisplay && (
              <div className="flex items-center gap-3">
                <IconBox>
                  <Clock className="w-4 h-4 text-brand" />
                </IconBox>
                <span className="text-sm text-foreground">{timeDisplay}</span>
              </div>
            )}

            {/* Online indicator */}
            {(isOnline || isHybrid) && (
              <div className="flex items-center gap-3">
                <IconBox>
                  <Video className="w-4 h-4 text-brand" />
                </IconBox>
                <span className="text-sm text-foreground">Online event</span>
              </div>
            )}

            {/* Venue */}
            {(!isOnline || isHybrid) && location.venueName && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <IconBox>
                    <MapPin className="w-4 h-4 text-brand" />
                  </IconBox>
                  <div className="text-sm leading-relaxed">
                    <p className="text-foreground font-medium">{location.venueName}</p>
                    {location.address && (
                      <p className="text-muted-foreground">{location.address}</p>
                    )}
                    {location.city && (
                      <p className="text-muted-foreground">{location.city}</p>
                    )}
                  </div>
                </div>

                {!isPast && (
                  <div className="flex gap-2 pl-11">
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
                )}
              </div>
            )}

            {/* Audience / who should attend */}
            {event.detailPageData.audience && (
              <div className="flex items-start gap-3">
                <IconBox>
                  <GraduationCap className="w-4 h-4 text-brand" />
                </IconBox>
                <div className="text-sm leading-relaxed">
                  <p className="text-foreground font-medium">Who should attend</p>
                  <p className="text-muted-foreground">
                    {event.detailPageData.audience}
                  </p>
                </div>
              </div>
            )}

            {/* Attendees */}
            {!isPast && event.attendees != null && event.attendees > 0 && (
              <div className="flex items-center gap-3">
                <IconBox>
                  <Users className="w-4 h-4 text-brand" />
                </IconBox>
                <span className="text-sm text-foreground">
                  {event.attendees} registered
                </span>
              </div>
            )}
          </div>

          {/* Refund policy */}
          {isFuture && event.detailPageData.refundPolicy && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Refund policy: </span>
                {event.detailPageData.refundPolicy}
              </p>
            </div>
          )}

          {/* CTA */}
          {(isFuture || (isPast && event.detailPageData.galleryUrl)) && (
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
          )}

          {showViewPhotosFallback && (
            <Button
              size="lg"
              variant="brand"
              className="w-full"
              onClick={handleViewPhotos}
            >
              View Photos
            </Button>
          )}

          {/* The deck that was projected in the room. `outline` on purpose —
              registering or seeing the photos is what most visitors came for,
              and this must not compete with whichever of those is above it. A
              real Link rather than the `window.open` its neighbours use,
              because `/present/<slug>` is an internal route. */}
          {deck && (
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href={`/present/${deck.slug}`}>
                <Presentation className="w-4 h-4" />
                View the slides
              </Link>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
