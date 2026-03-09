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
    name: "HCLTech",
    logo: "/logos/hcltech-logo.svg",
    description: "Technology that makes a difference",
    url: "https://www.hcltech.com",
    tier: "silver",
  },
  {
    name: "Fonterra",
    logo: "/logos/fonterra-logo.svg",
    description: "Innovation in every byte",
    url: "https://www.fonterra.com",
    tier: "silver",
  },
  {
    name: "MYOB",
    logo: "/logos/myob-logo.svg",
    description: "Business solutions for growth",
    url: "https://www.myob.com",
    tier: "silver",
  },
  {
    name: "Fisher & Paykel Healthcare",
    logo: "/logos/FPHcare-logo.svg",
    description: "Healthcare innovation",
    url: "https://www.fphcare.com",
    tier: "bronze",
  },
];

export const getSponsorsByTier = (tier: SponsorTier): TieredSponsor[] =>
  tieredSponsors.filter((s) => s.tier === tier);
