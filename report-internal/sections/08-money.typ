// Page 8 — the money, as filed.
//
// Every figure here is a public record: the annual returns She Sharp has filed
// with Charities Services. Nothing is from an internal ledger, because this
// repository has never held one. That is a limitation and also a strength —
// these are the numbers a funder, a journalist or a prospective trustee can
// pull up in a minute, so the team should not be seeing them for the first time
// in somebody else's email.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, chart-lede, reading, finding
#import "/report-internal/lib/charts.typ": columns-paired, columns, key

#let D = json("/report-internal/data/record.json")
#let _money(v) = {
  let s = str(calc.round(v))
  let out = ""
  for (i, c) in s.clusters().enumerate() {
    out += c
    let rest = s.len() - i - 1
    if rest > 0 and calc.rem(rest, 3) == 0 { out += "," }
  }
  "$" + out
}

#let money() = sheet(title: "The money, as filed")[
  #let filed = D.finance.filed
  #let income-total = filed.fold(0, (a, f) => a + f.income)
  #let spend-total = filed.fold(0, (a, f) => a + f.expenditure)
  #let ticketing-to-2025 = D.finance.ticketing.filter(t => t.year <= 2025).fold(0, (a, t) => a + t.earnings)

  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      Six returns have been filed. Income grew for four years to
      #_money(filed.at(4).income) and then fell to #_money(filed.at(5).income).
      #text(weight: 600)[Every one of the six years was filed in surplus] — the
      charity has taken in #_money(income-total) and spent #_money(spend-total)
      across them, a cumulative surplus of #_money(income-total - spend-total).
    ]
  ]

  #chart-lede[Income against expenditure, per filed financial year.]
  #block(above: 0pt, below: gap-line, width: 100%)[
    #columns-paired(
      filed.map(f => (f.yearEnded.slice(0, 4), (f.income, f.expenditure))),
      hues: (brand, peri),
      fmt: v => _money(v),
    )
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #key((("Income", brand), ("Expenditure", peri)))
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #reading[
      The first bar is a half-year: the balance date was 30 June for the year
      ended #filed.first().yearEnded and 31 December for every year after it.
      #str(filed.last().yearEnded.slice(0, 4)) is the most recent filed year;
      2026 will not be filed until 2027, so this report cannot say what the
      current year looks like. Source: the Annual Returns tab of charity
      CC57025 on the New Zealand Charities Register, read
      #D.metadata.filedReturnsReadAt.
    ]
  ]

  #chart-lede[
    Ticketing earnings per year, net of platform fees — the only income stream
    this repository can see directly.
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #columns(
      D.finance.ticketing.map(t => (str(t.year), t.earnings)),
      hue: indigo,
      fmt: v => _money(v),
    )
  ]

  #reading[
    Across 2020–2025 ticketing produced #_money(ticketing-to-2025) against
    #_money(income-total) of filed income — on the order of seven per cent of
    everything the charity has received. The periods do not align exactly (the
    first return ends in June), so read that as a sense of scale rather than a
    reconciliation. The other ninety-odd per cent is grants, sponsorship and
    in-kind support, and none of it passes through a system this report can
    read. #text(weight: 600)[That is the single largest hole in this document.]
  ]
]
