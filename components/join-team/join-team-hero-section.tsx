"use client";

import Image from "next/image";
import { Route, Calendar, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StatItem } from "@/lib/data/join-team";

const iconMap: Record<StatItem["iconName"], LucideIcon> = {
  route: Route,
  calendar: Calendar,
  clock: Clock,
};

const GALLERY_IMAGES = [
  { src: "/img/joinus-1.jpg", alt: "Join us image 1" },
  { src: "/img/joinus-2.jpg", alt: "Join us image 2" },
  { src: "/img/joinus-3.jpg", alt: "Join us image 3", isCenter: true },
  { src: "/img/joinus-4.jpg", alt: "Join us image 4" },
  { src: "/img/joinus-5.jpg", alt: "Join us image 5" },
] as const;

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
  const leftImages = GALLERY_IMAGES.slice(0, 2);
  const centerImage = GALLERY_IMAGES[2];
  const rightImages = GALLERY_IMAGES.slice(3);

  return (
    <div className="bg-periwinkle-soft pt-28 pb-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 lg:gap-16">
          {/* Text Content */}
          <div className="flex flex-col items-center">
            <h1 className="text-display-sm text-white mb-4 text-center">
              {title}
            </h1>

            {description && (
              <p className="text-base md:text-lg text-white max-w-2xl mb-12 text-center">
                {description}
              </p>
            )}

            {/* Stats with icons */}
            {stats.length > 0 && (
              <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-10 mb-8 justify-center">
                {stats.map((stat, i) => {
                  const Icon = iconMap[stat.iconName];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-base font-medium text-white">
                        {stat.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Image Gallery Section */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {/* Left Column: Two images stacked */}
              <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
                {leftImages.map((image) => (
                  <div
                    key={image.src}
                    className="relative w-full aspect-4/3 card-sm"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ))}
              </div>

              {/* Center Column: Large image */}
              <div className="relative w-full card-sm flex items-center justify-center">
                <Image
                  src={centerImage.src}
                  alt={centerImage.alt}
                  width={0}
                  height={0}
                  className="w-full h-auto"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
              </div>

              {/* Right Column: Two images stacked */}
              <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
                {rightImages.map((image) => (
                  <div
                    key={image.src}
                    className="relative w-full aspect-4/3 card-sm"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

