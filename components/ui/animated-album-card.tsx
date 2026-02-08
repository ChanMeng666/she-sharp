"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlbumStat {
  icon: React.ReactNode;
  label: string;
}

export interface AnimatedAlbumCardProps {
  title: string;
  images: string[];
  stats: AlbumStat[];
  description: string;
  href: string;
  className?: string;
}

export const AnimatedAlbumCard = React.forwardRef<
  HTMLAnchorElement,
  AnimatedAlbumCardProps
>(({ title, images, stats, description, href, className }, ref) => {
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative block w-full cursor-pointer rounded-2xl border bg-card p-6 text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg",
        className
      )}
      aria-label={`View ${title} album in Google Photos`}
    >
      <div className="flex flex-col">
        {/* Card Header: Title and Arrow */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight line-clamp-1">
            {title}
          </h2>
          <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
        </div>

        {/* Stacked Images with Hover Animation */}
        <div className="relative mb-6 h-28 sm:h-32">
          {images.slice(0, 3).map((src, index) => (
            <div
              key={index}
              className={cn(
                "absolute h-full w-[28%] overflow-hidden rounded-lg border-2 border-background shadow-md transition-all duration-300 ease-in-out",
                "group-hover:translate-x-[var(--tx)] group-hover:rotate-[var(--r)]"
              )}
              style={{
                transform: `translateX(${index * 20}px)`,
                // @ts-expect-error CSS custom properties
                '--tx': `${index * 34}%`,
                '--r': `${index * 3 - 3}deg`,
                zIndex: images.length - index,
              }}
            >
              <img
                src={src}
                alt={`${title} preview ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mb-4 flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center space-x-1.5">
              {stat.icon}
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </a>
  );
});

AnimatedAlbumCard.displayName = "AnimatedAlbumCard";
