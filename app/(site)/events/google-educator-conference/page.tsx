import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { CTASection } from "@/components/home/CTA-section";

export const metadata: Metadata = {
  title: { absolute: "Google Educator Conference | She Sharp" },
  description:
    "The Google Educator Conference (formerly CS4HS), brought to you by Google and She Sharp, upskills New Zealand's digital technology educators. Explore the 2023 and 2024 editions.",
  // Self-canonical; otherwise this page inherits the events layout's "/events"
  // canonical and reads as a duplicate of the events index.
  alternates: { canonical: "/events/google-educator-conference" },
};

const EDITIONS = [
  {
    year: "2023",
    href: "/events/google-educator-conference-2023",
    image: "/img/scraped/conference/hub/gec-2023-tile.jpg",
  },
  {
    year: "2024",
    href: "/events/google-educator-conference-2024",
    image: "/img/scraped/conference/hub/gec-2024-tile.png",
  },
];

const MESSAGES = [
  {
    title: "Our Events",
    shape: "events" as const,
    paragraphs: [
      "Every year, we organise several events and try to cover every aspect of tech.",
      "We invite speakers to share their experiences, what drives them, and what they are involved with on a day-to-day basis.",
    ],
  },
  {
    title: "Our Workshops",
    shape: "workshops" as const,
    paragraphs: [
      "Then we have hands-on workshops to give participants practical skills or provide a first-hand demonstration of tech-based skills.",
    ],
  },
  {
    title: "Our Community",
    shape: "community" as const,
    paragraphs: [
      "Our events are open to anyone identifying as a woman, where you can get to know the She Sharp community, learn and have fun. Don't worry if you don't know anyone, we're a friendly community! So we hope to see you in our next event!",
    ],
  },
];

export default function GoogleEducatorConferenceHub() {
  return (
    <>
      <Section spacing="section" className="pt-28 pb-12 md:pt-32 md:pb-16">
        <Container size="full">
          {/* Title */}
          <h1 className="text-center text-display-sm text-foreground">
            Google Educator Conference
          </h1>

          {/* Edition tiles */}
          <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-5xl mx-auto">
            {EDITIONS.map((ed) => (
              <Link key={ed.year} href={ed.href} className="group block">
                <div className="overflow-hidden rounded-[32px] border border-border bg-muted transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ed.image}
                      alt={`Google Educator Conference ${ed.year}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
                <p className="mt-4 text-center text-xl font-bold text-brand">
                  {ed.year}
                </p>
              </Link>
            ))}
          </div>

          {/* Formerly known as CS4HS */}
          <div className="mt-8 flex justify-center">
            <span className="inline-flex items-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white">
              Formerly known as CS4HS
            </span>
          </div>
        </Container>
      </Section>

      {/* Message to the Community */}
      <Section spacing="section" className="pb-12 md:pb-16">
        <Container size="content">
          <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-10 md:mb-14">
            Message to the community
          </h2>

          <div className="divide-y divide-border">
            {MESSAGES.map((m) => (
              <div
                key={m.title}
                className="grid grid-cols-1 sm:grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(160px,1fr)_2fr] gap-4 md:gap-8 items-start py-8 md:py-10"
              >
                <MessageShape shape={m.shape} />
                <h3 className="text-xl md:text-2xl font-bold text-foreground">
                  {m.title}
                </h3>
                <div className="space-y-3">
                  {m.paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className="text-sm md:text-base text-muted-foreground leading-relaxed"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Bridge the Gender Gap CTA */}
      <CTASection />
    </>
  );
}

/** Decorative She Sharp brand shapes used beside each community message. */
function MessageShape({ shape }: { shape: "events" | "workshops" | "community" }) {
  if (shape === "events") {
    // Magenta facing half-circles — the She Sharp bracket motif.
    return (
      <svg viewBox="0 0 80 80" className="h-16 w-16 shrink-0" aria-hidden="true">
        <path d="M36 8 A32 32 0 0 0 36 72 Z" fill="#9b2e83" />
        <path d="M44 8 A32 32 0 0 1 44 72 Z" fill="#9b2e83" />
      </svg>
    );
  }
  if (shape === "workshops") {
    // Mint quarter-circle bowtie.
    return (
      <svg viewBox="0 0 80 80" className="h-16 w-16 shrink-0" aria-hidden="true">
        <path d="M8 8 H40 A32 32 0 0 1 8 40 Z" fill="#b1f6e9" />
        <path d="M72 72 H40 A32 32 0 0 1 72 40 Z" fill="#b1f6e9" />
      </svg>
    );
  }
  // Light-purple circle.
  return (
    <svg viewBox="0 0 80 80" className="h-16 w-16 shrink-0" aria-hidden="true">
      <circle cx="40" cy="40" r="30" fill="#f7e5f3" />
    </svg>
  );
}
