'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Filter, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventsFilterProps {
  onFilterChange: (filters: {
    type: string;
    month: string;
    location: string;
    search: string;
  }) => void;
  locations: string[];
}

export function EventsFilter({ onFilterChange, locations }: EventsFilterProps) {
  const [eventType, setEventType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const handleFilterChange = () => {
    onFilterChange({
      type: eventType,
      month: selectedMonth,
      location: selectedLocation,
      search: searchQuery
    });
  };

  const activeFiltersCount = [
    eventType !== 'all',
    selectedMonth !== 'all',
    selectedLocation !== 'all',
    searchQuery !== ''
  ].filter(Boolean).length;

  const clearFilters = () => {
    setEventType('all');
    setSelectedMonth('all');
    setSelectedLocation('all');
    setSearchQuery('');
    onFilterChange({
      type: 'all',
      month: 'all',
      location: 'all',
      search: ''
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40">
      <div className="p-4 space-y-4">
        {/* Event Type Tabs */}
        <Tabs value={eventType} onValueChange={(value) => {
          setEventType(value);
          handleFilterChange();
        }}>
          <TabsList className="grid w-full grid-cols-4 bg-muted text-muted-foreground p-1">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="in-person">In Person</TabsTrigger>
            <TabsTrigger value="online">Online</TabsTrigger>
            <TabsTrigger value="workshop">Workshops</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Month Filter */}
          <Select value={selectedMonth} onValueChange={(value) => {
            setSelectedMonth(value);
            handleFilterChange();
          }}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Location Filter */}
          <Select value={selectedLocation} onValueChange={(value) => {
            setSelectedLocation(value);
            handleFilterChange();
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search events..." 
                  value={searchQuery}
                  onValueChange={(value) => {
                    setSearchQuery(value);
                    handleFilterChange();
                  }}
                />
                <CommandEmpty>No events found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                  >
                    Clear search
                  </CommandItem>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Active Filters Badge */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="secondary" className="bg-periwinkle-light text-navy-dark">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Search Query Display */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Searching for:</span>
            <Badge variant="outline" className="gap-1">
              {searchQuery}
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleFilterChange();
                }}
                className="ml-1 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}