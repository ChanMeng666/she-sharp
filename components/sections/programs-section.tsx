"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { 
  Calendar, 
  Users, 
  GraduationCap, 
  ArrowRight, 
  Clock, 
  MapPin,
  MessageCircle,
  BookOpen,
  Briefcase
} from "lucide-react";
// Removed animated background for calmer reading experience

// 三大核心项目
const programs = [
  {
    id: "events",
    title: "Events & Networking",
    subtitle: "Connect with peers and industry leaders",
    description: "Join our monthly events, workshops, and conferences designed to build meaningful professional relationships and expand your network in the tech industry.",
    icon: Calendar,
    color: "purple",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    features: [
      { icon: Users, text: "Monthly networking meetups" },
      { icon: MessageCircle, text: "Industry panel discussions" },
      { icon: Calendar, text: "Annual THRIVE conference" }
    ],
    stats: { primary: "Monthly", secondary: "Events hosted" },
    cta: { text: "View Upcoming Events", href: "/events" },
    highlight: "Next event: March 15"
  },
  {
    id: "mentorship",
    title: "Mentorship Program",
    subtitle: "Accelerate your career with guidance",
    description: "Get paired with experienced professionals who understand your journey. Our structured mentorship program provides personalized guidance for career advancement.",
    icon: Users,
    color: "periwinkle", 
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    features: [
      { icon: Users, text: "1-on-1 mentor matching" },
      { icon: Calendar, text: "Structured 6-month programs" },
      { icon: Briefcase, text: "Career transition support" }
    ],
    stats: { primary: "6-Month", secondary: "Programs" },
    cta: { text: "Apply for Mentorship", href: "/mentorship" },
    highlight: "Applications open"
  },
  {
    id: "skills",
    title: "Skills Development",
    subtitle: "Build expertise through hands-on learning",
    description: "Enhance your technical and professional skills through workshops, online courses, and hands-on projects designed specifically for women in tech.",
    icon: GraduationCap,
    color: "mint",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    features: [
      { icon: BookOpen, text: "Technical workshops" },
      { icon: GraduationCap, text: "Professional development" },
      { icon: Users, text: "Peer learning groups" }
    ],
    stats: { primary: "Weekly", secondary: "Workshops" },
    cta: { text: "Explore Workshops", href: "/events?type=workshop" },
    highlight: "New courses monthly"
  }
];

// Removed internal Next Event to avoid duplication with highlight section

export function ProgramsSection() {
  return (
    <Section>
      <Container size="wide">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark mb-6">
            Your Path to Success
          </h2>
          <p className="text-lg text-gray max-w-3xl mx-auto">
            Three proven pathways designed to accelerate your career advancement through 
            strategic networking, expert guidance, and continuous skill development.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {programs.map((program, index) => {
            const Icon = program.icon;
            const isLarge = index === 0; // First program gets featured treatment
            
            return (
              <Card 
                key={program.id}
                className={`overflow-hidden hover:shadow-xl transition-all duration-300 group ${
                  isLarge ? "lg:col-span-2 lg:row-span-1" : ""
                }`}
              >
                {/* Program Image */}
                <div className="relative h-48 overflow-hidden">
                  <AspectRatio ratio={isLarge ? 3/2 : 4/3}>
                    <Image
                      src={program.image}
                      alt={program.title}
                      fill
                      sizes={isLarge ? "(max-width: 1024px) 100vw, 67vw" : "(max-width: 1024px) 100vw, 33vw"}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </AspectRatio>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Highlight badge */}
                  {program.highlight && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-navy-dark border-0">
                        {program.highlight}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Stats overlay */}
                  <div className="absolute bottom-4 right-4 text-right">
                    <div className="text-white">
                      <div className="text-2xl font-bold">{program.stats.primary}</div>
                      <div className="text-sm opacity-90">{program.stats.secondary}</div>
                    </div>
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-full ${
                      program.color === "purple" ? "bg-purple-light/20" :
                      program.color === "periwinkle" ? "bg-periwinkle-light/20" :
                      "bg-mint-light/20"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        program.color === "purple" ? "text-purple-dark" :
                        program.color === "periwinkle" ? "text-periwinkle-dark" :
                        "text-mint-dark"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{program.title}</CardTitle>
                      <CardDescription className="text-sm">{program.subtitle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray mb-4 leading-relaxed">
                    {program.description}
                  </p>
                  
                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {program.features.map((feature, featureIndex) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <li key={featureIndex} className="flex items-center gap-2">
                          <FeatureIcon className="w-4 h-4 text-gray flex-shrink-0" />
                          <span className="text-sm text-gray">{feature.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                  
                  <div className="text-center">
                    <span className="text-sm text-gray italic">
                      Discover these programs through our regular activities
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Next event moved to UpcomingEventSection to avoid duplication */}
      </Container>
    </Section>
  );
}
