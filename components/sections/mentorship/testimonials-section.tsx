"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Quote, Briefcase, Calendar, ExternalLink } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const testimonials = [
  {
    id: 1,
    quote: "From the first meeting with Meeta, she was inspiring, both personally and professionally. Her humble yet professional attitude made me comfortable with a feeling of being heard.",
    fullStory: "From the first meeting with Meeta, she was inspiring, both personally and professionally. Her humble yet professional attitude made me comfortable with a feeling of being heard. Her insights and experience of the job market, industries and people, provided me with with clarity and direction. The encouragement and assurance that I was on the right track, to continue to persevere and and embrace challenges is one that I will continue to keep with me as I journey forward. I would like to take this moment to say a ''Thank you'' ( but one that does not end there), for your grace and positivity. Looking forward to staying in touch, to sharing our experiences and knowledge.",
    mentee: {
      name: "Fay Fialho",
      role: "Product Manager",
      company: "Tech Innovations Ltd",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fay",
      journey: "6 months in the program"
    },
    mentor: {
      name: "Meeta Patel",
      role: "Senior Director",
      company: "Global Tech Corp",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Meeta"
    },
    highlights: ["Career Direction", "Industry Insights", "Professional Growth"]
  },
  {
    id: 2,
    quote: "This initiative has truly been a taonga (treasure) for both mentors and mentees, offering invaluable opportunities for growth, guidance, and connection.",
    fullStory: "What a successful completion of She Sharp first mentorship cohort of 2024! This initiative has truly been a taonga (treasure) for both mentors and mentees, offering invaluable opportunities for growth, guidance, and connection. 🌟 A shoutout to my incredible She Sharp mentor, Anshu Maharaj, whose support has been instrumental in my journey, enabling me to grow in my Product Owner role. This journey so far has allowed me to grow but has also empowered me to build an efficient toolbox. It has equipped me with the skills and insights needed to navigate challenges with confidence, and I aim to continue applying these tools to make an impact in all aspects moving forward.",
    mentee: {
      name: "Shweta Sharma",
      role: "Product Owner",
      company: "Innovation Hub NZ",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shweta",
      journey: "Completed 2024 Cohort"
    },
    mentor: {
      name: "Anshu Maharaj",
      role: "Product Manager",
      company: "MYOB",
      image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65f7d581ab77ff98f436f102_Anshu%20Photo.jpg"
    },
    highlights: ["Leadership Skills", "Product Strategy", "Confidence Building"]
  },
  // trimmed to two quotes for lighter section
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <Section className="py-16 md:py-24 bg-gradient-to-br from-periwinkle-light/20 via-white to-mint-light/20 dark:from-periwinkle-dark/5 dark:via-gray-950 dark:to-mint-dark/5">
      <Container>
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-dark/10 text-purple-dark border-purple-dark">
            Success Stories
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white mb-4">
            Hear From Our Community
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Real stories from mentees and mentors who've transformed their careers through our program
          </p>
        </div>
        
        <div className="mx-auto max-w-5xl">
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-0">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Mentee Info */}
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-16 w-16 border-2 border-purple-dark/20">
                    <AvatarImage src={current.mentee.image} alt={current.mentee.name} />
                    <AvatarFallback>{current.mentee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mentee</p>
                    <h3 className="font-semibold text-navy dark:text-white">{current.mentee.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{current.mentee.role}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{current.mentee.company}</p>
                  </div>
                </div>
                
                {/* Journey Badge */}
                <Badge variant="outline" className="border-mint-dark text-navy dark:text-mint-dark">
                  <Calendar className="w-3 h-3 mr-1" />
                  {current.mentee.journey}
                </Badge>
                
                {/* Mentor Info */}
                <div className="flex items-center gap-4 flex-1 md:justify-end">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mentor</p>
                    <h3 className="font-semibold text-navy dark:text-white">{current.mentor.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{current.mentor.role}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{current.mentor.company}</p>
                  </div>
                  <Avatar className="h-16 w-16 border-2 border-periwinkle-dark/20">
                    <AvatarImage src={current.mentor.image} alt={current.mentor.name} />
                    <AvatarFallback>{current.mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <Quote className="w-12 h-12 text-purple-light dark:text-purple-dark/30 mb-4" />
              <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-6 italic leading-relaxed">
                {current.quote}
              </blockquote>
              
              {/* Highlights */}
              <div className="flex flex-wrap gap-2 mb-6">
                {current.highlights.map((highlight) => (
                  <Badge key={highlight} variant="secondary" className="bg-purple-light/50 text-purple-dark border-purple-dark/20">
                    {highlight}
                  </Badge>
                ))}
              </div>
              
              {/* Read more removed for simplicity */}
            </CardContent>
          </Card>
          
          {/* Navigation */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              onClick={prevTestimonial}
              variant="outline"
              size="icon"
              className="rounded-full border-purple-dark/20 hover:bg-purple-light"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 transition-all duration-300 rounded-full ${
                    index === currentIndex 
                      ? "w-8 bg-purple-dark" 
                      : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
            
            <Button
              onClick={nextTestimonial}
              variant="outline"
              size="icon"
              className="rounded-full border-purple-dark/20 hover:bg-purple-light"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Container>
      
      {/* Full story dialog removed for simplicity */}
    </Section>
  );
}