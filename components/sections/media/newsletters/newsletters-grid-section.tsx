"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Calendar, Download, Eye, ArrowRight, Filter } from "lucide-react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";
import {
  newsletters,
  getFeaturedNewsletters,
  getAllNewsletterYears,
} from "@/lib/data/newsletters";
import type { Newsletter } from "@/types/newsletter";

const years = getAllNewsletterYears();

export function NewslettersGridSection() {
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [loading, setLoading] = useState(true);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredNewsletters = selectedYear === "All Years"
    ? newsletters
    : newsletters.filter(n => n.year === selectedYear);

  const featuredNewsletters = getFeaturedNewsletters();

  return (
    <Section bgColor="white">
      <Container size="wide">
        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-dark">Browse Archive</h2>
          
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px] border-navy-dark/20 focus:border-navy-dark">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Years">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Featured Section */}
        {selectedYear === "All Years" && (
          <div className="mb-16">
            <Badge className="mb-4 bg-navy-dark text-white">Latest Issues</Badge>
            <div className={layoutClasses(
              "grid",
              layoutSystem.grids.content.cols1,
              layoutSystem.grids.content.cols2,
              layoutSystem.grids.content.gap
            )}>
              {featuredNewsletters.map((newsletter) => (
                <Card key={newsletter.slug} className="group overflow-hidden border-2 border-navy-light hover:border-navy-dark transition-all">
                  <div className="relative">
                    <AspectRatio ratio={3/4}>
                      {loading ? (
                        <Skeleton className="w-full h-full" />
                      ) : (
                        <Image
                          src={newsletter.coverImage}
                          alt={`${newsletter.month} ${newsletter.year} Newsletter`}
                          fill
                          className="object-cover"
                        />
                      )}
                    </AspectRatio>
                    <div className="absolute inset-0 bg-navy-dark/80 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {newsletter.month} {newsletter.year}
                        </h3>
                        <div className="flex gap-2 mb-4">
                          <Badge variant="secondary" className="bg-white/20 text-white border-0">
                            Featured Issue
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gray mb-3">
                      <Calendar className="h-4 w-4" />
                      <span>{newsletter.month} {newsletter.year}</span>
                    </div>
                    
                    <h4 className="font-semibold text-lg text-navy-dark mb-3">In This Issue:</h4>
                    <ul className="space-y-1 mb-4">
                      {newsletter.highlights.map((highlight, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-purple-dark mt-1">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex gap-3">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="flex-1 border-navy-dark text-navy-dark hover:bg-navy-light"
                            onClick={() => setSelectedNewsletter(newsletter)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-xl">
                          <SheetHeader>
                            <SheetTitle className="text-2xl font-bold text-navy-dark">
                              {selectedNewsletter?.month} {selectedNewsletter?.year} Newsletter
                            </SheetTitle>
                          </SheetHeader>
                          <div className="mt-6 space-y-6">
                            <AspectRatio ratio={3/4}>
                              <Image
                                src={selectedNewsletter?.coverImage || ""}
                                alt="Newsletter preview"
                                fill
                                className="object-cover rounded-lg"
                              />
                            </AspectRatio>
                            <div>
                              <h4 className="font-semibold mb-2">Featured Topics:</h4>
                              <ul className="space-y-2">
                                {selectedNewsletter?.highlights.map((highlight, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-purple-dark">→</span>
                                    <span>{highlight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <Button asChild className="w-full bg-navy-dark hover:bg-navy-dark/90">
                              <a href={selectedNewsletter?.webUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Download Full Newsletter
                              </a>
                            </Button>
                          </div>
                        </SheetContent>
                      </Sheet>
                      
                      <Button asChild className="flex-1 bg-navy-dark hover:bg-navy-dark/90 text-white">
                        <a href={newsletter.webUrl} target="_blank" rel="noopener noreferrer">
                          Read Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Masonry Grid */}
        <div className={layoutClasses(
          layoutSystem.grids.masonry.base,
          layoutSystem.grids.masonry.gap,
          "space-y-6"
        )}>
          {filteredNewsletters.map((newsletter, index) => (
            <Card
              key={newsletter.slug} 
              className={`break-inside-avoid group overflow-hidden hover:shadow-xl transition-all border-2 hover:border-navy-dark ${
                index % 3 === 0 ? 'border-purple-light' : 
                index % 3 === 1 ? 'border-periwinkle-light' : 
                'border-mint-light'
              }`}
            >
              <div className="relative">
                <AspectRatio ratio={3/4}>
                  {loading ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <Image
                      src={newsletter.coverImage}
                      alt={`${newsletter.month} ${newsletter.year} Newsletter`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-150"
                    />
                  )}
                </AspectRatio>

                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-navy-dark">
                    {newsletter.month} {newsletter.year}
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-navy-dark mb-3 group-hover:text-purple-dark transition-colors">
                  {newsletter.month} {newsletter.year} Issue
                </h3>

                <div className="space-y-3">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-navy-dark/30 text-navy-dark hover:bg-navy-light"
                        onClick={() => setSelectedNewsletter(newsletter)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Quick Preview
                      </Button>
                    </SheetTrigger>
                  </Sheet>

                  <Button asChild className="w-full bg-navy-dark hover:bg-navy-dark/90 text-white">
                    <a href={newsletter.webUrl} className="inline-flex items-center justify-center">
                      Read Full Issue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}