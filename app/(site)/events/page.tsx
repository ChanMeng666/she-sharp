"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, X, Calendar, MapPin, Tag, Clock } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { EventInflectedCard } from "@/components/events/event-inflected-card";
import { EventList } from "@/components/events/event-list";
import { getAllEvents, getFeaturedEvent, Event } from "@/lib/data/events";
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
import { EVENT_CATEGORIES, EventCategory } from "@/types/event";

// Category display names
const CATEGORY_LABELS: Record<EventCategory, string> = {
  workshop: "Workshop",
  networking: "Networking",
  training: "Training",
  social: "Social",
  thrive: "THRIVE",
  conference: "Conference",
  webinar: "Webinar",
  meetup: "Meetup",
  panel: "Panel",
};

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
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);

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
    return Array.from(years).sort((a, b) => b - a);
  }, [allEvents]);

  // Extract available categories from events
  const availableCategories = useMemo(() => {
    const categories = new Set<EventCategory>();
    allEvents.forEach((event) => {
      categories.add(event.category);
    });
    return Array.from(categories).sort();
  }, [allEvents]);

  // Extract available cities from events
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    allEvents.forEach((event) => {
      if (event.location?.city) {
        cities.add(event.location.city);
      }
    });
    return Array.from(cities).sort();
  }, [allEvents]);

  // Filter events based on all criteria
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // Search filter - title and shortDescription
      const matchesSearch =
        searchQuery === "" ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      // Year filter
      const eventYear = new Date(event.startDate).getFullYear();
      const matchesYear = selectedYears.length === 0 || selectedYears.includes(eventYear);

      // Category filter
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category);

      // City filter
      const matchesCity = selectedCities.length === 0 ||
        (event.location?.city && selectedCities.includes(event.location.city));

      // Status filter (upcoming only)
      const matchesStatus = !showUpcomingOnly || event.status === "upcoming";

      return matchesSearch && matchesYear && matchesCategory && matchesCity && matchesStatus;
    });
  }, [allEvents, searchQuery, selectedYears, selectedCategories, selectedCities, showUpcomingOnly]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(EVENTS_PER_PAGE);
  }, [searchQuery, selectedYears, selectedCategories, selectedCities, showUpcomingOnly]);

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
  const activeFilterCount = selectedYears.length + selectedCategories.length + selectedCities.length + (showUpcomingOnly ? 1 : 0);

  // Toggle year selection
  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Toggle category selection
  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  // Toggle city selection
  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedYears([]);
    setSelectedCategories([]);
    setSelectedCities([]);
    setShowUpcomingOnly(false);
    setSearchQuery("");
  };

  // Check if any filters are active
  const hasActiveFilters = activeFilterCount > 0 || searchQuery !== "";

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
          <div className="space-y-4 mb-8">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search events by title or description..."
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
            </div>

            {/* Filter Buttons Row */}
            <div className="flex flex-wrap gap-2">
              {/* Upcoming Only Toggle */}
              <Button
                variant={showUpcomingOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}
                className="h-9"
              >
                <Clock className="h-4 w-4 mr-2" />
                Upcoming Only
              </Button>

              {/* Category Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Tag className="h-4 w-4 mr-2" />
                    Category
                    {selectedCategories.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {selectedCategories.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Event Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableCategories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    >
                      {CATEGORY_LABELS[category]}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Year Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Calendar className="h-4 w-4 mr-2" />
                    Year
                    {selectedYears.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {selectedYears.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Event Year</DropdownMenuLabel>
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

              {/* City Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <MapPin className="h-4 w-4 mr-2" />
                    City
                    {selectedCities.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {selectedCities.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Event City</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableCities.map((city) => (
                    <DropdownMenuCheckboxItem
                      key={city}
                      checked={selectedCities.includes(city)}
                      onCheckedChange={() => toggleCity(city)}
                    >
                      {city}
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

            {/* Active Filters Display & Results Count */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} of {allEvents.length} events
              </span>
              {(selectedCategories.length > 0 || selectedYears.length > 0 || selectedCities.length > 0) && (
                <>
                  <span className="text-muted-foreground">•</span>
                  {selectedCategories.map((category) => (
                    <Badge key={category} variant="secondary" className="gap-1">
                      {CATEGORY_LABELS[category]}
                      <button onClick={() => toggleCategory(category)} className="hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedYears.map((year) => (
                    <Badge key={year} variant="secondary" className="gap-1">
                      {year}
                      <button onClick={() => toggleYear(year)} className="hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedCities.map((city) => (
                    <Badge key={city} variant="secondary" className="gap-1">
                      {city}
                      <button onClick={() => toggleCity(city)} className="hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </>
              )}
            </div>
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
