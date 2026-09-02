"use client";

import Image from "next/image";
import type { StatItem } from "@/lib/data/join-team";
import { Reveal, CurtainReveal } from "@/components/ui/reveal";

// Sharp Grid collage — five real-event photographs staggered across a 12-col
// editorial grid, each in a hairline frame with a bottom-up curtain reveal.
const GALLERY_IMAGES = [
  {
    src: "/img/joinus-1.jpg",
    alt: "She Sharp volunteers welcoming attendees at an event",
    place: "md:col-span-5 md:col-start-1",
    aspect: "aspect-4/5",
  },
  {
    src: "/img/joinus-2.jpg",
    alt: "She Sharp ambassadors collaborating at a team meeting",
    place: "md:col-span-4 md:col-start-8 md:mt-16",
    aspect: "aspect-4/3",
  },
  {
    src: "/img/joinus-3.jpg",
    alt: "She Sharp community gathered together at a conference",
    place: "md:col-span-4 md:col-start-1",
    aspect: "aspect-4/3",
  },
  {
    src: "/img/joinus-4.jpg",
    alt: "She Sharp volunteers connecting during a break",
    place: "md:col-span-3 md:col-start-6 md:mt-10",
    aspect: "aspect-square",
  },
  {
    src: "/img/joinus-5.jpg",
    alt: "She Sharp team celebrating at an event",
    place: "md:col-span-4 md:col-start-9 md:mt-2",
    aspect: "aspect-3/4",
  },
] as const;

// Split "3 Paths" → { value: "3", label: "Paths" } so single-token stats
// (e.g. "Year-round") render as a standalone editorial figure.
function splitStat(text: string): { value: string; label: string } {
  const [value, ...rest] = text.trim().split(" ");
  return { value, label: rest.join(" ") };
}

type JoinTeamHeroSectionProps = {
  title: string;
  description?: string;
  stats?: StatItem[];
};

export function JoinTeamHeroSection({
  title,
  description,
  stats = [],
}: JoinTeamHeroSectionProps) {
  return (
    <div className="bg-background pt-28 pb-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        {/* Text content */}
        <Reveal className="max-w-3xl">
          <p className="text-label text-ink-500 mb-5">Join our team</p>
          <h1 className="text-display-md text-foreground">{title}</h1>

          {description && (
            <p className="mt-6 text-lg text-ink-700 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </Reveal>

        {/* Editorial stat row */}
        {stats.length > 0 && (
          <Reveal delay={80}>
            <div className="mt-10 flex flex-wrap items-baseline gap-x-10 gap-y-6 border-t border-border pt-8">
              {stats.map((stat) => {
                const { value, label } = splitStat(stat.text);
                return (
                  <div key={stat.text} className="flex items-baseline gap-2.5">
                    <span className="text-3xl md:text-4xl font-bold text-brand leading-none">
                      {value}
                    </span>
                    {label && (
                      <span className="text-base font-medium text-ink-700">
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        )}

        {/* Sharp Grid collage with crop-mark corners */}
        <div className="relative mt-14 md:mt-20">
          {/* Hairline crop marks extending past the collage corners */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-2 -top-2 h-6 w-6 border-l border-t border-ink-300"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 -top-2 h-6 w-6 border-r border-t border-ink-300"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 -left-2 h-6 w-6 border-b border-l border-ink-300"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 -right-2 h-6 w-6 border-b border-r border-ink-300"
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-12 md:gap-6">
            {GALLERY_IMAGES.map((image, i) => (
              <CurtainReveal
                key={image.src}
                delay={i * 90}
                className={`${image.place} border border-border p-1.5 bg-white`}
              >
                <div className={`relative w-full ${image.aspect}`}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                    priority={i < 2}
                  />
                </div>
              </CurtainReveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
