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

/**
 * Curated sponsor logos for the homepage scrolling section.
 * All files are clean SVGs stored in /public/img/sponsors/.
 */
export interface ScrollingSponsorLogo {
  name: string;
  logo: string;
}

export const scrollingSponsorLogos: ScrollingSponsorLogo[] = [
  { name: "HCLTech", logo: "/img/sponsors/hcltech.svg" },
  { name: "Vector", logo: "/img/sponsors/vector.svg" },
  { name: "Xero", logo: "/img/sponsors/xero.svg" },
  { name: "Secure Code Warrior", logo: "/img/sponsors/secure-code-warrior.svg" },
  { name: "Fonterra", logo: "/img/sponsors/fonterra.svg" },
  { name: "Hewlett Packard Enterprise", logo: "/img/sponsors/hpe.svg" },
  { name: "MYOB", logo: "/img/sponsors/myob.svg" },
  { name: "Deloitte", logo: "/img/sponsors/deloitte.svg" },
  { name: "AI Forum New Zealand", logo: "/img/sponsors/aifnz.svg" },
  { name: "Fisher & Paykel Healthcare", logo: "/img/sponsors/fph.svg" },
  { name: "Fiserv", logo: "/img/sponsors/fiserv.svg" },
  { name: "Woolworths", logo: "/img/sponsors/woolworths.svg" },
  { name: "Google", logo: "/img/sponsors/google.svg" },
  { name: "Trade Me", logo: "/img/sponsors/trade-me.svg" },
  { name: "Westpac", logo: "/img/sponsors/westpac.svg" },
  { name: "Grid AKL", logo: "/img/sponsors/grid-akl.svg" },
  { name: "IBM", logo: "/img/sponsors/ibm.svg" },
  { name: "Orion Health", logo: "/img/sponsors/orion-health.svg" },
  { name: "Microsoft", logo: "/img/sponsors/microsoft.svg" },
  { name: "Flexware", logo: "/img/sponsors/flexware.svg" },
  { name: "AUT", logo: "/img/sponsors/aut.svg" },
  { name: "Pushpay", logo: "/img/sponsors/pushpay.svg" },
  { name: "Nyriad", logo: "/img/sponsors/nyriad.svg" },
  { name: "Vend", logo: "/img/sponsors/vend.svg" },
  { name: "Air New Zealand", logo: "/img/sponsors/air-new-zealand.svg" },
  { name: "Centrality", logo: "/img/sponsors/centrality.svg" },
  { name: "AWS", logo: "/img/sponsors/aws.svg" },
  { name: "Wāhine Kākano", logo: "/img/sponsors/wahine-kakano.svg" },
  { name: "Workday", logo: "/img/sponsors/workday.svg" },
  { name: "Fergus", logo: "/img/sponsors/fergus.svg" },
  { name: "EY", logo: "/img/sponsors/ey.svg" },
  { name: "Geo AR Games", logo: "/img/sponsors/geo-ar-games.svg" },
  { name: "Kiwibank", logo: "/img/sponsors/kiwibank.svg" },
  { name: "Countdown", logo: "/img/sponsors/countdown.svg" },
  { name: "ANZ", logo: "/img/sponsors/anz.svg" },
  { name: "academyEX", logo: "/img/sponsors/academyex.svg" },
  { name: "Metlifecare", logo: "/img/sponsors/metlifecare.svg" },
  { name: "Auckland Council", logo: "/img/sponsors/auckland-council.svg" },
];
