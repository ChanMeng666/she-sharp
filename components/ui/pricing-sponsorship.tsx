"use client"

import * as React from "react"
import Image from "next/image"
import { Check, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll"
import { tieredSponsors, scrollingSponsorLogos } from "@/lib/data/sponsors"

interface SponsorshipTier {
  name: string
  level: "bronze" | "silver" | "gold" | "platinum"
  description: string
  accent: string
  accentBg: string
  popular?: boolean
}

const tiers: SponsorshipTier[] = [
  {
    name: "Bronze",
    level: "bronze",
    description: "Essential visibility and community support",
    accent: "text-amber-700",
    accentBg: "bg-amber-700",
  },
  {
    name: "Silver",
    level: "silver",
    description: "Enhanced engagement and talent access",
    accent: "text-slate-500",
    accentBg: "bg-slate-500",
  },
  {
    name: "Gold",
    level: "gold",
    description: "Premium partnership with workshop hosting",
    accent: "text-yellow-600",
    accentBg: "bg-yellow-600",
    popular: true,
  },
  {
    name: "Platinum",
    level: "platinum",
    description: "Executive partnership with naming rights",
    accent: "text-[#8982ff]",
    accentBg: "bg-[#8982ff]",
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

export function SponsorshipPricing() {
  const [selectedTier, setSelectedTier] = React.useState<string>("gold")

  const currentTier = tiers.find((t) => t.level === selectedTier) || tiers[2]

  const scrollToForm = () => {
    document.getElementById("sponsor-inquiry")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <>
      {/* ── Header + Pricing Card ────────────────────── */}
      <div className="relative pt-28 pb-16 md:pt-24 lg:py-32 bg-navy-light">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-display-sm text-[#1f1e44]">
              Partner with Purpose
            </h2>
            <p className="mx-auto mt-4 max-w-md text-balance text-lg text-[#1f1e44]/60">
              Join leading organisations in empowering women in STEM through strategic corporate partnerships
            </p>
          </div>

          {/* Main Card */}
          <div className="mt-6 sm:mt-8 md:mt-12 lg:mt-16">
            <div className="relative rounded-[var(--radius-card-sm)] md:rounded-[var(--radius-card-md)] lg:rounded-[var(--radius-card-lg)] bg-white shadow-sm overflow-hidden">
              <div className="grid items-stretch divide-y divide-[#1f1e44]/10 md:grid-cols-2 md:divide-x md:divide-y-0">

                {/* Left Side */}
                <div className="flex flex-col gap-8 p-8 sm:p-10 md:p-12 lg:p-16 text-center">
                  {/* Tier selector */}
                  <div className="inline-flex flex-wrap justify-center gap-1 p-1 rounded-full border border-[#1f1e44]/10 self-center">
                    {tiers.map((tier) => (
                      <button
                        key={tier.level}
                        type="button"
                        onClick={() => setSelectedTier(tier.level)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all duration-200",
                          selectedTier === tier.level
                            ? "bg-[#1f1e44] text-white"
                            : "text-[#1f1e44]/60 hover:text-[#1f1e44]"
                        )}
                      >
                        {tier.name}
                      </button>
                    ))}
                  </div>

                  {/* Tier info */}
                  <div className="flex flex-col items-center gap-3">   
                    <h3 className="text-xl font-semibold text-[#1f1e44]">
                      {currentTier.name} Partnership
                    </h3>
                    <p className="text-base text-[#1f1e44]/50">
                      {currentTier.description}
                    </p>
                  </div>

                  {/* Pricing on request */}
                  <div className="rounded-2xl bg-muted px-6 py-5">
                    <p className="text-sm font-medium text-[#1f1e44]/70">
                      Pricing available on request
                    </p>
                    <p className="mt-1 text-xs text-[#1f1e44]/40">
                      Packages are flexible and customised to your organisation
                    </p>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-3">
                    <Button size="lg" className="w-full" onClick={scrollToForm}>
                      Get in touch
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full">
                      <a
                        href="https://www.canva.com/design/DAHEOHdWczc/O-5RYZ-H6O4_YGuYvpJAGw/view?utm_content=DA[%E2%80%A6]hare&utm_medium=link2&utm_source=uniquelinks&utlId=h16731fdbbe"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View packages
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Right Side */}
                <div className="flex flex-col gap-10 p-8 sm:p-10 md:p-12 lg:p-16">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#1f1e44]/40 mb-5">
                      All partnerships include
                    </p>
                    <ul role="list" className="space-y-5">
                      {features.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <Check className="size-5 text-[#8982ff] shrink-0 mt-0.5" strokeWidth={2.5} />
                          <span className="text-base text-[#1f1e44]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#1f1e44]/40 mb-5">
                      Organisations supporting our mission
                    </p>
                    <div className="grid grid-cols-3 gap-x-8 gap-y-6 items-center">
                      {tieredSponsors.map((sponsor) => (
                        <Image
                          key={sponsor.name}
                          src={sponsor.logo}
                          alt={sponsor.name}
                          height={36}
                          width={110}
                          className="h-7 md:h-8 w-auto"
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
      <section className="bg-white py-20 md:py-28 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-16 md:mb-20">
            <AnimateOnScroll variant="fade-right">
              <h2 className="text-display-sm text-foreground leading-tight">
                Partner with us to design events that connect, inspire, and empower
              </h2>
            </AnimateOnScroll>
            <AnimateOnScroll variant="fade-left">
              <p className="text-lg text-muted-foreground leading-relaxed lg:pt-3">
                As a nonprofit, our work isn&apos;t possible without our sponsors. Some of New Zealand&apos;s leading organisations support She Sharp by showcasing role models in STEM, providing networking opportunities, and supporting women into employment.
              </p>
            </AnimateOnScroll>
          </div>

          {/* Event stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border mb-16 md:mb-20 rounded-2xl overflow-hidden">
            {EVENT_STATS.map((stat, i) => (
              <AnimateOnScroll key={stat.label} variant="fade-up" delay={i * 80} className="h-full">
                <div className="bg-white h-full px-8 py-10 flex flex-col gap-2">
                  <p className="text-5xl font-extrabold text-foreground">{stat.value}</p>
                  <p className="text-base text-muted-foreground">{stat.label}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          {/* Event photo grid */}
          <AnimateOnScroll variant="fade-up" delay={80}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:h-[460px]">
              <div className="relative md:row-span-2 rounded-2xl overflow-hidden aspect-[3/4] md:aspect-auto">
                <Image
                  src="/img/scraped/photos/64978c23a0ebb88792c4e9a6_Photo_with_Deloitte_Brand_184c052a.jpg"
                  alt="She Sharp event with Deloitte"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src="/img/scraped/photos/64978c4306fcffbd9763ebf7_Workshop_Photo_c086205c.jpg"
                  alt="She Sharp workshop"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src="/img/scraped/photos/6541ef682a7fd4b2ce49a32c_hero_Image_AWS_c422053e.jpg"
                  alt="She Sharp AWS event"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src="/img/scraped/photos/6502ac69333050f6e1b7db0f_Techweek1_cab2599f.jpg"
                  alt="She Sharp at Techweek"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src="/img/scraped/photos/655ae7b00b6d67bbe068ff3b_WITech1_cd2d1cd0.jpg"
                  alt="Women in Tech event"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </AnimateOnScroll>

        </div>
      </section>

      {/* ── Historical Supporters ────────────────────── */}
      <section className="bg-muted py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll variant="fade-up">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-12">
              Supported by New Zealand&apos;s leading organisations
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll variant="fade-up" delay={100}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-8 gap-y-8 items-center">
              {scrollingSponsorLogos.map((sponsor) => (
                <div key={sponsor.name} className="flex items-center justify-center">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    height={32}
                    width={100}
                    className="h-6 md:h-7 w-auto grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  )
}
