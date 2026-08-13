import { Metadata } from "next";
import { GalleryAlbumsGrid } from "@/components/resources";
import { galleryAlbums } from "@/lib/data/gallery-albums";

export const metadata: Metadata = {
  title: "Photo Gallery",
  alternates: { canonical: "/resources/photo-gallery" },
  description:
    "Browse photo albums from She Sharp events, workshops, and community gatherings.",
};

export default function PhotoGalleryPage() {
  return <GalleryAlbumsGrid albums={galleryAlbums} />;
}

