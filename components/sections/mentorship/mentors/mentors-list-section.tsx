"use client";

import { useState, useMemo, useEffect } from "react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MentorCard } from "@/components/mentorship/mentor-card";
import { MentorCardMobile } from "@/components/mentorship/mentor-card-mobile";
import { MentorFilters, FilterState } from "@/components/mentorship/mentor-filters";
import { mentors, getMentorCategories } from "@/lib/data/mentors";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

export function MentorsListSection() {
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    industry: "all",
    expertise: [],
    experience: "all",
    availability: "all",
  });
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    // Simulate loading for skeleton
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredMentors = useMemo(() => {
    let result = [...mentors];

    // Filter by category/tab
    if (activeTab !== "all") {
      result = result.filter(mentor => 
        mentor.industry.toLowerCase().includes(activeTab.toLowerCase())
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(mentor =>
        mentor.name.toLowerCase().includes(searchLower) ||
        mentor.role.toLowerCase().includes(searchLower) ||
        mentor.company.toLowerCase().includes(searchLower) ||
        mentor.expertise.some(e => e.toLowerCase().includes(searchLower))
      );
    }

    // Filter by industry
    if (filters.industry !== "all") {
      result = result.filter(mentor => mentor.industry === filters.industry);
    }

    // Filter by expertise
    if (filters.expertise.length > 0) {
      result = result.filter(mentor =>
        filters.expertise.some(skill => mentor.expertise.includes(skill))
      );
    }

    // Filter by experience
    if (filters.experience !== "all") {
      result = result.filter(mentor => {
        const years = mentor.yearsOfExperience;
        switch (filters.experience) {
          case "0-5": return years >= 0 && years <= 5;
          case "5-10": return years > 5 && years <= 10;
          case "10-15": return years > 10 && years <= 15;
          case "15+": return years > 15;
          default: return true;
        }
      });
    }

    // Filter by availability
    if (filters.availability !== "all") {
      result = result.filter(mentor => mentor.availability === filters.availability);
    }

    return result;
  }, [activeTab, filters]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Section id="mentors-list" className="py-16 bg-background">
      <Container>
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              EXPLORE OUR MENTORS
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with experienced professionals across various industries who are passionate about guiding the next generation of women in STEM.
            </p>
          </div>

          <MentorFilters 
            onFiltersChange={setFilters} 
            totalResults={filteredMentors.length}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex-wrap h-auto p-1 bg-muted text-muted-foreground">
              {getMentorCategories().map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2"
                >
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.name}</span>
                  <span className="text-xs opacity-70">({category.mentorCount})</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-8">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[3/4] rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {filteredMentors.length > 0 ? (
                    <motion.div
                      variants={container}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                      {filteredMentors.map((mentor) => (
                        <motion.div key={mentor.id} variants={item}>
                          {isMobile ? (
                            <MentorCardMobile mentor={mentor} />
                          ) : (
                            <MentorCard mentor={mentor} />
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12"
                    >
                      <p className="text-lg text-muted-foreground mb-4">
                        No mentors found matching your criteria.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or search terms.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </Section>
  );
}