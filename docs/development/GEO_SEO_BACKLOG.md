# SEO & GEO Backlog (pending tasks)

Follow-up work for the SEO/GEO initiative, prioritized. Each task is tied to a
finding from the 2026-06-23 baseline (`GEO_SEO_MONITORING.md`) or was deferred
from the initial implementation. Companion docs:
`GEO_SEO_IMPLEMENTATION_GUIDE.md` (how-to) and `GEO_SEO_MONITORING.md` (KPIs +
baseline).

Status legend: ☐ todo · ◐ in progress · ☑ done. Update as work lands.

---

## P0 — High impact, do first

### ☑ 1. Add 301 redirects for stale pre-migration URLs — DONE 2026-06-23
**Done**: Added `redirects()` to `next.config.ts` (permanent/308) covering the
confirmed dead paths plus `/about-us/*` and a `/media/*` catch-all → `/resources`.
Verified locally: each old URL 308s to the correct target; live routes unaffected.

**Why**: The search index still serves the old URL structure, and all of them
returned **404** on production (verified 2026-06-23). 404s waste link equity
and leave crawlers/users on dead ends; 301s consolidate signals onto the current
URLs and speed de-indexing of the old ones.

**Where**: `next.config.ts` → `redirects()`. Mapping shipped (all were 404):

| Old (indexed, 404) | New (301 target) |
| --- | --- |
| `/about-us` | `/about` |
| `/contact-us` | `/contact` |
| `/media/news-and-press` | `/resources/in-the-press` |
| `/media/podcasts` | `/resources/podcasts` |
| `/mentorship/mentorship-program` | `/mentorship` |

Use `permanent: true`. Also audit for other legacy paths (e.g. `/media/*`,
`/media/newsletters`, `/about-us/*`) by checking GSC's "Pages → Not indexed →
404" report once data accrues, and extend the map. After deploy, verify each old
URL returns `308/301` to the new target (Next emits 308 for permanent redirects,
which search engines treat as 301-equivalent).

### ☑ 2. Old domain `shesharp.co.nz` — RESOLVED ENOUGH (deprioritized)
**Why (original)**: Baseline showed `shesharp.co.nz` URLs in results — a feared
duplicate-content / brand-dilution risk.

**Status (2026-06-23) — not actually a problem**: `shesharp.co.nz` already
**302-redirects to `shesharp.org.nz`** for every path (verified:
`curl -sI http://shesharp.co.nz/` → `302 Location: http://shesharp.org.nz`). So it
is **not serving competing content**; the baseline simply reflects old `.co.nz`
pages Google indexed before this forward existed, which a 302 (vs 301) is slow to
drop. WHOIS: registered via **Crazy Domains** (Dreamscape), created 2015-03-12,
privacy-protected, updated 2026-03-19 (i.e. around the `.org.nz` migration → likely
still org-controlled, but **not under the current owner's account**).

**Decision**: Deprioritized — not blocking. The only remaining gain is cosmetic
(upgrade the **302 → 301** and point straight to `https://www.shesharp.org.nz`
with path preserved instead of the current `http://shesharp.org.nz` chain), which
needs the Crazy Domains/Freeparking login the owner doesn't hold. **Optional
follow-up**: ask internally who controls that registrar account to flip 302→301.
Otherwise the canonical-side signals on `.org.nz` will consolidate it over time.

### ☑ 3. Request re-crawl / clean up GSC — DONE 2026-06-23
**Why**: Accelerate replacing stale results with current ones.

**Status (2026-06-23)**:
- **Done**: Requested indexing (URL Inspection) for `/about`, `/contact`,
  `/resources/in-the-press`, `/resources/podcasts`, `/mentorship` — all added to a
  priority crawl queue (used the **Domain** property; the URL-prefix property
  rejected the www URLs).
- **Done**: Deleted all **15 junk sitemap entries** (individual page paths wrongly
  submitted as sitemaps on 2026-05-04). The Sitemaps list now shows only
  `sitemap.xml` — Success, 119 URLs (GSC will re-fetch to 121 on its own).
- **Skipped (by decision)**: temporary Removals for the 5 old dead URLs — the 301s
  are the durable fix. Revisit only if old URLs still rank prominently in ~2–3
  weeks, using exact-URL (not prefix) removals.

---

## P1 — Strengthen topical authority & structured data

### ☐ 4. FAQPage structured data on key pages — BLOCKED (needs FAQ content first)
**Why**: FAQ schema is strong for both rich results and AI extraction (LLMs love
Q&A pairs). Helps the "broad category" weakness from the baseline.

**Status (2026-06-23)**: Deferred. The `/mentorship` "How the Programme Works"
section is a **step timeline** (Apply → Get Paired → Meet & Grow), not Q&A, and
no other page has genuine FAQ content. Google requires FAQPage schema to match
visible Q&A on the page — adding it without real FAQ copy would violate the
guidelines. **Prerequisite**: author a visible FAQ section (e.g. on `/mentorship`
or `/donate`) first, then add an `faqSchema(items)` builder and inject it.

### ☑ 5. Person + team structured data on `/about` — DONE 2026-06-23
**Done**: Added `personSchema(member)` to `lib/seo/schema.ts` and inject
`teamMembers.map(personSchema)` via `<JsonLd>` in `app/(site)/about/layout.tsx`.
Emits a Person node per team member shown on the page (name, jobTitle from roles,
`worksFor` → Organization @id, `sameAs` LinkedIn, image, trimmed bio). Verified:
16 Person nodes render on `/about`, founder Mahsa McCauley included. Matches the
visible team grid (`components/about/team-section.tsx`).

### ☑ 6. Add the mentor/mentee landing pages to the sitemap — DONE 2026-06-23
**Done**: Added `/mentorship/mentor` and `/mentorship/mentee` (priority 0.7) to
`STATIC_ROUTES` in `app/sitemap.ts`. Sitemap now 121 URLs.

### ☐ 7. Per-page OG/share images
**Why**: Better social/AI preview cards; currently all pages share `/og-cover.png`.

**Where**: Add `app/(site)/events/[slug]/opengraph-image.tsx` (dynamic, drawing
event title/date) and section-level OG images where it adds value. Optional —
medium effort.

---

## P2 — Performance, polish, nice-to-have

### ☐ 8. Re-evaluate the root `force-dynamic`
**Why**: `app/layout.tsx` exports `export const dynamic = 'force-dynamic'`, so
every page is server-rendered per request — worse TTFB and no static/edge
caching, both of which affect SEO (Core Web Vitals) and crawl efficiency.

**Where**: `app/layout.tsx`. Investigate whether the `getUser()`-driven session
fallback can move to a client/segment boundary so public marketing pages can be
static or PPR-cached. **Higher risk** — touches auth/session rendering; scope and
test carefully (this was explicitly out of scope for the initial SEO work).

### ☐ 9. Self-canonicals on remaining indexable pages (optional)
**Why**: Currently legal/resources-subpages emit no canonical (Google
self-canonicalizes by URL — correct, but explicit is tidier and guards against
future param/duplication).

**Where**: Add `alternates.canonical` to resources sub-pages and legal pages.
Low value (no current duplication risk); do only if touching those files anyway.

### ☐ 10. Image alt text & internal-link audit
**Why**: Alt text and descriptive internal anchors aid both accessibility and
crawler/LLM understanding.

**Where**: Audit event/gallery/team images for meaningful `alt`; ensure key pages
interlink with descriptive anchor text (not "click here").

---

## Recurring

### ☐ 11. Monthly baseline re-run (scheduled)
Re-run the target-query table in `GEO_SEO_MONITORING.md` monthly and compare to
the 2026-06-23 baseline. **Success markers**: old URLs gone from the index,
current facts (3000+ members, CC57025) reflected in AI answers, She Sharp
appearing in the broad "women in tech NZ" answer. A one-month reminder
(≈2026-07-23) was scheduled to run the first comparison.
