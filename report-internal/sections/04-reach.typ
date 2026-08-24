// Page 4 — how many people registered, year by year.
//
// The chart is registrations, not people and not attendance, because
// registrations is the only one of the three the record holds for every year.
// 2020 and 2021 have no usable check-in data at all, so plotting attendance
// here would draw two empty years next to five full ones and invite the reader
// to see a collapse that is an instrumentation gap.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, chart-lede, reading
#import "/report-internal/lib/charts.typ": columns, columns-paired, key

#let D = json("/report-internal/data/record.json")

#let reach() = sheet(title: "Reach, year by year")[
  #let years = D.events.byYear
  #let peak = years.sorted(key: y => y.registered).last()
  #let latest-full = years.find(y => y.year == 2025)

  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      Registrations rose for four years, peaked in #str(peak.year) at
      #str(peak.registered), and then fell by nearly half. #str(latest-full.year)
      was the quietest full year since #str(years.first().year) — and it ran
      #str(latest-full.instances) ticketed events against #str(peak.instances)
      the year before, so the fall is not simply fewer events.
    ]
  ]

  #chart-lede[Registrations per year, across every ticketed event.]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #columns(
      years.map(y => (str(y.year), y.registered)),
      highlight: str(peak.year),
    )
  ]
  #block(above: 0pt, below: gap-section, width: 100%)[
    #reading[
      #str(peak.year) is marked because it is the high-water mark, not because
      anything is wrong with it. #str(years.last().year) is a part year — it
      runs to the export date and includes events dated to September — so it is
      not comparable with the six beside it and no trend should be drawn
      through it.
    ]
  ]

  #chart-lede[
    Events held against events with a ticketing record. The gap is the part of
    the organisation's own history that cannot be counted.
  ]
  #block(above: 0pt, below: gap-line, width: 100%)[
    #columns-paired(
      years.map(y => (str(y.year), (y.registerEvents, y.instances))),
      hues: (indigo, peri),
    )
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #key((("On the event register", indigo), ("With a ticketing record", peri)))
  ]

  #reading[
    In most years the two nearly agree, which is why the totals diverge so much
    more than the annual bars suggest: the missing #str(D.events.registerHeld - D.events.ticketedInstances)
    events are concentrated before 2020, where the ticketing account did not yet
    exist. Nothing in this report can say how many people attended those.
  ]
]
