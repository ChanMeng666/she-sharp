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
      className="py-16 border-t border-border bg-white"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-lg font-bold tracking-[0.2em] uppercase text-muted-foreground">
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
                    className="h-36 md:h-44 lg:h-52 w-auto object-contain opacity-90"
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

        {/* Sponsor descriptions */}
        {(() => {
          const described = [
            ...(sponsors.main || []),
            ...(sponsors.other || []),
          ].filter((s) => s.description && s.description.trim().length > 0);
          if (described.length === 0) return null;
          return (
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              {described.map((sponsor, index) => (
                <div
                  key={`desc-${sponsor.name}-${index}`}
                  className="w-full md:w-[calc(50%-0.75rem)] rounded-[var(--radius-card-sm)] border border-border bg-muted/30 p-5 md:p-6"
                >
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {sponsor.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {sponsor.description}
                  </p>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </section>
  );
}
