"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Building2, ArrowRight, Users, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const mentors = [
  {
    id: 1,
    name: "Aishvarya Saraf",
    role: "Human Resources Manager (Advisory)",
    company: "Fiserv",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65f0b7c3161799543612526c_Aishvarya%20Photo.jpg",
    description: "Aishvarya, a Human Resources Manager at Fiserv, has a people-centric approach and believes in the correlation between employee satisfaction and business success.",
    expertise: ["HR Strategy", "People Management", "Career Development"],
    experience: "15+ years",
    mentees: 12,
    rating: 4.9
  },
  {
    id: 2,
    name: "Alana Hoponoa",
    role: "Cloud Services, Sales and FinOps Consultant",
    company: "OSS Group Ltd",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66e4f54c5fb03ae45239d90e_Alana%20Photo.jpg",
    description: "Alana is a passionate and driven ICT professional, currently working as a Cloud Services, Sales, and FinOps consultant with expertise in cloud transformation.",
    expertise: ["Cloud Architecture", "FinOps", "Sales Strategy"],
    experience: "10+ years",
    mentees: 8,
    rating: 4.8
  },
  {
    id: 3,
    name: "Anshu Maharaj",
    role: "Product Manager",
    company: "MYOB",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65f7d581ab77ff98f436f102_Anshu%20Photo.jpg",
    description: "Anshu is a highly experienced product manager with over 20 years of experience in managing products for Enterprise SaaS companies.",
    expertise: ["Product Strategy", "SaaS", "Agile"],
    experience: "20+ years",
    mentees: 15,
    rating: 5.0,
    featured: true
  },
  {
    id: 4,
    name: "Donna Chamberlain",
    role: "Senior Business Solutions Manager",
    company: "Fisher & Paykel Healthcare",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65e53d5bb5ef17c52bf98dcf_Donna%20Photo.jpg",
    description: "Donna Chamberlain, as Senior Business Solutions Manager at Fisher & Paykel Healthcare and NZSUG Treasurer, expertly bridges technology and business needs.",
    expertise: ["Business Solutions", "Healthcare Tech", "Digital Transformation"],
    experience: "18+ years",
    mentees: 10,
    rating: 4.9
  }
];

export function MentorsPreviewSection() {
  const [isLoading] = useState(false);

  return (
    <Section className="py-16 md:py-24 bg-gradient-to-b from-white to-purple-light/10 dark:from-gray-950 dark:to-purple-dark/5">
      <Container>
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-dark/10 text-purple-dark border-purple-dark">
            <Users className="w-3 h-3 mr-1" />
            150+ Expert Mentors
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white mb-4">
            Meet Some of Our Mentors
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Industry leaders committed to guiding the next generation of women in tech
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
          {mentors.slice(0, 3).map((mentor, index) => (
            <div key={mentor.id} className="relative">
              {isLoading ? (
                <Card className="overflow-hidden aspect-square" />
              ) : (
                <Card className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${mentor.featured ? 'ring-2 ring-purple-dark' : ''}`}>
                      {mentor.featured && (
                        <Badge className="absolute top-4 right-4 z-10 bg-purple-dark text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      
                      <AspectRatio ratio={1}>
                        <Image
                          src={mentor.image}
                          alt={mentor.name}
                          fill
                          className="object-cover"
                        />
                        {/* overlays removed for simplicity */}
                      </AspectRatio>
                      
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div>
                            <h3 className="font-semibold text-navy dark:text-white line-clamp-1">
                              {mentor.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                              {mentor.role}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" />
                              {mentor.company}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {mentor.expertise.slice(0, 2).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs bg-periwinkle-light/50 text-navy dark:bg-periwinkle-dark/20 dark:text-periwinkle-light border-0">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-purple-dark hover:bg-purple-mid text-white">
              <Link href="/mentorship/mentors">
                View All Mentors
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Can't find the right mentor? We'll help match you with the perfect guide for your journey.
          </p>
        </div>
      </Container>
    </Section>
  );
}