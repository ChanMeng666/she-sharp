// Page 28 — thank you. A full-bleed plate, no furniture.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": plate
#import "../lib/assets.typ": photo

// TWO problems fixed by one rewrite.
//
// 1. PROVENANCE. The photograph comes from the site-wide curated pool, which
//    records no date and no event — and it shows "Secure Code Secure Aotearoa"
//    shirts beside a Xero banner. Neither organisation is among the seven H1
//    2026 partners; both are on the historical supporter wall. A kicker reading
//    "who made this half-year" over people from a different period is a claim
//    the image itself disproves to anyone who recognises the shirts.
//
// 2. A VANISHING WORD SPACE. It previously rendered "THISHALF-YEAR". The
//    document-wide `show regex(...): box(it)` rule that stops hyphenated
//    compounds breaking across lines also swallows the tracking on the space
//    immediately before the boxed run — against 0.18em-tracked caps that reads
//    as no space at all. This kicker was the only one of the four containing a
//    hyphenated compound, which is why it was the only one showing it.
//
// Dropping the period claim fixes the first and removes the compound, and with
// it the second.
#let thanks-page() = plate(
  photo("chapter-thanks"),
  title: "Thank you",
  kicker: "To everyone who has made She Sharp what it is",
  tint: ink,
)
