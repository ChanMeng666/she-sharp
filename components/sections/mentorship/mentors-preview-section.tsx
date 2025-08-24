"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Users, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { mentors } from "@/data/mentors";
import Iridescence, { brandColors } from "@/components/effects/iridescence";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export function MentorsPreviewSection() {
  const { ref, inView } = useInView();
  const reduceMotion = usePrefersReducedMotion();

  return (
    <Section className="py-16 md:py-24 bg-gradient-to-br from-white via-purple-light/10 to-periwinkle-light/20 dark:from-gray-950 dark:via-purple-dark/5 dark:to-periwinkle-dark/10">
      <div ref={ref} className="relative">
        {inView && !reduceMotion && (
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <Iridescence
              color={brandColors.commitmentsLavender}
              mouseReact={false}
              amplitude={0.03}
              speed={0.12}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white/70" />
          </div>
        )}
        <Container className="relative z-10">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-periwinkle-dark/10 text-periwinkle-dark border-periwinkle-dark">
              <Users className="w-3 h-3 mr-1" />
              Expert Mentors
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white mb-4">
              Meet Our Mentors
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experienced professionals ready to guide your career journey
            </p>
          </div>

          {/* Mentors Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {mentors.slice(0, 3).map((mentor) => (
              <Card key={mentor.id} className="group hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/90">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-periwinkle-dark/20">
                      <AvatarImage src={mentor.image} alt={mentor.name} />
                      <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg text-navy dark:text-white group-hover:text-periwinkle-dark transition-colors">
                        {mentor.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {mentor.role}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                          {mentor.company}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {mentor.industry} • {mentor.yearsOfExperience}+ years
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Expertise Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.expertise.slice(0, 2).map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="secondary" 
                        className="text-xs bg-periwinkle-light/50 text-periwinkle-dark border-periwinkle-dark/20"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Bio */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 line-clamp-3">
                    {mentor.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button asChild size="lg" className="bg-periwinkle-dark hover:bg-periwinkle-mid text-white">
              <Link href="/mentorship/mentors">
                View All Mentors
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </div>
    </Section>
  );
}