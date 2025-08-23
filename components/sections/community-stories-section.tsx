"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Quote, Calendar, Clock, MapPin, Users, ArrowRight, Sparkles } from "lucide-react";
import { testimonialsByPage } from "@/lib/data/testimonials";
import Iridescence, { brandColors } from "@/components/effects/iridescence";

// 精选成功故事（从testimonials中选择最有代表性的）
const featuredStories = testimonialsByPage.home.filter(story => 
  story.featured || ["home-1", "home-3", "home-5"].includes(story.id)
).slice(0, 3);

// 即将举行的重点活动（简化版，避免与ProgramsSection重复）
const upcomingHighlights = [
  {
    id: 1,
    title: "THRIVE: Your Career, Your Story",
    date: "March 15, 2025",
    time: "6:00 PM",
    location: "Auckland CBD",
    type: "Conference",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    description: "Annual flagship event with inspiring keynotes and networking.",
    attendees: "150+ expected",
  },
  {
    id: 2,
    title: "Mentorship Speed Dating",
    date: "April 5, 2025", 
    time: "5:30 PM",
    location: "Wellington",
    type: "Networking",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    description: "Meet potential mentors in a fun, fast-paced environment.",
    attendees: "60+ expected",
  },
];

export function CommunityStoriesSection() {
  return (
    <Section className="relative bg-white py-16 md:py-20">
      {/* Background effect */}
      <div className="absolute inset-0 opacity-15">
        <Iridescence
          color={brandColors.testimonialsBlush}
          mouseReact={false}
          amplitude={0.05}
          speed={0.15}
          className="w-full h-full"
        />
      </div>
      
      <Container size="wide" className="relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark mb-6">
            Community in Action
          </h2>
          <p className="text-lg text-gray max-w-3xl mx-auto">
            Real stories from women who've transformed their careers, plus upcoming opportunities 
            to connect and grow with our community.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Success Stories (Left Column) */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-dark" />
              <h3 className="text-xl font-semibold text-navy-dark">Success Stories</h3>
            </div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 6000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent>
                {featuredStories.map((story) => (
                  <CarouselItem key={story.id}>
                    <Card className="border-2 border-purple-light/30 hover:border-purple-light transition-colors">
                      <CardContent className="p-6">
                        {/* Quote Icon */}
                        <Quote className="w-8 h-8 text-purple-light mb-4" />
                        
                        {/* Story Text */}
                        <blockquote className="text-gray italic text-lg mb-6 leading-relaxed">
                          "{story.quote}"
                        </blockquote>

                        {/* Author Info */}
                        <div className="flex items-center gap-4 mb-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={story.image} alt={story.name} />
                            <AvatarFallback className="bg-purple-light text-purple-dark">
                              {story.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-navy-dark text-lg">{story.name}</div>
                            <div className="text-gray">
                              {story.role} at {story.company}
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {story.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs bg-purple-light/20 text-purple-dark">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 h-10 w-10 bg-white/90 hover:bg-white" />
              <CarouselNext className="right-2 h-10 w-10 bg-white/90 hover:bg-white" />
            </Carousel>

            {/* View More Stories CTA */}
            <div className="mt-6 text-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/about#testimonials">
                  Read More Stories
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Upcoming Events (Right Column) */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-periwinkle-dark" />
              <h3 className="text-xl font-semibold text-navy-dark">Don't Miss Out</h3>
            </div>

            <div className="space-y-6">
              {upcomingHighlights.map((event, index) => (
                <Card key={event.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${
                  index === 0 ? 'ring-2 ring-periwinkle-light' : ''
                }`}>
                  {/* Event Image */}
                  <div className="relative h-32">
                    <AspectRatio ratio={16/6}>
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </AspectRatio>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                    
                    {/* Event Type Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className={`${
                        event.type === "Conference" ? "bg-purple-dark" : "bg-periwinkle-dark"
                      } text-white`}>
                        {index === 0 && "🎉 "}{event.type}
                      </Badge>
                    </div>
                    
                    {/* Attendees info */}
                    <div className="absolute bottom-3 right-3 text-white text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.attendees}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h4 className="font-bold text-navy-dark mb-2 text-lg">
                      {event.title}
                    </h4>
                    
                    <div className="space-y-1 text-sm text-gray mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    </div>

                    <p className="text-gray text-sm mb-4">
                      {event.description}
                    </p>

                    <Button
                      asChild
                      size="sm"
                      className={`w-full ${
                        event.type === "Conference" ? "bg-purple-dark hover:bg-purple-mid" : "bg-periwinkle-dark hover:bg-periwinkle-mid"
                      }`}
                    >
                      <Link href={`/events/${event.id}`}>
                        {index === 0 ? "Register Now" : "Learn More"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* View All Events */}
            <div className="mt-6 text-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/events">
                  View All Events
                  <Calendar className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-light/10 via-periwinkle-light/10 to-mint-light/10 rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-navy-dark mb-4">
            Your story could be next
          </h3>
          <p className="text-lg text-gray mb-8 max-w-2xl mx-auto">
            Join a community of women who are breaking barriers, building careers, 
            and supporting each other every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-purple-dark hover:bg-purple-mid transition-colors"
            >
              <Link href="/join-our-team">
                Join Our Community
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-purple-dark text-purple-dark hover:bg-purple-light"
            >
              <Link href="/mentorship">Explore Mentorship</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
