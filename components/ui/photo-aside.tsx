import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * PhotoAside — an existing text block, with one photograph set beside it.
 *
 * For the stretches of the site that are three columns of prose or a numbered
 * list and nothing else: "What we stand for", "How it works", the programme
 * rows on the home page. Those sections do not want a band of twelve
 * photographs, they want one, held at a size where a face is readable.
 *
 * NO `"use client"`, DELIBERATELY, and no hooks or handlers so it can stay that
 * way. Half its callers are server components (`/about` sub-sections rendered
 * from a server page) and half are already client (`ValuesSection`,
 * `HowItWorksSection`). A component with no directive is compiled into whichever
 * graph imports it: the server pages pay no client JavaScript for it, and the
 * client sections absorb it into a boundary they already have. Marking it either
 * way would close one of those doors.
 *
 * Crop-mark corners match `join-team-hero-section.tsx`, which is where the
 * editorial system's photo framing is established.
 */

export interface PhotoAsideImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

const ASPECT = {
  "4/5": "aspect-[4/5]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "3/4": "aspect-[3/4]",
} as const;

export interface PhotoAsideProps {
  image: PhotoAsideImage;
  /** Which side the photograph sits on at `md` and up. */
  side?: "left" | "right";
  aspect?: keyof typeof ASPECT;
  /** One line under the photograph. */
  caption?: string;
  children: React.ReactNode;
  className?: string;
}

export function PhotoAside({
  image,
  side = "right",
  aspect = "4/5",
  caption,
  children,
  className,
}: PhotoAsideProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-10 md:grid-cols-12 md:gap-14",
        className
      )}
    >
      <div
        className={cn(
          "md:col-span-7",
          side === "left" ? "md:order-2" : "md:order-1"
        )}
      >
        {children}
      </div>

      <div
        className={cn(
          "md:col-span-5",
          side === "left" ? "md:order-1" : "md:order-2"
        )}
      >
        <figure className="relative">
          {/* Hairline crop marks extending past the frame corners. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -left-2 -top-2 h-6 w-6 border-l border-t border-ink-300"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-2 -top-2 h-6 w-6 border-r border-t border-ink-300"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-2 -left-2 h-6 w-6 border-b border-l border-ink-300"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-2 -right-2 h-6 w-6 border-b border-r border-ink-300"
          />

          <div
            className={cn(
              "relative overflow-hidden rounded-[32px] border border-border bg-muted",
              ASPECT[aspect]
            )}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
          </div>

          {caption && (
            <figcaption className="mt-3 text-sm text-ink-600">
              {caption}
            </figcaption>
          )}
        </figure>
      </div>
    </div>
  );
}
