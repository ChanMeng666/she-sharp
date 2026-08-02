// Page 5 — H1 2026 at a glance.
//
// EVERY figure on this page is verified. That is a deliberate editorial choice,
// not a coincidence: this is the page a reader photographs and quotes, so it
// carries only numbers that survive a FINAL build unchanged. The half-year's
// unreconciled totals (D.headline.registered / checked-in / avg-registered) are
// real and are reported — but on the methodology page and in the event pages,
// where their caveats travel with them, rather than here where they would be
// stripped of context.
//
// That is why four of the six rows say "across the four reconciled events".
// A smaller true number beats a bigger one that a funder can pull apart.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": stat-row, source-note
#import "../lib/metrics.typ": num
#import "../data/report-data.typ": D, period

#let glance() = sheet(title: "H1 2026 at a glance")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #text(font: body-font, size: size-meta, weight: 500, tracking: 0.10em,
      fill: ink-500, upper(period))
  ]

  #stat-row(D.headline.events, "Events delivered")
  #stat-row(D.headline.registered-verified, "Registered attendees across the four reconciled events")
  #stat-row(D.headline.checked-in-verified, "Attendees checked in across those four events")
  #stat-row(D.headline.check-in-rate-verified, "Check-in rate, reconciled events",
    fmt: v => str(v) + "%")
  #stat-row(D.headline.cohorts, "HER WAKA cohorts delivered, March to June")
  #stat-row(D.headline.mentors-onboarded, "Mentors onboarded to the platform")

  // ── The 2025 comparison, stated by us before it is made about us ──────────
  //
  // `D.comparatives` existed from the first draft and no page imported it, so
  // the report made a claim about its own scale while withholding the only
  // benchmark that tests it — in a document going to readers who hold the 2025
  // edition. Publishing the comparison ourselves, with the reason it is not
  // like-for-like, costs far less than being asked for it.
  #block(above: 0pt, below: gap-block, width: 100%, breakable: false)[
    #box(
      width: 100%, fill: peri-pale, radius: radius-card,
      inset: (x: 6mm, y: 5mm),
      {
        block(above: 0pt, below: gap-line, width: 100%, text(
          font: body-font, size: size-micro, weight: 700, tracking: 0.10em,
          fill: indigo, upper("Against the 2025 full year"),
        ))
        block(above: 0pt, below: 0pt, width: 100%, {
          set par(leading: lead-body)
          text(font: body-font, size: size-meta, fill: ink-700)[
            The 2025 report recorded #num(D.comparatives.events-2025) events and
            #num(D.comparatives.registered-2025) registrations across a full
            twelve months. This half-year records
            #num(D.headline.events) events and
            #num(D.headline.registered-verified) reconciled registrations across
            six. *The two are not like for like.* 2025 was almost entirely
            community evenings open to anyone; this half-year mixes those with
            programme cohorts deliberately capped at
            #num(D.programme.her-waka.cohort-cap) people so a recruiter can talk
            to everyone in the room. Average attendance is lower by design, not
            by attrition, and five of this half-year's nine events are not yet
            reconciled.
          ]
        })
      },
    )
  ]

  #source-note[
    Every figure on this page is traced to the event register in the She Sharp
    codebase or to the live member-platform database. Four of the nine H1 events
    carry complete, reconciled attendance; the other five do not, so the totals
    quoted here cover the reconciled four rather than the full nine. The May HER
    WAKA export is known to be incomplete. Full detail, including what is still
    being reconciled, is on the methodology page.
  ]
]
