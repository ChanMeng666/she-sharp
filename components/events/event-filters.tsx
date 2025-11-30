'use client';

import { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventFormat, EventCategory, EVENT_CATEGORIES } from '@/types/event';
import { cn } from '@/lib/utils';

export interface EventFilters {
  format: EventFormat | 'all';
  category: EventCategory | 'all';
  search: string;
}

interface EventFiltersProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  showSearch?: boolean;
  showCategory?: boolean;
  className?: string;
}

export function EventFiltersBar({
  filters,
  onFiltersChange,
  showSearch = true,
  showCategory = false,
  className,
}: EventFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFormatChange = (format: EventFormat | 'all') => {
    onFiltersChange({ ...filters, format });
  };

  const handleCategoryChange = (category: EventCategory | 'all') => {
    onFiltersChange({ ...filters, category });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const clearFilters = () => {
    onFiltersChange({ format: 'all', category: 'all', search: '' });
  };

  const hasActiveFilters =
    filters.format !== 'all' || filters.category !== 'all' || filters.search;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Format Toggle Buttons */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'rounded-md px-4',
              filters.format === 'all' &&
                'bg-white shadow-sm text-purple-dark'
            )}
            onClick={() => handleFormatChange('all')}
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'rounded-md px-4',
              filters.format === 'in_person' &&
                'bg-white shadow-sm text-purple-dark'
            )}
            onClick={() => handleFormatChange('in_person')}
          >
            In Person
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'rounded-md px-4',
              filters.format === 'online' &&
                'bg-white shadow-sm text-purple-dark'
            )}
            onClick={() => handleFormatChange('online')}
          >
            Online
          </Button>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {filters.search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Category Select */}
        {showCategory && (
          <Select
            value={filters.category}
            onValueChange={(value) =>
              handleCategoryChange(value as EventCategory | 'all')
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat.replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* More Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
              {[
                filters.format !== 'all',
                filters.category !== 'all',
                filters.search,
              ].filter(Boolean).length}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter (if not shown above) */}
            {!showCategory && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Category
                </label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    handleCategoryChange(value as EventCategory | 'all')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat.replace(/-/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.format !== 'all' && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 capitalize"
            >
              {filters.format.replace(/_/g, ' ')}
              <button
                onClick={() => handleFormatChange('all')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.category !== 'all' && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 capitalize"
            >
              {filters.category.replace(/-/g, ' ')}
              <button
                onClick={() => handleCategoryChange('all')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.search && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1"
            >
              Search: {filters.search}
              <button
                onClick={() => handleSearchChange('')}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Simple format tabs for minimal UI
export function EventFormatTabs({
  value,
  onChange,
  className,
}: {
  value: EventFormat | 'all';
  onChange: (format: EventFormat | 'all') => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1 bg-gray-100 rounded-lg p-1', className)}>
      {(['all', 'in_person', 'online'] as const).map((format) => (
        <Button
          key={format}
          variant="ghost"
          size="sm"
          className={cn(
            'rounded-md px-4 capitalize',
            value === format && 'bg-white shadow-sm text-purple-dark'
          )}
          onClick={() => onChange(format)}
        >
          {format === 'all' ? 'All' : format === 'in_person' ? 'In Person' : 'Online'}
        </Button>
      ))}
    </div>
  );
}
