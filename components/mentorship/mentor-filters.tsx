"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { getIndustries, getAllExpertiseAreas } from "@/data/mentors";

interface MentorFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
}

export interface FilterState {
  search: string;
  industry: string;
  expertise: string[];
  experience: string;
  availability: string;
}

export function MentorFilters({ onFiltersChange, totalResults }: MentorFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    industry: "all",
    expertise: [],
    experience: "all",
    availability: "all",
  });

  const [expertiseOpen, setExpertiseOpen] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const removeExpertise = (skill: string) => {
    const newExpertise = filters.expertise.filter(e => e !== skill);
    updateFilter("expertise", newExpertise);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      industry: "all",
      expertise: [],
      experience: "all",
      availability: "all",
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = filters.search || filters.industry !== "all" || 
    filters.expertise.length > 0 || filters.experience !== "all" || 
    filters.availability !== "all";

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray" />
        <Input
          placeholder="Search mentors by name, role, or expertise..."
          className="pl-10 pr-4 h-12 text-base border-gray/30 focus:border-purple-dark"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filters.industry} onValueChange={(value) => updateFilter("industry", value)}>
          <SelectTrigger className="w-full sm:w-48 border-gray/30">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {getIndustries().map(industry => (
              <SelectItem key={industry} value={industry}>{industry}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={expertiseOpen} onOpenChange={setExpertiseOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-48 justify-between border-gray/30">
              <span className="truncate">
                {filters.expertise.length === 0 ? "Expertise" : `${filters.expertise.length} selected`}
              </span>
              <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search expertise..." />
              <CommandList>
                <CommandEmpty>No expertise found.</CommandEmpty>
                <CommandGroup>
                  {getAllExpertiseAreas().map(expertise => {
                    const isSelected = filters.expertise.includes(expertise);
                    return (
                      <CommandItem
                        key={expertise}
                        onSelect={() => {
                          if (isSelected) {
                            removeExpertise(expertise);
                          } else {
                            updateFilter("expertise", [...filters.expertise, expertise]);
                          }
                        }}
                      >
                        <div className={`mr-2 h-4 w-4 border rounded ${isSelected ? 'bg-purple-dark border-purple-dark' : 'border-gray'}`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                        {expertise}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Select value={filters.experience} onValueChange={(value) => updateFilter("experience", value)}>
          <SelectTrigger className="w-full sm:w-48 border-gray/30">
            <SelectValue placeholder="Experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Experience</SelectItem>
            <SelectItem value="0-5">0-5 years</SelectItem>
            <SelectItem value="5-10">5-10 years</SelectItem>
            <SelectItem value="10-15">10-15 years</SelectItem>
            <SelectItem value="15+">15+ years</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.availability} onValueChange={(value) => updateFilter("availability", value)}>
          <SelectTrigger className="w-full sm:w-48 border-gray/30">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Availability</SelectItem>
            <SelectItem value="available">Available Now</SelectItem>
            <SelectItem value="busy">Limited Availability</SelectItem>
            <SelectItem value="unavailable">Not Available</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray hover:text-navy-dark"
          >
            Clear filters
            <X className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {filters.expertise.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.expertise.map(skill => (
            <Badge
              key={skill}
              variant="secondary"
              className="bg-purple-light text-purple-dark cursor-pointer hover:bg-purple-mid hover:text-white transition-colors"
              onClick={() => removeExpertise(skill)}
            >
              {skill}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <p className="text-gray">
          Showing <span className="font-semibold text-navy-dark">{totalResults}</span> mentors
        </p>
        <div className="flex items-center gap-1 text-gray">
          <Filter className="h-4 w-4" />
          <span>Filters applied</span>
        </div>
      </div>
    </div>
  );
}