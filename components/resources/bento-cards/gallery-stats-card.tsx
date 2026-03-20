"use client";

import { Card } from "@/components/ui/card";
import { FolderOpen, Images, ArrowRight } from "lucide-react";

interface GalleryStats {
  totalAlbums: number;
  totalPhotos: number;
  categories: number;
  featuredAlbums: number;
}

interface GalleryStatsCardProps {
  stats: GalleryStats;
}

/**
 * Gallery statistics card for the statistic slot.
 * Displays key metrics about the photo gallery.
 */
export function GalleryStatsCard({ stats }: GalleryStatsCardProps) {
  return (
    <Card className="flex h-full flex-col justify-between bg-linear-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 p-4 sm:p-5 md:p-6 lg:p-8 border-purple-200/50 dark:border-purple-800/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 rounded-[var(--radius-card-sm)] md:rounded-[var(--radius-card-md)] lg:rounded-[var(--radius-card-lg)] overflow-hidden">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-dark/10 rounded-xl">
            <Images className="h-5 w-5 text-purple-dark" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Gallery Stats</h3>
        </div>

        {/* Stats Grid */}
        <div className="space-y-4">
          {/* Albums Stat */}
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white dark:bg-white/10 rounded-lg shadow-sm">
              <FolderOpen className="h-5 w-5 text-purple-dark" />
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-dark">{stats.totalAlbums}</p>
              <p className="text-sm text-muted-foreground">Photo Albums</p>
            </div>
          </div>

          {/* Photos Stat */}
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white dark:bg-white/10 rounded-lg shadow-sm">
              <Images className="h-5 w-5 text-purple-mid" />
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-mid">{stats.totalPhotos}+</p>
              <p className="text-sm text-muted-foreground">Photos</p>
            </div>
          </div>

          {/* Featured Stat */}
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white dark:bg-white/10 rounded-lg shadow-sm">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.featuredAlbums}</p>
              <p className="text-sm text-muted-foreground">Featured</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 pt-4 border-t border-purple-200/50 dark:border-purple-800/50">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-purple-dark hover:text-purple-mid transition-colors cursor-pointer">
          Explore Gallery
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}
