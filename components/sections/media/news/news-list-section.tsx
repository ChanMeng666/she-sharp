"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Trophy, Newspaper, Calendar, ExternalLink, Share2, Award, FileText, Mic } from "lucide-react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const newsItems = [
  {
    id: 1,
    title: "2024 New Zealand Community of the Year Semi-Finalists",
    date: "January 2024",
    year: "2024",
    category: "awards",
    description: "She Sharp is proud to announce that our Founder/Director Mahsa McCauley was named as a Semi-Finalist in the New Zealand Community of the year.",
    fullContent: "This recognition highlights the impact She Sharp has made in bridging the gender gap in STEM fields across New Zealand. The award celebrates organizations and individuals who have made significant contributions to their communities through innovative programs and sustained commitment to positive change.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65a49c11fa8bb9093855aebd_nzcommunityAward.png",
    href: "#",
    featured: true
  },
  {
    id: 2,
    title: "Women in Security Award 2023",
    date: "November 2023",
    year: "2023",
    category: "awards",
    description: "SheSharp is proud to announce that our Founder/Director Mahsa McCauley was named as a the Unsung Heroes at the 2023 Women in Security Awards!",
    fullContent: "The Women in Security Awards recognize outstanding contributions to cybersecurity and technology security fields. Mahsa's recognition as an Unsung Hero highlights her dedication to creating pathways for women in tech security roles.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65bb25d48049d4f4ebdd3094_IMG_1468.jpg",
    href: "#",
    featured: true
  },
  {
    id: 3,
    title: "Finalists of Diversity Awards NZ",
    date: "August 2023",
    year: "2023",
    category: "awards",
    description: "She Sharp is proud to announce that our Founder/Director Mahsa McCauley, PhD was named as a Finalist of Diversity Awards NZ",
    fullContent: "Being named a finalist in the Diversity Awards NZ is a testament to She Sharp's commitment to creating inclusive technology spaces. The awards celebrate organizations and individuals championing diversity and inclusion across New Zealand.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65a49c7147224ebbb474faaa_Diversity%20Award.png",
    href: "#",
    featured: false
  },
  {
    id: 4,
    title: "Finalist in the Women Leading Tech Awards in the Mentor category",
    date: "March 2023",
    year: "2023",
    category: "awards",
    description: "She Sharp is proud to announce that our Founder/Director Mahsa McCauley, PhD was named as a Finalist in the Women Leading Tech...",
    fullContent: "The Women Leading Tech Awards recognize exceptional women who are making significant contributions to the technology sector. Mahsa's nomination in the Mentor category reflects her dedication to guiding and supporting the next generation of women in tech.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64938f0ed0bd98ba0f7a1c90_finalist-metor.png",
    href: "#",
    featured: false
  },
  {
    id: 5,
    title: "NZ Women in Security Awards",
    date: "November 2022",
    year: "2022",
    category: "awards",
    description: "She Sharp won in the \"Best Industry Initiative that Supports Diversity, Inclusion and Equality\" at the NZ Women in Security Awards 2022...",
    fullContent: "This prestigious award recognizes She Sharp's innovative programs and initiatives that have successfully promoted diversity, inclusion, and equality in the technology and security sectors. Our mentorship programs, workshops, and community events have created lasting impact.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64938e649e000b0c78a541b4_Image%204_3.png",
    href: "#",
    featured: false
  },
  {
    id: 6,
    title: "Featured in TechWomen NZ Magazine",
    date: "September 2023",
    year: "2023",
    category: "media",
    description: "She Sharp's mentorship program was featured in a 4-page spread discussing the impact of structured mentorship in tech careers...",
    fullContent: "TechWomen NZ Magazine highlighted She Sharp's innovative approach to mentorship, featuring success stories from our mentees and insights from our mentors. The article explored how structured mentorship programs can accelerate career growth and create lasting professional networks.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64938ce7a663b5f88ba36ea3_Press%20Tile%201_2021.png",
    href: "#",
    featured: false
  },
  {
    id: 7,
    title: "She Sharp Anniversary Coverage on National Radio",
    date: "October 2024",
    year: "2024",
    category: "media",
    description: "National Radio featured She Sharp's 10-year anniversary, discussing our journey and impact on women in tech...",
    fullContent: "In a special segment celebrating our 10-year milestone, National Radio interviewed Mahsa McCauley about She Sharp's evolution, the challenges faced, and the victories achieved in supporting women in technology. The segment reached over 500,000 listeners nationwide.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/649cb3689f78cd4c6f728bc6_Diversity%20Awards%20photo-min.jpg",
    href: "#",
    featured: false
  },
  {
    id: 8,
    title: "THRIVE Conference Success Story",
    date: "July 2024",
    year: "2024",
    category: "events",
    description: "She Sharp's THRIVE conference brought together 500+ attendees for a day of inspiration, learning, and networking...",
    fullContent: "THRIVE 2024 was our largest event to date, featuring keynote speakers from leading tech companies, hands-on workshops, and networking opportunities. The conference focused on career advancement, technical skills, and building confidence in technology careers.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64938e649e000b0c78a541b4_Image%204_3.png",
    href: "#",
    featured: false
  }
];

const categories = [
  { value: "all", label: "All News", icon: Newspaper },
  { value: "awards", label: "Awards", icon: Trophy },
  { value: "media", label: "Media Coverage", icon: Mic },
  { value: "events", label: "Event News", icon: Calendar }
];

const categoryColors: Record<string, string> = {
  awards: "bg-foreground text-background",
  media: "bg-foreground text-background",
  events: "bg-muted text-foreground"
};

export function NewsListSection() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredNews = selectedCategory === "all" 
    ? newsItems 
    : newsItems.filter(item => item.category === selectedCategory);

  const groupedByYear = filteredNews.reduce((acc, item) => {
    if (!acc[item.year]) acc[item.year] = [];
    acc[item.year].push(item);
    return acc;
  }, {} as Record<string, typeof newsItems>);

  const years = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  return (
    <Section bgColor="accent">
      <Container size="content">
        {/* Filter Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Filter by Category</h2>
          <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div key={category.value}>
                  <RadioGroupItem
                    value={category.value}
                    id={category.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={category.value}
                    className="flex items-center justify-center gap-2 rounded-lg border-2 border-border p-4 hover:border-border cursor-pointer peer-data-[state=checked]:border-border peer-data-[state=checked]:bg-muted transition-colors duration-150"
                  >
                    <category.icon className="h-5 w-5" />
                    <span className="font-medium">{category.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Timeline Layout */}
        <div className="relative">
          {/* Timeline line */}
          <div className={layoutClasses(
            "absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-muted",
            layoutSystem.patterns.timeline.line
          )} />

          {years.map((year, yearIndex) => (
            <div key={year} className="mb-16">
              {/* Year marker */}
              <div className="relative flex items-center justify-center mb-8">
                <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-muted rounded-full" />
                <Badge className="bg-foreground text-background text-lg px-4 py-2">
                  {year}
                </Badge>
              </div>

              {/* News items for this year */}
              <div className="space-y-8">
                {groupedByYear[year].map((item, index) => (
                  <div
                    key={item.id}
                    className={`relative flex items-start gap-8 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-8 md:left-1/2 w-3 h-3 bg-background border-2 border-muted rounded-full z-10" />

                    {/* Empty space for alternating layout */}
                    <div className="hidden md:block md:w-1/2" />

                    {/* Content card */}
                    <Card className="flex-1 ml-16 md:ml-0 md:w-1/2 hover:shadow-lg transition-shadow duration-150 border-2 hover:border-border">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          {item.image && (
                            <div className="relative w-full md:w-32 h-32 flex-shrink-0">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <Badge className={`mb-2 ${categoryColors[item.category]}`}>
                                  {categories.find(c => c.value === item.category)?.label}
                                </Badge>
                                <h3 className="text-xl font-semibold text-foreground">
                                  {item.title}
                                </h3>
                              </div>
                              {item.featured && (
                                <Award className="h-5 w-5 text-foreground flex-shrink-0" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <Calendar className="h-4 w-4" />
                              <span>{item.date}</span>
                            </div>

                            <p className="text-gray mb-4">{item.description}</p>

                            <Accordion
                              type="single"
                              collapsible
                              value={expandedItems.includes(item.id.toString()) ? item.id.toString() : ""}
                              onValueChange={(value) => {
                                setExpandedItems(prev => 
                                  value 
                                    ? [...prev.filter(id => id !== item.id.toString()), value]
                                    : prev.filter(id => id !== item.id.toString())
                                );
                              }}
                            >
                              <AccordionItem value={item.id.toString()} className="border-0">
                                <AccordionTrigger className="text-foreground hover:text-foreground/80 py-0">
                                  Read full story
                                </AccordionTrigger>
                                <AccordionContent className="pt-4">
                                  <p className="text-gray mb-4">{item.fullContent}</p>
                                  <div className="flex gap-3">
                                    <Button asChild variant="outline" className="flex-1">
                                      <Link href={item.href} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Source
                                      </Link>
                                    </Button>
                                    <Button variant="outline" size="icon">
                                      <Share2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}