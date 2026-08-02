// Pages 8–9 — the HER WAKA programme.
//
// Two pinned pages: page 8 is the programme's shape (copy plus the cohort
// timeline), page 9 is its numbers (funnel, per-cohort comparison, headline
// tiles). Splitting it this way keeps the timeline and the charts full-width —
// neither survives being poured into a two-column flow.
//
// ── The honesty problem this spread has to solve ─────────────────────────────
// Two of the four cohorts have clean data and two do not: May is a suspect
// export (5 registered, 0 checked in for a session that demonstrably ran) and
// June is a placeholder. Any total across all four is therefore an estimate, and
// the per-cohort chart makes the May figure look like a collapse rather than a
// broken file.
//
// Rather than hide either, the page shows BOTH: the verified two-cohort subtotal
// as a tile, the four-cohort estimate as a funnel, and a caption under the
// comparison chart naming May as an export failure. A reader who only looks at
// the picture still sees the caveat.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": stat-card, chart-card, source-note, quote-card
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
      (date: "7 Apr", label: "#IAmRemarkable and practical AI",
       metric: D.events.her-waka-april-2026.registered),
      (date: "5 May", label: "Cybersecurity pathways",
       metric: D.events.her-waka-may-2026.registered),
      (date: "2 Jun", label: "Personal branding and growth",
       metric: D.events.her-waka-june-2026.registered),
    )),
    note: [Figures are registrations. The 5 May export is incomplete and is being
      reconciled; treat it as missing rather than as a result.],
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
  #block(above: 0pt, below: gap-section, width: 100%, breakable: false)[
    #grid(
      columns: (1fr, 1fr),
      column-gutter: gutter-card,
      // NO FUNNEL, AND NO "INTO WORK" ROW.
      //
      // This card used to draw Registered 110ᴱ → Checked in 76ᴱ → Into work 12ᴾ.
      // HER WAKA is titled "Navigating Pathways into Sustainable Employment",
      // the Ministry of Social Development funds it, refers the participants and
      // receives this report — so "into work" is the single number they are
      // reading for, and it was invented. A 7.5pt grey caption underneath does
      // not undo a funnel whose geometry asserts a conversion pipeline.
      //
      // Two honest bars and a sentence turn a fabrication into a proposal.
      chart-card(
        "Across all four cohorts",
        bar-h(
          (
            ("Registered", D.programme.her-waka.registered),
            ("Checked in", D.programme.her-waka.checked-in),
          ),
          max: 120,
        ),
        note: [Both figures are estimates: two of the four cohorts are
          unreconciled. *Employment outcomes are not tracked by any system She
          Sharp operates*, so no into-work figure is claimed here. Agreeing what
          to measure, and who records it, is a joint decision for the second
          half-year.],
      ),
      chart-card(
        "The reconciled subset",
        // Two words maximum at this width. In a HALF-width card each of these two
        // tiles is ~38mm, so "Registered, March and April" wrapped to THREE lines
        // and printed straight through the numeral — the same overflow guarded
        // against on the page above, hit again at half the column width. The
        // March-and-April qualifier lives in the card title and note instead,
        // where it costs nothing.
        stat-wall((
          (metric: D.programme.her-waka.registered-verified, label: "Registered"),
          (metric: D.programme.her-waka.checked-in-verified, label: "Checked in"),
        ), cols: 2, height: 25mm, gutter: 5mm),
        note: [March and April — the two cohorts with complete data. These are the
          only HER WAKA attendance figures that survive a final build unchanged.],
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
    note: [Cohort 3 shows almost nothing because its export is broken, not
      because the session was empty: it ran to completion with five speakers and
      a published photo gallery. Cohort 4 has no attendance recorded at all and
      its bars are placeholders.],
  )

  #quote-card(
    [Job readiness is mostly a matter of having had the conversation once before
      it counts.],
    "Why every cohort ends at the recruiter tables",
    fill: mint,
  )
]
