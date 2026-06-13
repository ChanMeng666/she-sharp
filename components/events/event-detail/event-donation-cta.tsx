import Link from "next/link";
import { ArrowRight, CalendarDays, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

// The closing "Bridge the gender gap" CTA from the legacy conference pages:
// two cards (donate / attend an event). The legacy page also carried a hidden
// "Become a member" card, which is intentionally omitted as it is not shown to
// visitors there.
const CARDS = [
  {
    icon: Heart,
    title: "Donate to She Sharp",
    body: "Help us empower more young women to pursue careers in STEM through events and networking opportunities.",
    cta: "Make a donation",
    href: "/donate",
  },
  {
    icon: CalendarDays,
    title: "Come to an event",
    body: "Meet new people, network with companies, engage in workshops and learn more about working in STEM!",
    cta: "Explore Events",
    href: "/events",
  },
];

export function EventDonationCta() {
  return (
    <Section spacing="section" className="bg-muted">
      <Container size="content">
        <h2 className="text-left text-display-sm uppercase tracking-wide text-foreground mb-10">
          Bridge the gender gap in STEM with us
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="card-responsive-sm bg-background p-5 sm:p-6 md:p-8 shadow-sm flex flex-col h-full"
            >
              <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-0">
                <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center lg:mb-4">
                  <card.icon className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  {card.title}
                </h3>
              </div>
              <p className="mt-3 sm:mt-4 flex-1 text-sm md:text-base text-muted-foreground leading-relaxed">
                {card.body}
              </p>
              <div className="mt-5 sm:mt-6">
                <Button asChild variant="brand">
                  <Link href={card.href} className="inline-flex items-center gap-1.5">
                    {card.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
