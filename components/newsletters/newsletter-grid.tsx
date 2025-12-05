"use client";

import { motion } from "framer-motion";
import { NewsletterCard } from "./newsletter-card";
import { getLatestNewsletters } from "@/lib/data/newsletters";
import { Mail } from "lucide-react";

export function NewsletterGrid() {
  const newsletters = getLatestNewsletters();

  return (
    <div className="space-y-8">
      {/* Newsletter Grid */}
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
        {newsletters.map((newsletter) => (
          <motion.div
            key={newsletter.id}
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
            <NewsletterCard newsletter={newsletter} />
          </motion.div>
        ))}
      </motion.div>

      {/* Empty state */}
      {newsletters.length === 0 && (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No newsletters found</h3>
          <p className="text-muted-foreground">
            Check back soon for new newsletters.
          </p>
        </div>
      )}
    </div>
  );
}
