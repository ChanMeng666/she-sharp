/**
 * Canonical sponsor slugs that exist as SVGs at /img/sponsors/<slug>.svg.
 *
 * STATIC list (not fs-scanned at runtime) because Next.js's file tracer
 * would otherwise pull the entire public/ directory into the serverless
 * lambda bundle, pushing it over Vercel's 300mb size limit.
 *
 * When a new canonical sponsor logo is added to public/img/sponsors/,
 * update this list. The AI uses this to decide whether to reuse an
 * existing logo or propose an event-specific placeholder.
 */

export const CANONICAL_SPONSOR_SLUGS = [
  "academyex",
  "aifnz",
  "air-new-zealand",
  "anz",
  "auckland-council",
  "aut",
  "aws",
  "centrality",
  "countdown",
  "deloitte",
  "ey",
  "fergus",
  "fiserv",
  "flexware",
  "fonterra",
  "fph",
  "geo-ar-games",
  "google",
  "grid-akl",
  "hcltech",
  "hpe",
  "ibm",
  "kiwibank",
  "lesmills_logo",
  "metlifecare",
  "microsoft",
  "msd",
  "myob",
  "nyriad",
  "orion-health",
  "pushpay",
  "secure-code-warrior",
  "trade-me",
  "vector",
  "vend",
  "wahine-kakano",
  "westpac",
  "woolworths",
  "workday",
  "xero",
];

export function getSponsorSlugs(): string[] {
  return CANONICAL_SPONSOR_SLUGS;
}

export function hasSponsorLogo(slug: string): boolean {
  return CANONICAL_SPONSOR_SLUGS.includes(slug.toLowerCase());
}
