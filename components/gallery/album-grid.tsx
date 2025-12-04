"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlbumCard } from "./album-card";
import {
  galleryAlbums,
  getAlbumsByCategory,
  getAllAlbumCategories,
  getCategoryLabel,
} from "@/lib/data/gallery-albums";
import type { AlbumCategory } from "@/types/gallery";
import { Camera, Users, Award, Handshake, PartyPopper } from "lucide-react";

const categoryIcons: Record<AlbumCategory | "all", React.ElementType> = {
  all: Camera,
  events: Users,
  conferences: Award,
  workshops: Users,
  networking: Handshake,
  celebrations: PartyPopper,
};

export function AlbumGrid() {
  const [selectedCategory, setSelectedCategory] = useState<
    AlbumCategory | "all"
  >("all");

  const categories = getAllAlbumCategories();
  const filteredAlbums =
    selectedCategory === "all"
      ? galleryAlbums
      : getAlbumsByCategory(selectedCategory);

  return (
    <div className="space-y-8">
      {/* Category Filter Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(value) =>
          setSelectedCategory(value as AlbumCategory | "all")
        }
      >
        <TabsList className="w-full justify-start flex-wrap h-auto p-1 bg-muted">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            All Albums
          </TabsTrigger>
          {categories.map((category) => {
            const Icon = categoryIcons[category] || Camera;
            return (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-background data-[state=active]:text-foreground flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {getCategoryLabel(category)}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Albums Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
        key={selectedCategory}
      >
        {filteredAlbums.map((album, index) => (
          <motion.div
            key={album.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.4,
                  ease: [0.25, 0.1, 0.25, 1],
                },
              },
            }}
          >
            <AlbumCard album={album} priority={index < 4} />
          </motion.div>
        ))}
      </motion.div>

      {/* Empty state */}
      {filteredAlbums.length === 0 && (
        <div className="text-center py-12">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No albums found</h3>
          <p className="text-muted-foreground">
            There are no albums in this category yet.
          </p>
        </div>
      )}
    </div>
  );
}
