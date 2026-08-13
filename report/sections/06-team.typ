// Page 6 — the team.
//
// Fifteen people, none of them paid. The founder takes a larger portrait; the
// other fourteen run 5-up beneath, matching the 2025 report's team page. The
// last row is therefore short by one — `grid` leaves the trailing cell empty
// rather than centring the row, so the gap sits on the right-hand edge.
//
// ── The photo-key map, and why it is explicit ────────────────────────────────
// Converted portraits are keyed `team-<lowercase first name>`. Two members do
// not follow that rule, and BOTH would fail silently as a missing-file compile
// error rather than a wrong-looking page:
//
//   Tharaneetharan Thavarasan  first name is "Tharaneetharan", asset is
//                              `team-tharanee` (the site's PNG is Tharanee.png)
//   Prasanth Pavithran         site PNG is Prasanth-Pavithran.png, asset is
//                              `team-prasanth`
//
// Deriving the key from `m.file` instead of `m.first` just moves the problem
// (it fixes Tharanee and breaks Prasanth), so neither field works alone. The
// override map is the honest fix, and it is checked by `_photo-key` panicking on
// an unknown member rather than handing a bad path to `image()`.
//
// NOTE also that `data/team.typ` exports its own `team-photo(m)` returning the
// SITE path (/img/team/Mahsa.webp — which is not even repo-root-correct, it is
// missing the /public prefix). This file deliberately imports `team-photo` from
// lib/assets.typ instead, which resolves the CONVERTED square JPEG. The two
// functions share a name and have different signatures; do not import both.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": portrait, source-note
#import "../lib/assets.typ": team-photo
#import "../data/team.typ": team, founder, ambassadors
#import "../data/report-data.typ": D

#let _KEY-OVERRIDES = (
  "Tharaneetharan": "tharanee",
  "Prasanth": "prasanth",
)

#let _photo-key(m) = {
  if m.first in _KEY-OVERRIDES { _KEY-OVERRIDES.at(m.first) } else { lower(m.first) }
}

#let team-page() = sheet(title: "The team")[
  // ── Founder ───────────────────────────────────────────────────────────────
  #block(above: 0pt, below: gap-section, width: 100%, breakable: false)[
    #grid(
      columns: (44mm, 1fr),
      column-gutter: 8mm,
      align: (top + center, horizon + left),
      {
        block(above: 0pt, below: gap-caption + 2pt, width: 100%, align(center, {
          box(
            width: 38mm, height: 38mm, radius: 50%, clip: true, stroke: 3pt + brand,
            image(team-photo("mahsa-large"), width: 100%, height: 100%, fit: "cover"),
          )
        }))
        block(above: 0pt, below: 2pt, width: 100%, align(center, {
          text(font: body-font, size: size-meta, weight: 600, fill: ink,
            founder.prefix + " " + founder.first + " " + founder.last)
        }))
        block(above: 0pt, below: 0pt, width: 100%, align(center, {
          text(font: body-font, size: size-source, fill: ink-500, founder.role)
        }))
      },
      {
        block(above: 0pt, below: gap-para, width: 100%, {
          text(font: display, size: 17pt, weight: display-weight, stretch: display-stretch,
            fill: brand, upper("Fifteen people, none of them paid"))
        })
        block(above: 0pt, below: 0pt, width: 100%, {
          set par(leading: lead-body, justify: false)
          text(font: body-font, size: size-body, fill: ink-700)[
            She Sharp is run entirely by volunteers. Two are trustees; the rest
            are ambassadors who give evenings and weekends to the programmes in
            this report — running events, maintaining the platform, handling
            marketing, and standing at the door on the night.
          ]
        })
      },
    )
  ]

  // ── Ambassadors, 5-up ─────────────────────────────────────────────────────
  #block(above: 0pt, below: gap-section, width: 100%)[
    #grid(
      columns: (1fr,) * 5,
      column-gutter: gutter-portrait,
      row-gutter: 10mm,
      ..ambassadors.map(m => portrait(
        team-photo(_photo-key(m)),
        m.first,
        m.last,
        role: m.role,
        size: 28mm,
      ))
    )
  ]

  #source-note[
    Source: the team register in the She Sharp codebase, at 1 August 2026.
    Two further historical entries are retired and are excluded.
  ]
]
