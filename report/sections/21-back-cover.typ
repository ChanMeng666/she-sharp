// Page 30 — back cover.
//
// Carries the four things a funder's document system, and a funder's lawyer,
// actually look for: who this is, the charity registration number, how to reach
// a human, and what period the document covers.
//
// The Carattere `She#` wordmark is the ONLY place in the report the brand script
// face is used. It is a signature, not a typeface — using it anywhere else would
// spend the effect.
//
// `org.email` and every URL come through as STRING literals. Do not "fix" them
// by escaping the `@`: escaping applies inside `[...]` markup only, and `"\@"`
// in a string renders a visible backslash. Interpolating a plain string into
// markup is already safe.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": plate
#import "../lib/metrics.typ": bg
#import "../lib/assets.typ": brand-logo
#import "../data/report-data.typ": report-title, period
#import "../data/copy.typ": back-cover, back-cover-invitation
#import "../data/sources.typ": org

#let back-cover-page() = page(
  margin: 0pt,
  header: none,
  footer: none,
  numbering: none,
  fill: brand,
  background: bg(),
  {
    place(top + left, dx: 18mm, dy: 22mm, block(width: 150mm, {
      // RULE 2 — each visual line is its own block. A linebreak() + v() pair
      // renders the v() as ZERO, because weak spacing collapses against
      // paragraph margins and a linebreak creates none.
      block(above: 0pt, below: 9pt, text(
        font: body-font, size: size-micro, weight: 600, tracking: 0.2em,
        fill: white.transparentize(25%), upper(period),
      ))
      block(above: 0pt, below: 0pt, text(
        font: display, size: 40pt, weight: display-weight,
        stretch: display-stretch, fill: white, report-title,
      ))
    }))

    // Anchored to the TOP at a fixed offset, not to `horizon`. Centring it left
    // a dead band of roughly 90mm between the title and this block, and the
    // page read as though something had failed to load. Sitting it directly
    // under the title makes the remaining space deliberate rather than orphaned.
    place(top + left, dx: 18mm, dy: 78mm, block(width: 116mm, {
      block(above: 0pt, below: 11pt, {
        set par(leading: 0.66em, justify: false)
        text(font: body-font, size: 11pt, fill: white.transparentize(8%),
          back-cover-invitation)
      })
      block(above: 0pt, below: 0pt, {
        set par(leading: 0.66em)
        text(font: body-font, size: size-body, fill: white.transparentize(28%),
          back-cover)
      })
    }))

    place(bottom + left, dx: 18mm, dy: -26mm, block(width: 160mm, {
      block(above: 0pt, below: 5pt, text(
        font: body-font, size: size-body, weight: 600, fill: white, org.email,
      ))
      block(above: 0pt, below: 5pt, text(
        font: body-font, size: size-body, fill: white.transparentize(22%), org.site,
      ))
      block(above: 0pt, below: 0pt, text(
        font: body-font, size: size-source, fill: white.transparentize(42%),
        org.legal-name + " · Registered charity " + org.charity-number
          + " · " + org.base,
      ))
    }))

    // THE REAL WORDMARK, not type set to imitate it.
    //
    // This was previously "She\#" typeset in Carattere at 54pt. That is not the
    // She Sharp logo — it is a script face bent into roughly its shape, and the
    // one place in a document where a brand must be exact is the back cover.
    // public/logos/she-sharp-logo-white.png is the actual white wordmark and is
    // already the asset the website ships.
    place(bottom + right, dx: -18mm, dy: -20mm, {
      box(width: 46mm, image(brand-logo("she-sharp-logo-white.png"), width: 100%))
    })

    place(bottom + right, dx: -18mm, dy: -14mm, block(width: 78mm, align(right, {
      text(font: body-font, size: size-source, fill: white.transparentize(55%))[
        Set in Bricolage Grotesque, Instrument Sans and Carattere, all under the
        SIL Open Font License.
      ]
    })))
  },
)
