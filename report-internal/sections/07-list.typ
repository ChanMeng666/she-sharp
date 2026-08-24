// Page 7 — the mailing list, rebuilt year by year.
//
// Mailchimp exports a snapshot: one row per contact, carrying the moment they
// joined, the moment they left and the moment a bounce removed them. Replaying
// those three timestamps rebuilds the position at every year end, which the
// platform itself will not show you. The reconstruction lands one contact short
// of the export's own total and that is stated rather than closed.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, chart-lede, reading, finding
#import "/report-internal/lib/charts.typ": columns, columns-diverging, key

#let D = json("/report-internal/data/record.json")
#let _pct(a, b) = str(calc.round(100 * a / b)) + "%"

#let list-page() = sheet(title: "The mailing list")[
  #let ys = D.list.byYear
  #let best = ys.sorted(key: y => y.net).last()
  #let now = ys.last()

  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      The list grew every year for seven years and is shrinking in the eighth.
      Growth peaked in #str(best.year) at #str(best.net) net, halved the year
      after, and has fallen every year since. #str(now.year) is
      #str(now.net) to date — the first negative year in the record.
    ]
  ]

  #chart-lede[
    Net movement each year: people who joined, less those who unsubscribed and
    those whose address stopped working.
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #columns-diverging(ys.map(y => (str(y.year), y.net)))
  ]

  #chart-lede[The emailable list at each year end, rebuilt from those movements.]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #columns(
      ys.map(y => (str(y.year), y.emailableAtYearEnd)),
      hue: indigo,
      highlight: str(now.year),
    )
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #reading[
      Two departures are not the same thing and the chart above merges them.
      In #str(now.year), #str(now.unsubscribed) people chose to leave and
      #str(now.bounced) addresses simply stopped existing — the second is list
      hygiene rather than a verdict on the organisation. But joins have
      collapsed to #str(now.joined), and that is the number driving the sign.
      #D.list.reconciliation.note
    ]
  ]

  #block(above: 0pt, below: 0pt, width: 100%)[
    #grid(
      columns: (1fr, 1fr), column-gutter: gutter-card,
      finding(
        _pct(D.list.suppressed, D.list.contacts),
        [of the audience database can never be emailed again.],
        caveat: [#str(D.list.suppressed) of #str(D.list.contacts) contacts have
          unsubscribed, hard-bounced, or never subscribed. They are permanently
          suppressed, and no import can re-add them.],
        hue: flag-ink,
      ),
      finding(
        str(D.list.subscribed),
        [people can lawfully be emailed today.],
        caveat: [This is the real size of the organisation's direct reach, and
          it is the figure to plan a send against — not the audience total.],
      ),
    )
  ]
]
