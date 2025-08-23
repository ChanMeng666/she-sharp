'use client';

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExternalLink, ChevronDown, MessageSquare, Target, Lightbulb, TrendingUp, Calendar, Users, CheckCircle } from "lucide-react";
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

const timelineSteps = [
  { month: "Month 1", focus: "Building Connection", description: "Get to know your mentor and establish communication patterns" },
  { month: "Month 2-3", focus: "Goal Setting", description: "Define clear objectives and create an action plan" },
  { month: "Month 4-5", focus: "Active Learning", description: "Work on projects and apply new knowledge" },
  { month: "Month 6", focus: "Reflection & Next Steps", description: "Review progress and plan future development" }
];

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
    <Section className="py-16 bg-gradient-to-b from-periwinkle-light/20 to-white">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy-dark mb-6">
              What it means to be A MENTEE
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              As a mentee, you'll embark on a transformative journey of professional and personal growth. 
              Here's what we expect from you to ensure a successful mentoring experience:
            </p>
            
            {/* Tabs for different views */}
            <Tabs defaultValue="responsibilities" className="mb-8">
              <TabsList className="grid w-full grid-cols-2 bg-muted text-muted-foreground p-1">
                <TabsTrigger value="responsibilities" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Responsibilities
                </TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Journey Timeline
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="responsibilities" className="mt-6 space-y-4">
                {Object.entries(responsibilityCategories).map(([key, category]) => {
                  const Icon = category.icon;
                  const isOpen = openItems.includes(key);
                  
                  return (
                    <Collapsible key={key} open={isOpen}>
                      <CollapsibleTrigger
                        onClick={() => toggleItem(key)}
                        className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-light rounded-full flex items-center justify-center">
                              <Icon className="w-5 h-5 text-purple-dark" />
                            </div>
                            <h3 className="font-semibold text-navy-dark text-left">{category.title}</h3>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <ul className="mt-4 space-y-2">
                          {category.items.map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-gray-700">
                              <CheckCircle className="w-4 h-4 text-purple-dark mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-6">
                <div className="relative">
                  {timelineSteps.map((step, index) => (
                    <div key={step.month} className="flex gap-4 mb-6 last:mb-0">
                      {/* Timeline line */}
                      <div className="relative">
                        <div className="w-4 h-4 bg-purple-dark rounded-full" />
                        {index < timelineSteps.length - 1 && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-full bg-purple-light" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <h4 className="font-semibold text-purple-dark mb-1">{step.month}</h4>
                        <p className="font-medium text-navy-dark mb-1">{step.focus}</p>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <Button 
              asChild 
              size="lg" 
              className="bg-purple-dark hover:bg-purple-mid text-white w-full sm:w-auto"
            >
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSeiNe0btTXNLsJeIsMape05630fK1SLdldO9Ty3x8QbLd6B6w/viewform?usp=sf_link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2"
              >
                Start Your Journey
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
          
          {/* Image with overlay info */}
          <div className="relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e7d7462e0faf4e732c4cf1_IMG_9889.jpg"
                alt="Mentorship session"
                fill
                className="object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/60 via-transparent to-transparent" />
              
              {/* Overlay content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-semibold mb-2">Mentorship in Action</h3>
                <p className="text-sm opacity-90">One-on-one guidance to help you reach your full potential</p>
              </div>
            </div>
            
            {/* Floating commitment card */}
            <div className="absolute -top-4 -right-4 bg-mint-dark/90 backdrop-blur-sm rounded-lg p-4 shadow-lg hidden lg:block">
              <p className="text-navy-dark font-semibold text-sm">Time Commitment</p>
              <p className="text-navy-dark text-xs mt-1">2-4 hours per month</p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}