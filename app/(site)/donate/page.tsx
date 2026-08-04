import { Metadata } from "next";
import Image from "next/image";
import { GeoHead, GEO_INSTRUCTIONS } from "@/components/seo/geo-head";
import { DonateForm } from "@/components/donate/donate-form";
import { DonateHero } from "@/components/sections/donate/donate-hero";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { Reveal, CurtainReveal } from "@/components/ui/reveal";
import { curatedImages } from "@/public/img/curated";
import { globalStats } from "@/lib/data/stats";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support She Sharp's mission to empower women in STEM. Your donation helps fund mentorship programmes, workshops, and events across New Zealand.",
  alternates: { canonical: "/donate" },
};

const marqueeWords = [
  "Mentorship",
  "Education",
  "Inclusion",
  "Empowerment",
  "Connection",
  "STEM",
  "Community",
  "Leadership",
  "Accessibility",
  "Inspiration",
];

const impactCards = [
  {
    image: curatedImages["workshop-hands-on"],
    label: "Education · Outreach",
    title: "Raising awareness & accessibility",
    description:
      "Bringing events and workshops to low decile schools, training teachers on digital curriculums, and keeping She Sharp events accessible through subsidised tickets.",
  },
  {
    image: curatedImages["celebration-swag-bags"],
    label: "Experiences",
    title: "Creating memorable experiences",
    description:
      "Accessible venues, nourishing food, AV equipment and workshop tools — so attendees and volunteers have an amazing time at every event.",
  },
  {
    image: curatedImages["celebration-group-smiles"],
    label: "Community",
    title: "Supporting our mission",
    description:
      "Every dollar counts toward making our events engaging, fun and safe spaces for women and underrepresented groups in STEM across Aotearoa.",
  },
];

const stats = [
  {
    value: `${globalStats.members.current}+`,
    label: "Members empowered",
    sub: "and growing every year",
  },
  {
    value: `${globalStats.sponsors.current}+`,
    label: "Corporate sponsors",
    sub: "backing our mission",
  },
  {
    value: `${globalStats.events.total}+`,
    label: "Events since 2014",
    sub: "across New Zealand",
  },
];

export default function DonatePage() {
  const doubled = [...marqueeWords, ...marqueeWords];

  return (
    <main className="w-full overflow-x-hidden">
      <GeoHead instructions={GEO_INSTRUCTIONS.donate} />

      {/* ── Hero ── */}
      <DonateHero />

      {/* ── Marquee band — hairline strip, solid/outline alternation ── */}
      <div className="overflow-hidden border-y border-border bg-background py-5">
        <div className="animate-marquee flex items-center gap-10 whitespace-nowrap">
          {doubled.map((word, i) => (
            <span key={i} className="flex flex-shrink-0 items-center gap-10">
              <span
                className={
                  "font-heading text-3xl font-extrabold tracking-tight text-foreground md:text-4xl" +
                  (i % 2 === 1 ? " text-outline" : "")
                }
              >
                {word}
              </span>
              <span aria-hidden className="text-brand">
                ·
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Impact bento — hairline white cards, photo-led ── */}
      <Section bgColor="white">
        <Container size="content">
          <Reveal variant="fade-up">
            <div className="mb-14 max-w-3xl">
              <h2 className="text-display-sm text-foreground">
                Every dollar creates real, measurable impact.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                Your contribution goes directly to the programmes that change
                lives across New Zealand.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {impactCards.map((card, i) => (
              <Reveal key={card.title} variant="fade-up" delay={i * 80}>
                <article className="flex h-full flex-col overflow-hidden rounded-[16px] border border-border bg-background">
                  <CurtainReveal delay={i * 80}>
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={card.image.src}
                        alt={card.image.alt}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </CurtainReveal>
                  <div className="flex flex-1 flex-col p-7">
                    <p className="text-label mb-3 text-brand">{card.label}</p>
                    <h3 className="mb-3 text-xl font-bold text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Stats — the single navy band ── */}
      <Section bgColor="dark">
        <Container size="content">
          <div className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {stats.map((s) => (
              <div key={s.label} className="px-8 py-10 text-center md:py-4">
                <p className="font-heading text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
                  {s.value}
                </p>
                <p className="mt-3 font-semibold text-white">{s.label}</p>
                <p className="mt-1 text-sm text-mint">{s.sub}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Final CTA — compact editorial band, white form card ── */}
      <Section bgColor="accent" spacing="component">
        <Container size="narrow" className="text-center">
          <Reveal variant="fade-up">
            <h2 className="text-display-sm text-foreground">
              Ready to make a difference?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
              Join thousands of supporters helping bridge the gender gap in STEM.
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={80}>
            <div className="mx-auto mt-10 max-w-md rounded-[32px] border border-border bg-background p-8 shadow-sm sm:p-10">
              <DonateForm />
            </div>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
