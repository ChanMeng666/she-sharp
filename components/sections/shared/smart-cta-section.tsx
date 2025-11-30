"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Calendar, Users, Briefcase, Mail, BookOpen, Mic, GraduationCap, UserPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

// Define page-specific CTA configurations
const pageConfigs = {
  "/": [
    {
      icon: Heart,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Support Our Mission",
      description: "Help us empower more young women to pursue careers in STEM",
      buttonText: "Donate Now",
      buttonVariant: "default" as const,
      href: "/donate",
    },
    {
      icon: Calendar,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Join Our Events",
      description: "Network with professionals and learn new skills",
      buttonText: "Explore Events",
      buttonVariant: "default" as const,
      href: "/events",
    },
    {
      icon: Users,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Become a Volunteer",
      description: "Share your expertise and make a difference",
      buttonText: "Join Our Team",
      buttonVariant: "outline" as const,
      href: "/join-our-team",
    },
  ],
  "/about": [
    {
      icon: Users,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Join Our Mission",
      description: "Be part of our journey to empower women in STEM",
      buttonText: "Become a Volunteer",
      buttonVariant: "default" as const,
      href: "/join-our-team",
    },
    {
      icon: Briefcase,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Partner With Us",
      description: "Support diversity in tech through corporate partnership",
      buttonText: "Explore Partnership",
      buttonVariant: "default" as const,
      href: "/sponsors/corporate-sponsorship",
    },
  ],
  "/events": [
    {
      icon: Calendar,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Host an Event",
      description: "Partner with us to create impactful STEM events",
      buttonText: "Become a Sponsor",
      buttonVariant: "default" as const,
      href: "/sponsors/corporate-sponsorship",
    },
    {
      icon: Mail,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Never Miss an Event",
      description: "Subscribe to get notified about upcoming events",
      buttonText: "Subscribe Now",
      buttonVariant: "default" as const,
      href: "/media/newsletters",
    },
  ],
  "/mentorship": [
    {
      icon: GraduationCap,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Become a Mentee",
      description: "Join the program and get matched with a mentor.",
      buttonText: "Join as Mentee",
      buttonVariant: "default" as const,
      href: "/mentorship/join",
    },
    {
      icon: UserPlus,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Become a Mentor",
      description: "Share your experience and guide others.",
      buttonText: "Apply as Mentor",
      buttonVariant: "outline" as const,
      href: "/mentorship/become-a-mentor",
    },
  ],
  "/mentorship/mentors": [
    {
      icon: GraduationCap,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Ready to Make an Impact?",
      description: "Join our community of inspiring mentors",
      buttonText: "Apply as Mentor",
      buttonVariant: "default" as const,
      href: "/mentorship/become-a-mentor",
    },
    {
      icon: BookOpen,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Looking for a Mentor?",
      description: "Join the program to get matched",
      buttonText: "Join as Mentee",
      buttonVariant: "outline" as const,
      href: "/mentorship/join",
    },
  ],
  "/mentorship/mentee": [
    {
      icon: UserPlus,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Ready to Grow?",
      description: "Take the first step towards your career goals",
      buttonText: "Join the Program",
      buttonVariant: "default" as const,
      href: "/mentorship/join",
    },
    {
      icon: Users,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Meet Our Mentors",
      description: "Explore our diverse community of industry experts",
      buttonText: "View Mentors",
      buttonVariant: "outline" as const,
      href: "/mentorship/mentors",
    },
  ],
  "/mentorship/join": [
    {
      icon: Users,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Meet Our Mentors",
      description: "See who you could be matched with",
      buttonText: "View Mentors",
      buttonVariant: "default" as const,
      href: "/mentorship/mentors",
    },
    {
      icon: BookOpen,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Learn More",
      description: "Discover how the program works",
      buttonText: "Program Overview",
      buttonVariant: "outline" as const,
      href: "/mentorship",
    },
  ],
  "/mentorship/become-a-mentor": [
    {
      icon: Users,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Meet Our Mentors",
      description: "See our current mentor community",
      buttonText: "View Mentors",
      buttonVariant: "default" as const,
      href: "/mentorship/mentors",
    },
    {
      icon: BookOpen,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Program Overview",
      description: "Learn how our mentorship works",
      buttonText: "Learn More",
      buttonVariant: "outline" as const,
      href: "/mentorship",
    },
  ],
  "/media": [
    {
      icon: Mail,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Stay Connected",
      description: "Get the latest updates and inspiring stories",
      buttonText: "Subscribe to Newsletter",
      buttonVariant: "default" as const,
      href: "/media/newsletters",
    },
    {
      icon: Mic,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Share Your Story",
      description: "Be featured in our podcast or media coverage",
      buttonText: "Contact Us",
      buttonVariant: "outline" as const,
      href: "/contact",
    },
  ],
  "/donate": [
    {
      icon: Calendar,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "See Your Impact",
      description: "Join us at our next event to see your donation in action",
      buttonText: "View Events",
      buttonVariant: "default" as const,
      href: "/events",
    },
    {
      icon: Briefcase,
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      title: "Corporate Giving",
      description: "Explore partnership opportunities for greater impact",
      buttonText: "Learn More",
      buttonVariant: "default" as const,
      href: "/sponsors/corporate-sponsorship",
    },
  ],
};

// Default CTA for pages without specific config
const defaultCTA = [
  {
    icon: Heart,
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    title: "Support Our Mission",
    description: "Help us empower women in STEM",
    buttonText: "Donate Now",
    buttonVariant: "default" as const,
    href: "/donate",
  },
  {
    icon: Calendar,
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    title: "Join Our Community",
    description: "Attend events and connect with like-minded women",
    buttonText: "Explore Events",
    buttonVariant: "default" as const,
    href: "/events",
  },
];

interface SmartCTASectionProps {
  title?: string;
  className?: string;
  bgColor?: "white" | "light" | "accent" | "dark";
}

export function SmartCTASection({ 
  title = "Take the Next Step",
  className,
  bgColor = "light"
}: SmartCTASectionProps) {
  const pathname = usePathname();
  
  // Get page-specific CTAs or use default
  const ctaItems = pageConfigs[pathname as keyof typeof pageConfigs] || defaultCTA;
  
  return (
    <Section className={cn("relative bg-foreground py-16 md:py-20", className)}>
      {/* Iridescence Background for CTA */}
      <div className="absolute inset-0 opacity-35">
        {/* <Iridescence
          color={brandColors.ctaSoftMint}
          mouseReact={false}
          amplitude={0.12}
          speed={0.3}
          className="w-full h-full"
        /> */}
      </div>
      
      <Container className="relative z-10">
        <AnimateOnScroll variant="fade-up" className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-background">
            {title}
          </h2>
        </AnimateOnScroll>
        
        <div className={cn(
          "grid gap-8",
          ctaItems.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "md:grid-cols-3 max-w-5xl mx-auto"
        )}>
          {ctaItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <AnimateOnScroll
                key={index}
                variant="fade-up"
                delay={index * 100}
              >
              <Card className="text-center hover:shadow-lg transition-shadow duration-150 bg-background/10 backdrop-blur-sm border border-background/20 hover:border-background/50">
                <CardContent className="p-8">
                  <div className={cn(
                    "w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center",
                    "bg-background/20"
                  )}>
                    <Icon className={cn("w-8 h-8", "text-background")} />
                  </div>
                  <h3 className="text-xl font-semibold text-background mb-4">
                    {item.title}
                  </h3>
                  <p className="text-background/80 mb-6">
                    {item.description}
                  </p>
                  <Button
                    asChild
                    variant={item.buttonVariant}
                  >
                    <Link href={item.href}>{item.buttonText}</Link>
                  </Button>
                </CardContent>
              </Card>
              </AnimateOnScroll>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}