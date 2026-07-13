"use client";

import { EventV3 } from "@/types/event";
import { cn } from "@/lib/utils";
import { CurtainReveal } from "@/components/ui/reveal";
import { Lightbox, useLightbox, type LightboxImage } from "@/components/ui/lightbox";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

interface EventPostersProps {
  event: EventV3;
  className?: string;
}

/**
 * Renders promotional posters for an event. Posters are portrait artwork, so
 * they are shown whole (never cropped) and open full-size in the lightbox.
 */
export function EventPosters({ event, className }: EventPostersProps) {
  const posters = event.detailPageData.posters ?? [];

  const tiles: LightboxImage[] = posters.map((poster, index) => ({
    src: poster.url,
    alt: poster.alt || `${event.title} poster ${index + 1}`,
  }));

  const lightbox = useLightbox(tiles);

  if (tiles.length === 0) {
    return null;
  }

  return (
    <Section spacing="section" className={cn("bg-muted", className)}>
      <Container size="content">
        <h2 className="text-display-sm text-foreground text-center mb-6 sm:mb-8 md:mb-12">
          Event poster
        </h2>
        <div
          className={cn(
            "grid gap-6 sm:gap-8 justify-center",
            tiles.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
          )}
        >
          {tiles.map((poster, index) => (
            <CurtainReveal key={index} delay={index * 80} className="mx-auto w-full max-w-md">
              <button
                type="button"
                onClick={() => lightbox.openAt(index)}
                aria-label={`View poster ${index + 1} of ${tiles.length} full size`}
                className="group block w-full cursor-pointer overflow-hidden rounded-[16px] border border-border bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={poster.src}
                  alt={poster.alt}
                  loading="lazy"
                  className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </button>
            </CurtainReveal>
          ))}
        </div>
      </Container>

      <Lightbox
        images={lightbox.images}
        index={lightbox.index}
        open={lightbox.open}
        onIndexChange={lightbox.onIndexChange}
        onOpenChange={lightbox.onOpenChange}
      />
    </Section>
  );
}
