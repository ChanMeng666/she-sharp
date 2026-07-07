"use client";

import Image from "next/image";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MentorshipHeroSectionProps {
  /** Uppercase-tracking eyebrow for the title panel. */
  eyebrow: string;
  /** Sentence-case poster title (top-left panel). */
  title: ReactNode;
  /** Render the title panel as a navy band (used on the mentee page). */
  titlePanelDark?: boolean;
  image: string;
  imageAlt?: string;
  video: string;
  videoPoster?: string;
  detailEyebrow: string;
  detailTitle: string;
  /** Optional brand-accented tail appended under the detail title. */
  detailTitleHighlight?: string;
  detailDescription: string;
}

const PANEL_MIN =
  "min-h-[220px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-[400px]";

/**
 * MentorshipHeroSection — editorial 2×2 quadrant hero shared by the hub,
 * mentor, and mentee pages. Two text panels (poster title + intro) sit
 * diagonally opposite two media panels (photo + autoplay video), each framed
 * with a 32px hairline. No colored text panels except the optional navy
 * title band on the mentee page.
 */
export function MentorshipHeroSection({
  eyebrow,
  title,
  titlePanelDark = false,
  image,
  imageAlt = "She Sharp mentorship programme",
  video,
  videoPoster,
  detailEyebrow,
  detailTitle,
  detailTitleHighlight,
  detailDescription,
}: MentorshipHeroSectionProps) {
  return (
    <section className="w-full bg-muted pt-24 md:pt-28 pb-12 md:pb-16">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Top-left: poster title panel */}
          <div
            className={cn(
              "flex flex-col justify-center rounded-[32px] border p-8 sm:p-10 lg:p-14",
              PANEL_MIN,
              titlePanelDark
                ? "bg-foreground text-background border-transparent"
                : "bg-white text-foreground border-border"
            )}
          >
            <span
              className={cn(
                "text-label mb-5",
                titlePanelDark ? "text-mint" : "text-brand"
              )}
            >
              {eyebrow}
            </span>
            <h1 className="text-display-sm leading-tight">{title}</h1>
          </div>

          {/* Top-right: group photo */}
          <div
            className={cn(
              "relative overflow-hidden rounded-[32px] border border-border bg-white",
              PANEL_MIN
            )}
          >
            <Image
              src={image}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Bottom-left: autoplay video */}
          <div
            className={cn(
              "relative overflow-hidden rounded-[32px] border border-border bg-muted",
              PANEL_MIN
            )}
          >
            <video
              src={video}
              poster={videoPoster}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>

          {/* Bottom-right: intro text panel */}
          <div
            className={cn(
              "flex flex-col justify-center rounded-[32px] border border-border bg-white p-8 sm:p-10 lg:p-14",
              PANEL_MIN
            )}
          >
            <span className="text-label text-brand mb-5">{detailEyebrow}</span>
            <h2 className="text-display-sm text-foreground mb-5 leading-tight">
              {detailTitle}
              {detailTitleHighlight && (
                <>
                  {" "}
                  <span className="text-brand">{detailTitleHighlight}</span>
                </>
              )}
            </h2>
            <p className="text-base md:text-lg text-ink-600 leading-relaxed">
              {detailDescription}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
