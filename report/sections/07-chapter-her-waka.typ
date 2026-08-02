// Page 7 — chapter divider: HER WAKA.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": chapter
#import "../lib/assets.typ": photo

#let chapter-her-waka-page() = chapter(
  "HER WAKA",
  img: photo("chapter-her-waka"),
  number: "02",
  kicker: "Navigating pathways into sustainable employment",
  tint: ink,
)
