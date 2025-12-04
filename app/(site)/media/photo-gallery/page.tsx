import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AlbumGrid } from "@/components/gallery";
import { getGalleryStats } from "@/lib/data/gallery-albums";
import { Camera, Images, FolderOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Photo Gallery | She Sharp",
  description:
    "Browse photo albums from She Sharp events, conferences, workshops, and celebrations. View our community in action.",
};

export default function PhotoGalleryPage() {
  const stats = getGalleryStats();

  return (
    <>
      {/* Hero Section */}
      <Section bgColor="accent" className="py-16 md:py-24">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-purple-dark/10 text-purple-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Camera className="h-4 w-4" />
              Photo Gallery
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Capturing Our Community
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Explore photo albums from our events, conferences, workshops, and
              celebrations. Click on any album to view all photos in Google
              Photos.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-3xl font-bold text-purple-dark">
                  <FolderOpen className="h-8 w-8" />
                  {stats.totalAlbums}
                </div>
                <span className="text-sm text-muted-foreground">Albums</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-3xl font-bold text-purple-dark">
                  <Images className="h-8 w-8" />
                  {stats.totalPhotos}+
                </div>
                <span className="text-sm text-muted-foreground">Photos</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-purple-dark">
                  {stats.categories}
                </div>
                <span className="text-sm text-muted-foreground">
                  Categories
                </span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Albums Grid Section */}
      <Section className="py-16">
        <Container size="full">
          <AlbumGrid />
        </Container>
      </Section>

    </>
  );
}
