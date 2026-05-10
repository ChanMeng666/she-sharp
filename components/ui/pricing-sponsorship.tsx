"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { tieredSponsors } from "@/lib/data/sponsors"

interface SponsorshipTier {
  name: string
  level: "bronze" | "silver" | "gold" | "platinum"
  description: string
  price: {
    monthly: number
    yearly: number
  }
  popular?: boolean
}

const tiers: SponsorshipTier[] = [
  {
    name: "Bronze",
    level: "bronze",
    description: "Essential visibility and community support",
    price: { monthly: 417, yearly: 5000 },
  },
  {
    name: "Silver",
    level: "silver",
    description: "Enhanced engagement and talent access",
    price: { monthly: 833, yearly: 10000 },
  },
  {
    name: "Gold",
    level: "gold",
    description: "Premium partnership with workshop hosting",
    price: { monthly: 1667, yearly: 20000 },
    popular: true,
  },
  {
    name: "Platinum",
    level: "platinum",
    description: "Executive partnership with naming rights",
    price: { monthly: 4167, yearly: 50000 },
  },
]

const features = [
  "Logo placement on She Sharp website",
  "Social media recognition and mentions",
  "Complimentary tickets to all events",
  "Featured in annual impact report",
]

export function SponsorshipPricing() {
  const [selectedTier, setSelectedTier] = React.useState<string>("gold")
  const [isYearly, setIsYearly] = React.useState(true)

  const currentTier = tiers.find((t) => t.level === selectedTier) || tiers[2]

  return (
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
                {/* Tier Selector */}
                <div className="inline-flex flex-wrap justify-center gap-1 p-1 rounded-full border border-[#1f1e44]/10 self-center">
                  {tiers.map((tier) => (
                    <button
                      key={tier.level}
                      type="button"
                      onClick={() => setSelectedTier(tier.level)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all",
                        selectedTier === tier.level
                          ? "bg-[#1f1e44] text-white"
                          : "text-[#1f1e44]/60 hover:text-[#1f1e44]"
                      )}
                    >
                      {tier.name}
                    </button>
                  ))}
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1f1e44]">
                    {currentTier.name} Partnership
                  </h3>
                  <p className="mt-1.5 text-base text-[#1f1e44]/50">
                    {currentTier.description}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <span className="text-4xl sm:text-5xl font-bold text-[#1f1e44]">
                    ${isYearly
                      ? currentTier.price.yearly.toLocaleString()
                      : currentTier.price.monthly.toLocaleString()}
                  </span>
                  <span className="ml-2 text-sm text-[#1f1e44]/40">
                    NZD / {isYearly ? "year" : "month"}
                  </span>
                </div>

                {/* Interval Toggle */}
                <div className="inline-flex rounded-full border border-[#1f1e44]/10 p-1 self-center">
                  <button
                    type="button"
                    onClick={() => setIsYearly(false)}
                    className={cn(
                      "rounded-full px-5 py-2 text-sm font-medium transition-all",
                      !isYearly ? "bg-[#8982ff] text-white" : "text-[#1f1e44]/50 hover:text-[#1f1e44]"
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsYearly(true)}
                    className={cn(
                      "rounded-full px-5 py-2 text-sm font-medium transition-all",
                      isYearly ? "bg-[#8982ff] text-white" : "text-[#1f1e44]/50 hover:text-[#1f1e44]"
                    )}
                  >
                    Annual
                  </button>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-3">
                  <Button asChild size="lg" className="w-full">
                    <Link href="mailto:industry@shesharp.org.nz">
                      Get started
                    </Link>
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

                <p className="text-xs text-[#1f1e44]/40">All packages are customizable</p>
              </div>

              {/* Right Side */}
              <div className="flex flex-col gap-10 p-8 sm:p-10 md:p-12 lg:p-16">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#1f1e44]/40 mb-4">
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
  )
}
