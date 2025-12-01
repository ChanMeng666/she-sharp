import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";
import { Download, Users, Calendar, Award } from "lucide-react";

export const metadata = {
  title: "Impact Report | She Sharp",
  description: "Read about She Sharp's annual impact and achievements in empowering women in STEM.",
};

export default function ImpactReportPage() {
  return (
    <Section bgColor="white">
      <Container size="content">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Impact Report 2024
          </h1>
          <p className="text-xl text-gray max-w-3xl mx-auto">
            Our annual progress and measurable outcomes empowering women in STEM.
          </p>
        </div>

        {/* Featured Report Card */}
        <Card className="border-2 border-border shadow-xl mb-12">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-6">
              <Download className="h-8 w-8 text-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              2024 Annual Impact Report
            </h2>
            <p className="text-foreground mb-6 max-w-2xl mx-auto">
              Our comprehensive annual report showcases the growth, achievements, and impact of our programs.
            </p>
            <Button size="lg" className="bg-foreground">
              <Download className="mr-2 h-5 w-5" />
              Download Impact Report (PDF)
            </Button>
          </CardContent>
        </Card>

        {/* Core Metrics removed to avoid repeating homepage section */}

        {/* Highlights */}
        <Card className="hover:shadow-lg transition-shadow mb-12">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-muted rounded-full">
                <Award className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-4">Highlights</h3>
                <ul className="space-y-3 text-gray">
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">•</span>
                    <span>Launched THRIVE career program with strong participant outcomes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">•</span>
                    <span>Expanded mentorship matching and strategic partnerships</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">•</span>
                    <span>Hosted Google Educator Conference with record attendance</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Looking Ahead Section */}
        <Card className="bg-muted border-border">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-full">
                <Users className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Looking Ahead
                </h3>
                <p className="text-foreground leading-relaxed">
                  We will expand mentorship and launch new initiatives to accelerate career growth.
                  We'll also deepen partnerships to create more opportunities across STEM.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Reports */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-6">Previous Impact Reports</h3>
          <div className={layoutClasses(
            "grid",
            layoutSystem.grids.content.cols1,
            "sm:grid-cols-2",
            layoutSystem.grids.content.cols3,
            "gap-4"
          )}>
            {[2023, 2022, 2021].map((year) => (
              <Button
                key={year}
                variant="ghost"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {year} Impact Report (PDF)
              </Button>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}