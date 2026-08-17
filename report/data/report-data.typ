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

    // All nine events are now reconciled against the Humanitix account export
    // taken 2026-08-17, which is also what corrected the May 5 HER WAKA figure
    // below. See docs/development/HUMANITIX_ARCHIVE.md.
    registered: v(
      468,
      "Sum of `registered` across the nine Humanitix instances dated 2026-01-01..2026-06-30. Source: lib/data/json/humanitix/events.json (export 2026-08-17, attendee spine sha256 4bbac21d8239d5a7…).",
    ),
    checked-in: v(
      298,
      "Sum of `checkedIn` across the SEVEN of nine instances that ran a check-in. The two Youth Tech sessions scanned nobody, so this is not a total over all nine and the check-in rate below is not 298 ÷ 468. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
    ),

    // These four kept their names when the archive landed: they used to mean
    // "the subset we could stand behind", and they now mean the whole
    // half-year, because the export reconciled the other five. Every page that
    // reads them gets a bigger true number, not a differently-caveated one.
    registered-verified: v(
      468,
      "All nine H1 events are reconciled against the Humanitix export; this is identical to `registered` and is kept so the pages quoting a verified-only figure need no rewiring. Source: lib/data/json/humanitix/events.json.",
    ),
    checked-in-verified: v(
      298,
      "As `checked-in`: the sum across the seven instances that recorded check-ins. Source: lib/data/json/humanitix/events.json.",
    ),
    events-verified: v(
      9,
      "All nine H1 events in lib/data/json/events-custom.json now carry registration figures reconciled against the Humanitix export.",
    ),
    check-in-rate-verified: v(
      71,
      "298 ÷ 418 — check-ins over the registrations of the seven instances that RAN a check-in, not over all 468. Including the two Youth Tech sessions, which scanned nobody, would report 64% and would be measuring the absence of a scanner rather than attendance. Compares with the 67% average reported for 2025 in public/docs/she-sharp-impact-report-2025.pdf, p.3.",
    ),

    avg-registered: v(
      52,
      "468 ÷ 9 events. The equivalent 2025 figure was 74 (public/docs/she-sharp-impact-report-2025.pdf, p.5), but 2025 held no small-cohort programme sessions, so the two are not like-for-like. Source: lib/data/json/humanitix/events.json.",
    ),

    // Unique employers represented by attendees, from the Humanitix checkout
    // field — the same source as the 2025 equivalent.
    companies: v(
      113,
      "Distinct canonical employers among H1 2026 attendees who answered the Company/Organisation question at checkout, normalised by lib/data/json/humanitix/organisations.json (which folds `Work and Income` and `WINZ` into MSD, and the three spellings of She Sharp into one). Self-reported and never verified. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
    ),

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
    rangatahi-reached: v(
      50,
      "24 + 26 registrations across the two Youth Tech Series workshops (13 and 20 June 2026). REGISTRATIONS, not distinct rangatahi: the same 50 tickets belong to 30 unique registering addresses, because these are youth workshops booked by a parent. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
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
        "Humanitix instance dated 2026-03-06. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      checked-in: v(
        72,
        "Humanitix instance dated 2026-03-06. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      returning: v(
        38,
        "Attendees whose first She Sharp registration in the Humanitix archive predates this event. Counts repeat REGISTRATION, and the archive holds nothing before 2020, so it undercounts anyone whose first event was earlier. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      companies: v(
        60,
        "Distinct canonical employers among the attendees who answered the Company/Organisation question at checkout, normalised by lib/data/json/humanitix/organisations.json. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
    ),
    her-waka: (
      registered: v(
        39,
        "Humanitix instance dated 2026-03-25. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      checked-in: v(
        27,
        "Humanitix instance dated 2026-03-25. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      returning: v(
        6,
        "Attendees whose first She Sharp registration in the Humanitix archive predates this event. Counts repeat REGISTRATION, and the archive holds nothing before 2020, so it undercounts anyone whose first event was earlier. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      companies: v(
        9,
        "Distinct canonical employers among the attendees who answered the Company/Organisation question at checkout, normalised by lib/data/json/humanitix/organisations.json. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
    ),
    her-waka-april-2026: (
      registered: v(
        32,
        "Humanitix instance dated 2026-04-07. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      checked-in: v(
        24,
        "Humanitix instance dated 2026-04-07. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      returning: v(
        10,
        "Attendees whose first She Sharp registration in the Humanitix archive predates this event. Counts repeat REGISTRATION, and the archive holds nothing before 2020, so it undercounts anyone whose first event was earlier. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      companies: v(
        7,
        "Distinct canonical employers among the attendees who answered the Company/Organisation question at checkout, normalised by lib/data/json/humanitix/organisations.json. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
    ),
    she-sharp-candice-murray-own-your-energy: (
      registered: v(
        81,
        "Humanitix instance dated 2026-04-16. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      checked-in: v(
        60,
        "Humanitix instance dated 2026-04-16. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      returning: v(
        34,
        "Attendees whose first She Sharp registration in the Humanitix archive predates this event. Counts repeat REGISTRATION, and the archive holds nothing before 2020, so it undercounts anyone whose first event was earlier. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      companies: v(
        39,
        "Distinct canonical employers among the attendees who answered the Company/Organisation question at checkout, normalised by lib/data/json/humanitix/organisations.json. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
    ),
    // ---- THE DANGEROUS ONE -------------------------------------------------
    // 5 registered / 0 checked in sits in the right field, in the right file,
    // in the right format. It is almost certainly a truncated export: the May 5
    // session ran to completion (status "completed", a full speaker line-up,
    // a published photo gallery) and the surrounding cohorts drew 32 and 39.
    // Do NOT let this reach print as a fact.
    her-waka-may-2026: (
      registered: v(
        33,
        "Humanitix instance dated 2026-05-05. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      checked-in: v(
        29,
        "Humanitix instance dated 2026-05-05. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      returning: v(
        13,
        "Attendees whose first She Sharp registration in the Humanitix archive predates this event. Counts repeat REGISTRATION, and the archive holds nothing before 2020, so it undercounts anyone whose first event was earlier. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      companies: v(
        7,
        "Distinct canonical employers among the attendees who answered the Company/Organisation question at checkout, normalised by lib/data/json/humanitix/organisations.json. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
    ),
    // ------------------------------------------------------------------------
    making-linkedin-work-for-you-with-stuart-little: (
      registered: v(
        106,
        "Humanitix instance dated 2026-05-15. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      checked-in: v(
        70,
        "Humanitix instance dated 2026-05-15. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      returning: v(
        45,
        "Attendees whose first She Sharp registration in the Humanitix archive predates this event. Counts repeat REGISTRATION, and the archive holds nothing before 2020, so it undercounts anyone whose first event was earlier. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      companies: v(
        30,
        "Distinct canonical employers among the attendees who answered the Company/Organisation question at checkout, normalised by lib/data/json/humanitix/organisations.json. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
    ),
    her-waka-june-2026: (
      registered: v(
        24,
        "Humanitix instance dated 2026-06-02. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      checked-in: v(
        16,
        "Humanitix instance dated 2026-06-02. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      returning: v(
        17,
        "Attendees whose first She Sharp registration in the Humanitix archive predates this event. Counts repeat REGISTRATION, and the archive holds nothing before 2020, so it undercounts anyone whose first event was earlier. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      companies: v(
        6,
        "Distinct canonical employers among the attendees who answered the Company/Organisation question at checkout, normalised by lib/data/json/humanitix/organisations.json. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
    ),
    peyvand-academy-13-june-2026: (
      registered: v(
        24,
        "Humanitix instance dated 2026-06-13. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      // NO CHECK-IN WAS RUN at this session, so there is no attendance
      // figure — not a zero. A 0 here would read as nobody turning up to a
      // workshop that demonstrably happened, with a published gallery. Left
      // as an estimate so a FINAL build has to make the call deliberately.
      checked-in: e(
        0,
        "NOT RECORDED. The session ran no check-in; Humanitix scanned nobody. Treat as missing, never as zero. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      returning: v(
        6,
        "Attendees whose first She Sharp registration in the Humanitix archive predates this event. Counts repeat REGISTRATION, and the archive holds nothing before 2020, so it undercounts anyone whose first event was earlier. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      companies: v(
        10,
        "Distinct canonical employers among the attendees who answered the Company/Organisation question at checkout, normalised by lib/data/json/humanitix/organisations.json. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
    ),
    peyvand-academy-20-june-2026: (
      registered: v(
        26,
        "Humanitix instance dated 2026-06-20. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      // NO CHECK-IN WAS RUN at this session, so there is no attendance
      // figure — not a zero. A 0 here would read as nobody turning up to a
      // workshop that demonstrably happened, with a published gallery. Left
      // as an estimate so a FINAL build has to make the call deliberately.
      checked-in: e(
        0,
        "NOT RECORDED. The session ran no check-in; Humanitix scanned nobody. Treat as missing, never as zero. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      returning: v(
        17,
        "Attendees whose first She Sharp registration in the Humanitix archive predates this event. Counts repeat REGISTRATION, and the archive holds nothing before 2020, so it undercounts anyone whose first event was earlier. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      companies: v(
        9,
        "Distinct canonical employers among the attendees who answered the Company/Organisation question at checkout, normalised by lib/data/json/humanitix/organisations.json. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
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
      registered: v(
        128,
        "39 + 32 + 33 + 24 across the four cohorts, all four now reconciled. The May 5 figure was the suspect one and is 33, not 5. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      checked-in: v(
        96,
        "27 + 24 + 29 + 16 across the four cohorts. Every cohort ran a check-in, so this is a total over all four. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      registered-verified: v(
        128,
        "All four cohorts are reconciled against the Humanitix export, so this is identical to `registered`. Across those 128 registrations there are 93 distinct registering addresses — participants who came back for a later cohort are counted once per cohort here. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      checked-in-verified: v(
        96,
        "As `checked-in`: all four cohorts recorded check-ins. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
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
      rangatahi: v(
        50,
        "24 + 26 registrations across the two workshops. Registrations, not distinct rangatahi — 30 unique registering addresses, most of them a parent's. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
      session-hours: v(
        2,
        "Both workshops ran 2:30pm–4:30pm — lib/data/json/events-custom.json, detailPageData.time for ids 93 and 94.",
      ),
      partners: v(
        3,
        "Peyvand Academy, the Ministry of Education and Little Engineers — lib/data/json/events-custom.json, detailPageData.sponsors for ids 93 and 94.",
      ),
      first-time-participants: v(
        22,
        "Of the 30 unique addresses that registered for the two Youth Tech workshops, 22 appear nowhere earlier in the Humanitix archive. The archive starts in 2020, so this cannot undercount for a 12-18 year old. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
      ),
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
