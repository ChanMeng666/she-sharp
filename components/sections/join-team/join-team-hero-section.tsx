import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";

export function JoinTeamHeroSection() {
  return (
    <Section className="bg-white min-h-screen flex items-center">
      <Container>
        <div className="mx-auto max-w-6xl">
          {/* Title Section */}
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="block text-foreground">JOIN THE</span>
              <span className="block text-foreground mt-2">SHARPEST TEAM</span>
            </h1>
            <p className="mt-8 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Be part of a passionate community of volunteers and ambassadors working together to bridge the gender gap in STEM
            </p>
          </div>

          {/* Hero Image */}
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <AspectRatio ratio={16/10}>
              <Image
                src="https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64863e7324d1d65cc87fe0ff_Join%20Our%20Team_1.png"
                alt="She Sharp team members at an event"
                fill
                className="object-cover"
                priority
              />
            </AspectRatio>
          </div>
        </div>
      </Container>
    </Section>
  );
}