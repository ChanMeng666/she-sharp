"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animation variants for the container to stagger children
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Animation variants for each grid item
 */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 10,
    },
  },
};

/**
 * Props for the BentoGridShowcase component.
 * Each prop represents a "slot" in the grid.
 */
interface BentoGridShowcaseProps {
  /** Slot for the top-left card (Integrations) */
  integrations: React.ReactNode;
  /** Slot for the top-right card (Feature Tags) */
  featureTags: React.ReactNode;
  /** Slot for the tall middle card (Main Feature) */
  mainFeature: React.ReactNode;
  /** Slot for the middle-left card (Secondary Feature) */
  secondaryFeature: React.ReactNode;
  /** Slot for the middle-right card (Statistic) */
  statistic: React.ReactNode;
  /** Slot for the bottom-left card (Journey) */
  journey: React.ReactNode;
  /** Optional class names for the grid container */
  className?: string;
}

/**
 * A responsive, animated 3-column bento grid layout component.
 * It arranges six content slots in a specific 3-row vertical layout.
 */
export const BentoGridShowcase = ({
  integrations,
  featureTags,
  mainFeature,
  secondaryFeature,
  statistic,
  journey,
  className,
}: BentoGridShowcaseProps) => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        // Core grid layout: 1 col on mobile, 3 on desktop
        "grid w-full grid-cols-1 gap-6 md:grid-cols-3",
        // Defines 3 explicit rows on medium screens and up
        "md:grid-rows-3",
        // Use minmax to ensure cards can grow but have a minimum height
        "auto-rows-[minmax(200px,auto)]",
        className
      )}
    >
      {/* Slot 1: Integrations (1,1) */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">
        {integrations}
      </motion.div>

      {/* Slot 2: Main Feature (1,2) - Spans 3 rows */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-3">
        {mainFeature}
      </motion.div>

      {/* Slot 3: Feature Tags (1,3) */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">
        {featureTags}
      </motion.div>

      {/* Slot 4: Secondary Feature (2,1) */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">
        {secondaryFeature}
      </motion.div>

      {/* Slot 5: Statistic (2,3) - Spans 2 rows */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-2">
        {statistic}
      </motion.div>

      {/* Slot 6: Journey (3,1) */}
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">
        {journey}
      </motion.div>
    </motion.section>
  );
};

/**
 * Props for the BentoGrid2x2 component.
 * A simpler 2-column, 2-row grid with 4 slots.
 */
interface BentoGrid2x2Props {
  /** Top-left card */
  topLeft: React.ReactNode;
  /** Top-right card */
  topRight: React.ReactNode;
  /** Bottom-left card */
  bottomLeft: React.ReactNode;
  /** Bottom-right card */
  bottomRight: React.ReactNode;
  /** Optional class names for the grid container */
  className?: string;
}

/**
 * A responsive, animated 2-column bento grid layout component.
 * Arranges four content slots in a standard 2x2 grid.
 */
export const BentoGrid2x2 = ({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  className,
}: BentoGrid2x2Props) => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid w-full grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-2",
        "auto-rows-[minmax(240px,auto)]",
        className
      )}
    >
      {/* Top-left (row 1, col 1) */}
      <motion.div variants={itemVariants} className="md:col-start-1 md:row-start-1">
        {topLeft}
      </motion.div>
      {/* Top-right (row 1, col 2) */}
      <motion.div variants={itemVariants} className="md:col-start-2 md:row-start-1">
        {topRight}
      </motion.div>
      {/* Bottom-left (row 2, col 1) */}
      <motion.div variants={itemVariants} className="md:col-start-1 md:row-start-2">
        {bottomLeft}
      </motion.div>
      {/* Bottom-right (row 2, col 2) */}
      <motion.div variants={itemVariants} className="md:col-start-2 md:row-start-2">
        {bottomRight}
      </motion.div>
    </motion.section>
  );
};