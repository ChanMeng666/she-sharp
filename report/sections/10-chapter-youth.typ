// Page 14 — chapter divider: Youth Tech Series.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": chapter
#import "../lib/assets.typ": photo

#let chapter-youth-page() = chapter(
  "Youth Tech Series",
  img: photo("chapter-youth"),
  number: "03",
  // "…for the first time" was an unmeasured claim set in caps across a full-bleed
  // photograph. It rests on `first-time-participants`, which is a placeholder,
  // is never printed, and is not recorded anywhere. No heading in this report
  // carries an amber marker, so a claim made in one reads as established fact.
  kicker: "Rangatahi, electronics and AI in a West Auckland school hall",
  tint: ink,
)
