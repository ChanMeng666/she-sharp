'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Filter, Star, Clock, Users, MapPin, Briefcase, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Mentor {
  id: number;
  userId: number;
  name: string;
  email: string;
  image?: string;
  expertiseAreas: string[];
  yearsExperience: number;
  currentRole?: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  availabilityHoursPerMonth: number;
  currentMenteesCount: number;
  maxMentees: number;
  totalSessionsGiven: number;
  averageRating?: number;
  isAcceptingMentees: boolean;
  verifiedAt?: string;
}

function MentorsContent() {
  const searchParams = useSearchParams();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchMentors();
  }, [page, experienceFilter, availabilityFilter]);

  const fetchMentors = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '12');
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (experienceFilter !== 'all') {
        const [min, max] = experienceFilter.split('-');
        if (min) params.append('minExperience', min);
        if (max) params.append('maxExperience', max);
      }
      
      if (availabilityFilter === 'accepting') {
        params.append('isAccepting', 'true');
      }

      const response = await fetch(`/api/mentors?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMentors(data.mentors);
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchMentors();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderRating = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Find Your Mentor</h1>
        <p className="text-lg text-muted-foreground">
          Connect with experienced professionals who can guide your career journey
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, role, company, or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="flex gap-4 flex-wrap">
          <Select value={experienceFilter} onValueChange={setExperienceFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Experience Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Experience</SelectItem>
              <SelectItem value="0-2">0-2 years</SelectItem>
              <SelectItem value="3-5">3-5 years</SelectItem>
              <SelectItem value="6-10">6-10 years</SelectItem>
              <SelectItem value="11-">10+ years</SelectItem>
            </SelectContent>
          </Select>

          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mentors</SelectItem>
              <SelectItem value="accepting">Accepting Mentees</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mentors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No mentors found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="hover:shadow-lg transition-shadow h-full overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={mentor.image} />
                    <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                  </Avatar>
                  {mentor.verifiedAt && (
                    <Badge variant="secondary">
                      Verified
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{mentor.name}</CardTitle>
                {mentor.jobTitle && (
                  <CardDescription className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {mentor.jobTitle}
                    {mentor.company && ` at ${mentor.company}`}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Expertise Areas */}
                <div className="flex flex-wrap gap-2">
                  {mentor.expertiseAreas.slice(0, 3).map((area, i) => (
                    <Badge key={i} variant="outline">
                      {area}
                    </Badge>
                  ))}
                  {mentor.expertiseAreas.length > 3 && (
                    <Badge variant="outline">+{mentor.expertiseAreas.length - 3}</Badge>
                  )}
                </div>

                {/* Bio */}
                {mentor.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {mentor.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{mentor.yearsExperience}y exp</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{mentor.availabilityHoursPerMonth}h/mo</span>
                    </div>
                  </div>
                  {renderRating(mentor.averageRating)}
                </div>

                {/* Availability Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    <span>
                      {mentor.currentMenteesCount}/{mentor.maxMentees} mentees
                    </span>
                  </div>
                  {mentor.isAcceptingMentees ? (
                    <Badge variant="secondary">
                      Accepting
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Full</Badge>
                  )}
                </div>

                <Link href={`/dashboard/mentors/${mentor.id}`} className="block w-full pt-4">
                  <Button className="w-full" variant={mentor.isAcceptingMentees ? 'default' : 'outline'}>
                    View Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && mentors.length > 0 && (
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MentorsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-32 mt-2" />
                <Skeleton className="h-4 w-24 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <MentorsContent />
    </Suspense>
  );
}