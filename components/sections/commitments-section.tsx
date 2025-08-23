"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Users, Lightbulb, Rocket, ArrowRight, Calendar, BookOpen, Briefcase } from "lucide-react";
import Link from "next/link";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";
import Iridescence, { brandColors } from "@/components/effects/iridescence";

const commitments = [
  {
    title: "Connection",
    description: "We've built a network where women can meet and connect with like-minded peers.",
    icon: Users,
    color: "text-purple-dark",
    bgColor: "bg-purple-light/10",
    borderColor: "border-purple-light",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    features: [
      "Monthly networking events",
      "Online community platform",
      "Industry-specific meetups",
    ],
    stats: { value: "2200+", label: "Active Members" },
    link: { href: "/events", text: "Join an Event" },
  },
  {
    title: "Inspiration",
    description: "We showcase careers and role models in STEM from different sectors and disciplines.",
    icon: Lightbulb,
    color: "text-periwinkle-dark",
    bgColor: "bg-periwinkle-light",
    borderColor: "border-periwinkle-mid",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    features: [
      "Speaker series with leaders",
      "Success story showcases",
      "Career pathway workshops",
    ],
    stats: { value: "100+", label: "Role Models" },
    link: { href: "/mentorship", text: "Meet Our Mentors" },
  },
  {
    title: "Empowerment",
    description: "We make careers in STEM for women possible through mentorship, networking and more.",
    icon: Rocket,
    color: "text-mint-dark",
    bgColor: "bg-mint-light",
    borderColor: "border-mint-mid",
    image: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
    features: [
      "1-on-1 mentorship program",
      "Skills development workshops",
      "Career transition support",
    ],
    stats: { value: "500+", label: "Careers Launched" },
    link: { href: "/join", text: "Start Your Journey" },
  },
];

export function CommitmentsSection() {
  return (
    <Section className="relative bg-white py-16 md:py-20">
      {/* Iridescence 动态背景 */}
      <div className="absolute inset-0 opacity-30">
        <Iridescence
          color={brandColors.commitmentsLavender}
          mouseReact={false}
          amplitude={0.10}
          speed={0.8}
          className="w-full h-full"
        />
      </div>
      
      {/* 向下过渡渐变 - 更柔和的过渡 */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent via-white/50 to-white" />
      
      <Container size="wide" className="relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          {/* Logo */}
          {/* <div className="mb-6 flex justify-center">
            <div className="relative w-16 h-16 opacity-20">
              <Image
                src="/logos/she-sharp-logo-purple-mid-130x130.svg"
                alt="She Sharp"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
          </div> */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy-dark mb-4">
            Our commitments
          </h2>
          <p className="text-base sm:text-lg text-gray max-w-2xl mx-auto px-4">
            Through three core commitments, we are dedicated to creating a better future for women in tech
          </p>
        </div>

        <div className={layoutClasses(
          "grid",
          layoutSystem.grids.content.cols1,
          layoutSystem.grids.content.cols2,
          layoutSystem.grids.content.cols3,
          layoutSystem.grids.content.gap
        )}>
          {commitments.map((commitment, index) => {
            const Icon = commitment.icon;
            return (
              <Card 
                key={commitment.title} 
                className={`border-2 ${commitment.borderColor} shadow-sm hover:shadow-lg transition-all duration-150 overflow-hidden group ${
                  index === 0 ? "lg:col-span-2" : ""
                }`}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <AspectRatio ratio={3 / 2}>
                    <Image
                      src={commitment.image}
                      alt={commitment.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-150"
                    />
                  </AspectRatio>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Badge className={`${commitment.bgColor} ${commitment.color} border-0`}>
                      {commitment.stats.value} {commitment.stats.label}
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-full ${commitment.bgColor}`}>
                      <Icon className={`w-6 h-6 ${commitment.color}`} />
                    </div>
                    <CardTitle className="text-xl">{commitment.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {commitment.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {commitment.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-gray mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    href={commitment.link.href}
                    className={`inline-flex items-center gap-2 text-sm font-medium ${commitment.color} hover:underline`}
                  >
                    {commitment.link.text}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className={layoutClasses(
          "mt-12 sm:mt-16 grid p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-sm",
          layoutSystem.grids.content.cols1,
          "sm:grid-cols-2",
          "md:grid-cols-3",
          "gap-4 sm:gap-6"
        )}>
          <div className="flex items-center gap-3">
            <Calendar className="w-6 sm:w-8 h-6 sm:h-8 text-purple-dark flex-shrink-0" />
            <div>
              <div className="text-sm sm:text-base font-semibold text-navy-dark">Regular Events</div>
              <div className="text-xs sm:text-sm text-gray">Join us monthly</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 sm:w-8 h-6 sm:h-8 text-periwinkle-dark flex-shrink-0" />
            <div>
              <div className="text-sm sm:text-base font-semibold text-navy-dark">Learning Resources</div>
              <div className="text-xs sm:text-sm text-gray">Grow your skills</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 sm:w-8 h-6 sm:h-8 text-mint-dark flex-shrink-0" />
            <div>
              <div className="text-sm sm:text-base font-semibold text-navy-dark">Career Support</div>
              <div className="text-xs sm:text-sm text-gray">Advance your career</div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}