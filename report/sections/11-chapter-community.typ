// Page 17 — chapter divider: Community & partner events.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": chapter
#import "../lib/assets.typ": photo

#let chapter-community-page() = chapter(
  // "Community evenings", matching the contents page verbatim. All three were
  // 5:00–7:30pm events, so it is also the more accurate word. A divider whose
  // title does not match its own table of contents is the kind of small
  // inconsistency that makes a careful reader start checking everything else.
  "Community evenings",
  // A real `plate` asset. This previously pointed at `mosaic-iwd`, which is a
  // 620px-wide MOSAIC rendition — a thumbnail role — stretched across a full A4
  // page. It was the lowest-resolution image in the document by a wide margin.
  // The mosaic key has been removed from the manifest entirely so it cannot be
  // reached for a full-page use again.
  img: photo("chapter-community"),
  number: "04",
  kicker: "Three evenings, hosted by partners across Tāmaki Makaurau",
  tint: ink,
)
