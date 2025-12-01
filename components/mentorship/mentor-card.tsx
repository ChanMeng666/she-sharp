"use client";

import { Mentor } from "@/types/mentor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, Mail, Linkedin, Users, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface MentorCardProps {
  mentor: Mentor;
}

export function MentorCard({ mentor }: MentorCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 text-white';
      case 'busy':
        return 'bg-yellow-500 text-foreground';
      case 'unavailable':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Limited Availability';
      case 'unavailable':
        return 'Not Available';
      default:
        return 'Unknown';
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <HoverCard>
        <HoverCardTrigger asChild>
          <SheetTrigger asChild>
            <Card className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-gray/20">
              <div className="aspect-[3/4] relative overflow-hidden">
                <Image
                  src={mentor.image}
                  alt={mentor.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute top-3 right-3">
                  <Badge className={`${getAvailabilityColor(mentor.availability || 'unavailable')} font-medium`}>
                    {getAvailabilityText(mentor.availability || 'unavailable')}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-foreground/80 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="text-background">
                    <p className="text-sm font-medium mb-1">Click to view profile</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground text-lg line-clamp-1">{mentor.name}</h3>
                  <p className="text-sm text-foreground font-medium line-clamp-1">{mentor.role}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{mentor.company}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {mentor.expertise.slice(0, 2).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-muted text-foreground">
                        {skill}
                      </Badge>
                    ))}
                    {mentor.expertise.length > 2 && (
                      <Badge variant="secondary" className="text-xs bg-muted text-foreground">
                        +{mentor.expertise.length - 2}
                      </Badge>
                    )}
                  </div>
                  {mentor.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium">{mentor.rating}</span>
                      <span className="text-xs text-muted-foreground">({mentor.menteeCount} mentees)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </SheetTrigger>
        </HoverCardTrigger>
        <HoverCardContent className="w-80" align="center" side="top">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={mentor.image} />
                <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{mentor.name}</h4>
                <p className="text-sm text-foreground">{mentor.role}</p>
                <p className="text-xs text-muted-foreground">{mentor.company}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{mentor.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-foreground" />
                <span>{mentor.menteeCount} mentees</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-foreground" />
                <span>{mentor.yearsOfExperience}+ years</span>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>

      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="sr-only">{mentor.name} - Mentor Profile</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-32 h-32 relative rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={mentor.image}
                alt={mentor.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{mentor.name}</h2>
                <p className="text-lg text-foreground font-medium">{mentor.role}</p>
                <p className="text-muted-foreground">{mentor.company}</p>
              </div>
              <Badge className={`${getAvailabilityColor(mentor.availability || 'unavailable')} font-medium`}>
                {getAvailabilityText(mentor.availability || 'unavailable')}
              </Badge>
              {mentor.rating && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold text-lg">{mentor.rating}</span>
                  </div>
                  <span className="text-muted-foreground">from {mentor.menteeCount} mentees</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">About</h3>
              <p className="text-muted-foreground leading-relaxed">{mentor.description}</p>
              {mentor.bio && (
                <p className="text-muted-foreground leading-relaxed mt-2">{mentor.bio}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-muted text-foreground">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Industry</h4>
                <p className="font-medium text-foreground">{mentor.industry}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Experience</h4>
                <p className="font-medium text-foreground">{mentor.yearsOfExperience}+ years</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Languages</h4>
                <p className="font-medium text-foreground">{mentor.languages.join(', ')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Current Mentees</h4>
                <p className="font-medium text-foreground">{mentor.menteeCount}</p>
              </div>
            </div>

            {mentor.achievements && mentor.achievements.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Key Achievements</h3>
                <ul className="list-disc list-inside space-y-1">
                  {mentor.achievements.map((achievement, index) => (
                    <li key={index} className="text-muted-foreground">{achievement}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <h3 className="font-semibold text-foreground">Mentorship Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="text-foreground font-medium">
                    {mentor.availability === 'available' ? '3 slots available' : 
                     mentor.availability === 'busy' ? '1 slot available' : 'Fully booked'}
                  </span>
                </div>
                <Progress 
                  value={mentor.availability === 'available' ? 40 : 
                         mentor.availability === 'busy' ? 80 : 100} 
                  className="h-2"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {!userLoading && (
                user ? (
                  <Button
                    className="flex-1 bg-foreground hover:bg-foreground/90"
                    disabled={mentor.availability === 'unavailable'}
                    asChild
                  >
                    <Link href="/dashboard/mentorship">
                      Request Mentorship
                    </Link>
                  </Button>
                ) : (
                  <div className="flex-1 space-y-2">
                    <Button
                      className="w-full bg-foreground hover:bg-foreground/90"
                      asChild
                    >
                      <Link href="/sign-up">
                        Join to Request Mentorship
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Already have an account? <Link href="/sign-in" className="text-foreground hover:underline">Sign in</Link>
                    </p>
                  </div>
                )
              )}
              <Button variant="outline" size="icon" asChild>
                <a href={mentor.linkedIn} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
              {mentor.email && (
                <Button variant="outline" size="icon" asChild>
                  <a href={`mailto:${mentor.email}`}>
                    <Mail className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}