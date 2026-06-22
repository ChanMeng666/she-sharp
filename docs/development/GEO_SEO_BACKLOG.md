# SEO & GEO Backlog (pending tasks)

Follow-up work for the SEO/GEO initiative, prioritized. Each task is tied to a
finding from the 2026-06-23 baseline (`GEO_SEO_MONITORING.md`) or was deferred
from the initial implementation. Companion docs:
`GEO_SEO_IMPLEMENTATION_GUIDE.md` (how-to) and `GEO_SEO_MONITORING.md` (KPIs +
baseline).

Status legend: ☐ todo · ◐ in progress · ☑ done. Update as work lands.

---

## P0 — High impact, do first

### ☐ 1. Add 301 redirects for stale pre-migration URLs
**Why**: The search index still serves the old URL structure, and all of them
now return **404** on production (verified 2026-06-23). 404s waste link equity
and leave crawlers/users on dead ends; 301s consolidate signals onto the current
URLs and speed de-indexing of the old ones.

**Where**: `next.config.ts` → add a `redirects()` function. Confirmed dead → new
mapping (all currently 404):

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

### ☐ 2. Retire the competing old domain `shesharp.co.nz`
**Why**: Baseline showed `shesharp.co.nz` still ranking — a duplicate-content /
brand-dilution risk against the canonical `shesharp.org.nz`.

**Where**: DNS/hosting (Cloudflare) — **browser/infra task, not code**. Set a
domain-level 301 redirect `shesharp.co.nz/*` → `https://www.shesharp.org.nz/*`,
or at minimum point it at the canonical site. Confirm with the owner whether the
`.co.nz` domain is still controlled.

### ☐ 3. Request re-crawl / removal of dead URLs in GSC
**Why**: Accelerate replacing stale results with current ones.

**Where**: Google Search Console — **browser task**. After task 1 ships: use
**URL Inspection → Request indexing** on the key new URLs (`/about`, `/contact`,
`/resources/in-the-press`, `/mentorship`), and optionally **Removals** for the
worst dead URLs. Clean up the legacy "Couldn't fetch" sitemap entries (deletion
is irreversible — confirm first).

---

## P1 — Strengthen topical authority & structured data

### ☐ 4. FAQPage structured data on key pages
**Why**: FAQ schema is strong for both rich results and AI extraction (LLMs love
Q&A pairs). Helps the "broad category" weakness from the baseline.

**Where**: Add an `faqSchema(items)` builder in `lib/seo/schema.ts`; inject via
`<JsonLd>` on `/mentorship` (the "how it works" content) and `/donate` /
`/sponsors/corporate-sponsorship` (common questions). Keep visible on-page copy
matching the schema (Google requires the answer to be present on the page).

### ☐ 5. Person + team structured data on `/about`
**Why**: Surfaces leadership (e.g. founder Dr. Mahsa McCauley) as entities AIs can
attribute quotes/facts to.

**Where**: `organizationSchema()` could gain `founder` / `employee` Person nodes,
or add a `personSchema()` and emit on `/about` from `lib/data/team.ts`. Keep it to
the core team; do not enumerate 120+ mentors.

### ☐ 6. Add the mentor/mentee landing pages to the sitemap
**Why**: `/mentorship/mentor` and `/mentorship/mentee` are indexable, footer-linked
landing pages but are **not** in `STATIC_ROUTES` (only `/mentorship` and the
`/apply` sub-pages are). They should be discoverable.

**Where**: `app/sitemap.ts` → add both paths (priority ~0.7).

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
