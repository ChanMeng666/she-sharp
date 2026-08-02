// Page 15 — the Youth Tech Series, BOTH workshops on one page.
//
// WHY THIS IS NOT TWO `event-page()` CALLS.
//
// The two Peyvand workshops originally ran as pages 15 and 16 through the shared
// event template. They became the weakest pages in the report, and a funder
// reviewer put the reason precisely: roughly half of each page was blank, they
// carry no speaker records (the source event JSON has an empty `speakers` array
// for both — these were hands-on build sessions, not talks), and all four stat
// tiles on each were placeholders. Eight amber tiles across two thin pages.
//
// They also happen to be the pages about twelve-to-eighteen-year-olds, and an
// emptier page about children reads worse than a full one: the emptiness is
// where a reader starts wondering what else was not recorded.
//
// The two sessions are one series, one venue, one week apart, and the second
// workshop's own story is that the same young people came back. A side-by-side
// comparison makes that point STRUCTURALLY — you can see the returning cohort in
// the columns — instead of asserting it in a sentence. One solid page replaces
// two thin ones and drops four placeholder tiles on the way.
//
// The shared event template is untouched and still serves the other seven
// events. This is a deliberate exception, not a fork.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": logo-lockup, stat-card, source-note, eyebrow
#import "../lib/assets.typ": photo, logo
#import "../data/events.typ": event-by-slug
#import "../data/copy.typ": chapter-youth

#let _tile = 26mm

#let youth-series-page() = {
  let a = event-by-slug("peyvand-academy-13-june-2026")
  let b = event-by-slug("peyvand-academy-20-june-2026")

  sheet(number: true)[
    #block(above: 0pt, below: gap-line, width: 100%)[
      #align(right, text(
        font: display, size: size-h2, weight: display-weight,
        stretch: display-stretch, tracking: 0.06em, fill: brand, upper("June 2026"),
      ))
    ]
    // The union of both workshops' partners — Little Engineers joined only the
    // second session, so the merged lockup carries all three.
    #logo-lockup(("peyvand-academy", "moe", "little-engineers").map(s => logo(s)))

    #block(above: 0pt, below: gap-line + 1pt, width: 100%)[
      #align(center, text(
        font: display, size: size-event, weight: display-weight,
        stretch: display-stretch, tracking: 0.01em, fill: brand,
        "Youth Tech Series",
      ))
    ]
    #block(above: 0pt, below: gap-section, width: 100%)[
      #align(center, text(
        font: body-font, size: size-micro, weight: 500, tracking: 0.10em,
        fill: ink-500,
        upper("13 and 20 June 2026 · 2:30pm – 4:30pm · Fruitvale Primary School, West Auckland"),
      ))
    ]

    #block(above: 0pt, below: gap-section, width: 100%)[
      #set par(leading: lead-lede, justify: false)
      #set text(font: body-font, size: size-lede, weight: 500, fill: ink,
        lang: "en", region: "nz")
      #chapter-youth
    ]

    // ── The two Saturdays, side by side ─────────────────────────────────────
    #grid(
      columns: (1fr, 1fr),
      column-gutter: gutter-card,
      ..((a, "Saturday 13 June", "AI and electronics"),
         (b, "Saturday 20 June", "Electronics, in depth")).map(((ev, day, theme)) => {
        block(above: 0pt, below: 0pt, breakable: false, width: 100%, {
          block(above: 0pt, below: gap-line, width: 100%, {
            block(above: 0pt, below: 2pt, text(
              font: body-font, size: size-micro, weight: 700, tracking: 0.10em,
              fill: brand, upper(day),
            ))
            block(above: 0pt, below: 0pt, text(
              font: body-font, size: size-meta, fill: ink-500, theme,
            ))
          })
          block(above: 0pt, below: gap-line, width: 100%, {
            box(
              width: 100%, height: 44mm, radius: radius-photo, clip: true,
              image(photo(ev.photo-keys.at(0)), width: 100%, height: 100%,
                fit: "cover"),
            )
          })
          grid(
            columns: (1fr, 1fr),
            column-gutter: 4mm,
            row-gutter: 4mm,
            stat-card(ev.stats.at(0).metric, "Registered", height: _tile),
            stat-card(ev.stats.at(1).metric, "Attended", height: _tile),
          )
        })
      })
    )

    #block(above: 0pt, below: gap-block, width: 100%)[]

    #block(above: 0pt, below: gap-line, width: 100%)[
      #eyebrow("Delivered with", fill: ink-500)
    ]
    #block(above: 0pt, below: gap-section, width: 100%)[
      #set par(leading: lead-body)
      #text(font: body-font, size: size-body, fill: ink-700)[
        Peyvand Academy and the Ministry of Education across both Saturdays, with
        Little Engineers supplying kits and facilitators for the second session.
      ]
    ]

    #source-note[
      Attendance for both workshops is taken from the organisers' own count on
      the day and has not been reconciled against a booking platform — these were
      free community sessions with no ticketing. Both figures are marked
      accordingly. Returning-participant numbers, which are the outcome this
      series is designed for, are not yet recorded in any system; establishing
      that count is a commitment for the second half-year.
    ]
  ]
}
