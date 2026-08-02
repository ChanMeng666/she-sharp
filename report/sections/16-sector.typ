// Page 25 — the sector this work sits in.
//
// The only page whose numbers come from OUTSIDE She Sharp, and the only page
// where every figure carries a named third-party source on the page itself.
//
// THE 29% BAR STANDS ALONE, ON A 0-100 TRACK, BY DESIGN. It is the single
// gender-share percentage in the whole verified fact pool — there is no second
// share of the same population, no before/after, and no NZ-vs-Auckland split of
// it. Manufacturing a partner bar (a "71% not women" complement, or a 50%
// benchmark no source states) would be inventing the comparison. The empty track
// to its right IS the comparison, and it asserts nothing.
//
// The three Auckland bars DO share an axis: each is a percentage of a New
// Zealand total across the same geography. They earn a place in a gender-gap
// report by answering the geography question — every event here was in Auckland.
//
// What is NOT on a bar, and why, is documented at each block in data/sources.typ:
// the pay gap is a DIFFERENCE not a share; the immigration figure is a share of
// a different whole; tech workers and export dollars are counts with no
// denominator.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": chart-card, eyebrow
#import "../lib/charts.typ": comparison-bars
#import "../lib/metrics.typ": num, commas
#import "../data/copy.typ": sector-intro
#import "../data/sources.typ": sector-gap, sector-metrics, sector-stats

#let sector-page() = sheet(title: "The gap we work on")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700, sector-intro)
  ]

  #chart-card(
    "Women's share of professional IT roles in New Zealand",
    comparison-bars(sector-gap, max: 100),
    note: [The source says "around 29%". The remaining track is not a second
      measurement — it is simply the rest of the workforce, shown so the one
      sourced figure is read at its true scale.],
  )

  #chart-card(
    "Auckland's share of the national tech economy",
    comparison-bars(sector-metrics, max: 100),
    note: [Three percentages of a New Zealand total, measured across the same
      geography. Every event in this report was held in Tāmaki Makaurau.],
  )

  #block(above: 0pt, below: gap-line, width: 100%)[
    #eyebrow("Also on the record", fill: ink-500)
  ]

  #block(above: 0pt, below: gap-section, width: 100%)[
    #grid(
      columns: (1fr, 1fr),
      column-gutter: gutter-card,
      row-gutter: 4mm,
      ..sector-stats.map(s => block(above: 0pt, below: 0pt, breakable: false, {
        // `unit` is plain metadata, not a formatter — data/ must never import
        // lib/. The section owns the rendering. "count" gets thousands
        // separators; "$b" is published in NZD billions and keeps one decimal.
        block(above: 0pt, below: 2pt, text(
          font: display, size: 17pt, weight: display-weight,
          stretch: display-stretch, fill: brand,
          num(s.metric, fmt: v => {
            if s.unit == "%" { str(v) + "%" }
            else if s.unit == "count" { commas(v) }
            else if s.unit == "$b" { "$" + str(v) + "b" }
            else { str(v) }
          }),
        ))
        // gap-caption, not 1.5pt. Three of these four labels wrap to two lines,
        // and at 1.5pt the source line below printed into the second line's
        // descenders — "…the lowest on record" and "Stats NZ" overlapped
        // outright. Visible only in a render.
        block(above: 0pt, below: gap-caption, {
          set par(leading: 0.60em)
          text(font: body-font, size: size-meta, fill: ink-700, s.label)
        })
        block(above: 0pt, below: 0pt, text(
          font: body-font, size: size-source, fill: ink-500, s.source,
        ))
      }))
    )
  ]

  // NO PULL-QUOTE AND NO CLOSING SOURCE NOTE HERE, both removed deliberately.
  //
  // The quote card printed `sector-quotes.first()` — "fewer than 1 in 20 Kiwi
  // girls consider a high-paid STEM career, versus 1 in 5 boys" — which
  // `sector-intro` ALREADY states in its second paragraph, in almost the same
  // words. Set one above the other it read as a stutter, and it pushed itself
  // onto a page of its own. The prose keeps it, because the intro is where a
  // reader meets it first.
  //
  // The source note went for the same reason plus a better one: every bar on
  // this page already prints its own citation directly beneath it, and the
  // methodology page carries the full source list.
]
