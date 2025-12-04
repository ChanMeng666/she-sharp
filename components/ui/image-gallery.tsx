"use client";

import { cn } from "@/lib/utils";

interface GalleryImage {
  src: string;
  alt: string;
}

interface ImageGalleryProps {
  title?: string;
  description?: string;
  images?: GalleryImage[];
  className?: string;
}

const defaultImages: GalleryImage[] = [
  {
    src: "https://images.unsplash.com/photo-1719368472026-dc26f70a9b76?q=80&h=800&w=800&auto=format&fit=crop",
    alt: "Gallery image 1",
  },
  {
    src: "https://images.unsplash.com/photo-1649265825072-f7dd6942baed?q=80&h=800&w=800&auto=format&fit=crop",
    alt: "Gallery image 2",
  },
  {
    src: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&h=800&w=800&auto=format&fit=crop",
    alt: "Gallery image 3",
  },
  {
    src: "https://images.unsplash.com/photo-1729086046027-09979ade13fd?q=80&h=800&w=800&auto=format&fit=crop",
    alt: "Gallery image 4",
  },
  {
    src: "https://images.unsplash.com/photo-1601568494843-772eb04aca5d?q=80&h=800&w=800&auto=format&fit=crop",
    alt: "Gallery image 5",
  },
  {
    src: "https://images.unsplash.com/photo-1585687501004-615dfdfde7f1?q=80&h=800&w=800&auto=format&fit=crop",
    alt: "Gallery image 6",
  },
];

export function ImageGallery({
  title = "Our Latest Creations",
  description = "A visual collection of our most recent works – each piece crafted with intention, emotion, and style.",
  images = defaultImages,
  className,
}: ImageGalleryProps) {
  return (
    <section className={cn("w-full flex flex-col items-center justify-start py-12", className)}>
      <div className="max-w-3xl text-center px-4">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-sm text-slate-500 mt-2">{description}</p>
      </div>

      <div className="flex items-center gap-2 h-[400px] w-full max-w-5xl mt-10 px-4">
        {images.map((image, idx) => (
          <div
            key={idx}
            className="relative group flex-grow transition-all w-56 rounded-lg overflow-hidden h-[400px] duration-500 hover:w-full"
          >
            <img
              className="h-full w-full object-cover object-center"
              src={image.src}
              alt={image.alt}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default ImageGallery;
