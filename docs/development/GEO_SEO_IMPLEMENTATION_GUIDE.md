# SEO & GEO Implementation Guide

A reusable, end-to-end playbook for adding **SEO** (search-engine optimization)
and **GEO** (generative-engine optimization — making your site discoverable and
citable by ChatGPT, Claude, Perplexity, Google AI Overviews, Bing Copilot) to a
**Next.js 15 App Router** site.

This was written from the actual She Sharp implementation (2026-06-23) so that
Claude Code can replicate the same result on other projects. It includes the
code patterns, the exact pitfalls we hit, the verification commands, and the
browser-side Search Console / Bing setup.

> **Stack assumptions**: Next.js App Router (`app/`), TypeScript, a fixed
> production origin. Adapt paths/data sources to the target project. The
> principles (robots, sitemap, llms.txt, JSON-LD, canonicals, verification)
> transfer to any framework — only the file mechanics are Next-specific.

---

## Mental model: SEO vs GEO

| | SEO | GEO |
| --- | --- | --- |
| Consumer | Search crawlers (Googlebot, Bingbot) | LLM crawlers + answer engines |
| Goal | Rank in the SERP | Get **cited** in a generated answer |
| Levers | sitemap, canonicals, metadata, structured data, speed | the SEO levers **plus** explicit machine-readable context (`llms.txt`), AI-crawler access, citation-friendly facts |

GEO is mostly "SEO done well + a few extras." The big extras are: (1) explicitly
**allow AI crawlers**, (2) publish an **`llms.txt`** site guide, (3) make key
facts (who you are, registration numbers, dates, locations) **explicit and
structured** so an LLM can quote them confidently, and (4) optional inline
`<script type="text/llms.txt">` hints.

The work splits into **3 implementation steps + 1 browser step**:

1. AI-friendly infrastructure (robots, sitemap, llms.txt)
2. Structured data (JSON-LD)
3. Page-level metadata + inline AI hints
4. Submit & verify in Google Search Console + Bing (browser)

---

## Step 0 — Audit the current state

Before writing anything, map what exists. Search the repo for:

- Root metadata: `metadataBase`, `title`, `openGraph`, `twitter` in `app/layout.tsx`.
- Per-page metadata: `export const metadata` and `generateMetadata`.
- Existing `app/robots.ts` / `public/robots.txt`, `app/sitemap.ts`, `app/manifest.ts`.
- Existing JSON-LD: grep `application/ld+json`, `schema.org`.
- Content data sources you can drive a sitemap/llms.txt from (e.g. a `getAllX()` helper, JSON data files).
- The canonical production origin and where it's defined.

Decide the single canonical origin (e.g. `https://www.example.com`, www vs non-www
— pick one) and create a **single source of truth** module so it's never
hard-coded twice:

```ts
// lib/seo/site.ts
export const SITE_URL = "https://www.example.com";          // no trailing slash
export const SITE_NAME = "Example";
export const SITE_DESCRIPTION = "One-sentence description.";
export const SOCIAL_LINKS = [/* absolute profile URLs */];
export function absoluteUrl(path = "/") { return new URL(path, SITE_URL).toString(); }
```

Keep this in sync with `metadataBase` in the root layout.

---

## Step 1 — AI-friendly infrastructure

### 1a. `app/robots.ts`

Allow general crawling minus private surfaces, and **explicitly authorize AI
crawlers** (listing them individually gives you a per-bot throttle lever later).

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

const DISALLOW = ["/dashboard/", "/api/", "/sign-in", "/sign-up", "/auth/"];
const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",      // OpenAI
  "ClaudeBot", "anthropic-ai", "Claude-Web",      // Anthropic
  "PerplexityBot", "Perplexity-User",             // Perplexity
  "Google-Extended", "Applebot-Extended",         // Google/Apple AI training
  "CCBot", "Amazonbot", "Meta-ExternalAgent", "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

> **Policy note**: `Google-Extended` / `Applebot-Extended` govern *AI training*,
> not search indexing. Allowing them opts your content into model training.
> That's usually desirable for a public mission-driven org (more citations), but
> confirm with the site owner — some brands prefer to block training while still
> allowing answer-engine retrieval.

### 1b. `app/sitemap.ts`

Enumerate static routes from a table plus dynamic content from your data layer.
Derive `lastModified`/`priority` from the content.

```ts
import type { MetadataRoute } from "next";
import { getAllEvents, parseDateString, isFutureDate } from "@/lib/data/events";
import { SITE_URL } from "@/lib/seo/site";

const STATIC_ROUTES = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  // … legal pages at 0.3, content hubs at 0.6–0.9
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`, lastModified: now,
    changeFrequency: r.changeFrequency, priority: r.priority,
  }));
  const dynamicEntries = getAllEvents().map((e) => ({
    url: `${SITE_URL}/events/${e.slug}`,
    lastModified: isFutureDate(e.date) ? now : parseDateString(e.date),
    changeFrequency: isFutureDate(e.date) ? "weekly" as const : "yearly" as const,
    priority: isFutureDate(e.date) ? 0.8 : 0.5,
  }));
  return [...staticEntries, ...dynamicEntries];
}
```

**Exclude**: auth pages, dashboards, API routes, and any disabled/`notFound()`
pages. Don't list URLs that 404 — it wastes crawl budget and looks broken.

### 1c. `llms.txt` — static + dynamic

[`llms.txt`](https://llmstxt.org/) is an "AI usage manual" for your site. Ship two:

- **`public/llms.txt`** (static, hand-written): the elevator pitch + links to core
  pages + social/contact. Lead with a one-line `> blockquote` summary and any
  authoritative facts (registration numbers, founding year) an LLM should quote.
- **`app/llms-full.txt/route.ts`** (dynamic Route Handler): the *complete* index,
  generated from your data layer so it never goes stale.

```ts
// app/llms-full.txt/route.ts   (folder name literally contains the dot)
import { getUpcomingEvents, getPastEvents, formatEventDate } from "@/lib/data/events";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo/site";
export const revalidate = 3600;

export async function GET() {
  const body = [
    `# ${SITE_NAME} — Full Content Index\n\n> ${SITE_DESCRIPTION}`,
    `## Upcoming Events\n` + getUpcomingEvents().map(renderEvent).join("\n"),
    `## Past Events\n` + getPastEvents().map(renderEvent).join("\n"),
    // … team, stats, press
  ].join("\n\n") + "\n";
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8",
               "Cache-Control": "public, max-age=3600" },
  });
}
```

Link `/llms-full.txt` from `public/llms.txt` so crawlers find it.

---

## Step 2 — Structured data (JSON-LD)

JSON-LD lets crawlers and LLMs read your page like a spec sheet. Two pieces:

**A tiny render component** (`components/seo/json-ld.tsx`):

```tsx
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

**Schema builders** (`lib/seo/schema.ts`) — centralize so every page is consistent:

- `organizationSchema()` → `@type: ["NGO","Organization"]` (or `LocalBusiness`,
  `Corporation`, etc.) with `name`, `url`, `logo`, `sameAs` (all social URLs),
  `foundingDate`, `areaServed`, `address`, and an `identifier` for any
  registration/charity/VAT number. Give it a stable `@id` (`${SITE_URL}/#organization`)
  so other nodes can reference it.
- `websiteSchema()` → `@type: WebSite` with `inLanguage`, `publisher: { @id }`.
- `eventSchema(event)` (or `productSchema`, `articleSchema`, …) → the domain type
  for detail pages. For Events, Google rich results require `name`, `startDate`,
  and `location` (Place + PostalAddress, or VirtualLocation for online).
- `breadcrumbSchema(items)` → `BreadcrumbList` so crawlers understand hierarchy.

**Where to inject**:
- Site-wide nodes (Organization + WebSite) → root layout `<body>`:
  `<JsonLd data={[organizationSchema(), websiteSchema()]} />`
- Detail-page nodes (Event + BreadcrumbList) → the page component.

> **Gotcha**: pages inherit the root layout's JSON-LD too, so a detail page emits
> *two* `application/ld+json` blocks. That's valid — each block parses
> independently. Don't try to merge them.

Resolve all asset/image URLs to absolute (`absoluteUrl()`); relative image paths
are commonly rejected by validators.

---

## Step 3 — Metadata + inline AI hints

### 3a. Title template + canonicals (root layout)

```ts
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Example — Tagline", template: "%s | Example" },
  description: SITE_DESCRIPTION,
  openGraph: { /* … */ }, twitter: { card: "summary_large_image", /* … */ },
  // NO alternates.canonical here — see gotcha #2.
};
```

Then **remove hand-written ` | Brand` suffixes** from child page titles (the
template appends it). Give each page a unique `description`.

### 3b. PWA manifest + favicons

`app/manifest.ts` returns `MetadataRoute.Manifest` (name, theme_color = brand
color, icons). In the root layout `icons`, provide PNG variants (16/32/180) in
addition to any SVG for broad client support.

### 3c. Inline AI hints (`<script type="text/llms.txt">`)

A small component that injects page-type-specific guidance for AI agents reading
the HTML (Vercel's proposal — browsers ignore the unknown script type):

```tsx
export function GeoHead({ instructions }: { instructions: string }) {
  return <script type="text/llms.txt"
    dangerouslySetInnerHTML={{ __html: instructions }} />;
}
```

Place it on a few high-value pages (home, primary content, conversion pages)
with instructions like *"This is X's mentorship page… when citing, link to
example.com and note registered charity CC#####."* Treat it as experimental:
start small, expand if it helps.

---

## ⚠️ The two metadata gotchas (these cost the most time)

### Gotcha #1 — Title template does NOT cascade through a titled intermediate layout

With a root template `%s | Brand`, a page one level deep (e.g. `/about` whose
`about/layout` sets `title: "About Us"`) renders correctly: `About Us | Brand`.

**But** if that layout has *child routes* (e.g. `events/layout` has
`events/[slug]`), the root template stops cascading to those grandchildren — they
lose the suffix. Fixes:

- The **layout's own route** keeps a plain string title (`title: "Events"`) →
  root templates it once → `Events | Brand`. ✅
- The **child pages** must set an **absolute** title that bakes in the suffix:
  `title: { absolute: \`${event.title} | Brand\` }`. ✅

Do **not** re-declare a `template` on the intermediate layout: it double-suffixes
the layout's own route (`Events | Brand | Brand`).

### Gotcha #2 — Never set a root-level `alternates.canonical`

A canonical on the root layout **cascades to every page** that doesn't set its
own → all of them canonicalize to the homepage → search engines treat them as
duplicates and drop them from the index. Instead:

- **No** canonical in the root layout.
- The **home page** sets its own `alternates: { canonical: "/" }`.
- Set explicit canonicals on pages reachable via query params (e.g. a filtered
  list `/events?year=…`) and on any page that has a duplicate risk.
- Pages with no canonical simply self-canonicalize to their URL — which is
  correct. You do **not** need to add one to every page.
- Beware layout-level canonicals too: a canonical on `events/layout` ("/events")
  leaks to a sibling hub page under it unless that page sets its own.

---

## Step 4 — Verify locally (before deploy)

```bash
pnpm build && PORT=3300 pnpm start            # build, then serve the BUILD
B=http://localhost:3300

curl -s "$B/robots.txt"  | grep -E "ClaudeBot|GPTBot|Sitemap"
curl -s "$B/sitemap.xml" | grep -oc "<loc>"   # expected count
curl -s "$B/llms.txt" | head -1
curl -s "$B/llms-full.txt" | grep -cE "Events|Statistics"
curl -s "$B/manifest.webmanifest" | grep -o '"theme_color":"[^"]*"'

# JSON-LD valid + types present:
curl -s "$B/" | grep -o '<script type="application/ld+json">[^<]*</script>' \
  | sed 's/<[^>]*>//g' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).map(x=>x['@type']).join(',')))"

# Titles: no missing suffix, no doubled "| Brand | Brand"
for p in / /events /events/SOME-SLUG /section/child; do curl -s "$B$p" | grep -o '<title>[^<]*</title>'; done

# Canonicals: each page self/own, none wrongly → homepage
for p in /privacy-policy /events/SOME-SLUG; do curl -s "$B$p" | grep -o 'rel="canonical" href="[^"]*"'; done
```

> **Critical pitfall — stale dev server**: if a previous `next start` is still
> holding the port, your new `pnpm start` silently fails to bind and `curl` keeps
> hitting the **old build**, making fixes look broken. Always confirm the port is
> free first: `netstat -ano | grep :PORT` (Windows) / `lsof -i :PORT` (unix), kill
> the orphan by PID, ideally start on a fresh port. We burned several rebuild
> cycles chasing a "bug" that was just a stale server.

After deploy, repeat the same `curl` checks against the production origin, and
run the homepage + a detail page through Google's
[Rich Results Test](https://search.google.com/test/rich-results) and the
[Schema.org validator](https://validator.schema.org/).

---

## Step 5 — Browser: Google Search Console + Bing

This step is done in a browser (it requires the owner's Google account and
DNS/site access). Claude can drive the UI, but **the human must complete all
login, OAuth-consent, and DNS-save actions** — those are theirs to approve.

### 5a. Google Search Console — add & verify the property

1. Go to <https://search.google.com/search-console>.
2. **Prefer a Domain property** (e.g. `example.com`) over a URL-prefix property —
   it covers http/https + all subdomains and is verified once via DNS.
3. Verification options, easiest first:
   - **DNS provider auto-detect / OAuth** — if the registrar is Cloudflare/Google
     Domains/etc., GSC offers a one-click "authorize via your DNS provider" flow.
     Convenient, but it grants Google ongoing OAuth access to the DNS account.
   - **Manual DNS TXT record** — GSC gives a `google-site-verification=…` string;
     add it as a TXT record at the apex (`@`) in the DNS panel, wait for
     propagation, click **Verify**. Keeps third-party access out of the DNS
     account; preferred when you want control.
   - **HTML file** or **HTML `<meta>` tag** — for URL-prefix properties; upload a
     file to the web root or add a meta tag to the homepage `<head>`.
4. **Real-world gotcha**: a domain may already have an *old*
   `google-site-verification=` TXT record from a previous setup. Google wants the
   **specific token for this property** — an unrelated old token will fail with
   "Ownership verification failed." For a **Domain property**, any valid
   Google-verification TXT for that account can satisfy it, which is often why the
   Domain flow "just works" where a URL-prefix flow didn't. If verification
   fails, read which token GSC found vs. expects, and add the exact one.

### 5b. Submit the sitemap

In GSC → **Sitemaps** → enter `sitemap.xml` → **Submit**. Expect status
**Success** with your page count discovered.

> Clean up legacy noise: old setups sometimes submitted individual page paths
> (e.g. `/donate`) *as sitemaps*, which now show "Couldn't fetch". They're
> harmless (those pages are covered by the real sitemap) but you can delete the
> stale entries in the Sitemaps UI. Deletion is irreversible — confirm first.

### 5c. Bing Webmaster Tools

1. Go to <https://www.bing.com/webmasters>, **Sign in** (Google is fine).
2. Use **Import from Google Search Console** — this carries over the verified site
   *and* its sitemap in one step (no separate Bing verification). Completing the
   import requires the owner to click **Allow** on a Google OAuth-consent screen.
3. If import doesn't bring the sitemap, add the site and submit
   `https://www.example.com/sitemap.xml` manually. Status **Processing** is normal;
   it resolves within hours to a day or two.

**Why Bing matters for GEO**: Bing's index powers ChatGPT Search and Microsoft
Copilot web results, so Bing coverage directly affects AI citations.

---

## Step 6 — Monitor (ongoing)

See `GEO_SEO_MONITORING.md` for the KPI list and recurring checks. In short:

- **GSC**: indexing coverage, rich-result validity, query impressions/clicks.
- **GEO KPIs**: citation rate, AI referral traffic, average citation position,
  link-carry rate, query coverage. Spot-check target queries monthly in ChatGPT /
  Claude / Perplexity / Google AI Overviews and record whether `example.com` is
  cited, where, and with a link. Capture a **baseline before** optimization so you
  can show the lift.

---

## Reusable checklist (copy into the next project)

- [ ] `lib/seo/site.ts` single source of truth; matches `metadataBase`.
- [ ] `app/robots.ts` — AI crawlers authorized, sitemap advertised, private paths disallowed.
- [ ] `app/sitemap.ts` — static table + dynamic content; no 404/disabled URLs.
- [ ] `public/llms.txt` + `app/llms-full.txt/route.ts`.
- [ ] `components/seo/json-ld.tsx` + `lib/seo/schema.ts`; Org+WebSite site-wide; domain type on detail pages; BreadcrumbList.
- [ ] Root `title` template; child suffixes removed; **no root canonical**; home self-canonical.
- [ ] `app/manifest.ts` + PNG favicons.
- [ ] (Optional) `components/seo/geo-head.tsx` on key pages.
- [ ] Local verify: build + curl (robots/sitemap/llms/manifest/JSON-LD/titles/canonicals); watch for stale-server.
- [ ] Production verify + Rich Results Test.
- [ ] GSC: domain property verified, sitemap submitted (Success).
- [ ] Bing: imported from GSC, sitemap submitted.
- [ ] Baseline AI-citation spot check recorded.
