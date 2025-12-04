"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface iTestimonialCompact {
  name: string;
  designation: string;
  profileImage: string;
  href?: string;
}

interface CompactCardProps {
  testimonial: iTestimonialCompact;
  index: number;
  backgroundImage?: string;
}

const CompactProfileImage = ({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) => {
  const [isLoading, setLoading] = useState(true);

  return (
    <div className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] overflow-hidden rounded-full border-[3px] border-solid border-border aspect-[1/1] flex-none relative">
      <Image
        className={cn(
          "transition duration-300 absolute top-0 inset-0 rounded-inherit object-cover z-50",
          isLoading ? "blur-sm" : "blur-0"
        )}
        onLoad={() => setLoading(false)}
        src={src}
        width={120}
        height={120}
        loading="lazy"
        decoding="async"
        alt={alt || "Profile image"}
      />
    </div>
  );
};

const CompactTestimonialCard = ({
  testimonial,
  index,
  backgroundImage = "https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop",
}: CompactCardProps) => {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      className="rounded-2xl bg-gradient-to-b from-background to-muted h-[280px] md:h-[320px] w-full overflow-hidden flex flex-col items-center justify-center relative z-10 shadow-md border border-border cursor-pointer"
    >
      <div
        className="absolute opacity-20"
        style={{ inset: "-1px 0 0" }}
      >
        <div className="absolute inset-0">
          <Image
            className="block w-full h-full object-center object-cover"
            src={backgroundImage}
            alt="Background layer"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>

      <CompactProfileImage
        src={testimonial.profileImage}
        alt={testimonial.name}
      />

      <p className="text-foreground text-lg md:text-xl font-medium text-center mt-4 px-4">
        {testimonial.name}
      </p>

      <p className="text-muted-foreground text-xs md:text-sm font-light text-center mt-2 px-4 line-clamp-2">
        {testimonial.designation}
      </p>
    </motion.div>
  );

  if (testimonial.href) {
    return (
      <Link href={testimonial.href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

interface CompactGridProps {
  items: iTestimonialCompact[];
  columns?: 2 | 3 | 4;
  backgroundImage?: string;
}

const CompactTestimonialGrid = ({
  items,
  columns = 3,
  backgroundImage,
}: CompactGridProps) => {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns])}>
      {items.map((item, index) => (
        <CompactTestimonialCard
          key={`compact-${index}`}
          testimonial={item}
          index={index}
          backgroundImage={backgroundImage}
        />
      ))}
    </div>
  );
};

export { CompactTestimonialCard, CompactTestimonialGrid, CompactProfileImage };
