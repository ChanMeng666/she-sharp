// Page 6 — attendance, and the scanner that was often not there.
//
// The check-in rate is the organisation's most quoted operational number and
// the least safe. It is only defined for events that ran a scanner, and for
// twenty-six of sixty-two ticketed events nobody did. This page separates the
// measurement from the thing measured before it plots either.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, chart-lede, reading, finding
#import "/report-internal/lib/charts.typ": columns, columns-paired, key

#let D = json("/report-internal/data/record.json")
#let _pct(a, b) = str(calc.round(100 * a / b)) + "%"

#let attendance() = sheet(title: "Attendance, and the scanner")[
  #let scanned = D.events.byYear.filter(y => y.checkInDataPresent)

  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      Nothing was scanned before September 2022. Since then the check-in rate
      has been remarkably steady — between
      #str(calc.round(100 * scanned.sorted(key: y => y.checkInRate).first().checkInRate))% and
      #str(calc.round(100 * scanned.sorted(key: y => y.checkInRate).last().checkInRate))% every year —
      which is more interesting than it looks: roughly a third of the people who
      book a free ticket do not come, and that has not changed as the
      organisation has grown or shrunk.
    ]
  ]

  #chart-lede[
    Check-in rate, for the years where a scanner was used at all. 2020 and 2021
    are absent because no event in them recorded a check-in.
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #columns(
      scanned.map(y => (str(y.year), calc.round(100 * y.checkInRate))),
      max: 100,
      fmt: v => str(v) + "%",
      hue: indigo,
    )
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #reading[
      Plotted against a full 100% scale rather than against its own range, so
      the variation is not exaggerated. The rate is check-ins over
      registrations for the instances that scanned; an event with no scanner is
      excluded entirely rather than counted as zero.
    ]
  ]

  #chart-lede[
    Registrations against people actually scanned in, for the years a scanner
    was used.
  ]
  #block(above: 0pt, below: gap-line, width: 100%)[
    #columns-paired(
      scanned.map(y => (str(y.year), (y.registered, y.checkedIn))),
      hues: (brand, peri),
    )
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #key((("Registered", brand), ("Checked in", peri)))
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #grid(
      columns: (1fr, 1fr), column-gutter: gutter-card,
      finding(
        str(D.checkIn.withZeroCheckIns) + " / " + str(D.checkIn.instances),
        [ticketed events have no attendance figure at all.],
        caveat: [Every one of them shows 0 checked in, which is the absence of a
          measurement and not a count of nobody.],
        hue: flag-ink,
      ),
      finding(
        _pct(D.checkIn.withCheckIns, D.checkIn.instances),
        [of ticketed events actually recorded who turned up.],
        caveat: [The first was in September 2022. Anything quoted about
          attendance before then is not from this system.],
      ),
    )
  ]

  #reading[
    The practical consequence: an average attendance rate taken across all
    events, without excluding the unscanned ones, understates attendance by
    roughly the share of events that never scanned. That mistake is easy to make
    from a spreadsheet and impossible to see afterwards.
  ]
]
