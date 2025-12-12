"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlbumCard } from "./album-card";
import { galleryAlbums } from "@/lib/data/gallery-albums";
import { Camera, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEMS_PER_ROW = 3;
const INITIAL_ROWS = 1;
const LOAD_MORE_ROWS = 2;

export function AlbumGrid() {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_ROW * INITIAL_ROWS);

  const hasMore = visibleCount < galleryAlbums.length;
  const visibleAlbums = galleryAlbums.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + ITEMS_PER_ROW * LOAD_MORE_ROWS, galleryAlbums.length)
    );
  };

  return (
    <div className="space-y-8">
      {/* Albums Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
        <AnimatePresence mode="popLayout">
          {visibleAlbums.map((album, index) => (
            <motion.div
              key={album.googlePhotosUrl}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.4,
                  ease: [0.25, 0.1, 0.25, 1],
                },
              }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <AlbumCard album={album} priority={index < 3} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          className="flex justify-center pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            className="gap-2"
          >
            Load More Albums
            <ChevronDown className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

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
