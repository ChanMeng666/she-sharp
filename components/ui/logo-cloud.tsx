"use client";

import { InfiniteSlider } from "@/components/ui/infinite-slider";

interface Logo {
  src: string;
  alt: string;
}

interface LogoCloudProps {
  logos: Logo[];
  duration?: number;
  durationOnHover?: number;
  gap?: number;
}

export function LogoCloud({
  logos,
  duration = 40,
  durationOnHover = 80,
  gap = 56,
}: LogoCloudProps) {
  return (
    <div
      className="relative"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <InfiniteSlider
        gap={gap}
        duration={duration}
        durationOnHover={durationOnHover}
      >
        {logos.map((logo, index) => (
          <div
            key={index}
            className="flex items-center justify-center shrink-0"
          >
            <img
              className="h-8 md:h-10 w-auto max-w-[160px] md:max-w-[200px] object-contain"
              src={logo.src}
              alt={logo.alt}
            />
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
}
