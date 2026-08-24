// Provenance layer — every number in this report carries its source.
//
// A metric is a dictionary shaped `(value: 103, src: "verified", note: "…")`.
// `src` is one of:
//   "verified"     — taken from a named system of record; renders plainly
//   "not-recorded" — the measurement was never taken; renders as an em dash
//   "placeholder"  — invented so the page could be laid out; renders FLAGGED
//   "estimate"     — derived, not measured; renders FLAGGED
//   "projected"    — a forecast; renders FLAGGED
//
// The three flagged states are collectively FAKE. A `final` build refuses to
// compile while any of them survives, so a placeholder cannot reach a reader
// by being forgotten.
//
// "not-recorded" is deliberately NOT in FAKE, and the distinction is the whole
// reason it exists. A placeholder is a number we have not got yet — it will
// arrive, and the build blocks until it does. `not-recorded` is the opposite:
// the finding that no number exists, because nobody measured. That is itself a
// verified statement about a system of record, so it survives a FINAL build.
//
// The alternative — writing 0 — is a lie with a plausible shape. The two Youth
// Tech sessions ran no check-in scanner; `0` under a tile labelled "Attended"
// reads as nobody coming to a workshop that demonstrably happened, on the only
// page in this report about children. An em dash says what actually happened.
//
// Gaps follow RULE 1 (below-side only) — see report/theme/theme.typ.

#import "../theme/theme.typ": *

// ─── Build mode ─────────────────────────────────────────────────────────────
// Set from the command line: `typst compile --input mode=final …`
#let MODE = sys.inputs.at("mode", default: "draft")
#let FAKE = ("placeholder", "estimate", "projected")

// ─── Tree walk ──────────────────────────────────────────────────────────────
// Recursively collects every FAKE metric in a data tree. Handles nested
// dictionaries, arrays, and leaf metric dicts. Returns an array of
// `(path: "D.events.total", src: "placeholder")`.
//
// A dict is treated as a LEAF metric the moment it carries both `value` and
// `src` — so a metric may itself hold sub-keys (`note`, `unit`) without the
// walk descending into them and inventing phantom paths.
#let walk(node, path: "D") = {
  let out = ()
  if type(node) == dictionary {
    if "value" in node and "src" in node {
      if node.src in FAKE {
        out.push((path: path, src: node.src))
      }
    } else {
      for (k, v) in node.pairs() {
        out += walk(v, path: path + "." + k)
      }
    }
  } else if type(node) == array {
    for (i, v) in node.enumerate() {
      out += walk(v, path: path + "[" + str(i) + "]")
    }
  }
  out
}

// ─── The final-build gate ───────────────────────────────────────────────────
// Returns the stale list in BOTH modes (draft callers use it to print the
// register). In `final` mode a non-empty list panics the compile, naming every
// offending path so the operator knows exactly what to go and fix.
//
// Call it for its side effect with `#let _ = assert-final-clean(D)` — calling
// it bare in markup would render the returned array onto the page.
#let assert-final-clean(data) = {
  let stale = walk(data)
  if MODE == "final" and stale.len() > 0 {
    panic(
      "FINAL build blocked — "
        + str(stale.len())
        + " metric(s) are still placeholder/estimate/projected:\n"
        + stale.map(s => "  " + s.path + "   [" + s.src + "]").join("\n")
        + "\n\nEdit report/data/report-data.typ: replace each value with the real"
        + " figure and set src: \"verified\". Nothing else unblocks a final build.",
    )
  }
  stale
}

// ─── Number formatting helpers ──────────────────────────────────────────────
// Thousands separators. Exported so data/section files can pass it as `fmt`.
#let commas(v) = {
  let n = int(calc.round(v))
  let neg = n < 0
  let s = str(calc.abs(n))
  let len = s.len()
  let out = ""
  for (i, c) in s.clusters().enumerate() {
    out += c
    let rest = len - i - 1
    if rest > 0 and calc.rem(rest, 3) == 0 { out += "," }
  }
  if neg { "-" + out } else { out }
}

// ─── The metric renderer ────────────────────────────────────────────────────
// `num(m)` is the ONLY way a number should reach the page. A verified metric
// renders as plain text and is typographically invisible; anything else gets an
// amber highlight plus a superscript initial (P / E / J), so a placeholder is
// impossible to mistake for a fact at a glance.
//
// A `not-recorded` metric renders as a muted em dash with NO highlight and NO
// superscript. It is not an unverified number that a reader should discount; it
// is a verified statement that no measurement was taken, and the page copy
// beside it says so. Flagging it amber would say the opposite.
//
// `fmt` receives the raw `value` and returns a string — pass `commas` for big
// integers, or any custom closure. The em-dash branch short-circuits BEFORE
// `fmt` is called, because `value` is `none` there and every formatter in this
// repository (`commas`, the `pct` and `money` closures below) would fail on it.
// That guard is why `pct()` and `money()` need no `none` handling of their own:
// they delegate here and their closures never run.
#let num(m, fmt: v => str(v)) = {
  if m.src == "not-recorded" or m.value == none {
    text(fill: ink-500, [—])
  } else if m.src == "verified" {
    fmt(m.value)
  } else {
    let shown = fmt(m.value)
    box(
      fill: flag-fill,
      stroke: (bottom: 0.7pt + flag-ink),
      outset: (y: 1.6pt),
      inset: (x: 1.5pt),
      shown,
    )
    super(text(fill: flag-ink, weight: "bold", upper(m.src.slice(0, 1))))
  }
}

#let pct(m, digits: 0) = num(
  m,
  fmt: v => (if digits == 0 { str(int(calc.round(v))) } else { str(calc.round(v, digits: digits)) }) + "%",
)

// `digits` exists because the finance figures are cents-precise and `commas()`
// rounds: $1,334.84 printed as "$1,335", and the $42.80 gap between what
// Humanitix recorded as earned and what it settled disappeared entirely at
// `digits: 0`. That gap is named in the report precisely because it must not be
// hidden. Default stays 0, so every existing call site renders as before.
//
// Cents are computed as an INTEGER before the split, so 1.999 carries into the
// whole part instead of rendering "1.100".
#let money(m, prefix: "$", digits: 0) = num(
  m,
  fmt: v => {
    if digits == 0 {
      prefix + commas(v)
    } else {
      let scale = calc.pow(10, digits)
      let neg = v < 0
      let units = int(calc.round(calc.abs(v) * scale))
      let whole = int(calc.floor(units / scale))
      let frac = str(units - whole * scale)
      while frac.len() < digits { frac = "0" + frac }
      (if neg { "-" } else { "" }) + prefix + commas(whole) + "." + frac
    }
  },
)

// ─── Draft marking ──────────────────────────────────────────────────────────
// Deliberately NOT a page-covering watermark. A diagonal wash across every page
// makes the design impossible to judge, and the person reading a draft of this
// report is judging the design. The amber number markers above are what make
// placeholder DATA unmissable; this only needs to stop a PDF from being
// forwarded by someone who did not read the covering note.
//
// Two marks, both at the page edge: a slim ribbon top-right, and a strapline
// along the bottom. Evaluates to nothing in `final`.
//
// Both sit on a near-white chip rather than being tinted type on the bare page.
// A purple-on-transparent ribbon disappeared completely over a brand-purple
// `plate()`, and the amber strapline was illegible there too — the mark has to
// survive a full-bleed dark photograph as well as the pale canvas, and the chip
// is the only thing that holds in both. On the canvas it reads as barely-there
// white-on-pink, which is the intended discretion.
#let draft-mark = if MODE != "final" {
  place(
    top + right,
    dy: 13mm,
    box(
      fill: white.transparentize(12%),
      radius: (left: 3pt),
      inset: (x: 4mm, y: 1.6mm),
      text(
        font: display,
        size: 7.5pt,
        weight: 700,
        stretch: 75%,
        tracking: 0.18em,
        fill: brand.transparentize(15%),
        "DRAFT",
      ),
    ),
  )
  place(
    bottom + left,
    dx: page-margin,
    dy: -6.5mm,
    box(
      fill: white.transparentize(18%),
      radius: 2pt,
      inset: (x: 2mm, y: 1mm),
      text(
        font: body-font,
        size: 6.5pt,
        fill: flag-ink,
        tracking: 0.04em,
        "draft · contains placeholder data · not for circulation",
      ),
    ),
  )
}

// ─── Page background composer ───────────────────────────────────────────────
// BOTH `sheet()` and `plate()` set their page background through this, so a
// full-bleed photo page cannot quietly lose its draft marking by overpainting
// it — `under` is drawn first, `draft-mark` always last.
#let bg(under: none) = {
  if under != none { under }
  draft-mark
}

// ─── Placeholder register ───────────────────────────────────────────────────
// A draft-only appendix listing every number the report is still guessing at,
// so the reviewer has one checklist instead of hunting amber boxes.
//
// It lists exactly what `walk()` returns, so `not-recorded` metrics are absent
// from it by construction — they are not outstanding work.
#let placeholder-register(data) = {
  if MODE == "final" { return }
  let stale = walk(data)
  block(above: 0pt, below: 0pt, {
    block(above: 0pt, below: gap-para, {
      text(font: display, size: size-h2, weight: 700, stretch: 75%, fill: flag-ink,
        upper("Placeholder register"))
    })
    block(above: 0pt, below: gap-para, {
      set par(leading: lead-meta)
      text(font: body-font, size: size-meta, fill: ink-700,
        if stale.len() == 0 [
          Every metric in this draft is marked #text(weight: 600)[verified]. A final
          build will compile.
        ] else [
          #str(stale.len()) metric#(if stale.len() == 1 { "" } else { "s" }) below are
          not yet verified. A #text(weight: 600)[final] build will refuse to compile
          until each is replaced with a real figure in
          #text(weight: 600)[report/data/report-data.typ].
        ])
    })
    if stale.len() > 0 {
      table(
        columns: (1fr, auto),
        stroke: (x, y) => (bottom: 0.5pt + hairline),
        inset: (x: 0pt, y: 4pt),
        align: (left + horizon, right + horizon),
        table.header(
          text(font: body-font, size: size-micro, weight: 600, fill: ink, "Metric path"),
          text(font: body-font, size: size-micro, weight: 600, fill: ink, "Flag"),
        ),
        ..stale
          .map(s => (
            text(font: body-font, size: size-source, fill: ink-700, s.path),
            text(font: body-font, size: size-source, weight: 600, fill: flag-ink, s.src),
          ))
          .flatten()
      )
    }
  })
}
