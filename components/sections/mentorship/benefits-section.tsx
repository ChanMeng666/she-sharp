"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Lightbulb, Users, TrendingUp, Brain, Heart, Sparkles } from "lucide-react";
import { useState } from "react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const benefits = [
  {
    icon: Target,
    title: "Pathway for Personal Development",
    description: "Whether you join as a mentor or mentee, this is an additional opportunity for personal and professional development.",
    highlights: ["Career advancement", "Skill building", "Leadership growth"],
    color: "purple"
  },
  {
    icon: Lightbulb,
    title: "Increase Knowledge Share",
    description: "The mentorship program serves as a platform for promoting collaborative learning and exploring new perspectives together.",
    highlights: ["Industry insights", "Best practices", "Innovation"],
    color: "periwinkle"
  },
  {
    icon: Users,
    title: "Supportive Community",
    description: "With our pool of supportive mentors, you'll get professional guidance, provided valuable advice and support along the way.",
    highlights: ["Networking", "Peer support", "Lasting connections"],
    color: "mint"
  }
];

const additionalBenefits = [
  {
    icon: TrendingUp,
    title: "Career Acceleration",
    stat: "85%",
    description: "of participants see career growth"
  },
  {
    icon: Brain,
    title: "Skill Enhancement",
    stat: "90%",
    description: "improve interpersonal skills"
  },
  {
    icon: Heart,
    title: "Confidence Boost",
    stat: "92%",
    description: "feel more empowered"
  }
];

export function BenefitsSection() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const getColorClasses = (color: string) => {
    return {
      bg: "bg-muted",
      border: "border-border",
      icon: "text-foreground",
      badge: "bg-muted text-foreground border-border"
    };
  };

  return (
    <Section bgColor="light">
      <Container size="wide">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-muted text-foreground border-border">
            <Sparkles className="w-3 h-3 mr-1" />
            Transform Your Career
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Benefits of Joining the Mentorship Program
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock opportunities for growth, learning, and connection in a supportive environment
          </p>
        </div>
        
        {/* Main Benefits Cards */}
        <div className={layoutClasses(
          "grid max-w-6xl mx-auto mb-12",
          layoutSystem.grids.content.cols1,
          layoutSystem.grids.content.cols3,
          layoutSystem.grids.content.gap
        )}>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const colors = getColorClasses(benefit.color);
            const isHovered = hoveredCard === index;
            
            return (
              <Card 
                key={benefit.title}
                className={`relative overflow-hidden transition-all duration-150 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${colors.bg} ${colors.border}`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent className="p-6">
                  {/* Icon Container */}
                  <div className={`w-16 h-16 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center mb-4 mx-auto transition-transform duration-150 ${isHovered ? 'scale-110' : ''}`}>
                    <Icon className={`w-8 h-8 ${colors.icon}`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-3 text-center">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {benefit.description}
                  </p>
                  
                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {benefit.highlights.map((highlight) => (
                      <Badge 
                        key={highlight} 
                        variant="secondary" 
                        className={`text-xs transition-opacity duration-150 ${colors.badge} ${isHovered ? 'opacity-100' : 'opacity-70'}`}
                      >
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Additional Benefits Stats */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            The Impact in Numbers
          </h3>
          <div className={layoutClasses(
            "grid max-w-4xl mx-auto",
            layoutSystem.grids.content.cols1,
            layoutSystem.grids.content.cols3,
            layoutSystem.grids.content.gap
          )}>
            {additionalBenefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div key={benefit.title} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {benefit.stat}
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}