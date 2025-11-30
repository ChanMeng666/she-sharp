"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Headphones, 
  Rss, 
  Music, 
  Radio,
  Globe,
  ExternalLink 
} from "lucide-react";
import { motion } from "framer-motion";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const podcastPlatforms = [
  {
    name: "Apple Podcasts",
    icon: Music,
    color: "purple",
    url: "#",
    description: "Listen on iPhone, iPad, Mac"
  },
  {
    name: "Spotify",
    icon: Radio,
    color: "mint",
    url: "#",
    description: "Stream on any device"
  },
  {
    name: "Google Podcasts",
    icon: Headphones,
    color: "periwinkle",
    url: "#",
    description: "Listen on Android devices"
  },
  {
    name: "RSS Feed",
    icon: Rss,
    color: "navy",
    url: "#",
    description: "Subscribe in any podcast app"
  }
];

const stats = [
  { value: "20+", label: "Episodes" },
  { value: "5K+", label: "Monthly Listeners" },
  { value: "4.9", label: "Average Rating" },
  { value: "100+", label: "Guest Experts" }
];

export function PodcastSubscribeSection() {
  return (
    <Section bgColor="accent">
      <Container size="content">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-muted text-foreground border-border">
            Never Miss an Episode
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Subscribe to She Sharp Talks
          </h2>
          <p className="text-lg text-gray max-w-3xl mx-auto">
            Join thousands of listeners who tune in for inspiring conversations with 
            women leaders in STEM. Available on all major podcast platforms.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Platform Links */}
        <div className={layoutClasses(
          "grid md:grid-cols-2 lg:grid-cols-4 mb-12",
          layoutSystem.grids.content.gap
        )}>
          {podcastPlatforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-4 rounded-full bg-muted mb-4 group-hover:scale-110 transition-transform duration-150">
                    <platform.icon className="h-8 w-8 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {platform.name}
                  </h3>
                  <p className="text-sm text-gray mb-4">
                    {platform.description}
                  </p>
                  <Button 
                    asChild
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    <a href={platform.url} target="_blank" rel="noopener noreferrer">
                      Subscribe
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-foreground rounded-2xl p-8 lg:p-12 text-background text-center"
        >
          <Globe className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">
            Get Episode Highlights in Your Inbox
          </h3>
          <p className="text-background/90 mb-6 max-w-2xl mx-auto">
            Can't listen to full episodes? Subscribe to our newsletter for key takeaways, 
            inspiring quotes, and actionable insights from each episode.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-background text-foreground hover:bg-background/90"
          >
            Subscribe to Newsletter
          </Button>
        </motion.div>
      </Container>
    </Section>
  );
}