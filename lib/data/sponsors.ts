/**
 * Sponsor data — single source of truth for all sponsor displays.
 *
 * Update this file when adding, removing, or changing sponsor tiers.
 * Components that consume this data:
 *   - components/home/sponsors-section.tsx (homepage tier display)
 *   - components/ui/pricing-sponsorship.tsx (sponsorship page logos)
 */

export type SponsorTier = "platinum" | "gold" | "silver" | "bronze";

export interface TieredSponsor {
  name: string;
  logo: string;
  description: string;
  url: string;
  tier: SponsorTier;
}

export const tieredSponsors: TieredSponsor[] = [
  {
    name: "MSD",
    logo: "/sponsors/msd-logo.svg",
    description: "We help New Zealanders to be safe, strong and independent",
    url: "https://www.msd.govt.nz/",
    tier: "gold",
  },
  {
    name: "HCLTech",
    logo: "/sponsors/hcltech-logo.svg",
    description: "Technology that makes a difference",
    url: "https://www.hcltech.com/",
    tier: "silver",
  },
  {
    name: "academyEX",
    logo: "/sponsors/aex-logo.png",
    description: "New Zealand's only private postgraduate institute for mid-career professionals",
    url: "https://academyex.com/",
    tier: "bronze",
  },
  {
    name: "metlifecare",
    logo: "/sponsors/metlifecare-logo.png",
    description: "Metlifecare retirement villages",
    url: "https://www.metlifecare.co.nz/",
    tier: "bronze",
  },
  {
    name: "Xero",
    logo: "/sponsors/xero-logo.png",
    description: "Small business accounting to set you free",
    url: "https://www.xero.com/nz/",
    tier: "bronze",
  },
  {
    name: "AI Forum New Zealand",
    logo: "/sponsors/AIFNZ-logo.png",
    description: "New Zealand's AI community",
    url: "https://aiforum.org.nz/",
    tier: "bronze",
  },
];

export const getSponsorsByTier = (tier: SponsorTier): TieredSponsor[] =>
  tieredSponsors.filter((s) => s.tier === tier);
