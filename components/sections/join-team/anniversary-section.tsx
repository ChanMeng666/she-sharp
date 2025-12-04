import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mail } from "lucide-react";
import { layoutSystem } from "@/lib/layout-system";

export function AnniversarySection() {
  return (
    <Section bgColor="dark" className="relative overflow-hidden bg-foreground">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-muted/10" />

      <Container size="content" className="relative z-10">
        <Card className="mx-auto border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardContent className="p-12 text-center">
            <Badge className="mb-6 bg-white/20 text-foreground border border-border px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              10 Years of Impact
            </Badge>

            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Calling All She Sharp Alumni!
            </h3>
            
            <p className="text-lg text-gray mb-8 max-w-2xl mx-auto leading-relaxed">
              Were you an ambassador with She Sharp? Join us in celebrating a decade of 
              empowering women in STEM. Reconnect with fellow ambassadors and share your journey.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="shadow-md"
              >
                <a href="mailto:hello@shesharp.org.nz?subject=She%20Sharp%20Alumni%20-%20Register%20Interest">
                  <Mail className="w-5 h-5 mr-2" />
                  Register Your Interest
                </a>
              </Button>
            </div>

            <p className="mt-6 text-sm text-gray">
              Help us celebrate our impact and inspire the next generation
            </p>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}