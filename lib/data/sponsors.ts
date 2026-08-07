/**
 * Sponsor data — single source of truth for all sponsor displays.
 *
 * Two separate things live here and they are NOT interchangeable:
 *
 * 1. `tieredSponsors` → the homepage "Thanks to our sponsors" section, grouped
 *    Gold / Silver / Bronze. **This is the current year's approved tier table
 *    and the founder has reviewed it on the deployed site.** Do not rewrite the
 *    tiers from historical Slack discussion — She Sharp's tiers change year to
 *    year, and a 2025 instruction is not evidence about 2026.
 * 2. `scrollingSponsorLogoRows` → the homepage "Sponsors who have supported our
 *    events" band. This is a *cumulative* wall of everyone who has ever
 *    supported an event, not a statement about the current year, so it carries
 *    every logo in `public/img/sponsors/` that belongs to a supporting
 *    organisation.
 *
 * Components that consume this data:
 *   - components/home/sponsors-section.tsx (homepage tier display)
 *   - components/home/scrolling-sponsors-section.tsx (homepage logo band)
 *   - components/ui/pricing-sponsorship.tsx (sponsorship page logos)
 *
 * Checks: `npx tsx lib/data/sponsors.test.ts`
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
    logo: "/img/sponsors/msd.svg",
    description: "We help New Zealanders to be safe, strong and independent",
    url: "https://www.msd.govt.nz/",
    tier: "gold",
  },
  {
    name: "HCLTech",
    logo: "/img/sponsors/hcltech.svg",
    description: "Technology that makes a difference",
    url: "https://www.hcltech.com/",
    tier: "silver",
  },
  {
    name: "Les Mills",
    logo: "/img/sponsors/lesmills_logo.svg",
    description: "Inspiring the world to move",
    url: "https://www.lesmills.co.nz/",
    tier: "silver",
  },
  {
    name: "MYOB",
    logo: "/img/sponsors/myob.svg",
    description: "Business management platform",
    url: "https://www.myob.com/nz",
    tier: "silver",
  },
  {
    name: "AUT",
    logo: "/img/sponsors/aut.svg",
    description: "Auckland University of Technology",
    url: "https://www.aut.ac.nz/",
    tier: "silver",
  },
  {
    name: "academyEX",
    logo: "/img/sponsors/academyex.svg",
    description: "New Zealand's only private postgraduate institute for mid-career professionals",
    url: "https://academyex.com/",
    tier: "bronze",
  },
  {
    name: "Metlifecare",
    logo: "/img/sponsors/metlifecare.svg",
    description: "Metlifecare retirement villages",
    url: "https://www.metlifecare.co.nz/",
    tier: "bronze",
  },
  {
    name: "Xero",
    logo: "/img/sponsors/xero.svg",
    description: "Small business accounting to set you free",
    url: "https://www.xero.com/nz/",
    tier: "bronze",
  },
  {
    name: "AI Forum New Zealand",
    logo: "/img/sponsors/aifnz.svg",
    description: "New Zealand's AI community",
    url: "https://aiforum.org.nz/",
    tier: "bronze",
  },
];

export const getSponsorsByTier = (tier: SponsorTier): TieredSponsor[] =>
  tieredSponsors.filter((s) => s.tier === tier);

/**
 * Cumulative logo wall for the homepage "Sponsors who have supported our
 * events" band.
 */
export interface ScrollingSponsorLogo {
  name: string;
  logo: string;
}

/**
 * Organisations whose logo Deloitte's sponsorship agreement says its own logo
 * must not sit immediately beside. Published 2023; re-confirm with Deloitte NZ
 * Independence before relaxing it.
 *
 * Spark NZ is on the list but has no logo here, so nothing to place.
 */
export const DELOITTE_RESTRICTED_NEIGHBOURS = [
  "Woolworths",
  "MYOB",
  "Spark NZ",
  "Air New Zealand",
] as const;

/**
 * The wall runs as two counter-scrolling rows, and the split is load-bearing
 * rather than decorative.
 *
 * Deloitte sponsors She Sharp on the condition that its logo is not placed
 * immediately next to certain other organisations. In a single infinite band
 * every logo has two permanent neighbours and the strip wraps, so ordering
 * alone is fragile — one insertion silently breaks the agreement. Keeping the
 * restricted organisations in row one and Deloitte in row two means the two
 * never touch no matter how either row is reordered.
 *
 * `lib/data/sponsors.test.ts` fails the moment Deloitte shares a row with any
 * name in DELOITTE_RESTRICTED_NEIGHBOURS. Do not merge the rows back together.
 *
 * Three organisations are deliberately absent. Google, AWS and ANZ each have
 * documented logo-usage restrictions — the 2022 team record states plainly that
 * Google does not permit use of its logo, ANZ requires registration with its
 * logo library, and AWS requires the specific official file supplied per event.
 * No evidence of permission was ever recorded, so they stay off the wall until
 * someone confirms it. `/public/img/sponsors/aotearoa-ai-hackathon-festival.jpg`
 * is also absent: it is She Sharp's own event mark, not a supporter's.
 *
 * Countdown is gone as a separate entry — the brand became Woolworths NZ in
 * 2023 and running both read as two supporters where there is one.
 */
const scrollingSponsorLogosRestrictedRow: ScrollingSponsorLogo[] = [
  { name: "MYOB", logo: "/img/sponsors/myob.svg" },
  { name: "Woolworths", logo: "/img/sponsors/woolworths.svg" },
  { name: "Air New Zealand", logo: "/img/sponsors/air-new-zealand.svg" },
  { name: "HCLTech", logo: "/img/sponsors/hcltech.svg" },
  { name: "Vector", logo: "/img/sponsors/vector.svg" },
  { name: "Xero", logo: "/img/sponsors/xero.svg" },
  { name: "Secure Code Warrior", logo: "/img/sponsors/secure-code-warrior.svg" },
  { name: "Fonterra", logo: "/img/sponsors/fonterra.svg" },
  { name: "Hewlett Packard Enterprise", logo: "/img/sponsors/hpe.svg" },
  { name: "Fisher & Paykel Healthcare", logo: "/img/sponsors/fph.svg" },
  { name: "Fiserv", logo: "/img/sponsors/fiserv.svg" },
  { name: "Trade Me", logo: "/img/sponsors/trade-me.svg" },
  { name: "Westpac", logo: "/img/sponsors/westpac.svg" },
  { name: "Kiwibank", logo: "/img/sponsors/kiwibank.svg" },
  { name: "IBM", logo: "/img/sponsors/ibm.svg" },
  { name: "Microsoft", logo: "/img/sponsors/microsoft.svg" },
  { name: "Orion Health", logo: "/img/sponsors/orion-health.svg" },
  { name: "Workday", logo: "/img/sponsors/workday.svg" },
  { name: "EY", logo: "/img/sponsors/ey.svg" },
  { name: "Auckland Council", logo: "/img/sponsors/auckland-council.svg" },
];

const scrollingSponsorLogosSecondRow: ScrollingSponsorLogo[] = [
  { name: "Deloitte", logo: "/img/sponsors/deloitte.svg" },
  { name: "AI Forum New Zealand", logo: "/img/sponsors/aifnz.svg" },
  { name: "AUT", logo: "/img/sponsors/aut.svg" },
  { name: "Ministry of Social Development", logo: "/img/sponsors/msd.svg" },
  { name: "Les Mills", logo: "/img/sponsors/lesmills_logo.svg" },
  { name: "academyEX", logo: "/img/sponsors/academyex.svg" },
  { name: "Metlifecare", logo: "/img/sponsors/metlifecare.svg" },
  { name: "Ministry of Education", logo: "/img/sponsors/MOE.png" },
  { name: "Peyvand Academy", logo: "/img/sponsors/peyvand-academy.jpg" },
  { name: "Little Engineers", logo: "/img/sponsors/little-engineers.jpg" },
  { name: "Grid AKL", logo: "/img/sponsors/grid-akl.svg" },
  { name: "Pushpay", logo: "/img/sponsors/pushpay.svg" },
  { name: "Nyriad", logo: "/img/sponsors/nyriad.svg" },
  { name: "Vend", logo: "/img/sponsors/vend.svg" },
  { name: "Centrality", logo: "/img/sponsors/centrality.svg" },
  { name: "Flexware", logo: "/img/sponsors/flexware.svg" },
  { name: "Wāhine Kākano", logo: "/img/sponsors/wahine-kakano.svg" },
  { name: "Fergus", logo: "/img/sponsors/fergus.svg" },
  { name: "Geo AR Games", logo: "/img/sponsors/geo-ar-games.svg" },
];

export const scrollingSponsorLogoRows: ScrollingSponsorLogo[][] = [
  scrollingSponsorLogosRestrictedRow,
  scrollingSponsorLogosSecondRow,
];

/** Flat view for consumers that do not render the band itself. */
export const scrollingSponsorLogos: ScrollingSponsorLogo[] =
  scrollingSponsorLogoRows.flat();
