// =============================================================================
// sources.typ — external context facts and organisational identity
// =============================================================================
//
// The `nz-facts` and `auckland-facts` pools below are copied FAITHFULLY from
// `lib/data/nz-tech-facts.ts`, where every entry was human-verified against the
// cited URL (NZ-wide facts July 2026, Auckland facts July 2026). That file is
// the anti-hallucination safety net for the newsletter and serves the same
// purpose here.
//
// Rules for this file:
//   • Never edit a `text` value without re-checking its `url`.
//   • Never add a fact that does not carry a real, resolvable source URL.
//   • Every fact printed in the report must appear in the endnote list, keyed by
//     its `id`, so a programme officer can check it.
// =============================================================================

// -----------------------------------------------------------------------------
// Organisational identity
// -----------------------------------------------------------------------------

#let org = (
  name: "She Sharp",
  legal-name: "She Sharp Charitable Trust",
  // The canonical one-liner — lib/seo/site.ts, SITE_DESCRIPTION.
  one-liner: "She Sharp is a New Zealand non-profit on a mission to bridge the gender gap in STEM, one woman at a time — through events, mentorship, networking, and career development.",
  // lib/config/footer.ts, charityInfo.
  charity-number: "CC57025",
  charity-register-url: "https://register.charities.govt.nz/Charity/CC57025",
  charity-register-label: "New Zealand Charities Register",
  site: "https://www.shesharp.org.nz",
  // Plain `@`: this is a string literal, not markup. `"\@"` would render a
  // visible backslash. Only escape `@` inside a `[...]` content block.
  email: "hello@shesharp.org.nz",
  founded: 2014,
  base: "Tāmaki Makaurau Auckland, Aotearoa New Zealand",
  socials: (
    (name: "LinkedIn", url: "https://www.linkedin.com/company/shesharpnz/"),
    (name: "Instagram", url: "https://www.instagram.com/shesharpnz/"),
    (name: "Facebook", url: "https://www.facebook.com/shesharpnz/"),
    (name: "YouTube", url: "https://www.youtube.com/channel/UCfNDV1btAhwWwEXSyxNd5_Q"),
    (name: "Spotify", url: "https://open.spotify.com/show/3CQf214DtzML2jqvVIxCqT"),
  ),
  programmes: (
    (name: "HER WAKA", url: "https://herwaka.shesharp.org.nz/"),
    (name: "Mentorship", url: "https://www.shesharp.org.nz/mentorship"),
    (name: "Events", url: "https://www.shesharp.org.nz/events"),
    (name: "Volunteer", url: "https://www.shesharp.org.nz/join-our-team"),
  ),
)

// -----------------------------------------------------------------------------
// NZ-wide context — lib/data/nz-tech-facts.ts, NZ_WIDE_FACTS
// -----------------------------------------------------------------------------

#let nz-facts = (
  (
    id: "women-it-roles-29",
    text: "Women hold around 29% of professional IT roles in New Zealand — She Sharp exists to change that.",
    label: "TechWomen NZ / NZTech",
    url: "https://techwomen.nz/get-informed/",
  ),
  (
    id: "girls-stem-career-interest",
    text: "Fewer than 1 in 20 Kiwi girls consider a high-paid STEM career, versus 1 in 5 boys.",
    label: "TechWomen NZ",
    url: "https://techwomen.nz/get-informed/",
  ),
  (
    id: "gender-pay-gap-52",
    text: "New Zealand's gender pay gap fell to 5.2% in the June 2025 quarter — the lowest on record.",
    label: "Stats NZ",
    url: "https://www.stats.govt.nz/news/gender-pay-gap-narrows-to-lowest-on-record/",
  ),
  (
    id: "women-bsc-enrolments",
    text: "Women earn the majority of Bachelor of Science enrolments in NZ, yet remain under-represented in engineering, ICT and physics.",
    label: "Te Ara Encyclopedia of New Zealand",
    url: "https://teara.govt.nz/en/gender-inequalities/page-5",
  ),
  (
    id: "girls-ncea-outperform",
    text: "NZ girls outperform boys across all three NCEA levels and University Entrance — but are less likely to continue into maths, IT and physics pathways.",
    label: "Te Ara / NZQA",
    url: "https://teara.govt.nz/en/gender-inequalities/page-5",
  ),
  (
    id: "tech-roles-immigration-55",
    text: "Around 55% of new NZ tech roles are filled through immigration rather than the domestic pipeline — a huge opportunity for local women entering tech.",
    label: "MBIE Digital Technologies ITP",
    url: "https://www.mbie.govt.nz/assets/digital-technologies-industry-transformation-plan.pdf",
  ),
  (
    id: "skills-mismatch",
    text: "NZ's tech \"skills shortage\" is really a skills mismatch — the greatest unmet demand is for senior, experienced people. Mentorship matters.",
    label: "NZTech Digital Skills Aotearoa",
    url: "https://technewzealand.org.nz/reports/digital-skills-for-tomorrow-today-report/",
  ),
)

// -----------------------------------------------------------------------------
// Auckland context — lib/data/nz-tech-facts.ts, AUCKLAND_FACTS
// -----------------------------------------------------------------------------

#let auckland-facts = (
  (
    id: "auckland-tech-hub",
    text: "Auckland is Aotearoa's tech hub — home to Xero, Halter, Seequent and a fast-growing SaaS scene.",
    label: "IT Brief NZ",
    url: "https://itbrief.co.nz/",
  ),
  (
    id: "auckland-tech-gdp-54",
    text: "Auckland generates 54% of New Zealand's tech-sector GDP and employs around 68,000 tech workers — the beating heart of the country's tech economy.",
    label: "Tātaki Auckland Unlimited",
    url: "https://aucklandeconomicdevelopment.com/invest/key-industries/technology",
  ),
  (
    id: "auckland-top-companies-60",
    text: "60% of New Zealand's top 200 tech companies are based in Auckland — chances are the one you want to work for is just down the road.",
    label: "Tātaki Auckland Unlimited",
    url: "https://aucklandeconomicdevelopment.com/invest/key-industries/technology",
  ),
  (
    id: "auckland-tin200-exports-59",
    text: "Auckland companies account for 59% ($6.8 billion) of New Zealand's TIN200 tech exports — Tāmaki Makaurau punches well above its weight on the world stage.",
    label: "Auckland Unlimited Tech Insights",
    url: "https://aucklandunlimited.com/news/new-report-examines-aucklands-globally-focused-technology-industry",
  ),
  (
    id: "aut-women-in-tech-30",
    text: "AUT's Women in Tech programme has delivered 30+ events, workshops and networking sessions for women in STEM since 2022 — right here in Auckland.",
    label: "IT Brief NZ",
    url: "https://itbrief.co.nz/story/babcock-extends-aut-women-in-tech-stem-partnership",
  ),
)

// Named `sector-facts`, not `context-facts` — `context` is a reserved keyword
// in Typst and an identifier beginning with it is a parse hazard.
#let sector-facts = nz-facts + auckland-facts

/// Fact lookup by id. Use this rather than indexing by position — the pools in
/// lib/data/nz-tech-facts.ts are order-sensitive and may be extended.
#let fact(id) = {
  let found = sector-facts.filter(f => f.id == id)
  if found.len() == 0 { panic("sources.typ: no fact with id " + id) }
  found.first()
}

// =============================================================================
// SECTOR METRICS — the drawable numbers behind the facts above
// =============================================================================
//
// The pool above holds facts as PROSE with the figure inside the sentence.
// A chart needs a metric dict. These are those dicts, and every one of them is
// lifted VERBATIM from the `text` of the fact it names — no re-rounding, no
// derived precision, no arithmetic. If a fact's wording does not yield a clean
// point value, it is NOT here; it is in `sector-quotes` with its wording intact.
//
// All of these are `v()`. That is not generosity: each was human-verified
// against its live source in July 2026 when `lib/data/nz-tech-facts.ts` was
// compiled, which is stronger provenance than most of this report's own
// figures. Each `note` names the source exactly as that file's `sourceLabel`
// does, so a note and a citation can never drift apart.
//
// ⚠️  These metrics are NOT inside `D`, so `assert-final-clean(D)` does not
// reach them. The entry file should also gate `sector-all-metrics` (exported at
// the foot of this block) or a future non-verified addition here would sail
// straight through a FINAL build.
//
// `v` shadows Typst's built-in `v()` spacer for the rest of this file. Nothing
// here needs vertical spacing, but do not add markup below without renaming it.
#import "report-data.typ": v

// -----------------------------------------------------------------------------
// 1. THE GAP — one bar, rendered alone
// -----------------------------------------------------------------------------
// This is the only gender-share percentage in the entire source pool, and it
// has no honest peer to sit beside: there is no second "share of the same
// population" figure to compare it against, and manufacturing one (a "71% not
// women" bar, or a 50%-of-the-workforce benchmark that no source states) would
// be inventing a comparison.
//
// So it is not part of a comparison set — it is a SINGLE bar, drawn with
// `max: 100`. The 71% of empty track to its right is the point, and it is the
// most honest graphic in the report: nothing is asserted except the one
// sourced number, and the gap draws itself.
//
//     comparison-bars(sector-gap, max: 100, fmt: v => str(v) + "%")
//
// Keep the word "around" in the surrounding copy — the source says
// "around 29%", and the bar cannot carry that hedge on its own.
#let sector-gap = (
  (
    id: "women-it-roles-29",
    label: "Women's share of professional IT roles in New Zealand",
    metric: v(
      29,
      "TechWomen NZ / NZTech — \"Women hold around 29% of professional IT roles in New Zealand\", human-verified July 2026 (lib/data/nz-tech-facts.ts, fact id women-it-roles-29).",
    ),
    source: "TechWomen NZ / NZTech",
    url: "https://techwomen.nz/get-informed/",
  ),
)

// -----------------------------------------------------------------------------
// 2. COMPARISON BARS — Auckland's share of the national tech economy
// -----------------------------------------------------------------------------
// These three DO belong on one axis. Each is a percentage of a New Zealand
// total, measured across the same geography, so reading them side by side is
// meaningful rather than merely tidy: companies, exports and GDP all say the
// same thing at different strengths.
//
// They earn their place in a gender-gap report by answering the question a
// funder asks about geography — every event in this report was held in
// Auckland, and this is why that is not parochial.
//
//     comparison-bars(sector-metrics, max: 100, fmt: v => str(v) + "%")
//
// Ordered largest to smallest so the bars step down cleanly.
#let sector-metrics = (
  (
    id: "auckland-top-companies-60",
    label: "Auckland's share of New Zealand's top 200 tech companies",
    metric: v(
      60,
      "Tātaki Auckland Unlimited — \"60% of New Zealand's top 200 tech companies are based in Auckland\", human-verified July 2026 (lib/data/nz-tech-facts.ts, fact id auckland-top-companies-60).",
    ),
    source: "Tātaki Auckland Unlimited",
    url: "https://aucklandeconomicdevelopment.com/invest/key-industries/technology",
  ),
  (
    id: "auckland-tin200-exports-59",
    label: "Auckland's share of New Zealand's TIN200 tech exports",
    metric: v(
      59,
      "Auckland Unlimited Tech Insights — \"Auckland companies account for 59% ($6.8 billion) of New Zealand's TIN200 tech exports\", human-verified July 2026 (lib/data/nz-tech-facts.ts, fact id auckland-tin200-exports-59).",
    ),
    source: "Auckland Unlimited Tech Insights",
    url: "https://aucklandunlimited.com/news/new-report-examines-aucklands-globally-focused-technology-industry",
  ),
  (
    id: "auckland-tech-gdp-54",
    label: "Auckland's share of New Zealand's tech-sector GDP",
    metric: v(
      54,
      "Tātaki Auckland Unlimited — \"Auckland generates 54% of New Zealand's tech-sector GDP\", human-verified July 2026 (lib/data/nz-tech-facts.ts, fact id auckland-tech-gdp-54).",
    ),
    source: "Tātaki Auckland Unlimited",
    url: "https://aucklandeconomicdevelopment.com/invest/key-industries/technology",
  ),
)

// -----------------------------------------------------------------------------
// 3. STAT ROWS — figures that must NOT share an axis with the bars above
// -----------------------------------------------------------------------------
// Each of these is real and worth printing, and each would mislead as a bar:
//
//  · The pay gap is a DIFFERENCE, not a share. Set beside 54% and 60% a reader
//    scans "5.2%" as a small share of something and the meaning inverts — the
//    lowest gap on record reads as a failure.
//  · The immigration figure is a share of a different whole (new roles filled),
//    so a common 0–100% axis implies a comparison that does not exist.
//  · Tech workers and export dollars are COUNTS. They have no denominator at
//    all and cannot be drawn against a percentage scale.
//
// `unit` is plain metadata, not a formatter: `data/` must not import `lib/`, so
// the section builds the format with `num`/`pct`/`money`/`commas` from
// lib/metrics.typ. The intended treatment is named per row.
//
// ⚠️  DOUBLE-COUNT WARNING. `auckland-tech-workers` comes from the SAME source
// sentence as the 54% GDP bar, and `auckland-tin200-dollars` from the same
// sentence as the 59% exports bar. Present each pair together as one finding —
// "54% of tech-sector GDP, and around 68,000 tech workers" — never as two
// independent data points, which would make one source look like two.
#let sector-stats = (
  (
    id: "gender-pay-gap-52",
    label: "New Zealand's gender pay gap, June 2025 quarter — the lowest on record",
    metric: v(
      5.2,
      "Stats NZ — \"New Zealand's gender pay gap fell to 5.2% in the June 2025 quarter — the lowest on record\", human-verified July 2026 (lib/data/nz-tech-facts.ts, fact id gender-pay-gap-52).",
    ),
    unit: "%",           // one decimal place — do NOT round to 5%
    source: "Stats NZ",
    url: "https://www.stats.govt.nz/news/gender-pay-gap-narrows-to-lowest-on-record/",
  ),
  (
    id: "tech-roles-immigration-55",
    label: "New NZ tech roles filled through immigration rather than the domestic pipeline",
    metric: v(
      55,
      "MBIE Digital Technologies ITP — \"Around 55% of new NZ tech roles are filled through immigration rather than the domestic pipeline\", human-verified July 2026 (lib/data/nz-tech-facts.ts, fact id tech-roles-immigration-55).",
    ),
    unit: "%",           // source says "around" — keep the hedge in the copy
    source: "MBIE Digital Technologies ITP",
    url: "https://www.mbie.govt.nz/assets/digital-technologies-industry-transformation-plan.pdf",
  ),
  (
    id: "auckland-tech-workers",
    label: "Tech workers employed in Auckland",
    metric: v(
      68000,
      "Tātaki Auckland Unlimited — \"employs around 68,000 tech workers\", human-verified July 2026 (lib/data/nz-tech-facts.ts, fact id auckland-tech-gdp-54). Same source sentence as the 54% GDP bar.",
    ),
    unit: "count",       // render with `commas` → "68,000"; source says "around"
    source: "Tātaki Auckland Unlimited",
    url: "https://aucklandeconomicdevelopment.com/invest/key-industries/technology",
  ),
  (
    id: "auckland-tin200-dollars",
    label: "Value of Auckland's TIN200 tech exports",
    metric: v(
      6.8,
      "Auckland Unlimited Tech Insights — \"59% ($6.8 billion) of New Zealand's TIN200 tech exports\", human-verified July 2026 (lib/data/nz-tech-facts.ts, fact id auckland-tin200-exports-59). Same source sentence as the 59% exports bar.",
    ),
    unit: "$b",          // render as "$6.8 billion" (NZD as published)
    source: "Auckland Unlimited Tech Insights",
    url: "https://aucklandunlimited.com/news/new-report-examines-aucklands-globally-focused-technology-industry",
  ),
)

// -----------------------------------------------------------------------------
// 4. PULL-QUOTES — facts whose meaning lives in the wording
// -----------------------------------------------------------------------------
// Print these VERBATIM. Every one either carries no figure at all or carries a
// BOUND rather than a value, and a bar silently converts a bound into a
// measurement — "fewer than 1 in 20" drawn at 5% asserts a precision the source
// explicitly refuses, and in the direction that understates the problem.
//
// The girls/boys ratio is the single most quotable line in the pool and the
// closest thing here to the gap this organisation exists to close. It is far
// stronger as its own sentence than as two bars, because the words "fewer than"
// survive.
#let sector-quotes = (
  (id: "girls-stem-career-interest", emphasis: true),
  (id: "skills-mismatch", emphasis: true),
  (id: "women-bsc-enrolments", emphasis: false),
  (id: "girls-ncea-outperform", emphasis: false),
  (id: "auckland-tech-hub", emphasis: false),
).map(q => {
  let f = fact(q.id)
  (id: q.id, text: f.text, source: f.label, url: f.url, emphasis: q.emphasis)
})

// TWO FACTS FROM THE POOL ARE DELIBERATELY UNUSED, in metrics and in quotes:
//
//  · `aut-women-in-tech-30` — "AUT's Women in Tech programme has delivered 30+
//    events…". A bound again, and worse, it is ANOTHER organisation's event
//    count. On a She Sharp report a reader lands on "30+ events" next to this
//    report's own nine and mis-attributes one to the other. It stays in
//    `auckland-facts` (the pool is imported faithfully) but is not surfaced.
//
//  · `she-sharp-growth` — "3000+ members, 50+ sponsors and 94+ events since
//    2014", cited to She Sharp's own /about page. It was left out of `nz-facts`
//    at import: it is not sector context, it is this organisation quoting
//    itself, and dressing it as a third-party verified fact alongside Stats NZ
//    and MBIE would be the most misleading thing on the page. The same claims
//    are carried honestly in `D.claims`, flagged as estimates.

// -----------------------------------------------------------------------------
// Every sector metric in one array, for the FINAL-build gate.
// The entry file should run lib/metrics.typ's `assert-final-clean` over this as
// well as over `D` — see the warning at the head of this block.
// -----------------------------------------------------------------------------
#let sector-all-metrics = (
  gap: sector-gap.map(r => r.metric),
  bars: sector-metrics.map(r => r.metric),
  stats: sector-stats.map(r => r.metric),
)

// -----------------------------------------------------------------------------
// Internal sources cited in this report's methodology page
// -----------------------------------------------------------------------------

#let internal-sources = (
  (
    id: "events-json",
    label: "Event register",
    detail: "lib/data/json/events-custom.json — the nine H1 2026 records (ids 85, 87–94), fields `attendees` and `checkedIn`.",
  ),
  (
    id: "neon-db",
    label: "Member platform database",
    detail: "Live Neon production database, queried 1 August 2026: users, user_roles, mentor_profiles, mentee_profiles, mentor_form_submissions, mentee_form_submissions, mentee_waiting_queue, contact_form_submissions.",
  ),
  (
    id: "mentor-batch",
    label: "Mentor onboarding record",
    detail: "docs/development/batch-import-mentors-2026.md — 25 mentors confirmed offline for the 2026 programme and imported on 19 March 2026, 25 of 25 processed, invitation codes emailed.",
  ),
  (
    id: "mentorship-paused",
    label: "Mentorship pause",
    detail: "docs/development/MENTORSHIP_APPLICATIONS_PAUSED.md — applications paused 19 June 2026, commit 1d26970. The pause is documented and reversible.",
  ),
  (
    id: "team-register",
    label: "Team register",
    detail: "lib/data/team.ts — 16 active trustees and ambassadors.",
  ),
  (
    id: "sponsor-register",
    label: "Sponsor register",
    detail: "lib/data/sponsors.ts — tiered sponsors and the 38-organisation historical logo wall.",
  ),
  (
    id: "report-2025",
    label: "2025 Impact Report",
    detail: "public/docs/she-sharp-impact-report-2025.pdf — the comparative year. NOTE: that document is internally inconsistent. Its founder's letter (p.3) says \"over 500 registered attendees\" from \"135 unique companies\"; its own summary panel (p.5) says 716 and 138. This report quotes the p.5 panel throughout and treats the p.3 prose as a rounding error in the source document.",
  ),
  (
    id: "marketing-stats",
    label: "Marketing statistics",
    detail: "lib/data/stats.ts — promotional copy (3,000+ members, 120 mentors, 94 events since 2014) with no underlying register, and contradicted by the repository's own data. Not used as a measurement anywhere in this report.",
  ),
)
