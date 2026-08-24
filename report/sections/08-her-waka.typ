// Pages 8–9 — the HER WAKA programme.
//
// Two pinned pages: page 8 is the programme's shape (copy plus the cohort
// timeline), page 9 is its numbers (funnel, per-cohort comparison, headline
// tiles). Splitting it this way keeps the timeline and the charts full-width —
// neither survives being poured into a two-column flow.
//
// ── The honesty problem this spread USED to have ─────────────────────────────
// Until the Humanitix account export of 2026-08-17 landed, two of the four
// cohorts had clean data and two did not: May read 5 registered and 0 checked in
// for a session that demonstrably ran, and June was a placeholder. The spread
// was built around that — a "reconciled subset" card carrying the two-cohort
// subtotal, a four-cohort estimate beside it, and a caption naming May as an
// export failure.
//
// ALL FOUR COHORTS ARE NOW RECONCILED. May is 33 / 29 and June is 24 / 16; the
// four-cohort totals are 128 / 96 and every figure on the spread is v(). The
// scaffolding that existed to hold the caveat has been removed with it — most of
// all the "reconciled subset" card, which by then rendered the SAME two numbers
// as the card beside it under a caption saying they were a different, smaller
// set. Two identical figures under contradictory captions is worse than either
// figure alone, and it was not a wording problem: the distinction the card
// existed to draw had stopped existing.
//
// What survives is the one caveat that is still true, and it is the important
// one: EMPLOYMENT OUTCOMES ARE TRACKED BY NO SYSTEM SHE SHARP OPERATES, so this
// spread claims no into-work figure. That is a measurement decision that has not
// been made, not a gap waiting on an export.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": chart-card, quote-card
#import "../lib/charts.typ": timeline, bar-grouped, stat-wall, bar-h
#import "../data/copy.typ": chapter-her-waka
#import "../data/report-data.typ": D

#let her-waka-shape() = sheet(title: "HER WAKA")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: false)
    #text(font: body-font, size: size-lede, weight: 500, fill: ink)[
      An employment programme, not an event series. Funded and referred by the
      Ministry of Social Development, designed and delivered by She Sharp,
      hosted by academyEX in Grafton.
    ]
  ]

  // The columns block carries an EXPLICIT height, and it has to.
  //
  // `columns()` does not balance: it fills the first column to the height of its
  // container and only then flows into the second. When the container is "the
  // rest of the page" — as it is for any columns block that is not the last
  // thing on the page — that height is the full remaining page, so every word
  // lands in column one and column two renders EMPTY. It compiles clean and
  // looks like a copy-fitting mistake rather than a layout bug.
  //
  // Pinning the height forces the split. Re-measure it if this copy changes.
  #block(above: 0pt, below: gap-section, width: 100%, height: 52mm)[
    #set text(font: body-font, size: size-body, fill: ink-700,
      lang: "en", region: "nz", hyphenate: true)
    #set par(leading: lead-body, justify: true, spacing: gap-para)
    #columns(2, gutter: 8mm, chapter-her-waka)
  ]

  // ── The four cohorts on a line ────────────────────────────────────────────
  #chart-card(
    "Four monthly cohorts, March to June 2026",
    timeline((
      (date: "25 Mar", label: "AI and the future of work",
       metric: D.events.her-waka.registered),
      // Kept to ONE line at this column width. At "#IAmRemarkable and practical
      // AI" the label wrapped to two lines and dragged its value down, so the
      // four timeline figures sat at three different heights and stopped reading
      // as one row. `timeline` gives every point the same track, not the same
      // label height.
      (date: "7 Apr", label: "#IAmRemarkable and AI tools",
       metric: D.events.her-waka-april-2026.registered),
      (date: "5 May", label: "Cybersecurity pathways",
       metric: D.events.her-waka-may-2026.registered),
      (date: "2 Jun", label: "Personal branding and growth",
       metric: D.events.her-waka-june-2026.registered),
    )),
    note: [Figures are registrations, reconciled cohort by cohort against the
      Humanitix account export of 17 August 2026. Registration is not attendance:
      the checked-in figures are set beside them on the facing page.],
  )

  #block(above: 0pt, below: 0pt, width: 100%)[
    // Labels are kept to two lines at this width. "Recruitment firms at the
    // tables" wrapped to three and the third line printed straight through the
    // numeral — a `stat-card` clips nothing, it just overflows its own inset.
    #stat-wall((
      (metric: D.programme.her-waka.session-hours, label: "Hours per session"),
      (metric: D.programme.her-waka.cohort-cap, label: "Cap per cohort"),
      (metric: D.programme.her-waka.speakers, label: "Speakers and facilitators"),
      (metric: D.programme.her-waka.recruiter-partners, label: "Recruitment firms"),
    ), cols: 4, height: 27mm)
  ]
]

#let her-waka-numbers() = sheet(title: "HER WAKA in numbers")[
  // ONE CARD, FULL WIDTH — it used to be two side by side.
  //
  // The second card was titled "The reconciled subset" and drew
  // `registered-verified` / `checked-in-verified` as a 2-up stat wall, captioned
  // "March and April — the two cohorts with complete data". Once the Humanitix
  // export reconciled May and June, those two metrics became identical to
  // `registered` / `checked-in` in the card beside them: the page printed 128 and
  // 96 twice, six centimetres apart, under two captions that said they were
  // different populations. PITFALLS.md — two irreconcilable numbers on one page
  // cost more than a missing one, and a reader who notices stops trusting the
  // arithmetic everywhere else.
  //
  // Deleting the card rather than recaptioning it is the structural fix: the
  // distinction it existed to draw no longer exists, so there is nothing for a
  // better caption to say. What takes the slot is the story the deleted card was
  // reaching for and could not tell — the returning count, cohort by cohort,
  // which rises 6, 10, 13, 17 and is the one series on this spread that says
  // anything about the same people coming back. Those four metrics were already
  // in the data; nothing was added for this.
  #block(above: 0pt, below: gap-section, width: 100%, breakable: false)[
    #grid(
      columns: (1fr, 1fr),
      column-gutter: gutter-card,
    // NO FUNNEL, AND NO "INTO WORK" ROW.
    //
    // This card used to draw Registered 110ᴱ → Checked in 76ᴱ → Into work 12ᴾ.
    // HER WAKA is titled "Navigating Pathways into Sustainable Employment", the
    // Ministry of Social Development funds it, refers the participants and
    // receives this report — so "into work" is the single number they are reading
    // for, and it was invented. A 7.5pt grey caption underneath does not undo a
    // funnel whose geometry asserts a conversion pipeline.
    //
    // Two honest bars and a sentence turn a fabrication into a proposal.
    chart-card(
      "Across all four cohorts",
      bar-h(
        (
          ("Registered", D.programme.her-waka.registered),
          ("Checked in", D.programme.her-waka.checked-in),
        ),
        max: 140,
        label-width: 22mm,
      ),
      note: [All four cohorts are reconciled against the Humanitix account export
        of 17 August 2026, so both are counts, not totals over a subset.
        Registration counts tickets and not people.
        *Employment outcomes are not tracked by any system She Sharp operates*,
        so no into-work figure is claimed here. Agreeing what to measure, and who
        records it, is a joint decision for the second half-year.],
    ),
    // The returning series, in cohort order rather than by size, because the
    // ORDER is the finding: 6, 10, 13, 17. Read it carefully, though — see the
    // note. "Returning" means an earlier She Sharp registration exists in the
    // booking archive, not specifically an earlier HER WAKA cohort, and the
    // archive begins in 2020.
    chart-card(
      "Returning registrations, by cohort",
      bar-h(
        (
          ("25 March", D.events.her-waka.returning),
          ("7 April", D.events.her-waka-april-2026.returning),
          ("5 May", D.events.her-waka-may-2026.returning),
          ("2 June", D.events.her-waka-june-2026.returning),
        ),
        max: none,
        label-width: 18mm,
      ),
      note: [A registration counts as returning when the same address appears
        earlier in the booking archive — at any She Sharp event, not only at an
        earlier cohort. The archive begins in 2020, so anyone whose first She
        Sharp event was before then counts as new and every figure here is a
        floor.],
    ),
    )
  ]

  #chart-card(
    "Registered against checked in, by cohort",
    bar-grouped(
      (
        (name: "Registered", hue: brand, values: (
          D.events.her-waka.registered,
          D.events.her-waka-april-2026.registered,
          D.events.her-waka-may-2026.registered,
          D.events.her-waka-june-2026.registered,
        )),
        (name: "Checked in", hue: peri, values: (
          D.events.her-waka.checked-in,
          D.events.her-waka-april-2026.checked-in,
          D.events.her-waka-may-2026.checked-in,
          D.events.her-waka-june-2026.checked-in,
        )),
      ),
      ("Cohort 1 · 25 March", "Cohort 2 · 7 April", "Cohort 3 · 5 May", "Cohort 4 · 2 June"),
      label-width: 24mm,
    ),
    note: [Every bar is a reconciled figure from the Humanitix account export of
      17 August 2026. Cohort 3 read 5 registered and 0 checked in until that
      export arrived, and this chart carried a caption saying so; the session had
      in fact run to completion with five speakers and a published gallery, and
      the record, not the session, was the thing that was thin.],
  )

  #quote-card(
    [Job readiness is mostly a matter of having had the conversation once before
      it counts.],
    "Why every cohort ends at the recruiter tables",
    fill: mint,
  )
]
