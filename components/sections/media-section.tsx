"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ExternalLink, Play, Newspaper, Mic, Camera } from "lucide-react";

// 精选的重点媒体内容 - 去除tab分类，只展示最重要的
const featuredMedia = {
  title: "She Sharp Featured in TVNZ Breakfast Show",
  outlet: "TVNZ",
  date: "April 2024",
  image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
  videoUrl: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/6494eca97a143f705f5a5436_Home%20Vid%201-1%20Placeholder-transcode.mp4",
  description: "Our CEO discusses the importance of diversity in tech and announces new nationwide initiatives to support women entering STEM careers.",
};

// 简化的媒体亮点 - 只显示最重要的几个
const mediaHighlights = [
  {
    id: 1,
    title: "She Sharp Celebrates 10 Years of Empowering Women in Tech",
    outlet: "NZ Herald",
    date: "March 2024",
    type: "News",
    icon: Newspaper,
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    link: "#",
    excerpt: "A decade of breaking barriers and building futures in New Zealand's tech industry.",
  },
  {
    id: 2,
    title: "Women in Tech: The She Sharp Story",
    outlet: "Tech Talks NZ",
    date: "March 2024",
    type: "Podcast",
    icon: Mic,
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    link: "#",
    excerpt: "Founder shares insights on building inclusive tech communities.",
    duration: "45 min",
  },
  {
    id: 3,
    title: "She Sharp Annual Conference 2024 Highlights",
    outlet: "She Sharp YouTube",
    date: "March 2024",
    type: "Video",
    icon: Camera,
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    link: "#",
    duration: "3:24",
    views: "2.5K",
  },
];

export function MediaSection() {
  return (
    <Section className="relative bg-white py-16 md:py-20 overflow-hidden">
      {/* Subtle background effect for media content */}
      <div className="absolute inset-0 opacity-12">
        {/* <Iridescence
          color={brandColors.testimonialsSky}
          mouseReact={false}
          amplitude={0.06}
          speed={0.25}
          className="w-full h-full"
        /> */}
      </div>
      
      <Container size="wide" className="relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Recognition & Coverage
          </h2>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            Leading media outlets recognize our impact and share our story of transformation in technology.
          </p>
        </div>

        {/* Featured Media */}
        <Card className="mb-12 overflow-hidden border-0 shadow-lg">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative">
              <AspectRatio ratio={16 / 9}>
                <Image
                  src={featuredMedia.image}
                  alt={featuredMedia.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Link href={featuredMedia.videoUrl} target="_blank" rel="noopener noreferrer">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                      <Play className="w-8 h-8 text-foreground ml-1" />
                    </div>
                  </Link>
                </div>
              </AspectRatio>
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <Badge className="w-fit mb-4 bg-foreground text-background">Featured</Badge>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                {featuredMedia.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray mb-4">
                <span>{featuredMedia.outlet}</span>
                <span>•</span>
                <span>{featuredMedia.date}</span>
              </div>
              <p className="text-gray mb-6 leading-relaxed">
                {featuredMedia.description}
              </p>
              <Button className="w-fit" asChild>
                <Link href={featuredMedia.videoUrl} target="_blank" rel="noopener noreferrer">
                  Watch Full Interview
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Media Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {mediaHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative h-48">
                  <AspectRatio ratio={16 / 9}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </AspectRatio>
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-background/90 text-foreground border-0 flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {item.type}
                    </Badge>
                  </div>
                  {(item.duration || item.views) && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {item.duration || `${item.views} views`}
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.outlet}
                    </Badge>
                    <span className="text-xs text-gray">{item.date}</span>
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {item.excerpt}
                  </CardDescription>
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link href={item.link} target="_blank" rel="noopener noreferrer">
                      Read More
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Simple CTA */}
        <div className="text-center bg-muted rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Follow Our Journey
          </h3>
          <p className="text-gray mb-6 max-w-xl mx-auto">
            Stay updated with our latest news, events, and impact stories across media platforms.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link href="/resources">
              View All Resources
              <ExternalLink className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}