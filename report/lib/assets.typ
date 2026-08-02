// Asset path resolution.
//
// Every path returned here is ABSOLUTE-FROM-REPO-ROOT, because the report is
// compiled with `--root .` from D:\github_repository\she-sharp. A relative
// path would resolve against the calling .typ file and break the moment a
// section moves.
//
// Never write an image path inline in a section file — go through these
// helpers, so the raster-fallback map below is impossible to bypass.

// ─── Photos ─────────────────────────────────────────────────────────────────
// Produced by report/scripts/prepare-assets.mjs, which converts the site's
// WebP/PNG originals to JPEG (Typst reads PNG/JPEG/GIF/SVG — not WebP).
#let photo(key) = "/report/assets/photos/" + key + ".jpg"

// ─── Sponsor / partner logos ────────────────────────────────────────────────
// Default source is the site's own SVG set, which keeps marks crisp at any slot
// size and costs a few KB each.
//
// RASTER-FALLBACK is the exception list. Two things force a slug onto it:
//
//  a) SIZE. An "SVG" that is really a base64-encoded bitmap inside a
//     `<pattern>` costs its full byte weight AT EVERY PLACEMENT — Typst does
//     not deduplicate identical embedded images across placements the way it
//     does for a file-backed raster. `wahine-kakano.svg` is ~500 KB of base64;
//     three appearances would add 1.5 MB to a report with a 20 MB ceiling.
//
//  b) COLOUR. `currentColor` is NOT inherited by `image()` — Typst renders the
//     SVG verbatim, so a mark that relies on inheriting its fill from
//     surrounding `text(fill: …)` comes out black or unfilled. There is no way
//     to tint an SVG from the call site, so such a mark must be pre-rendered to
//     a PNG with its colour baked in.
//
// To add one: put the PNG in report/assets/logos/<slug>.png (prepare-assets.mjs
// handles the conversion) and add the slug here.
// A slug listed here resolves to report/assets/logos/logo-<slug>.png instead.
// The three Ministry / youth-partner marks are here for a third reason: they
// were never SVG in the first place (MOE.png — note the capitalised original
// filename — peyvand-academy.jpg, little-engineers.jpg), so the .svg default
// below would 404 at compile time.
#let RASTER-FALLBACK = (
  "wahine-kakano": true,    // ~500 KB base64 raster inside an SVG <pattern>
  "msd": true,              // 123 KB; pre-rendered for weight
  "moe": true,              // source is MOE.png — no SVG exists
  "peyvand-academy": true,  // source is .jpg — no SVG exists
  "little-engineers": true, // source is .jpg — no SVG exists
)
// `aifnz` was on this list and had to come OFF it: no logo-aifnz.png was ever
// generated, so `logo("aifnz")` resolved to a missing file and would have failed
// the compile the moment the sponsor wall rendered — on page 23, long after the
// pages that exercise this module. Its SVG is 60 KB of paths and clips with no
// embedded raster, so it needs no fallback; at two placements that is ~120 KB
// against a 20 MB ceiling. Anything added here must have its PNG committed.

#let logo(slug) = if slug in RASTER-FALLBACK {
  "/report/assets/logos/logo-" + slug + ".png"
} else {
  "/public/img/sponsors/" + slug + ".svg"
}

// ─── She Sharp's own marks ──────────────────────────────────────────────────
// e.g. brand-logo("she-sharp-logo-purple.svg"), brand-logo("she-sharp-logo-white.png")
#let brand-logo(name) = "/public/logos/" + name

// ─── Team portraits ─────────────────────────────────────────────────────────
// Converted, not used in place. The site's headshots are 200 KB–1 MB PNGs; at
// 27 mm in a circular crop that is pure waste, and Typst re-encodes PNG at
// ~1.7x anyway. prepare-assets.mjs emits square 460px JPEGs cropped with
// libvips' `attention` strategy so faces stay centred in the circle.
// `name` is the lowercase first name, e.g. team-photo("mahsa").
#let team-photo(name) = photo("team-" + name)

// ─── Generated diagrams ─────────────────────────────────────────────────────
// Mermaid sources rendered by the build's -Diagrams step, then palette-
// quantised to PNG by prepare-assets.mjs.
#let diagram(key) = "/report/assets/diagrams/" + key + ".png"
