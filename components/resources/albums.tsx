"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, X, Calendar } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { galleryAlbums } from "@/lib/data/gallery-albums";
import { AlbumCard } from "./bento-cards";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

// Helper to extract year from date string (e.g., "November 2024" -> 2024)
const extractYear = (dateString: string): number | null => {
  const match = dateString.match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1], 10) : null;
};

const ALBUMS_PER_PAGE = 9;

export function GalleryAlbumsGrid() {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // Pagination state
  const [displayedCount, setDisplayedCount] = useState(ALBUMS_PER_PAGE);

  // Extract available years from albums
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    galleryAlbums.forEach((album) => {
      const year = extractYear(album.date);
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, []);

  // Filter albums based on all criteria
  const filteredAlbums = useMemo(() => {
    return galleryAlbums.filter((album) => {
      // Search filter - title
      const matchesSearch =
        searchQuery === "" ||
        album.title.toLowerCase().includes(searchQuery.toLowerCase());

      // Year filter
      const albumYear = extractYear(album.date);
      const matchesYear =
        selectedYears.length === 0 || (albumYear && selectedYears.includes(albumYear));

      return matchesSearch && matchesYear;
    });
  }, [searchQuery, selectedYears]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(ALBUMS_PER_PAGE);
  }, [searchQuery, selectedYears]);

  // Get albums to display (paginated)
  const displayedAlbums = useMemo(() => {
    return filteredAlbums.slice(0, displayedCount);
  }, [filteredAlbums, displayedCount]);

  // Check if there are more albums to load
  const hasMoreAlbums = displayedCount < filteredAlbums.length;

  // Load more albums handler
  const handleLoadMore = () => {
    setDisplayedCount((prev) => prev + ALBUMS_PER_PAGE);
  };

  // Toggle year selection
  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedYears([]);
    setSearchQuery("");
  };

  // Check if any filters are active
  const hasActiveFilters = selectedYears.length > 0 || searchQuery !== "";

  return (
    <Section spacing="section" className="py-24 lg:py-36">
      <Container size="full">
        {/* Header */}
        <div className="mb-10 md:mb-14">
          <h1 className="text-display-sm">Photo Gallery</h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
            Explore highlights from She Sharp events, workshops, and community
            moments.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-16 md:items-center">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search albums by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 border-0 border-b border-gray-400 rounded-none focus-visible:ring-0 focus-visible:border-gray-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Year Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Calendar className="h-4 w-4 mr-1" />
                    Year
                    {selectedYears.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {selectedYears.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Album Year</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableYears.map((year) => (
                    <DropdownMenuCheckboxItem
                      key={year}
                      checked={selectedYears.includes(year)}
                      onCheckedChange={() => toggleYear(year)}
                    >
                      {year}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear All Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-9 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">
              Showing {displayedAlbums.length} of {filteredAlbums.length} albums
              {filteredAlbums.length !== galleryAlbums.length && (
                <span> (filtered from {galleryAlbums.length} total)</span>
              )}
            </span>
          </div>

          {/* Active Filters Display */}
          {selectedYears.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedYears.map((year) => (
                <Badge key={year} variant="secondary" className="gap-1">
                  {year}
                  <button onClick={() => toggleYear(year)} className="hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Albums Grid */}
        {displayedAlbums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {displayedAlbums.map((album) => (
              <AlbumCard key={album.googlePhotosUrl} album={album} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              No albums found. Try adjusting your search or filters.
            </p>
          </div>
        )}

        {/* Load More Button */}
        {hasMoreAlbums && (
          <div className="flex justify-center mt-16">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              className="h-12 px-8 text-base"
            >
              Load More
            </Button>
          </div>
        )}
      </Container>
    </Section>
  );
}
