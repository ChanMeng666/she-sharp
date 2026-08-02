# She Sharp — H1 2026 impact report

A print-quality PDF built with [Typst](https://typst.app) 0.15, in the visual
language of the 2025 impact report (`public/docs/she-sharp-impact-report-2025.pdf`).

```powershell
pwsh report/build.ps1              # draft PDF
pwsh report/build.ps1 -Png         # ... plus 150ppi page previews to look at
pwsh report/build.ps1 -Final       # the shipping PDF (blocked while data is unverified)
```

**Read `report/PITFALLS.md` before editing anything here.** Every rule in it is a
layout bug the compiler does not catch — a clean compile proves nothing.

---

## Layout

```
report/
├── theme/
│   ├── tokens.typ      GENERATED from styles/tokens/colors.css — do not edit
│   └── theme.typ       semantic colours, fonts, the 11 type sizes, gap tokens
├── lib/
│   ├── metrics.typ     provenance: MODE, walk, assert-final-clean, num, draft-mark, bg
│   ├── layout.typ      page furniture: sheet, plate, notch, chapter, spread, report-setup
│   ├── components.typ  stat-row, stat-card, portrait, logo-wall, quote-card, …
│   └── assets.typ      photo / logo / brand-logo path resolution + RASTER-FALLBACK
├── data/               the report's numbers and copy
├── sections/           one file per page
├── scripts/
│   ├── gen-tokens.mjs      colors.css to theme/tokens.typ
│   └── prepare-assets.mjs  site images to report/assets (Typst cannot read WebP)
├── fonts/              vendored OFL faces — the build pins these with --font-path
└── build.ps1
```

## The compile command

Always from the **repo root**, never from `report/`:

```powershell
typst compile --root . --font-path report\fonts --input mode=draft report\she-sharp-h1-2026.typ report\out\draft.pdf
```

- `--root .` makes every image path absolute-from-repo-root, so a `.typ` file can
  move between directories without rewriting its images. Use the helpers in
  `lib/assets.typ` rather than writing paths inline.
- `--font-path report\fonts` pins the four vendored faces. Without it the build
  silently substitutes whatever the OS font book has.
- `--input mode=draft|final` drives the provenance layer.

## Every number carries its source

A metric is a dict: `(value: 716, src: "verified", note: "Humanitix export")`.
`src` is one of `verified` · `placeholder` · `estimate` · `projected`.

- `num(m)` renders a **verified** metric as plain text, and anything else with an
  amber highlight and a superscript initial. A placeholder cannot be mistaken for
  a fact at a glance. `value` may be a number **or a string** — the default
  formatter passes strings straight through, so `(value: "12–18", …)` works.
  Only `commas` / `pct()` / `money()` require a numeric `value`.
- `assert-final-clean(D)` **panics a `--input mode=final` compile** while any
  unverified metric survives, naming every path. `build.ps1 -Final` runs the same
  check first so the failure names a file and line.
- `placeholder-register(D)` prints a draft-only checklist of everything still
  being guessed at.

Draft marking is deliberately **not** a page-covering watermark — the reader of a
draft is judging the design, and a diagonal wash makes that impossible. It is a
slim ribbon top-right plus a footer strapline, both on a near-white chip so they
survive a full-bleed dark plate as well as the pale canvas. The amber number
markers are what make placeholder *data* unmissable.

## Adding a page

Sections are scoped `#page()` calls, so one section is one page:

```typst
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": stat-row

#sheet(title: "2026 in a glance")[
  #stat-row(D.events.total, "Number of events")
]
```

Never `set page(...)` plus flowing content — see rule 5 in `PITFALLS.md`.

## Regenerating brand tokens

`theme/tokens.typ` is generated and carries a DO-NOT-EDIT banner. If the site's
palette changes:

```powershell
node report/scripts/gen-tokens.mjs
```

It reads only the `:root` block of `styles/tokens/colors.css` and only variables
whose value is a literal hex. The shadcn semantic layer stores bare HSL triples,
which are meaningless to Typst, so those are skipped rather than mistranslated.
The 5-stop chart palette is declared in the script, because the `--chart-N`
variables are HSL and therefore invisible to the parser.
