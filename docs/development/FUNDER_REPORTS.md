# Funder Reports (Typst → PDF)

> Moved from CLAUDE.md 2026-08-13. The how-to is `report/README.md`; the rules
> the compiler cannot catch are `report/PITFALLS.md`. This file is the record of
> *why* the project is shaped the way it is. CLAUDE.md points here.

`report/` builds **`report/out/she-sharp-half-year-report-2026-h1.pdf`** — a 31-page A4 sponsor/funder-facing report for Jan–Jun 2026, in the visual language of the prior editions (`she-sharp-impact-report-{2024,2025}.pdf`). Shipped 2026-08-01 (PR #93). It is a **Typst** project, not part of the Next.js build; nothing imports it and `pnpm build` never touches it.

```powershell
pwsh report/build.ps1          # draft → report/out/  (-Png for page previews)
pwsh report/build.ps1 -Final   # final → report/out/  — BLOCKED while any metric is unverified
```

**Read `report/PITFALLS.md` before editing anything under `report/`.** Every rule in it is a bug the compiler does not catch, and its second half covers the failures that layout rules cannot catch at all. `report/README.md` is the how-to.

- **Every number carries its provenance.** Metrics are dicts `(value, src, note)`, written through four constructors in `report/data/report-data.typ`: `v(value, note)` verified, `na(note)` not-recorded, `p(value)` placeholder, `e(value, note)` estimate (plus `projected`). The last three are FAKE: they render with an amber marker in draft and `panic()` a `-Final` build. `report/data/*.typ` is the **only** place to edit when real data arrives; a section file that hard-codes a figure is a bug. The gate also covers `sector-all-metrics`, which lives in `data/sources.typ` outside `D`.
- **`na()` is not a placeholder, and that is the point.** A placeholder is a number that has not arrived and the build waits for it. `na(note)` records that the measurement was never taken, which is a verified statement about a system of record, so it survives a final build and renders as an em dash. It exists because the two Youth Tech sessions ran no check-in scanner: `0` under a tile labelled "Attended" would read as nobody coming to a workshop that demonstrably happened, on the only pages in the report about children. Use it only where writing `0` would be a plausible-looking lie.
- **Do not write the unverified count into prose.** This file and `report/README.md` both said **64** for weeks while the real figure was 29, and it is now 0. `pwsh report/build.ps1 -Final` is the answer: it either builds or names every offending file and line. The grep in `build.ps1` and `assert-final-clean()` in `report/lib/metrics.typ` are two implementations of one rule and must agree — they disagreed by a factor of 3.5 until 2026-08-24, when the grep was fixed to stop reading comment prose as metric calls.
- **Typst cannot read WebP usefully** — it decodes to raw Flate at 14–17× (a 73 KB WebP adds 1.26 MB). `report/scripts/prepare-assets.mjs` converts to JPEG via `sharp` first; the whole event archive and curated pool are WebP, so skipping this step yields a ~65 MB PDF instead of 3.9 MB. `report/assets/` is **committed** so the PDF rebuilds without `sharp` or a network.
- **Fonts are vendored** in `report/fonts/` with their OFL notices — Typst cannot read woff2. Verified axes: Bricolage Grotesque wght 200–800 (default **800**), wdth **75–100%**, opsz 12–96pt (default 96pt); Instrument Sans wght 400–700; Carattere static 400. `stretch: 75%, weight: 800` is what reproduces the 2025 report's condensed display type. Always set weight and size explicitly — the defaults are traps.
- **Page count is structural**: every section is a scoped `#page()` call, so a spacing change can only overflow the page it is on — and it does so silently, exiting 0. Both builds are **31** pages: the placeholder register renders a sheet only when it has something to list, so draft and final no longer drift apart. A page count that changes is a real finding; on 2026-08-24 a 32nd page turned out to be two paragraphs of methodology stranded on an otherwise blank sheet.
- **Charts**: native Typst for ~85%, CeTZ 0.3.4 (in the local package cache, so offline) for donut/funnel only, each with a dependency-free fallback behind `USE-CETZ`. `cetz-plot` is deliberately unused.
- **Honesty rules that are load-bearing for this document**, all learned the hard way and documented in `PITFALLS.md`: no participant-feedback figures exist for H1 2026 (no survey ran, so the charts were removed rather than marked); no employment outcome is claimed for HER WAKA (nothing tracks it); the 25 March mentor records were a **batch import of offline-confirmed mentors** — copy says "onboarded", never "applied"; only two testimonials in `lib/data/testimonials.ts` are real people and even their employers there are fabricated; `lib/data/stats.ts` is marketing copy contradicted by the repo's own registers.
- **What the money in it is.** Event income is ticket earnings **net of platform fees** plus voluntary checkout donations — not gross, not what attendees paid. Organisation-level income and expenditure are the filed annual returns on the Charities Register (CC57025); **H1 2026 falls in the current financial year and has not been filed**, so there is no H1 income statement to quote and the report shows the two filed years instead.
- **What remains unmeasured is a decision, not a missing export.** Employment outcomes (nothing She Sharp operates tracks whether a participant got a job), participant demographics against MSD referral criteria (not collected at registration), and post-event feedback (no survey ran in H1 2026, so the satisfaction charts were removed rather than marked). None of these is waiting on a file someone forgot to download.
- **Still outstanding outside `report/`**, both verified as open on 2026-08-24: a safeguarding statement for the youth workshops with 12–18-year-olds (`docs/development/PHOTOGRAPHING_MINORS.md` covers publishing photographs of children and is not a substitute), and a `period?: string` on `types/impact-report.ts`, which is keyed by `year` only, so a half-year edition can be listed on `/resources`.

## Note: the published PDFs no longer live in `public/`

`public/docs/` is not a committed directory — the impact-report PDFs were moved
to Vercel Blob and are referenced through `lib/config/assets.ts`
(`IMPACT_REPORT_2024_PDF`, `IMPACT_REPORT_2025_PDF`). `report/build.ps1 -Final`
used to write into `public/docs/`, silently recreating it and dropping a 31-page
binary inside the Next.js static tree; since 2026-08-24 it writes to
`report/out/` alongside the draft, under a distinct filename.

**A final build therefore produces a file, not a publication.** Shipping an
edition is two manual steps the script prints on success: upload to the Blob
store under a **new** filename, then add a new constant in `lib/config/assets.ts`
and point `/resources` at it. Never overwrite an existing Blob asset — they are
cached immutable for a year, so an overwrite keeps serving the old bytes with no
way to bust it. See the asset strategy section of `docs/ARCHITECTURE.md`.
