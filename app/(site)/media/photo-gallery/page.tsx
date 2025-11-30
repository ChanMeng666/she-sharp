import { GalleryHeroSection } from "@/components/sections/media/gallery/gallery-hero-section";
import { GalleryHighlightsSection } from "@/components/sections/media/gallery/gallery-highlights-section";
import { GalleryGridSection } from "@/components/sections/media/gallery/gallery-grid-section";

export default function PhotoGalleryPage() {
  return (
    <>
      <GalleryHeroSection />
      <GalleryHighlightsSection />
      <GalleryGridSection />
    </>
  );
}