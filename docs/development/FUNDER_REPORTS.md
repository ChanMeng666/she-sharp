# Funder Reports (Typst → PDF)

> Moved from CLAUDE.md 2026-08-13. The how-to is `report/README.md`; the rules
> the compiler cannot catch are `report/PITFALLS.md`. This file is the record of
> *why* the project is shaped the way it is. CLAUDE.md points here.

`report/` builds **`public/docs/she-sharp-half-year-report-2026-h1.pdf`** — a 30-page A4 sponsor/funder-facing report for Jan–Jun 2026, in the visual language of the prior editions (`she-sharp-impact-report-{2024,2025}.pdf`). Shipped 2026-08-01 (PR #93). It is a **Typst** project, not part of the Next.js build; nothing imports it and `pnpm build` never touches it.

```powershell
pwsh report/build.ps1          # draft → report/out/  (-Png for page previews)
pwsh report/build.ps1 -Final   # the shipping PDF — BLOCKED while any metric is unverified
```

**Read `report/PITFALLS.md` before editing anything under `report/`.** Every rule in it is a bug the compiler does not catch, and its second half covers the failures that layout rules cannot catch at all. `report/README.md` is the how-to.

- **Every number carries its provenance.** Metrics are dicts `(value, src: "verified"|"placeholder"|"estimate", note)`. `report/data/report-data.typ` is the **single file to edit** when real data arrives. Unverified figures render with an amber marker in draft and `panic()` a `-Final` build. **64 are unverified today** — that is the honest state of H1 2026's measurement, not a defect. The gate also covers `sector-all-metrics`, which lives outside `D`.
- **Typst cannot read WebP usefully** — it decodes to raw Flate at 14–17× (a 73 KB WebP adds 1.26 MB). `report/scripts/prepare-assets.mjs` converts to JPEG via `sharp` first; the whole event archive and curated pool are WebP, so skipping this step yields a ~65 MB PDF instead of 3.9 MB. `report/assets/` is **committed** so the PDF rebuilds without `sharp` or a network.
- **Fonts are vendored** in `report/fonts/` with their OFL notices — Typst cannot read woff2. Verified axes: Bricolage Grotesque wght 200–800 (default **800**), wdth **75–100%**, opsz 12–96pt (default 96pt); Instrument Sans wght 400–700; Carattere static 400. `stretch: 75%, weight: 800` is what reproduces the 2025 report's condensed display type. Always set weight and size explicitly — the defaults are traps.
- **Page count is structural**: every section is a scoped `#page()` call, so a spacing change can only overflow the page it is on. Draft = 30 content pages + a draft-only placeholder register; final = 30.
- **Charts**: native Typst for ~85%, CeTZ 0.3.4 (in the local package cache, so offline) for donut/funnel only, each with a dependency-free fallback behind `USE-CETZ`. `cetz-plot` is deliberately unused.
- **Honesty rules that are load-bearing for this document**, all learned the hard way and documented in `PITFALLS.md`: no participant-feedback figures exist for H1 2026 (no survey ran, so the charts were removed rather than marked); no employment outcome is claimed for HER WAKA (nothing tracks it); the 25 March mentor records were a **batch import of offline-confirmed mentors** — copy says "onboarded", never "applied"; only two testimonials in `lib/data/testimonials.ts` are real people and even their employers there are fabricated; `lib/data/stats.ts` is marketing copy contradicted by the repo's own registers.
- **Still outstanding, and not fixable in code**: actual H1 finances and cost-per-participant (fields exist in `report-data.typ`, nothing populates them), participant demographics against MSD referral criteria, and a safeguarding statement for the youth workshops. Listing a half-year edition on `/resources` also needs a `period?: string` on `types/impact-report.ts`, which is keyed by `year` only.

## Note: the published PDFs no longer live in `public/`

`report/build.ps1 -Final` still writes to `public/docs/`, but `public/docs/` is no
longer a committed directory — the impact-report PDFs were moved to Vercel Blob
and are referenced through `lib/config/assets.ts`
(`IMPACT_REPORT_2024_PDF`, `IMPACT_REPORT_2025_PDF`). Shipping a new edition
therefore ends with an upload to the Blob store and a new constant in that file,
not with a commit of the binary. See the asset strategy section of
`docs/ARCHITECTURE.md`.
