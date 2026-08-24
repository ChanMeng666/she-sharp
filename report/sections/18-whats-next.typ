// Page 27 — what is already booked for H2 2026.
//
// The three named events here are REAL and already in the event register with
// dates, venues and open registration — MYOB "Working Smarter" (30 July), the
// Aotearoa AI Hackathon Festival (7–8 August) and the Les Mills event (3
// September). A commitment with a date and a venue is a different kind of
// statement from a projection, which is why this page can be specific.
//
// ── The three targets are gone ──────────────────────────────────────────────
// The page used to close with `target-cohorts` p(6), `target-registered` p(520)
// and `target-rangatahi` p(120) in a 3-up stat row under the eyebrow "What we
// are aiming for by December", with a source note explaining that they were
// unverified. No board minute, funding agreement or planning document in reach
// of this build sets any of them: this report would have been the first place
// they were ever stated. A forecast nobody has committed to is not a placeholder
// awaiting data, and the amber marker was doing work the copy should have done.
// Metrics and tiles are both deleted.
//
// What takes their place is `outlook-copy`, MOVED here from 17-outlook.typ. It
// is about HER WAKA, the Youth Tech Series, mentorship and what is still not
// measured — programme outlook, which was sitting on a page titled "Funding and
// resourcing". Nothing was written for this page; the copy is unchanged.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": source-note, eyebrow
#import "../lib/charts.typ": timeline
#import "../data/copy.typ": whats-next, outlook-copy

#let whats-next-page() = sheet(title: "What happens next")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700, whats-next)
  ]

  #block(above: 0pt, below: gap-line, width: 100%)[
    #eyebrow("Already in the diary", fill: brand)
  ]

  // `dot-ring: canvas`, not the component default. This timeline sits on the
  // bare page rather than inside a `chart-card`, and the default white ring
  // gives every dot a white collar on the pale pink canvas — the component's own
  // header documents the choice.
  #block(above: 0pt, below: gap-section, width: 100%)[
    #timeline((
      (date: "30 JUL", label: "Working Smarter, with MYOB"),
      (date: "7 AUG", label: "Aotearoa AI Hackathon Festival, with AUT and the AI Forum"),
      (date: "3 SEP", label: "Les Mills, Auckland"),
    ), dot-ring: canvas)
  ]

  #block(above: 0pt, below: gap-line, width: 100%)[
    #eyebrow("And the work behind them", fill: ink-500)
  ]

  // EXPLICIT HEIGHT, and it is load-bearing. `columns()` does not balance: it
  // fills column one to the height of its container and only then flows into
  // column two, and for any columns block that is not the last thing on the page
  // that container is the whole remaining page — so every word lands in column
  // one and column two renders empty. It compiles clean. Re-measure if this copy
  // changes. (Same trap, same fix, as the HER WAKA shape page.)
  #block(above: 0pt, below: gap-section, width: 100%, height: 62mm)[
    #set text(font: body-font, size: size-body, fill: ink-700,
      lang: "en", region: "nz", hyphenate: true)
    #set par(leading: lead-body, justify: true, spacing: gap-para)
    #columns(2, gutter: 8mm, outlook-copy)
  ]

  // NO TARGETS, AND THE NOTE NO LONGER EXPLAINS ANY. The old source note existed
  // almost entirely to say that the three figures above it were unverified. With
  // the figures gone, what is left to say is what the page IS: three confirmed
  // commitments, and the reason there is nothing forecast beside them.
  #source-note[
    All three events are confirmed, with dates, venues and partners agreed and
    registration open at the time of writing — they are records in the same event
    register every attendance figure in this report is drawn from, not
    intentions. This report sets no numeric target for the second half-year,
    because none has been agreed: nothing in She Sharp's board minutes, funding
    agreements or planning documents states one, and a report is not the place to
    invent the first. The full-year report will carry results.
  ]
]
