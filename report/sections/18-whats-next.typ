// Page 27 — what is already booked for H2 2026.
//
// The three named events here are REAL and already in the event register with
// dates, venues and open registration — MYOB "Working Smarter" (30 July), the
// Aotearoa AI Hackathon Festival (7 August) and the Les Mills event (3
// September). That is why this page can be specific where the funding page
// cannot: a commitment with a date and a venue is a different kind of statement
// from a projection.
//
// Targets are a different matter and are marked as such. A target is not a
// result, and the amber markers make that visible without the copy having to
// apologise for it.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": stat-card, source-note, eyebrow
#import "../lib/charts.typ": timeline
#import "../data/report-data.typ": D
#import "../data/copy.typ": whats-next

#let whats-next-page() = sheet(title: "What happens next")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700, whats-next)
  ]

  #block(above: 0pt, below: gap-line, width: 100%)[
    #eyebrow("Already in the diary", fill: brand)
  ]

  #block(above: 0pt, below: gap-section, width: 100%)[
    #timeline((
      (date: "30 JUL", label: "Working Smarter, with MYOB"),
      (date: "7 AUG", label: "Aotearoa AI Hackathon Festival, with AUT and the AI Forum"),
      (date: "3 SEP", label: "Les Mills, Auckland"),
    ))
  ]

  #block(above: 0pt, below: gap-line, width: 100%)[
    #eyebrow("What we are aiming for by December", fill: ink-500)
  ]

  #block(above: 0pt, below: gap-section, width: 100%)[
    #grid(
      columns: (1fr, 1fr, 1fr),
      column-gutter: gutter-card,
      stat-card(D.outlook.target-cohorts, "More HER WAKA cohorts"),
      stat-card(D.outlook.target-registered, "Registrations, full year"),
      stat-card(D.outlook.target-rangatahi, "Rangatahi reached"),
    )
  ]

  #source-note[
    The three dated events are confirmed, with venues and partners agreed and
    registration open at the time of writing. The three figures beneath them are
    targets, not forecasts and not results, and are marked as unverified for that
    reason. Progress against them will be reported in the full-year report.
  ]
]
