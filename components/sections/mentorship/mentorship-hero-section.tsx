"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface MentorshipHeroSectionProps {
  topLeftTitle: string | ReactNode;
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
  topRightImage,
  topRightImageAlt = "Mentorship program image",
  bottomLeftContent,
  bottomLeftVideo,
  bottomRightTitle,
  bottomRightTitleHighlight,
  bottomRightDescription,
  bottomRightBgColor = "bg-white",
}: MentorshipHeroSectionProps) {
  return (
    <section className="w-full bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 w-full">
        {/* Top Left: Dark Blue Background with Text */}
        <div className="bg-navy text-white flex items-center justify-center p-8 md:p-12 lg:p-16 min-h-[400px] md:min-h-[500px]">
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight leading-tight">
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
          <div className="relative min-h-[400px] md:min-h-[500px] overflow-hidden">
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
        <div className="relative min-h-[400px] md:min-h-[500px] overflow-hidden bg-muted flex items-center justify-center">
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
        <div className={`${bottomRightBgColor} text-foreground flex items-center justify-center p-8 md:p-12 lg:p-16 min-h-[400px] md:min-h-[500px]`}>
          <div className="max-w-lg">
            <h2 className="text-3xl md:text-3xl lg:text-4xl font-bold text-navy mb-6 leading-tight">
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
