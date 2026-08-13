"use client";

import Image from "next/image";
import { EventV3, EventSponsorV3 } from "@/types/event";
import { hasAnySponsors } from "@/lib/data/events";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EventSponsorsProps {
  event: EventV3;
  className?: string;
}

interface SponsorRowProps {
  sponsor: EventSponsorV3;
  id: string;
  logoSizeClass?: string;
}

function isLogoOnly(sponsor: EventSponsorV3): boolean {
  return !sponsor.description && !sponsor.image;
}

/**
 * A sponsor logo, sized by height with `w-auto` so each mark keeps its own
 * proportions.
 *
 * `width`/`height` are a hint that only reserves space before the file lands —
 * `w-auto` hands the final width back to the logo's intrinsic ratio, so the
 * rendered lock-up is unchanged. SVG marks are passed through `unoptimized`:
 * the image optimizer rejects `image/svg+xml` unless `dangerouslyAllowSVG` is
 * enabled, and a vector file has nothing to gain from re-encoding anyway.
 */
function SponsorLogo({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={440}
      height={220}
      sizes="440px"
      unoptimized={src.toLowerCase().endsWith(".svg")}
      className={className}
    />
  );
}

interface SponsorLogoGridProps {
  sponsors: EventSponsorV3[];
  logoSizeClass?: string;
}

function SponsorLogoGrid({
  sponsors,
  logoSizeClass = "h-20 md:h-24 lg:h-28",
}: SponsorLogoGridProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-10 md:gap-x-16 lg:gap-x-20">
      {sponsors.map((sponsor, index) => (
        <Tooltip key={`${sponsor.name}-${index}`}>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center">
              <SponsorLogo
                src={sponsor.logo}
                alt={sponsor.name}
                className={`${logoSizeClass} w-auto max-w-[220px] object-contain grayscale opacity-80 transition duration-300 hover:grayscale-0 hover:opacity-100`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>{sponsor.name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function SponsorRow({ sponsor, id, logoSizeClass = "h-28 md:h-36 lg:h-44" }: SponsorRowProps) {
  const hasDetails = !!(sponsor.name || sponsor.description || sponsor.image);

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 md:gap-10">
      {/* Left: name + description (+ optional representative photo) */}
      {hasDetails && (
        <div className="flex-1 min-w-0 text-center sm:text-left">
          {sponsor.image && (
            <Image
              src={sponsor.image}
              alt={sponsor.imageAlt || sponsor.name}
              width={96}
              height={96}
              sizes="96px"
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
        <SponsorLogo
          src={sponsor.logo}
          alt={sponsor.name}
          className={`${logoSizeClass} w-auto object-contain grayscale opacity-80 transition duration-300 hover:grayscale-0 hover:opacity-100`}
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
          <p className="text-label text-ink-500">Event sponsors</p>
          <h2 className="mt-2 text-display-sm text-foreground">
            Powered by our partners
          </h2>
        </div>

        {/* Main Sponsors grouped by tier (conferences) */}
        {tieredMain && (
          <div className="space-y-12">
            {tierGroups.map((tier) => (
              <div key={tier}>
                <p className="text-label text-ink-500 text-center mb-6">
                  {tier}
                </p>
                {(() => {
                  const tierSponsors = sponsors.main.filter(
                    (s) => (s.tier || "Other") === tier
                  );
                  return tierSponsors.every(isLogoOnly) ? (
                    <SponsorLogoGrid
                      sponsors={tierSponsors}
                      logoSizeClass="h-20 md:h-24 lg:h-28"
                    />
                  ) : (
                    <div className="space-y-8">
                      {tierSponsors.map((sponsor, index) => (
                        <SponsorRow
                          key={`${tier}-${sponsor.name}-${index}`}
                          id={`${tier}-${sponsor.name}-${index}`}
                          sponsor={sponsor}
                          logoSizeClass="h-24 md:h-28 lg:h-32"
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}

        {/* Main Sponsors (untiered) */}
        {hasMainSponsors && !tieredMain && (
          sponsors.main.every(isLogoOnly) ? (
            <SponsorLogoGrid
              sponsors={sponsors.main}
              logoSizeClass="h-20 md:h-24 lg:h-28"
            />
          ) : (
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
          )
        )}

        {/* Other Sponsors */}
        {hasOtherSponsors && (
          <div className={hasMainSponsors ? "mt-8" : ""}>
            {hasMainSponsors && (
              <p className="text-label text-ink-500 text-center mb-6">
                Additional sponsors
              </p>
            )}
            {sponsors.other.every(isLogoOnly) ? (
              <SponsorLogoGrid
                sponsors={sponsors.other}
                logoSizeClass="h-16 md:h-20 lg:h-24"
              />
            ) : (
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
            )}
          </div>
        )}

        {/* Sponsors banner image (legacy conference pages) */}
        {event.detailPageData.sponsorsImage && (
          <div className="mt-12 w-full overflow-hidden rounded-[32px] border border-border">
            {/* Banner dimensions are not in the data; `h-auto` restores the
                banner's own aspect ratio once it loads. */}
            <Image
              src={event.detailPageData.sponsorsImage.url}
              alt={event.detailPageData.sponsorsImage.alt}
              width={1600}
              height={900}
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="w-full h-auto rounded-2xl"
            />
          </div>
        )}

        {/* Closing thank-you to sponsors (mirrors the legacy conference pages) */}
        <p className="mt-12 text-label text-ink-500 text-center">
          Thanks for the support
        </p>
      </div>
    </section>
  );
}
