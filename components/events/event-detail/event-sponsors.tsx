"use client";

import { EventV3, EventSponsorV3 } from "@/types/event";
import { hasAnySponsors } from "@/lib/data/events";

interface EventSponsorsProps {
  event: EventV3;
  className?: string;
}

interface SponsorRowProps {
  sponsor: EventSponsorV3;
  id: string;
  logoSizeClass?: string;
}

function SponsorRow({ sponsor, id, logoSizeClass = "h-28 md:h-36 lg:h-44" }: SponsorRowProps) {
  const hasDetails = !!(sponsor.name || sponsor.description || sponsor.image);

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 md:gap-10">
      {/* Left: name + description (+ optional representative photo) */}
      {hasDetails && (
        <div className="flex-1 min-w-0 text-center sm:text-left">
          {sponsor.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={sponsor.image}
              alt={sponsor.imageAlt || sponsor.name}
              className="h-24 w-24 rounded-full object-cover mb-3 mx-auto sm:mx-0"
            />
          )}
          {sponsor.name && (
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {sponsor.name}
            </h3>
          )}
          {sponsor.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sponsor.description}
            </p>
          )}
        </div>
      )}

      {/* Right: logo */}
      <div className="shrink-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sponsor.logo}
          alt={sponsor.name}
          className={`${logoSizeClass} w-auto object-contain opacity-90`}
        />
      </div>
    </div>
  );
}

export function EventSponsors({ event, className }: EventSponsorsProps) {
  if (!hasAnySponsors(event)) {
    return null;
  }

  const sponsors = event.detailPageData.sponsors;
  const hasMainSponsors = sponsors.main && sponsors.main.length > 0;
  const hasOtherSponsors = sponsors.other && sponsors.other.length > 0;

  // When sponsors carry tier labels (e.g. conferences), group main sponsors by
  // tier and render a labelled row per tier in a sensible order.
  const tieredMain = hasMainSponsors && sponsors.main.some((s) => s.tier);
  const TIER_ORDER = [
    "Gold",
    "Silver",
    "Bronze",
    "Exhibition",
    "Venue",
    "Networking & Drinks",
  ];
  const tierGroups = tieredMain
    ? Array.from(new Set(sponsors.main.map((s) => s.tier || "Other"))).sort(
        (a, b) => {
          const ia = TIER_ORDER.indexOf(a);
          const ib = TIER_ORDER.indexOf(b);
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        }
      )
    : [];

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

        {/* Main Sponsors grouped by tier (conferences) */}
        {tieredMain && (
          <div className="space-y-12">
            {tierGroups.map((tier) => (
              <div key={tier}>
                <p className="text-center text-sm font-bold tracking-[0.2em] uppercase text-brand mb-6">
                  {tier}
                </p>
                <div className="space-y-8">
                  {sponsors.main
                    .filter((s) => (s.tier || "Other") === tier)
                    .map((sponsor, index) => (
                      <SponsorRow
                        key={`${tier}-${sponsor.name}-${index}`}
                        id={`${tier}-${sponsor.name}-${index}`}
                        sponsor={sponsor}
                        logoSizeClass="h-24 md:h-28 lg:h-32"
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Sponsors (untiered) */}
        {hasMainSponsors && !tieredMain && (
          <div className="space-y-4">
            {sponsors.main.map((sponsor, index) => (
              <SponsorRow
                key={`main-${sponsor.name}-${index}`}
                id={`main-${sponsor.name}-${index}`}
                sponsor={sponsor}
                logoSizeClass="h-28 md:h-36 lg:h-44"
              />
            ))}
          </div>
        )}

        {/* Other Sponsors */}
        {hasOtherSponsors && (
          <div className={hasMainSponsors ? "mt-8" : ""}>
            {hasMainSponsors && (
              <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider">
                Additional Sponsors
              </p>
            )}
            <div className="space-y-4">
              {sponsors.other.map((sponsor, index) => (
                <SponsorRow
                  key={`other-${sponsor.name}-${index}`}
                  id={`other-${sponsor.name}-${index}`}
                  sponsor={sponsor}
                  logoSizeClass="h-20 md:h-24 lg:h-28"
                />
              ))}
            </div>
          </div>
        )}

        {/* Sponsors banner image (legacy conference pages) */}
        {event.detailPageData.sponsorsImage && (
          <div className="mt-12 w-full overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.detailPageData.sponsorsImage.url}
              alt={event.detailPageData.sponsorsImage.alt}
              className="w-full h-auto rounded-2xl"
            />
          </div>
        )}

        {/* Closing thank-you to sponsors (mirrors the legacy conference pages) */}
        <p className="mt-12 text-center text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground">
          Thanks for the support
        </p>
      </div>
    </section>
  );
}
