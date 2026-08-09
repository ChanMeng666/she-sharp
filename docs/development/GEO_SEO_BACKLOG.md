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

### ☑ 3b. "Duplicate without user-selected canonical" — FIXED 2026-07-31
**Symptom**: GSC (Domain property, "All known pages") held 4 URLs in this bucket
from 2026-06-30 through 2026-07-24 (6 until 07-11):

| URL | Last crawled |
| --- | --- |
| `www…/resources/newsletters?195c0d39_page=3` | 2026-07-13 |
| `www…/resources?10f821ec_page=9` | 2026-07-04 |
| `shesharp.org.nz/events/making-linkedin-work-for-you-with-stuart-little` (apex) | 2026-05-26 |
| `www…/media/photo-gallery?10f821ec_page=9` | 2026-04-21 |

**Root cause**: `<hash>_page=N` are **pagination params from the pre-migration
Webflow site**, still in Google's historical URL list. Next.js ignores unknown
query params and serves an identical **200**, so every variant is a duplicate.
The self-referencing canonicals were already present and correct (verified live
with a Googlebot UA), but **a canonical is a hint, not a directive**, and GSC's
index classification lags the crawl — two of the four were last crawled *before*
the 2026-06-23 canonical work shipped. Separately, `/media/photo-gallery` had no
exact mapping, so it fell into the `/media/:path*` catch-all and landed on
`/resources` (wrong target) while carrying the junk param forward, minting yet
another duplicate.

**Not a problem** (verified, no change needed): the apex → `www` 308 already
works; `sitemap.xml` is clean (120 URLs, no params, no `/media`); no `_page=`
link exists anywhere in the repo.

**Fixed**:
- `proxy.ts` — `stripLegacyPaginationParams()` 308-redirects any GET whose query
  contains a key matching `/^[0-9a-f]{6,}_page$/i`, dropping those keys. Chosen
  over `next.config.ts` `redirects()` + `has`, because `has` requires an **exact**
  query key and the hash prefix varies per Webflow collection list. Skips `/api/`
  and only redirects when something was actually stripped (no loop).
- `next.config.ts` — added `/media/photo-gallery` → `/resources/photo-gallery`
  ahead of the catch-all.
- Both `/mentorship/{mentee,mentor}/apply` layouts — set
  `robots: { index: false, follow: true }` **and a self-canonical**. They
  previously inherited the parent layout's `alternates.canonical`, i.e. declared
  themselves duplicates of `/mentorship/{mentee,mentor}`. They are gated form
  pages that `redirect()` away outside the registration window, so noindex is the
  honest signal. **Closes item 9 below.**

  **The self-canonical is load-bearing, not cosmetic.** Render-testing these
  (temporarily moving `registrationDeadline` forward so the pages stop
  redirecting) showed `noindex` shipping *alongside* the inherited
  `canonical → /mentorship/mentee`. noindex + a cross-canonical is a
  contradictory pair — it tells Google "don't index me" and "I'm a copy of that
  one" at once, and Google may resolve it by pushing the noindex onto the
  **target**, which is a page we need indexed. Adding
  `alternates.canonical: "/mentorship/{mentee,mentor}/apply"` scopes the noindex
  to the apply page alone. Verified: apply pages now emit
  `noindex, follow` + a self-canonical, parents emit no robots meta.

  ⚠️ If a future layout sets `robots: noindex` under a segment whose parent
  declares a canonical, set a self-canonical at the same time.

- `app/sitemap.ts` — **removed both apply routes from `STATIC_ROUTES`** (and the
  now-dead `isMentorshipOpen()` filter + import). Caught while reconciling the
  docs: the routes were listed and merely *filtered out while the registration
  window was closed*, so the moment `MENTORSHIP_CONFIG.registrationDeadline` was
  moved forward they would have returned to the sitemap — now carrying
  `noindex`. Sitemap says "index me", page says "don't": GSC reports that as
  **"Submitted URL marked 'noindex'"**, trading one indexing error for another.
  Verified 120 `<loc>` entries, zero matching `apply`.

  ⚠️ **`noindex` and sitemap membership are one decision, not two.** Making a
  route noindex means deleting it from `STATIC_ROUTES` in the same change.

**Rejected**: `Disallow: /*_page=` in robots.txt — blocking the crawl would stop
Google seeing the redirect, and already-indexed URLs can linger indefinitely.
(GSC's URL Parameters tool was retired in 2022, so it is not an option either.)

**Deployed + validated 2026-07-31** (commit `ee1f909`, Actions deploy green):
- Production verified: `?…_page=` 308s to the clean path; `/media/photo-gallery?…`
  resolves in 2 hops to a 200 on `/resources/photo-gallery`; apex still 308s to
  `www`; canonicals intact; `?amount`, `?type`, `?t`, `?session_id` still 200.
- GSC URL Inspection → **Test live URL** on `/resources?10f821ec_page=9`:
  `Page fetch: Successful`, and **`User-declared canonical:
  https://www.shesharp.org.nz/resources`**. That field being populated is the
  fix — its absence is literally what the bucket name means.
- **Note: a first validation had already been run on 2026-07-07 and FAILED on
  2026-07-25** — i.e. the canonical-only signal was not enough on its own, which
  is the direct evidence for preferring the 308. Started a fresh validation on
  **2026-07-31** via *Validation details → START NEW VALIDATION*; all 4 URLs are
  now `PENDING 4 / FAILED 0`.

**Do not re-touch during the validation window.** Google takes 1–4 weeks; the
count will not drop immediately and may wobble. Re-check the drilldown in ~2
weeks. If it fails a second time despite the 308s, the next lever is exact-URL
Removals — not more redirect changes.

**GSC access**: this property is only reachable from the `website@shesharp.org.nz`
Google account. The maintainer's usual Chrome profile (`chanmeng6666@gmail.com`)
gets "Oops, you don't have access to this property".

---

### ☑ 3c. Page-indexing drilldown — FIXED 2026-08-09

**Symptom**: 140 indexed / **181 not indexed**, the largest bucket being
`Crawled – currently not indexed` at **117**.

**The headline number is mostly not this site.** Exporting the per-reason URL
lists (the summary export has counts only — the drilldowns are a separate export
per reason) broke the 117 down as:

| Host | Count | What |
| --- | --- | --- |
| `herwaka.shesharp.org.nz` | **91** | Mintlify docs subdomain, `/mintlify-assets/_next/static/chunks/*.js` |
| `www.shesharp.org.nz` | 24 | see below |
| `hackathon.shesharp.org.nz` | 1 | |
| apex `shesharp.org.nz` | 1 | |

A `sc-domain:` property covers **every subdomain**, so 78% of the "problem" is a
docs site this repo does not build. herwaka's own robots.txt has
`Disallow: /_next/`, which does not match `/mintlify-assets/_next/…`.

Of the 24 on `www`: 11 legacy Webflow `?<hash>_page=N` params (all last crawled
Feb–Apr 2026, i.e. **before** the 07-31 `proxy.ts` fix), 6 tracking-param
homepage variants (`?fbclid`, `?_ga`, `?__hstc`, `?trk`, `?c=`, `?hxchl`),
2 `?s=` URLs, 2 legacy paths already redirecting but not yet re-crawled, one
`/join-our-team/apply?type=volunteer`, and **2 real event pages**. The
tracking-param variants all carry correct self-canonicals — "crawled, not
indexed" is the *right* outcome for them, not a defect.

⚠️ **A hypothesis worth not re-testing.** The first read of this data assumed
the 117 were the ~90 event pages that receive zero internal links (the `/events`
hub is a client component that server-renders only `EVENTS_PER_PAGE = 6` cards).
The orphaning is real — GSC's own internal-links report lists **16 target pages
totalling 1,273 links**, and the total matches exactly, so that is the full list,
not a top-N. But it is **not** causing an indexing problem: 87 of 98 event pages
draw search impressions at a median position of 9.8 (vs 9.0 for non-event pages),
and only 2 event pages appear in the 117. Sitemap discovery is enough to get them
indexed. Restructuring `/events` for crawlable links is a defensible ranking/UX
project, but it is **not** the fix for this bucket — don't file it as one.

**Not a problem** (verified, no change made):
- `Page with redirect` (27): every entry is correct — http→https, apex→www,
  Next's trailing-slash normalisation, or our own 308s. Validation will always
  "fail" here, because a redirect never stops being a redirect.
- `Alternative page with proper canonical tag` (1): `/events?type=workshop`
  consolidating onto `/events`.
- `?s={search_term_string}`: a Webflow/WordPress-era artefact in Google's URL
  list, **not** emitted by us — `websiteSchema()` has no `SearchAction` and the
  string appears nowhere in the repo.

**Fixed**:
- `next.config.ts` — `/user-account` now 308s to **`/sign-in`**, not
  `/dashboard/account`. That was the whole cause of
  `Indexed, though blocked by robots.txt` (1 URL): the target sits under the
  robots-disallowed `/dashboard/` prefix, Googlebot could not complete the hop,
  and the stale URL stayed in the index.
- `app/robots.ts` — `DISALLOWED_PATHS` cut to `/dashboard/`, `/api/`, `/auth/`.
  The six auth pages moved to `robots: { index: false, follow: true }` on
  `app/(login)/layout.tsx`. **A Disallow stops crawlers reading a noindex** —
  the same trap already documented for `/present/*`. The two changes are one
  decision: unblock first, then noindex, or the URL can never leave the index.
- `next.config.ts` — five still-live 404s from the drilldown got 308s:
  `/events/she-sharp-myob-working-smarter-ai-myob-and-the-new-delivery-landscape`
  → `/events/she-sharp-and-myob-working-smarter` (a **real event** circulating
  under a slug the site never served, and the second most internally-linked
  event page on the site), `/category/donation` and `/paypal-checkout` →
  `/donate`, `/sponsors/contact` → `/sponsors/corporate-sponsorship`,
  `/coming-soon` → `/`. Plus `/conference/2023/google-educator2023` promoted out
  of the `/conference/:path*` catch-all onto its own edition page, matching 2024.
  The other six reported 404s were **already fixed** — GSC's last-crawl dates
  predate the 07-07 and 07-31 redirect work. Live-test before adding a rule.
- `app/(site)/events/[slug]/page.tsx` — `seoTitleFor()` appends the year when an
  event's own name lacks one. Twelve years of recurring events had shipped
  **three** pages titled `International Women's Day | She Sharp` and two each for
  `Google Educator Conference` and `She Celebrates`. The on-page name is the
  organisation's own record and is untouched; only the SERP title changes.
- `app/(site)/events/google-educator-conference/page.tsx` — series hub retitled
  `Google Educator Conference (CS4HS)`, which is what stops it colliding with the
  2024 edition.
- `lib/data/json/shesharp_events_v3.json` — the 2023 and 2024 GEC entries shared
  a `shortDescription` verbatim; each now names its own edition and date.
- `app/(site)/events/page.tsx` — added an `sr-only` `<h1>`. The page had none:
  the design opens on the featured-event hero, whose largest heading is that
  event's name. `/sponsors/corporate-sponsorship` had none either; its visible
  "Partner with purpose" was promoted from `<h2>`.
- `app/sitemap.ts` — **static routes no longer emit `lastModified`**, and neither
  do upcoming events. Both used to carry `new Date()`, i.e. the build timestamp,
  so every deploy claimed 25 pages had just changed. A lastmod that moves on
  every build is one Google learns to ignore site-wide, devaluing the past-event
  entries that carry a real date.
- `app/(site)/mentorship/page.tsx` — title now names New Zealand. The page takes
  ~2,800 impressions/quarter for 38 clicks; the zero-click queries split into
  generic head terms (unwinnable at position 6-9) and location-qualified ones
  (`mentors nz`, `nz mentors`) that are.

**Verified locally** (`next build` + `next start`, Googlebot UA): all 7 new or
changed redirects resolve in one hop to a 200; `/sign-in` returns 200 with
`noindex, follow`; robots.txt lists only the three real disallows; a full crawl
of all 121 sitemap URLs shows **zero duplicate titles, zero duplicate
descriptions, and exactly one `<h1>` per page**; sitemap still has 121 `<loc>`,
0 static `lastmod`, 96 event `lastmod` with real dates.

**Expected effect — read this before judging the next export.** What should
disappear: the 1 robots-blocked URL, our 5 live 404s, and the 6 stale ones on
re-crawl. **The 117 will barely move**, because 78% of it is a subdomain's static
assets and ~20% is param URLs already handled correctly.

**Two follow-ups that are not code** (see item 12 below).

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

### ☑ 9. Self-canonicals on remaining indexable pages — DONE (verified 2026-07-31)
**Why (original)**: Legal/resources sub-pages were thought to emit no canonical
(Google self-canonicalizes by URL — correct, but explicit is tidier and guards
against future param duplication).

**Status**: Audited during item 3b. Every indexable page already carries an
explicit `alternates.canonical` — all 5 resources sub-pages, all 8 legal pages,
`/about`, `/events`, `/events/[slug]`, `/mentorship*`, `/donate`, `/contact`,
`/join-our-team`, `/sponsors/corporate-sponsorship`, and `/`. Confirmed live with
`curl … | grep '<link rel="canonical"'`. The only pages that inherited a
**foreign** canonical were the two mentorship `/apply` layouts, now `noindex`
(see item 3b). Nothing left to do.

### ☐ 10. Image alt text & internal-link audit
**Why**: Alt text and descriptive internal anchors aid both accessibility and
crawler/LLM understanding.

**Where**: Audit event/gallery/team images for meaningful `alt`; ensure key pages
interlink with descriptive anchor text (not "click here").

**Related, and bigger than this item**: GSC's internal-links report (2026-08-09)
lists **16 target pages totalling 1,273 links** — the total matches exactly, so
that is every internally-linked page on the domain. ~90 event pages receive
none, because `/events` is a client component that server-renders only
`EVENTS_PER_PAGE = 6` cards and reveals the rest on click. Fixing it means
splitting the page into a server shell (rendering a real, **visible**,
year-grouped archive of all 98 events) plus the existing client filter layer, and
giving event detail pages sibling links instead of only `getUpcomingEvents(3)`.
Worth doing for discovery and link equity — but see item 3c: it is **not** an
indexing fix, and measuring it against the "not indexed" count will look like a
failure.

---

### ☑ 12. GSC property split — DONE 2026-08-09

**12a. URL-prefix property `https://www.shesharp.org.nz/`** — added and
auto-verified off the DNS-verified domain property; `sitemap.xml` submitted.
The existing `sc-domain:shesharp.org.nz` covers every subdomain, so 78% of its
"not indexed" count is `herwaka.shesharp.org.nz`'s Mintlify JS assets. The
prefix property makes the Page indexing report describe the site this repo
actually builds, instead of needing the host-by-host split done by hand in
item 3c. The domain property stays — it owns DNS verification, the whole-domain
view, and **all issue history and running validations**.

**12c. URL-prefix property `https://herwaka.shesharp.org.nz/`** — added the same
way, sitemap submitted (82 URLs). The docs site had 82 real pages whose indexing
state nobody could see inside the domain property. Baseline pending: a new
property shows "Processing data" for a day or so.

⚠️ **Never compare counts across the three properties.** The prefix properties
exclude apex and other subdomains, worth ~3.5% of clicks and ~3.9% of
impressions in the three months to 2026-08-09.

**12b — REJECTED, do not revive.** The original plan here was to add
`Disallow: /mintlify-assets/` to herwaka's robots.txt, since its existing
`Disallow: /_next/` does not match `/mintlify-assets/_next/…` and ~91 asset URLs
were being crawled. **That would have been a net harm.**

- Those files are the JavaScript Googlebot needs to **render** herwaka's pages.
  Google's own guidance is to let it fetch JS and CSS; blocked resources mean it
  evaluates a degraded version of the page.
- `.js` resources sitting in "Crawled – currently not indexed" is the **normal**
  end state for a resource file, not an error. Google crawls resources and never
  indexes them.
- herwaka is not a site worth sacrificing: 82 public pages with a full sitemap,
  per-page canonicals and no noindex — programme information, employment rights,
  the NZ IT market, an AI bootcamp. It is content She Sharp wants found.

The trade was a real rendering penalty on a site we want indexed, in exchange
for a cosmetically smaller number in a report. The number was already solved by
12a: read the report from the right property rather than damaging what it
measures.

---

## Recurring

### ☐ 11. Monthly baseline re-run (scheduled)
Re-run the target-query table in `GEO_SEO_MONITORING.md` monthly and compare to
the 2026-06-23 baseline. **Success markers**: old URLs gone from the index,
current facts (3000+ members, CC57025) reflected in AI answers, She Sharp
appearing in the broad "women in tech NZ" answer. A one-month reminder
(≈2026-07-23) was scheduled to run the first comparison.
