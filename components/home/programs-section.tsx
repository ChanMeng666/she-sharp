"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/ui/reveal";

type Program = {
  number: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  eyebrow?: string;
};

// The four ways to take part — a full-width editorial index, Her Waka folded
// in as an external row rather than a standalone banner.
const PROGRAMS: Program[] = [
  {
    number: "01",
    title: "Mentorship",
    description:
      "One-to-one matching with experienced women in tech for guidance and growth.",
    href: "/mentorship",
  },
  {
    number: "02",
    title: "Monthly events",
    description:
      "Workshops, panels and networking gatherings across Aotearoa, all year round.",
    href: "/events",
  },
  {
    number: "03",
    title: "Her Waka",
    eyebrow: "SheSharp × Ministry of Social Development",
    description:
      "A free workshop series navigating pathways into sustainable employment.",
    href: "https://herwaka.shesharp.org.nz/",
    external: true,
  },
  {
    number: "04",
    title: "Skills development",
    description:
      "Hands-on technical and leadership building through peer learning and practice.",
    href: "/join-our-team",
  },
];

function ProgramRow({ program }: { program: Program }) {
  const content = (
    <div className="group relative isolate overflow-hidden border-t border-border">
      {/* Soft purple tint sweeps up from the bottom on hover. */}
      <div className="absolute inset-0 -z-10 translate-y-full bg-surface-purple transition-transform duration-500 [transition-timing-function:var(--ease-snap)] group-hover:translate-y-0" />

      <div className="flex items-center gap-4 px-1 py-8 md:gap-8 md:py-12">
        <span className="text-label w-10 shrink-0 text-brand md:w-16">
          {program.number}
        </span>

        <div className="min-w-0 flex-1">
          {program.eyebrow && (
            <p className="text-label mb-2 text-ink-500">{program.eyebrow}</p>
          )}
          <h3 className="text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
            {program.title}
          </h3>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-600">
            {program.description}
          </p>
        </div>

        <ArrowUpRight className="h-8 w-8 shrink-0 -translate-x-2 text-foreground opacity-0 transition-all duration-300 [transition-timing-function:var(--ease-out-expo)] group-hover:translate-x-0 group-hover:opacity-100 md:h-10 md:w-10" />
      </div>
    </div>
  );

  return program.external ? (
    <a href={program.href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    <Link href={program.href}>{content}</Link>
  );
}

export function ProgramsSection() {
  return (
    <Section bgColor="white">
      <Container size="full">
        <Reveal className="mb-12 flex items-end justify-between gap-6 md:mb-16">
          <div>
            <span className="text-label mb-3 block text-brand">(03)</span>
            <h2 className="text-display-sm text-foreground">Programmes</h2>
          </div>
          <span className="text-outline hidden text-display-sm text-foreground md:block">
            take part
          </span>
        </Reveal>

        <div className="border-b border-border">
          {PROGRAMS.map((program, i) => (
            <Reveal key={program.title} delay={i * 60}>
              <ProgramRow program={program} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
