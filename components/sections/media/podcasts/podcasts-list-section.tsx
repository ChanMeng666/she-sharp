"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ExternalLink, Play, Pause, Clock, Calendar, Info } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const podcasts = [
  {
    id: 1,
    title: "Tech Wonderland: A Holiday Celebration with Google's Performance Lead, Hannah Weir",
    date: "December 2023",
    duration: "45 min",
    category: "Career Stories",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65a9cbb3c67fedb1bc802f30_Podcast%20Template%20(1).png",
    spotifyLink: "#",
    description: "Join us for an inspiring conversation with Hannah Weir, Google's Performance Lead, as she shares her journey in tech and insights on building high-performing teams.",
    featured: true
  },
  {
    id: 2,
    title: "TECHNOLOGICAL CHANGE - WORKPLACE & WORKFORCE IMPACTS",
    date: "November 2023",
    duration: "52 min",
    category: "Industry Insights",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/656449f3d01f2e91e441cff0_Podcast%20Template.png",
    spotifyLink: "#",
    description: "Exploring how technological advancements are reshaping the workplace and what it means for the future workforce.",
    featured: true
  },
  {
    id: 3,
    title: "Inspire Her: Te Whakatipuranga Wahine",
    date: "October 2023",
    duration: "38 min",
    category: "Inspiration",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65509ac5a0623d92b00799c5_Group%20480965680%20(1).png",
    spotifyLink: "#",
    description: "Celebrating the achievements of Māori women in technology and their contributions to innovation in Aotearoa.",
    featured: true
  },
  {
    id: 4,
    title: "From Burnout to Balance",
    date: "September 2023",
    duration: "41 min",
    category: "Wellbeing",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6516caff046b6bee332a81b9_Group%20480965692.png",
    spotifyLink: "#",
    description: "Practical strategies for maintaining work-life balance in the demanding tech industry.",
    featured: false
  },
  {
    id: 5,
    title: "A Legendairy Career",
    date: "September 2023",
    duration: "48 min",
    category: "Career Stories",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f48bfd055ab00edf0c9575_Event%20Tile_BGs%20(1).png",
    spotifyLink: "#",
    description: "From dairy farming to data science - an unconventional journey into tech.",
    featured: false
  },
  {
    id: 6,
    title: "Innovation Unleashed with Deloitte",
    date: "July 2023",
    duration: "55 min",
    category: "Industry Insights",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64bb8ab537717a195533fc8a_Podcast%20Template%20(3).png",
    spotifyLink: "#",
    description: "Deloitte leaders discuss fostering innovation and creating inclusive tech environments.",
    featured: false
  },
  {
    id: 7,
    title: "Kickstart Your Career in Tech with MYOB",
    date: "May 2023",
    duration: "43 min",
    category: "Career Development",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64926803e40138d6dc0e5c02_Podcast%20Tile_Kickstart%20Your%20Career%20in%20Tech%20with%20MYOB.png",
    spotifyLink: "#",
    description: "Essential tips and insights for launching a successful career in technology.",
    featured: false
  },
  {
    id: 8,
    title: "A Chat with Fiona Webby @ AcademyEX: The New Youniversity",
    date: "April 2023",
    duration: "50 min",
    category: "Education",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64926899d771e6ed62e9f52b_Podcast%20Tile_A%20Chat%20with%20Fiona%20Webby.png",
    spotifyLink: "#",
    description: "Reimagining education for the digital age and preparing students for tech careers.",
    featured: false
  },
  {
    id: 9,
    title: "IWD #EmbraceEquality",
    date: "April 2023",
    duration: "46 min",
    category: "Diversity & Inclusion",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/649268ebdac5954a754425d5_Podcast%20Tile_IWD%20%23EmbraceEquality.png",
    spotifyLink: "#",
    description: "International Women's Day special: Embracing equality in tech and beyond.",
    featured: false
  }
];

const categories = ["All Episodes", "Career Stories", "Industry Insights", "Wellbeing", "Diversity & Inclusion"];

export function PodcastsListSection() {
  const [selectedCategory, setSelectedCategory] = useState("All Episodes");
  const [playingId, setPlayingId] = useState<number | null>(null);

  const featuredPodcasts = podcasts.filter(p => p.featured);
  const filteredPodcasts = selectedCategory === "All Episodes" 
    ? podcasts 
    : podcasts.filter(p => p.category === selectedCategory);

  const categoryColors: Record<string, string> = {
    "Career Stories": "bg-purple-dark text-white",
    "Industry Insights": "bg-periwinkle-dark text-white",
    "Wellbeing": "bg-mint-dark text-navy-dark",
    "Diversity & Inclusion": "bg-purple-dark text-white",
    "Inspiration": "bg-purple-light text-purple-dark",
    "Career Development": "bg-navy-dark text-white",
    "Education": "bg-periwinkle-light text-periwinkle-dark"
  };

  return (
    <Section bgColor="white">
      <Container size="full">
        {/* Featured Podcasts Carousel */}
        <div className={layoutSystem.spacing.component.combined}>
          <h2 className="text-3xl md:text-4xl font-bold text-navy-dark mb-8">Featured Episodes</h2>
          <Carousel className="w-full">
            <CarouselContent>
              {featuredPodcasts.map((podcast) => (
                <CarouselItem key={podcast.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full border-2 border-periwinkle-light hover:border-periwinkle-dark transition-colors">
                    <div className="relative aspect-[16/9]">
                      <Image
                        src={podcast.image}
                        alt={podcast.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      <Badge 
                        className={`absolute top-4 right-4 ${categoryColors[podcast.category]}`}
                      >
                        {podcast.category}
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 text-sm text-gray mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{podcast.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{podcast.duration}</span>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-lg text-navy-dark mb-3 line-clamp-2">
                        {podcast.title}
                      </h3>

                      <p className="text-gray-600 mb-4 line-clamp-2">{podcast.description}</p>

                      {/* Mini Player */}
                      <div className="space-y-3">
                        <Progress value={33} className="h-1" />
                        <div className="flex items-center justify-between">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-periwinkle-dark hover:text-periwinkle-dark/80"
                            onClick={() => setPlayingId(playingId === podcast.id ? null : podcast.id)}
                          >
                            {playingId === podcast.id ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>
                          <Button 
                            asChild 
                            size="sm"
                            className="bg-periwinkle-dark hover:bg-periwinkle-dark/90 text-white"
                          >
                            <a 
                              href={podcast.spotifyLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2"
                            >
                              Listen on Spotify
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>

        {/* All Episodes with Tabs */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-navy-dark mb-8">All Episodes</h2>
          
          <Tabs defaultValue="All Episodes" value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start flex-wrap h-auto p-1 mb-8 bg-muted text-muted-foreground">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-0">
              <div className="space-y-4">
                {filteredPodcasts.map((podcast) => (
                  <Card key={podcast.id} className="overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-periwinkle-dark">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="relative w-full md:w-48 aspect-[16/9] flex-shrink-0">
                          <Image
                            src={podcast.image}
                            alt={podcast.title}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={categoryColors[podcast.category]}>
                                  {podcast.category}
                                </Badge>
                                <span className="text-sm text-gray">{podcast.date}</span>
                                <span className="text-sm text-gray">• {podcast.duration}</span>
                              </div>
                              <h3 className="font-semibold text-xl text-navy-dark">
                                {podcast.title}
                              </h3>
                            </div>
                            
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Button size="icon" variant="ghost" className="flex-shrink-0">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <p className="text-sm">{podcast.description}</p>
                              </HoverCardContent>
                            </HoverCard>
                          </div>

                          <p className="text-gray-600 mb-4 line-clamp-2 md:line-clamp-none">
                            {podcast.description}
                          </p>

                          <div className="flex items-center gap-4">
                            <Button
                              variant="outline"
                              className="text-periwinkle-dark border-periwinkle-dark hover:bg-periwinkle-light"
                              onClick={() => setPlayingId(playingId === podcast.id ? null : podcast.id)}
                            >
                              {playingId === podcast.id ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Preview
                                </>
                              )}
                            </Button>
                            
                            <Button 
                              asChild 
                              className="bg-periwinkle-dark hover:bg-periwinkle-dark/90 text-white"
                            >
                              <a 
                                href={podcast.spotifyLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2"
                              >
                                Listen on Spotify
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </Section>
  );
}