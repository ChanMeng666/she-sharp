"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Users,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PastEvent {
  id: string;
  title: string;
  date: string;
  attendees: number;
  images: string[];
  description?: string;
}

interface PastEventsGalleryProps {
  events: PastEvent[];
}

export function PastEventsGallery({ events }: PastEventsGalleryProps) {
  const [selectedEvent, setSelectedEvent] = useState<PastEvent | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handlePrevImage = () => {
    if (selectedEvent) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? selectedEvent.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (selectedEvent) {
      setSelectedImageIndex((prev) =>
        prev === selectedEvent.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Create a masonry-style layout
  const getGridSpan = (index: number) => {
    const patterns = [
      "col-span-1 row-span-1",
      "col-span-2 row-span-1",
      "col-span-1 row-span-2",
      "col-span-1 row-span-1",
      "col-span-1 row-span-1",
      "col-span-2 row-span-2",
    ];
    return patterns[index % patterns.length];
  };

  return (
    <section className="py-16 md:py-24 bg-navy-light dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-mint-dark text-navy-dark border-0">
            Past Events
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-navy-dark dark:text-white mb-4">
            Memories from Our Community
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore the amazing moments from our past events. Join us to be part
            of the next chapter!
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {events.flatMap((event, eventIndex) =>
            event.images.slice(0, 2).map((image, imageIndex) => {
              const uniqueIndex = eventIndex * 2 + imageIndex;
              return (
                <div
                  key={`${event.id}-${imageIndex}`}
                  className={cn(
                    getGridSpan(uniqueIndex),
                    "relative group cursor-pointer overflow-hidden rounded-lg"
                  )}
                  onClick={() => {
                    setSelectedEvent(event);
                    setSelectedImageIndex(imageIndex);
                  }}
                >
                  <Image
                    src={image}
                    alt={`${event.title} - Photo ${imageIndex + 1}`}
                    fill
                    className="object-cover transition-opacity duration-150"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-navy-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

                  {/* Event Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.attendees}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedEvent && (
            <div className="relative">
              {/* Image Viewer */}
              <div className="relative h-[60vh] bg-black">
                <Image
                  src={selectedEvent.images[selectedImageIndex]}
                  alt={`${selectedEvent.title} - Photo ${selectedImageIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                />

                {/* Navigation */}
                {selectedEvent.images.length > 1 && (
                  <>
                    <Button
                      variant="glass"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="glass"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {selectedEvent.images.length}
                </div>
              </div>

              {/* Event Details */}
              <div className="p-6 bg-white dark:bg-gray-900">
                <h3 className="text-xl font-semibold text-navy-dark dark:text-white mb-2">
                  {selectedEvent.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {selectedEvent.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedEvent.attendees} attendees
                  </span>
                </div>
                {selectedEvent.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {selectedEvent.description}
                  </p>
                )}
                {selectedEvent.id === "thrive-july-2025" && (
                  <Button asChild variant="accent" size="lg" className="gap-2">
                    <Link href="/events/thrive-your-career-your-story">
                      View Event Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
