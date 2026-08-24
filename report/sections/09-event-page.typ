// The event page — ONE template, invoked nine times.
//
// Pages 10–13 (the four HER WAKA cohorts) and 17–19 (the three community
// evenings) are all this function — SEVEN pages, not nine. The two Youth Tech
// workshops were pulled out onto a single shared page; sections/22-youth-series.typ
// records why the template was the wrong fit for those two specifically.
// Adding an eighth event is a record in data/events.typ and one line in the entry
// document; it is never a new file. That is what makes the pages flip past as one
// recurring component instead of seven near-misses.
//
// ── What is fixed, and why ───────────────────────────────────────────────────
// Everything structural is a constant, not a function of the data:
//
//   · `bar-h` keeps its default 34mm label column. With `auto` the track would
//     start at a different x on every page, because it would size to the longest
//     label in THAT event's survey.
//   · the hero photo and the stat block share one fixed 59mm row height.
//   · the company table's column count is derived from a fixed rows-per-column
//     target, so a 21-company event and a 2-company event both produce a block
//     of roughly the same height rather than one tall and one flat.
//   · the speaker list is deliberately NOT on this page. It varies from zero to
//     five people between events, so printing it would make the nine pages
//     visibly different lengths. The speakers are named in each event's lede.
//
// Gaps follow RULE 1 (below-side only); every card is `breakable: false`.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": logo-lockup, stat-card, company-table, chart-card, source-note
#import "../lib/assets.typ": photo, logo

// Column count for the company table. Targets ~6 rows per column so the block's
// height stays comparable across events with wildly different company counts
// (the nine events range from 2 organisations to 21).
#let _company-cols(n) = calc.max(2, calc.min(4, calc.ceil(n / 6)))

// Shared geometry for the stat/photo row, so all nine pages agree.
#let _tile = 29mm

#let event-page(ev) = sheet(number: true)[
  // The month sits ABOVE the lockup, in its own right-aligned block, rather than
  // in the lockup's own `right-label` slot.
  //
  // `right-label` places the date on the canvas beside the white card, and the
  // card's width is content-driven: three partner marks (the 20 June workshop
  // carries Peyvand Academy, the Ministry of Education AND Little Engineers)
  // make it wide enough to run straight over the date. There is no width at
  // which that is safe for one, two and three marks alike, so the two elements
  // are given separate rows and the collision becomes impossible rather than
  // unlikely.
  #block(above: 0pt, below: gap-line, width: 100%)[
    #align(right, text(
      font: display, size: size-h2, weight: display-weight, stretch: display-stretch,
      tracking: 0.06em, fill: brand, upper(ev.month),
    ))
  ]
  #logo-lockup(ev.partner-logos.map(s => logo(s)))

  // ── Title and meta ────────────────────────────────────────────────────────
  #block(above: 0pt, below: gap-line + 1pt, width: 100%)[
    #align(center, text(
      font: display, size: size-event, weight: display-weight,
      stretch: display-stretch, tracking: 0.01em, fill: brand,
      ev.short-title,
    ))
  ]
  #block(above: 0pt, below: gap-section, width: 100%)[
    #align(center, text(
      font: body-font, size: size-micro, weight: 500, tracking: 0.10em, fill: ink-500,
      upper(ev.date + " · " + ev.time + " · " + ev.venue),
    ))
  ]

  // ── Lede ──────────────────────────────────────────────────────────────────
  //
  // FIXED HEIGHT, and this is what makes the event pages a recurring component
  // rather than eight near-misses. The lede runs to four lines on most events
  // and five on two of them; content-sized, that 20px difference floated the
  // entire stat/photo/table stack below it, so flipping from one event page to
  // the next made the whole object jump 5.6mm. Everything under this block was
  // already pinned to constants — `_tile`, the fixed company-table column count,
  // `bar-h`'s fixed label column — and the lede was the last thing above them
  // still sized by its own text. Five lines at `lead-lede` plus the section gap.
  #let _lede-h = 5 * size-lede * 1.68 + gap-section
  #block(above: 0pt, below: 0pt, width: 100%, height: _lede-h)[
    #set par(leading: lead-lede, justify: false)
    #set text(font: body-font, size: size-lede, weight: 500, fill: ink,
      lang: "en", region: "nz")
    #ev.lede
  ]

  // ── Stats (2×2) beside the hero photograph ────────────────────────────────
  //
  // `ev.stats` DIRECTLY, with no filtering. This block used to read an
  // `ev.at("suppress-companies", default: false)` flag and, where it was set,
  // replace the two derived tiles with em-dash cards reading "Not published —
  // export incomplete". It existed for one event: the May HER WAKA cohort, whose
  // export recorded 5 registered beside placeholder tiles claiming 9 returning
  // and 7 companies. Nine returning out of five registered is impossible on its
  // face, on the one page whose whole argument was that its export could not be
  // trusted.
  //
  // The Humanitix account export of 2026-08-17 reconciled that record — May is
  // 33 registered, 29 checked in — and `suppress-companies` was removed from
  // data/events.typ with it. NO EVENT SETS IT ANY MORE, so both branches were
  // unreachable code and are deleted rather than kept "in case". A dead branch
  // that renders an apology is the one kind of dead code that eventually renders
  // itself.
  #block(above: 0pt, below: gap-section, width: 100%, breakable: false)[
    #grid(
      columns: (1fr, 1fr),
      column-gutter: gutter-card,
      grid(
        columns: (1fr, 1fr),
        column-gutter: gutter-card,
        row-gutter: gutter-card,
        ..ev.stats.map(s => stat-card(s.metric, s.label, height: _tile)),
      ),
      box(
        width: 100%, height: _tile * 2 + gutter-card,
        radius: radius-photo, clip: true,
        image(photo(ev.photo-keys.at(0)), width: 100%, height: 100%, fit: "cover"),
      ),
    )
  ]

  // ── Who was in the room ───────────────────────────────────────────────────
  //
  // "Largest organisations represented", NOT "Registered attendees by
  // organisation". The old heading claimed the table accounted for everyone, and
  // it never did: on the IWD page 21 rows summed to 58 against 103 registered,
  // beside a tile claiming 38 organisations — three numbers, no two of which
  // agreed. The table is a top-N slice, so saying so reconciles all three at once
  // without deleting anything. A reader who adds up a column and finds it short
  // stops trusting every other number on the page.
  //
  // The `suppress-companies` alternative that stood here, replacing the table
  // with a card explaining that one cohort's export was incomplete, went with the
  // flag itself — see the stat row above.
  #company-table(
    ev.companies,
    cols: _company-cols(ev.companies.len()),
    title: "Largest organisations represented",
  )

  // ── Who spoke ─────────────────────────────────────────────────────────────
  //
  // THIS BLOCK REPLACED TWO SURVEY CHARTS, and the reason is the most important
  // editorial decision on this page.
  //
  // Every event page used to end with a "What went well" bar chart and an "Areas
  // for improvement" doughnut, filled from `ev.went-well` / `ev.improve`. Those
  // were not placeholders awaiting data. NO POST-EVENT SURVEY WAS RUN IN H1
  // 2026, so no export will ever populate them — they were last year's answers
  // redrawn in this year's shape, eighteen fabricated charts across nine pages,
  // several of them sitting beneath the New Zealand Government crest and the
  // Ministry of Social Development wordmark. The amber flag marking them is a
  // 2mm superscript; at reading distance the pages simply looked like data.
  //
  // Speakers are real, come from each event's own record, and were previously
  // omitted only because the list length varies from one person to five and
  // would make the nine pages different heights. That is solved by capping the
  // block at four and giving it a fixed height, which is a far smaller cost than
  // printing invented evidence to a funder.
  // FIVE, not four. At four the cut followed source order and dropped the
  // recruiter on three of the four HER WAKA pages — cohort 1 showed four She
  // Sharp ambassadors and none of the three RCSA recruiters, on a page whose own
  // lede says "recruiters from the RCSA closed with what employers were actually
  // hiring for" and whose photograph is the recruiter panel. The card is read as
  // evidence of external partner depth; edited that way it proved the opposite.
  // Five covers every event in the set with nothing dropped.
  #let _shown = ev.speakers.slice(0, calc.min(5, ev.speakers.len()))
  #if _shown.len() > 0 {
    block(above: 0pt, below: gap-line, width: 100%, breakable: false, {
      chart-card(
        "Who spoke",
        grid(
          columns: (1fr, 1fr),
          column-gutter: gutter-card,
          row-gutter: 3.5mm,
          .._shown.map(sp => block(above: 0pt, below: 0pt, {
            // RULE 2 — three separate blocks. A linebreak() + v() here would
            // render the v() as zero and glue the name to the role.
            block(above: 0pt, below: 1.5pt, text(
              font: body-font, size: size-meta, weight: 700, fill: ink, sp.name,
            ))
            // An empty `company` prints the role ALONE. The source records leave
            // this field blank for several speakers, and the separator-plus-
            // nothing that a naive join produces invites someone to "tidy it up"
            // by guessing an employer. Guessing is exactly what must not happen
            // here: these are named living people and this document goes to
            // their industry.
            block(above: 0pt, below: 0pt, {
              set par(leading: 0.60em)
              text(font: body-font, size: size-micro, fill: ink-500,
                if sp.company == "" { sp.role } else { sp.role + " · " + sp.company })
            })
          }))
        ),
        // No "four of five" count. It read as an incomplete record rather than
        // an edited one — a reader wonders who the fifth was and why they were
        // dropped. The card claims to show speakers, not all speakers, and the
        // event page on the website carries the full line-up.
        note: none,
      )
    })
  }

  // The old closing sentence — "No returning-attendee or organisation figures are
  // available for this period; every such figure on this page is a placeholder
  // and is marked" — was true when it was written and is now false for all
  // eighteen of them. What replaces it is the two caveats those figures actually
  // carry, which are narrower and real. The survey sentence in front of it is
  // still true and survives unchanged in substance.
  #source-note[
    Attendance and organisation figures are taken from the Humanitix account
    export of 17 August 2026, reconciled against the event register in the She
    Sharp codebase; speakers come from the event's own record. No post-event
    survey was run in this period, so this report carries no participant-feedback
    figures for any event — the 2025 report's survey charts have no 2026
    equivalent and none is shown here. "Returning" means an earlier registration
    exists in the booking archive, which begins in 2020, so anyone whose first She
    Sharp event was before then counts as new and the figure is a floor. Employers
    are typed freehand at checkout and are never verified. The organisation table
    lists the largest groups only and does not account for every registration.
  ]
]
