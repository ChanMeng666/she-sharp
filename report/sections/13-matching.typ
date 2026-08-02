// Page 22 — how mentor matching works.
//
// A DIAGRAM IS A PROVENANCE HOLE. `lib/metrics.typ` walks report/data/ and marks
// every unverified number in amber; it cannot inspect a picture. This diagram
// shows a six-month cycle with a three-month check-in and a close-out survey,
// and NONE of that ran in H1 2026 — `mentorship_relationships` and `meetings`
// are empty tables and intake paused on 19 June. A funder skimming the page
// would read designed process as delivered activity.
//
// So the caption does the work the amber markers do elsewhere: the page says in
// its own heading and its note that this is the designed cycle, not throughput.
//
// SIZED BY HEIGHT, NOT WIDTH. mentor-matching.png is 2200x3863 — 1:1.76 PORTRAIT.
// At the ~178mm content width it would render ~313mm tall, taller than the A4
// sheet itself, and inside a card that overflows silently rather than erroring.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": chart-card, source-note
#import "../lib/assets.typ": diagram
#import "../data/copy.typ": matching-narrative

#let matching-page() = sheet(title: "How matching is designed to work")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700, matching-narrative)
  ]

  #chart-card(
    "The designed mentoring cycle",
    align(center, box(
      height: 118mm,
      image(diagram("mentor-matching"), height: 100%, fit: "contain"),
    )),
    note: [The mentoring cadence shown here — six-month cycle, three-month
      check-in, close-out survey — is *the programme design agreed for 2026. It
      is not implemented in the platform and no pair has run it.* The steps up to
      "both accept" correspond to states the database actually records; the three
      after it do not exist in any system yet. No mentoring pair completed a
      cycle inside the reporting period: matching had not begun before 30 June,
      and applications were paused on 19 June.],
  )

  // The source note here used to claim "Diagram generated from the platform's
  // own matching specification. Stage names match the states recorded in the
  // database schema." Both halves were false. There is no file in this
  // repository that is a matching specification, and the schema's
  // `relationship_status` enum is pending / active / paused / completed /
  // rejected — not one of the diagram's labels. "Six-month", "three-month" and
  // "close-out" appear nowhere in lib/ or app/ at all. A diagram sits exactly
  // where the provenance system cannot look, which is precisely why its caption
  // must not invent a source.
  #source-note[
    The diagram is a description of the intended programme, drawn for this
    report. It is not generated from a specification and does not reflect
    implemented platform states beyond the matching and acceptance steps.
  ]
]
