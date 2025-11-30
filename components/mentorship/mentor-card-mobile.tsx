"use client";

import { Mentor } from "@/types/mentor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, Mail, Linkedin, Users, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface MentorCardMobileProps {
  mentor: Mentor;
}

export function MentorCardMobile({ mentor }: MentorCardMobileProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild>
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
      </DrawerTrigger>

      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="sr-only">{mentor.name} - Mentor Profile</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-32 h-32 relative rounded-full overflow-hidden">
                <Image
                  src={mentor.image}
                  alt={mentor.name}
                  fill
                  className="object-cover"
                />
              </div>
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

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">About</h3>
                <p className="text-muted-foreground leading-relaxed">{mentor.description}</p>
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

              <div className="space-y-3">
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

              <div className="flex flex-col gap-3 pt-4">
                {!userLoading && (
                  user ? (
                    <Button
                      className="w-full bg-foreground hover:bg-foreground/90"
                      disabled={mentor.availability === 'unavailable'}
                      asChild
                    >
                      <Link href="/dashboard/mentorship">
                        Request Mentorship
                      </Link>
                    </Button>
                  ) : (
                    <div className="space-y-2">
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
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={mentor.linkedIn} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                  {mentor.email && (
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={`mailto:${mentor.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}