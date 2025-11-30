"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useState, useEffect } from "react";
import { CalendarDays, Users, Award, Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const galleryItems = [
  {
    id: 1,
    title: "Ethnic Advantage Conference",
    date: "June 28, 2025",
    category: "conferences",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/684918c467a93421eafe8f3b_unnamed.jpg",
    aspectRatio: "landscape",
    tags: ["Conference", "Diversity"],
    description: "Celebrating diversity in tech at the Ethnic Advantage Conference"
  },
  {
    id: 2,
    title: "Tech That Matches Your Vibe: Find Your Perfect Fit",
    date: "May 22, 2025",
    category: "events",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67fd6ff293328e7d586a0200_myOB%20tech%20week%20event.png",
    aspectRatio: "portrait",
    tags: ["Tech Week", "Career"],
    description: "MYOB Tech Week event helping attendees find their perfect tech career match"
  },
  {
    id: 3,
    title: "#IAmRemarkable",
    date: "April 16, 2025",
    category: "workshops",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67ce885e79f6ad76f91dc4a1_Screen%20Shot%202025-03-10%20at%207.36.11%20PM.png",
    aspectRatio: "landscape",
    tags: ["Workshop", "Empowerment"],
    description: "Empowering women to speak openly about their accomplishments"
  },
  {
    id: 4,
    title: "She Sharp & academyEX: International Women's Day",
    date: "March 14, 2025",
    category: "events",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67db4b3d53a88fa011d49f6e_IWD%20-%20Poster%20(1).png",
    aspectRatio: "square",
    tags: ["IWD", "Partnership"],
    description: "International Women's Day celebration with academyEX"
  },
  {
    id: 5,
    title: "Google Educator Conference",
    date: "November 21, 2024",
    category: "conferences",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c1393875d438f45786d5d9_Google%20Educator%20Conference.jpg",
    aspectRatio: "landscape",
    tags: ["Google", "Education"],
    description: "Annual Google Educator Conference bringing together tech educators"
  },
  {
    id: 6,
    title: "The Role of Technology in Sustainable Development",
    date: "November 15, 2024",
    category: "events",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c1388d5ccd8b5bd8b7be0c_The%20Role%20of%20Technology%20in%20Sustainable%20Development.png",
    aspectRatio: "portrait",
    tags: ["Sustainability", "Tech"],
    description: "Exploring how technology drives sustainable development goals"
  },
  {
    id: 7,
    title: "She Sharp 10-Year Anniversary",
    date: "October 18, 2024",
    category: "celebrations",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67230db0aea4360addb5e13a_10yr.png",
    aspectRatio: "square",
    tags: ["Anniversary", "Milestone"],
    description: "Celebrating 10 years of empowering women in technology"
  },
  {
    id: 8,
    title: "Harness the Power of Data and AI",
    date: "August 29, 2024",
    category: "workshops",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d5745b61e76397cc18bc7f_Harness%20the%20power%20of%20data%20and%20AI.png",
    aspectRatio: "landscape",
    tags: ["AI", "Data Science"],
    description: "Workshop on leveraging data and AI for innovation"
  },
  {
    id: 9,
    title: "F&P Hackathon",
    date: "July 26, 2024",
    category: "events",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66acb041bbdbd2a1c9e5e353_F%26P%20Hackathon%20with%20She%23-p-500.png",
    aspectRatio: "portrait",
    tags: ["Hackathon", "Innovation"],
    description: "Fisher & Paykel Hackathon fostering innovation and collaboration"
  }
];

const categories = [
  { value: "all", label: "All Photos", icon: Camera },
  { value: "events", label: "Events", icon: Users },
  { value: "conferences", label: "Conferences", icon: Award },
  { value: "workshops", label: "Workshops", icon: Users },
  { value: "celebrations", label: "Celebrations", icon: Award }
];

export function GalleryGridSection() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<typeof galleryItems[0] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredItems = selectedCategory === "all" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  const handlePrevious = () => {
    if (!selectedImage) return;
    const currentIndex = galleryItems.findIndex(item => item.id === selectedImage.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : galleryItems.length - 1;
    setSelectedImage(galleryItems[previousIndex]);
  };

  const handleNext = () => {
    if (!selectedImage) return;
    const currentIndex = galleryItems.findIndex(item => item.id === selectedImage.id);
    const nextIndex = currentIndex < galleryItems.length - 1 ? currentIndex + 1 : 0;
    setSelectedImage(galleryItems[nextIndex]);
  };

  return (
    <Section bgColor="accent">
      <Container size="full">
        {/* Tabs for categories */}
        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="mb-12">
          <TabsList className="w-full justify-start flex-wrap h-auto p-1 bg-muted">
            {categories.map((category) => (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className="data-[state=active]:bg-background data-[state=active]:text-foreground flex items-center gap-2"
              >
                <category.icon className="h-4 w-4" />
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-8">
            {/* Masonry Grid */}
            <div className={layoutClasses(
              layoutSystem.grids.masonry.base,
              layoutSystem.grids.masonry.gap,
              "space-y-4"
            )}>
              {filteredItems.map((item, index) => (
                <Card 
                  key={item.id} 
                  className={`break-inside-avoid group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-150 border-0 ${
                    item.aspectRatio === 'portrait' ? 'aspect-[3/4]' : 
                    item.aspectRatio === 'square' ? 'aspect-square' : 
                    'aspect-[16/9]'
                  }`}
                  onClick={() => setSelectedImage(item)}
                >
                  <div className="relative h-full">
                    {loading ? (
                      <Skeleton className="w-full h-full" />
                    ) : (
                      <>
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-opacity duration-150"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-foreground/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-background">
                            <div className="flex gap-2 mb-2">
                              {item.tags.map((tag) => (
                                <Badge key={tag} className="bg-muted text-foreground text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{item.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-background/80">
                              <CalendarDays className="h-3 w-3" />
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Lightbox Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/95">
            <DialogTitle className="sr-only">{selectedImage?.title}</DialogTitle>
            <DialogDescription className="sr-only">{selectedImage?.description}</DialogDescription>
            
            <div className="relative">
              {/* Close button */}
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 z-50 text-background hover:bg-background/20"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Navigation buttons */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-background hover:bg-background/20"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-background hover:bg-background/20"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              {/* Image */}
              <div className="relative w-full h-[80vh]">
                {selectedImage && (
                  <Image
                    src={selectedImage.image}
                    alt={selectedImage.title}
                    fill
                    className="object-contain"
                    sizes="90vw"
                  />
                )}
              </div>

              {/* Image details */}
              {selectedImage && (
                <div className="absolute bottom-0 left-0 right-0 bg-foreground/90 p-8 text-background">
                  <div className="flex gap-2 mb-3">
                    {selectedImage.tags.map((tag) => (
                      <Badge key={tag} className="bg-muted text-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{selectedImage.title}</h3>
                  <p className="text-background/80 mb-2">{selectedImage.description}</p>
                  <div className="flex items-center gap-2 text-sm text-background/60">
                    <CalendarDays className="h-4 w-4" />
                    <span>{selectedImage.date}</span>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </Container>
    </Section>
  );
}