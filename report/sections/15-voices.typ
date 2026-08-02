// Page 24 — community voices.
//
// ONLY TWO QUOTES, AND THAT IS THE POINT. lib/data/testimonials.ts holds 19
// testimonials; 17 are dicebear placeholders with invented names and invented
// employers (Sarah Chen / Microsoft, Emma Wilson / Datacom, ...). They are
// unusable in a document a funder may verify.
//
// The two real ones carry a further trap: testimonials.ts attaches FABRICATED
// employers to them too — Meeta Patel appears as "Senior Director, Global Tech
// Corp" when team.ts has her at academyEX. So data/copy.typ carries names and
// quoted words only, with the mentoring relationship as the attribution line.
// Nothing here asserts an employer.
//
// Both speakers are from EARLIER cohorts. `voices-intro` says so, because H1
// 2026 recorded no mentoring relationships at all and a reader is entitled to
// assume otherwise from a page like this.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": quote-card, source-note

#import "../data/copy.typ": voices-intro, voices

#let voices-page() = sheet(title: "Community voices")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700, voices-intro)
  ]

  #for (i, vc) in voices.enumerate() {
    block(above: 0pt, below: gap-block, width: 100%, {
      quote-card(
        vc.long,
        vc.name + " · " + vc.line,
        fill: if calc.rem(i, 2) == 0 { mint } else { brand-pale },
        ink-color: if calc.rem(i, 2) == 0 { on-mint } else { ink },
      )
    })
  }

  // NO PHOTOGRAPH HERE ANY MORE. It went from 62mm to 44mm and then out
  // altogether, each time because the closing source note was being pushed onto
  // a page of its own. What finally displaced it was restoring the two
  // quotations to their verbatim length — which is content that must not be cut,
  // against decoration that can be. Both women are quoted in full and the page
  // holds; that is the right way round.

  // NOT "quoted with permission" — nothing in this repository records a
  // permission. Both quotations come from She Sharp's own published
  // testimonials, which is a checkable claim; "with permission" is not.
  #source-note[
    Both quotations are reproduced from She Sharp's published mentorship
    testimonials, verbatim apart from one marked cut. Neither is from the 2026
    half-year: no mentoring relationship was recorded in the reporting period, so
    these are the voices of earlier cohorts describing the programme this
    half-year was spent rebuilding.
  ]
]
