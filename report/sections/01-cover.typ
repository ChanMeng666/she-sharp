// Page 1 — cover.
//
// The 2025 report's cover is the year set enormous in brand purple on the pale
// canvas, with the She# roundel beneath. This one keeps that structure but sets
// it over a full-bleed photograph, so the first thing a reader sees is the
// people rather than a colour field.
//
// Built from `plate` primitives directly rather than by calling `plate(title:)`:
// the cover's stack is year / rule / title / period / roundel, centred, which is
// not the bottom-left kicker+title arrangement `plate` composes.

#import "../theme/theme.typ": *
#import "../lib/metrics.typ": bg
#import "../lib/assets.typ": photo, brand-logo
#import "../data/report-data.typ": org-name, report-title, report-subtitle

#let cover() = page(
  fill: canvas,
  margin: 0pt,
  header: none,
  footer: none,
  numbering: none,
  background: bg(under: {
    image(photo("cover-plate"), width: 100%, height: 100%, fit: "cover")
    // Two scrims, not one. A single top-to-bottom gradient either leaves the
    // year unreadable or flattens the whole photograph; this darkens the top
    // third behind the year and the bottom behind the imprint, and leaves the
    // middle of the picture alone.
    place(top + left, rect(
      width: 100%, height: 54%, stroke: none,
      fill: gradient.linear(ink.transparentize(8%), ink.transparentize(100%), angle: 90deg),
    ))
    place(bottom + left, rect(
      width: 100%, height: 40%, stroke: none,
      fill: gradient.linear(ink.transparentize(100%), ink.transparentize(18%), angle: 90deg),
    ))
  }),
  {
    place(top + left, dy: 26mm, dx: page-margin, block(width: 100% - 2 * page-margin, {
      // Each line is its own block — RULE 2. A `linebreak()` here followed by
      // `v()` would silently collapse to zero and glue the year to the title.
      block(above: 0pt, below: 2mm, width: 100%, {
        text(
          font: display, size: size-year, weight: display-weight,
          stretch: display-stretch, tracking: -0.01em, fill: white, "2026",
        )
      })
      block(above: 0pt, below: 5mm, width: 100%, {
        line(length: 46mm, stroke: 2.4pt + white)
      })
      block(above: 0pt, below: 3mm, width: 100%, {
        text(
          font: display, size: size-page, weight: display-weight,
          stretch: display-stretch, tracking: 0.02em, fill: white,
          upper(report-title),
        )
      })
      block(above: 0pt, below: 0pt, width: 100%, {
        text(
          font: body-font, size: size-lede, weight: 500,
          tracking: 0.10em, fill: white.transparentize(10%),
          upper(report-subtitle),
        )
      })
    }))

    // Imprint foot: roundel beside the organisation name.
    place(bottom + left, dx: page-margin, dy: -page-margin, {
      grid(
        columns: (auto, auto),
        column-gutter: 5mm,
        align: (horizon, horizon),
        box(width: 20mm, height: 20mm, radius: 50%, clip: true,
          image(brand-logo("she-sharp-logo-purple-dark-500x500.png"),
            width: 100%, height: 100%, fit: "contain")),
        {
          block(above: 0pt, below: 1.5mm, {
            text(font: display, size: 17pt, weight: display-weight,
              stretch: display-stretch, fill: white, upper(org-name))
          })
          block(above: 0pt, below: 0pt, {
            text(font: body-font, size: size-meta, weight: 500,
              tracking: 0.08em, fill: white.transparentize(20%),
              upper("Bridging the gender gap in STEM"))
          })
        },
      )
    })
  },
)
