"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Calendar,
  Users,
  MapPin,
  Download,
  Share2,
  Heart
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const galleryCategories = [
  {
    title: "THRIVE Conference 2024",
    count: 156,
    date: "March 2024",
    location: "Auckland CBD",
    featured: true,
    coverImage: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e7d6d1507e385502912e7f_IMG_9898.jpg"
  },
  {
    title: "International Women's Day",
    count: 89,
    date: "March 2024",
    location: "Wellington",
    coverImage: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg"
  },
  {
    title: "Coding Workshop Series",
    count: 124,
    date: "February 2024",
    location: "Multiple Locations",
    coverImage: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e7d6d1507e385502912e7f_IMG_9898.jpg"
  },
  {
    title: "Annual Gala 2023",
    count: 203,
    date: "December 2023",
    location: "Auckland",
    coverImage: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg"
  }
];

const photoStats = [
  { value: "2000+", label: "Photos", icon: Camera },
  { value: "50+", label: "Events Captured", icon: Calendar },
  { value: "500+", label: "Members Featured", icon: Users },
  { value: "10K+", label: "Downloads", icon: Download }
];

export function GalleryHighlightsSection() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <Section bgColor="white">
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-muted text-foreground border-border">
            Visual Stories
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Capturing Our Community in Action
          </h2>
          <p className="text-lg text-gray max-w-3xl mx-auto">
            Browse through memories from our events, workshops, and gatherings. 
            Every photo tells a story of empowerment and connection.
          </p>
        </motion.div>

        {/* Stats */}
        <div className={layoutClasses(
          "grid grid-cols-2 md:grid-cols-4 mb-12",
          layoutSystem.grids.content.gap
        )}>
          {photoStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex p-3 rounded-full bg-muted mb-3">
                <stat.icon className="h-6 w-6 text-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Gallery Categories */}
        <div className={layoutClasses(
          "grid md:grid-cols-2 mb-12",
          layoutSystem.grids.content.gap
        )}>
          {galleryCategories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={category.featured ? "md:col-span-2" : ""}
            >
              <Card 
                className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
                onClick={() => setSelectedCategory(category.title)}
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src={category.coverImage}
                    alt={category.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-foreground/70" />

                  {/* Overlay Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-background">
                    <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Camera className="h-4 w-4" />
                        {category.count} photos
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {category.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {category.location}
                      </span>
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {category.featured && (
                    <Badge className="absolute top-4 right-4 bg-foreground text-background">
                      Featured
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Photo Sharing CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-foreground rounded-2xl p-8 lg:p-12 text-background"
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                Share Your She Sharp Moments
              </h3>
              <p className="text-background/90 mb-6">
                Have photos from our events? We'd love to feature them in our gallery! 
                Tag us on social media or send them directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-background text-foreground hover:bg-background/90"
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  Submit Photos
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-background text-background hover:bg-background/10"
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Follow on Instagram
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-background/10" />
              ))}
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}