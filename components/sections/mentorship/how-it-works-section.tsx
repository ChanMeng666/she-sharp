"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FileText, Users, Coffee, Calendar, PartyPopper, ChevronRight, Clock, Target, Handshake } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Expression of Interest",
    icon: FileText,
    duration: "5 minutes",
    description: "Tell us about your goals and what you're looking for in a mentor or mentee.",
    details: [
      "Complete a brief online form",
      "Share your professional background",
      "Outline your mentorship goals",
      "Specify your preferred meeting frequency"
    ],
    color: "purple"
  },
  {
    number: "2",
    title: "Induction Session",
    icon: Users,
    duration: "1.5 hours",
    description: "Join our welcome session to meet the cohort and learn program expectations.",
    details: [
      "Meet other participants",
      "Learn about program guidelines",
      "Get tips for successful mentorship",
      "Network with the She Sharp community"
    ],
    color: "periwinkle"
  },
  {
    number: "3",
    title: "Get Paired",
    icon: Handshake,
    duration: "1 week",
    description: "We match you with the perfect mentor or mentee based on your goals and interests.",
    details: [
      "AI-powered matching algorithm",
      "Consider industry and expertise",
      "Align career goals and interests",
      "Mutual introduction facilitated"
    ],
    color: "mint"
  },
  {
    number: "4",
    title: "Coffee Catchups",
    icon: Coffee,
    duration: "3 months",
    description: "Meet regularly with your mentor/mentee to work towards your goals.",
    details: [
      "Minimum 3 meetings over 3 months",
      "Flexible format (in-person or virtual)",
      "Goal-oriented discussions",
      "Progress tracking and support"
    ],
    color: "navy"
  },
  {
    number: "5",
    title: "Celebration",
    icon: PartyPopper,
    duration: "Evening event",
    description: "Celebrate your achievements and the connections you've made.",
    details: [
      "Graduation ceremony",
      "Share success stories",
      "Network with alumni",
      "Plan next steps in your journey"
    ],
    color: "purple"
  }
];

const journeyPaths = {
  mentee: {
    title: "Mentee Journey",
    icon: Target,
    highlights: [
      "Get matched with experienced professionals",
      "Receive career guidance and support",
      "Expand your professional network",
      "Accelerate your career growth"
    ]
  },
  mentor: {
    title: "Mentor Journey",
    icon: Users,
    highlights: [
      "Share your expertise and experience",
      "Develop leadership skills",
      "Give back to the community",
      "Fresh perspectives from mentees"
    ]
  }
};

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPath, setSelectedPath] = useState<'mentee' | 'mentor'>('mentee');

  const getColorClasses = (color: string) => {
    switch (color) {
      case "purple":
        return {
          bg: "bg-purple-light/50 dark:bg-purple-dark/10",
          border: "border-purple-dark/20",
          text: "text-purple-dark",
          badge: "bg-purple-dark text-white"
        };
      case "periwinkle":
        return {
          bg: "bg-periwinkle-light/50 dark:bg-periwinkle-dark/10",
          border: "border-periwinkle-dark/20",
          text: "text-periwinkle-dark",
          badge: "bg-periwinkle-dark text-white"
        };
      case "mint":
        return {
          bg: "bg-mint-light dark:bg-mint-dark/10",
          border: "border-mint-dark/20",
          text: "text-navy dark:text-mint-dark",
          badge: "bg-mint-dark text-navy"
        };
      case "navy":
        return {
          bg: "bg-navy-light dark:bg-navy-dark/10",
          border: "border-navy-dark/20",
          text: "text-navy-dark dark:text-navy-light",
          badge: "bg-navy-dark text-white dark:bg-navy-light dark:text-navy-dark"
        };
      default:
        return {
          bg: "bg-gray-100",
          border: "border-gray-200",
          text: "text-gray-700",
          badge: "bg-gray-700 text-white"
        };
    }
  };

  return (
    <Section className="py-16 md:py-24 bg-gradient-to-br from-mint-light/20 via-white to-periwinkle-light/20 dark:from-mint-dark/5 dark:via-gray-950 dark:to-periwinkle-dark/5">
      <Container>
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-mint-dark/10 text-navy dark:text-mint-dark border-mint-dark">
            <Clock className="w-3 h-3 mr-1" />
            3-Month Program
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white mb-4">
            How the Program Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A structured journey designed to create meaningful connections and drive real career impact
          </p>
        </div>

        {/* Journey Path Selector */}
        <div className="flex justify-center mb-8">
          <Tabs value={selectedPath} onValueChange={(v) => setSelectedPath(v as 'mentee' | 'mentor')}>
            <TabsList className="bg-muted text-muted-foreground p-1">
              <TabsTrigger value="mentee" className="gap-2">
                <Target className="w-4 h-4" />
                Mentee Journey
              </TabsTrigger>
              <TabsTrigger value="mentor" className="gap-2">
                <Users className="w-4 h-4" />
                Mentor Journey
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Desktop Timeline View */}
        <div className="hidden lg:block mb-12">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-20 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
              <div 
                className="h-full bg-purple-dark transition-all duration-500"
                style={{ width: `${(activeStep + 1) * 20}%` }}
              />
            </div>
            
            {/* Steps */}
            <div className="grid grid-cols-5 gap-4 relative">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const colors = getColorClasses(step.color);
                const isActive = index === activeStep;
                const isCompleted = index < activeStep;
                
                return (
                  <button
                    key={step.number}
                    onClick={() => setActiveStep(index)}
                    className="text-center relative group"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 transition-all duration-300 ${
                      isActive ? 'scale-110 shadow-lg' : ''
                    } ${
                      isCompleted ? 'bg-purple-dark text-white' : colors.bg + ' ' + colors.border + ' border-2'
                    } group-hover:scale-105`}>
                      <Icon className={`w-6 h-6 ${isCompleted ? 'text-white' : colors.text}`} />
                    </div>
                    <h3 className={`text-sm font-semibold transition-colors ${
                      isActive ? 'text-purple-dark dark:text-purple-mid' : 'text-navy dark:text-gray-300'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {step.duration}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Active Step Details */}
          <Card className="mt-8 overflow-hidden">
            <CardHeader className={`${getColorClasses(steps[activeStep].color).bg}`}>
              <CardTitle className="flex items-center gap-3">
                <span className={`${getColorClasses(steps[activeStep].color).badge} px-3 py-1 rounded-full text-sm`}>
                  Step {steps[activeStep].number}
                </span>
                {steps[activeStep].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {steps[activeStep].description}
              </p>
              <ul className="space-y-2">
                {steps[activeStep].details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Carousel View */}
        <div className="lg:hidden">
          <Carousel className="w-full max-w-xs mx-auto">
            <CarouselContent>
              {steps.map((step, index) => {
                const Icon = step.icon;
                const colors = getColorClasses(step.color);
                
                return (
                  <CarouselItem key={step.number}>
                    <Card className="overflow-hidden">
                      <CardHeader className={colors.bg}>
                        <div className="flex items-center justify-between">
                          <Badge className={colors.badge}>
                            Step {step.number}
                          </Badge>
                          <Icon className={`w-8 h-8 ${colors.text}`} />
                        </div>
                        <CardTitle className="mt-4">{step.title}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {step.duration}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {step.description}
                        </p>
                        <ul className="space-y-2">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-purple-dark mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Journey Highlights */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {Object.entries(journeyPaths).map(([key, journey]) => {
            const Icon = journey.icon;
            const isSelected = key === selectedPath;
            
            return (
              <Card 
                key={key} 
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-purple-dark shadow-lg' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedPath(key as 'mentee' | 'mentor')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-purple-dark" />
                    {journey.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {journey.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-mint-dark mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-purple-dark hover:bg-purple-mid text-white">
            <Link href={selectedPath === 'mentee' ? '/mentorship/mentee' : '/mentorship/mentor-application'}>
              Start Your {selectedPath === 'mentee' ? 'Mentee' : 'Mentor'} Journey
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}