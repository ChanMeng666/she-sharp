"use client"

import * as React from "react"
import Image from "next/image"
import { Check, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Reveal, CurtainReveal } from "@/components/ui/reveal"
import { curatedImages } from "@/public/img/curated"
import { tieredSponsors, scrollingSponsorLogos } from "@/lib/data/sponsors"

interface SponsorshipTier {
  name: string
  level: "bronze" | "silver" | "gold" | "platinum"
  description: string
}

const tiers: SponsorshipTier[] = [
  {
    name: "Bronze",
    level: "bronze",
    description: "Essential visibility and community support",
  },
  {
    name: "Silver",
    level: "silver",
    description: "Enhanced engagement and talent access",
  },
  {
    name: "Gold",
    level: "gold",
    description: "Premium partnership with workshop hosting",
  },
  {
    name: "Platinum",
    level: "platinum",
    description: "Executive partnership with naming rights",
  },
]

const features = [
  "Logo placement on She Sharp website",
  "Social media recognition and mentions",
  "Complimentary tickets to all events",
  "Featured in annual impact report",
]

const EVENT_STATS = [
  { value: "95+", label: "Attendees per event" },
  { value: "8", label: "Events per year" },
  { value: "80+", label: "Events held since 2014" },
]

// Curated event photography for the asymmetric sponsorship grid.
const EVENT_GALLERY = [
  curatedImages["panel-fireside-chat"],
  curatedImages["workshop-collaboration"],
  curatedImages["speaker-stage-spotlight"],
  curatedImages["workshop-team-build"],
  curatedImages["panel-discussion"],
] as const

export function SponsorshipPricing() {
  const [selectedTier, setSelectedTier] = React.useState<string>("gold")

  const currentTier = tiers.find((t) => t.level === selectedTier) || tiers[2]

  const scrollToForm = () => {
    document.getElementById("sponsor-inquiry")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <>
      {/* ── Header + Pricing Card ────────────────────── */}
      <div className="relative bg-muted pt-28 pb-16 md:pt-32 md:pb-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow-script mb-3 text-3xl sm:text-4xl">
              For our sponsors
            </p>
            <h2 className="text-balance text-display-sm text-foreground">
              Partner with purpose
            </h2>
            <p className="mx-auto mt-4 max-w-md text-balance text-lg text-muted-foreground">
              Join leading organisations in empowering women in STEM through
              strategic corporate partnerships.
            </p>
          </div>

          {/* Main Card */}
          <div className="mt-10 sm:mt-12 md:mt-16">
            <div className="relative overflow-hidden rounded-[32px] border border-border bg-background">
              <div className="grid items-stretch divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">

                {/* Left Side */}
                <div className="flex flex-col gap-8 p-8 text-center sm:p-10 md:p-12 lg:p-16">
                  {/* Tier selector — segmented control, purple on selected */}
                  <div className="inline-flex flex-wrap justify-center gap-1 self-center rounded-full border border-border p-1">
                    {tiers.map((tier) => (
                      <button
                        key={tier.level}
                        type="button"
                        onClick={() => setSelectedTier(tier.level)}
                        aria-pressed={selectedTier === tier.level}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 sm:px-4 sm:py-2 sm:text-sm",
                          selectedTier === tier.level
                            ? "bg-brand text-brand-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tier.name}
                      </button>
                    ))}
                  </div>

                  {/* Tier info */}
                  <div className="flex flex-col items-center gap-3">
                    <h3 className="text-xl font-semibold text-foreground">
                      {currentTier.name} Partnership
                    </h3>
                    <p className="text-base text-muted-foreground">
                      {currentTier.description}
                    </p>
                  </div>

                  {/* Pricing on request */}
                  <div className="rounded-2xl bg-muted px-6 py-5">
                    <p className="text-sm font-medium text-foreground">
                      Pricing available on request
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Packages are flexible and customised to your organisation
                    </p>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-3">
                    <Button size="lg" variant="brand" className="w-full" onClick={scrollToForm}>
                      Get in touch
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full">
                      <a
                        href="https://www.canva.com/design/DAHEOHdWczc/O-5RYZ-H6O4_YGuYvpJAGw/view?utm_content=DA[%E2%80%A6]hare&utm_medium=link2&utm_source=uniquelinks&utlId=h16731fdbbe"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View packages
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Right Side */}
                <div className="flex flex-col gap-10 p-8 sm:p-10 md:p-12 lg:p-16">
                  <div>
                    <p className="text-label mb-5 text-muted-foreground">
                      All partnerships include
                    </p>
                    <ul role="list" className="space-y-5">
                      {features.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <Check className="mt-0.5 size-5 shrink-0 text-foreground" strokeWidth={2.5} />
                          <span className="text-base text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <p className="text-label mb-5 text-muted-foreground">
                      Organisations supporting our mission
                    </p>
                    <div className="grid grid-cols-3 items-center gap-x-8 gap-y-6">
                      {tieredSponsors.map((sponsor) => (
                        <Image
                          key={sponsor.name}
                          src={sponsor.logo}
                          alt={sponsor.name}
                          height={36}
                          width={110}
                          className="h-7 w-auto md:h-8"
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Events Section ───────────────────────────── */}
      <section className="bg-background py-20 md:py-28 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          <div className="mb-16 grid grid-cols-1 items-start gap-12 md:mb-20 lg:grid-cols-2 lg:gap-20">
            <Reveal variant="fade-right">
              <h2 className="text-display-sm leading-tight text-foreground">
                Partner with us to design events that connect, inspire, and empower
              </h2>
            </Reveal>
            <Reveal variant="fade-left">
              <p className="text-lg leading-relaxed text-muted-foreground lg:pt-3">
                As a nonprofit, our work isn&apos;t possible without our sponsors. Some of New Zealand&apos;s leading organisations support She Sharp by showcasing role models in STEM, providing networking opportunities, and supporting women into employment.
              </p>
            </Reveal>
          </div>

          {/* Event stats — editorial numbers, hairline dividers */}
          <div className="mb-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 md:mb-20">
            {EVENT_STATS.map((stat, i) => (
              <Reveal key={stat.label} variant="fade-up" delay={i * 80} className="h-full">
                <div className="flex h-full flex-col gap-2 bg-background px-8 py-10">
                  <p className="font-heading text-5xl font-extrabold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-base text-muted-foreground">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Event photo grid — asymmetric, curtain reveal */}
          <div className="grid grid-cols-2 gap-3 md:h-[460px] md:grid-cols-3">
            <CurtainReveal className="relative aspect-[3/4] overflow-hidden rounded-2xl md:row-span-2 md:aspect-auto md:h-full">
              <Image
                src={EVENT_GALLERY[0].src}
                alt={EVENT_GALLERY[0].alt}
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover"
              />
            </CurtainReveal>
            {EVENT_GALLERY.slice(1).map((img, i) => (
              <CurtainReveal
                key={img.src}
                delay={(i + 1) * 80}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl md:h-full md:aspect-auto"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover"
                />
              </CurtainReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ── Historical Supporters ────────────────────── */}
      <section className="bg-muted py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal variant="fade-up">
            <p className="text-label mb-12 text-center text-muted-foreground">
              Supported by New Zealand&apos;s leading organisations
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={100}>
            <div className="grid grid-cols-3 items-center gap-x-8 gap-y-8 sm:grid-cols-4 md:grid-cols-6">
              {scrollingSponsorLogos.map((sponsor) => (
                <div key={sponsor.name} className="flex items-center justify-center">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    height={32}
                    width={100}
                    className="h-6 w-auto grayscale transition-all duration-300 hover:grayscale-0 md:h-7"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
