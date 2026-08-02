// Native charts — pure Typst, ZERO package imports.
//
// This file draws ~85% of the report's charts with nothing but `rect`, `grid`,
// `line` and `place`. That is deliberate: exact brand colour, exact type, and no
// dependency that can vanish from a package cache and take the build with it.
// Only `donut` and `funnel` need real geometry, and those live in charts-cetz.typ
// — whose fallbacks are `bar-stacked` and `funnel-native` from THIS file.
//
// ── Conventions every function here obeys ───────────────────────────────────
//  · RULE 1 — every block sets `above: 0pt` and owns its gap in `below:`.
//             (Block margins are MAX, not SUM. There is no `above` gap token.)
//  · RULE 2 — stacked visual lines are separate blocks, never
//             `linebreak()` + `v()`: `v(weak: true)` collapses against
//             PARAGRAPH margins, and a linebreak makes no paragraph, so the
//             space silently renders as zero.
//  · RULE 3 — every legend/label stack carries its calibrated spacing ratio in
//             a comment at the call site (≥ 1.7× the within-item leading).
//  · RULE 4 — anything card-shaped is `breakable: false`.
//  · Every numeral routes through `num()` from metrics.typ, so a placeholder
//    carries its amber marker INSIDE the chart. A chart is the easiest place in
//    a report to leak a raw number; there is no bare `str(value)` in this file.
// See report/PITFALLS.md.
//
// ── Two structural notes ────────────────────────────────────────────────────
//  a) Bars are drawn as TWO `place`d rects inside a fixed-height block (track,
//     then fill), never as an inline box nested in another inline box. Inline
//     boxes sit on a baseline, so a "full height" inner box picks up a baseline
//     offset and the fill drifts a point or two off the track — visible only
//     when two charts sit side by side.
//  b) `grid` column `align:` aligns content INSIDE a cell; it does not move the
//     cell. Nothing here uses it for positioning.

#import "../theme/theme.typ": *
#import "metrics.typ": num
#import "components.typ": stat-card

// ─── Shared internals ───────────────────────────────────────────────────────

// Rows arrive as either `("Label", metric)` or `(label: …, metric: …)`.
// events.typ writes the array form (`("Keynote speaker", p(88))`), section
// files tend to write the dict form. Both are accepted everywhere.
#let _row-label(r) = if type(r) == dictionary { r.label } else { r.at(0) }
#let _row-metric(r) = if type(r) == dictionary { r.metric } else { r.at(1) }

// Palette accessor. `palette` may be an ARRAY (cycled by index) or a single
// COLOUR (every series the same hue — the 2025 report's "what went well" look).
#let _hue(palette, i) = {
  if type(palette) == array { palette.at(calc.rem(i, palette.len())) } else { palette }
}

// Bar height and corner radius, shared so every bar in the report matches.
#let bar-thickness = 9pt
#let bar-radius = 3pt

// Percentage formatter, for charts whose values are already percentages.
// Pass as `fmt: pct-fmt`.
#let pct-fmt = v => str(int(calc.round(v))) + "%"

// One horizontal bar: a full-width track with a proportional fill over it.
//
// `frac` is clamped to 0–1. An unclamped value over 1 (a metric that exceeds a
// hand-set `max:`) would silently draw past the track's right edge and off the
// card, so it is clamped and the caller sees a saturated bar instead of an
// overflow.
#let _bar(frac, hue, thickness: bar-thickness, track: hairline) = {
  let f = calc.max(0.0, calc.min(1.0, frac))
  block(above: 0pt, below: 0pt, width: 100%, height: thickness, {
    place(left + top, rect(
      width: 100%, height: thickness, fill: track, radius: bar-radius, stroke: none,
    ))
    if f > 0 {
      place(left + top, rect(
        width: f * 100%, height: thickness, fill: hue, radius: bar-radius, stroke: none,
      ))
    }
  })
}

// Micro label / value text, used by every chart so type never drifts.
#let _label-text(body, fill: ink-700, weight: 500) = text(
  font: body-font, size: size-micro, weight: weight, fill: fill, body,
)
#let _value-text(body, fill: ink) = text(
  font: body-font, size: size-micro, weight: 700, fill: fill, body,
)

// A colour swatch for a legend row.
#let _swatch(hue, size: 7pt) = box(
  width: size, height: size, fill: hue, radius: 2pt, baseline: 1pt,
)

// ─── Legend ─────────────────────────────────────────────────────────────────
// A swatch + label (+ optional value) row set, laid out as a grid rather than a
// `list`. A list cannot carry a per-item colour swatch as its marker, and a
// grid gives exact control over the spacing ratio RULE 3 is about.
//
// `entries`: array of `(label: …, hue: …, metric: none)`.
#let legend(entries, cols: 2, fmt: v => str(v)) = block(
  above: 0pt, below: 0pt, width: 100%,
  {
    // legend rows: 7.5pt × 0.60em = 4.50pt within · 8.5pt between = 1.89×
    // (RULE 3 floor is 1.70×.)
    grid(
      columns: (1fr,) * cols,
      column-gutter: 5mm,
      row-gutter: 8.5pt,
      ..entries.map(en => {
        let m = en.at("metric", default: none)
        grid(
          columns: (auto, 1fr) + (if m == none { () } else { (auto,) }),
          column-gutter: 2.5mm,
          align: (horizon, horizon + left, horizon + right),
          _swatch(en.hue),
          _label-text(en.label),
          ..(if m == none { () } else { (_value-text(num(m, fmt: fmt)),) }),
        )
      })
    )
  },
)

// ─── bar-h — the workhorse ──────────────────────────────────────────────────
// Horizontal bars: label · track · value. Used NINE times (the "what went well"
// card on every event page), so it must render identically page to page.
//
// `label-width` is a FIXED length by default, and that is the point. With
// `auto` the label column sizes to the longest label in THAT card, so the track
// starts at a different x on every event page and the nine cards stop looking
// like one recurring component. Only pass `auto` for a one-off chart.
//
// `rows`  array of ("Label", metric) or (label:, metric:)
// `max`   scale ceiling. `none` = the largest value in `rows`, so the longest
//         bar reaches the track edge. Pass `100` for percentage data that
//         should be read against a full scale rather than against its own peak.
#let bar-h(
  rows,
  palette: chart-palette,
  max: none,
  fmt: v => str(v),
  label-width: 34mm,
  value-width: 12mm,
  thickness: bar-thickness,
  track: hairline,
) = block(
  above: 0pt, below: 0pt, breakable: false, width: 100%,
  {
    let values = rows.map(r => _row-metric(r).value)
    // `calc.max` needs at least one argument; an empty chart renders nothing
    // rather than panicking mid-page.
    let ceiling = if max != none { max } else if values.len() > 0 { calc.max(..values) } else { 0 }
    if rows.len() == 0 { return }
    grid(
      columns: (label-width, 1fr, value-width),
      column-gutter: 3mm,
      // bar rows: 7.5pt × 0.60em = 4.50pt within · 9pt between = 2.00×
      row-gutter: 9pt,
      align: (horizon + left, horizon, horizon + right),
      ..rows
        .enumerate()
        .map(((i, r)) => {
          let m = _row-metric(r)
          (
            _label-text(_row-label(r)),
            _bar(
              if ceiling == 0 { 0.0 } else { m.value / ceiling },
              _hue(palette, i),
              thickness: thickness,
              track: track,
            ),
            _value-text(num(m, fmt: fmt)),
          )
        })
        .flatten()
    )
  },
)

// ─── bar-grouped ────────────────────────────────────────────────────────────
// Two or more series compared across categories — the HER WAKA cohort
// registered-vs-checked-in chart.
//
// Built as a STACK of per-category blocks rather than one tall grid, because a
// single grid has exactly one `row-gutter`: the gap between two series inside a
// cohort and the gap between two cohorts would be identical, and the bars would
// read as eight unrelated rows instead of four pairs.
//
// `series`     array of (name: "Registered", values: (m, m, …), hue: colour)
// `categories` array of label strings, one per index of `values`
#let bar-grouped(
  series,
  categories,
  palette: chart-palette,
  max: none,
  fmt: v => str(v),
  label-width: 26mm,
  value-width: 12mm,
  thickness: 8pt,
  show-legend: true,
) = block(
  above: 0pt, below: 0pt, breakable: false, width: 100%,
  {
    let all = series.map(s => s.values.map(m => m.value)).flatten()
    let ceiling = if max != none { max } else if all.len() > 0 { calc.max(..all) } else { 0 }
    let hue-of(s, i) = s.at("hue", default: _hue(palette, i))

    if show-legend {
      block(above: 0pt, below: gap-block, width: 100%, legend(
        series.enumerate().map(((i, s)) => (label: s.name, hue: hue-of(s, i))),
        cols: calc.min(series.len(), 3),
      ))
    }

    // One block per category; the LAST one owns no trailing gap.
    for (ci, cat) in categories.enumerate() {
      block(
        above: 0pt,
        below: if ci == categories.len() - 1 { 0pt } else { gap-block },
        width: 100%,
        breakable: false,
        {
          block(above: 0pt, below: gap-line, width: 100%, {
            text(
              font: body-font, size: size-micro, weight: 700,
              tracking: 0.08em, fill: ink, upper(cat),
            )
          })
          grid(
            columns: (label-width, 1fr, value-width),
            column-gutter: 3mm,
            // series rows within a cohort: 7.5pt × 0.60em = 4.50pt within
            //                              · 8pt between = 1.78×
            row-gutter: 8pt,
            align: (horizon + left, horizon, horizon + right),
            ..series
              .enumerate()
              .map(((si, s)) => {
                let m = s.values.at(ci)
                (
                  _label-text(s.name, fill: ink-500),
                  _bar(
                    if ceiling == 0 { 0.0 } else { m.value / ceiling },
                    hue-of(s, si),
                    thickness: thickness,
                  ),
                  _value-text(num(m, fmt: fmt)),
                )
              })
              .flatten()
          )
        },
      )
    }
  },
)

// ─── bar-stacked ────────────────────────────────────────────────────────────
// One bar, segmented by share of total. Used for the pipeline/outlook split and
// as the NATIVE FALLBACK for the CeTZ donut (charts-cetz.typ dispatches here
// when USE-CETZ is false).
//
// Segments are laid out as fractional grid columns inside a clipped, rounded
// box, so the bar's outer silhouette stays a clean stadium regardless of how
// many segments there are — stacking rounded rects side by side instead would
// show a notch at every join.
//
// A zero-valued segment collapses to a `0fr` column and disappears from the
// bar, but KEEPS its legend row: "this category exists and scored nothing" is
// information, and silently dropping it from the legend would hide it.
//
// `segments` array of ("Label", metric) or (label:, metric:, hue:)
#let bar-stacked(
  segments,
  palette: chart-palette,
  fmt: v => str(v),
  thickness: 16pt,
  legend-cols: 2,
  show-legend: true,
  show-values: true,
) = block(
  above: 0pt, below: 0pt, breakable: false, width: 100%,
  {
    if segments.len() == 0 { return }
    let hue-of(s, i) = if type(s) == dictionary and "hue" in s { s.hue } else { _hue(palette, i) }
    let values = segments.map(s => calc.max(0, _row-metric(s).value))
    let total = values.sum()

    block(
      above: 0pt,
      below: if show-legend { gap-block } else { 0pt },
      width: 100%,
      {
        if total == 0 {
          // Nothing to apportion — draw the empty track so the card still has a
          // chart-shaped object in it rather than a hole.
          _bar(0.0, brand, thickness: thickness)
        } else {
          box(
            width: 100%, height: thickness, radius: bar-radius, clip: true,
            grid(
              columns: values.map(v => v * 1fr),
              rows: (thickness,),
              ..segments
                .enumerate()
                .map(((i, s)) => rect(
                  width: 100%, height: thickness,
                  fill: hue-of(s, i), stroke: none,
                ))
            ),
          )
        }
      },
    )

    if show-legend {
      legend(
        segments.enumerate().map(((i, s)) => (
          label: _row-label(s),
          hue: hue-of(s, i),
          metric: if show-values { _row-metric(s) } else { none },
        )),
        cols: legend-cols,
        fmt: fmt,
      )
    }
  },
)

// ─── funnel-native ──────────────────────────────────────────────────────────
// Nested centred bars, widest at the top. This is the pure-Typst funnel: it is
// the fallback charts-cetz.typ selects when USE-CETZ is false, and it is also
// perfectly usable on its own if the package cache is ever lost — a section
// file can import `funnel-native` from here and never touch charts-cetz.typ.
//
// Each stage is centred with `place(center + top)` rather than a grid, because
// a grid cannot centre a fixed-width child inside a full-width row without
// spending two spacer columns per row.
//
// `stages` array of ("Label", metric) or (label:, metric:, hue:)
#let funnel-native(
  stages,
  palette: chart-palette,
  fmt: v => str(v),
  band: 16pt,
  min-frac: 0.14,
) = block(
  above: 0pt, below: 0pt, breakable: false, width: 100%,
  {
    if stages.len() == 0 { return }
    let hue-of(s, i) = if type(s) == dictionary and "hue" in s { s.hue } else { _hue(palette, i) }
    let values = stages.map(s => calc.max(0, _row-metric(s).value))
    // Named `mouth`, not `top`: a local `top` SHADOWS Typst's `top` alignment
    // and `place(center + top, …)` then fails with "cannot add alignment and
    // integer". Same trap as importing `v` from report-data.typ over `v()`.
    let mouth = calc.max(..values)

    grid(
      columns: (1fr, auto),
      column-gutter: 4mm,
      // funnel rows: 7.5pt × 0.60em = 4.50pt within · 8pt between = 1.78×
      row-gutter: 8pt,
      align: (horizon, horizon + left),
      ..stages
        .enumerate()
        .map(((i, s)) => {
          let m = _row-metric(s)
          // `min-frac` keeps a tiny final stage visible. Without it a stage
          // worth 2% of the top of the funnel renders as a hairline and the
          // reader loses a step entirely — the one failure a funnel must not
          // have. The floor is documented in the caption, not hidden.
          let raw = if mouth == 0 { 0.0 } else { m.value / mouth }
          let f = calc.max(min-frac, raw)
          (
            block(above: 0pt, below: 0pt, width: 100%, height: band, {
              place(center + top, rect(
                width: f * 100%, height: band,
                fill: hue-of(s, i), radius: bar-radius, stroke: none,
              ))
            }),
            grid(
              columns: (auto, auto),
              column-gutter: 2.5mm,
              align: (horizon + left, horizon + right),
              _label-text(_row-label(s)),
              _value-text(num(m, fmt: fmt)),
            ),
          )
        })
        .flatten()
    )
  },
)

// ─── donut-native ───────────────────────────────────────────────────────────
// The USE-CETZ=false rendering of a donut: one stacked bar plus its legend,
// same palette, same order. Named separately from `bar-stacked` so a section
// file that wants "the donut, however it renders" has one name to import from
// charts-cetz.typ, and the fallback path is still reachable by name from here.
#let donut-native(segments, palette: chart-palette, fmt: v => str(v), legend-cols: 2) = bar-stacked(
  segments, palette: palette, fmt: fmt, legend-cols: legend-cols, thickness: 16pt,
)

// ─── stat-wall ──────────────────────────────────────────────────────────────
// The "in a glance" block: a grid of `stat-card`s.
//
// The TILE is `stat-card` from components.typ — deliberately not reimplemented
// here. This function owns only the grid. (One-way dependency: charts.typ →
// components.typ. components.typ must never import charts.typ; `chart-card`
// there takes a rendered chart as a `body` argument precisely so it does not
// have to.)
//
// `items` array of (metric: …, label: …, fill: …, ink: …, fmt: …); `fill`,
// `ink` and `fmt` are optional per tile.
#let stat-wall(items, cols: 4, height: 26mm, gutter: gutter-card) = block(
  above: 0pt, below: 0pt, breakable: false, width: 100%,
  {
    if items.len() == 0 { return }
    grid(
      columns: (1fr,) * cols,
      column-gutter: gutter,
      row-gutter: gutter,
      ..items.map(it => stat-card(
        it.metric,
        it.label,
        fmt: it.at("fmt", default: v => str(v)),
        fill: it.at("fill", default: card),
        ink-color: it.at("ink", default: brand),
        height: height,
      ))
    )
  },
)

// ─── timeline ───────────────────────────────────────────────────────────────
// A horizontal rule with dated ticks — the four HER WAKA cohort dates
// (25 Mar / 7 Apr / 5 May / 2 Jun) and the H2 outlook.
//
// Built as THREE stacked blocks (dates / rule+dots / labels), each an n-column
// grid over the same tracks. The obvious single-grid-with-place alternative
// needs the rule's y to be known before the label heights are, which it is not:
// a two-line label under one tick would silently drag the rule off centre. With
// three blocks the rule sits at the exact middle of a band of KNOWN height, so
// it cannot drift. RULE 2 applies — these are separate blocks, not linebreaks.
//
// `points` array of (date: "25 Mar", label: "Cohort 1", metric: none)
#let timeline(
  points,
  hue: brand,
  band: 13pt,
  dot: 7pt,
  rule-color: hairline,
  // The dot's halo, which masks the rule passing behind it. It must match the
  // SURFACE, not the page: default `card` because a timeline lives inside a
  // `chart-card`. On a bare page pass `dot-ring: canvas`, or each dot wears a
  // white collar on pink.
  dot-ring: card,
) = block(
  above: 0pt, below: 0pt, breakable: false, width: 100%,
  {
    if points.len() == 0 { return }
    let n = points.len()
    let cols = (1fr,) * n

    // 1 — dates, above the line
    block(above: 0pt, below: gap-caption, width: 100%, {
      grid(
        columns: cols,
        ..points.map(p => align(center, text(
          font: body-font, size: size-micro, weight: 700,
          tracking: 0.06em, fill: hue, upper(p.date),
        )))
      )
    })

    // 2 — the rule, with a dot per point. The rule is placed FIRST and the dots
    // over it, so each dot masks the rule beneath it (same drawing order as
    // `notch()` in layout.typ).
    block(above: 0pt, below: gap-caption, width: 100%, height: band, {
      place(left + horizon, line(length: 100%, stroke: 0.9pt + rule-color))
      grid(
        columns: cols,
        ..points.map(p => align(center + horizon, box(
          width: dot, height: dot, radius: 50%,
          fill: hue, stroke: 1.6pt + dot-ring,
        )))
      )
    })

    // 3 — labels, below the line
    block(above: 0pt, below: 0pt, width: 100%, {
      grid(
        columns: cols,
        column-gutter: 2mm,
        ..points.map(p => align(center, {
          set par(leading: lead-meta, justify: false)
          let has-value = p.at("metric", default: none) != none
          // The label block OWNS the gap to the value (RULE 1). With `below: 0pt`
          // here the two blocks abut with no leading between them and the value
          // sits in the label's descenders — measured, not theorised: "AI & the
          // future of work" / "39" collided, and an amber placeholder box (which
          // carries `outset: (y: 1.6pt)`) overlapped outright.
          block(above: 0pt, below: if has-value { gap-caption } else { 0pt }, {
            _label-text(p.label, fill: ink-700)
          })
          if has-value {
            // Separate block, not a linebreak — RULE 2.
            block(above: 0pt, below: 0pt, {
              _value-text(num(p.metric, fmt: p.at("fmt", default: v => str(v))))
            })
          }
        }))
      )
    })
  },
)

// ─── comparison-bars ────────────────────────────────────────────────────────
// The NZ-sector context page: each bar carries its source citation beneath it,
// so a programme officer can check any figure without turning to an appendix.
//
// This function is deliberately DATA-AGNOSTIC — it does not import
// report/data/sources.typ. `lib/` must not depend on `data/`, or the chart
// library stops being reusable and the dependency runs backwards. The section
// file builds the rows. From sources.typ that reads:
//
//     #import "../data/sources.typ": fact
//     #import "../data/report-data.typ": v
//     #let f = fact("women-it-roles-29")
//     comparison-bars((
//       (label: "Women in professional IT roles, NZ",
//        metric: v(29, f.label), source: f.label, url: f.url),
//       …
//     ))
//
// NOTE for whoever writes that section: `sources.typ` holds the facts as PROSE
// with the numbers inside the sentence — there is no metric dict for "29%"
// anywhere in report/data/. Those metrics have to be authored alongside the
// section, each `v()` citing the fact's own `sourceLabel`.
//
// `rows` array of (label:, metric:, source:, url: none)
#let comparison-bars(
  rows,
  palette: chart-palette,
  max: 100,
  fmt: pct-fmt,
  thickness: 11pt,
) = block(
  above: 0pt, below: 0pt, breakable: false, width: 100%,
  {
    if rows.len() == 0 { return }
    for (i, r) in rows.enumerate() {
      block(
        above: 0pt,
        below: if i == rows.len() - 1 { 0pt } else { gap-block },
        width: 100%,
        breakable: false,
        {
          // Label and value share one row above the bar, so a long label can
          // wrap without squeezing the track (which it would if all three sat
          // in one three-column grid).
          block(above: 0pt, below: gap-caption, width: 100%, {
            grid(
              columns: (1fr, auto),
              column-gutter: 3mm,
              align: (bottom + left, bottom + right),
              {
                set par(leading: lead-meta, justify: false)
                _label-text(r.label, fill: ink)
              },
              // `ink`, NOT the bar's own hue. Tinting the figure to match its
              // bar reads well for the first three palette entries and then
              // fails outright on the fourth: mint (#b1f6e9) on a white card is
              // roughly 1.3:1 and the number is simply not there. The bar
              // already carries the colour; the figure has to stay readable.
              _value-text(num(r.metric, fmt: fmt), fill: ink),
            )
          })
          block(above: 0pt, below: gap-caption, width: 100%, {
            _bar(
              if max == 0 { 0.0 } else { r.metric.value / max },
              _hue(palette, i),
              thickness: thickness,
            )
          })
          // The citation. `size-source` is 6.8pt — small, but it is the thing
          // that makes the number checkable, so it is never omitted.
          block(above: 0pt, below: 0pt, width: 100%, {
            set par(leading: lead-source, justify: false)
            text(
              font: body-font, size: size-source, fill: ink-500,
              "Source: " + r.source + (
                if r.at("url", default: none) != none { " — " + r.url } else { "" }
              ),
            )
          })
        },
      )
    }
  },
)
