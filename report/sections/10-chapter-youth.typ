// Page 14 — chapter divider: Youth Tech Series.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": chapter
#import "../lib/assets.typ": photo

#let chapter-youth-page() = chapter(
  "Youth Tech Series",
  img: photo("chapter-youth"),
  number: "03",
  // "…for the first time" came off this kicker when it was an unmeasured claim
  // set in caps across a full-bleed photograph: it rested on
  // `first-time-participants`, which was then a placeholder and was printed
  // nowhere. That metric is now v(22), reconciled against the Humanitix export —
  // but the kicker stays as it is, because a chapter heading is exactly where an
  // unsupportable claim hides. NO HEADING IN THIS REPORT CARRIES AN AMBER MARKER,
  // so a claim made in one reads as established fact whether or not the number
  // behind it is verified. The figure is stated on the page itself, in a source
  // note that can carry its definition; a full-bleed capital letter cannot.
  kicker: "Rangatahi, electronics and AI in a West Auckland school hall",
  tint: ink,
)
