// Time-series charts for the internal record report.
//
// `report/lib/charts.typ` draws horizontal bars, which is right for comparing a
// handful of named things on one page. Everything in this report is a YEAR
// SERIES — seven or eight points marching left to right — and a horizontal bar
// chart turns that into a stack the eye reads as a ranking rather than as time.
// So these are vertical columns, and they live here rather than in the funder
// report's lib because that report is stable and shipping and nothing in it
// needs them.
//
// EVERY COLUMN HEIGHT IS COMPUTED AGAINST A FIXED `height`, never against a
// percentage of an auto-sized parent. RULE 4b in report/PITFALLS.md: a
// percentage height inside an auto-height grid row resolves against an unknown
// and collapses to zero, which renders a blank page and exits 0. Passing a real
// length down is what makes these safe inside the same grids as everything else.

#import "/report/theme/theme.typ": *

// The plot area of every chart on a spread should be the same height, or the
// eye compares slopes that are not comparable.
#let plot-height = 46mm

#let _tick-label(body) = text(
  font: body-font, size: size-source, fill: ink-500, body,
)

#let _value-label(body, fill: ink) = text(
  font: body-font, size: size-source, weight: 600, fill: fill, body,
)

// ─── columns ────────────────────────────────────────────────────────────────
// One column per period. `rows` is an array of `(label, value)` pairs — plain
// numbers, not metric dicts, because this report's data comes out of a
// generated JSON file where every figure is counted by construction.
//
// `max` defaults to the largest value, so the tallest column fills the plot.
// Pass an explicit `max` when two charts on the same page must share a scale.
//
// `highlight` marks one label so a single period can be called out (the year a
// series turns, usually) without a legend.
#let columns(
  rows,
  max: none,
  height: plot-height,
  hue: brand,
  highlight: none,
  highlight-hue: flag-ink,
  fmt: v => str(v),
  gutter: 2.5mm,
) = block(above: 0pt, below: 0pt, breakable: false, width: 100%, {
  if rows.len() == 0 { return }
  let values = rows.map(r => r.at(1))
  let ceiling = if max != none { max } else { calc.max(..values) }
  grid(
    columns: (1fr,) * rows.len(),
    column-gutter: gutter,
    ..rows
      .map(r => {
        let label = r.at(0)
        let value = r.at(1)
        let on = highlight != none and label == highlight
        let ink-for = if on { highlight-hue } else { hue }
        // Three stacked blocks: value, plot, tick. The plot box owns a KNOWN
        // height, so the column inside it can be a real length.
        block(above: 0pt, below: 0pt, width: 100%, {
          block(above: 0pt, below: 1.6mm, width: 100%, align(center,
            _value-label(fmt(value), fill: ink-for)))
          block(above: 0pt, below: 1.6mm, width: 100%, box(
            width: 100%, height: height,
            place(bottom + center, rect(
              width: 100%,
              height: if ceiling == 0 { 0mm } else { height * (value / ceiling) },
              fill: ink-for,
              radius: (top: 2pt),
              stroke: none,
            )),
          ))
          block(above: 0pt, below: 0pt, width: 100%, align(center, _tick-label(label)))
        })
      })
  )
})

// ─── stacked columns ────────────────────────────────────────────────────────
// `rows` is `(label, (a, b))` — the two parts of one period, drawn bottom-up in
// the order given. Used for the only place a total needs splitting: how many of
// a year's people had been to a She Sharp event before.
#let columns-stacked(
  rows,
  max: none,
  height: plot-height,
  hues: (brand, peri),
  fmt: v => str(v),
  gutter: 2.5mm,
) = block(above: 0pt, below: 0pt, breakable: false, width: 100%, {
  if rows.len() == 0 { return }
  let totals = rows.map(r => r.at(1).fold(0, (a, b) => a + b))
  let ceiling = if max != none { max } else { calc.max(..totals) }
  grid(
    columns: (1fr,) * rows.len(),
    column-gutter: gutter,
    ..rows
      .map(r => {
        let label = r.at(0)
        let parts = r.at(1)
        let total = parts.fold(0, (a, b) => a + b)
        block(above: 0pt, below: 0pt, width: 100%, {
          block(above: 0pt, below: 1.6mm, width: 100%, align(center,
            _value-label(fmt(total))))
          block(above: 0pt, below: 1.6mm, width: 100%, box(
            width: 100%, height: height,
            {
              // Drawn from the bottom up, each segment offset by the ones below
              // it. `dy` is negative because `place(bottom)` measures upward.
              let below = 0
              for (i, part) in parts.enumerate() {
                let h = if ceiling == 0 { 0mm } else { height * (part / ceiling) }
                let off = if ceiling == 0 { 0mm } else { height * (below / ceiling) }
                place(bottom + center, dy: -off, rect(
                  width: 100%, height: h,
                  fill: hues.at(calc.rem(i, hues.len())),
                  radius: if i == parts.len() - 1 { (top: 2pt) } else { 0pt },
                  stroke: none,
                ))
                below = below + part
              }
            },
          ))
          block(above: 0pt, below: 0pt, width: 100%, align(center, _tick-label(label)))
        })
      })
  )
})

// ─── diverging columns ──────────────────────────────────────────────────────
// For a series that crosses zero. The zero line sits at a fixed fraction of the
// plot rather than at the data's own midpoint, so a single negative year does
// not rescale the whole chart around itself.
//
// This exists for exactly one series — the mailing list's net movement, which
// is positive for seven years and negative in the eighth — and the shape of it
// is the point being made.
#let columns-diverging(
  rows,
  height: plot-height,
  positive: brand,
  negative: flag-ink,
  fmt: v => str(v),
  gutter: 2.5mm,
) = block(above: 0pt, below: 0pt, breakable: false, width: 100%, {
  if rows.len() == 0 { return }
  let values = rows.map(r => r.at(1))
  let up = calc.max(0, ..values)
  let down = calc.abs(calc.min(0, ..values))
  let span = up + down
  if span == 0 { return }
  let zero-from-top = height * (up / span)
  grid(
    columns: (1fr,) * rows.len(),
    column-gutter: gutter,
    ..rows
      .map(r => {
        let label = r.at(0)
        let value = r.at(1)
        let neg = value < 0
        let h = height * (calc.abs(value) / span)
        block(above: 0pt, below: 0pt, width: 100%, {
          block(above: 0pt, below: 1.6mm, width: 100%, box(
            width: 100%, height: height,
            {
              // The zero rule spans the full column width so the row of them
              // reads as one axis.
              place(top + left, dy: zero-from-top, line(length: 100%, stroke: 0.5pt + hairline))
              if neg {
                place(top + left, dy: zero-from-top, rect(
                  width: 100%, height: h, fill: negative,
                  radius: (bottom: 2pt), stroke: none,
                ))
              } else {
                place(top + left, dy: zero-from-top - h, rect(
                  width: 100%, height: h, fill: positive,
                  radius: (top: 2pt), stroke: none,
                ))
              }
            },
          ))
          block(above: 0pt, below: 1.2mm, width: 100%, align(center,
            _value-label(fmt(value), fill: if neg { negative } else { ink })))
          block(above: 0pt, below: 0pt, width: 100%, align(center, _tick-label(label)))
        })
      })
  )
})

// ─── paired columns ─────────────────────────────────────────────────────────
// Two series side by side per period — income against expenditure. Deliberately
// not stacked: they are not parts of a whole, and stacking them would draw a
// total that means nothing.
#let columns-paired(
  rows,
  max: none,
  height: plot-height,
  hues: (brand, peri),
  fmt: v => str(v),
  gutter: 3mm,
) = block(above: 0pt, below: 0pt, breakable: false, width: 100%, {
  if rows.len() == 0 { return }
  let flat = rows.map(r => r.at(1)).flatten()
  let ceiling = if max != none { max } else { calc.max(..flat) }
  grid(
    columns: (1fr,) * rows.len(),
    column-gutter: gutter,
    ..rows
      .map(r => {
        let label = r.at(0)
        let parts = r.at(1)
        block(above: 0pt, below: 0pt, width: 100%, {
          block(above: 0pt, below: 1.6mm, width: 100%, box(
            width: 100%, height: height,
            grid(
              columns: (1fr,) * parts.len(),
              column-gutter: 1mm,
              ..parts
                .enumerate()
                .map(((i, p)) => box(width: 100%, height: height, place(
                  bottom + center,
                  rect(
                    width: 100%,
                    height: if ceiling == 0 { 0mm } else { height * (p / ceiling) },
                    fill: hues.at(calc.rem(i, hues.len())),
                    radius: (top: 2pt), stroke: none,
                  ),
                ))),
            ),
          ))
          block(above: 0pt, below: 0pt, width: 100%, align(center, _tick-label(label)))
        })
      })
  )
})

// ─── legend ─────────────────────────────────────────────────────────────────
#let key(items) = block(above: 0pt, below: 0pt, width: 100%, {
  grid(
    columns: (auto,) * (items.len() * 2),
    column-gutter: 2mm,
    align: horizon,
    ..items
      .map(it => (
        box(width: 7pt, height: 7pt, radius: 1.5pt, fill: it.at(1)),
        text(font: body-font, size: size-source, fill: ink-700, it.at(0)),
      ))
      .flatten()
  )
})
