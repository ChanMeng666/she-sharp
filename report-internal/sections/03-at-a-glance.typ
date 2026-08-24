// Page 3 — the findings, stated once each, before any of them is argued.
//
// Each card is number / what it means / what it does not mean. The third line
// is the one that makes this document usable: a figure without its limit gets
// quoted somewhere it does not belong, and the funder report already carries
// one page of numbers that were quoted that way for years.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, finding, reading

#let D = json("/report-internal/data/record.json")

#let _pct(a, b) = str(calc.round(100 * a / b)) + "%"

#let at-a-glance() = sheet(title: "Six things the record says")[
  #let years = D.events.byYear
  #let peak = years.sorted(key: y => y.registered).last()
  #let y2025 = years.find(y => y.year == 2025)
  #let once = D.people.repeatDistribution.find(b => b.instances == 1).people
  #let filed = D.finance.filed
  #let f2024 = filed.find(f => f.yearEnded == "2024-12-31")
  #let f2025 = filed.find(f => f.yearEnded == "2025-12-31")
  #let net2026 = D.list.byYear.last()

  #block(above: 0pt, below: gap-block, width: 100%)[
    #grid(
      columns: (1fr, 1fr), column-gutter: gutter-card, row-gutter: gutter-card,

      finding(
        height: 47mm,
        _pct(once, D.people.unique),
        [of everyone who has ever registered came exactly once.],
        caveat: [#str(once) of #str(D.people.unique) distinct people, 2020 onward.
          Repeat registration, not repeat attendance — someone who booked twice
          and came once counts as a returner.],
      ),

      finding(
        height: 47mm,
        "−" + _pct(peak.registered - y2025.registered, peak.registered),
        [registrations between the busiest year on record and the year after it.],
        caveat: [#str(peak.registered) in #str(peak.year), #str(y2025.registered)
          in #str(y2025.year), across #str(peak.instances) and
          #str(y2025.instances) ticketed events.],
        hue: flag-ink,
      ),

      finding(
        height: 47mm,
        "−" + _pct(f2024.income - f2025.income, f2024.income),
        [filed income between the same two years.],
        caveat: [\$#str(f2024.income) for the year ended #f2024.yearEnded,
          \$#str(f2025.income) for #f2025.yearEnded. Both figures are on the
          public charities register.],
        hue: flag-ink,
      ),

      finding(
        height: 47mm,
        str(net2026.net),
        [is the first year the mailing list has ever shrunk.],
        caveat: [#str(net2026.joined) joined, #str(net2026.unsubscribed) left and
          #str(net2026.bounced) were removed as undeliverable, in #str(net2026.year)
          to the export date. Every prior year was positive.],
        hue: flag-ink,
      ),

      finding(
        height: 47mm,
        str(D.checkIn.withZeroCheckIns) + " of " + str(D.checkIn.instances),
        [ticketed events ran no check-in at all.],
        caveat: [Their attendance is not zero — nobody scanned. Any attendance
          rate quoted across all events silently averages in the ones that were
          never measured.],
      ),

      finding(
        height: 47mm,
        str(D.mentorship.pairings) + " pairings",
        [came out of the mentorship programme's first cycle.],
        caveat: [#str(D.mentorship.mentorsOnboarded) mentors onboarded and
          #str(D.mentorship.menteeSubmissions) mentees applied. The empty tables
          and the programme's own weekly digest agree on the figure.],
        hue: flag-ink,
      ),
    )
  ]

  #reading[
    Each of these is argued on its own page, with the series behind it. None is
    a projection and none is an estimate: every figure is a count of records in
    a system named on page 2.
  ]
]
