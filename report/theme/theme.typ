// She Sharp H1 2026 report — design tokens.
//
// ════════════════════════════════════════════════════════════════════════════
//  RULE 1 (BINDING): `block` above/below margins are MAX, not SUM.
//
//  Between two consecutive blocks A then B the rendered gap is
//  `max(A.below, B.above)` — NOT `A.below + B.above`. Author intent therefore
//  cannot be read off a single side.
//
//  This codebase resolves it by convention: EVERY gap token below is a
//  BELOW-side gap. There is deliberately NO `gap-*-above` token anywhere in
//  this project, and every `block(...)` in every file under report/ sets
//  `above: 0pt` explicitly and owns its spacing in `below:`.
//
//  If you find yourself wanting an `above:` gap, you want the PRECEDING block's
//  `below:` instead. Do not add one.
//
//  ONE MEASURED EXCEPTION (RULE 1b in report/PITFALLS.md): max() only
//  arbitrates between two EXPLICIT block margins. Against a plain markup
//  PARAGRAPH an explicit `above:` wins OUTRIGHT — so `above: 0pt` on a block
//  that follows prose deletes `par.spacing` and the two collide. Components
//  designed to sit directly after prose (`source-note`, `eyebrow`) therefore
//  omit `above:` entirely instead of setting it to 0pt.
// ════════════════════════════════════════════════════════════════════════════
//
// Full rule set: report/PITFALLS.md

#import "tokens.typ": *

// ─── Semantic colour aliases ────────────────────────────────────────────────
// Section files use THESE names, never the `raw-*` ones — so a brand tweak in
// styles/tokens/colors.css lands in one place.
#let ink       = raw-ink-900          // #1f1e44 — body ink, plate scrim tint
#let ink-700   = raw-ink-700          // #4a4970 — prose, lede
// #6b6a88, NOT the site's raw-ink-500 (#8281a0). On screen that token is fine;
// in print at 6.5–7pt it measures 3.47:1 on the page canvas and 3.75:1 on a
// white card, against a 4.5:1 requirement — and it is nowhere near large enough
// for the large-text exemption. It carries every source note, every portrait
// role line, every event meta line and every logo caption in this document, so
// it was the single most-used failing colour here. #6b6a88 keeps the same
// navy-violet cast and measures 4.81:1 on canvas, 5.20:1 on white.
// A funder-facing PDF is exactly the document where this gets asked about.
#let ink-500   = rgb("#6b6a88")
#let ink-300   = raw-ink-300          // #c5c4d9 — RULES AND TRACKS ONLY, never a glyph (1.58:1)
#let hairline  = raw-ink-200          // #e7e6f2 — 0.5pt rules, table lines
#let brand     = raw-purple-dark      // #9b2e83 — THE structural accent
#let brand-mid = raw-purple-mid       // #c846ab — secondary purple
#let brand-pale = raw-purple-light    // #f7e5f3 — pale purple wash
#let canvas    = raw-background       // #f9f5f8 — page fill (pale pink)
#let card      = white                // #ffffff — every card / notch surface
#let mint      = raw-mint-dark        // #b1f6e9 — solid accent block
#let mint-pale = raw-mint-light       // #effefb
#let peri      = raw-periwinkle-dark  // #8982ff — solid accent block
#let peri-soft = raw-periwinkle-soft  // #c4c1ff
#let peri-pale = raw-periwinkle-light // #f4f4fa
#let indigo    = raw-indigo-deep      // #454180
#let blue      = raw-blue             // #1378d1
#let on-brand  = white                // text on a purple fill
#let on-mint   = raw-ink-900          // text on a mint fill
#let on-peri   = white                // text on a periwinkle fill

// ─── Fonts ──────────────────────────────────────────────────────────────────
// VERIFIED variable axes (typst fonts --variants, report/fonts):
//
//   Bricolage Grotesque   Weight 200–800 (DEFAULT 800) · Stretch 75–100%
//                         · Optical Size 12–96pt (DEFAULT 96pt)
//   Instrument Sans       Weight 400–700 (default 400) · Stretch 75–100%
//   Instrument Sans Ital. Weight 400–700 · Stretch 75–100%
//   Carattere             static, Weight 400 only
//
// Two traps in that table:
//  a) Bricolage's family name as Typst sees it is "Bricolage Grotesque 96pt"
//     — the default optical-size instance is baked into the name, and the plain
//     "Bricolage Grotesque" does NOT resolve. Do not "tidy" the 96pt off the
//     end; verify with `typst fonts --font-path report\fonts --variants`. It is
//     also not worth keeping the plain name as a fallback: Typst warns on every
//     unresolved family in a stack, which would bury real warnings under a
//     dozen copies of `unknown font family: bricolage grotesque`.
//  b) Bricolage's defaults are the EXTREMES of two axes (weight 800, opsz
//     96pt). Anything that does not set `weight:` explicitly silently renders
//     ultra-bold. Always set weight AND size on display type.
#let display = ("Bricolage Grotesque 96pt",)
#let body-font = ("Instrument Sans",)
#let script-font = ("Carattere",)

// Display weights/widths used by the report. The 2025 report's look is a heavy
// CONDENSED grotesque, so display type runs at stretch 75% — the narrow end of
// Bricolage's width axis.
#let display-weight = 800
#let display-stretch = 75%
#let display-tracking = 0.01em

// ─── The eleven type-size roles ─────────────────────────────────────────────
// ELEVEN. No section file may invent a twelfth — if a new surface seems to need
// one, it belongs to one of these roles and the surface is wrong.
#let size-year    = 150pt   // cover year numerals
#let size-chapter = 46pt    // chapter-divider title
#let size-page    = 26pt    // notch page title
#let size-event   = 24pt    // event name on an event page
#let size-stat    = 34pt    // the numeral inside a stat pill
#let size-h2      = 15pt    // in-page subheads, stat-row labels
#let size-lede    = 11.5pt  // standfirst paragraph
#let size-body    = 9.5pt   // THE reading size
#let size-meta    = 8pt     // captions, roles, table cells
#let size-micro   = 7.5pt   // eyebrows, axis labels, pills
#let size-source  = 6.8pt   // provenance / footnotes

// ─── Leading, paired to the size roles ──────────────────────────────────────
// These pair with the list ratios in RULE 3 (see report/PITFALLS.md).
#let lead-lede = 0.68em
#let lead-body = 0.62em
#let lead-meta = 0.60em
#let lead-source = 0.62em
// Display leading is a SMALL number on purpose. Typst's `leading` is the gap
// between one line's bounding box and the next, and a 46pt display face already
// carries a ~46pt box — so 0.86em there renders an 85pt baseline step and a
// two-line chapter title falls apart. 0.22em gives a tight editorial stack.
#let lead-display = 0.22em   // multi-line display headings

// ─── Vertical rhythm — BELOW-SIDE GAPS ONLY (see RULE 1 at the top) ─────────
#let gap-page-title = 26pt   // notch header → first content block
#let gap-section    = 20pt   // between major blocks on a page
#let gap-block      = 13pt   // between sibling cards / stat rows
#let gap-para       = 9pt    // between paragraphs
#let gap-line       = 5pt    // between stacked lines of one unit
#let gap-caption    = 3.5pt  // image / portrait → its caption

// ─── Geometry ───────────────────────────────────────────────────────────────
#let gutter-card     = 7mm    // between cards in a grid
#let gutter-portrait = 6mm    // between portraits in the team grid
#let radius-card     = 16pt   // white content cards (matches --radius: 16px)
#let radius-notch    = 26pt   // the left-bleeding header card's RIGHT corners
#let radius-photo    = 10pt   // rectangular photos
#let page-margin     = 16mm

// ─── Chart engine switch ────────────────────────────────────────────────────
// report/lib/charts*.typ reads this. `false` falls back to the pure-Typst
// renderer, so a missing CeTZ package cache degrades instead of failing.
#let USE-CETZ = true

// ─── Provenance marker colours (report/lib/metrics.typ) ─────────────────────
#let flag-fill = rgb("#ffe9a8")   // amber highlight behind a non-verified number
#let flag-ink  = rgb("#b26a00")   // its rule, superscript and draft strapline
