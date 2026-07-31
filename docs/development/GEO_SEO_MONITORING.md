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

```bash
B=https://www.shesharp.org.nz
curl -s "$B/robots.txt"  | grep -E "ClaudeBot|GPTBot|Sitemap"
curl -s "$B/sitemap.xml" | grep -c "<loc>"       # expect 120 (2026-07-31); grows with events
curl -s "$B/sitemap.xml" | grep -c "apply"       # expect 0 — noindex routes must never be listed
curl -s "$B/llms.txt"        | head -1
curl -s "$B/llms-full.txt"   | grep -cE "Upcoming Events|Key Statistics"
curl -s "$B/" | grep -o '"@type":\["NGO"'        # Organization JSON-LD present
# Title sanity (no doubled "| She Sharp", no missing suffix):
for p in / /events /events/<some-slug> /mentorship/mentor; do
  curl -s "$B$p" | grep -o '<title>[^<]*</title>'
done
```

### Search Console (manual, recurring)

- **Google Search Console** (https://search.google.com/search-console): add/verify the `shesharp.org.nz` property, then **Sitemaps → submit `sitemap.xml`**. Monitor: Coverage/Indexing, Rich results (Event, Organization), impressions/clicks per query.
- **Access**: Domain property `sc-domain:shesharp.org.nz`, reachable **only** from the `website@shesharp.org.nz` account, which lives in a different Chrome instance from the maintainer's usual profile. `?authuser=N` guessing does not find it — use `switch_browser` in `claude-in-chrome` and let the human pick the browser.
- **Open validations** (check before starting new work — do not disturb a running one):

  | Issue | State | Next check |
  | --- | --- | --- |
  | Duplicate without user-selected canonical (4 URLs) | Validation started **2026-07-31**, `PENDING 4 / FAILED 0`. A prior run started 2026-07-07 **failed** 2026-07-25 (canonical-only, pre-308). | ~2026-08-14. If it fails again *with* the 308s live, escalate to exact-URL Removals, not more redirect edits. |

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
