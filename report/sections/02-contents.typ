// Page 2 — contents.
//
// The 2025 report's contents page is a stack of two-tone numbered bands: a
// saturated block carrying a big chapter numeral, butted against a paler block
// carrying the entries. This reproduces that.
//
// The two-tone band is built with the grid's own `fill:` callback, NOT with a
// coloured `rect`/`box` inside each cell. A nested box cannot know the row's
// height while the row is still auto-sizing — `height: 100%` there resolves
// against an unknown parent and collapses to zero (RULE 4b in PITFALLS.md).
// `grid.fill` paints the whole cell, including whatever height the row settles
// at, so the numeral block and the entry block always stand exactly as tall as
// each other however many entries a band carries.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet, notch
#import "../data/report-data.typ": period

#let _entry(title, page-no) = (
  {
    set par(leading: lead-meta, justify: false)
    text(font: body-font, size: size-meta, weight: 500, fill: ink, title)
  },
  text(font: display, size: size-meta + 1pt, weight: 700, stretch: 85%, fill: brand, page-no),
)

// One band. `entries` is an array of (title, page-number-string).
#let _band(number, title, entries, accent: peri, pale: peri-pale, on-accent-ink: white) = block(
  above: 0pt,
  below: 12pt,
  width: 100%,
  breakable: false,
  {
    grid(
      columns: (30mm, 1fr),
      rows: (auto,),
      fill: (x, _) => if x == 0 { accent } else { pale },
      inset: (x: 6mm, y: 5mm),
      align: (center + horizon, left + horizon),
      text(
        font: display, size: 30pt, weight: display-weight,
        stretch: display-stretch, fill: on-accent-ink, number,
      ),
      {
        block(above: 0pt, below: gap-line + 1pt, width: 100%, {
          text(
            font: display, size: 14pt, weight: display-weight,
            stretch: display-stretch, tracking: 0.02em, fill: brand, upper(title),
          )
        })
        block(above: 0pt, below: 0pt, width: 100%, {
          grid(
            columns: (1fr, auto),
            column-gutter: 4mm,
            // entry rows: 8pt × 0.60em = 4.80pt within · 8.5pt between = 1.77×
            row-gutter: 8.5pt,
            ..entries.map(e => _entry(e.at(0), e.at(1))).flatten()
          )
        })
      },
    )
  },
)

#let contents() = sheet(title: "Contents")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #text(font: body-font, size: size-meta, weight: 500, tracking: 0.10em,
      fill: ink-500, upper(period))
  ]

  #_band("01", "The half-year", (
    ("A word from the founder", "3"),
    ("H1 2026 at a glance", "5"),
    ("The team", "6"),
  ), accent: peri, pale: peri-pale)

  #_band("02", "HER WAKA", (
    ("An employment programme, not an event series", "7"),
    ("How the four cohorts ran", "8"),
    ("Cohorts one to four", "10"),
  ), accent: brand, pale: brand-pale)

  #_band("03", "Youth Tech Series", (
    ("Starting at the other end of the pipeline", "14"),
    ("Two Saturdays at Fruitvale Primary", "15"),
  ), accent: mint, pale: mint-pale, on-accent-ink: ink)

  // TWO SHIFTS ARE BAKED INTO THE FOLIOS BELOW, and both are recorded here
  // because a contents page that disagrees with its own folios is the fastest
  // way to make a reader distrust the rest.
  //
  //  · everything from band 04 down moved DOWN ONE when the two Youth Tech
  //    workshop pages were merged into a single spread;
  //  · everything from band 06 down moved down one AGAIN on 2026-08-24, when
  //    "Who was in the room" was inserted at page 24 to close the community
  //    chapter. Band 05 gained the entry; band 06 only moved.
  //
  // The page map lives in she-sharp-h1-2026.typ, where every section is one
  // scoped `page()` call and the call order IS the folio order. Check against it,
  // not against a render, when either changes.
  #_band("04", "Community evenings", (
    ("Three nights, open to anyone", "16"),
    ("International Women's Day, Own Your Energy, LinkedIn", "17"),
  ), accent: indigo, pale: peri-pale)

  #_band("05", "Platform and partners", (
    ("The mentorship platform", "20"),
    ("How matching works", "21"),
    ("Partners and sponsors", "22"),
    ("Community voices", "23"),
    ("Who was in the room", "24"),
  ), accent: brand-mid, pale: brand-pale)

  #_band("06", "Context, outlook and method", (
    ("Where New Zealand actually is", "25"),
    ("Funding and resourcing", "26"),
    ("What is next for H2 2026", "27"),
    ("Thank you", "28"),
    ("Methodology and sources", "29"),
    ("Where each figure comes from", "30"),
  ), accent: peri, pale: peri-pale)
]
