// Page furniture.
//
// ════════════════════════════════════════════════════════════════════════════
//  EVERY section of this report is a scoped `#page(...)` ELEMENT-FUNCTION call
//  — never `set page(...)` followed by flowing content.
//
//  Why: with `set page`, content flows and the page count is emergent. A 2pt
//  spacing tweak on page 4 can silently push a line onto a new page and shunt
//  every later page along, and the compiler says nothing. With a scoped
//  `page()` call per section, the page count is STRUCTURAL: one call, one page.
//  A spacing change can then only overflow the single page it is on, where
//  `useFitContent`-style damage is visible immediately instead of 20 pages
//  later.
//
//  A section file therefore looks like:
//     #sheet(title: "2026 in a glance")[ …one page of content… ]
//  and never like:
//     #set page(fill: canvas)
//     = 2026 in a glance
// ════════════════════════════════════════════════════════════════════════════
//
// Gaps follow RULE 1 (below-side only) — see report/theme/theme.typ.

#import "../theme/theme.typ": *
#import "metrics.typ": bg

// ─── Page number ────────────────────────────────────────────────────────────
// Bold purple, bottom-right — the 2025 report's folio.
#let folio() = align(
  right,
  text(
    font: display,
    size: 13pt,
    weight: 800,
    stretch: 75%,
    fill: brand,
    context str(counter(page).at(here()).first()),
  ),
)

// ─── The notch header ───────────────────────────────────────────────────────
// A white card that BLEEDS OFF THE LEFT PAGE EDGE, rounded on its right side
// only, carrying condensed heavy uppercase purple type — with a purple hairline
// running from the card's right edge to (and off) the right page edge, at the
// card's optical centre.
//
// This CANNOT be built with a grid. A grid's column `align:` controls alignment
// INSIDE a cell, not the cell's position on the page, and no grid cell can
// extend outside the content area into the page margin. The only construct that
// reaches into the margin is `place` with a negative `dx` — here `-page-margin`,
// which is exactly the distance from the content edge to the paper edge.
//
// Drawing order matters: the rule is placed FIRST at full page width, then the
// opaque white card is placed OVER it, so the card masks the rule's left
// portion and the rule appears to start at the card's edge. Chasing the card's
// actual width instead would need a measure/layout pass for no visual gain.
#let notch(title, rule: brand, height: 21mm) = block(
  above: 0pt,
  below: gap-page-title,
  width: 100%,
  height: height,
  {
    // Hairline first — full bleed to the right paper edge.
    place(
      left + horizon,
      dx: 0pt,
      line(length: 100% + page-margin, stroke: 1.1pt + rule),
    )
    // Then the card, over it, bleeding to the left paper edge.
    place(
      top + left,
      dx: -page-margin,
      box(
        fill: card,
        radius: (left: 0pt, right: radius-notch),
        height: height,
        inset: (left: page-margin + 2mm, right: 12mm, y: 0pt),
        align(
          horizon,
          text(
            font: display,
            size: size-page,
            weight: display-weight,
            stretch: display-stretch,
            tracking: 0.02em,
            fill: brand,
            upper(title),
          ),
        ),
      ),
    )
  },
)

// ─── A standard content page ────────────────────────────────────────────────
// `title` renders a notch header; `number: false` drops the folio (covers,
// dividers). Background always routes through `bg()` so the draft mark cannot
// be lost.
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

// ─── A full-bleed photographic plate ────────────────────────────────────────
// No margin, no folio. The image covers the sheet; a bottom-up gradient scrim
// darkens the lower band so caption type stays legible over whatever the photo
// happens to be doing there.
//
// `tint` is the scrim colour — ink by default, `brand` for a purple-washed
// plate. Passing `img: none` gives a flat `tint` page, which is what a chapter
// divider without a photograph falls back to.
//
// Title and kicker are SEPARATE blocks, never `linebreak()` + `v()`: a
// `v(weak: true)` after a linebreak collapses to zero because both lines are
// still inside one paragraph and there is no paragraph margin to collapse
// against. See RULE 2 in report/PITFALLS.md.
#let plate(img, title: none, kicker: none, tint: ink) = page(
  fill: canvas,
  margin: 0pt,
  header: none,
  footer: none,
  numbering: none,
  background: bg(under: {
    if img != none {
      image(img, width: 100%, height: 100%, fit: "cover")
    } else {
      rect(width: 100%, height: 100%, fill: tint, stroke: none)
    }
    place(
      bottom + left,
      rect(
        width: 100%,
        height: 46%,
        stroke: none,
        fill: gradient.linear(
          tint.transparentize(100%),
          tint.transparentize(28%),
          angle: 90deg,
        ),
      ),
    )
  }),
  {
    place(
      bottom + left,
      dx: page-margin,
      dy: -page-margin - 4mm,
      block(width: 74%, {
        if kicker != none {
          block(above: 0pt, below: gap-line + 1pt, {
            text(
              font: body-font,
              size: size-micro,
              weight: 600,
              tracking: 0.22em,
              fill: white.transparentize(12%),
              upper(kicker),
            )
          })
        }
        if title != none {
          block(above: 0pt, below: 0pt, {
            set par(leading: lead-display)
            text(
              font: display,
              size: size-chapter,
              weight: display-weight,
              stretch: display-stretch,
              tracking: display-tracking,
              fill: white,
              title,
            )
          })
        }
      }),
    )
  },
)

// ─── Chapter divider ────────────────────────────────────────────────────────
// A plate carrying a big numeral and the chapter name. `number` is the visible
// chapter numeral ("01"), not a page number.
#let chapter(title, img: none, number: none, kicker: none, tint: brand) = plate(
  img,
  tint: tint,
  kicker: kicker,
  title: {
    if number != none {
      block(above: 0pt, below: gap-line, {
        text(
          font: display,
          size: size-chapter,
          weight: display-weight,
          stretch: display-stretch,
          fill: white.transparentize(45%),
          number,
        )
      })
    }
    block(above: 0pt, below: 0pt, {
      set par(leading: lead-display)
      text(
        font: display,
        size: size-chapter,
        weight: display-weight,
        stretch: display-stretch,
        tracking: display-tracking,
        fill: white,
        title,
      )
    })
  },
)

// ─── Two-column prose page ──────────────────────────────────────────────────
// For the long-copy sections (founder's letter, methodology, outlook). The lede
// spans full width above the columns; the body is justified and hyphenated.
#let spread(title, body, lede: none) = sheet(
  title: title,
  {
    if lede != none {
      block(above: 0pt, below: gap-section, width: 100%, {
        set par(leading: lead-lede, justify: false)
        set text(
          font: body-font,
          size: size-lede,
          weight: 500,
          fill: ink,
          lang: "en",
          region: "nz",
          hyphenate: false,
        )
        // lede lists: 11.5pt × 0.68em = 7.82pt within · 14pt between = 1.79×
        // `tight: false` is LOAD-BEARING, not decoration. A Typst list written
        // without blank lines between items is "tight", and a tight list spaces
        // its items with `par.leading` and IGNORES `spacing:` completely. Every
        // calibrated ratio in this project was therefore inert — measured on the
        // methodology page, bullet-to-bullet pitch was 16px against a
        // within-item pitch of 16px, i.e. 1.00x, where the comment claimed
        // 1.87x. The ratio comments were all present and correct, which is
        // exactly why a source grep reported the contract as passing.
        set list(tight: false, spacing: 14pt, indent: 0pt, body-indent: 7pt,
          marker: text(fill: brand)[•])
        lede
      })
    }
    set text(
      font: body-font,
      size: size-body,
      fill: ink-700,
      lang: "en",
      region: "nz",
      hyphenate: true,
    )
    set par(leading: lead-body, justify: true, spacing: gap-para)
    // body prose lists: 9.5pt × 0.62em = 5.89pt within · 11pt between = 1.87×
    set list(tight: false, spacing: 11pt, indent: 0pt, body-indent: 7pt,
      marker: text(fill: brand)[•])
    columns(2, gutter: 8mm, body)
  },
)

// ─── Document-level setup ───────────────────────────────────────────────────
// Applied once by the report's entry file, wrapping the whole document:
//     #show: report-setup
//
// The regex show rule MUST come last — it is a catch-all over text, so any
// later rule would be applied to already-boxed content.
//
// It is deliberately NARROW. Boxing a hyphenated compound removes its internal
// line-break opportunities, which is exactly what you want for "AI-native" and
// exactly what you do NOT want for a URL: a boxed unwrappable URL cannot break
// anywhere and overflows its column instead. Bounding each segment to 2–14
// ASCII letters keeps real compounds in and leaves URL-shaped strings (which
// carry dots, slashes and digits) out.
#let report-setup(doc) = {
  set text(font: body-font, size: size-body, fill: ink, lang: "en", region: "nz")
  set par(leading: lead-body, spacing: gap-para)
  show link: it => it
  show regex("[A-Za-z]{2,14}(-[A-Za-z]{2,14}){1,2}"): it => box(it)
  doc
}
