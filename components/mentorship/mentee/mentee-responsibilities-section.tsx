'use client';

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExternalLink, ChevronDown, MessageSquare, Target, Lightbulb, TrendingUp, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const responsibilityCategories = {
  communication: {
    title: "Communication",
    icon: MessageSquare,
    items: [
      "Actively engaging in the mentorship and learning to communicate regularly",
      "Clearly communicating your goals, challenges, and needs to your mentor",
      "Providing regular updates on your progress and challenges"
    ]
  },
  goals: {
    title: "Goal Setting",
    icon: Target,
    items: [
      "Teaming up with your mentor to pinpoint personal and professional goals",
      "Proactively setting and pursuing identified objectives",
      "Tracking progress and adjusting goals as needed"
    ]
  },
  learning: {
    title: "Learning & Growth",
    icon: Lightbulb,
    items: [
      "Listening carefully to any advice given to you by your mentor",
      "Accepting constructive criticism with an open mind",
      "Embracing opportunities to think critically"
    ]
  },
  development: {
    title: "Development",
    icon: TrendingUp,
    items: [
      "Striving for continuous growth and improvement",
      "Taking initiative in your learning journey",
      "Applying learned concepts to real-world situations"
    ]
  }
};

export function MenteeResponsibilitiesSection() {
  const [openItems, setOpenItems] = useState<string[]>(['communication']);

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
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-display-sm text-foreground mb-6">
                What it means to be a <span className="text-brand">mentee</span>
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                As a mentee, you'll embark on a transformative journey of professional and personal growth.
                Here's what we expect from you to ensure a successful mentoring experience:
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

              <Button
                asChild
                size="lg"
                variant="brand"
              >
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSeiNe0btTXNLsJeIsMape05630fK1SLdldO9Ty3x8QbLd6B6w/viewform?usp=sf_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 "
                >
                  Start Your Journey
                </a>
              </Button>
            </div>

            {/* Image with overlay info */}
            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e7d7462e0faf4e732c4cf1_IMG_9889.jpg"
                  alt="Mentorship session"
                  fill
                  className="object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-navy-dark/60 via-transparent to-transparent" />

                {/* Overlay content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">Mentorship in Action</h3>
                  <p className="text-base opacity-90">One-on-one guidance to help you reach your full potential</p>
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