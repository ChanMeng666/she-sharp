// Pages 3–4 — a word from the founder.
//
// This is the ONE section in the report that deliberately lets its body flow
// across a page boundary instead of pinning one `page()` call per page.
// `founder-letter` is a single content binding in data/copy.typ, and this file
// may not edit that file — so there is no paragraph boundary available to split
// it at. The alternative, cutting the letter into two bindings, would put an
// editorial decision (where the letter breaks) inside a layout file, which is
// exactly backwards.
//
// The flow is still CONTROLLED rather than emergent: the masthead block at the
// top of page 3 is the tuning lever, and `build.ps1 -ExpectPages` fails the
// build if the letter ever runs to a third page. See RULE 5 in PITFALLS.md for
// why every other section is pinned.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": quote-card
#import "../lib/assets.typ": team-photo, photo
#import "../data/copy.typ": founder-letter
#import "../data/report-data.typ": founder-name, founder-role, period

#let founder-letter-pages() = sheet(title: "A word from the founder")[
  // ── Masthead: portrait beside a pull-quote ────────────────────────────────
  #block(above: 0pt, below: gap-section, width: 100%, breakable: false)[
    #grid(
      columns: (46mm, 1fr),
      column-gutter: 8mm,
      align: (top + center, horizon + left),
      {
        block(above: 0pt, below: gap-caption + 2pt, width: 100%, align(center, {
          box(
            width: 40mm, height: 40mm, radius: 50%, clip: true,
            stroke: 3pt + brand,
            // A DIFFERENT photograph from the one on the team page. Both pages
            // previously rendered `team-mahsa-large`, so the founder's portrait
            // appeared twice, three pages apart, in identical framing. This is
            // sourced from public/img/MahsaMcCauley.png; the team grid keeps
            // public/img/team/Mahsa.webp.
            image(photo("founder-portrait"), width: 100%, height: 100%, fit: "cover"),
          )
        }))
        block(above: 0pt, below: 2pt, width: 100%, align(center, {
          text(font: body-font, size: size-meta, weight: 600, fill: ink, founder-name)
        }))
        block(above: 0pt, below: 0pt, width: 100%, align(center, {
          text(font: body-font, size: size-source, fill: ink-500, founder-role)
        }))
      },
      // The pull quote used to read "There is ONE number in this report I do not
      // trust, and we have marked it." It was the best-written line on the page
      // and it was false: the register on the methodology page lists 66
      // unverified metrics. A reader who reaches that page having been told
      // "one" does not conclude the letter was imprecise — they conclude they
      // are being managed, and then they re-read everything else with that in
      // mind. The strongest sentence in a report must also be the most literally
      // true one.
      quote-card(
        [We measured less of this half-year than we should have, and we have
          marked every figure we cannot yet stand behind.],
        founder-name + " · " + founder-role,
      ),
    )
  ]

  // ── The letter ────────────────────────────────────────────────────────────
  // Set at `size-lede`, not `size-body`. This is the most-read page in the
  // report and the one page that is pure voice, so it gets the larger of the two
  // reading sizes — which is also what carries it across the two pages the
  // contents page promises. (It is still one of the eleven type roles; no new
  // size was invented for it.)
  #set text(
    font: body-font, size: size-lede, fill: ink-700,
    lang: "en", region: "nz", hyphenate: true,
  )
  #set par(leading: lead-lede, justify: true, spacing: gap-para)
  #columns(2, gutter: 8mm)[
    #founder-letter

    // The sign-off. `v()` first, NOT a block `above:` gap — the letter's last
    // line is a markup PARAGRAPH, and an explicit `above:` on the block that
    // follows it replaces `par.spacing` outright rather than max()-ing with it
    // (RULE 1b). With `above: 0pt` the script signature printed directly on top
    // of "Ngā mihi nui,". Explicit `v()` is inserted spacing and is not subject
    // to that collapse.
    #v(gap-block)
    // `below: 6pt`, not 1pt: Carattere is a script face with deep descenders,
    // and its bounding box does not contain them. At 1pt the tail of the "y"
    // crossed the printed name on the line beneath.
    #block(above: 0pt, below: 6pt, width: 100%)[
      #text(font: script-font, size: 24pt, fill: brand, founder-name)
    ]
    #block(above: 0pt, below: 2pt, width: 100%)[
      #text(font: body-font, size: size-meta, weight: 600, fill: ink, founder-name)
    ]
    #block(above: 0pt, below: 0pt, width: 100%)[
      #text(font: body-font, size: size-source, fill: ink-500,
        founder-role + " · She Sharp · " + period)
    ]
  ]

  // ── The half-year in six photographs ──────────────────────────────────────
  // This sits AFTER the `columns()` block, so it lands full-width on whichever
  // page the letter finishes on — page 4. It is here for a reason: at
  // `size-lede` the letter runs about a page and a sixth, which left page 4
  // holding four lines and a signature over an otherwise blank sheet. Rather
  // than pad the letter or shrink it back onto one page and break the contents
  // page's promise of pp. 3–4, the spread earns its second page.
  //
  // Six events, chronological, captioned. The photographs are the same six the
  // asset pipeline crops for this purpose; the thanks plate on page 28 uses its
  // own image, so nothing is repeated.
  #v(gap-section)
  #block(above: 0pt, below: gap-block, width: 100%)[
    #text(font: display, size: 17pt, weight: display-weight, stretch: display-stretch,
      fill: brand, upper("The half-year in six moments"))
  ]
  #block(above: 0pt, below: 0pt, width: 100%, breakable: false)[
    #grid(
      columns: (1fr,) * 3,
      column-gutter: gutter-card,
      row-gutter: 6mm,
      ..(
        ("mosaic-iwd", "International Women's Day", "6 March · academyEX"),
        ("mosaic-her-waka", "HER WAKA cohort one", "25 March · Grafton"),
        ("mosaic-own-your-energy", "Own Your Energy", "16 April · Metlifecare"),
        ("mosaic-her-waka-april", "HER WAKA cohort two", "7 April · Grafton"),
        // The purpose-cropped `mosaic-linkedin` frame is a catering table; the
        // event's own hero shows the session. Picked by looking, not by name.
        ("making-linkedin-work-for-you-with-stuart-little-hero",
         "LinkedIn masterclass", "15 May · AUT City Campus"),
        ("mosaic-her-waka-june", "HER WAKA cohort four", "2 June · Grafton"),
      ).map(m => {
        // Three stacked blocks, never linebreak + v() — RULE 2.
        block(above: 0pt, below: gap-caption + 1pt, width: 100%, {
          box(width: 100%, height: 44mm, radius: radius-photo, clip: true,
            image(photo(m.at(0)), width: 100%, height: 100%, fit: "cover"))
        })
        block(above: 0pt, below: 1.5pt, width: 100%, {
          text(font: body-font, size: size-meta, weight: 600, fill: ink, m.at(1))
        })
        block(above: 0pt, below: 0pt, width: 100%, {
          text(font: body-font, size: size-source, fill: ink-500, m.at(2))
        })
      })
    )
  ]

  #v(gap-section)
  #quote-card(
    [We ran fewer events for a general audience, and more programmes for
      particular people.],
    "The half-year in one sentence",
    fill: mint,
  )
]
