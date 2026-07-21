/**
 * Curated, pre-verified pool of evergreen New Zealand tech / women-in-STEM
 * facts for the newsletter's "NZ Tech Pulse" section.
 *
 * These are the anti-hallucination safety net: when live source fetching fails,
 * the pulse section is built deterministically from this pool instead of ever
 * showing a model-invented number. Every entry was human-verified against its
 * cited source (NZ-wide facts July 2026; Auckland facts July 2026). Numbers here
 * are the ONLY numbers that may appear when live data is unavailable — do not
 * edit values without re-checking the source URL.
 *
 * The pool is split into two groups so the pulse can lean local: `NZ_WIDE_FACTS`
 * (national) and `AUCKLAND_FACTS` (She Sharp's in-person home city). `pulse.ts`
 * biases the monthly rotation between them. `NZ_TECH_FACTS` is the flat union.
 */

/** One verified evergreen fact with its attribution. */
export interface NzTechFact {
  /** Stable id (used for deterministic rotation and de-duplication). */
  id: string;
  /** The fact, phrased for direct display to readers. */
  text: string;
  sourceLabel: string;
  /** Canonical source URL backing the fact. */
  sourceUrl: string;
}

/**
 * NZ-WIDE facts (national scope). Order is meaningful: the pulse rotates through
 * these by month index, so keep entries stable rather than reordering.
 */
export const NZ_WIDE_FACTS: readonly NzTechFact[] = [
  {
    id: "women-it-roles-29",
    text: "Women hold around 29% of professional IT roles in New Zealand — She Sharp exists to change that.",
    sourceLabel: "TechWomen NZ / NZTech",
    sourceUrl: "https://techwomen.nz/get-informed/",
  },
  {
    id: "girls-stem-career-interest",
    text: "Fewer than 1 in 20 Kiwi girls consider a high-paid STEM career, versus 1 in 5 boys.",
    sourceLabel: "TechWomen NZ",
    sourceUrl: "https://techwomen.nz/get-informed/",
  },
  {
    id: "gender-pay-gap-52",
    text: "New Zealand's gender pay gap fell to 5.2% in the June 2025 quarter — the lowest on record.",
    sourceLabel: "Stats NZ",
    sourceUrl:
      "https://www.stats.govt.nz/news/gender-pay-gap-narrows-to-lowest-on-record/",
  },
  {
    id: "women-bsc-enrolments",
    text: "Women earn the majority of Bachelor of Science enrolments in NZ, yet remain under-represented in engineering, ICT and physics.",
    sourceLabel: "Te Ara Encyclopedia of New Zealand",
    sourceUrl: "https://teara.govt.nz/en/gender-inequalities/page-5",
  },
  {
    id: "girls-ncea-outperform",
    text: "NZ girls outperform boys across all three NCEA levels and University Entrance — but are less likely to continue into maths, IT and physics pathways.",
    sourceLabel: "Te Ara / NZQA",
    sourceUrl: "https://teara.govt.nz/en/gender-inequalities/page-5",
  },
  {
    id: "tech-roles-immigration-55",
    text: "Around 55% of new NZ tech roles are filled through immigration rather than the domestic pipeline — a huge opportunity for local women entering tech.",
    sourceLabel: "MBIE Digital Technologies ITP",
    sourceUrl:
      "https://www.mbie.govt.nz/assets/digital-technologies-industry-transformation-plan.pdf",
  },
  {
    id: "skills-mismatch",
    text: "NZ's tech 'skills shortage' is really a skills mismatch — the greatest unmet demand is for senior, experienced people. Mentorship matters.",
    sourceLabel: "NZTech Digital Skills Aotearoa",
    sourceUrl:
      "https://technewzealand.org.nz/reports/digital-skills-for-tomorrow-today-report/",
  },
  {
    id: "she-sharp-growth",
    text: "She Sharp has grown to 3000+ members, 50+ sponsors and 94+ events since 2014.",
    sourceLabel: "She Sharp",
    sourceUrl: "https://www.shesharp.org.nz/about",
  },
];

/**
 * AUCKLAND facts (Tāmaki Makaurau — where She Sharp runs its in-person events).
 * Each verified against a live source fetched in July 2026.
 */
export const AUCKLAND_FACTS: readonly NzTechFact[] = [
  {
    id: "auckland-tech-hub",
    text: "Auckland is Aotearoa's tech hub — home to Xero, Halter, Seequent and a fast-growing SaaS scene.",
    sourceLabel: "IT Brief NZ",
    sourceUrl: "https://itbrief.co.nz/",
  },
  {
    id: "auckland-tech-gdp-54",
    text: "Auckland generates 54% of New Zealand's tech-sector GDP and employs around 68,000 tech workers — the beating heart of the country's tech economy.",
    sourceLabel: "Tātaki Auckland Unlimited",
    sourceUrl:
      "https://aucklandeconomicdevelopment.com/invest/key-industries/technology",
  },
  {
    id: "auckland-top-companies-60",
    text: "60% of New Zealand's top 200 tech companies are based in Auckland — chances are the one you want to work for is just down the road.",
    sourceLabel: "Tātaki Auckland Unlimited",
    sourceUrl:
      "https://aucklandeconomicdevelopment.com/invest/key-industries/technology",
  },
  {
    id: "auckland-tin200-exports-59",
    text: "Auckland companies account for 59% ($6.8 billion) of New Zealand's TIN200 tech exports — Tāmaki Makaurau punches well above its weight on the world stage.",
    sourceLabel: "Auckland Unlimited Tech Insights",
    sourceUrl:
      "https://aucklandunlimited.com/news/new-report-examines-aucklands-globally-focused-technology-industry",
  },
  {
    id: "aut-women-in-tech-30",
    text: "AUT's Women in Tech programme has delivered 30+ events, workshops and networking sessions for women in STEM since 2022 — right here in Auckland.",
    sourceLabel: "IT Brief NZ",
    sourceUrl: "https://itbrief.co.nz/story/babcock-extends-aut-women-in-tech-stem-partnership",
  },
];

/**
 * The flat union of both pools. Order (NZ-wide first, then Auckland) is
 * meaningful: `evergreenPulse` rotates the hero stat through the numeric subset
 * of this array by month index, so keep entries stable rather than reordering.
 */
export const NZ_TECH_FACTS: readonly NzTechFact[] = [
  ...NZ_WIDE_FACTS,
  ...AUCKLAND_FACTS,
];

/** Facts that carry a display-worthy number (used for the hero-stat fallback). */
export const NZ_TECH_NUMERIC_FACTS: readonly NzTechFact[] = NZ_TECH_FACTS.filter(
  (fact) => /\d/.test(fact.text)
);
