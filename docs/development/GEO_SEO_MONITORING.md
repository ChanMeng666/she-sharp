# SEO & GEO Monitoring

How the She Sharp site is optimized for search engines (SEO) and generative
engines (GEO — ChatGPT, Claude, Perplexity, Google AI Overviews), and how to
monitor and maintain it.

## What's in place

| Surface | File | Purpose |
| --- | --- | --- |
| `robots.txt` | `app/robots.ts` | Allows crawling (minus dashboard/api/auth), explicitly authorizes AI crawlers, advertises the sitemap. |
| `sitemap.xml` | `app/sitemap.ts` | Static routes + every event slug, with priority/changefreq. |
| `llms.txt` | `public/llms.txt` | Static "AI usage guide" describing the org and key pages. |
| `llms-full.txt` | `app/llms-full.txt/route.ts` | Dynamic full index (all events, team, stats, press) regenerated hourly. |
| JSON-LD (site) | `app/layout.tsx` + `lib/seo/schema.ts` | Organization/NGO + WebSite structured data. |
| JSON-LD (event) | `app/(site)/events/[slug]/page.tsx` | Event + BreadcrumbList structured data. |
| Inline AI hints | `components/seo/geo-head.tsx` | `<script type="text/llms.txt">` on home/events/mentorship/donate. |
| Metadata | `app/layout.tsx` + per-page | Title template, descriptions, canonicals, OpenGraph/Twitter, PWA manifest. |
| Legacy URL redirects | `next.config.ts` → `redirects()` | 308s pre-migration paths onto current routes. Specific rules before the `/media/:path*` catch-all. |
| Legacy param stripping | `proxy.ts` → `stripLegacyPaginationParams()` | 308-strips Webflow `?<hex>_page=N` params so they stop minting duplicate pages (added 2026-07-31). |

`lib/seo/site.ts` is the single source of truth for the canonical origin,
organization facts, and social links. Keep it in sync with `metadataBase`
(`app/layout.tsx`) and `footerConfig` (`lib/config/footer.ts`).

## Core KPIs (GEO)

Track these over time (manually or via the tools below):

- **Citation success rate** — share of relevant AI answers that cite shesharp.org.nz.
- **AI referral traffic** — sessions whose referrer is an AI engine (chat.openai.com, perplexity.ai, etc.).
- **Average citation position** — where the She Sharp citation appears among an answer's sources.
- **Link carry rate** — share of citations that include a clickable link back to the site.
- **Query coverage** — share of target queries (see list below) for which the site is surfaced at all.

Target queries to spot-check (run in ChatGPT, Claude, Perplexity, Google AI Overviews):

- "women in tech New Zealand organisation"
- "She Sharp New Zealand"
- "STEM mentorship programme for women NZ"
- "tech events for women in Auckland"
- "how to volunteer with women in tech NZ"

## Verification & monitoring tools

### After each deploy (automated-ish, CLI)

**The on-page checks are a script now** — `scripts/seo/verify-page-metadata.ts`.
It crawls every URL in the deployed sitemap with a Googlebot UA and fails on:
a non-200, a missing/duplicate `<title>`, a missing/duplicate meta description,
anything other than exactly one `<h1>`, a missing or non-self-referencing
canonical, or a `noindex` on a sitemapped URL. It also warns when more than five
sitemap entries share one `lastmod` date, which is the signature of a build
timestamp rather than a content date.

```bash
npx tsx scripts/seo/verify-page-metadata.ts                          # production
npx tsx scripts/seo/verify-page-metadata.ts --base http://localhost:3100
npx tsx scripts/seo/verify-page-metadata.ts --verbose                # per-URL warnings
```

Exit 1 means a defect. Content warnings (long descriptions, thin pages) are
tallied by kind rather than listed, because they hit most event pages and would
otherwise drown the errors; `--strict` promotes them to failures.

It is **not** in CI on purpose: 121 live requests per PR is slow, flaky, and
tests the deployed site rather than the diff. Run it after a deploy, or against
a local `next start` when a PR touches metadata.

Not covered by the script — still worth a glance after a deploy:

```bash
B=https://www.shesharp.org.nz
curl -s "$B/robots.txt"  | grep -E "ClaudeBot|GPTBot|Sitemap"
curl -s "$B/sitemap.xml" | grep -c "apply"       # expect 0 — noindex routes must never be listed
curl -s "$B/sign-in" | grep -o 'name="robots" content="[^"]*"'   # expect noindex — it is NOT robots.txt-blocked
curl -s "$B/llms.txt"        | head -1
curl -s "$B/llms-full.txt"   | grep -cE "Upcoming Events|Key Statistics"
curl -s "$B/" | grep -o '"@type":\["NGO"'        # Organization JSON-LD present
```

### Search Console (manual, recurring)

- **Google Search Console** (https://search.google.com/search-console): add/verify the `shesharp.org.nz` property, then **Sitemaps → submit `sitemap.xml`**. Monitor: Coverage/Indexing, Rich results (Event, Organization), impressions/clicks per query.
- **Access**: reachable **only** from the `website@shesharp.org.nz` account, which lives in a different Chrome instance from the maintainer's usual profile. `?authuser=N` guessing does not find it — use `switch_browser` in `claude-in-chrome` and let the human pick the browser.
- **Two properties, and the difference matters**:
  - `sc-domain:shesharp.org.nz` — DNS-verified, covers **every subdomain**. All issue history and every running validation lives here, so this is the one to use for VALIDATE FIX.
  - `https://www.shesharp.org.nz/` (added 2026-08-09, auto-verified off the domain property) — the main site only. Use it for day-to-day reporting: the domain property's Page indexing counts are dominated by `herwaka.shesharp.org.nz`'s Mintlify asset URLs.
  - `https://herwaka.shesharp.org.nz/` (added 2026-08-09, same auto-verification) — the HER WAKA docs site, 82 pages, sitemap submitted. Its indexing state was previously invisible inside the domain property.
  - **Never compare numbers across the three.** The prefix properties exclude apex and other subdomains, which carried ~3.5% of clicks and ~3.9% of impressions in the three months to 2026-08-09 — a range difference, not a drop.
  - A freshly added property shows "Processing data, please check again in a day or so", and its sitemap sits at **"Couldn't fetch"** until Google's first real read. Neither is an error: herwaka's `sitemap.xml` was verified independently as `200 text/xml`, unblocked by its robots.txt and advertised in it.
- **Do not block `/mintlify-assets/` on herwaka** — see backlog item 12b for why that idea was rejected. Those are the JS files Googlebot needs to render the docs pages, and `.js` resources in "Crawled – currently not indexed" is the normal end state for a resource, not a defect.
- **Open validations** (check before starting new work — do not disturb a running one):

  | Issue | State | Next check |
  | --- | --- | --- |
  | Duplicate without user-selected canonical (4 URLs) | Validation started **2026-07-31**, `PENDING 4 / FAILED 0`. A prior run started 2026-07-07 **failed** 2026-07-25 (canonical-only, pre-308). | ~2026-08-14. If it fails again *with* the 308s live, escalate to exact-URL Removals, not more redirect edits. |
  | Indexed, though blocked by robots.txt (`/user-account`) | Fix deployed 2026-08-09 (backlog item 3c); validation started the same day, 1 URL. | ~2026-08-23. |
  | Not found (404) — 16 URLs | Fix deployed 2026-08-09; new validation started the same day, `PENDING 16 / FAILED 0`. A prior run started 2026-07-07 failed 2026-07-11. | ~2026-08-23. **A partial failure here is expected and is not a regression**: only 5 of the 16 were ours to fix, 5 are `herwaka.shesharp.org.nz`, and the rest are pages that correctly 404. Judge it URL by URL, not by the bucket's overall status. |

- **Why this section says "manual" — there is no CLI to replace it** (researched 2026-08-09, before deciding not to build one):
  - **Google ships no Search Console CLI and no official MCP server.** `gcloud` does not cover GSC. Everything on offer is the **Search Console API v1** (`searchconsole.googleapis.com`) plus client libraries; every `gsc-cli` / GSC MCP you can find is a third party wrapping that same API, and using one means handing it owner-level credentials to this property.
  - **What the API can do**: `sites.list`, `sitemaps.list/get/submit/delete`, `searchAnalytics.query`, and `urlInspection.index.inspect` (per-URL coverage state, robots state, canonical, last crawl). Quotas: URL Inspection 2,000/day and 600/min per property; Search Analytics 1,200 QPM.
  - **What the API cannot do, which is most of what this page is for**: there is **no messages/alerts endpoint** (the GSC emails cannot be read programmatically), **no Page indexing report endpoint** (only per-URL inspection — the per-reason drilldowns that made the 2026-08-09 diagnosis possible exist only as a browser export), **no VALIDATE FIX**, no manual actions or security issues, and **no request-indexing** (the Indexing API officially covers only `JobPosting` and `BroadcastEvent`). Data also lags 2–3 days.
  - So a CLI could reproduce *some* of what an alert email is telling you, but never read the alert, never run a validation, and never pull the drilldown. The browser path with `claude-in-chrome` stays the primary tool; `scripts/seo/verify-page-metadata.ts` covers the on-page half without touching Google at all.
- **Exporting the Page indexing report**: the report-level export gives **counts only**. The per-reason URL lists are a separate export — click the reason row, then export from the drilldown (≤1,000 rows each). The 2026-08-09 analysis needed the drilldowns plus the Links → internal-links export and Performance → Pages; the summary alone is not enough to tell a defect from a subdomain's static assets.
- **The domain property is not the site.** `sc-domain:` covers every subdomain. `herwaka.shesharp.org.nz` (Mintlify docs, 82 pages) and `hackathon.shesharp.org.nz` (the Aotearoa AI Hackathon voice agent, a separate Next.js app that ships `noindex`) are both inside it, and herwaka supplied 91 of the 117 "Crawled – currently not indexed" URLs on 2026-08-09. Before treating any number here as a defect in this repo, split it by host. The prefix properties added under item 12 exist so this stops being manual — but the domain property remains the only place validations can be run.

- **Bing Webmaster Tools** (https://www.bing.com/webmasters): submit the same sitemap (Bing powers ChatGPT/Copilot web results).

### Structured-data validation (manual, after schema changes)

- Google Rich Results Test: https://search.google.com/test/rich-results — test the homepage (Organization) and an event detail page (Event).
- Schema.org validator: https://validator.schema.org/

### AI-citation spot checks (manual, monthly)

Run the target queries above in each engine; record whether shesharp.org.nz is
cited, its position, and whether the link is present. A lightweight spreadsheet
is enough to trend the KPIs.

## Baseline snapshot — 2026-06-23 (at launch)

Captured the same day the SEO/GEO work shipped and the sitemap was submitted, so
this reflects the **pre-optimization index state** — search/AI engines have not
yet re-crawled with the new infrastructure. Use it as the "before" for measuring
lift over the coming weeks.

**Method**: ran each target query via web search (the retrieval layer that feeds
AI answer engines — Bing→ChatGPT/Copilot, Google→AI Overviews) and recorded
whether `shesharp.org.nz` appears in results and whether it's reflected in the
generated summary. This is a retrieval-layer proxy; complement with live
in-browser ChatGPT/Perplexity/Claude checks for true generative citations.

| Target query | In results (position) | Reflected in AI summary | Notes |
| --- | --- | --- | --- |
| women in tech New Zealand organisation | Yes (#5) | **No** | Lost to TechWomen & Women in Tech NZ; She Sharp omitted from the summarized org list. |
| She Sharp New Zealand (brand) | Yes (#1–6, 9) | Yes (dominant) | Strong brand presence **but stale index** — see below. |
| STEM mentorship programme for women NZ | Yes (#2–3) | Yes | Cited alongside AUT WiT, ShadowTech, IYM. |
| tech events for women in Auckland | Yes (#5) | Yes (brief) | Also a She Sharp Humanitix event surfaced. |
| how to volunteer with women in tech NZ | Yes (#2) | Yes ("SheSharp") | Good — cited near the top. |

**Key baseline findings (the "before" problems to fix):**

1. **Stale / dead URLs indexed.** The brand query surfaces the *old* pre-migration
   URL structure — `/about-us`, `/media/news-and-press`, `/contact-us`,
   `/mentorship/mentorship-program`, `/media/podcasts` — none of which match the
   current routes (`/about`, `/resources/in-the-press`, `/contact`, `/mentorship`,
   `/resources/podcasts`). A competing old domain `shesharp.co.nz` also appears.
   The new sitemap + canonicals should drive re-crawling to the correct URLs;
   **watch GSC for the old URLs dropping out and the new ones getting indexed.**
2. **Outdated facts in AI answers.** Summaries quoted "over 8,000 women" and
   "1,500 members", inconsistent with the site's stated 3000+ members. The new
   `llms.txt` / `llms-full.txt` / Organization JSON-LD assert current figures —
   watch whether AI summaries converge on them.
3. **Weak on broad category queries.** For the generic "women in tech NZ
   organisation" query, She Sharp is retrieved but not cited; TechWomen and Women
   in Tech NZ dominate. Opportunity: stronger topical content + structured data.
4. **Strong on specific intents.** Mentorship, events, and volunteering queries
   already surface and cite She Sharp near the top — defend and build on these.

**Re-run cadence**: repeat this table monthly. Success = old URLs gone from the
index, current facts (3000+ members, CC57025) reflected in AI answers, and She
Sharp appearing in the broad "women in tech NZ" answer.

## Maintenance notes

- **Title template gotcha:** the root template `%s | She Sharp` does NOT cascade
  through an intermediate layout that sets its own string title. Pages under
  `events/layout`, `mentorship/mentor/layout`, `mentorship/mentee/layout` give
  their child pages an explicit `title: { absolute: "X | She Sharp" }`.
- **Canonicals:** do not add a root-level `alternates.canonical` — it cascades to
  every page and makes them canonicalize to the homepage. Set canonicals per page
  (especially anything reachable with query params, e.g. the events list).
- **`noindex` + inherited canonical:** a segment that sets `robots: { index: false }`
  under a parent that declares a canonical ships *both* signals, and Google can
  apply the noindex to the **parent**. Always add the child's own
  `alternates.canonical` alongside `robots`. Both `/mentorship/{mentee,mentor}/apply`
  layouts do this. **A `noindex` route must also be removed from
  `STATIC_ROUTES` in `app/sitemap.ts`** — otherwise the sitemap says "index me"
  while the page says "don't", which GSC reports as *Submitted URL marked
  'noindex'*. The apply routes were previously listed and merely filtered out
  while the registration window was closed; they are now gone entirely, because
  the filter would have re-added them (as noindex URLs) the moment it reopened.
- **Gated pages hide metadata bugs:** a route that `redirect()`s (e.g. the two
  mentorship apply pages outside the registration window) emits no `<head>` at
  all, so its metadata is unverifiable in the normal state. To check it,
  temporarily move the gate (`MENTORSHIP_CONFIG.registrationDeadline`), render it
  on a dev server, then revert before committing.
- **New events** automatically flow into `sitemap.xml`, `llms-full.txt`, and event
  JSON-LD via `getAllEvents()`. No manual sitemap edits needed.
- **New top-level pages:** add the route to `STATIC_ROUTES` in `app/sitemap.ts`
  and give the page its own `description` + `alternates.canonical`.
- **Legacy query params:** if GSC surfaces a new family of duplicate URLs driven
  by an old CMS query param, extend `LEGACY_PAGINATION_PARAM` in `proxy.ts`
  (match by *shape*, not exact key) rather than adding `next.config` `has` rules.
  Grep the repo for the param first — stripping one the app still reads breaks
  real pages. Never block them in `robots.txt`.
