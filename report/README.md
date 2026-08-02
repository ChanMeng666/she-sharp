# She Sharp — H1 2026 impact report

A print-quality PDF built with [Typst](https://typst.app) 0.15, in the visual
language of the 2025 impact report (`public/docs/she-sharp-impact-report-2025.pdf`).

```powershell
pwsh report/build.ps1              # draft PDF
pwsh report/build.ps1 -Png         # ... plus 150ppi page previews to look at
pwsh report/build.ps1 -Final       # the shipping PDF (blocked while data is unverified)
```

**Read `report/PITFALLS.md` before editing anything here.** Its first half is
layout bugs the compiler does not catch; its second half is the failures the
layout rules cannot catch at all — invented sources, claims in headings, prose
that outlived the chart it described. A clean compile proves nothing about
either.

---

## Status

**30 content pages.** Draft builds add a placeholder register that vanishes in a
final build. Shipped 2026-08-01 (PR #93).

**`-Final` is currently blocked by design** — 64 metrics are still unverified.
That is the honest state of this half-year's measurement, and the gate exists so
it cannot be published as if it were not.

### What is needed to unblock a final build

Editing **`data/report-data.typ` alone** should be enough. If any other file
needs touching, the data layer has leaked and that is the bug.

| Needed | Where it goes | Why it is missing |
|---|---|---|
| Attendance for 5 of 9 events | `D.events.<slug>.*` | Never exported from the booking platform. The 5 May cohort's export is *broken*, not empty — it shows 5 registrations for a session with a full speaker line-up and a photo gallery. |
| Returning attendees, organisations | `D.events.<slug>.*` | The 2025 report sourced these from the company name entered at ticket checkout, so the field exists; it has not been exported for this period. |
| H1 income, expenditure, cost per participant | `D.finance.*` | Held in accounting records outside this repository. `programme-funding`, `surplus` and `cost-per-participant` are already defined and unused — wiring them is a page, not a schema change. |
| Employment outcomes | — | **Not tracked by any system She Sharp operates.** The report says so rather than estimating. Needs a measurement decision before it needs a number. |
| Participant demographics | — | Not collected. The largest gap for an MSD-funded employment programme. |

Two things the report cannot fix for itself: a **safeguarding statement** for the
youth workshops with 12–18-year-olds, and a `period?: string` field on
`types/impact-report.ts` so a half-year edition can be listed on `/resources`
(that type is keyed by `year` alone).

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
