"use client";

import { motion } from "framer-motion";
import { AlbumCard } from "./album-card";
import { galleryAlbums } from "@/lib/data/gallery-albums";
import { Camera } from "lucide-react";

export function AlbumGrid() {
  return (
    <div className="space-y-8">
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
      >
        {galleryAlbums.map((album, index) => (
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
      {galleryAlbums.length === 0 && (
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
