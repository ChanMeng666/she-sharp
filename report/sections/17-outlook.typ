// Page 26 — funding and resourcing.
//
// EVERY FIGURE ON THIS PAGE IS A PLACEHOLDER, and the page says so at the top
// rather than at the bottom. The `donations` and `membership_purchases` tables
// are empty; She Sharp's H1 finances live in accounting records that are not in
// this codebase and were not available when this draft was built.
//
// The page exists anyway, because a funder-facing report that silently omits
// money reads as evasion. Better to show the shape of the disclosure with every
// number visibly marked than to leave the section out and be asked why.
//
// When the real accounts arrive this becomes a single-file edit of
// data/report-data.typ. Nothing here needs to change.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": chart-card, source-note, stat-card
#import "../lib/charts.typ": bar-stacked
#import "../lib/metrics.typ": commas
#import "../data/report-data.typ": D
#import "../data/copy.typ": outlook-copy

#let outlook-page() = sheet(title: "Funding and resourcing")[
  #block(above: 0pt, below: gap-block, width: 100%)[
    #box(
      width: 100%,
      fill: rgb("#fff6e0"),
      stroke: (left: 2.5pt + rgb("#b26a00")),
      radius: (right: radius-card),
      inset: (x: 5mm, y: 4mm),
      {
        block(above: 0pt, below: gap-line, text(
          font: body-font, size: size-micro, weight: 700, tracking: 0.10em,
          fill: rgb("#b26a00"), upper("Not yet reconciled"),
        ))
        block(above: 0pt, below: 0pt, {
          set par(leading: 0.62em)
          text(font: body-font, size: size-meta, fill: ink-700)[
            Every figure on this page is a placeholder. She Sharp's income and
            expenditure for the half-year sit in accounting records held outside
            this reporting system, and had not been reconciled when this draft
            was produced. The page shows the shape of the disclosure, not the
            result. Each unverified number is marked in amber throughout.
          ]
        })
      },
    )
  ]

  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-body, justify: true)
    #text(size: size-body, fill: ink-700, outlook-copy)
  ]

  #block(above: 0pt, below: gap-section, width: 100%)[
    #grid(
      columns: (1fr, 1fr, 1fr),
      column-gutter: gutter-card,
      // Thousands separators via `commas`, not a bare `"$" + str(v)`. Money
      // without them renders "$148500", which a funder reads as carelessness
      // before they read it as a number.
      stat-card(D.finance.total-income, "Total income",
        fmt: v => "$" + commas(v)),
      stat-card(D.finance.total-expenditure, "Total expenditure",
        fmt: v => "$" + commas(v)),
      stat-card(D.finance.volunteer-hours, "Volunteer hours",
        fmt: v => commas(v)),
    )
  ]

  #chart-card(
    "Where the money went",
    bar-stacked((
      ("Programme delivery", D.finance.programme-delivery),
      ("Events and venues", D.finance.events-and-venues),
      ("Platform and tools", D.finance.platform-and-tools),
      ("Administration", D.finance.administration),
    ), fmt: v => "$" + commas(v)),
    note: [Placeholder allocation. The proportions shown are illustrative of the
      reporting format and are not this organisation's actual expenditure.],
  )

  #source-note[
    She Sharp is a registered charitable entity and files annual financial
    statements with Charities Services. Audited figures for the year will be
    published there; this half-year page is management reporting and is not a
    substitute for them.
  ]
]
