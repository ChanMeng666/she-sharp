/**
 * Curated, pre-verified pool of evergreen New Zealand tech / women-in-STEM
 * facts for the newsletter's "NZ Tech Pulse" section.
 *
 * These are the anti-hallucination safety net: when live source fetching fails,
 * the pulse section is built deterministically from this pool instead of ever
 * showing a model-invented number. Every entry was human-verified against its
 * cited source in July 2026. Numbers here are the ONLY numbers that may appear
 * when live data is unavailable — do not edit values without re-checking the
 * source URL.
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
 * Nine verified facts. Order is meaningful: `evergreenPulse` rotates through
 * this array by month index, so keep entries stable rather than reordering.
 */
export const NZ_TECH_FACTS: readonly NzTechFact[] = [
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
    id: "auckland-tech-hub",
    text: "Auckland is Aotearoa's tech hub — home to Xero, Halter, Seequent and a fast-growing SaaS scene.",
    sourceLabel: "IT Brief NZ",
    sourceUrl: "https://itbrief.co.nz/",
  },
  {
    id: "she-sharp-growth",
    text: "She Sharp has grown to 3000+ members, 50+ sponsors and 94+ events since 2014.",
    sourceLabel: "She Sharp",
    sourceUrl: "https://www.shesharp.org.nz/about",
  },
];

/** Facts that carry a display-worthy number (used for the hero-stat fallback). */
export const NZ_TECH_NUMERIC_FACTS: readonly NzTechFact[] = NZ_TECH_FACTS.filter(
  (fact) => /\d/.test(fact.text)
);
