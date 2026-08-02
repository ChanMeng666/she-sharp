// Page 23 — partners and sponsors.
//
// Two distinct claims, kept visually distinct because conflating them would be
// the most quietly dishonest thing on the page:
//
//   TOP    — the seven organisations that actually backed something in H1 2026,
//            each with what they backed in their own row. This is the accountable
//            list.
//   BOTTOM — the historical supporter wall since 2014. It is a much longer list
//            and it is NOT a claim about this half-year.
//
// Logos resolve through `logo(slug)`, never through the raw `logo:` path stored
// in data/sponsors.typ. That path is a SITE path (/img/sponsors/...), which is
// not valid from the repo root, and going direct would bypass RASTER-FALLBACK —
// three H1 partner marks were never SVG at all (MOE.png, peyvand-academy.jpg,
// little-engineers.jpg) and would fail the compile.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": logo-wall, source-note, eyebrow
#import "../lib/assets.typ": logo
#import "../data/sponsors.typ": h1-partners, logo-wall as historical-wall

// Derive a slug from the stored site path so the historical wall also routes
// through the fallback map: "/img/sponsors/hcltech.svg" -> "hcltech".
#let slug-of(path) = {
  let base = path.split("/").last()
  base.slice(0, base.len() - 4)
}

#let partners-page() = sheet(title: "Partners in H1 2026")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-body, justify: true)
    #text(size: size-body, fill: ink-700)[
      Seven organisations backed She Sharp's work between January and June 2026 —
      with funding, with venues, with speakers, or with the referrals that filled
      a programme. Every event in this report exists because one of them said yes.
    ]
  ]

  #logo-wall(
    none,
    brand,
    h1-partners.map(p => (file: logo(p.slug), name: p.short-name)),
    cols: 4,
    slot: 26pt,
  )

  #block(above: 0pt, below: gap-block, width: 100%)[
    #grid(
      columns: (1fr, 1fr),
      column-gutter: gutter-card,
      row-gutter: 3.5mm,
      // RULE 3 — 8pt text at 0.60em leading is 4.80pt within-item; 8.5pt between
      // is 1.77x. Below ~1.7x adjacent rows merge into one grey block.
      ..h1-partners.map(p => block(above: 0pt, below: 0pt, breakable: false, {
        block(above: 0pt, below: 2pt, text(
          font: body-font, size: size-meta, weight: 700, fill: brand, p.name,
        ))
        block(above: 0pt, below: 0pt, {
          set par(leading: 0.60em)
          text(font: body-font, size: size-meta, fill: ink-700, p.backed)
        })
      }))
    )
  ]

  #block(above: 0pt, below: gap-line, width: 100%)[
    #eyebrow("Supporters since 2014", fill: ink-500)
  ]

  #logo-wall(
    none,
    ink-500,
    historical-wall.map(s => (file: logo(slug-of(s.logo)), scale: 0.82)),
    cols: 7,
    slot: 15pt,
  )

  // NOT "every organisation that has supported She Sharp since 2014". The lower
  // wall is `scrollingSponsorLogos` — a website marquee of 38 entries, which is
  // a display list, not a register. The organisation's own marketing claims
  // "50+ sponsors", a figure this report elsewhere downgrades to an estimate; a
  // wall of 38 captioned "every organisation" quietly contradicts both.
  #source-note[
    The upper group is the organisations that funded, hosted, spoke at or
    referred into a She Sharp activity between 1 January and 30 June 2026. The
    lower wall shows organisations that have supported She Sharp since 2014 as
    recorded on the She Sharp website; it is not a complete register and is not a
    claim about this reporting period.
  ]
]
