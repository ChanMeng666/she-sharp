"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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

interface SponsorLogo {
  name: string
  logo: string
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

const sponsors: SponsorLogo[] = [
  {
    name: "HCLTech",
    logo: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/6470185f85072710b161d610_hcltech-logo.svg",
  },
  {
    name: "Fonterra",
    logo: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/65e50fc6d2f01ad68fb15688_fonterra.png",
  },
  {
    name: "MYOB",
    logo: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64701860f27305f34ecc8b66_myob-logo.svg",
  },
  {
    name: "Fisher & Paykel Healthcare",
    logo: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/65d80a4331c46a8a017e669f_PNG%20-%20for%20web%2C%20video%2C%20%26%20MS%20Office_F%26P_HEALTHCARE-BLACK.png",
  },
]

export function SponsorshipPricing() {
  const [selectedTier, setSelectedTier] = React.useState<string>("gold")
  const [isYearly, setIsYearly] = React.useState(true)

  const currentTier = tiers.find((t) => t.level === selectedTier) || tiers[2]

  return (
    <div className="relative py-16 md:py-32 bg-[#eaf2ff]">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold md:text-4xl lg:text-5xl text-[#1f1e44]">
            Partner with Purpose
          </h2>
          <p className="mx-auto mt-4 max-w-md text-balance text-lg text-[#1f1e44]/60">
            Join leading organizations in empowering women in STEM through strategic corporate partnerships
          </p>
        </div>

        {/* Main Card */}
        <div className="mt-8 md:mt-16">
          <div className="relative rounded-[50px] bg-white shadow-sm overflow-hidden">
            <div className="grid items-center gap-12 divide-y divide-[#1f1e44]/10 p-8 md:p-12 md:grid-cols-2 md:divide-x md:divide-y-0">
              {/* Left Side */}
              <div className="pb-12 text-center md:pb-0 md:pr-12">
                {/* Tier Selector */}
                <div className="mb-6">
                  <div className="inline-flex flex-wrap justify-center gap-1 p-1 rounded-full border border-[#1f1e44]/10">
                    {tiers.map((tier) => (
                      <button
                        key={tier.level}
                        type="button"
                        onClick={() => setSelectedTier(tier.level)}
                        className={cn(
                          "relative rounded-full px-4 py-2 text-sm font-medium transition-all",
                          selectedTier === tier.level
                            ? "bg-[#1f1e44] text-white"
                            : "text-[#1f1e44]/60 hover:text-[#1f1e44]"
                        )}
                      >
                        {tier.name}
                        {tier.popular && selectedTier === tier.level && (
                          <span className="ml-1 text-white/60">•</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-[#1f1e44]">
                  {currentTier.name} Partnership
                </h3>
                <p className="mt-1 text-[#1f1e44]/50">
                  {currentTier.description}
                </p>

                {/* Price */}
                <div className="my-8">
                  <span className="text-5xl font-bold text-[#1f1e44]">
                    ${isYearly
                      ? currentTier.price.yearly.toLocaleString()
                      : currentTier.price.monthly.toLocaleString()}
                  </span>
                  <span className="ml-2 text-[#1f1e44]/40">
                    NZD / {isYearly ? "year" : "month"}
                  </span>
                </div>

                {/* Interval Toggle */}
                <div className="mb-8">
                  <div className="inline-flex rounded-full border border-[#1f1e44]/10 p-1">
                    <button
                      type="button"
                      onClick={() => setIsYearly(false)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                        !isYearly
                          ? "bg-[#8982ff] text-white"
                          : "text-[#1f1e44]/50 hover:text-[#1f1e44]"
                      )}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsYearly(true)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                        isYearly
                          ? "bg-[#8982ff] text-white"
                          : "text-[#1f1e44]/50 hover:text-[#1f1e44]"
                      )}
                    >
                      Annual
                    </button>
                  </div>
                </div>

                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="mailto:industry@shesharp.org.nz">
                    <span className="hidden sm:inline">Get started</span>
                    <span className="sm:hidden">Email us to get started</span>
                  </Link>
                </Button>

                <p className="mt-4 text-sm text-[#1f1e44]/60">
                  <Link
                    href="mailto:industry@shesharp.org.nz"
                    className="underline underline-offset-2 hover:text-[#8982ff] transition-colors"
                  >
                    industry@shesharp.org.nz
                  </Link>
                </p>

                <p className="mt-2 text-sm text-[#1f1e44]/40">
                  All packages are customizable
                </p>
              </div>

              {/* Right Side */}
              <div className="relative pt-12 md:pl-12 md:pt-0">
                <ul role="list" className="space-y-4">
                  {features.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="size-4 text-[#8982ff]" strokeWidth={2.5} />
                      <span className="text-[#1f1e44]">{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-8 text-sm text-[#1f1e44]/40">
                  Organizations supporting our mission:
                </p>

                {/* Logo Wall */}
                <div className="mt-6 flex flex-wrap items-center gap-8">
                  {sponsors.map((sponsor) => (
                    <Image
                      key={sponsor.name}
                      className="h-10 w-auto"
                      src={sponsor.logo}
                      alt={sponsor.name}
                      height={40}
                      width={120}
                      style={{ height: "40px", width: "auto" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
