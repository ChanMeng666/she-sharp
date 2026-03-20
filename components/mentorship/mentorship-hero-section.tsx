"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface MentorshipHeroSectionProps {
  topLeftTitle: string | ReactNode;
  topLeftBgColor?: string;
  topLeftTextColor?: string;
  topRightImage?: string;
  topRightImageAlt?: string;
  bottomLeftContent?: ReactNode;
  bottomLeftVideo?: string;
  bottomRightTitle: string;
  bottomRightTitleHighlight?: string;
  bottomRightDescription: string;
  bottomRightBgColor?: string;
}

export function MentorshipHeroSection({
  topLeftTitle,
  topLeftBgColor = "bg-navy",
  topLeftTextColor = "text-white",
  topRightImage,
  topRightImageAlt = "Mentorship programme image",
  bottomLeftContent,
  bottomLeftVideo,
  bottomRightTitle,
  bottomRightTitleHighlight,
  bottomRightDescription,
  bottomRightBgColor = "bg-white",
}: MentorshipHeroSectionProps) {
  return (
    <section className="w-full bg-background pt-20 md:pt-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 w-full">
        {/* Top Left: Customizable Background with Text */}
        <div className={`${topLeftBgColor} ${topLeftTextColor} flex items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 min-h-[200px] sm:min-h-[280px] md:min-h-[400px] lg:min-h-[500px]`}>
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight leading-tight">
              {typeof topLeftTitle === 'string' ? (
                topLeftTitle.split('\n').map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))
              ) : (
                topLeftTitle
              )}
            </h1>
          </div>
        </div>

        {/* Top Right: Group Photo */}
        {topRightImage && (
          <div className="relative min-h-[280px] sm:min-h-[350px] md:min-h-[500px] overflow-hidden">
            <Image
              src={topRightImage}
              alt={topRightImageAlt}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}

        {/* Bottom Left: Video or Custom Content */}
        <div className="relative min-h-[280px] sm:min-h-[350px] md:min-h-[500px] overflow-hidden bg-muted flex items-center justify-center">
          {bottomLeftVideo ? (
            <video
              src={bottomLeftVideo}
              className="object-cover w-full h-full"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            bottomLeftContent
          )}
        </div>

        {/* Bottom Right: White Background with Text */}
        <div className={`${bottomRightBgColor} text-foreground flex items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 min-h-[200px] sm:min-h-[280px] md:min-h-[400px] lg:min-h-[500px]`}>
          <div className="max-w-lg">
            <h2 className="text-display-sm text-navy mb-6 leading-tight">
              {bottomRightTitle}
              {bottomRightTitleHighlight && (
                <>
                  <br />
                  <span className="text-brand">{bottomRightTitleHighlight}</span>
                </>
              )}
            </h2>
            <p className="text-md text-muted-foreground leading-relaxed">
              {bottomRightDescription}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
