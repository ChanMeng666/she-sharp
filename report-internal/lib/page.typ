// Page furniture for the internal record report.
//
// The funder report's `sheet()` routes its background through `bg()` in
// report/lib/metrics.typ, which stamps a DRAFT ribbon reading "contains
// placeholder data". Neither half of that is true here: this report has no
// placeholders, and it is not a draft of anything — it is finished, and the
// reason it must not circulate is the opposite one. It says things about the
// organisation that are true and that nobody has decided how to say publicly.
//
// So this file re-composes `page()` from the same parts — `notch`, `folio` and
// the shared theme — and swaps the mark. Everything visual is inherited, so the
// two documents read as one house; only the stamp differs.

#import "/report/theme/theme.typ": *
#import "/report/lib/layout.typ": folio, notch

// The mark, on every page including the plates. Deliberately the same
// construction as the funder report's draft ribbon — a chip at the page edge
// rather than a diagonal wash — because a wash over a chart makes the chart
// unreadable, and the whole point of this document is that the charts can be
// read.
#let internal-mark = place(
  top + right,
  dy: 13mm,
  box(
    fill: white.transparentize(10%),
    radius: (left: 3pt),
    inset: (x: 4mm, y: 1.6mm),
    text(
      font: display,
      size: 7.5pt,
      weight: 700,
      stretch: 75%,
      tracking: 0.18em,
      fill: indigo,
      "INTERNAL",
    ),
  ),
)

#let internal-strapline = place(
  bottom + left,
  dx: page-margin,
  dy: -6.5mm,
  box(
    fill: white.transparentize(18%),
    radius: 2pt,
    inset: (x: 2mm, y: 1mm),
    text(
      font: body-font,
      size: 6.5pt,
      fill: indigo,
      tracking: 0.04em,
      "internal · the record as the systems hold it · not for circulation",
    ),
  ),
)

#let bg(under: none) = {
  if under != none { under }
  internal-mark
  internal-strapline
}

#let sheet(body, title: none, number: true) = page(
  fill: canvas,
  margin: page-margin,
  header: none,
  footer: if number { folio() } else { none },
  footer-descent: 7mm,
  background: bg(),
  {
    if title != none { notch(title) }
    body
  },
)

// A flat colour plate, for the cover and the closing page. No photograph:
// this document is about what was counted, and a photograph on it would be
// decoration standing in front of that.
#let plate(body, tint: indigo) = page(
  fill: tint,
  margin: page-margin,
  header: none,
  footer: none,
  numbering: none,
  background: bg(),
  body,
)

// ─── Small components this report needs and the funder report does not ──────

// A finding, stated once, in the voice this document uses: the number first,
// then the sentence that says what it means, then the sentence that says what
// it does not mean. The third line is the one that keeps this honest.
#let finding(value, claim, caveat: none, hue: brand, height: auto) = block(
  above: 0pt, below: 0pt, width: 100%, breakable: false,
  box(
    width: 100%,
    height: height,
    fill: card,
    radius: radius-card,
    inset: (x: 6mm, y: 5.5mm),
    {
      block(above: 0pt, below: 1.5mm, width: 100%, text(
        font: display, size: 27pt, weight: display-weight,
        stretch: display-stretch, fill: hue, value,
      ))
      block(above: 0pt, below: if caveat != none { 1.8mm } else { 0pt }, width: 100%, {
        set par(leading: lead-body)
        text(font: body-font, size: size-meta, weight: 500, fill: ink, claim)
      })
      if caveat != none {
        block(above: 0pt, below: 0pt, width: 100%, {
          set par(leading: 0.62em)
          text(font: body-font, size: size-source, fill: ink-500, caveat)
        })
      }
    },
  ),
)

// The band that introduces a chart: what it plots, in one line, so the reader
// never has to infer the units from the axis.
#let chart-lede(body) = block(above: 0pt, below: gap-line, width: 100%, {
  set par(leading: lead-body)
  text(font: body-font, size: size-meta, fill: ink-700, body)
})

// A note under a chart. Same role as the funder report's `source-note`, but it
// carries what the chart cannot show rather than where the number came from —
// provenance for this document lives in one table on the methods page.
#let reading(body) = block(above: gap-line, below: 0pt, width: 100%, {
  set par(leading: 0.66em)
  text(font: body-font, size: size-source, fill: ink-500, body)
})
