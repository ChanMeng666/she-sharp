"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {  ChevronDown, Heart, Compass, MessageSquare, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

const responsibilityCategories = {
  commitment: {
    title: "Commitment",
    icon: Heart,
    items: [
      "Stay dedicated to mentoring and initiate contact with your mentee regularly.",
      "Follow through on the plans and actions you've mutually agreed upon with your mentee."
    ]
  },
  guidance: {
    title: "Guidance",
    icon: Compass,
    items: [
      "Help mentee in figuring out and setting their goals.",
      "Encourage mentee to nurture their independent thinking skills.",
      "Foster growth and celebrate achievements."
    ]
  },
  communication: {
    title: "Communication",
    icon: MessageSquare,
    items: [
      "Listen to what your mentee needs, rather than just pushing your own thoughts.",
      "Don't hesitate to give constructive feedback."
    ]
  }
};

export function MentorResponsibilitiesSection() {
  const [openItems, setOpenItems] = useState<string[]>(['commitment']);

  const toggleItem = (key: string) => {
    setOpenItems(prev =>
      prev.includes(key)
        ? prev.filter(item => item !== key)
        : [...prev, key]
    );
  };

  return (
    <Section className="py-16 xl:py-24 2xl:py-32 bg-white">
      <Container size="full">
        <div className="max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-display-sm text-foreground mb-6">
                What it means to be a <span className="text-brand">mentor</span>
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                As a mentor, you play a crucial role in shaping the future of women in STEM. 
                Here's what we expect from our mentors:
              </p>

              <div className="mb-8 space-y-4">
                {Object.entries(responsibilityCategories).map(([key, category]) => {
                  const Icon = category.icon;
                  const isOpen = openItems.includes(key);

                  return (
                    <Collapsible key={key} open={isOpen}>
                      <CollapsibleTrigger
                        onClick={() => toggleItem(key)}
                        className="w-full bg-white rounded-[100px] p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-white">
                              <Icon className="w-5 h-5 text-brand" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-md md:text-lg font-semibold text-foreground text-left">{category.title}</h3>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-foreground/80 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-10 pb-8">
                        <ul className="mt-8 space-y-4">
                          {category.items.map((item, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <CheckCircle className="w-4 h-4 text-foreground/80 mt-0.5 shrink-0" />
                              <span className="text-base text-muted-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  variant="brand"
                >
                  <a 
                    href="https://forms.gle/msvCzw3qevVnPRvv7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    Become a mentor            
                  </a>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline"
                  className="border-purple-dark text-purple-dark hover:bg-purple-dark/50 hover:text-white transition-colors"
                >
                  <Link href="/mentorship#how-it-works">
                    Learn How It Works
                  </Link>
                </Button>
              </div>
            </div>

            {/* Image with overlay info */}
            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/img/scraped/site/mentorship/66e7d6d1507e385502912e7f_IMG_9898_a19afc43.jpg"
                  alt="Mentorship meeting"
                  fill
                  className="object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-navy-dark/60 via-transparent to-transparent" />

                {/* Overlay content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">Mentorship in Action</h3>
                  <p className="text-base opacity-90">Guiding the next generation of women in STEM</p>
                </div>
              </div>

              {/* Floating commitment card */}
              <div className="absolute -top-4 -right-4 bg-periwinkle-dark/70 backdrop-blur-sm rounded-lg p-6 shadow-lg hidden lg:block">
                <p className="text-white font-semibold text-base">Time Commitment</p>
                <p className="text-white text-base mt-1">2-4 hours per month</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}