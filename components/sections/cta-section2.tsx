"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Heart, Calendar, Users, Briefcase, ArrowRight, Sparkles } from "lucide-react";

const ctaOptions = [
  {
    title: "Donate to She Sharp",
    description: "Help us empower more young women to pursue careers in STEM through events and networking opportunities.",
    icon: Heart,
    iconBg: "bg-purple-light",
    iconColor: "text-purple-dark",
    buttonText: "Make a donation",
    buttonVariant: "default" as const,
    buttonClass: "bg-purple-dark hover:bg-purple-mid",
    href: "/donate",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
  },
  {
    title: "Come to an event",
    description: "Meet new people, network with companies, engage in workshops and learn more about working in STEM!",
    icon: Calendar,
    iconBg: "bg-mint-light",
    iconColor: "text-mint-dark",
    buttonText: "Explore Events",
    buttonVariant: "outline" as const,
    buttonClass: "border-mint-dark text-mint-dark hover:bg-mint-light",
    href: "/events",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
  },
  {
    title: "Join as a volunteer",
    description: "Share your skills and experience to help other women succeed in technology careers.",
    icon: Users,
    iconBg: "bg-periwinkle-light",
    iconColor: "text-periwinkle-dark",
    buttonText: "Volunteer with us",
    buttonVariant: "outline" as const,
    buttonClass: "border-periwinkle-dark text-periwinkle-dark hover:bg-periwinkle-light",
    href: "/join",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
  },
  {
    title: "Partner with us",
    description: "Become a corporate sponsor and help us create more opportunities for women in tech.",
    icon: Briefcase,
    iconBg: "bg-navy-light",
    iconColor: "text-navy-dark",
    buttonText: "Sponsorship info",
    buttonVariant: "outline" as const,
    buttonClass: "border-navy-dark text-navy-dark hover:bg-navy-light",
    href: "/sponsors/corporate",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
  },
];

export function CTASection() {
  return (
    <Section bgColor="accent" className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-dark rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-periwinkle-dark rounded-full blur-3xl" />
      </div>

      <Container className="relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1 sm:gap-2 mb-4">
            <Sparkles className="w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8 text-purple-dark" />
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-navy-dark">
              BRIDGE THE GENDER GAP IN STEM WITH US
            </h2>
            <Sparkles className="w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8 text-purple-dark" />
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray max-w-3xl mx-auto px-4">
            There are many ways to get involved and support our mission. Choose how you'd like to make a difference.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
          {ctaOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <Card 
                key={option.title} 
                className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="sm:flex h-full">
                  {/* Image side */}
                  <div className="sm:w-2/5 relative h-32 sm:h-auto">
                    <AspectRatio ratio={3 / 2} className="h-full">
                      <Image
                        src={option.image}
                        alt={option.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 40vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </AspectRatio>
                  </div>

                  {/* Content side */}
                  <div className="sm:w-3/5 p-4 sm:p-5 lg:p-6 flex flex-col">
                    <CardHeader className="p-0 mb-4">
                      <div className={`inline-flex p-3 rounded-full ${option.iconBg} mb-3 w-fit`}>
                        <Icon className={`w-6 h-6 ${option.iconColor}`} />
                      </div>
                      <CardTitle className="text-lg sm:text-xl">{option.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow flex flex-col">
                      <CardDescription className="text-sm sm:text-base mb-4 flex-grow">
                        {option.description}
                      </CardDescription>
                      <Button
                        asChild
                        size="sm"
                        variant={option.buttonVariant}
                        className={`w-full ${option.buttonClass} group`}
                      >
                        <Link href={option.href}>
                          {option.buttonText}
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </CardContent>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom message */}
        <div className="mt-12 sm:mt-16 text-center bg-white/50 backdrop-blur-sm rounded-lg p-6 sm:p-8 max-w-3xl mx-auto">
          <h3 className="text-lg sm:text-xl font-semibold text-navy-dark mb-2">
            Every action makes a difference
          </h3>
          <p className="text-sm sm:text-base text-gray">
            Whether you donate, volunteer, attend events, or partner with us, you're helping to create a more inclusive future in technology.
          </p>
        </div>
      </Container>
    </Section>
  );
}