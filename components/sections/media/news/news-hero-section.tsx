import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Users, Calendar, Newspaper } from "lucide-react";

const stats = [
  { icon: Trophy, value: "15+", label: "Awards Won" },
  { icon: Users, value: "50+", label: "Media Features" },
  { icon: Calendar, value: "10", label: "Years of Impact" },
  { icon: Newspaper, value: "100+", label: "Press Mentions" }
];

export function NewsHeroSection() {
  return (
    <Section className="relative overflow-hidden bg-muted">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-muted/5" />

      <Container className="relative z-10">
        <div className="py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <Badge className="mb-4 bg-foreground text-background border-0">
              Making Headlines
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
              News & Press
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              Celebrating milestones, sharing stories, and amplifying the voices of women in technology
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background shadow-md group-hover:shadow-lg transition-shadow duration-150 mb-4">
                  <stat.icon className="h-8 w-8 text-foreground" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <Separator className="mt-16 max-w-2xl mx-auto" />
        </div>
      </Container>
    </Section>
  );
}