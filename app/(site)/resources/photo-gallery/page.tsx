import { Metadata } from "next";
import { GalleryAlbumsGrid } from "@/components/resources";

export const metadata: Metadata = {
  title: "Photo Gallery | She Sharp",
  description:
    "Browse photo albums from She Sharp events, workshops, and community gatherings.",
};

export default function PhotoGalleryPage() {
  return <GalleryAlbumsGrid />;
}

