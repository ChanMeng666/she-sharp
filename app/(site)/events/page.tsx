"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, X, Calendar, MapPin, Tag, Clock } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { EventInflectedCard } from "@/components/events/event-inflected-card";
import { EventList } from "@/components/events/event-list";
import { FeaturedEventHero } from "@/components/events/featured-event-hero";
import {
  getAllEvents,
  getFeaturedEvent,
  parseDateString,
  isFutureDate,
} from "@/lib/data/events";
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

export default function EventsPage() {
  const featuredEvent = getFeaturedEvent();
  const allEvents = getAllEvents();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);

  // Pagination state
  const [displayedCount, setDisplayedCount] = useState(6);
  const EVENTS_PER_PAGE = 6;

  // Extract available years from events
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allEvents.forEach((event) => {
      const year = parseDateString(event.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allEvents]);

  // Extract available categories from events
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    allEvents.forEach((event) => {
      const category = event.detailPageData.category;
      if (category && category.length > 0) {
        categories.add(category);
      }
    });
    return Array.from(categories).sort();
  }, [allEvents]);

  // Extract available cities from events
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    allEvents.forEach((event) => {
      const city = event.detailPageData.location?.city;
      if (city && city.length > 0) {
        cities.add(city);
      }
    });
    return Array.from(cities).sort();
  }, [allEvents]);

  // Filter events based on all criteria, then sort by date (newest first)
  const filteredEvents = useMemo(() => {
    const filtered = allEvents.filter((event) => {
      // Search filter - title and shortDescription
      const matchesSearch =
        searchQuery === "" ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.shortDescription
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      // Year filter
      const eventYear = parseDateString(event.date).getFullYear();
      const matchesYear =
        selectedYears.length === 0 || selectedYears.includes(eventYear);

      // Category filter
      const eventCategory = event.detailPageData.category || "";
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(eventCategory);

      // City filter
      const eventCity = event.detailPageData.location?.city || "";
      const matchesCity =
        selectedCities.length === 0 || selectedCities.includes(eventCity);

      // Status filter (upcoming only) - based on date
      const isUpcoming = isFutureDate(event.date);
      const matchesStatus = !showUpcomingOnly || isUpcoming;

      return (
        matchesSearch &&
        matchesYear &&
        matchesCategory &&
        matchesCity &&
        matchesStatus
      );
    });

    return filtered.sort(
      (a, b) =>
        parseDateString(b.date).getTime() - parseDateString(a.date).getTime()
    );
  }, [
    allEvents,
    searchQuery,
    selectedYears,
    selectedCategories,
    selectedCities,
    showUpcomingOnly,
  ]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(EVENTS_PER_PAGE);
  }, [
    searchQuery,
    selectedYears,
    selectedCategories,
    selectedCities,
    showUpcomingOnly,
  ]);

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
  const activeFilterCount =
    selectedYears.length +
    selectedCategories.length +
    selectedCities.length +
    (showUpcomingOnly ? 1 : 0);

  // Toggle year selection
  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
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

  // Format category label
  const formatCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className="min-h-screen mb-24">
      {/* Hero Section - Featured event with fallback image */}
      <FeaturedEventHero event={featuredEvent} />

      {/* All Events Section */}
      <Section spacing="section">
        <Container size="full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                All Events
              </h2>
              <p className="text-muted-foreground text-lg mt-4">
                Discover our workshops, networking events, conferences and more
              </p>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="space-y-4 mb-8">
            {/* Search Bar and Filter Buttons - Same row on md+, two rows on smaller screens */}
            <div className="flex flex-col md:flex-row gap-16 md:items-center">
              {/* Search Bar */}
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

              {/* Filter Buttons Row */}
              <div className="flex flex-wrap gap-2">
                {/* Upcoming Only Toggle */}
                <Button
                  variant={showUpcomingOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}
                  className="h-9"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Upcoming Only
                </Button>

                {/* Category Filter */}
                {availableCategories.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <Tag className="h-4 w-4 mr-1" />
                        Category
                        {selectedCategories.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-2 h-5 px-1.5"
                          >
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
                          {formatCategoryLabel(category)}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

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
                {availableCities.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <MapPin className="h-4 w-4 mr-1" />
                        City
                        {selectedCities.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-2 h-5 px-1.5"
                          >
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
                )}

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

            {/* Results Count - Separate row */}
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} of {allEvents.length} events
              </span>
            </div>

            {/* Active Filters Display - Separate row if filters are active */}
            {(selectedCategories.length > 0 ||
              selectedYears.length > 0 ||
              selectedCities.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="gap-1">
                    {formatCategoryLabel(category)}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedYears.map((year) => (
                  <Badge key={year} variant="secondary" className="gap-1">
                    {year}
                    <button
                      onClick={() => toggleYear(year)}
                      className="hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedCities.map((city) => (
                  <Badge key={city} variant="secondary" className="gap-1">
                    {city}
                    <button
                      onClick={() => toggleCity(city)}
                      className="hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
