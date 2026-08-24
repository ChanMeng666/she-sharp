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
#import "../lib/metrics.typ": num
#import "../data/report-data.typ": D
#import "../lib/assets.typ": photo, logo
#import "../data/events.typ": event-by-slug
#import "../data/copy.typ": chapter-youth

#let _tile = 26mm

#let youth-series-page() = {
  let a = event-by-slug("peyvand-academy-13-june-2026")
  let b = event-by-slug("peyvand-academy-20-june-2026")
  // The second Saturday's returning count is the page's actual argument, so it
  // is named in the note rather than left to a third tile the two-up grid has no
  // room for. "Returning" means an earlier registration exists in the booking
  // archive — for this workshop that is overwhelmingly the first one, a week
  // before.
  let event-b-returning = D.events.peyvand-academy-20-june-2026.returning
  let event-b-registered = D.events.peyvand-academy-20-june-2026.registered

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
            // "CHECKED IN", NOT "ATTENDED", and the label is the whole point.
            //
            // This metric is `na()` — no check-in was run at either session, so
            // Humanitix scanned nobody — and `num()` renders it as a muted em
            // dash. Under the word "Attended" a dash reads as "nobody came" to a
            // workshop that demonstrably happened, on the only page in this
            // report about children; under "Checked in" the same dash reads as
            // what it is, "no scanner was run at the door". The eyebrow under the
            // pair says so in words, because a reader should not have to infer it
            // from a label.
            stat-card(ev.stats.at(1).metric, "Checked in", height: _tile),
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

    // EVERY CLAUSE OF THE OLD NOTE WAS WRONG. It said both workshops were free
    // community sessions with no ticketing, that attendance came from the
    // organisers' own count on the day, and that returning-participant numbers
    // were recorded nowhere. Both sessions were in fact ticketed through
    // Humanitix — free, but ticketed, with access codes issued — and the export
    // carries registrations, returning counts and first-time counts for both.
    // What it does not carry is attendance, because neither session ran a
    // check-in. That is the honest version and it is the one thing the tiles
    // above cannot say on their own.
    #source-note[
      Both workshops were ticketed through the booking platform and both were
      free to attend. There is a registration figure for each and no attendance
      figure for either: #text(weight: 600)[neither session ran a check-in], so
      nobody was scanned at the door and the dash above is the absence of a
      measurement rather than a count of nobody.
      #num(D.programme.youth.rangatahi) places were booked across the two
      Saturdays, and #num(D.programme.youth.first-time-participants) of the
      addresses behind them appear nowhere earlier in the booking archive — these
      are youth workshops, so most of those addresses are a parent's.
      Registrations count tickets and not young people: the same person coming to
      both Saturdays is two of them, which is what
      #num(event-b-returning) of the second Saturday's
      #num(event-b-registered) registrations records.
    ]
  ]
}
