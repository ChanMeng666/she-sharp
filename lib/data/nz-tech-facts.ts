/**
 * Curated, pre-verified pool of evergreen New Zealand tech / women-in-STEM
 * facts for the newsletter's "NZ Tech Pulse" section.
 *
 * These are the anti-hallucination safety net: when live source fetching fails,
 * the pulse section is built deterministically from this pool instead of ever
 * showing a model-invented number. Every entry was human-verified against its
 * cited source (NZ-wide facts July 2026; Auckland facts July 2026; the gender
 * pay gap re-verified 2026-08-29 against the June 2026 quarter release). Numbers
 * here are the ONLY numbers that may appear when live data is unavailable — do
 * not edit values without re-checking the source URL.
 *
 * "Evergreen" means the source is stable, NOT that the figure never moves. A
 * quarterly statistic goes stale on a schedule: the pay-gap entry sat at "the
 * lowest on record" for a year after a later quarter overtook it. Where a fact
 * has a period, say the period in the text — that is what makes staleness
 * visible to the next reader.
 *
 * That incident is also why every entry now carries `verifiedAt` and `refresh`.
 * The failure was not that the pool is static — it is meant to be. The failure
 * was that nothing recorded WHEN a fact was last read against its source or HOW
 * OFTEN that source publishes a new figure, so nobody could answer "which of
 * these is due?" without re-reading all thirteen. Those two fields make the
 * question answerable offline, and `scripts/newsletter/check-facts.ts` answers
 * it before an issue ships.
 *
 * The pool is split into two groups so the pulse can lean local: `NZ_WIDE_FACTS`
 * (national) and `AUCKLAND_FACTS` (She Sharp's in-person home city). `pulse.ts`
 * biases the monthly rotation between them. `NZ_TECH_FACTS` is the flat union.
 */

import { globalStats } from "./stats";

/**
 * How often the UNDERLYING SOURCE publishes a new figure for a fact — not how
 * often we would like to look at it. It is the publisher's cycle that decides
 * when our copy can have been overtaken, so it is the publisher's cycle that is
 * recorded here.
 *
 * `"none"` is load-bearing and must stay honest. It means *nobody publishes an
 * update to this number*: a one-off government plan, a dated news article, a
 * figure no NZ organisation tracks on any cycle. Such a fact is never overdue,
 * because there is nothing to update it with — and a check that flags a fact
 * forever, with no action that could ever clear it, is a check people stop
 * running. `"none"` is not an exemption from review: the URL is still checked on
 * every run, and so are the fact's own numbers.
 */
export type FactRefresh = "quarterly" | "annual" | "multi-year" | "none";

/** One verified evergreen fact with its attribution. */
export interface NzTechFact {
  /** Stable id (used for deterministic rotation and de-duplication). */
  id: string;
  /** The fact, phrased for direct display to readers. */
  text: string;
  sourceLabel: string;
  /** Canonical source URL backing the fact. */
  sourceUrl: string;
  /**
   * ISO `YYYY-MM-DD` on which a HUMAN last confirmed this fact against its
   * source. Required, never optional: "no review date" is exactly the state
   * that let a false pay-gap figure sit in live rotation for a year, so a new
   * fact cannot be added without someone committing to a date they checked it.
   */
  verifiedAt: string;
  /** Publication cadence of the source — see `FactRefresh`. */
  refresh: FactRefresh;
}

/**
 * The file header records only "July 2026" for the original verification pass,
 * with no day. Using the FIRST of that month is the conservative reading: it is
 * the earliest date the claim supports, so a fact comes due for review sooner
 * rather than later. Inventing a day-of-month would be inventing precision.
 */
const JULY_2026_PASS = "2026-07-01";

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
    // The canonical "none". Research on 2026-08-29 (recorded in the newsletter
    // skill's "Known limitations") established that NO NZ organisation
    // publishes this share on any cycle — it is an advocacy page's standing
    // figure, not a series. That research settled the CADENCE; it did not
    // re-read the value, so the review date stays at the July pass rather than
    // claiming a verification that did not happen.
    verifiedAt: JULY_2026_PASS,
    refresh: "none",
  },
  {
    id: "girls-stem-career-interest",
    text: "Fewer than 1 in 20 Kiwi girls consider a high-paid STEM career, versus 1 in 5 boys.",
    sourceLabel: "TechWomen NZ",
    sourceUrl: "https://techwomen.nz/get-informed/",
    // Same standing page as the 29% figure above, and the same finding: no
    // publisher reissues it.
    verifiedAt: JULY_2026_PASS,
    refresh: "none",
  },
  {
    // The id deliberately does NOT carry the value. It used to be
    // `gender-pay-gap-52`, which meant every quarterly update invalidated the
    // key that `HERO_STAT_FRAMING` in `pulse.ts` joins on — an update in one
    // file would silently stop matching the other. Quote the period in the
    // text, never in the id.
    id: "gender-pay-gap",
    text: "New Zealand's gender pay gap was 5.3% in the June 2026 quarter, up from 5.2% a year earlier and still near its record low.",
    sourceLabel: "Stats NZ",
    sourceUrl:
      "https://www.stats.govt.nz/information-releases/labour-market-statistics-june-2026-quarter/",
    // The fact this whole mechanism exists for. Stats NZ publishes Labour
    // market statistics every quarter, roughly six weeks after the quarter
    // ends, and each release restates the gender pay gap — so this entry can be
    // overtaken four times a year, and it is the ONLY fact in the pool that
    // moves that fast.
    verifiedAt: "2026-08-29",
    refresh: "quarterly",
  },
  {
    id: "women-bsc-enrolments",
    text: "Women earn the majority of Bachelor of Science enrolments in NZ, yet remain under-represented in engineering, ICT and physics.",
    sourceLabel: "Te Ara Encyclopedia of New Zealand",
    sourceUrl: "https://teara.govt.nz/en/gender-inequalities/page-5",
    // Te Ara is an encyclopaedia, not a statistical series: entries are revised
    // occasionally and on no announced schedule. "multi-year" rather than
    // "none" because a revision genuinely can land — the claim is directional
    // ("the majority", "under-represented") and would survive most of them, but
    // a standing claim about enrolment patterns deserves a re-read every few
    // years rather than never.
    verifiedAt: JULY_2026_PASS,
    refresh: "multi-year",
  },
  {
    id: "girls-ncea-outperform",
    text: "NZ girls outperform boys across all three NCEA levels and University Entrance — but are less likely to continue into maths, IT and physics pathways.",
    sourceLabel: "Te Ara / NZQA",
    sourceUrl: "https://teara.govt.nz/en/gender-inequalities/page-5",
    // Same Te Ara page, same reasoning. NZQA does publish NCEA attainment
    // annually, but this fact cites Te Ara's summary of the pattern rather than
    // any one year's figures, so the encyclopaedia's revision rhythm is the
    // cadence that applies.
    verifiedAt: JULY_2026_PASS,
    refresh: "multi-year",
  },
  {
    id: "tech-roles-immigration-55",
    text: "Around 55% of new NZ tech roles are filled through immigration rather than the domestic pipeline — a huge opportunity for local women entering tech.",
    sourceLabel: "MBIE Digital Technologies ITP",
    sourceUrl:
      "https://www.mbie.govt.nz/assets/digital-technologies-industry-transformation-plan.pdf",
    // A one-off published plan. An Industry Transformation Plan is issued once
    // and not reissued on a cycle, so the PDF at this URL will say 55% for as
    // long as it exists. Nothing will update it, which is what "none" means.
    verifiedAt: JULY_2026_PASS,
    refresh: "none",
  },
  {
    id: "skills-mismatch",
    text: "NZ's tech 'skills shortage' is really a skills mismatch — the greatest unmet demand is for senior, experienced people. Mentorship matters.",
    sourceLabel: "NZTech Digital Skills Aotearoa",
    sourceUrl:
      "https://technewzealand.org.nz/reports/digital-skills-for-tomorrow-today-report/",
    // Digital Skills Aotearoa lands every two to three years; the newsletter
    // skill records the next edition as expected around 2029, which is where a
    // "multi-year" interval from the July 2026 pass falls due.
    verifiedAt: JULY_2026_PASS,
    refresh: "multi-year",
  },
  {
    id: "she-sharp-growth",
    text: `She Sharp has grown to ${globalStats.members.current}+ members, ${globalStats.sponsors.current}+ sponsors and ${globalStats.events.total}+ events since 2014.`,
    sourceLabel: "She Sharp",
    sourceUrl: "https://www.shesharp.org.nz/about",
    // The only fact whose source is ourselves, and the only one that cannot
    // drift from its source: the text is interpolated from `globalStats`, and
    // the cited page renders the same constants, so the two move together by
    // construction. There is no external publisher to wait on — keeping
    // `globalStats` honest is a different job with its own provenance rules
    // (`docs/development/PUBLIC_CLAIMS_PROVENANCE.md`).
    verifiedAt: JULY_2026_PASS,
    refresh: "none",
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
    // Qualitative and carrying no figure, so there is no "new figure" for a
    // publisher to issue. The companies named would only change if one left
    // Auckland, which is an event, not a release schedule.
    verifiedAt: JULY_2026_PASS,
    refresh: "none",
  },
  {
    id: "auckland-tech-gdp-54",
    text: "Auckland generates 54% of New Zealand's tech-sector GDP and employs around 68,000 tech workers — the beating heart of the country's tech economy.",
    sourceLabel: "Tātaki Auckland Unlimited",
    sourceUrl:
      "https://aucklandeconomicdevelopment.com/invest/key-industries/technology",
    // An economic-development landing page. Tātaki refreshes these figures when
    // it refreshes the page, on no published schedule; the regional GDP and
    // employment series behind them are annual. "annual" is the shorter and
    // therefore safer of the two readings for a present-tense claim with a
    // number in it.
    verifiedAt: JULY_2026_PASS,
    refresh: "annual",
  },
  {
    id: "auckland-top-companies-60",
    text: "60% of New Zealand's top 200 tech companies are based in Auckland — chances are the one you want to work for is just down the road.",
    sourceLabel: "Tātaki Auckland Unlimited",
    sourceUrl:
      "https://aucklandeconomicdevelopment.com/invest/key-industries/technology",
    // Same page as above; the "top 200" it counts is the TIN200, recompiled
    // every year.
    verifiedAt: JULY_2026_PASS,
    refresh: "annual",
  },
  {
    id: "auckland-tin200-exports-59",
    text: "Auckland companies account for 59% ($6.8 billion) of New Zealand's TIN200 tech exports — Tāmaki Makaurau punches well above its weight on the world stage.",
    sourceLabel: "Auckland Unlimited Tech Insights",
    sourceUrl:
      "https://aucklandunlimited.com/news/new-report-examines-aucklands-globally-focused-technology-industry",
    // The cited URL is a dated news article and will never change — but the
    // TIN200 report it reports on is published every year, and this fact states
    // its figure in the present tense with no period attached. That is the
    // pay-gap shape exactly, so the cadence recorded is the report's, not the
    // article's.
    verifiedAt: JULY_2026_PASS,
    refresh: "annual",
  },
  {
    id: "aut-women-in-tech-30",
    text: "AUT's Women in Tech programme has delivered 30+ events, workshops and networking sessions for women in STEM since 2022 — right here in Auckland.",
    sourceLabel: "IT Brief NZ",
    sourceUrl: "https://itbrief.co.nz/story/babcock-extends-aut-women-in-tech-stem-partnership",
    // A dated news article reporting a cumulative count at the time of writing.
    // Nobody reissues it, and "30+" stays true as the real total grows, so the
    // claim cannot be overtaken the way a percentage can.
    verifiedAt: JULY_2026_PASS,
    refresh: "none",
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
