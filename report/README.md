# She Sharp — H1 2026 impact report

A print-quality PDF built with [Typst](https://typst.app) 0.15, in the visual
language of the 2025 impact report (`IMPACT_REPORT_2025_PDF` in
`lib/config/assets.ts` — the published PDFs live on Vercel Blob, not in
`public/`).

```powershell
pwsh report/build.ps1              # draft  → report/out/she-sharp-h1-2026-DRAFT.pdf
pwsh report/build.ps1 -Png         # ... plus 150ppi page previews to look at
pwsh report/build.ps1 -Final       # final  → report/out/she-sharp-half-year-report-2026-h1.pdf
```

**Both modes write into `report/out/`, which is gitignored.** A final build
produces a file, not a publication: shipping it is an upload to the Blob store
under a **new** filename plus a new constant in `lib/config/assets.ts`. Blob
assets are cached immutable for a year, so an overwrite serves stale bytes with
no way to bust it. `build.ps1` prints both steps when a final build succeeds.

**Read `report/PITFALLS.md` before editing anything here.** Its first half is
layout bugs the compiler does not catch; its second half is the failures the
layout rules cannot catch at all — invented sources, claims in headings, prose
that outlived the chart it described. A clean compile proves nothing about
either.

---

## Status

**31 content pages**, and the draft build is the same 31. The placeholder
register used to add a page to every draft, which put draft and final
permanently out of step and made a single `-ExpectPages` unusable; it now
renders a sheet only when it has something to list, and today it has nothing.
Shipped 2026-08-01 (PR #93); rebuilt against verified data 2026-08-24.

**`-Final` builds.** Every metric in the tree is either traced to a named source
or recorded as never measured.

### How many metrics are unverified

Ask the build; do not read a number here. This section said **64** for weeks
while the real figure was 29, and a count written into prose rots the moment
anyone edits `data/`. One command is the answer:

```powershell
pwsh report/build.ps1 -Final
```

It either produces a PDF, in which case none are unverified, or it refuses and
names every offending file and line. `assert-final-clean(D)` inside
`lib/metrics.typ` enforces the same rule at compile time; `build.ps1` runs a grep
version of it first so the failure arrives with a file and a line number instead
of a Typst path expression. The two are meant to agree exactly, and a change to
one without the other is a bug — they disagreed by a factor of 3.5 until
2026-08-24, because the grep was reading comment prose.

To see the state without building, run a draft: `placeholder-register(D)` prints
a draft-only checklist of everything still being guessed at.

### What the report reports, and what it does not

**The money is what passes through the booking platform and the public
register**, and it says so on the page:

- Event income is ticket earnings **net of platform fees** plus voluntary
  checkout donations — not gross, not what attendees paid.
- Organisation-level income and expenditure are the filed annual returns on the
  Charities Register (CC57025). **H1 2026 falls in the current financial year
  and has not been filed**, so no H1 income statement exists to quote.

What genuinely remains unmeasured is **not a missing export**. Nothing here is
waiting on a file someone forgot to download; each is a measurement decision
nobody has made:

| Unmeasured | Why there is no number |
|---|---|
| Employment outcomes | No system She Sharp operates tracks whether a participant got a job. Needs a decision about what to ask and when, before it needs a figure. |
| Participant demographics | Not collected at registration. The largest gap for an MSD-funded employment programme. |
| Post-event feedback | No survey ran in H1 2026, so there are no satisfaction or usefulness figures. The charts that displayed them were removed rather than marked. |

Two related figures are recorded as **never measured** rather than as zero: the
two Youth Tech sessions ran no check-in scanner, so their attendance is `na()`
and renders as an em dash. Writing `0` under a tile labelled "Attended" would
read as nobody coming to a workshop that demonstrably happened.

### Still open outside the report

Neither is fixable inside `report/`, and both were still outstanding on
2026-08-24:

- A **safeguarding statement** for the youth workshops with 12–18-year-olds.
  `docs/development/PHOTOGRAPHING_MINORS.md` covers publishing photographs of
  children and is not a substitute for one.
- A `period?: string` field on `types/impact-report.ts`, which is keyed by
  `year` alone, so a half-year edition can be listed on `/resources`.

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
`src` is one of `verified` · `not-recorded` · `placeholder` · `estimate` ·
`projected`, written through the constructors `v()` · `na()` · `p()` · `e()`.

The last three are collectively FAKE and block a final build. **`not-recorded`
is deliberately not one of them**, and the distinction is the whole reason it
exists: a placeholder is a number we have not got yet and the build waits for
it, while `na(note)` is the finding that no number exists because nobody
measured. That is itself a verified statement about a system of record, so it
survives a final build and renders as an em dash. Reach for it only where
writing `0` would be a plausible-looking lie.

- `num(m)` renders a **verified** metric as plain text, and anything else with an
  amber highlight and a superscript initial. A placeholder cannot be mistaken for
  a fact at a glance. `value` may be a number **or a string** — the default
  formatter passes strings straight through, so `(value: "12–18", …)` works.
  Only `commas` / `pct()` / `money()` require a numeric `value`.
- `assert-final-clean(D)` **panics a `--input mode=final` compile** while any
  unverified metric survives, naming every path. `build.ps1 -Final` runs the same
  check first so the failure names a file and line. It also gates
  `sector-all-metrics`, which lives in `data/sources.typ` outside `D`.
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
