"use client";

import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";
import { hasAnySponsors } from "@/lib/data/events";

interface EventSponsorsProps {
  event: EventV3;
  className?: string;
}

export function EventSponsors({ event, className }: EventSponsorsProps) {
  if (!hasAnySponsors(event)) {
    return null;
  }

  const sponsors = event.detailPageData.sponsors;
  const hasMainSponsors = sponsors.main && sponsors.main.length > 0;
  const hasOtherSponsors = sponsors.other && sponsors.other.length > 0;

  return (
    <section
      id="event-sponsors"
      className={cn("py-16 border-t border-border bg-muted/40", className)}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-lg font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            Event Sponsors
          </p>
          <h2 className="mt-2 text-display-sm">Powered by our partners</h2>
        </div>

        {/* Main Sponsors */}
        {hasMainSponsors && (
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-10 md:gap-12">
              {sponsors.main.map((sponsor, index) => (
                <div
                  key={`main-${sponsor.name}-${index}`}
                  className="flex items-center justify-center px-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="h-24 md:h-28 lg:h-32 w-auto object-contain opacity-90"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Sponsors */}
        {hasOtherSponsors && (
          <div>
            {hasMainSponsors && (
              <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider">
                Additional Sponsors
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-8 md:gap-10">
              {sponsors.other.map((sponsor, index) => (
                <div
                  key={`other-${sponsor.name}-${index}`}
                  className="flex items-center justify-center px-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="h-16 md:h-20 lg:h-24 w-auto object-contain opacity-80"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
