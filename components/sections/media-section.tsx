"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Newspaper, Mic, Camera, FileText, ExternalLink, Play } from "lucide-react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const mediaCategories = {
  news: {
    label: "News & Press",
    icon: Newspaper,
    items: [
      {
        id: 1,
        title: "She Sharp Celebrates 10 Years of Empowering Women in Tech",
        outlet: "NZ Herald",
        date: "March 2024",
        image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
        link: "#",
        excerpt: "A decade of breaking barriers and building futures in New Zealand's tech industry...",
      },
      {
        id: 2,
        title: "How She Sharp is Closing the Gender Gap in STEM",
        outlet: "Stuff.co.nz",
        date: "February 2024",
        image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
        link: "#",
        excerpt: "Innovative programs and mentorship initiatives are making a real difference...",
      },
      {
        id: 3,
        title: "Tech Industry Rallies Behind She Sharp's Mission",
        outlet: "BusinessDesk",
        date: "January 2024",
        image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
        link: "#",
        excerpt: "Major tech companies pledge support for diversity initiatives...",
      },
    ],
  },
  podcasts: {
    label: "Podcasts",
    icon: Mic,
    items: [
      {
        id: 1,
        title: "Women in Tech: The She Sharp Story",
        outlet: "Tech Talks NZ",
        date: "March 2024",
        image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
        link: "#",
        duration: "45 min",
        excerpt: "Founder shares insights on building inclusive tech communities...",
      },
      {
        id: 2,
        title: "Breaking Barriers: She Sharp Members Share Their Journeys",
        outlet: "Future Female Leaders",
        date: "February 2024",
        image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
        link: "#",
        duration: "30 min",
        excerpt: "Inspiring stories from women who've transformed their careers...",
      },
    ],
  },
  videos: {
    label: "Videos",
    icon: Camera,
    items: [
      {
        id: 1,
        title: "She Sharp Annual Conference 2024 Highlights",
        outlet: "She Sharp YouTube",
        date: "March 2024",
        image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
        link: "#",
        duration: "3:24",
        views: "2.5K",
      },
      {
        id: 2,
        title: "Mentorship Success Stories",
        outlet: "She Sharp YouTube",
        date: "February 2024",
        image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
        link: "#",
        duration: "5:45",
        views: "1.8K",
      },
    ],
  },
  publications: {
    label: "Publications",
    icon: FileText,
    items: [
      {
        id: 1,
        title: "2024 State of Women in Tech Report",
        outlet: "She Sharp Research",
        date: "March 2024",
        image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
        link: "#",
        type: "Research Report",
        pages: 48,
      },
      {
        id: 2,
        title: "Mentorship Program Impact Study",
        outlet: "She Sharp & University of Auckland",
        date: "January 2024",
        image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
        link: "#",
        type: "Academic Paper",
        pages: 24,
      },
    ],
  },
};

const featuredMedia = {
  title: "She Sharp Featured in TVNZ Breakfast Show",
  outlet: "TVNZ",
  date: "April 2024",
  image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
  videoUrl: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/6494eca97a143f705f5a5436_Home%20Vid%201-1%20Placeholder-transcode.mp4",
  description: "Our CEO discusses the importance of diversity in tech and announces new nationwide initiatives to support women entering STEM careers.",
};

export function MediaSection() {
  return (
    <Section className="bg-white">
      <Container size="wide">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy-dark mb-4">
            She Sharp in the Media
          </h2>
          <p className="text-base sm:text-lg text-gray max-w-2xl mx-auto px-4">
            Our story is being told across New Zealand and beyond. See how we're making headlines and inspiring change.
          </p>
        </div>

        {/* Featured Media */}
        <Card className="mb-8 sm:mb-12 overflow-hidden border-0 shadow-lg">
          <div className={layoutClasses("grid", "md:grid-cols-2", "gap-0")}>
            <div className="relative">
              <AspectRatio ratio={16 / 9}>
                <Image
                  src={featuredMedia.image}
                  alt={featuredMedia.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Link href={featuredMedia.videoUrl} target="_blank" rel="noopener noreferrer">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                      <Play className="w-8 h-8 text-purple-dark ml-1" />
                    </div>
                  </Link>
                </div>
              </AspectRatio>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
              <Badge className="w-fit mb-3 bg-purple-dark text-white">Featured</Badge>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-navy-dark mb-2">
                {featuredMedia.title}
              </h3>
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray mb-4">
                <span>{featuredMedia.outlet}</span>
                <span>•</span>
                <span>{featuredMedia.date}</span>
              </div>
              <p className="text-sm sm:text-base text-gray mb-4 sm:mb-6">
                {featuredMedia.description}
              </p>
              <Button className="w-fit bg-purple-dark hover:bg-purple-mid transition-colors duration-150">
                Watch Full Interview
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Media Categories */}
        <Tabs defaultValue="news" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 sm:mb-8 bg-purple-light/10 p-1.5 rounded-lg h-auto">
            {Object.entries(mediaCategories).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 data-[state=active]:bg-purple-dark data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-150 rounded-md h-full"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(mediaCategories).map(([key, category]) => (
            <TabsContent key={key} value={key}>
              <ScrollArea className="w-full rounded-md">
                <div className="flex w-max space-x-4 p-1">
                  {category.items.map((item) => (
                    <Card key={item.id} className="w-[300px] sm:w-[350px] md:w-[400px] overflow-hidden hover:shadow-md transition-shadow flex-shrink-0">
                      <AspectRatio ratio={16 / 10}>
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover"
                        />
                        {key === 'videos' && 'duration' in item && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {item.duration}
                          </div>
                        )}
                      </AspectRatio>
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.outlet}
                          </Badge>
                          <span className="text-xs text-gray">{item.date}</span>
                        </div>
                        <CardTitle className="text-base">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {'excerpt' in item && item.excerpt && (
                          <CardDescription className="text-sm mb-3">
                            {item.excerpt}
                          </CardDescription>
                        )}
                        <div className="flex items-center justify-between">
                          {key === 'videos' && 'views' in item && item.views && (
                            <span className="text-xs text-gray">{item.views} views</span>
                          )}
                          {key === 'podcasts' && 'duration' in item && item.duration && (
                            <span className="text-xs text-gray">{item.duration}</span>
                          )}
                          {key === 'publications' && 'pages' in item && item.pages && (
                            <span className="text-xs text-gray">{item.pages} pages</span>
                          )}
                          <Button variant="ghost" size="sm" className="ml-auto">
                            View
                            <ExternalLink className="ml-1 w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {/* Media Kit CTA */}
        <div className="mt-8 sm:mt-12 bg-white rounded-lg p-6 sm:p-8 text-center shadow-sm">
          <h3 className="text-lg sm:text-xl font-semibold text-navy-dark mb-3">
            Media & Press Inquiries
          </h3>
          <p className="text-sm sm:text-base text-gray mb-6 max-w-2xl mx-auto">
            Are you a journalist or content creator? Download our media kit for logos, 
            facts, figures, and spokesperson information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="border-purple-dark text-purple-dark hover:bg-purple-light transition-colors duration-150">
              Download Media Kit
            </Button>
            <Button variant="outline" className="border-purple-dark text-purple-dark hover:bg-purple-light transition-colors duration-150">
              Contact Press Team
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}