"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, UserPlus, Sparkles, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const pathOptions = [
  {
    title: "Become a Mentee",
    description: "Get guidance from experienced professionals",
    benefits: [
      "1-on-1 mentorship sessions",
      "Career development support",
      "Networking opportunities",
      "Skills enhancement"
    ],
    href: "/mentorship/mentee",
    icon: UserPlus,
    color: "purple",
    image: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/646ab8db33f08b7bb4e87f84_about3.jpg"
  },
  {
    title: "Explore Our Mentors",
    description: "Connect with industry leaders and experts",
    benefits: [
      "150+ experienced mentors",
      "Diverse industries",
      "Proven track records",
      "Passionate about helping"
    ],
    href: "/mentorship/mentors",
    icon: Users,
    color: "periwinkle",
    image: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/646ab8dac596bb8dc8667bc6_about2.jpg"
  }
];

export function JoinCTASection() {
  return (
    <Section className="py-16 md:py-24 bg-gradient-to-r from-purple-light/30 via-periwinkle-light/20 to-purple-light/30 dark:from-purple-dark/10 dark:via-periwinkle-dark/5 dark:to-purple-dark/10">
      <Container>
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-dark/10 text-purple-dark border-purple-dark">
            <Sparkles className="w-3 h-3 mr-1" />
            Ready to Start?
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white mb-4">
            Take the Next Step in Your Journey
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Whether you're seeking guidance or ready to share your expertise, we have a path for you
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {pathOptions.map((option) => {
            const Icon = option.icon;
            const colorClasses = option.color === 'purple' 
              ? 'bg-purple-dark hover:bg-purple-mid' 
              : 'bg-periwinkle-dark hover:bg-periwinkle-dark/90';
            
            return (
              <Card key={option.title} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="aspect-[16/9] relative overflow-hidden">
                  <Image
                    src={option.image}
                    alt={option.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {option.title}
                    </h3>
                    <p className="text-white/90">
                      {option.description}
                    </p>
                  </div>
                </div>
                
                <div className="p-6">
                  <ul className="space-y-2 mb-6">
                    {option.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-mint-dark flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button asChild className={`w-full ${colorClasses} text-white`}>
                    <Link href={option.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {option.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        
        {/* Alternative CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Want to contribute as a mentor?
          </p>
          <Button asChild variant="outline" className="border-purple-dark text-purple-dark hover:bg-purple-light dark:border-purple-mid dark:text-purple-mid">
            <Link href="/mentorship/mentors">
              Apply to Become a Mentor
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}