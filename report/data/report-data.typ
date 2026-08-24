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
//   na(note)        not-recorded  no measurement was ever taken. Carries NO
//                               value, renders as a muted em dash, and DOES
//                               survive a FINAL build — it is a verified fact
//                               about a system of record, not a gap in one.
//
// p() and na() look similar and are opposites. A placeholder is a number we
// have not got yet; na() is the finding that the number does not exist. Reach
// for na() only when writing 0 would be a plausible-looking lie: the two Youth
// Tech sessions ran no check-in scanner, and a 0 under a tile labelled
// "Attended" reads as nobody coming to a workshop that demonstrably happened.
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
// No `value` argument, deliberately: there is nothing to pass. `num()` in
// lib/metrics.typ short-circuits on the `none` before any formatter sees it.
#let na(note) = (value: none, src: "not-recorded", note: note)

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
// `info@`, NOT `hello@` — see the note on `org.email` in data/sources.typ.
// The retired `hello@` local part never existed and bounced every message.
#let contact-email = "info@shesharp.org.nz"
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
//   D.reach.*               who booked, and how the mailing list moved
//   D.finance.*             ONLY money this repository can see — see the block
//   D.outlook.*             H2 2026
//   D.comparatives.*        2025 figures for the year-on-year spread
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
      "298 ÷ 418 — check-ins over the registrations of the seven instances that RAN a check-in, not over all 468. Including the two Youth Tech sessions, which scanned nobody, would report 64% and would be measuring the absence of a scanner rather than attendance. Compares with the 67% average reported for 2025 in the 2025 impact report (IMPACT_REPORT_2025_PDF in lib/config/assets.ts, hosted on Vercel Blob; the old public/docs/ path no longer exists), p.3.",
    ),

    avg-registered: v(
      52,
      "468 ÷ 9 events. The equivalent 2025 figure was 74 — the 2025 impact report (IMPACT_REPORT_2025_PDF in lib/config/assets.ts, hosted on Vercel Blob; the old public/docs/ path no longer exists), p.5 — but 2025 held no small-cohort programme sessions, so the two are not like-for-like. Source: lib/data/json/humanitix/events.json.",
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
      // workshop that demonstrably happened, with a published gallery, on the
      // only page in this report about children. `na()` renders an em dash and
      // survives a FINAL build: the absence of a measurement is itself the
      // finding, and it will never become a number.
      checked-in: na(
        "NOT RECORDED. This session ran no check-in, so Humanitix scanned nobody. 24 people registered. Source: lib/data/json/humanitix/events.json (export 2026-08-17, attendee spine sha256 4bbac21d8239d5a7…).",
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
      // As the 13 June session above: no check-in was run, so there is no
      // attendance figure — not a zero. See that comment for the reasoning.
      checked-in: na(
        "NOT RECORDED. This session ran no check-in, so Humanitix scanned nobody. 26 people registered. Source: lib/data/json/humanitix/events.json (export 2026-08-17, attendee spine sha256 4bbac21d8239d5a7…).",
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
      // The returning-participant story, requested by the section layer to
      // replace a card that rendered `registered-verified` / `checked-in-verified`
      // — identical to `registered` / `checked-in` beside it, so the page showed
      // 128 and 96 twice under two contradictory captions.
      //
      // Recomputed from the vault attendee report rather than inherited from the
      // note on `registered-verified`, which already asserted 93: the 128 rows
      // dated to the four cohorts are all status "complete", none has a blank
      // email, and they carry 93 distinct addresses.
      //
      // The gap of 35 is NOT 35 returns, and the arithmetic matters because the
      // card is built on it: 31 are the same address in a LATER cohort, and 4 are
      // a second ticket booked on an address already used in the SAME cohort.
      // 128 − 93 is therefore the wrong way to count people coming back;
      // `repeat-registrants` below is the right one.
      distinct-registrants: v(
        93,
        "Distinct registering email addresses across the four HER WAKA cohorts, against 128 registrations. ADDRESSES, not verified individuals — one address can book more than one place, and four of the 128 registrations are a second ticket on an address already used in the same cohort. Computed from attendee-report-(exported-2026-08-17@10.02.37).csv in the gitignored vault at private/humanitix/2026-08-17/, registered by sha256 in the committed lib/data/json/humanitix/manifest.json, filtered to event dates 2026-03-25, 2026-04-07, 2026-05-05 and 2026-06-02; identity is the lowercased Email column falling back to Buyer email, the same rule as scripts/humanitix/report-metrics.ts.",
      ),
      repeat-registrants: v(
        20,
        "Registering addresses appearing in more than one HER WAKA cohort: 13 in two cohorts, 3 in three, 4 in all four. Those 20 account for 31 of the 35 registrations above the distinct count; the remaining 4 are same-cohort duplicates and are not people returning. 73 addresses appear in exactly one cohort, and 73 + 20 = 93. Same source and same identity rule as `distinct-registrants`.",
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
      // `into-work` p(12) and `confidence-lift` p(84) were here and are gone,
      // not downgraded. Employment outcomes and confidence are tracked by NO
      // system She Sharp operates, and no survey ran in H1 2026 — so no
      // process exists that would ever turn either placeholder into a figure.
      // PITFALLS.md: a placeholder that can never become real is not a
      // placeholder, because marking it implies "awaiting data". This is a
      // measurement decision that has not been made, and
      // sections/08-her-waka.typ says exactly that in body copy.
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
      // NIL IS THE VERIFIED TRUTH, so these are v(0) — the same call already
      // made at D.platform.relationships. They were p(9) and p(21): invented
      // numbers standing in for a programme that recorded nothing. Two
      // independent sources agree on zero, which is what makes this verified
      // rather than absent: the empty database tables, and the weekly Slack
      // stats app, which had no reason to consult them.
      pairs-matched: v(
        0,
        "No mentor–mentee pairing was recorded in H1 2026. Two independent sources: the `mentorship_relationships` table is empty in the live Neon production database at 2026-08-01; and the weekly \"She Sharp Mentorship Stats\" Slack app, whose 2026-06-29 post is the last inside the period, reports 0 active pairings. Applications were paused on 2026-06-19.",
      ),
      meetings-logged: v(
        0,
        "No mentoring meeting was logged in H1 2026. Two independent sources: the `meetings` table is empty in the live Neon production database at 2026-08-01; and the weekly \"She Sharp Mentorship Stats\" Slack app's 2026-06-29 post, the last inside the period, records no meetings against 0 active pairings. Nil is the measurement, not a missing measurement.",
      ),
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
    // The newsletter figures were e(6) and p(1420) — an assumed monthly cadence
    // and an invented list size. Both are now read from the Mailchimp audience
    // export of 2026-08-17, which is a record of SENDS in a way that
    // `lib/newsletter/schedule.ts` is not: that file computes a send slot.
    // The cadence assumption was also wrong. There was no January or February
    // issue; the monthly rhythm restarted in March.
    newsletter-issues: v(
      4,
      "Monthly newsletter issues evidenced as sent between 2026-01-01 and 2026-06-30: Newsletter - March 2026; Newsletter - April 2026; May Month Newsletter; She Sharp Newsletter - June 2026. Mailchimp records the campaign a contact unsubscribed from and the campaign a hard bounce was detected on; each issue here is dated by the earliest such reaction, which is an upper bound on its send date. A campaign nobody left and nobody bounced on would be invisible, so this is a FLOOR, not a count of sends — but it IS a record of sends, which lib/newsletter/schedule.ts is not: that file computes a send slot. No January or February 2026 issue appears anywhere in the record. Source: the Mailchimp audience export 2026-08-17 (private/mailchimp/2026-08-17/, hashes in lib/data/json/mailchimp/manifest.json).",
    ),
    newsletter-subscribers: v(
      1560,
      "Contacts in the She# Mailchimp audience with status \"subscribed\" — the people who may lawfully be emailed. Read at the export date, 2026-08-17, NOT at 2026-06-30: Mailchimp exports a snapshot of the present, and the status column carries no history. The audience holds 3,689 contacts in total; the other 2,129 unsubscribed, hard-bounced, or never subscribed, and are suppression-hashed in lib/data/json/email-suppression-hashes.json so no future import can re-add them. Source: the Mailchimp audience export 2026-08-17 (private/mailchimp/2026-08-17/, hashes in lib/data/json/mailchimp/manifest.json).",
    ),
    // The half-year flow behind that standing figure. Publish the three
    // components beside the net, because -132 alone invites the wrong reading:
    // 67 of the departures are dead mailboxes, not people leaving.
    newsletter-joined: v(
      26,
      "Contacts whose OPTIN_TIME falls in 2026-01-01..2026-06-30 and who were still subscribed at the export date. Source: the Mailchimp audience export 2026-08-17 (private/mailchimp/2026-08-17/, hashes in lib/data/json/mailchimp/manifest.json).",
    ),
    newsletter-unsubscribed: v(
      91,
      "Contacts whose UNSUB_TIME falls in 2026-01-01..2026-06-30. Source: the Mailchimp audience export 2026-08-17 (private/mailchimp/2026-08-17/, hashes in lib/data/json/mailchimp/manifest.json).",
    ),
    newsletter-bounced: v(
      67,
      "Contacts whose CLEAN_TIME falls in 2026-01-01..2026-06-30 — addresses Mailchimp removed after a hard bounce. These are undeliverable mailboxes, not people choosing to leave. Source: the Mailchimp audience export 2026-08-17 (private/mailchimp/2026-08-17/, hashes in lib/data/json/mailchimp/manifest.json).",
    ),
    newsletter-net: v(
      -132,
      "26 joined less 91 unsubscribed and 67 removed as undeliverable, 2026-01-01..2026-06-30. Source: the Mailchimp audience export 2026-08-17 (private/mailchimp/2026-08-17/, hashes in lib/data/json/mailchimp/manifest.json).",
    ),
    // `social-followers: p(4600)` is gone, not downgraded. Nothing in this
    // repository or in any export held here counts a follower, so no process
    // exists that would ever verify it.
    photo-galleries: v(
      9,
      "Every H1 event record in lib/data/json/events-custom.json carries a populated detailPageData.galleryUrl.",
    ),
  ),

  // ---------------------------------------------------------------------------
  // REACH — who booked the 468 places, and how the mailing list moved.
  //
  // Everything here is a different cut of two exports already cited above: the
  // Humanitix account export and the Mailchimp audience export, both taken
  // 2026-08-17. Nothing in this block is a new claim; it is the composition
  // behind figures the headline spread already states.
  // ---------------------------------------------------------------------------
  reach: (
    // A LIST, not a scalar — nine (label, metric) pairs in the shape
    // `bar-h` and `stat-wall` accept directly (lib/charts.typ, `_row-metric`).
    // The walker descends into it and reaches each `metric` leaf, so a
    // non-verified segment could not hide in here.
    //
    // THE LABELS ARE HUMANITIX'S CATEGORIES, NOT PLAIN ENGLISH, and three of
    // them mislead a reader who takes them at face value. Read each note
    // before writing a caption:
    //   · "Student" is 41 tertiary students AND 32 primary-school children.
    //   · "Youth" is five Little Engineers places, NOT the 50 rangatahi.
    //   · "Programme session" is HER WAKA cohorts only, no Youth Tech.
    // Every one of the three was written wrong here first, from the segment
    // name alone, and caught by reading the ticket types back out of the
    // export. A segment name is not evidence of what the segment contains.
    ticket-segments: (
      (
        label: "Partner guest",
        metric: v(
          95,
          "Tickets under a ticket type named for a partner organisation, across the nine H1 2026 instances — places a partner allocated to its own people, every one at zero cost: AUT 47, MSD 15, RCSA 12, academyEX 12, Metlifecare 4, UNESCO 3, HCLTech 1, MYOB 1. Note the concentration: 46 of the 47 AUT places are the 15 May LinkedIn event, held on AUT's own campus, so nearly half this segment is one host institution's own people at one event. Source: lib/data/json/humanitix/events.json (export 2026-08-17, attendee spine sha256 4bbac21d8239d5a7…).",
        ),
      ),
      (
        label: "General guest",
        metric: v(
          84,
          "Tickets under a guest ticket type at the three public evening events, all free. NOT all general admission: 49 are open \"Guests\" tickets, 33 are \"Guests of Ambassadors\" (11 on 16 April, 22 on 15 May) and 2 are guests of a speaker — a third of this segment is somebody's plus-one rather than an independent booking. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
        ),
      ),
      (
        label: "Programme session",
        metric: v(
          84,
          "HER WAKA cohort places, and nothing else. Exactly four ticket types feed this segment: Tickets - March 2026 (25), April 2026 (25), May 2026 (20), June 2026 (14). NO Youth Tech ticket is in this segment — those 50 places sit under `student` (32) and `ambassador` (13) with 5 under `youth`. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
        ),
      ),
      (
        label: "Student",
        metric: v(
          73,
          "Tickets under a student ticket type, and the segment a caption is most likely to misdescribe: 41 are TERTIARY students at the three evening events (Students 24 plus Uniclubs 17), and the other 32 are PRIMARY-SCHOOL CHILDREN at the two Youth Tech workshops at Fruitvale Primary (17 on 13 June, 15 on 20 June). \"Student\" here does not mean university. The 24 Students tickets at the evening events are also the only paid places in the segment, accounting for $360 of the $1,200 ticket earnings; the other 49 were free. Self-selected at checkout and never verified. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
        ),
      ),
      (
        label: "Ambassador",
        metric: v(
          71,
          "Tickets under an ambassador ticket type — the She Sharp volunteer network's own places, all free. 58 are at the evening events and HER WAKA cohorts; the other 13 are helper places at the two Youth Tech workshops (7 on 13 June, 6 on 20 June, spelled \"Ambassdors\" in the source). Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
        ),
      ),
      (
        label: "Professional",
        metric: v(
          42,
          "Tickets under a professional ticket type at the three public evening events (20 on 6 March, 11 on 16 April, 11 on 15 May). Every one was paid, and together they account for $840 of the $1,200 in ticket earnings — with the 24 paid student tickets they are the whole of D.finance.paid-places. Self-selected at checkout and never verified. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
        ),
      ),
      (
        label: "Speaker",
        metric: v(
          11,
          "Tickets under a speaker ticket type, across five of the nine instances (6 on 6 March, then 1, 1, 2 and 1 at the four HER WAKA cohorts). Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
        ),
      ),
      (
        label: "Youth",
        metric: v(
          5,
          "One ticket type only: the five \"Tickets - Little Engineers\" places at the 20 June workshop. This is NOT the Youth Tech Series headcount — the other 45 places across the two workshops sit under `student` (32) and `ambassador` (13). A chart labelled \"Youth\" beside a page about 50 rangatahi will be read as a contradiction unless the caption says so. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
        ),
      ),
      (
        label: "Host",
        metric: v(
          3,
          "Two ticket types: \"She Sharp Sponsors\" (2) at the 6 March academyEX event and \"Metlifecare (Host)\" (1) at the 16 April event. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
        ),
      ),
    ),
    // The nine segments above sum to exactly 468, which is the whole point of
    // printing them: they reconcile with D.headline.registered rather than
    // sampling it. PITFALLS.md — a reader who adds a column and finds it short
    // stops trusting the document, so the column has to add up.
    ticket-segments-total: v(
      468,
      "The nine ticket-type segments above sum to exactly 468, identical to D.headline.registered — every H1 2026 ticket falls in exactly one segment and none is unclassified. Source: lib/data/json/humanitix/events.json (export 2026-08-17, attendee spine sha256 4bbac21d8239d5a7…).",
    ),
    seats-filled-rate: v(
      77,
      "468 of 606 seats offered, 77%. One event sold beyond its stated capacity. The denominator is D.finance.seats-offered — read from the Humanitix Event summary report, NOT from `instance.capacity` in lib/data/json/humanitix/events.json, which sums overlapping ticket-type allocations, reaches 868, and would report this fill as 54%. Source: the 468 numerator is lib/data/json/humanitix/events.json (export 2026-08-17, attendee spine sha256 4bbac21d8239d5a7…); the 606 denominator is the vault CSV cited in full at D.finance.seats-offered.",
    ),
    event-email-campaigns: v(
      6,
      "Distinct non-newsletter campaigns evidenced as first sent between 2026-01-01 and 2026-06-30: SheSharp x academyEX IWD Email#1; SheSharp x IWD EDM#2; SheSharp x MetLifeCare Mind Coach April Event Email #1; SheSharp x MetLifeCare EDM#2; SheSharp x AUT Linkedin Event EDM #1; SheSharp x AUT Linkedin Event EDM #2 — exactly two per public evening event. Same floor and same dating rule as D.community.newsletter-issues: a campaign nobody left and nobody bounced on is invisible here. Source: the Mailchimp audience export 2026-08-17 (private/mailchimp/2026-08-17/, hashes in lib/data/json/mailchimp/manifest.json).",
    ),
  ),

  // ---------------------------------------------------------------------------
  // FINANCE — ONLY THE MONEY THIS REPOSITORY CAN SEE.
  //
  // Fourteen placeholders used to sit here — total income, expenditure by
  // category, surplus, in-kind venue value, cost per participant, volunteer
  // hours. Every one was invented so the finance spread had a shape, and there
  // is still no accounting export in this repository and no ledger a build can
  // read. They are deleted rather than downgraded: nothing in this repo will
  // ever produce them, and marking a figure "placeholder" promises it is coming.
  //
  // What replaces them is narrower and true. Two systems record She Sharp money
  // in a form this build can cite:
  //
  //   1. the booking platform — every ticket and checkout donation that passed
  //      through Humanitix in the period, and what Humanitix settled;
  //   2. the New Zealand Charities Register — the annual returns the trust has
  //      actually filed, which any funder can read for themselves.
  //
  // GRANT FUNDING, SPONSORSHIP AND IN-KIND SUPPORT PASS THROUGH NEITHER. The
  // event income below is therefore not She Sharp's income; it is the slice of
  // it that has a machine-readable record. Any page using these figures must
  // say so, or it invites a reader to subtract $1,334.84 from a grant-funded
  // year and conclude the organisation is tiny.
  //
  // The register figures are the CURRENT filings and neither is an H1 2026
  // figure — the balance date is 31 December, so H1 2026 sits inside a
  // financial year that has not been filed and will not be until 2027.
  // ---------------------------------------------------------------------------
  finance: (
    // ---- the booking platform, 1 Jan – 30 Jun 2026 --------------------------
    ticket-earnings: v(
      1200.00,
      "Ticket earnings across the nine Humanitix instances dated 2026-01-01..2026-06-30, NET TO SHE SHARP after Humanitix fees — not gross, and not what attendees paid. Only 3 of the 9 events charged for any ticket at all. Source: lib/data/json/humanitix/events.json (export 2026-08-17, attendee spine sha256 4bbac21d8239d5a7…).",
    ),
    donation-income: v(
      134.84,
      "19 voluntary donations added at checkout across the period, on the Humanitix booking form, spread across 5 events. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
    ),
    event-income: v(
      1334.84,
      "Ticket earnings plus checkout donations, 2026-01-01..2026-06-30. This is the whole of the income that passes through the booking platform; grant funding, sponsorship and in-kind support do not pass through it and are not in this figure. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
    ),
    orders: v(
      435,
      "Completed Humanitix orders across the period. An order may carry more than one ticket, which is why 435 orders yield 468 tickets. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
    ),
    payouts-settled: v(
      5,
      "Humanitix settlements for events dated 2026-01-01..2026-06-30, all of which were also paid within the period. Source: the payout report in the Humanitix account export 2026-08-17.",
    ),
    payouts-amount: v(
      1292.04,
      "Total settled to She Sharp for events in the period. It is $42.80 less than the $1,334.84 recorded as earned; the difference is an adjustment on the 15 May LinkedIn event that the payout report does not itemise. Named rather than hidden, and not guessed at. Source: the payout report in the Humanitix account export 2026-08-17.",
    ),

    // ---- access: what the money bought, and what it did not have to --------
    free-places: v(
      402,
      "Tickets issued under a ticket type that took no money, 2026-01-01..2026-06-30 — 86% of all 468 places. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
    ),
    paid-places: v(
      66,
      "Tickets issued under a ticket type that took money. These 66 places account for the whole of the $1,200 ticket earnings above. Source: lib/data/json/humanitix/events.json (export 2026-08-17).",
    ),
    // The ONE figure in this file that does not come from a committed JSON
    // file, so its Source clause has to name the uncommitted CSV rather than
    // the nearest tracked path. It said "lib/data/json/humanitix/events.json"
    // — the exact file the rest of the note says the number did NOT come from,
    // and the file that gives 868. The manifest is committed and registers the
    // CSV by sha256, so the citation still resolves for a checker.
    seats-offered: v(
      606,
      "Capacity summed across the nine instances dated 2026-01-01..2026-06-30. 468 of those 606 places were taken, and one event sold beyond its stated capacity. Deliberately NOT `instance.capacity` in lib/data/json/humanitix/events.json, which sums overlapping ticket-type allocations and reaches 868 — that figure would report a 77% fill as 54%. Source: the `Capacity` column of the Humanitix Event summary report, events-report-(exported-2026-08-17@12.37.50).csv, held in the gitignored vault at private/humanitix/2026-08-17/ and registered with sha256 d45bd14f5ee19ca0… in the committed lib/data/json/humanitix/manifest.json; summed by scripts/humanitix/report-metrics.ts.",
    ),

    // ---- the public register: what has actually been FILED ------------------
    // Two years, both shown. The income fell from $102,674 to $40,825, and a
    // funder can read that off the register in under a minute — PITFALLS.md,
    // "state the comparison your reader already has". No explanation is offered
    // here, because none is evidenced.
    filed-income-2025: v(
      40825,
      "Total income for the year ended 31 December 2025, as filed. Source: the New Zealand Charities Register entry for She Sharp, charity CC57025, Annual Returns tab, return submitted 25/06/2026 on the Tier 4 Combined Form; read 2026-08-24 at https://register.charities.govt.nz/Charity/CC57025. NOT an H1 2026 figure: the balance date is 31 December, so H1 2026 falls inside a financial year that has not been filed.",
    ),
    filed-expenditure-2025: v(
      25335,
      "Total expenditure for the year ended 31 December 2025, as filed. Source: the New Zealand Charities Register entry for She Sharp, charity CC57025, Annual Returns tab, return submitted 25/06/2026 on the Tier 4 Combined Form; read 2026-08-24 at https://register.charities.govt.nz/Charity/CC57025. NOT an H1 2026 figure: the balance date is 31 December, so H1 2026 falls inside a financial year that has not been filed.",
    ),
    filed-income-2024: v(
      102674,
      "Total income for the year ended 31 December 2024, as filed. Source: the New Zealand Charities Register entry for She Sharp, charity CC57025, Annual Returns tab, return submitted 5/02/2025; read 2026-08-24 at https://register.charities.govt.nz/Charity/CC57025. Shown beside the 2025 row because the fall from $102,674 to $40,825 is on the public register either way.",
    ),
    filed-expenditure-2024: v(
      38771,
      "Total expenditure for the year ended 31 December 2024, as filed. Source: the New Zealand Charities Register entry for She Sharp, charity CC57025, Annual Returns tab, return submitted 5/02/2025; read 2026-08-24 at https://register.charities.govt.nz/Charity/CC57025.",
    ),
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
    // `target-registered` p(520), `target-cohorts` p(6) and `target-rangatahi`
    // p(120) were here and are gone. No board minute, funding agreement or
    // planning document in reach of this build sets a target for H2 2026, so
    // they were three numbers this report would have been the first place to
    // state. A forecast nobody has committed to is not a placeholder awaiting
    // data; it is an invention. The three scheduled events below are real
    // records and carry the outlook on their own.
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
      "the 2025 impact report (IMPACT_REPORT_2025_PDF in lib/config/assets.ts, hosted on Vercel Blob; the old public/docs/ path no longer exists), p.5 — \"NUMBER OF EVENTS: 9\".",
    ),
    registered-2025: v(
      716,
      "the 2025 impact report (IMPACT_REPORT_2025_PDF in lib/config/assets.ts, hosted on Vercel Blob; the old public/docs/ path no longer exists), p.5 — \"TOTAL NUMBER OF REGISTERED ATTENDEES TO ALL EVENTS: 716\".",
    ),
    avg-registered-2025: v(
      74,
      "the 2025 impact report (IMPACT_REPORT_2025_PDF in lib/config/assets.ts, hosted on Vercel Blob; the old public/docs/ path no longer exists), p.5 — \"AVERAGE NUMBER OF REGISTERED ATTENDEE PER EVENT: 74\".",
    ),
    companies-2025: v(
      138,
      "the 2025 impact report (IMPACT_REPORT_2025_PDF in lib/config/assets.ts, hosted on Vercel Blob; the old public/docs/ path no longer exists), p.5 — \"NUMBER OF UNIQUE COMPANIES REPRESENTED BY ATTENDEES: 138\".",
    ),
    check-in-rate-2025: v(
      67,
      "the 2025 impact report (IMPACT_REPORT_2025_PDF in lib/config/assets.ts, hosted on Vercel Blob; the old public/docs/ path no longer exists), p.3 — \"an average check-in rate of 67% across all events\".",
    ),
    founded: v(
      2014,
      "lib/data/nz-tech-facts.ts, fact id she-sharp-growth, and the organisation's own /about page.",
    ),
  ),

  // ---------------------------------------------------------------------------
  // MARKETING CLAIMS — DELETED. There is no `D.claims` block, on purpose.
  //
  // It held three estimates read out of lib/data/stats.ts: members 3,000,
  // sponsors 50, events since 2014 94. No page in this report rendered any of
  // them, and no page should: they are cumulative promotional claims with no
  // register, ledger or export behind them anywhere in this repository, and the
  // repo's own data contradicts them (39 accounts in `users`, 38 named
  // organisations in lib/data/sponsors.ts, nine counted events in each of 2025
  // and H1 2026).
  //
  // The metric tree is the wrong place to carry a claim the report does not
  // make. A figure sitting here — even flagged — reads to the next author as
  // "approved, awaiting verification", and the flag is exactly what invites
  // someone to wire it into a page and then verify it. Deleting it is the only
  // state that cannot be misread.
  //
  // The warning itself did not go away, it moved and got better: it is now a
  // prose paragraph on the methodology page, which can say what a metric dict
  // cannot — that the numbers on the She Sharp website are cumulative reach
  // claims since 2014, that this report counts records instead, and that the
  // two will not reconcile.
  // ---------------------------------------------------------------------------
)
