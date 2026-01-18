"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, Filter } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { EventInflectedCard } from "@/components/events/event-inflected-card";
import { EventList } from "@/components/events/event-list";
import { getAllEvents, getFeaturedEvent, Event } from "@/lib/data/events";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Sample hero image
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80";

function HeroButtons({ slug }: { slug: string }) {
  const [isHovered, setIsHovered] = useState<"details" | "register" | null>(
    null
  );

  return (
    <div className="flex gap-3">
      <Link
        href={`/events/${slug}`}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300"
        style={{
          backgroundColor: isHovered === "details" ? "#333333" : "#000000",
          color: "#ffffff",
        }}
        onMouseEnter={() => setIsHovered("details")}
        onMouseLeave={() => setIsHovered(null)}
      >
        View Details
        <ArrowRight className="w-5 h-5" />
      </Link>
      <Link
        href={`/events/${slug}`}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 border-2"
        style={{
          backgroundColor: isHovered === "register" ? "#000000" : "transparent",
          color: isHovered === "register" ? "#ffffff" : "#000000",
          borderColor: "#000000",
        }}
        onMouseEnter={() => setIsHovered("register")}
        onMouseLeave={() => setIsHovered(null)}
      >
        Register Now
      </Link>
    </div>
  );
}

export default function EventsPage() {
  const featuredEvent = getFeaturedEvent();
  const allEvents = getAllEvents();
  const [isImageHovered, setIsImageHovered] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // Pagination state
  const [displayedCount, setDisplayedCount] = useState(6);
  const EVENTS_PER_PAGE = 6;

  // Extract available years from events
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allEvents.forEach((event) => {
      const year = new Date(event.startDate).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
  }, [allEvents]);

  // Filter events based on search query and selected years
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // Search filter - case-insensitive title match
      const matchesSearch =
        searchQuery === "" ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase());

      // Year filter - check if event year is in selectedYears array
      const eventYear = new Date(event.startDate).getFullYear();
      const matchesYear = selectedYears.length === 0 || selectedYears.includes(eventYear);

      return matchesSearch && matchesYear;
    });
  }, [allEvents, searchQuery, selectedYears]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(EVENTS_PER_PAGE);
  }, [searchQuery, selectedYears]);

  // Get events to display (paginated)
  const displayedEvents = useMemo(() => {
    return filteredEvents.slice(0, displayedCount);
  }, [filteredEvents, displayedCount]);

  // Check if there are more events to load
  const hasMoreEvents = displayedCount < filteredEvents.length;

  // Load more events handler
  const handleLoadMore = () => {
    setDisplayedCount((prev) => prev + EVENTS_PER_PAGE);
  };

  // Count active filters
  const activeFilterCount = selectedYears.length;

  // Toggle year selection
  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Clear all year filters
  const clearAllYears = () => {
    setSelectedYears([]);
  };

  return (
    <div className="min-h-screen mb-24">
      {/* Hero Section - Full width image with InflectedCard style */}
      {featuredEvent && (
        <Section spacing="section">
          <Container size="full">
            <div
              className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden mt-12"
            >
              {/* Image */}
              <div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                onMouseEnter={() => setIsImageHovered(true)}
                onMouseLeave={() => setIsImageHovered(false)}
              >
                <Image
                  src={HERO_IMAGE}
                  alt={featuredEvent.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover transition-transform duration-300"
                  style={{
                    transform: isImageHovered ? "scale(1.05)" : "scale(1)",
                  }}
                />
              </div>

              {/* title in bottom left */}
              <div className="absolute bottom-0 left-0 w-1/2 md:w-2/5 p-6">
                <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl px-6 py-4 md:px-8 md:py-6 shadow-lg h-full flex items-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                    {featuredEvent.title}
                  </h3>
                </div>
              </div>

              {/* Buttons container with curved corner effect */}
              <div
                className="absolute bottom-0 right-0 pt-8 pl-8 rounded-tl-[3rem]"
                style={{ backgroundColor: "#eee" }}
              >
                <div
                  className="absolute bottom-0 -left-8 w-8 h-8 bg-transparent"
                  style={{
                    borderBottomRightRadius: "2rem",
                    boxShadow: "0.5rem 0.5rem 0 0.5rem #eee",
                  }}
                />
                <div
                  className="absolute -top-8 right-0 w-8 h-8 bg-transparent"
                  style={{
                    borderBottomRightRadius: "2rem",
                    boxShadow: "0.5rem 0.5rem 0 0.5rem #eee",
                  }}
                />

                {/* Buttons */}
                <div className="pb-6 pr-6">
                  <HeroButtons slug={featuredEvent.slug} />
                </div>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* All Events Section */}
      <Section spacing="section">
        <Container size="full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                All Events
              </h2>
              <p className="text-muted-foreground mt-1">
                Discover our workshops, networking events, conferences and more
              </p>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search events by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-0 border-b border-gray-400 rounded-none focus-visible:ring-0 focus-visible:border-gray-900"
              />
            </div>

            {/* Filter Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-brand-foreground text-xs font-medium">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={clearAllYears}>
                  Clear all
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableYears.map((year) => (
                  <DropdownMenuCheckboxItem
                    key={year}
                    checked={selectedYears.includes(year)}
                    onCheckedChange={() => toggleYear(year)}
                    className="[&>span:first-child]:border [&>span:first-child]:border-border [&>span:first-child]:rounded [&>span:first-child]:size-4 [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:justify-center"
                  >
                    {year}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Events Grid with Inflected Cards */}
          <EventList
            events={displayedEvents}
            columns={3}
            emptyMessage="No events found. Try adjusting your search or filters."
            renderCard={(event, index) => (
              <EventInflectedCard
                key={event.slug}
                event={event}
                index={index}
              />
            )}
          />

          {/* Load More Button */}
          {hasMoreEvents && (
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
    </div>
  );
}
