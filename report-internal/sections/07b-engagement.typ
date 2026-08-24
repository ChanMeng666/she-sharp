// Page 8 — email engagement.
//
// THIS PAGE EXISTS BECAUSE THE PREVIOUS VERSION OF THIS REPORT WAS WRONG. Its
// blind-spots page listed opens and clicks as a gap: "never exported, and the
// account-level report never arrived". That was true of the archive and false
// of the organisation — a colleague had pulled the campaign report and written
// it up in a Word document that nobody had connected to this work.
//
// The lesson is in the report rather than only in this comment: a blind spot in
// the systems is not the same as a blind spot in the organisation, and the
// cheapest way to fill one is to ask whether somebody has already done it.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, chart-lede, reading, finding
#import "/report-internal/lib/charts.typ": columns, columns-paired, key

#let D = json("/report-internal/data/record.json")

// Thousands separators. 60648 recipients reads as a typo without them.
#let _thousands(v) = {
  let t = str(calc.round(v))
  let out = ""
  for (i, c) in t.clusters().enumerate() {
    out += c
    let rest = t.len() - i - 1
    if rest > 0 and calc.rem(rest, 3) == 0 { out += "," }
  }
  out
}

#let engagement() = sheet(title: "What the email actually did")[
  #let e = D.email
  #let camps = e.campaigns
  #let news = camps.filter(c => c.name.contains(regex("(?i)newsletter")))
  #let evts = camps.filter(c => not c.name.contains(regex("(?i)newsletter")))
  #let wt(rows, pick) = {
    let total = rows.fold(0, (a, c) => a + c.recipients)
    calc.round(rows.fold(0.0, (a, c) => a + pick(c) * c.recipients) / total, digits: 2)
  }

  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      #str(camps.len()) campaigns went out between February 2025 and July 2026,
      to #_thousands(e.totalRecipients) recipients in total. The channel is not
      declining and it is not failing: opens average around
      #str(calc.round(wt(camps, c => c.openRate))) per cent and have not moved
      between the two years. What it does is more specific than that, and it
      cuts against how the organisation currently uses it.
    ]
  ]

  #chart-lede[
    Open rate by year, recipient-weighted, against a full scale. Nothing has
    happened.
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    // `max: 100` is the whole point — the two years are plotted against every
    // recipient who could have opened, not against each other, so the reader
    // sees that nothing moved rather than a magnified difference. The plot is
    // shortened to suit: at the full 46mm a 29% bar leaves a band of empty
    // canvas that reads as a rendering fault rather than as headroom.
    #columns(
      e.byYear.map(y => (str(y.year), y.openRate)),
      max: 100,
      height: 24mm,
      fmt: v => str(calc.round(v, digits: 1)) + "%",
      hue: indigo,
    )
  ]

  #chart-lede[
    The two formats compared. Left bar of each pair is the newsletter, right is
    an event or partner campaign.
  ]
  #block(above: 0pt, below: gap-line, width: 100%)[
    #columns-paired(
      (
        ("Open rate", (wt(news, c => c.openRate), wt(evts, c => c.openRate))),
        ("Click rate ×10", (wt(news, c => c.clickRate) * 10, wt(evts, c => c.clickRate) * 10)),
        ("Unsubscribe ×10", (wt(news, c => c.unsubRate) * 10, wt(evts, c => c.unsubRate) * 10)),
      ),
      hues: (brand, peri),
      max: 40,
    )
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #key((("Newsletters (" + str(news.len()) + ")", brand), ("Event and partner (" + str(evts.len()) + ")", peri)))
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #reading[
      Click and unsubscribe are multiplied by ten so all three fit one scale;
      the real figures are #str(wt(news, c => c.clickRate))% against
      #str(wt(evts, c => c.clickRate))% on clicks, and
      #str(wt(news, c => c.unsubRate))% against #str(wt(evts, c => c.unsubRate))%
      on unsubscribes.
    ]
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #grid(
      columns: (1fr, 1fr), column-gutter: gutter-card,
      finding(
        "+" + str(calc.round(wt(news, c => c.openRate) - wt(evts, c => c.openRate), digits: 1)) + " pts",
        [more opens for a newsletter than an event campaign.],
        caveat: [The newsletter is what people actually open. It is the
          organisation's strongest attention channel and it is not close.],
      ),
      finding(
        str(calc.round(wt(news, c => c.unsubRate) / wt(evts, c => c.unsubRate), digits: 1)) + "×",
        [the unsubscribe rate, for the same newsletter.],
        caveat: [It opens best and it costs the most subscribers. Read beside
          the list turning negative in 2026, that is the same story twice.],
        hue: flag-ink,
      ),
    )
  ]

  #reading[
    #text(weight: 600)[Two things the source report concluded that the rows do
    not support.] It reads a downward trend through 2026; weighted by
    recipients the two years are #str(e.byYear.first().openRate)% and
    #str(e.byYear.last().openRate)%, so if anything the later year is higher.
    And it recommends instrumenting revenue attribution because every campaign
    shows \$0 — but 86% of She Sharp's places are given away free, and the
    booking platform took
    \$#_thousands(D.finance.ticketing.filter(t => t.year == 2025).first().earnings)
    across the whole of 2025 against
    \$#_thousands(D.finance.filed.last().income) of filed income for the same year.
    Attribution would measure a number that is structurally near zero. #text(weight: 600)[Revenue is the
    wrong success metric for this channel.] The right one is whether an opened
    email puts somebody in a room. Source: #e.source
  ]
]
