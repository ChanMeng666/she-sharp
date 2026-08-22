"use client";

import { cn } from "@/lib/utils";
import { ParallaxImage } from "@/components/ui/parallax";

/**
 * PhotoBackdrop — a call to action standing on a photograph.
 *
 * `ParallaxImage` already accepts overlay children; what it does not carry is
 * the scrim, and a scrim is the whole difference between legible white type and
 * type that disappears over somebody's white t-shirt. This adds the scrim and a
 * centred content slot, and nothing else.
 *
 * DO NOT PASS A PANORAMA. The frame is a `fill` cover at a fixed viewport
 * height, so a 2.9:1 source on a phone crops to a horizontal band of torsos
 * with every face outside the frame. The whole-festival group photographs
 * belong in a fixed-aspect figure or as a mosaic tile. Roughly 3:2 sources
 * only, which is what the curated pool holds.
 */

type BackdropImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

const SCRIM = {
  /** Even wash. Safest under body copy that runs the full width. */
  dark: "bg-foreground/65",
  /** Heavier at the bottom, for a heading that sits low in the frame. */
  gradient: "bg-gradient-to-t from-foreground/85 via-foreground/55 to-foreground/25",
  none: "",
} as const;

export interface PhotoBackdropProps {
  image: BackdropImage;
  heightClass?: string;
  scrim?: keyof typeof SCRIM;
  /** Drift magnitude, forwarded to ParallaxImage. */
  amount?: number;
  priority?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PhotoBackdrop({
  image,
  heightClass = "h-[52vh] md:h-[60vh]",
  scrim = "gradient",
  amount = 0.1,
  priority = false,
  children,
  className,
}: PhotoBackdropProps) {
  return (
    <ParallaxImage
      image={image}
      heightClass={heightClass}
      amount={amount}
      priority={priority}
      className={className}
    >
      {scrim !== "none" && (
        <div aria-hidden className={cn("absolute inset-0", SCRIM[scrim])} />
      )}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="w-full max-w-3xl text-center text-background">
          {children}
        </div>
      </div>
    </ParallaxImage>
  );
}
