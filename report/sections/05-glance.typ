// Page 5 — H1 2026 at a glance.
//
// EVERY figure on this page is verified. That is a deliberate editorial choice,
// not a coincidence: this is the page a reader photographs and quotes, so it
// carries only numbers that survive a FINAL build unchanged.
//
// Until the Humanitix account export landed (2026-08-17), only four of the nine
// events had attendance anyone could stand behind, and these rows said so —
// "across the four reconciled events". All nine are now reconciled against the
// booking platform itself, so the rows carry the full half-year.
//
// One caveat survives and must not be quietly dropped: the two Youth Tech
// workshops ran no check-in at all, so the check-in rate is computed over the
// SEVEN events that scanned, not over all nine. Including them would report the
// absence of a scanner as an absence of people.

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
  #stat-row(D.headline.registered, "Registered attendees across the nine events")
  #stat-row(D.headline.checked-in, "Attendees checked in, across the seven events that scanned")
  #stat-row(D.headline.check-in-rate-verified, "Check-in rate, events that scanned",
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
            #num(D.headline.registered) registrations across six. *The two are
            not like for like.* 2025 was almost entirely community evenings open
            to anyone; this half-year mixes those with programme cohorts
            deliberately capped at #num(D.programme.her-waka.cohort-cap) people
            so a recruiter can talk to everyone in the room. Average attendance
            is lower by design, not by attrition.
          ]
        })
      },
    )
  ]

  #source-note[
    Every figure on this page is traced to the event register in the She Sharp
    codebase, to the live member-platform database, or to the Humanitix account
    export of 17 August 2026. All nine H1 events are reconciled against the
    booking platform; the May HER WAKA figure, previously known to be an
    incomplete export, is corrected here from 5 registrations to 33. Two events
    ran no check-in, so the check-in rate covers the seven that did. Full detail
    is on the methodology page.
  ]
]
