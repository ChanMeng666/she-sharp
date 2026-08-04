// =============================================================================
// report-data.typ — THE SWAP SURFACE
// =============================================================================
//
// She Sharp — 2026 Half-Year Report (January-June 2026).
//
// NO NUMBER APPEARS ANYWHERE IN THIS REPORT EXCEPT THROUGH THIS FILE (and its
// siblings `events.typ`, `sponsors.typ`, `team.typ`, `sources.typ`). When the
// real Humanitix exports arrive, swapping them in is a single-file edit here.
// Section files must never hard-code a figure.
//
// Every metric is a dict, never a bare number, and carries its provenance:
//
//   v(value, note)  verified    traced to a named file, table or document.
//                               `note` MUST name that source. A v() whose note
//                               does not name a real source is the single worst
//                               failure mode in this repository.
//   p(value)        placeholder invented so the layout has something to hold.
//                               Blocks a FINAL build.
//   e(value, note)  estimate    derived from partial or mixed data. Blocks a
//                               FINAL build. Use for any aggregate that mixes
//                               verified and placeholder inputs — the note then
//                               says exactly which parts are which.
//
// `lib/metrics.typ` walks this tree, panics on any non-verified metric in a
// FINAL build, and renders non-verified values with an amber highlight in DRAFT.
//
// Rule of thumb while editing: if you cannot point at a file path, a database
// table plus a query date, or a page number in a published document, it is not
// v(). Downgrade it.
//
// The walker keys off the presence of a `src` field, so the handful of plain
// strings in this tree (e.g. `programme.youth.age-range`) are inert and are
// intentionally not metrics.
// =============================================================================

#let v(value, note) = (value: value, src: "verified", note: note)
#let p(value) = (value: value, src: "placeholder", note: none)
#let e(value, note) = (value: value, src: "estimate", note: note)

// -----------------------------------------------------------------------------
// Document constants (not metrics — plain strings for titles and running heads)
// -----------------------------------------------------------------------------

#let period = "1 January – 30 June 2026"
#let period-short = "H1 2026"
#let report-title = "2026 Half-Year Report"
#let report-subtitle = "January – June 2026"
#let org-name = "She Sharp"
#let org-legal-name = "She Sharp Charitable Trust"
#let charity-number = "CC57025"
#let charity-register-url = "https://register.charities.govt.nz/Charity/CC57025"
#let site-url = "https://www.shesharp.org.nz"
// NOTE: plain `@`, no backslash. Escaping `@` is required in MARKUP (a `[...]`
// content block, where a bare `@` starts a label reference) but NOT in a string
// literal — `"\@"` renders a visible backslash. Interpolating this constant into
// markup with `#contact-email` inserts it as text, so it stays safe there.
#let contact-email = "hello@shesharp.org.nz"
#let founder-name = "Dr. Mahsa McCauley"
#let founder-role = "Founder & Chair"
#let city = "Tāmaki Makaurau Auckland"

// Data-cutoff line for the colophon and the methodology page.
#let data-cutoff = "Repository and database figures as at 1 August 2026."

// -----------------------------------------------------------------------------
// D — the single metric tree
// -----------------------------------------------------------------------------
//
// Key paths for section authors:
//   D.headline.*            the "in a glance" spread
//   D.events.<slug>.*       per-event stat cards (mirrors events.typ)
//   D.platform.*            the live Neon production database
//   D.programme.her-waka.*  the MSD-funded employment programme
//   D.programme.youth.*     the Youth Tech Series
//   D.community.*           volunteers, enquiries, newsletter, team
//   D.finance.*             ALL placeholder — the donations table is empty
//   D.outlook.*             H2 2026
//   D.comparatives.*        2025 figures for the year-on-year spread
//   D.claims.*              marketing claims, all downgraded to estimates
// -----------------------------------------------------------------------------

#let D = (
  // ---------------------------------------------------------------------------
  // HEADLINE — the "2026 half-year in a glance" spread
  // ---------------------------------------------------------------------------
  headline: (
    // Nine events ran between 1 January and 30 June 2026. This one is solid:
    // it is a count of records, not a count of people.
    events: v(
      9,
      "lib/data/json/events-custom.json — event ids 85 and 87–94, the nine records dated between 6 March and 20 June 2026. Id 86 is a 2023 event and is excluded.",
    ),

    // Registration and attendance totals mix four reconciled events with five
    // that are not yet reconciled, so the totals are estimates, not counts.
    registered: e(
      408,
      "Sum across the nine H1 events. Only four are verified from lib/data/json/events-custom.json (103 + 39 + 32 + 81 = 255); the May 5 HER WAKA figure is a suspect partial export and four events carry placeholder registrations. Replace with the Humanitix export before FINAL.",
    ),
    checked-in: e(
      297,
      "Sum across the nine H1 events. Verified component is 183 across the four reconciled events; the remainder is placeholder or, for May 5, a suspect zero. Replace with the Humanitix export before FINAL.",
    ),

    // The verified subset — safe to quote on its own, and the only attendance
    // claim in this report that survives a FINAL build unchanged.
    registered-verified: v(
      255,
      "Sum of the four reconciled H1 events in lib/data/json/events-custom.json: IWD 2026 (103), HER WAKA March (39), HER WAKA April (32), Own Your Energy (81).",
    ),
    checked-in-verified: v(
      183,
      "Sum of `checkedIn` for the same four reconciled events in lib/data/json/events-custom.json: 72 + 27 + 24 + 60.",
    ),
    events-verified: v(
      4,
      "Of the nine H1 events in lib/data/json/events-custom.json, four carry complete non-null attendees and checkedIn values.",
    ),
    check-in-rate-verified: v(
      72,
      "183 ÷ 255 across the four reconciled H1 events in lib/data/json/events-custom.json, rounded to the nearest percent. Compares with the 67% average reported for 2025 in public/docs/she-sharp-impact-report-2025.pdf, p.3.",
    ),

    avg-registered: e(
      45,
      "408 ÷ 9. Inherits the placeholder registrations in five of the nine events; the equivalent 2025 figure was 74 (public/docs/she-sharp-impact-report-2025.pdf, p.5), but 2025 held no small-cohort programme sessions, so the two are not like-for-like.",
    ),

    // Unique employers represented by attendees. Not collected in the repo at
    // all — the 2025 equivalent came from the Humanitix checkout field.
    companies: p(96),

    // Programme shape.
    cohorts: v(
      4,
      "Four HER WAKA cohorts ran monthly March–June 2026: lib/data/json/events-custom.json slugs her-waka, her-waka-april-2026, her-waka-may-2026, her-waka-june-2026.",
    ),
    schools: v(
      1,
      "Both Youth Tech Series workshops were held at Fruitvale Primary School, Auckland — lib/data/json/events-custom.json, detailPageData.location.venueName for ids 93 and 94.",
    ),
    youth-workshops: v(
      2,
      "lib/data/json/events-custom.json — peyvand-academy-13-june-2026 and peyvand-academy-20-june-2026.",
    ),
    rangatahi-reached: e(
      46,
      "Sum of the two Youth Tech Series workshops, both of which have null attendee fields in lib/data/json/events-custom.json. Placeholder cohort sizes consistent with a school-hall workshop; reconcile against the Peyvand Academy roll before FINAL.",
    ),

    // Mentorship. "Onboarded", never "applied" — see D.platform.mentor-submissions.
    mentors-onboarded: v(
      26,
      "Live Neon production database, mentor_form_submissions, created H1 2026: 25 in March plus 1 in April. The March 25 were confirmed offline and batch-imported on 2026-03-19 — docs/development/batch-import-mentors-2026.md.",
    ),
    mentees-onboarded: v(
      11,
      "Live Neon production database, mentee_form_submissions created H1 2026: 5 in March, 2 in April, 2 in May, 2 in June.",
    ),

    // Partners who put money, a venue or a classroom behind an H1 event.
    partners: v(
      7,
      "Distinct H1 event partners in lib/data/json/events-custom.json, detailPageData.sponsors: Ministry of Social Development, academyEX, Metlifecare, AUT (ECMS), Peyvand Academy, Ministry of Education, Little Engineers.",
    ),

    volunteers: v(
      8,
      "Live Neon production database — volunteer applications received H1 2026: 3 in February, 1 in March, 2 in April, 2 in June.",
    ),

    team-size: v(
      15,
      "lib/data/team.ts — 15 active trustees and ambassadors. Two further entries (Isha Sangrolkar, Raquel Anne Maderazo) are commented out and are excluded.",
    ),
  ),

  // ---------------------------------------------------------------------------
  // EVENTS — keyed by slug. Mirrors the `stats` block of each record in
  // events.typ; section authors may read either, but this is the metric tree
  // that lib/metrics.typ walks.
  // ---------------------------------------------------------------------------
  events: (
    she-sharp-and-academyex-international-womens-day-2026: (
      registered: v(
        103,
        "lib/data/json/events-custom.json — event id 85, `attendees`.",
      ),
      checked-in: v(
        72,
        "lib/data/json/events-custom.json — event id 85, `checkedIn`.",
      ),
      returning: p(18),
      companies: p(38),
    ),
    her-waka: (
      registered: v(
        39,
        "lib/data/json/events-custom.json — event id 88, `attendees`.",
      ),
      checked-in: v(
        27,
        "lib/data/json/events-custom.json — event id 88, `checkedIn`.",
      ),
      returning: p(4),
      companies: p(9),
    ),
    her-waka-april-2026: (
      registered: v(
        32,
        "lib/data/json/events-custom.json — event id 89, `attendees`.",
      ),
      checked-in: v(
        24,
        "lib/data/json/events-custom.json — event id 89, `checkedIn`.",
      ),
      returning: p(11),
      companies: p(8),
    ),
    she-sharp-candice-murray-own-your-energy: (
      registered: v(
        81,
        "lib/data/json/events-custom.json — event id 87, `attendees`.",
      ),
      checked-in: v(
        60,
        "lib/data/json/events-custom.json — event id 87, `checkedIn`.",
      ),
      returning: p(21),
      companies: p(31),
    ),
    // ---- THE DANGEROUS ONE -------------------------------------------------
    // 5 registered / 0 checked in sits in the right field, in the right file,
    // in the right format. It is almost certainly a truncated export: the May 5
    // session ran to completion (status "completed", a full speaker line-up,
    // a published photo gallery) and the surrounding cohorts drew 32 and 39.
    // Do NOT let this reach print as a fact.
    her-waka-may-2026: (
      registered: e(
        5,
        "lib/data/json/events-custom.json — event id 90, `attendees`. ALMOST CERTAINLY AN INCOMPLETE EXPORT: the session ran to completion with five speakers and a published gallery, and the adjacent cohorts drew 39 and 32. MUST be reconciled against Humanitix before FINAL.",
      ),
      checked-in: e(
        0,
        "lib/data/json/events-custom.json — event id 90, `checkedIn`. A zero check-in for a session that demonstrably took place. Treat as missing, not as zero. MUST be reconciled against Humanitix before FINAL.",
      ),
      returning: p(9),
      companies: p(7),
    ),
    // ------------------------------------------------------------------------
    making-linkedin-work-for-you-with-stuart-little: (
      registered: p(68),
      checked-in: p(47),
      returning: p(16),
      companies: p(26),
    ),
    her-waka-june-2026: (
      registered: p(34),
      checked-in: p(25),
      returning: p(12),
      companies: p(8),
    ),
    peyvand-academy-13-june-2026: (
      registered: p(24),
      checked-in: p(22),
      returning: p(3),
      companies: p(2),
    ),
    peyvand-academy-20-june-2026: (
      registered: p(22),
      checked-in: p(20),
      returning: p(14),
      companies: p(2),
    ),
  ),

  // ---------------------------------------------------------------------------
  // PLATFORM — the member platform launched on shesharp.org.nz.
  // Every figure here comes from the live Neon production database, queried
  // 2026-08-01. These are the most reliable numbers in the report.
  // ---------------------------------------------------------------------------
  platform: (
    users-total: v(
      39,
      "Live Neon production database, `users` table, full row count at 2026-08-01.",
    ),
    users-h1: v(
      37,
      "Live Neon production database, `users` table, created_at within H1 2026: 29 in March, 3 in April, 3 in May, 2 in June.",
    ),
    users-march: v(
      29,
      "Live Neon production database, `users` table, created_at in March 2026 — the month the mentor cohort was onboarded.",
    ),
    users-april: v(
      3,
      "Live Neon production database, `users` table, created_at in April 2026.",
    ),
    users-may: v(
      3,
      "Live Neon production database, `users` table, created_at in May 2026.",
    ),
    users-june: v(
      2,
      "Live Neon production database, `users` table, created_at in June 2026.",
    ),

    mentor-roles: v(
      24,
      "Live Neon production database, `user_roles` — accounts with an active mentor role at 2026-08-01.",
    ),
    mentee-roles: v(
      10,
      "Live Neon production database, `user_roles` — accounts with an active mentee role at 2026-08-01.",
    ),
    admin-roles: v(
      1,
      "Live Neon production database, `user_roles` — accounts with an active admin role at 2026-08-01.",
    ),

    mentor-profiles: v(
      23,
      "Live Neon production database, `mentor_profiles` row count at 2026-08-01.",
    ),
    mentee-profiles: v(
      10,
      "Live Neon production database, `mentee_profiles` row count at 2026-08-01.",
    ),

    // Wording matters: these were CONFIRMED OFFLINE and then onboarded, not
    // applications received. Reporting them as demand would misrepresent the
    // programme to a funder.
    mentor-submissions: v(
      26,
      "Live Neon production database, `mentor_form_submissions` created H1 2026: 25 in March, 1 in April. The March batch was 25 mentors already confirmed offline, imported on 2026-03-19 with invitation codes emailed — docs/development/batch-import-mentors-2026.md. Describe as onboarded, never as applied.",
    ),
    mentee-submissions: v(
      11,
      "Live Neon production database, `mentee_form_submissions` created H1 2026: 5 in March, 2 in April, 2 in May, 2 in June.",
    ),
    waiting-queue: v(
      10,
      "Live Neon production database, `mentee_waiting_queue` rows created H1 2026: 4 in March, 2 in April, 2 in May, 2 in June.",
    ),

    // Empty tables. Any relationship, meeting or revenue figure in this report
    // is therefore invented until the programme starts recording them.
    // NIL IS THE VERIFIED TRUTH HERE, so these are v(0), not placeholders.
    // They previously sat in the tree as p(9) and p(21) — invented numbers
    // standing in for tables that are actually EMPTY. No page printed them, but
    // a future author reading the data file would have found 9 and 21 looking
    // like measurements and wired them in. A real zero also survives a FINAL
    // build, which a placeholder never can.
    relationships: v(0, "mentorship_relationships — empty table, live database at 2026-08-01."),
    meetings: v(0, "meetings — empty table, live database at 2026-08-01."),
    event-registrations-recorded: v(0, "event_registrations — empty table, live database at 2026-08-01."),
  ),

  // ---------------------------------------------------------------------------
  // PROGRAMME
  // ---------------------------------------------------------------------------
  programme: (
    her-waka: (
      cohorts: v(
        4,
        "Four monthly cohorts March–June 2026 — lib/data/json/events-custom.json slugs her-waka, her-waka-april-2026, her-waka-may-2026, her-waka-june-2026.",
      ),
      session-hours: v(
        2,
        "Each cohort runs 12:00pm–2:00pm — lib/data/json/events-custom.json, detailPageData.time for ids 88, 89, 90, 92.",
      ),
      cohort-cap: v(
        25,
        "\"Each two-hour programme brings together up to 25 participants\" — lib/data/json/events-custom.json, detailPageData.fullDescription for event id 88.",
      ),
      registered: e(
        110,
        "39 + 32 + 5 + 34 across the four cohorts. Two of the four inputs are unreliable: May 5 is a suspect export and June 2 is a placeholder. Reconcile before FINAL.",
      ),
      checked-in: e(
        76,
        "27 + 24 + 0 + 25 across the four cohorts, with the same two unreliable inputs as `registered`.",
      ),
      registered-verified: v(
        71,
        "39 + 32 — the two HER WAKA cohorts (March and April) with complete data in lib/data/json/events-custom.json.",
      ),
      checked-in-verified: v(
        51,
        "27 + 24 — the two HER WAKA cohorts (March and April) with complete data in lib/data/json/events-custom.json.",
      ),
      // 16, not 14. Recounted directly from the source: the four cohort records
      // (ids 88, 89, 90, 92) hold 7 + 5 + 5 + 1 = 18 speaker entries, of which
      // 16 are distinct people — two appear in more than one cohort. A v() that
      // does not reconcile to the source its own note names is the worst failure
      // this system allows, because it is the one a checker finds first.
      speakers: v(
        16,
        "Distinct named speakers, panellists and facilitators across the four cohorts in lib/data/json/events-custom.json, detailPageData.speakers (ids 88/89/90/92; 18 entries, 16 distinct names).",
      ),
      recruiter-partners: v(
        5,
        "Recruitment firms named across the four cohorts in lib/data/json/events-custom.json: Potentia, Randstad Digital, Absolute IT, Elevate Consulting, Younity.",
      ),
      into-work: p(12),
      confidence-lift: p(84),
    ),
    youth: (
      workshops: v(
        2,
        "lib/data/json/events-custom.json — peyvand-academy-13-june-2026 and peyvand-academy-20-june-2026.",
      ),
      age-range: "12–18",
      rangatahi: e(
        46,
        "Sum of two workshops whose attendee fields are null in lib/data/json/events-custom.json. Placeholder cohort sizes; reconcile against the Peyvand Academy roll before FINAL.",
      ),
      session-hours: v(
        2,
        "Both workshops ran 2:30pm–4:30pm — lib/data/json/events-custom.json, detailPageData.time for ids 93 and 94.",
      ),
      partners: v(
        3,
        "Peyvand Academy, the Ministry of Education and Little Engineers — lib/data/json/events-custom.json, detailPageData.sponsors for ids 93 and 94.",
      ),
      first-time-participants: p(31),
    ),
    mentorship: (
      mentors-onboarded: v(
        26,
        "Live Neon production database, `mentor_form_submissions` created H1 2026 (25 March batch import plus 1 April).",
      ),
      mentees-onboarded: v(
        11,
        "Live Neon production database, `mentee_form_submissions` created H1 2026.",
      ),
      waiting-queue: v(
        10,
        "Live Neon production database, `mentee_waiting_queue` rows created H1 2026.",
      ),
      // Applications were paused mid-year; this is a documented fact, not a gap.
      paused-month: v(
        6,
        "Applications were paused on 2026-06-19 — docs/development/MENTORSHIP_APPLICATIONS_PAUSED.md, commit 1d26970.",
      ),
      pairs-matched: p(9),
      meetings-logged: p(21),
    ),
  ),

  // ---------------------------------------------------------------------------
  // COMMUNITY
  // ---------------------------------------------------------------------------
  community: (
    volunteer-applications: v(
      8,
      "Live Neon production database — volunteer applications received H1 2026: 3 in February, 1 in March, 2 in April, 2 in June.",
    ),
    contact-enquiries: v(
      4,
      "Live Neon production database, `contact_form_submissions` created H1 2026: 3 in April, 1 in June. A further 7 arrived in July and sit outside this reporting period.",
    ),
    team-size: v(
      15,
      "lib/data/team.ts — 15 active trustees and ambassadors (the two commented-out entries are excluded).",
    ),
    trustees: v(
      2,
      "lib/data/team.ts — members carrying the Trustee role: Mahsa McCauley and Mike McCauley.",
    ),
    // DOWNGRADED from v(6). `lib/newsletter/schedule.ts` computes a send slot;
    // it is not a record that anything was sent, so it cannot evidence a count.
    // The repo holds two issue files (2026-06, 2026-07), one of them outside
    // this period, and the Resend pipeline is a pilot that has not taken over a
    // live send — the sends that actually reached subscribers went via
    // Mailchimp, whose archive is not in this repository. No section prints this
    // today, but marked `verified` it would have sailed through a FINAL build.
    newsletter-issues: e(
      6,
      "Assumed one issue per month, January–June 2026. NOT verifiable from this repository: lib/newsletter/schedule.ts computes a send slot rather than recording sends, and only two issue fixtures exist. Confirm against the Mailchimp campaign archive (MAILCHIMP_CONFIG.archiveUrl in lib/data/newsletters.ts) before a final build.",
    ),
    newsletter-subscribers: p(1420),
    social-followers: p(4600),
    photo-galleries: v(
      9,
      "Every H1 event record in lib/data/json/events-custom.json carries a populated detailPageData.galleryUrl.",
    ),
  ),

  // ---------------------------------------------------------------------------
  // FINANCE — EVERYTHING HERE IS A PLACEHOLDER.
  //
  // The `donations` and `membership_purchases` tables in the production database
  // are both EMPTY, and there is no accounting export in this repository. Not
  // one figure below is traceable. They exist so the finance spread has a shape;
  // a FINAL build will refuse to compile until the treasurer supplies real ones.
  // ---------------------------------------------------------------------------
  finance: (
    total-income: p(148500),
    programme-funding: p(96000),
    sponsorship-cash: p(34500),
    donations: p(4200),
    other-income: p(13800),
    total-expenditure: p(131200),
    programme-delivery: p(88400),
    events-and-venues: p(21600),
    platform-and-tools: p(12300),
    administration: p(8900),
    surplus: p(17300),
    in-kind-venue-value: p(26000),
    cost-per-participant: p(322),
    volunteer-hours: p(1180),
  ),

  // ---------------------------------------------------------------------------
  // OUTLOOK — H2 2026. The three named events are real and already in the repo.
  // ---------------------------------------------------------------------------
  outlook: (
    events-scheduled: v(
      3,
      "lib/data/json/events-custom.json — she-sharp-and-myob-working-smarter (30 July), aotearoa-ai-hackathon-festival-2026 (7–8 August), event-lesmills-03-september-2026 (3 September).",
    ),
    hackathon-days: v(
      2,
      "Friday 7 August 5:00pm through Saturday 8 August — lib/data/json/events-custom.json, detailPageData.time for aotearoa-ai-hackathon-festival-2026.",
    ),
    target-registered: p(520),
    target-cohorts: p(6),
    target-rangatahi: p(120),
  ),

  // ---------------------------------------------------------------------------
  // COMPARATIVES — 2025, for the year-on-year spread. Sourced from the
  // published 2025 impact report. NOTE: that document contradicts itself (see
  // `sources.typ`), so only the p.5 "in a glance" panel is treated as canonical.
  //
  // (Key is `comparatives`, not `context` — `context` is a reserved keyword in
  // Typst and cannot be a bare dict key.)
  // ---------------------------------------------------------------------------
  comparatives: (
    events-2025: v(
      9,
      "public/docs/she-sharp-impact-report-2025.pdf, p.5 — \"NUMBER OF EVENTS: 9\".",
    ),
    registered-2025: v(
      716,
      "public/docs/she-sharp-impact-report-2025.pdf, p.5 — \"TOTAL NUMBER OF REGISTERED ATTENDEES TO ALL EVENTS: 716\".",
    ),
    avg-registered-2025: v(
      74,
      "public/docs/she-sharp-impact-report-2025.pdf, p.5 — \"AVERAGE NUMBER OF REGISTERED ATTENDEE PER EVENT: 74\".",
    ),
    companies-2025: v(
      138,
      "public/docs/she-sharp-impact-report-2025.pdf, p.5 — \"NUMBER OF UNIQUE COMPANIES REPRESENTED BY ATTENDEES: 138\".",
    ),
    check-in-rate-2025: v(
      67,
      "public/docs/she-sharp-impact-report-2025.pdf, p.3 — \"an average check-in rate of 67% across all events\".",
    ),
    founded: v(
      2014,
      "lib/data/nz-tech-facts.ts, fact id she-sharp-growth, and the organisation's own /about page.",
    ),
  ),

  // ---------------------------------------------------------------------------
  // MARKETING CLAIMS — lib/data/stats.ts is promotional copy, not a measurement,
  // and the repository's own data contradicts it. Anything drawn from it is an
  // estimate at best and must carry that caveat wherever it appears in print.
  // ---------------------------------------------------------------------------
  claims: (
    members: e(
      3000,
      "ORGANISATIONAL CLAIM, NOT A MEASUREMENT. lib/data/stats.ts, globalStats.members.current — promotional copy with no register behind it. The production `users` table holds 39 accounts and the mentorship programme onboarded 26 mentors and 11 mentees in H1, so this figure describes cumulative mailing-list and social reach since 2014, not members in any countable sense. A funder who checks 3,000 against 39 must find that distinction already drawn by this report; never print it beside a platform figure without saying which is which.",
    ),
    sponsors-all-time: e(
      50,
      "ORGANISATIONAL CLAIM, NOT A MEASUREMENT. lib/data/stats.ts, globalStats.sponsors.current — a rounded cumulative claim since 2014 with no sponsor register behind it. The logo wall in lib/data/sponsors.ts carries 38 named organisations, and seven partners backed an event in H1 2026 (D.headline.partners). Those two are counted; this one is not.",
    ),
    events-since-2014: e(
      94,
      "ORGANISATIONAL CLAIM, NOT A MEASUREMENT. lib/data/stats.ts, globalStats.events.total — a cumulative claim since 2014 with no event register in this repository to support it. Only the nine H1 2026 events (D.headline.events) and the nine 2025 events (D.comparatives.events-2025) are counted records.",
    ),
  ),
)
