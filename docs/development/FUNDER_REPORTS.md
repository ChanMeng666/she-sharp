# Funder reports

> **The Typst projects are no longer in this repository.** `report/` (the
> sponsor/funder-facing half-year report) and `report-internal/` (the internal
> record) moved to **`NZ-SheSharp/she-sharp-reports`** on 2026-09-01. Everything
> about how they are built — the provenance constructors and the `-Final` gate,
> the WebP→JPEG conversion, the vendored fonts and their verified axes, the
> structural page count, the honesty rules — travelled with the code and lives in
> that repo's `README.md` and `PITFALLS.md`. This file no longer restates it,
> because a copy here would drift the first time either is edited.

## What stayed here

**The data and the generators.** `scripts/internal-report/build-record.ts`,
`scripts/humanitix/`, `scripts/mailchimp/`, `lib/data/humanitix.*`,
`lib/data/mailchimp.*` and `lib/data/json/{humanitix,mailchimp}/` are all still
in this repository, and they stayed for a reason worth stating: building the
internal record **reconciles what the website claims against what the platforms
recorded**, so it has to read the live `lib/data/{events,sponsors,team,stats}`
modules. Splitting those out would have made the record a comparison against a
snapshot rather than against the site.

The two repositories therefore point at each other by environment variable: the
reports repo reads this one through **`SHESHARP_REPO_DIR`**, and
`build-record.ts` writes into the reports repo through **`SHESHARP_REPORTS_DIR`**.

**The poster fonts** moved from `report/fonts/` to `scripts/events/fonts/` rather
than leaving with the Typst projects, because `scripts/events/` renders event
posters and needs them. `scripts/events/fonts.test.ts` guards them, in the
`verify-image-paths` CI job.

## The published PDFs, which are this repo's business

The finished editions are **not** in `public/`. They live on Vercel Blob and are
referenced through constants in `lib/config/assets.ts` —
`IMPACT_REPORT_2024_PDF` and `IMPACT_REPORT_2025_PDF` — which
`lib/data/impact-reports.ts` turns into the entries `/resources` links.

`public/docs/` is not a committed directory, and a build must never recreate it:
dropping a 31-page binary inside the Next.js static tree puts it into every build
artifact, clone and deployment upload, which is the whole reason the PDFs were
moved to Blob.

**Shipping an edition is therefore two manual steps, not a build output.** Upload
to the Blob store under a **new** filename, then add a new constant in
`lib/config/assets.ts` and point `/resources` at it. **Never overwrite an
existing Blob asset** — they are cached immutable for a year, so an overwrite
keeps serving the old bytes with no way to bust it. A half-year edition also
needs a `period?: string` on `types/impact-report.ts`, which is keyed by `year`
alone; that was open as at 2026-08-24. See `docs/ARCHITECTURE.md` §6.
