// Page 1 — cover. A flat indigo plate, deliberately not a photograph.
//
// The funder report opens on a room full of people, because its job is to show
// who She Sharp reaches. This one opens on a colour field, because its job is
// to show what the organisation can and cannot prove about that. A photograph
// here would be decoration standing in front of the argument.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": plate

#let D = json("/report-internal/data/record.json")

#let cover() = plate(tint: indigo)[
  #place(top + left, dy: 30mm, block(width: 100% - 2 * page-margin, {
    block(above: 0pt, below: 4mm, width: 100%, text(
      font: body-font, size: size-meta, weight: 600, tracking: 0.22em,
      fill: white.transparentize(30%), upper("She Sharp · internal"),
    ))
    block(above: 0pt, below: 6mm, width: 100%, text(
      font: display, size: 46pt, weight: display-weight,
      stretch: display-stretch, tracking: -0.01em, fill: white,
      "The record so far",
    ))
    block(above: 0pt, below: 5mm, width: 100%, line(length: 46mm, stroke: 2.4pt + white))
    block(above: 0pt, below: 0pt, width: 100%, {
      set par(leading: lead-lede)
      text(font: body-font, size: size-lede, weight: 500, fill: white.transparentize(12%),
        "Everything the systems have counted, from the first record in 2019 to today — including the parts we do not publish.")
    })
  }))

  #place(bottom + left, dy: -18mm, block(width: 100% - 2 * page-margin, {
    block(above: 0pt, below: 3mm, width: 100%, {
      set par(leading: 0.70em)
      text(font: body-font, size: size-meta, fill: white.transparentize(25%))[
        Generated from the ticketing archive, the mailing audience and the
        public charities register. Ticketing export
        #D.metadata.humanitixExport, audience export #D.metadata.mailchimpExport,
        filed returns read #D.metadata.filedReturnsReadAt.
      ]
    })
    block(above: 0pt, below: 0pt, width: 100%, text(
      font: body-font, size: size-source, weight: 600, tracking: 0.14em,
      fill: white.transparentize(40%), upper("Not for circulation"),
    ))
  }))
]
