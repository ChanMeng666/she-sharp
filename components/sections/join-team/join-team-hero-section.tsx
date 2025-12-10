import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

export function JoinTeamHeroSection() {
  return (
    <Section className="bg-white min-h-[60vh] flex items-center">
      <Container>
        <div className="mx-auto max-w-6xl">
          {/* Title Section */}
          <div className="text-center">
            <p className="font-brand-script text-2xl md:text-3xl text-muted-foreground mb-4">
              Make a difference
            </p>
            <h1 className="text-display-lg">
              <span className="block text-foreground">JOIN THE</span>
              <span className="block text-foreground mt-2">SHARPEST TEAM</span>
            </h1>
            <p className="mt-8 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Be part of a passionate community of volunteers and ambassadors working together to bridge the gender gap in STEM
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}