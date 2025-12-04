"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ImageGallery } from "@/components/ui/image-gallery";
import { Camera } from "lucide-react";

const galleryImages = [
  {
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64863e73a325a05fbc0e6e13_Join%20Our%20Team_3.png",
    alt: "She Sharp volunteers at event setup",
  },
  {
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64bba5904c40f11a7ff832e7_Mask%20group%20(1).png",
    alt: "She Sharp ambassadors team meeting",
  },
  {
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e53b454b537205d48785f7_Join%20Our%20Team%20Photo1.png",
    alt: "She Sharp team collaboration",
  },
  {
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64863e7324d1d65cc87fe0ff_Join%20Our%20Team_1.png",
    alt: "She Sharp community event",
  },
  {
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e53b454b537205d48785f7_Join%20Our%20Team%20Photo1.png",
    alt: "STEM workshop facilitation",
  },
  {
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64863e7324d1d65cc87fe0ff_Join%20Our%20Team_1.png",
    alt: "Networking event support",
  },
];

export function TeamGallerySection() {
  return (
    <Section bgColor="accent" className="overflow-hidden">
      <Container size="full">
        <div>
          {/* Section Header */}
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-foreground" />
              <span className="text-sm font-medium text-foreground uppercase tracking-wider">
                Volunteer Moments
              </span>
            </div>
          </div>

          {/* Image Gallery */}
          <ImageGallery
            title="Life as a She Sharp Volunteer"
            description="Experience the energy, passion, and impact of our volunteer community through these moments"
            images={galleryImages}
          />
        </div>
      </Container>
    </Section>
  );
}
