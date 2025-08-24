"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Calendar, Users, Briefcase, Mail, BookOpen, Mic, GraduationCap, UserPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Iridescence, { brandColors } from "@/components/effects/iridescence";

// Define page-specific CTA configurations
const pageConfigs = {
  "/": [
    {
      icon: Heart,
      iconBg: "bg-purple-light/20",
      iconColor: "text-purple-dark",
      title: "Support Our Mission",
      description: "Help us empower more young women to pursue careers in STEM",
      buttonText: "Donate Now",
      buttonVariant: "default" as const,
      buttonClass: "",
      href: "/donate",
    },
    {
      icon: Calendar,
      iconBg: "bg-mint-light/20",
      iconColor: "text-mint-dark",
      title: "Join Our Events",
      description: "Network with professionals and learn new skills",
      buttonText: "Explore Events",
      buttonVariant: "accent" as const,
      buttonClass: "",
      href: "/events",
    },
    {
      icon: Users,
      iconBg: "bg-periwinkle-light/20",
      iconColor: "text-periwinkle-dark",
      title: "Become a Volunteer",
      description: "Share your expertise and make a difference",
      buttonText: "Join Our Team",
      buttonVariant: "secondary" as const,
      buttonClass: "",
      href: "/join-our-team",
    },
  ],
  "/about": [
    {
      icon: Users,
      iconBg: "bg-purple-light/20",
      iconColor: "text-purple-dark",
      title: "Join Our Mission",
      description: "Be part of our journey to empower women in STEM",
      buttonText: "Become a Volunteer",
      buttonVariant: "default" as const,
      buttonClass: "",
      href: "/join-our-team",
    },
    {
      icon: Briefcase,
      iconBg: "bg-mint-light/20",
      iconColor: "text-mint-dark",
      title: "Partner With Us",
      description: "Support diversity in tech through corporate partnership",
      buttonText: "Explore Partnership",
      buttonVariant: "accent" as const,
      buttonClass: "",
      href: "/sponsors/corporate-sponsorship",
    },
  ],
  "/events": [
    {
      icon: Calendar,
      iconBg: "bg-purple-light/20",
      iconColor: "text-purple-dark",
      title: "Host an Event",
      description: "Partner with us to create impactful STEM events",
      buttonText: "Become a Sponsor",
      buttonVariant: "default" as const,
      buttonClass: "",
      href: "/sponsors/corporate-sponsorship",
    },
    {
      icon: Mail,
      iconBg: "bg-mint-light/20",
      iconColor: "text-mint-dark",
      title: "Never Miss an Event",
      description: "Subscribe to get notified about upcoming events",
      buttonText: "Subscribe Now",
      buttonVariant: "accent" as const,
      buttonClass: "",
      href: "/media/newsletters",
    },
  ],
  "/mentorship": [
    {
      icon: GraduationCap,
      iconBg: "bg-purple-light/20",
      iconColor: "text-purple-dark",
      title: "Become a Mentor",
      description: "Share your experience and make an impact.",
      buttonText: "Apply as Mentor",
      buttonVariant: "default" as const,
      buttonClass: "bg-purple-dark hover:bg-purple-mid",
      href: "/mentorship/mentors",
    },
    {
      icon: UserPlus,
      iconBg: "bg-mint-light/20",
      iconColor: "text-mint-dark",
      title: "Find a Mentor",
      description: "Apply to get matched and accelerate growth.",
      buttonText: "Apply as Mentee",
      buttonVariant: "outline" as const,
      buttonClass: "border-mint-dark text-mint-dark hover:bg-mint-light",
      href: "/mentorship/mentee",
    },
  ],
  "/mentorship/mentors": [
    {
      icon: GraduationCap,
      iconBg: "bg-purple-light/20",
      iconColor: "text-purple-dark",
      title: "Ready to Make an Impact?",
      description: "Join our community of inspiring mentors",
      buttonText: "Start Application",
      buttonVariant: "default" as const,
      buttonClass: "bg-purple-dark hover:bg-purple-mid",
      href: "/contact",
    },
    {
      icon: BookOpen,
      iconBg: "bg-mint-light/20",
      iconColor: "text-mint-dark",
      title: "Learn About the Program",
      description: "Discover how our mentorship program works",
      buttonText: "Program Overview",
      buttonVariant: "outline" as const,
      buttonClass: "border-mint-dark text-mint-dark hover:bg-mint-light",
      href: "/mentorship",
    },
  ],
  "/mentorship/mentee": [
    {
      icon: UserPlus,
      iconBg: "bg-purple-light/20",
      iconColor: "text-purple-dark",
      title: "Ready to Grow?",
      description: "Take the first step towards your career goals",
      buttonText: "Apply Now",
      buttonVariant: "default" as const,
      buttonClass: "bg-purple-dark hover:bg-purple-mid",
      href: "/contact",
    },
    {
      icon: Users,
      iconBg: "bg-mint-light/20",
      iconColor: "text-mint-dark",
      title: "Meet Our Mentors",
      description: "Explore our diverse community of industry experts",
      buttonText: "View Mentors",
      buttonVariant: "outline" as const,
      buttonClass: "border-mint-dark text-mint-dark hover:bg-mint-light",
      href: "/mentorship/mentors",
    },
  ],
  "/media": [
    {
      icon: Mail,
      iconBg: "bg-purple-light/20",
      iconColor: "text-purple-dark",
      title: "Stay Connected",
      description: "Get the latest updates and inspiring stories",
      buttonText: "Subscribe to Newsletter",
      buttonVariant: "default" as const,
      buttonClass: "bg-purple-dark hover:bg-purple-mid",
      href: "/media/newsletters",
    },
    {
      icon: Mic,
      iconBg: "bg-mint-light/20",
      iconColor: "text-mint-dark",
      title: "Share Your Story",
      description: "Be featured in our podcast or media coverage",
      buttonText: "Contact Us",
      buttonVariant: "outline" as const,
      buttonClass: "border-mint-dark text-mint-dark hover:bg-mint-light",
      href: "/contact",
    },
  ],
  "/donate": [
    {
      icon: Calendar,
      iconBg: "bg-purple-light/20",
      iconColor: "text-purple-dark",
      title: "See Your Impact",
      description: "Join us at our next event to see your donation in action",
      buttonText: "View Events",
      buttonVariant: "default" as const,
      buttonClass: "",
      href: "/events",
    },
    {
      icon: Briefcase,
      iconBg: "bg-mint-light/20",
      iconColor: "text-mint-dark",
      title: "Corporate Giving",
      description: "Explore partnership opportunities for greater impact",
      buttonText: "Learn More",
      buttonVariant: "accent" as const,
      buttonClass: "",
      href: "/sponsors/corporate-sponsorship",
    },
  ],
};

// Default CTA for pages without specific config
const defaultCTA = [
  {
    icon: Heart,
    iconBg: "bg-purple-light/20",
    iconColor: "text-purple-dark",
    title: "Support Our Mission",
    description: "Help us empower women in STEM",
    buttonText: "Donate Now",
    buttonVariant: "default" as const,
    buttonClass: "",
    href: "/donate",
  },
  {
    icon: Calendar,
    iconBg: "bg-mint-light/20",
    iconColor: "text-mint-dark",
    title: "Join Our Community",
    description: "Attend events and connect with like-minded women",
    buttonText: "Explore Events",
    buttonVariant: "accent" as const,
    buttonClass: "",
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
    <Section className={cn("relative bg-white py-16 md:py-20", className)}>
      {/* Iridescence Background for CTA */}
      <div className="absolute inset-0 opacity-35">
        <Iridescence
          color={brandColors.ctaSoftMint}
          mouseReact={false}
          amplitude={0.12}
          speed={0.3}
          className="w-full h-full"
        />
      </div>
      
      {/* 向上过渡渐变 - 与上一个板块的柔和连接 */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-t from-transparent via-white/20 to-white" />
      
      {/* 向下过渡到 Footer - 更柔和的收尾 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent via-mint-light/20 to-mint-light/10" />
      
      <Container className="relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-dark">
            {title}
          </h2>
        </div>
        
        <div className={cn(
          "grid gap-8",
          ctaItems.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "md:grid-cols-3 max-w-5xl mx-auto"
        )}>
          {ctaItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-150">
                <CardContent className="p-8">
                  <div className={cn(
                    "w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center",
                    item.iconBg
                  )}>
                    <Icon className={cn("w-8 h-8", item.iconColor)} />
                  </div>
                  <h3 className="text-xl font-semibold text-navy-dark mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {item.description}
                  </p>
                  <Button
                    asChild
                    variant={item.buttonVariant}
                    className={item.buttonClass}
                  >
                    <Link href={item.href}>{item.buttonText}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}