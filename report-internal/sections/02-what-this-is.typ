// Page 2 — what this document is, and where its knowledge starts.
//
// THE COVERAGE TABLE IS THE MOST IMPORTANT THING IN THE REPORT and it is on
// page 2 for that reason. Every chart after it is a year series, and a year
// series drawn across systems that started in different years will be read as
// organisational change unless the reader has been told, first, that the record
// itself begins at different moments. She Sharp ran events for five years
// before anything counted them.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, reading

#let D = json("/report-internal/data/record.json")

#let what-this-is() = sheet(title: "What this is")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      This is the organisation's own record, counted rather than chosen. It
      exists because the numbers She Sharp publishes are selected for an
      audience — a funder, a sponsor, a prospective member — and the team needs
      a version that is selected for nobody. Everything in it is generated from
      the archives; nothing is typed in by hand.
    ]
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #box(
      width: 100%, fill: peri-pale, radius: radius-card,
      stroke: (left: 2.5pt + indigo),
      inset: (x: 5mm, y: 4.5mm),
      {
        block(above: 0pt, below: gap-line, text(
          font: body-font, size: size-micro, weight: 700, tracking: 0.10em,
          fill: indigo, upper("Read this before any chart"),
        ))
        block(above: 0pt, below: 0pt, {
          set par(leading: lead-body)
          text(font: body-font, size: size-meta, fill: ink-700)[
            Four of the systems below started in different years, and one of
            them is four months old. A line that rises in 2022 may be the
            organisation growing or it may be the record catching up. Where the
            two cannot be told apart, the note under the chart says so rather
            than leaving the shape to speak for itself.
          ]
        })
      },
    )
  ]

  #block(above: 0pt, below: gap-line, width: 100%)[
    #text(font: body-font, size: size-micro, weight: 700, tracking: 0.10em,
      fill: brand, upper("What each system knows, and from when"))
  ]

  #block(above: 0pt, below: gap-section, width: 100%)[
    #grid(
      columns: (52mm, 26mm, 1fr),
      column-gutter: 4mm,
      row-gutter: 7pt,
      text(font: body-font, size: size-micro, weight: 600, fill: ink, "System"),
      text(font: body-font, size: size-micro, weight: 600, fill: ink, "Covers"),
      text(font: body-font, size: size-micro, weight: 600, fill: ink, "What it can answer"),
      ..D.coverage.map(c => (
        text(font: body-font, size: size-micro, weight: 700, fill: brand, c.source),
        text(font: body-font, size: size-micro, fill: ink-700, c.from + " – " + c.to),
        {
          set par(leading: 0.62em)
          text(font: body-font, size: size-micro, fill: ink-700, c.holds)
        },
      )).flatten()
    )
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #box(
      width: 100%, fill: card, radius: radius-card, inset: (x: 5mm, y: 4.5mm),
      {
        block(above: 0pt, below: gap-line, text(
          font: body-font, size: size-micro, weight: 700, tracking: 0.10em,
          fill: ink-500, upper("The gap that matters most"),
        ))
        block(above: 0pt, below: 0pt, {
          set par(leading: lead-body)
          text(font: body-font, size: size-meta, fill: ink-700)[
            #text(weight: 600)[#str(D.events.registerHeld) events have been
            held. #str(D.events.ticketedInstances) of them have a ticketing
            record.] The other #str(D.events.registerHeld - D.events.ticketedInstances)
            are events from before the ticketing account existed, events a host
            partner sold, and events that were never ticketed at all. They
            happened; they are simply not countable. Every attendance figure in
            this report describes the #str(D.events.ticketedInstances), and
            saying "since 2014" over the top of it would be wrong.
          ]
        })
      },
    )
  ]

  #reading[
    Regenerate with `npx tsx scripts/internal-report/build-record.ts`, which
    needs both raw exports and writes only counts. The figures here are as at
    the export dates on the cover, not as at the day you are reading this.
  ]
]
