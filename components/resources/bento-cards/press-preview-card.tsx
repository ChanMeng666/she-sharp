"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { newsPressItems } from "@/lib/data/news-press";

/**
 * Highlight card for "In the Press" on the resources bento grid.
 * Uses the most recent news item as the background.
 */
export function PressHighlightCard() {
  const featured = newsPressItems[0];

  return (
    <Link href="/resources/in-the-press" className="block h-full group">
      <Card className="relative h-full w-full min-h-[200px] sm:min-h-[240px] md:min-h-[280px] overflow-hidden border-0 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 rounded-[var(--radius-card-sm)] md:rounded-[var(--radius-card-md)] lg:rounded-[var(--radius-card-lg)] bg-black">
        {/* Background image */}
        {featured && (
          <img
            src={featured.coverImage}
            alt={featured.title}
            className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

        {/* Badge */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-5 md:top-6 md:left-6 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-900">
            <Newspaper className="h-3.5 w-3.5" />
            In the Press
          </span>
        </div>

        {/* Content */}
        <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5 md:inset-x-6 md:bottom-6 z-10 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white leading-snug line-clamp-2">
             News & Press Coverage
            </h3>
            <p className="mt-2 text-sm md:text-base text-white/80 line-clamp-2">
              Explore media features and awards celebrating the She Sharp community
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-gray-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
