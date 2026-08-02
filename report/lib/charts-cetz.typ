// CeTZ charts — the ONLY file in this project that imports a Typst package.
//
// Two primitives live here, and only two: `donut` and `funnel`. Everything else
// the report draws is native Typst in charts.typ. Keeping the package surface
// to one file and two shapes is the whole point — a dependency you can delete
// in one place is a dependency you can survive losing.
//
// ── Why cetz 0.3.4, and why not cetz-plot ───────────────────────────────────
// 0.3.4 is what is in the local package cache
// (%LOCALAPPDATA%\typst\packages\preview\cetz\0.3.4), so this compiles offline.
// `cetz-plot` is deliberately NOT used: it is not cached, pulling it would
// force a cetz major upgrade, and it is an axis framework — we would write more
// code switching its axes, ticks, grid and legend OFF than the two shapes below
// take to draw from scratch.
//
// ── The USE-CETZ switch, and its one honest limit ───────────────────────────
// `USE-CETZ` (theme/theme.typ) selects between the cetz rendering and a native
// fallback for both functions, so a plainer report is always reachable.
//
// BUT: Typst imports are STATIC. The `#import "@preview/cetz:0.3.4"` on the
// next line is evaluated whether or not `USE-CETZ` is true, so flipping the
// flag does NOT rescue a build whose package cache has actually gone missing —
// nothing can, from inside this file.
//
// The real escape hatch is that the fallbacks do not live here. `donut-native`
// and `funnel-native` are defined in charts.typ, which imports NOTHING. If the
// cache is ever lost, a section file changes its import from
//     #import "../lib/charts-cetz.typ": donut, funnel
// to
//     #import "../lib/charts.typ": donut-native as donut, funnel-native as funnel
// and the report builds with no package involved at all. That is why the
// fallback bodies are in the dependency-free file rather than duplicated here;
// this file owns the DISPATCH, charts.typ owns the drawing.

#import "@preview/cetz:0.3.4"

#import "../theme/theme.typ": *
#import "metrics.typ": num
#import "charts.typ": (
  bar-radius, donut-native, funnel-native, legend, pct-fmt,
)

// Shared with charts.typ — rows may be ("Label", metric) or (label:, metric:).
#let _row-label(r) = if type(r) == dictionary { r.label } else { r.at(0) }
#let _row-metric(r) = if type(r) == dictionary { r.metric } else { r.at(1) }
#let _hue(palette, i) = {
  if type(palette) == array { palette.at(calc.rem(i, palette.len())) } else { palette }
}

// ─── donut (cetz) ───────────────────────────────────────────────────────────
// Drawn as filled PIE sectors with a disc punched out of the middle, NOT as a
// thick-stroked arc. A stroked ring puts the stroke centre on the radius, so
// its true outer edge is radius + thickness/2 and the bounding box is wrong by
// half a stroke — which shifts the whole canvas inside its card. Sectors plus a
// centre disc give an exact bbox and an exact inner radius.
//
// Angles run CLOCKWISE from 12 o'clock (start 90deg, decreasing), which is how
// a reader expects a proportion wheel to run.
//
// `hole-fill` must match the surface the donut sits on — it is a punched disc,
// not real transparency. Default `card` (white); pass `canvas` on a bare page
// or the ring appears to sit on a white coin.
#let _donut-cetz(segments, palette: chart-palette, size: 34mm, hole: 0.58, hole-fill: card) = {
  let values = segments.map(s => calc.max(0, _row-metric(s).value))
  let total = values.sum()

  cetz.canvas(length: size / 2, padding: none, {
    import cetz.draw: *

    if total == 0 {
      // Nothing to apportion. Draw the empty ring so the card still holds a
      // chart-shaped object rather than collapsing to a hole in the layout.
      circle((0, 0), radius: 1, fill: hairline, stroke: none)
      circle((0, 0), radius: hole, fill: hole-fill, stroke: none)
    } else {
      let cursor = 90deg
      for (i, v) in values.enumerate() {
        // A zero-value segment MUST be skipped: cetz asserts start != stop and
        // would panic the whole compile on `Angle must be greater than 0deg`.
        // Its legend row still appears (charts.typ `legend` is driven by the
        // segment list, not by what got drawn), so the category is not hidden.
        if v > 0 {
          let span = 360deg * (v / total)
          arc(
            (0, 0),
            start: cursor,
            stop: cursor - span,
            anchor: "origin",
            radius: 1,
            mode: "PIE",
            fill: _hue(palette, i),
            stroke: none,
          )
          cursor = cursor - span
        }
      }
      circle((0, 0), radius: hole, fill: hole-fill, stroke: none)
    }
  })
}

// ─── funnel (cetz) ──────────────────────────────────────────────────────────
// Tapering trapezoid bands: band i runs from its own width at the top to the
// NEXT stage's width at the bottom, so the taper itself shows the drop-off. The
// last band is a rectangle at its own width — there is no stage after it to
// taper toward, and guessing one would invent data.
//
// Geometry is in units where ONE UNIT = one band height, and `length: band`
// converts. That is what lets the caller's label column line up: the canvas is
// exactly `n * band + (n - 1) * gap` tall, which is precisely what a Typst grid
// with `rows: (band,) * n, row-gutter: gap` measures. Any other unit choice
// makes the labels drift a fraction of a band per row.
#let _funnel-cetz(stages, palette: chart-palette, band: 14pt, gap: 4pt, shape-width: 42mm, min-frac: 0.14) = {
  let values = stages.map(s => calc.max(0, _row-metric(s).value))
  // `mouth`, not `top` — a local `top` shadows Typst's `top` alignment.
  let mouth = calc.max(..values)
  let n = values.len()

  // Length ratios, not absolute lengths — `length: band` scales the drawing.
  let w-units = shape-width / band
  let g-units = gap / band

  // Half-width of stage i, in units, with the same visibility floor as
  // `funnel-native`: a stage worth 2% of the funnel's mouth would otherwise
  // render as a hairline and the reader would lose a step entirely.
  let half(i) = {
    let raw = if mouth == 0 { 0.0 } else { values.at(i) / mouth }
    calc.max(min-frac, raw) * w-units / 2
  }

  cetz.canvas(length: band, padding: none, {
    import cetz.draw: *
    for i in range(n) {
      // y runs downward from 0; each band is 1 unit tall plus the gap.
      let y-top = -1 * i * (1 + g-units)
      let y-bot = y-top - 1
      let a = half(i)
      let b = if i + 1 < n { half(i + 1) } else { a }
      line(
        (-a, y-top), (a, y-top), (b, y-bot), (-b, y-bot),
        close: true,
        fill: _hue(palette, i),
        stroke: none,
      )
    }
  })
}

// ─── Public: donut ──────────────────────────────────────────────────────────
// Event feedback "areas for improvement" (used 9×) and the platform
// match-outcome ring.
//
// Dispatches on USE-CETZ. The native path is `donut-native` from charts.typ —
// one stacked horizontal bar, same palette, same segment order, same legend —
// so the fallback reads as a plainer chart of the same data rather than as a
// missing chart.
//
// Both paths put the legend in a second column, so a section file's grid does
// not have to change when the flag flips.
//
// `legend-cols: 1` is right for the half-width card this normally sits in. In a
// FULL-width card the single legend column is very wide and its right-aligned
// values end up stranded at the card's far edge, a long way from the labels
// they belong to — pass `legend-cols: 2` there.
#let donut(
  segments,
  palette: chart-palette,
  fmt: v => str(v),
  size: 34mm,
  hole: 0.58,
  hole-fill: card,
  legend-cols: 1,
) = block(
  above: 0pt, below: 0pt, breakable: false, width: 100%,
  {
    if segments.len() == 0 { return }
    if USE-CETZ {
      grid(
        columns: (size, 1fr),
        column-gutter: 5mm,
        align: (horizon + center, horizon + left),
        _donut-cetz(
          segments, palette: palette, size: size, hole: hole, hole-fill: hole-fill,
        ),
        legend(
          segments.enumerate().map(((i, s)) => (
            label: _row-label(s), hue: _hue(palette, i), metric: _row-metric(s),
          )),
          cols: legend-cols,
          fmt: fmt,
        ),
      )
    } else {
      donut-native(segments, palette: palette, fmt: fmt, legend-cols: 2)
    }
  },
)

// ─── Public: funnel ─────────────────────────────────────────────────────────
// The mentorship platform pipeline (users → profiles → matched → active) and
// the HER WAKA registered → checked-in → completed funnel.
//
// Labels are Typst content in a parallel column, NOT cetz `content()` inside
// the canvas. Two reasons: text placed inside a canvas widens its bounding box,
// so a long stage name would silently shrink the shape it is labelling; and the
// value has to route through `num()`, whose amber placeholder marker belongs in
// ordinary text flow where it is unmistakable.
//
// ⚠️  A FUNNEL IS ONLY HONEST FOR A MONOTONICALLY DECREASING SEQUENCE. The
// geometry is truthful, not clamped: feed it 37 → 33 → 9 → 21 and band 3 tapers
// down while band 4 flares back out, and the shape reads as an hourglass rather
// than a funnel. That is the data being wrong, not the chart — but check the
// ordering before reaching for this instead of `bar-h`. Deliberately NOT
// clamped to decreasing, because silently drawing a narrowing shape over
// widening numbers would be the chart lying about the data.
#let funnel(
  stages,
  palette: chart-palette,
  fmt: v => str(v),
  // 16pt, not 14pt: at 14pt a two-line stage label overflows its slot and
  // collides with the next one.
  band: 16pt,
  gap: 4pt,
  // 42mm, not 52mm: in the half-width card this normally sits in, 52mm left
  // under 20mm for the label column and two-word stage names ("Profiles
  // completed") wrapped to two lines and overflowed their 16pt slot.
  shape-width: 42mm,
  min-frac: 0.14,
) = block(
  above: 0pt, below: 0pt, breakable: false, width: 100%,
  {
    if stages.len() == 0 { return }
    if USE-CETZ {
      grid(
        columns: (shape-width, 1fr),
        column-gutter: 5mm,
        align: (top + center, top + left),
        _funnel-cetz(
          stages,
          palette: palette, band: band, gap: gap,
          shape-width: shape-width, min-frac: min-frac,
        ),
        // Labels are PLACED at an explicit dy, not laid out as grid rows.
        //
        // The obvious `grid(rows: (band,) * n, row-gutter: gap)` mirrors the
        // canvas geometry only while every label fits on one line. A grid row
        // height is a MINIMUM: the moment one label wraps ("Profiles
        // completed" at a narrow column width), that row grows, every row
        // below it shifts down, and the labels silently desynchronise from the
        // bands they name — the failure is invisible in the source and obvious
        // only in the render. `place` at `i * (band + gap)` cannot drift,
        // whatever the label does.
        //
        // A label too tall for `band` now overlaps its neighbour instead of
        // pushing it, which is the better failure: it is unmissable.
        // stage rows: each label owns a `band`-tall slot (default 16pt) against
        // 7.5pt × 0.60em = 4.50pt of leading — 3.6×, well over RULE 3's 1.7×.
        block(
          above: 0pt, below: 0pt, width: 100%,
          height: stages.len() * band + (stages.len() - 1) * gap,
          {
            for (i, s) in stages.enumerate() {
              place(top + left, dy: i * (band + gap), block(
                above: 0pt, below: 0pt, width: 100%, height: band,
                grid(
                  columns: (1fr, auto),
                  rows: (band,),
                  column-gutter: 2.5mm,
                  align: (horizon + left, horizon + right),
                  text(font: body-font, size: size-micro, weight: 500, fill: ink-700,
                    _row-label(s)),
                  text(font: body-font, size: size-micro, weight: 700, fill: ink,
                    num(_row-metric(s), fmt: fmt)),
                ),
              ))
            }
          },
        ),
      )
    } else {
      funnel-native(stages, palette: palette, fmt: fmt, band: band, min-frac: min-frac)
    }
  },
)
