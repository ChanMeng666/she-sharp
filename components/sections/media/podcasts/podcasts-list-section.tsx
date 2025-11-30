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
import { layoutSystem } from "@/lib/layout-system";
import { podcasts, getFeaturedPodcasts, getCategoryLabel } from "@/lib/data/podcasts";
import { PODCAST_CATEGORY_LABELS, type PodcastCategory } from "@/types/podcast";

const categories = ["All Episodes", "Career Stories", "Industry Insights", "Wellbeing", "Diversity & Inclusion"];

export function PodcastsListSection() {
  const [selectedCategory, setSelectedCategory] = useState("All Episodes");
  const [playingSlug, setPlayingSlug] = useState<string | null>(null);

  const featuredPodcasts = getFeaturedPodcasts();
  const filteredPodcasts = selectedCategory === "All Episodes"
    ? podcasts
    : podcasts.filter(p => getCategoryLabel(p.category) === selectedCategory);

  const categoryColors: Record<string, string> = {
    "Career Stories": "bg-foreground text-background",
    "Industry Insights": "bg-foreground text-background",
    "Wellbeing": "bg-muted text-foreground",
    "Diversity & Inclusion": "bg-foreground text-background",
    "Inspiration": "bg-muted text-foreground",
    "Career Development": "bg-foreground text-background",
    "Education": "bg-muted text-foreground"
  };

  return (
    <Section bgColor="white">
      <Container size="full">
        {/* Featured Podcasts Carousel */}
        <div className={layoutSystem.spacing.component.combined}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Featured Episodes</h2>
          <Carousel className="w-full">
            <CarouselContent>
              {featuredPodcasts.map((podcast) => (
                <CarouselItem key={podcast.slug} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full border-2 border-border hover:border-border transition-colors">
                    <div className="relative aspect-[16/9]">
                      <Image
                        src={podcast.coverImage}
                        alt={podcast.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      <Badge
                        className={`absolute top-4 right-4 ${categoryColors[getCategoryLabel(podcast.category)]}`}
                      >
                        {getCategoryLabel(podcast.category)}
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

                      <h3 className="font-semibold text-lg text-foreground mb-3 line-clamp-2">
                        {podcast.title}
                      </h3>

                      <p className="text-gray-600 mb-4 line-clamp-2">{podcast.description}</p>

                      {/* Mini Player */}
                      <div className="space-y-3">
                        <Progress value={33} className="h-1" />
                        <div className="flex items-center justify-between">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-foreground hover:text-foreground/80"
                            onClick={() => setPlayingSlug(playingSlug === podcast.slug ? null : podcast.slug)}
                          >
                            {playingSlug === podcast.slug ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            className="bg-foreground hover:bg-foreground/90 text-background"
                          >
                            <a
                              href={podcast.spotifyUrl}
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
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">All Episodes</h2>
          
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
                  <Card key={podcast.slug} className="overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-border">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="relative w-full md:w-48 aspect-[16/9] flex-shrink-0">
                          <Image
                            src={podcast.coverImage}
                            alt={podcast.title}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={categoryColors[getCategoryLabel(podcast.category)]}>
                                  {getCategoryLabel(podcast.category)}
                                </Badge>
                                <span className="text-sm text-gray">{podcast.date}</span>
                                <span className="text-sm text-gray">• {podcast.duration}</span>
                              </div>
                              <h3 className="font-semibold text-xl text-foreground">
                                {podcast.title}
                              </h3>
                            </div>

                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Button size="icon" variant="outline" className="flex-shrink-0">
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
                              className="text-foreground border-border hover:bg-muted"
                              onClick={() => setPlayingSlug(playingSlug === podcast.slug ? null : podcast.slug)}
                            >
                              {playingSlug === podcast.slug ? (
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
                              className="bg-foreground hover:bg-foreground/90 text-background"
                            >
                              <a
                                href={podcast.spotifyUrl}
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