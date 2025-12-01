"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { useEffect, useState } from "react";
import Image from "next/image";
import { layoutSystem } from "@/lib/layout-system";

const heroImages = [
  "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/684918c467a93421eafe8f3b_unnamed.jpg",
  "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67fd6ff293328e7d586a0200_myOB%20tech%20week%20event.png",
  "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67ce885e79f6ad76f91dc4a1_Screen%20Shot%202025-03-10%20at%207.36.11%20PM.png",
  "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67db4b3d53a88fa011d49f6e_IWD%20-%20Poster%20(1).png"
];

export function GalleryHeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Section noPadding className="relative min-h-screen overflow-hidden">
      {/* Full-screen image carousel */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-150 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image}
              alt={`Gallery image ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      <Container size="wide" className="relative z-10 h-full flex items-end pb-12">
        <div className="max-w-3xl">
          <h1 className="text-6xl md:text-8xl font-bold text-background mb-4 drop-shadow-lg">
            Gallery
          </h1>
          <p className="text-xl md:text-2xl text-background/90 leading-relaxed">
            Capturing moments of innovation, inspiration, and community
          </p>
          
          {/* Image indicators */}
          <div className="flex gap-2 mt-8">
            {heroImages.map((_, index) => (
              <button
                key={index}
                className={`h-1 rounded-full transition-colors duration-150 ${
                  index === currentImageIndex
                    ? 'w-12 bg-background'
                    : 'w-6 bg-background/40 hover:bg-background/60'
                }`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}