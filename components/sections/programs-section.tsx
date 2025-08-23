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
import Iridescence, { brandColors } from "@/components/effects/iridescence";

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

// 即将举行的重点活动（从原EventsSection提取核心内容）
const nextEvent = {
  title: "THRIVE: Your Career, Your Story",
  date: "March 15, 2025",
  time: "6:00 PM - 8:30 PM", 
  location: "Auckland CBD",
  type: "Networking",
  attendees: 150,
  image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
  description: "An evening of inspiring stories and career insights from women leaders in tech."
};

export function ProgramsSection() {
  return (
    <Section className="relative bg-gradient-to-b from-white to-gray-50 py-16 md:py-20">
      {/* Background effect */}
      <div className="absolute inset-0 opacity-15">
        <Iridescence
          color={brandColors.eventsMinty}
          mouseReact={false}
          amplitude={0.06}
          speed={0.2}
          className="w-full h-full"
        />
      </div>
      
      <Container size="wide" className="relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark mb-6">
            How We Support You
          </h2>
          <p className="text-lg text-gray max-w-3xl mx-auto">
            Three comprehensive programs designed to accelerate your tech career through 
            networking, guidance, and skill development.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
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
                      Learn more about our programs at upcoming events
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Featured Next Event */}
        <Card className="overflow-hidden border-2 border-purple-light shadow-lg">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative">
              <AspectRatio ratio={16/10}>
                <Image
                  src={nextEvent.image}
                  alt={nextEvent.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </AspectRatio>
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <Badge className="w-fit mb-3 bg-purple-dark text-white">
                🎉 Next Event
              </Badge>
              <h3 className="text-xl md:text-2xl font-bold text-navy-dark mb-2">
                {nextEvent.title}
              </h3>
              <div className="space-y-1 text-sm text-gray mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {nextEvent.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {nextEvent.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {nextEvent.location}
                </div>
              </div>
              <p className="text-gray mb-6">
                {nextEvent.description}
              </p>
              <Button
                asChild
                size="lg"
                className="w-fit bg-purple-dark hover:bg-purple-mid"
              >
                <Link href="/events/1">
                  Register Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
