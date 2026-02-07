import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ctaItems = [
  {
    icon: "💰",
    title: "Donate to She Sharp",
    description: "Help us empower more young women to pursue careers in STEM through events and networking opportunities.",
    buttonText: "Make a donation",
    href: "/donate"
  },
  {
    icon: "🎉",
    title: "Come to an event",
    description: "Meet new people, network with companies, engage in workshops and learn more about working in STEM!",
    buttonText: "Explore Events",
    href: "/events"
  }
];

export function MentorsCTASection() {
  return (
    <Section className="py-16 bg-gray-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-navy uppercase">
            Bridge the Gender Gap in STEM with Us
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {ctaItems.map((item) => (
            <Card key={item.title} className="text-center">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-navy mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {item.description}
                </p>
                <Button asChild variant="outline" size="lg" className="text-purple-dark border-purple-dark hover:bg-purple-light">
                  <Link href={item.href}>{item.buttonText}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}