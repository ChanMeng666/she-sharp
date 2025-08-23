"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, Heart, Sparkles } from "lucide-react";

const missionTabs = [
  {
    value: "mission",
    label: "Our Mission",
    icon: Target,
    title: "Bridging the Gender Gap in STEM",
    content: "We're on a mission to create a more inclusive tech industry by empowering women to pursue and thrive in STEM careers. Through community, education, and opportunity, we're changing the face of technology.",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    stats: [
      { label: "Women Empowered", value: "2200+" },
      { label: "Career Transitions", value: "500+" },
    ],
  },
  {
    value: "approach",
    label: "Our Approach",
    icon: Users,
    title: "Building Community & Connections",
    content: "We believe in the power of community. By bringing women together through events, workshops, and mentorship programs, we create lasting connections that support career growth and personal development.",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    stats: [
      { label: "Events Hosted", value: "84+" },
      { label: "Partner Companies", value: "50+" },
    ],
  },
  {
    value: "impact",
    label: "Our Impact",
    icon: Heart,
    title: "Creating Real Change",
    content: "Our members have gone on to launch startups, lead engineering teams, and become advocates for diversity in their organizations. Every success story inspires the next generation.",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    stats: [
      { label: "Success Stories", value: "100+" },
      { label: "Companies Reached", value: "200+" },
    ],
  },
];

export function MissionSection() {
  return (
    <Section className="bg-white py-16 md:py-20">
      <Container>
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy-dark mb-4">
            Empowering Women in Technology
          </h2>
          <p className="text-base sm:text-lg text-gray max-w-2xl mx-auto px-4">
            Discover how She Sharp is transforming the tech industry by supporting and advancing women in STEM
          </p>
        </div>

        <Tabs defaultValue="mission" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8 bg-purple-light/10 p-1.5 rounded-lg h-auto">
            {missionTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 data-[state=active]:bg-purple-dark data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md h-full"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {missionTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Image */}
                <div className="order-2 md:order-1">
                  <AspectRatio ratio={4 / 3} className="rounded-lg overflow-hidden">
                    <Image
                      src={tab.image}
                      alt={tab.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </AspectRatio>
                </div>

                {/* Content */}
                <div className="order-1 md:order-2 space-y-6">
                  <div className="inline-flex p-3 rounded-full bg-purple-light/20">
                    <tab.icon className="w-6 h-6 text-purple-dark" />
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-navy-dark">
                    {tab.title}
                  </h3>
                  <p className="text-base sm:text-lg text-gray">
                    {tab.content}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {tab.stats.map((stat) => (
                      <Card key={stat.label} className="border-purple-light">
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-purple-dark">
                            {stat.value}
                          </div>
                          <div className="text-sm text-gray">{stat.label}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button
                    asChild
                    size="lg"
                    className="bg-purple-dark hover:bg-purple-mid"
                  >
                    <Link href="/about">Learn More About Us</Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Additional CTA */}
        <div className="mt-12 sm:mt-16 text-center bg-purple-light/10 rounded-lg p-6 sm:p-8 relative overflow-hidden">
          {/* Background Logo Watermark */}
          <div className="absolute right-0 bottom-0 transform translate-x-1/4 translate-y-1/4 opacity-5 pointer-events-none">
            <div className="relative w-64 h-64">
              <Image
                src="/logos/she-sharp-logo-purple-dark-130x130.svg"
                alt=""
                fill
                sizes="256px"
                className="object-contain"
                aria-hidden="true"
              />
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-6 sm:w-8 h-6 sm:h-8 text-purple-dark" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-navy-dark mb-2">
              Ready to join our mission?
            </h3>
            <p className="text-gray mb-4">
              Become part of a community that's changing the face of technology
            </p>
            <Button
              asChild
              variant="outline"
              className="border-purple-dark text-purple-dark hover:bg-purple-light"
            >
              <Link href="/join-our-team">Become a member</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}