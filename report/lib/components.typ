// Report components.
//
// Conventions every component in this file obeys:
//  · RULE 1 — every block sets `above: 0pt` and owns its gap in `below:`.
//  · RULE 2 — stacked visual lines are separate blocks, never
//             `linebreak()` + `v()`.
//  · RULE 3 — every `set list(spacing:)` carries its calibrated ratio comment.
//  · RULE 4 — cards that must not be split across pages are `breakable: false`.
// See report/PITFALLS.md.

#import "../theme/theme.typ": *
#import "metrics.typ": num
#import "assets.typ": brand-logo

// ─── Small parts ────────────────────────────────────────────────────────────

// A tracked uppercase micro-label. Used above a card or a chart to name it
// without spending a heading level.
//
// NOTE the missing `above:` — deliberate, and the one documented exception to
// RULE 1. `eyebrow` is routinely written straight after a markup paragraph, and
// an explicit `above:` (even 0pt) beats a paragraph's `par.spacing` outright
// rather than max()-ing with it, which collides the two. Leaving it unset lets
// the prose own the gap, which is what RULE 1 wants anyway. See RULE 1b in
// report/PITFALLS.md.
#let eyebrow(label, fill: brand) = block(below: gap-line, {
  text(
    font: body-font,
    size: size-micro,
    weight: 600,
    tracking: 0.18em,
    fill: fill,
    upper(label),
  )
})

// An inline chip. Default is the pale-purple wash; pass `fill`/`ink-color` for
// mint or periwinkle variants.
#let pill(label, fill: brand-pale, ink-color: brand) = box(
  fill: fill,
  radius: 999pt,
  inset: (x: 6pt, y: 2.5pt),
  outset: (y: 1pt),
  text(font: body-font, size: size-micro, weight: 600, fill: ink-color, label),
)

// Provenance / footnote line under a chart or table. `body` may be a list.
//
// `above:` is deliberately unset — same RULE 1b exception as `eyebrow` above.
// With `above: 0pt` this component printed ON TOP of the last line of the
// paragraph it followed, because an explicit block margin overrides a
// paragraph's `par.spacing` instead of max()-ing against it.
#let source-note(body) = block(below: 0pt, {
  set par(leading: lead-source, justify: false)
  set text(font: body-font, size: size-source, fill: ink-500)
  // source citations: 6.8pt × 0.62em = 4.22pt within · 7.5pt between = 1.78×
  set list(tight: false, spacing: 7.5pt, indent: 0pt, body-indent: 5pt,
    marker: text(fill: ink-300)[•])
  body
})

// ─── Stat row — the 2025 report's signature full-width figure ───────────────
// A white card carrying a purple stadium pill with a big white numeral on the
// left and a purple uppercase label on the right.
//
// `breakable: false` (RULE 4): a split would strand the label on the next page
// with no number, or a bare pill with no label — both read as a layout fault
// rather than as a figure.
#let stat-row(m, label, fmt: v => str(v), pill-width: 46mm) = block(
  above: 0pt,
  below: gap-block,
  breakable: false,
  width: 100%,
  {
    box(
      width: 100%,
      fill: card,
      radius: radius-card,
      inset: (x: 6mm, y: 5mm),
      grid(
        columns: (pill-width, 1fr),
        column-gutter: 9mm,
        align: (horizon, horizon + left),
        // The pill. `radius: 999pt` clamps to a stadium at any height.
        box(
          width: 100%,
          fill: brand,
          radius: 999pt,
          inset: (x: 4mm, y: 3.2mm),
          align(
            center,
            text(
              font: display,
              size: size-stat,
              weight: display-weight,
              stretch: display-stretch,
              fill: on-brand,
              num(m, fmt: fmt),
            ),
          ),
        ),
        {
          set par(leading: 0.72em, justify: false)
          text(
            font: body-font,
            size: size-h2,
            weight: 500,
            tracking: 0.05em,
            fill: brand,
            upper(label),
          )
        },
      ),
    )
  },
)

// ─── Stat card — compact, for a 4-up row ────────────────────────────────────
// Label block FIRST, then the value block, matching the 2025 event pages. Two
// separate blocks, not one paragraph with a linebreak (RULE 2) — the gap
// between a label and its figure is the thing that makes the pair read as one
// unit, and a weak `v()` there renders as zero.
// `height` is an EXPLICIT length, and `v(1fr)` inside pushes the figure to the
// card's foot. Both matter for a 4-up row:
//
//  · Without a shared height, each card shrinks to its own content, so a label
//    that wraps to two lines ("REGISTERED ATTENDEES") makes its card taller than
//    its neighbours and the four figures sit at four different heights — the row
//    stops scanning as a set.
//  · It must NOT be `height: 100%`. A percentage resolves against the parent,
//    and in an auto-sized grid row the parent height is not yet known, so it
//    resolves to zero: the cards do not merely misalign, they VANISH and the
//    page renders blank with no warning. Measured, not theorised.
//
// Raise `height` if a label needs three lines.
#let stat-card(m, label, fmt: v => str(v), fill: card, ink-color: brand, height: 26mm) = block(
  above: 0pt,
  below: 0pt,
  breakable: false,
  width: 100%,
  {
    box(
      width: 100%,
      height: height,
      fill: fill,
      radius: radius-card,
      inset: (x: 5mm, y: 4.5mm),
      {
        block(above: 0pt, below: gap-line, width: 100%, {
          set par(leading: 0.70em, justify: false)
          text(
            font: body-font,
            size: size-micro,
            weight: 700,
            tracking: 0.08em,
            fill: ink-color,
            upper(label),
          )
        })
        v(1fr)
        block(above: 0pt, below: 0pt, width: 100%, {
          text(
            font: display,
            size: size-stat,
            weight: display-weight,
            stretch: display-stretch,
            fill: ink,
            num(m, fmt: fmt),
          )
        })
      },
    )
  },
)

// ─── Portrait ───────────────────────────────────────────────────────────────
// Circular, clipped, thick purple ring; name on two lines; role beneath.
//
// The name is split across two EXPLICIT arguments rather than wrapped
// automatically, because a wrapped name breaks at whatever point the column
// happens to be wide enough for — "Prasanth / Pavithran" one row and "Prasanth
// Pavith- / ran" the next. The caller decides where a person's name breaks.
//
// Four separate blocks (RULE 2), so each caption line's gap is real.
#let portrait(file, name-1, name-2, role: none, size: 27mm, ring: 2.6pt) = block(
  above: 0pt,
  below: 0pt,
  breakable: false,
  width: 100%,
  {
    block(above: 0pt, below: gap-caption + 2pt, width: 100%, align(center, {
      box(
        width: size,
        height: size,
        radius: 50%,
        clip: true,
        stroke: ring + brand,
        image(file, width: 100%, height: 100%, fit: "cover"),
      )
    }))
    // 3pt, not 1pt: the two name lines are separate BLOCKS, so no leading binds
    // them and at 1.5pt the descender of line 1 sat on the cap of line 2.
    block(above: 0pt, below: 3pt, width: 100%, align(center, {
      text(font: body-font, size: size-meta, weight: 500, fill: ink, name-1)
    }))
    block(above: 0pt, below: if role == none { 0pt } else { gap-caption }, width: 100%, align(center, {
      text(font: body-font, size: size-meta, weight: 500, fill: ink, name-2)
    }))
    if role != none {
      block(above: 0pt, below: 0pt, width: 100%, align(center, {
        set par(leading: 0.62em, justify: false)
        text(font: body-font, size: size-source, fill: ink-500, role)
      }))
    }
  },
)

// ─── Logo lockup — the event-page header ────────────────────────────────────
// She Sharp's round mark beside the partner's, in a white card that bleeds off
// the LEFT page edge exactly like `notch()`. Same reason `place` is used: a
// grid cell cannot leave the content area, and column `align:` only positions
// content INSIDE a cell.
//
// `right-label` is the 2025 report's date line, set flush right on the canvas
// beside the card.
//
// `partner-logo` accepts a single path OR an array of paths — three of the nine
// H1 events were backed by two or three organisations, and the alternative
// (rendering only the first) would drop the Ministry of Education from a page
// about a Ministry-of-Education-funded workshop.
#let logo-lockup(partner-logo, right-label: none, height: 21mm, rule: brand) = block(
  above: 0pt,
  below: gap-page-title,
  width: 100%,
  height: height,
  {
    place(left + horizon, line(length: 100% + page-margin, stroke: 1.1pt + rule))
    if right-label != none {
      place(right + horizon, dy: -6mm, text(
        font: body-font,
        size: size-h2,
        weight: 500,
        tracking: 0.10em,
        fill: brand,
        upper(right-label),
      ))
    }
    place(
      top + left,
      dx: -page-margin,
      box(
        fill: card,
        radius: (left: 0pt, right: radius-notch),
        height: height,
        inset: (left: page-margin + 2mm, right: 11mm, y: 3.5mm),
        align(horizon, {
          box(
            width: height - 7mm,
            height: height - 7mm,
            radius: 50%,
            clip: true,
            image(brand-logo("she-sharp-logo-purple-dark-500x500.png"), width: 100%, height: 100%, fit: "contain"),
          )
          if partner-logo != none {
            let marks = if type(partner-logo) == array { partner-logo } else { (partner-logo,) }
            // Each mark gets the SAME height box, so a wordmark and a roundel
            // carry equal optical weight in the lockup — same reasoning as
            // `logo-wall`'s uniform slot.
            for m in marks {
              h(7mm)
              box(height: height - 9mm, image(m, height: 100%, fit: "contain"))
            }
          }
        }),
      ),
    )
  },
)

// ─── Logo wall ──────────────────────────────────────────────────────────────
// A named sponsor tier as a grid of UNIFORM optical slots. Every mark gets the
// same `slot` box and is fitted with `fit: "contain"`, so a wide wordmark and a
// square roundel carry the same visual weight — without that, whichever logo
// has the least whitespace in its own artboard dominates the wall.
//
// `entries` accepts a path string, or a dict:
//   (file: …, name: "caption under the mark", scale: 0.85)
//
// `scale` is the optical-balance escape hatch, and it WILL be needed. A uniform
// slot equalises bounding boxes, not perceived mass: a mark drawn tight to its
// own artboard edges (Xero) reads far bigger than one with generous built-in
// padding (MYOB) at the identical slot size. Nothing but a per-logo multiplier
// fixes that, because the padding lives inside the vendor's file. Set it by eye
// against the wall's optically largest mark.
#let logo-wall(tier-name, tier-color, entries, cols: 4, slot: 30pt) = block(
  above: 0pt,
  below: gap-block,
  breakable: false,
  width: 100%,
  {
    if tier-name != none {
      block(above: 0pt, below: gap-line + 2pt, width: 100%, {
        text(
          font: body-font,
          size: size-micro,
          weight: 700,
          tracking: 0.18em,
          fill: tier-color,
          upper(tier-name),
        )
      })
    }
    block(above: 0pt, below: 0pt, width: 100%, {
      grid(
        columns: (1fr,) * cols,
        column-gutter: gutter-card,
        row-gutter: 6mm,
        ..entries.map(e => {
          let file = if type(e) == dictionary { e.file } else { e }
          let name = if type(e) == dictionary and "name" in e { e.name } else { none }
          let mul = if type(e) == dictionary and "scale" in e { e.scale } else { 1.0 }
          align(center + horizon, {
            block(above: 0pt, below: if name == none { 0pt } else { gap-caption }, {
              // Outer box holds the row height steady; the inner box is what
              // `scale` shrinks, so nudging one mark never shifts its neighbours.
              box(width: 100%, height: slot, align(center + horizon,
                box(
                  width: 100% * mul,
                  height: slot * mul,
                  image(file, width: 100%, height: 100%, fit: "contain"),
                )))
            })
            if name != none {
              block(above: 0pt, below: 0pt, {
                text(font: body-font, size: size-source, fill: ink-500, name)
              })
            }
          })
        })
      )
    })
  },
)

// ─── Quote card ─────────────────────────────────────────────────────────────
// `breakable: false` (RULE 4): a split orphans the attribution line at the top
// of the next page with nothing above it, which reads as a stray fragment.
#let quote-card(body, source, fill: mint, ink-color: on-mint, accent: brand) = block(
  above: 0pt,
  below: gap-block,
  breakable: false,
  width: 100%,
  {
    box(
      width: 100%,
      fill: fill,
      radius: radius-card,
      inset: (x: 7mm, y: 6mm),
      {
        block(above: 0pt, below: gap-para, width: 100%, {
          set par(leading: 0.70em, justify: false)
          text(font: display, size: 15pt, weight: 400, stretch: 90%, fill: ink-color, body)
        })
        block(above: 0pt, below: 0pt, width: 100%, {
          text(font: body-font, size: size-meta, weight: 600, tracking: 0.04em, fill: accent, source)
        })
      },
    )
  },
)

// ─── Company table ──────────────────────────────────────────────────────────
// The 2025 report's "registered attendees by company" block: many short
// name/count pairs packed into several column-pairs on a white card.
//
// `rows` is an array of `(name, count)` arrays or `(name: …, count: …)` dicts.
// The count is normally a METRIC DICT and is rendered through `num()`, so a
// placeholder headcount carries its amber marker here exactly as it would in a
// stat card. Every organisation count in this report is currently a placeholder
// — the booking process does not collect employer — so without this the single
// densest block of numbers on each event page would be the one place a reader
// could mistake invention for measurement. A bare number is still accepted, for
// a caller that genuinely has a literal.
#let company-table(rows, cols: 4, title: none) = block(
  above: 0pt,
  below: gap-block,
  breakable: false,
  width: 100%,
  {
    box(
      width: 100%,
      fill: card,
      radius: radius-card,
      inset: (x: 5mm, y: 4.5mm),
      {
        if title != none {
          block(above: 0pt, below: gap-para, width: 100%, align(center, {
            text(font: body-font, size: size-micro, weight: 700, tracking: 0.10em,
              fill: brand, upper(title))
          }))
        }
        let cells = rows.map(r => {
          let name = if type(r) == dictionary { r.name } else { r.at(0) }
          let count = if type(r) == dictionary { r.count } else { r.at(1) }
          (
            text(font: body-font, size: size-source, fill: ink-700, name),
            text(font: body-font, size: size-source, weight: 600, fill: ink,
              if type(count) == dictionary { num(count) } else { str(count) }),
          )
        })
        // `per` splits the list COLUMN-major, so each column-pair reads top to
        // bottom like the 2025 report, rather than snaking across the page.
        let per = calc.ceil(cells.len() / cols)
        grid(
          columns: (1fr,) * cols,
          column-gutter: 5mm,
          ..range(cols).map(c => {
            let slice = cells.slice(
              calc.min(c * per, cells.len()),
              calc.min((c + 1) * per, cells.len()),
            )
            grid(
              columns: (1fr, auto),
              column-gutter: 2mm,
              row-gutter: 3.2pt,
              ..slice.flatten()
            )
          })
        )
      },
    )
  },
)

// ─── Chart card ─────────────────────────────────────────────────────────────
// A white card wrapping a chart body from report/lib/charts*.typ, with an
// optional caption underneath. `breakable: false` — a chart split across a page
// boundary is unreadable.
#let chart-card(title, body, note: none, fill: card, ink-color: brand) = block(
  above: 0pt,
  below: gap-block,
  breakable: false,
  width: 100%,
  {
    box(
      width: 100%,
      fill: fill,
      radius: radius-card,
      inset: (x: 5mm, y: 4.5mm),
      {
        if title != none {
          block(above: 0pt, below: gap-para, width: 100%, {
            text(font: body-font, size: size-micro, weight: 700, tracking: 0.10em,
              fill: ink-color, upper(title))
          })
        }
        // `source-note` has no explicit `above:` (RULE 1b), so this `below:` is
        // the sole owner of the chart-to-caption gap. Keep it a named token.
        block(above: 0pt, below: if note == none { 0pt } else { gap-para }, width: 100%, body)
        if note != none { source-note(note) }
      },
    )
  },
)

// ─── Compact list preset ────────────────────────────────────────────────────
// For lists inside a card, where the body size is already reduced.
#let compact-list(body, marker-color: brand) = block(above: 0pt, below: 0pt, {
  set par(leading: 0.60em, justify: false)
  set text(font: body-font, size: 8pt, fill: ink-700)
  // compact lists: 8pt × 0.60em = 4.80pt within · 8.5pt between = 1.77×
  set list(tight: false, spacing: 8.5pt, indent: 0pt, body-indent: 6pt,
    marker: text(fill: marker-color)[•])
  body
})
