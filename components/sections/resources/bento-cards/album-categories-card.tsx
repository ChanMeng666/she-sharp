"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags, Plus } from "lucide-react";
import { ALBUM_CATEGORY_LABELS, type AlbumCategory } from "@/types/gallery";

const categoryColors: Record<AlbumCategory, { bg: string; text: string; border: string }> = {
  events: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
  },
  conferences: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
  },
  workshops: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-700",
  },
  networking: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
  },
  celebrations: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-300 dark:border-pink-700",
  },
};

/**
 * Album categories card for the featureTags slot.
 * Displays category badges for browsing albums.
 */
export function AlbumCategoriesCard() {
  const categories = Object.entries(ALBUM_CATEGORY_LABELS) as [AlbumCategory, string][];

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 rounded-[50px]">
      <CardContent className="flex h-full flex-col justify-center gap-4 p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Tags className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Browse by Category</span>
        </div>

        {/* Category Badges */}
        <div className="flex flex-wrap gap-2">
          {categories.map(([key, label]) => {
            const colors = categoryColors[key];
            return (
              <Badge
                key={key}
                variant="outline"
                className={`${colors.border} ${colors.text} hover:${colors.bg} transition-colors cursor-pointer py-1.5 px-3`}
              >
                {label}
                <Plus className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
