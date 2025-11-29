"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Clock, Target, Handshake, Calendar } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Apply",
    icon: Calendar,
    duration: "5 minutes",
    description: "Tell us your goals and preferences.",
    details: ["Brief online form", "Your background", "Your mentorship goals"],
    color: "purple",
  },
  {
    number: "2",
    title: "Get Paired",
    icon: Handshake,
    duration: "~1 week",
    description: "We match you based on goals and industry.",
    details: ["Goal alignment", "Industry & expertise", "Introductions"],
    color: "mint",
  },
  {
    number: "3",
    title: "Meet & Grow",
    icon: Target,
    duration: "3 months",
    description: "Regular catchups focused on outcomes.",
    details: ["Min. 3 meetings", "Virtual or in-person", "Progress support"],
    color: "periwinkle",
  },
];

const journeyHighlights = [
  "Expert matching",
  "Guided check-ins",
  "Community support",
  "Career momentum",
];

export function HowItWorksSection() {

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
    <Section className="py-16 md:py-24 bg-white dark:bg-gray-950">
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
        {/* Steps - simplified single layout */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            const colors = getColorClasses(step.color);
            return (
              <Card key={step.number} className="overflow-hidden">
                <CardHeader className={colors.bg}>
                  <CardTitle className="flex items-center gap-3">
                    <span className={`${colors.badge} px-3 py-1 rounded-full text-sm`}>Step {step.number}</span>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                    <span className="text-sm">{step.duration}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.slice(0, 2).map((detail, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-purple-dark mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Highlights removed for extra simplicity */}

        {/* CTA */}
        <div className="text-center mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-purple-dark hover:bg-purple-mid text-white">
            <Link href="/mentorship/join">
              Join as Mentee
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-purple-dark text-purple-dark hover:bg-purple-light dark:border-purple-mid dark:text-purple-mid">
            <Link href="/mentorship/become-a-mentor">
              Apply as Mentor
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}