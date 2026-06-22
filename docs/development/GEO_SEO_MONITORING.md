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
curl -s "$B/sitemap.xml" | grep -oc "<loc>"      # expect ~119
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
- **Bing Webmaster Tools** (https://www.bing.com/webmasters): submit the same sitemap (Bing powers ChatGPT/Copilot web results).

### Structured-data validation (manual, after schema changes)

- Google Rich Results Test: https://search.google.com/test/rich-results — test the homepage (Organization) and an event detail page (Event).
- Schema.org validator: https://validator.schema.org/

### AI-citation spot checks (manual, monthly)

Run the target queries above in each engine; record whether shesharp.org.nz is
cited, its position, and whether the link is present. A lightweight spreadsheet
is enough to trend the KPIs.

## Maintenance notes

- **Title template gotcha:** the root template `%s | She Sharp` does NOT cascade
  through an intermediate layout that sets its own string title. Pages under
  `events/layout`, `mentorship/mentor/layout`, `mentorship/mentee/layout` give
  their child pages an explicit `title: { absolute: "X | She Sharp" }`.
- **Canonicals:** do not add a root-level `alternates.canonical` — it cascades to
  every page and makes them canonicalize to the homepage. Set canonicals per page
  (especially anything reachable with query params, e.g. the events list).
- **New events** automatically flow into `sitemap.xml`, `llms-full.txt`, and event
  JSON-LD via `getAllEvents()`. No manual sitemap edits needed.
- **New top-level pages:** add the route to `STATIC_ROUTES` in `app/sitemap.ts`
  and give the page its own `description` + `alternates.canonical`.
