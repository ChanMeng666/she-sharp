import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Clock } from "lucide-react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const stats = [
  {
    icon: Clock,
    value: "2200+",
    label: "Volunteer Hours",
    description: "Contributed annually"
  },
  {
    icon: Calendar,
    value: "50+",
    label: "Events Per Year", 
    description: "Organized and supported"
  },
  {
    icon: Users,
    value: "100+",
    label: "Active Volunteers",
    description: "Making an impact"
  }
];

export function TeamOverviewSection() {
  return (
    <Section bgColor="light">
      <Container size="wide">
        <div>
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Powered by Passionate Volunteers
            </h2>
            <p className="text-xl text-gray max-w-3xl mx-auto">
              She Sharp is a nonprofit run entirely by volunteers and ambassadors who dedicate their time to creating opportunities for women in STEM
            </p>
          </div>

          {/* Stats Grid */}
          <div className={layoutClasses(
            "grid mb-16",
            layoutSystem.grids.content.cols1,
            layoutSystem.grids.content.cols3,
            layoutSystem.grids.content.gap
          )}>
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-6">
                    <stat.icon className="w-8 h-8 text-foreground" />
                  </div>
                  <div className="text-5xl font-bold text-foreground mb-2">
                    {stat.value}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {stat.label}
                  </h3>
                  <p className="text-gray">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Our team consists of students and professionals from diverse backgrounds in technology, 
                all united by a common goal: to bridge the gender gap in STEM fields. From organizing 
                inspiring events to mentoring the next generation, our volunteers are the heart of She Sharp&apos;s mission.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}