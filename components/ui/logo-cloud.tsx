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
  /** Scroll right-to-left instead of left-to-right. */
  reverse?: boolean;
}

export function LogoCloud({
  logos,
  duration = 90,
  durationOnHover = 160,
  gap = 56,
  reverse = false,
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
        reverse={reverse}
      >
        {logos.map((logo, index) => (
          <div
            key={index}
            className="flex items-center justify-center shrink-0 w-[100px] md:w-[120px] h-[40px] md:h-[48px]"
          >
            <img
              className="max-w-full max-h-full w-auto h-auto object-contain grayscale transition duration-300 hover:grayscale-0"
              src={logo.src}
              alt={logo.alt}
            />
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
}
