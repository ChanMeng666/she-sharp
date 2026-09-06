# `app/` — routes, metadata, rendering

Loaded when you read a file under `app/`. The rules the root `CLAUDE.md` keeps
are the ones that bind before any file is opened; these are the ones you need
while editing a route, a layout or a page's metadata.

## Route groups

| Group | What it holds | Gate |
|---|---|---|
| `(site)/` | home, about, `events/[slug]`, mentorship, resources, donate, membership, community, contact, sponsors, join-our-team | public, prerendered |
| `(login)/` | sign-in, sign-up, password reset, verification | `noindex` |
| `(dashboard)/` | member + admin area | `dashboard/layout.tsx` — the **real** auth check |
| `present/` | `/present/<event-slug>` projected decks | `noindex`, server-rendered on demand |
| `f/[code]/` | short feedback-code redirector → `/events/<slug>/feedback` | public |
| `api/` | route handlers | `withRoles()` per route |

`robots.ts`, `sitemap.ts`, `manifest.ts` and `llms-full.txt/` are generated
metadata routes. The standalone legal pages (accessibility, privacy, terms, code
of conduct) sit at the top level rather than in a group.

`proxy.ts` at the repo root is the middleware and checks only that a session
cookie **exists**. It is not an authorisation boundary — the real checks are
`app/(dashboard)/dashboard/layout.tsx` and `withRoles()`.

## Rendering: keep the root layout static

The root layout reads no cookies, no headers and no database, which is what lets
the public site prerender and `events/[slug]` build ~97 static pages. **Do not
add a `cookies()`, `headers()` or DB read to `app/layout.tsx`** — it opts the
whole public site out of static rendering, silently. The dashboard is dynamic
because its own layout awaits `getUser()` and `cookies()`; `/present/[deck]` is
server-rendered on demand. See `docs/ARCHITECTURE.md` §3.

## SEO: four gotchas that keep recurring

1. **Title template `%s | She Sharp` does not cascade** through a layout that
   sets its own string `title`. Children under `events/layout`,
   `mentorship/mentor/layout`, `mentorship/mentee/layout` need an explicit
   `title: { absolute: "X | She Sharp" }`.
2. **No root-level `alternates.canonical`** — it cascades and canonicalizes
   every page to the homepage. Set canonicals per page. Every indexable page
   needs an explicit one; absent means no tag at all, which Search Console
   reports as "Duplicate without user-selected canonical".
3. **A `noindex` child under a parent that declares a canonical needs its own
   self-canonical**, or Google can apply the noindex to the *parent*. The
   dangerous case is `/events/[slug]/feedback`, whose parent canonicalises to
   `/events`. **Marking a route `noindex` also means removing it from
   `app/sitemap.ts`** — the two changes travel together.
4. **A `Disallow` stops crawlers reading a `noindex`, so the two are
   alternatives, never a pair.** To keep a page out of search, make it crawlable
   and give it `noindex`. When fixing a page that has both: unblock first, then
   noindex — the reverse leaves the URL stuck in the index.

`lib/seo/site.ts` is the source of truth for the canonical origin and org facts;
keep it in sync with `metadataBase` in `app/layout.tsx` and `footerConfig` in
`lib/config/footer.ts`. After metadata edits run
`npx tsx scripts/seo/verify-page-metadata.ts --base http://localhost:3100`
against a local `next start`.

Docs: `docs/development/GEO_SEO_MONITORING.md` (what is in place, the three
Search Console properties, maintenance notes),
`GEO_SEO_IMPLEMENTATION_GUIDE.md` (reusable how-to),
`GEO_SEO_BACKLOG.md` (live follow-ups and the 2026-08-09 drilldown).

An `eventSchema` date must be formatted from the **local calendar fields**
(`toDateOnly`), never `toISOString()`, or `startDate`/`endDate` drift a day on a
non-UTC server.

## API routes: what the root file does not have room for

The root `CLAUDE.md` carries the four steps for creating one — `withRoles()`,
zod + `invalidBody()`, the work in a service under `lib/`, `apiFetch()` from the
browser — because creating a new file does not load this one. The conventions
you need once you are *editing* a route:

**If the route returns a person, read `lib/CLAUDE.md` § "Reading someone else's
personal data" first.** On 2026-09-06 three routes here were found returning
mentors' and mentees' names, email addresses, employers and application forms to
callers with **no session at all** — `GET /api/mentors` handed over all 23
mentors with addresses to an anonymous request, and had no consumer anywhere in
the codebase. Gating is `withRoles()`; deciding *which* signed-in person may see
another person's details is `canViewMentorshipPrivateDetails()` in
`lib/mentorship/access.ts`. Never gate that on `requiredAdminPermissions` — it is
default-GRANT, see below.

**Never address a person's record by its row id in a public route.** The mentee
payment summary took `?id=<int>`, so counting upwards returned real applicants'
names and email addresses. It now takes a signed token
(`lib/forms/submission-token.ts`). A sequential integer is not an access control,
and neither is an unguessable-looking URL.

**There is no universal response envelope.** Success payloads keep their domain
shape (`{ mentors, pagination }`, the report object itself); errors are
`{ error }`, plus `details` when they come from `invalidBody()`.

**Query params have no validation convention.** GET routes read
`request.nextUrl.searchParams` by hand and clamp inline. Follow the nearest
existing route rather than inventing a scheme for one endpoint. CSV responses go
through `toCsv()` in `lib/export/csv.ts`.

**`requiredAdminPermissions` is default-GRANT.** A missing `admin_permissions`
row means "all permissions", because every column defaults to `true`. Routes
that need default-DENY do the check inline and say so at the site — do not fold
one of those back into the wrapper. `getUserRoles()` has one implementation, in
`lib/auth/role-middleware.ts`.
