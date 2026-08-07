# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

She Sharp is a non-profit organization website dedicated to bridging the gender gap in STEM fields. Built with Next.js 15.4.0 and TypeScript, the platform serves as a hub for women in technology, offering mentorship programs, networking events, and career development resources.

## Essential Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Development
pnpm dev              # Start development server with Turbopack

# Database operations
pnpm db:setup         # Initial database setup
pnpm db:generate      # Generate Drizzle migrations from schema changes
pnpm db:migrate       # Apply database migrations
pnpm db:seed          # Seed database with sample data
pnpm db:studio        # Open Drizzle Studio for database management

# Build
pnpm build            # Production build
pnpm start            # Start production server
```

## Project Structure

```
she-sharp/
├── app/                    # Next.js App Router (pages and API routes)
│   ├── (site)/             # Public pages (home, about, events, etc.) - 26 page.tsx files
│   ├── (login)/            # Authentication pages (sign-in, sign-up, etc.) - 6 pages
│   ├── (dashboard)/        # Protected dashboard pages - 11 pages
│   └── api/                # API routes - 101 route.ts files
├── components/             # React components (137 files)
│   ├── ui/                 # shadcn/ui + custom components (63 files)
│   ├── layout/             # Layout components (5 files)
│   ├── sections/           # Page section components (32 files)
│   ├── events/             # Event-related components (9 files)
│   ├── chatbot/            # AI chatbot components (7 files)
│   ├── data-table/         # Advanced data table system (7 files)
│   ├── gallery/            # Photo gallery components (3 files)
│   ├── admin/              # Admin panel components (2 files)
│   ├── forms/              # Form components (1 file)
│   ├── dashboard/          # Dashboard utilities (1 file)
│   └── spotify/            # Spotify embed component (1 file)
├── lib/                    # Core business logic (53 files)
│   ├── auth/               # Authentication (14 files)
│   ├── data/               # Static data files (12 files)
│   ├── db/                 # Database layer (7 files + migrations)
│   ├── matching/           # AI matching system (7 files)
│   ├── config/             # Navigation and configuration (4 files)
│   ├── stripe/             # Payment integration (2 files)
│   ├── cloudinary/         # Image storage service (1 file)
│   ├── email/              # Email: service, senders, gates, optouts, tokens, webhook-verify
│   ├── forms/              # Form management (2 files)
│   ├── slack/              # Slack webhook notifications (1 file)
│   ├── points/             # Gamification system (1 file)
│   ├── invitations/        # Invitation code system (1 file)
│   ├── notifications/      # Notification service (1 file)
│   └── user/               # User management (1 file)
├── hooks/                  # Custom React hooks (6 files)
├── types/                  # TypeScript type definitions (7 files)
├── styles/                 # Global and component styles (4 files)
├── public/                 # Static assets (images, logos, icons)
├── docs/                   # Project documentation
├── report/                 # Typst funder-report project — NOT part of the Next.js build
└── scripts/                # Build and utility scripts
```

## Page Routes Structure

### Public Pages (`/(site)/`)

> 26 `page.tsx` files as of 2026-07-31. The table below is indicative and has drifted; re-count before quoting it.

| Route | Description |
|-------|-------------|
| `/` | Home page with hero, impact, values, programs |
| `/about` | Organization mission, team, timeline |
| `/mentorship` | Mentorship program overview |
| `/mentorship/mentor` | Mentor application form |
| `/mentorship/mentee` | Join as mentee |
| `/mentorship/mentee/payment` | Mentee payment processing |
| `/mentorship/mentee/success` | Payment success page |
| `/events` | Event listings |
| `/events/[slug]` | Individual event details |
| `/resources` | Media resources hub (podcasts, newsletters, gallery) |
| `/donate` | Donation page |
| `/donate/checkout` | Donation checkout |
| `/donate/success` | Donation success page |
| `/sponsors/corporate-sponsorship` | Sponsorship information |
| `/join-our-team` | Volunteer recruitment |

### Authentication Pages (`/(login)/`)
| Route | Description |
|-------|-------------|
| `/sign-in` | Login (Email/Password + OAuth) |
| `/sign-up` | Registration |
| `/forgot-password` | Password recovery |
| `/reset-password` | Password reset |
| `/verify-email` | Email verification |
| `/verify-invitation` | Invitation code verification |

### Dashboard Pages (`/(dashboard)/dashboard/`) - 11 pages
| Route | Description |
|-------|-------------|
| `/dashboard` | Main dashboard (role-based content) |
| `/dashboard/account` | Account settings |
| `/dashboard/mentor-profile` | Mentor profile editing |
| `/dashboard/mentee-profile` | Mentee profile editing |
| `/dashboard/mentorship` | Mentorship relationships |
| `/dashboard/meetings` | Meeting management |
| `/dashboard/admin` | Admin overview |
| `/dashboard/admin/users` | User management |
| `/dashboard/admin/matching` | AI matching dashboard |
| `/dashboard/admin/mentors/relationships` | Relationship management |
| `/dashboard/admin/mentors/meetings` | Meeting oversight |

### Legal & Static Pages (standalone)
Located in `/app/` root directory (8 pages):
- `/accessibility`, `/code-of-conduct`, `/cookie-policy`
- `/privacy-policy`, `/security-policy`, `/terms-of-service`
- `/not-found` (404 page), `/volunteers/code-of-conduct`

## Key Features

### Public-Facing Features
- **About Pages**: Organization mission, team, and volunteer information
- **Mentorship Program**: Mentor profiles, mentee application, AI-powered matching
- **Events Platform**: Upcoming events, registration, THRIVE program
- **Media Hub**: Podcasts, newsletters, photo galleries, press coverage
- **Support Options**: Donation and corporate sponsorship pages
- **Contact System**: Contact forms with DB storage and Slack notifications
- **AI Chatbot**: Knowledge-grounded AI agent (Vercel AI SDK 6 `ToolLoopAgent`) that answers about events/mentorship/team/sponsors/donate/volunteer from live data with in-site links. See `docs/development/CHATBOT_AI_AGENT.md`

### Technology Stack
- **Framework**: Next.js 15.4.0 with App Router
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: NextAuth 5.0 (OAuth) + Custom JWT using bcrypt
- **UI**: shadcn/ui components (63 components) with Tailwind CSS v4
- **Styling**: Tailwind CSS with PostCSS and custom brand colors
- **AI**: Chatbot = Vercel AI SDK 6 agent on OpenAI GPT-4o-mini with tool calling (direct OpenAI, NOT the AI Gateway — see chatbot doc); mentor matching = OpenAI GPT-4
- **Email**: Resend for transactional + notification mail and the newsletter *pilot*; **Mailchimp still sends the live monthly newsletter** (see the Monthly Newsletter section). Domain auth for both lives in `docs/deployment/EMAIL_AUTHENTICATION.md`
- **Notifications**: Slack Incoming Webhooks for form submission alerts (volunteer, contact)
- **Payments**: Stripe for subscriptions and one-time payments
- **Charts**: Recharts for analytics dashboards
- **Tables**: TanStack Table with dnd-kit for drag-and-drop

### Core Architecture Patterns

1. **Authentication Flow** (`/lib/auth/`):
   - Session management via encrypted JWTs stored in httpOnly cookies
   - **The middleware file is `proxy.ts` at the repo root, not `middleware.ts`** (Next.js 15 naming). It exports `proxy()`, whose matcher covers the whole site (minus `_next/static`, `_next/image`, `logos`, `favicon.ico`). It does three things, in order: serves a 503 maintenance page when `MAINTENANCE_MODE=true`; **308-strips legacy Webflow pagination query params** (`stripLegacyPaginationParams`, GET only, skips `/api/` — see the SEO section); then auth-gates `/dashboard` and `/verify-invitation`. Apart from the param strip, every other route — including all of `/api` — passes straight through
   - Sign up/sign in handled in `/app/api/auth/` routes
   - Account locking after 5 failed attempts (15 min lockout)
   - Password strength validation and history tracking

2. **Multi-Role System**:
   - Users can activate multiple roles independently (mentor, mentee, admin)
   - Role-specific profiles stored in separate tables
   - Dynamic dashboard based on active roles
   - Fine-grained admin permissions via `admin_permissions` table

3. **AI Matching System** (`/lib/matching/`):
   - OpenAI GPT-4 powered compatibility analysis
   - Matching factors: MBTI, skills, goals, industry, logistics
   - Waiting queue management for mentees
   - Confidence level scoring (high/medium/low)
   - Batch matching with caching

4. **Database Schema** (`/lib/db/schema.ts`):
   - **Total**: 46 tables and 24 enums supporting comprehensive platform features
   - **User System** (5 tables): `users`, `user_roles`, `admin_permissions`, `user_memberships`, `user_mentorship_stats`
   - **Authentication** (6 tables): `account`, `session`, `verification_token`, `email_verifications`, `password_resets`, `password_history`
   - **Mentorship** (5 tables): `mentor_profiles`, `mentee_profiles`, `mentorship_relationships`, `meetings`, `mentee_waiting_queue`
   - **Form Submissions** (3 tables): `mentor_form_submissions`, `mentee_form_submissions`, `contact_form_submissions`
   - **AI Matching** (2 tables): `ai_match_results`, `ai_matching_runs`
   - **Events** (3 tables): `events`, `event_registrations`, `event_role_assignments`
   - **Resources** (2 tables): `resources`, `resource_access_logs`
   - **Points & Gamification** (8 tables): `user_points`, `points_transactions`, `points_rules`, `milestones`, `user_milestones`, `rewards`, `reward_redemptions`, `experience_levels`
   - **Membership & Payments** (3 tables): `membership_features`, `membership_benefits`, `membership_purchases`
   - **Invitation System** (2 tables): `invitation_codes`, `invitation_code_usages`
   - **Configuration** (2 tables): `skill_options`, `industry_options`
   - **Notifications** (1 table): `notifications`
   - **Activity Logging** (1 table): `activity_logs`
   - **Legacy** (3 tables): `teams`, `team_members`, `invitations` (kept for backward compatibility)
   - See detailed documentation: `docs/database/DATABASE_SCHEMA.md`

5. **Route Protection**:
   - Public routes: `(site)` group - content pages
   - Auth routes: `(login)` group - authentication pages
   - Protected routes: `(dashboard)` group - requires valid session
   - API routes use `getUser()` for session validation

## Component Architecture

### UI Components (`/components/ui/`) - 63 files
Based on shadcn/ui with Tailwind CSS:
- **Form inputs**: input, textarea, checkbox, radio-group, select, switch, slider
- **Data display**: table, pagination, badge, avatar, progress, card, calendar
- **Overlays**: dialog, sheet, popover, alert-dialog, drawer, hover-card
- **Navigation**: navigation-menu, breadcrumb, sidebar, tabs, menubar
- **Utilities**: button, skeleton, spinner, tooltip, separator, scroll-area

### Layout Components (`/components/layout/`) - 5 files
- `site-header.tsx` - Main navigation with responsive menu
- `site-footer.tsx` - Footer with links, social media, newsletter
- `container.tsx` - Responsive content container
- `section.tsx` - Page section wrapper
- `user-nav.tsx` - User account dropdown menu

### Section Components (`/components/sections/`) - 30 files
Organized by feature:
- `home/` (6) - hero, core-impact, core-values, programs, upcoming-event, sponsors
- `about/` (4) - about-hero, team, timeline, smooth-scroll-hero
- `mentorship/` (3) - how-it-works, testimonials, mentors/mentors-list
- `events/` (3) - events-hero, featured-event, events-list
- `sponsorship/` (3) - sponsorship-hero, packages, current-sponsors
- `resources/` (9) - impact-report, resources-page-client, bento-showcase, bento-cards/*
- `donate/` (1) - donation-amount-buttons
- Root level (1) - media-section

### Feature Components
- **Chatbot** (`/components/chatbot/`) (7 files) - AI agent UI (AI SDK 6 `useChat`); business logic lives in `lib/chatbot/` (agent, tools, knowledge, rate-limit, analytics). See `docs/development/CHATBOT_AI_AGENT.md`
- **Data Table** (`/components/data-table/`) (7 files) - TanStack Table with drag-and-drop columns
- **Events** (`/components/events/`) (9 files) - Event cards, registration, calendar integration
- **Gallery** (`/components/gallery/`) (3 files) - Photo gallery with lightbox
- **Admin** (`/components/admin/`) (2 files) - Dashboard charts, analytics

### Custom Hooks (`/hooks/`) - 6 files
- `use-animate-on-scroll.ts` - Scroll-triggered animations
- `use-in-view.ts` - Intersection Observer wrapper
- `use-media-query.ts` - Responsive breakpoint detection
- `use-mobile.ts` - Mobile device detection
- `use-prefers-reduced-motion.ts` - Accessibility motion preferences
- `use-scroll-to-hash.ts` - Smooth scroll to anchor links

### Type Definitions (`/types/`) - 7 files
- `mentor.ts` - Mentor profile types
- `team.ts` - Team member types
- `event.ts` - Event data types
- `gallery.ts` - Photo gallery types
- `newsletter.ts` - Newsletter types
- `spotify.ts` - Spotify embed types
- `impact-report.ts` - Impact report types

## API Routes Summary

> **101 `route.ts` files as of 2026-07-31** (`find app/api -name route.ts | wc -l`). The per-category breakdown below is **indicative, not exhaustive** — it was written when there were ~71 and has drifted. Trust the filesystem over these numbers; re-count before quoting them.

### Authentication (`/api/auth/`) - 11 endpoints
- NextAuth handler (`[...nextauth]`), CSRF protection
- OAuth sign-in, providers list
- Password reset flow (forgot/reset), email verification
- Sign-out handling, existing user verification

### User (`/api/user/`) - 10 endpoints
- Profile management (view, update, photo)
- Role switching, roles list
- Password update, connected OAuth accounts
- Mentor/mentee profile endpoints
- Account deletion

### Mentorship (`/api/mentorship/`, `/api/mentors/`, `/api/mentees/`) - 6 endpoints
- Apply for mentorship, approval workflow
- Relationship management
- Mentor/mentee profile retrieval by ID

### Meetings (`/api/meetings/`) - 2 endpoints
- Meeting CRUD operations

### Forms (`/api/forms/`) - 4 endpoints
- Mentor and mentee application forms
- Public submission endpoints for unauthenticated users

### Admin (`/api/admin/`) - 17 endpoints
- User management (list, bulk operations, roles)
- Mentor applications review
- Relationships and meetings oversight
- AI matching dashboard and queue
- Invitation codes, permissions, analytics
- Pending tasks counter

### Payments (`/api/stripe/`) - 3 endpoints
- Checkout session creation
- Donation processing
- Webhook handling for payment events

### Events (`/api/events/`) - 4 endpoints
- Event CRUD and registration
- User registration history

### Contact (`/api/contact/`) - 1 endpoint
- Contact form submission (DB storage + Slack notification)

### Other Endpoints
- `/api/resources/` (3) - Resource management and downloads
- `/api/notifications/` (2) - Notification handling and preferences
- `/api/chat/` - AI chatbot agent (AI SDK 6 ToolLoopAgent, tool calling over live data; per-IP rate limit + question analytics)
- `/api/invitation-codes/validate` - Code validation
- `/api/matching/suggestions` - AI match suggestions
- `/api/dashboard/overview` - Dashboard data
- `/api/analytics/dashboard` - Analytics data
- `/api/activity-logs` - Activity logging
- `/api/upload/photo` - Photo uploads
- `/api/cron/process-queue` - Background job processing
- `/api/team` - Team data
- `/api/email/unsubscribe` - RFC 8058 one-click unsubscribe. **POST is unauthenticated and returns a bare 200** (providers post from their own infra and treat 3xx as failure); **GET must never mutate** — link scanners prefetch it
- `/api/webhooks/resend` - Bounce/complaint capture, Svix-signed. Writes `email_optouts`; complaints also post to Slack
- `/api/newsletter/subscribe` - Resend audience opt-in. **Exists but no UI calls it** — the site's 16 sign-up links still point at Mailchimp

## Static Data Files (`/lib/data/`) - 12 files

These files contain static content that can be updated without database changes:
- `team.ts` - Team member profiles and roles
- `mentors.ts` - Featured mentor data
- `events.ts` / `events-data.ts` - Event listings and metadata
- `testimonials.ts` - User testimonials
- `newsletters.ts` - Newsletter archive data
- `spotify-podcasts.ts` - Podcast episode links
- `gallery-albums.ts` - Photo gallery albums
- `impact-reports.ts` - Annual impact reports
- `donate-showcase.ts` - Donation tier information
- `join-team.ts` - Volunteer positions
- `stats.ts` - Platform statistics (members, events, sponsors)

## Key Development Patterns

1. **Server Components by Default**: Use `'use client'` only when needed
2. **Data Fetching**: Direct database queries in Server Components
3. **Form Handling**: Server Actions with `'use server'` directive
4. **Error Handling**: Consistent error boundaries and try-catch in Server Actions
5. **Type Safety**: Leverage TypeScript and Drizzle's type inference
6. **Caching**: Match results and mentor profiles cached for performance

## SEO & GEO (Generative Engine Optimization)

The site is optimized for both search engines and generative engines (ChatGPT, Claude, Perplexity, Google AI Overviews). Shipped 2026-06-23 and **live on production**: sitemap submitted to Google Search Console (domain property, verified) and Bing; 5 key URLs requested for indexing; 15 stale junk sitemap entries cleaned up; a pre-optimization AI-visibility baseline captured; and a one-time cloud routine scheduled (~2026-07-23) to re-run the baseline comparison. Live status of all follow-ups lives in the **backlog** doc (below).

**Source of truth**: `lib/seo/site.ts` — canonical origin, org facts, social links. Keep in sync with `metadataBase` in `app/layout.tsx` and `footerConfig` in `lib/config/footer.ts`.

**Generated routes** (Next.js metadata routes — independent of the root `force-dynamic`):
- `app/robots.ts` — allows crawling (minus dashboard/api/auth), explicitly authorizes AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, …), advertises the sitemap.
- `app/sitemap.ts` — static routes (in `STATIC_ROUTES`, incl. the mentor/mentee landing pages) + every event slug via `getAllEvents()` (**120 URLs** as of 2026-07-31). The two `/mentorship/*/apply` routes are deliberately **not** in `STATIC_ROUTES`: they are `noindex`, and a noindex URL in the sitemap is the contradiction GSC reports as "Submitted URL marked 'noindex'". Do not re-add them when the registration window reopens. `/events/*/feedback` and `/f/*` are absent for the same reason — see the Event Feedback section.
- `app/manifest.ts` — PWA manifest (brand purple `#9b2e83`).
- `public/llms.txt` (static AI guide) + `app/llms-full.txt/route.ts` (dynamic full index from events/team/stats/press).

**Structured data**: `lib/seo/schema.ts` builders + `components/seo/json-ld.tsx`. Organization/NGO + WebSite injected in root layout; Event + BreadcrumbList in `app/(site)/events/[slug]/page.tsx`; Person (team) on `/about` via `app/(site)/about/layout.tsx` (`personSchema` over `teamMembers`). When adding a domain type (FAQ, Product, etc.), the schema must match **visible** page content — e.g. FAQPage requires a real on-page Q&A section (the `/mentorship` "how it works" is a step timeline, not Q&A, so no FAQ schema there yet).

**Inline AI hints**: `components/seo/geo-head.tsx` emits `<script type="text/llms.txt">` on home/events/mentorship/donate.

**Legacy redirects**: `next.config.ts` → `redirects()` permanently (308) maps pre-migration URLs that are still in search indexes but now 404 (`/about-us`, `/contact-us`, `/media/*`, `/mentorship/mentorship-program`, …) onto current routes. Extend this map when GSC surfaces more legacy 404s. More specific rules must come **before** the `/media/:path*` catch-all — `/media/photo-gallery` silently landed on `/resources` instead of `/resources/photo-gallery` until it got its own line.

**Legacy query-param duplicates** (fixed 2026-07-31): the pre-migration Webflow site used `?<8-hex>_page=N` pagination params, still in Google's URL list. Next.js ignores unknown params and serves an identical **200**, so each variant was a duplicate page — GSC filed four of them under "Duplicate without user-selected canonical". `proxy.ts` now 308-strips any query key matching `/^[0-9a-f]{6,}_page$/i`. **Middleware, not `next.config` `redirects()` + `has`**, because `has` needs an *exact* query key while the hash prefix varies per Webflow list. Full write-up: item 3b in `GEO_SEO_BACKLOG.md`.

**Three metadata gotchas (do not regress):**
1. **Title template** `%s | She Sharp` (root layout) does NOT cascade through an intermediate layout that sets its own string `title`. Pages under `events/layout`, `mentorship/mentor/layout`, `mentorship/mentee/layout` must give child pages an explicit `title: { absolute: "X | She Sharp" }`.
2. **No root-level `alternates.canonical`** — it cascades to every page and makes them all canonicalize to the homepage. Set canonicals per page (the home page sets its own `/`).
3. **`robots: { index: false }` under a segment whose parent declares a canonical needs a self-canonical too.** `alternates.canonical` cascades, so the noindexed child ships `noindex` *plus* a canonical pointing at its parent — a contradictory pair Google can resolve by applying the noindex to the **parent**. Both `/mentorship/{mentee,mentor}/apply` layouts hit this; they now set `robots` **and** their own canonical. `/events/[slug]/feedback` is the third case and the most dangerous, because its parent `app/(site)/events/layout.tsx` canonicalises to `/events` — getting it wrong de-indexes the events hub, not the form. Render-test it (see below) — the two apply pages `redirect()` away outside the registration window, so the bad metadata was invisible until `MENTORSHIP_CONFIG.registrationDeadline` was temporarily moved forward. **Marking a route `noindex` also means removing it from `app/sitemap.ts`** — the two changes travel together.

**Verify after metadata edits**: `pnpm build && PORT=3xxx pnpm start`, then curl `<title>`/canonical/JSON-LD. Kill any orphan `next start` first (a stale server on the port silently serves an OLD build and makes changes look broken). For pages behind a date/feature gate, temporarily move the gate so the page actually renders — a redirecting page emits no metadata, so its `<head>` bugs stay invisible. Revert the gate before committing.

**Search Console access**: the property is the **Domain** property `sc-domain:shesharp.org.nz`, reachable **only** from the `website@shesharp.org.nz` Google account, which lives in a *different Chrome instance* from the maintainer's usual profile. Guessing `authuser=1/2` URLs does not find it. With `claude-in-chrome`, use `switch_browser` (broadcasts a Connect prompt to every Chrome so the user picks) rather than `select_browser` — two separately-listed deviceIds both resolved to the same wrong profile.

**Docs** (in `docs/development/`): `GEO_SEO_IMPLEMENTATION_GUIDE.md` — reusable how-to (incl. browser-side GSC/Bing setup); `GEO_SEO_MONITORING.md` — KPIs + the 2026-06-23 baseline; `GEO_SEO_BACKLOG.md` — prioritized follow-ups with live status.

## Event Presentation Decks

Slide decks for in-person events, projected from `/present/<event-slug>`. Shipped 2026-08-01 (PR #90), rebuilt on the photographic archive the same day (PR #91). First deck: `/present/aotearoa-ai-hackathon-festival-2026` (**38 slides**).

**A deck is data.** `lib/deck/types.ts` is a discriminated union of 18 slide types; `components/deck/slide-renderer.tsx` maps each to one layout in `components/deck/slides/` behind a `never` guard, so a new slide type without a layout is a compile error. `lib/deck/boilerplate.ts` generates the fixed organisational sequence (title → karakia → H&S → we-are-She-Sharp → team → impact → sponsors → contact QRs → … → thanks → upcoming → feedback QR → ambassador QR → closing karakia) **from live site data** (`lib/data/team.ts`, `stats.ts`, `sponsors.ts`, `lib/config/footer.ts`), so a new event deck is one file in `lib/deck/decks/` plus one line in `lib/deck/registry.ts`.

**Non-technical organisers use the `/build-event-slides` skill** (`.claude/skills/build-event-slides/`). They never touch TypeScript.

### The visual language is the archive

The first version was white canvas, navy ink, purple accent, with photography as a plate beside the text. It was competent and anonymous, and it was rejected on exactly that basis.

The archive is ~400 photographs and they are overwhelmingly **the same shot**: sixty to a hundred and fifty women in a fluorescent-lit meeting room, everyone facing camera. Individually weak — no negative space, faces small, white balance spanning four stops. Collectively, twelve years of it, the whole story. So the archive is used as **mass**: tile walls, mosaics, bands, words cut out of the wall, never a single hero image.

- `lib/deck/wall-tiles.ts` — **118 tiles at 520px WebP, 2.8 MB for the whole pool**, plus `pickWallTiles(count, offset)` which steps through rather than slices, so a wall stays mixed across eras. At source resolution one wall slide was ~31 MB of transfer and ~1 GB of decoded bitmap; a 4898×3265 photograph was being drawn into a tile 259px wide. **Never point the wall at full-resolution originals.**
- **Photographs used en masse are duotoned; a single photograph used as the subject stays full colour.** The grade is mandatory, not stylistic — the pool spans about four stops of colour temperature across three eras (2015–18 magenta flash, 2019–23 green fluorescent, 2024–26 warm tungsten) and does not read as one deck untreated.
- **Photo-knockout type works at display scale on short words and numerals only.** A giant `01` reads; the word `Aotearoa` was unreadable mush.
- `public/img/plates/` — six generated backgrounds (gpt-image-2) with a typed manifest. They exist because the archive contains **no landscape, coastline, sky or dawn at all**. Scope is declared in the manifest and is not negotiable: **whenua only, never people, never taonga, nothing mistakable for a real She Sharp event.** Where a real photograph will do the job it does the job — the opening karakia uses She Sharp's own koru photograph even though a generated plate measured better for setting type over.

### The stage is fluid, not fixed 16:9

Design height is a constant 1080; width flows with the display, clamped to 4:3–21:9, so every venue screen fills edge to edge with no letterboxing (portrait falls back to a centred 4:3). Four layout rules follow, and all four fail *silently* — see `styles/components/deck.css`:

1. **Never `vw`/`vh`/`dvh` inside `.deck-stage`** — they resolve against the real viewport, not the scaled stage, so they do not scale. This bans the site's `.text-display-*` utilities in here. Use `cqi` or fixed design px, and the `.deck-*` type classes rather than Tailwind `text-*`.
2. The stage is centred with `translate(-50%, -50%) scale()`, **not** flex/grid alignment — grid parks an oversized item at the start edge.
3. Grid tracks must be `minmax(0, 1fr)` before a percentage `max-block-size` on a child means anything.
4. **Responsive `--dt-*` overrides land on `.deck-slide`, never on `.deck-stage`** — the stage *is* the named container, and an element cannot match a container query against its own container. Writing it on `.deck-stage` compiles, never applies, and silently leaves a 4:3 projector running the 21:9 type scale.

Layouts prefer `repeat(auto-fit, minmax(Npx, 1fr))` over breakpoints, and Tailwind container-query variants (`@max-[1560px]/deck:`) where auto-fit will not do. `useFitContent()` in `slide-frame.tsx` scales an overflowing slide down as a **last resort** — treat any slide that triggers it as a defect to fix by cutting copy, splitting the slide or changing the layout, in that order. Shrinking type is not the fix.

### Copy, rhythm and the kicker are all enforced

`lib/deck/lint.ts` fails the build, and `lib/deck/deck.test.ts` asserts it. Three families of rule:

- **Copy** — title ≤7 words, lead ≤18 words and one sentence, ≤5 bullets of ≤10 words with no full stops, run-sheet labels ≤6 words, people per slide by density (`sm` 20 / `md` 8 / `lg` 4), accent contrast ≥4.5:1 on its own canvas.
- **Rhythm** — ≤2 consecutive full-frame slides, ≤4 consecutive information slides, ≤4 consecutive slides of one tone, ≥25% dark in a deck of 12+, ≥8 distinct layouts in a deck of 10+. *A deck can pass every copy rule slide by slide and still be unwatchable; the shipped deck had eight consecutive light information slides.* Fix a run by inserting a divider or a photographic beat, not by recolouring one slide.
- **The kicker** — `slide.eyebrow` names *this* slide; `slide.section` names the chapter and repeats. The linter rejects one restating the other (`echoes()` catches "Day One" vs "Day one begins"). Good ones tell the room what to do: "Stand if you are able", "Doors at five, dinner on arrival". They arrive as asides during the interview, not by asking for them.

Long-form material — bios, IP terms, rules, the full venue list — stays on the event page and is reached by a QR slide.

**Accents are a pair.** Brand purple `#9b2e83` is only 2.92:1 on the near-black canvas, so dark slides use `#c846ab` (4.61:1). Per-event customisation = `theme.accent` plus that event's photos.

### Motion

`lib/deck/motion.ts` owns **entrances**, one semantic recipe per slide type (the wall fills tile by tile, figures count up, run-sheet rows reveal in reading order, the karakia is the slowest thing in the deck). `deck.css` owns **ambient loops** only (wall drift, plate swell). Keeping both in CSS once produced a visible flicker: a CSS entrance holds `opacity: 0` through its delay with `backwards` fill, so a shorter scripted entrance finishing first made the element blank and rise twice. **Do not re-add entrance animations to CSS.**

`L` toggles a low-power static mode (persisted in `localStorage`, defaults to the OS reduce-motion setting) for old venue laptops. It stops motion, not image loading.

### Everything else

- **Checks**: `npx tsx lib/deck/deck.test.ts`, `npx tsx scripts/deck/lint-deck.ts [slug]` (a report an organiser can act on), `npx tsx scripts/verify-image-paths.ts`.
- **Scaffold**: `npx tsx scripts/deck/new-deck.ts <event-slug>`.
- **Host controls are discoverable, and that is deliberate.** A `?` panel nobody knows to press is not a feature — before this, no host had ever opened the overview grid or the static-mode switch because nothing on screen said they existed. Two affordances now carry it, both for the person at the laptop and never for the room: a **first-run card** (`DeckCoach`, once per browser via `localStorage`, dismissed by any key or click because the deck may already be on the projector) showing the four keys that matter, and a persistent **`? keys` chip** that rides the same idle fade as the rest of the chrome — visible while someone is touching the machine, gone three seconds later. Neither appears in `?print=1`. **Any new control needs a visible route to it or it does not exist.**
- **Host controls**: arrows/Space next, `O` overview + jump, `F` fullscreen, `B` blackout, `L` static mode, `?` help. **Space starts/pauses the countdown on `break` slides instead of advancing.** `?print=1` renders all slides at 960×540 for a Ctrl+P PDF backup, and is the only place `slide.note` appears. `?aspect=4:3` locks the stage aspect — the fastest way to test a narrow projector without resizing a window.
- **QR codes are generated from the URL in the browser** (`DECK_QR_MODE = "generate"`), so a link and its code cannot drift apart and generation never touches the network. `QrBlock.image` remains an escape hatch for a pre-made code. **A URL you do not have yet is `""`, never a guess** — the slide then shows a "Link not set yet" panel and the linter reports it.
- **The feedback code is derived, not pasted.** `feedbackQrFor()` in `boilerplate.ts` builds it from the required `ClosingOptions.eventSlug` via `lib/data/feedback-codes.ts`, and `lintDeck()` re-checks it against the deck's own slug — `feedback-qr-event-mismatch` is an **error**, because a code pointing at last month's event looks perfectly correct from the front of the room while collecting the wrong data. That check was impossible while the destination was a Google Form URL, which is exactly why `feedbackQr` used to be required-with-no-default; the requirement moved to `eventSlug` rather than disappearing. It encodes the short `/f/<code>` alias, not `/events/<slug>/feedback`: 36 bytes fits a 29×29 code at level `M` while the long path needs 37×37 — same projector area, 28% larger modules, and short enough to read aloud.
- **A Google Form with a file-upload question always forces sign-in** and there is no setting to disable it. This is why `AMBASSADOR_FORM_URL` points at `shesharp.org.nz/join-our-team` rather than at the form. **Open every QR destination in a signed-out browser before an event** — the person building the deck is always signed in and is the one person who cannot see this class of problem. (The feedback form is no longer a Google Form for the same reason, plus two others: the per-event form had no safe default, and its answers landed in one person's Drive instead of the database.)
- **Offline**: every slide stays mounted and all images preload with a visible progress chip; after first load the deck makes zero network calls. Reloading is the only thing that needs the venue wifi.
- **SEO**: `/present/*` is `noindex`, must stay **out of `app/sitemap.ts`**, and must **not** be added to `robots.ts` `DISALLOWED_PATHS` (a Disallow stops crawlers reading the noindex).
- **Root-layout side effects**: the cookie banner carries `data-cookie-banner` so `deck.css` can hide it under `html[data-present]`; `scrollbar-gutter: stable` is overridden there too. `force-dynamic` cannot be overridden per-segment (the root layout awaits `cookies()`), so don't try.
- **The archive's one real gap**: there is no photograph anywhere of a mentor and mentee one to one — the flagship programme has no picture of itself. Worth asking someone to take one at the next event.

## Event Feedback

Post-event attendee feedback is collected by **She Sharp's own form**, not a per-event Google Form. Shipped 2026-08-03, in time for the Aotearoa AI Hackathon Festival on 7 August.

- **Routes**: `/f/<code>` (`app/f/[code]/route.ts`) 307-redirects to `/events/<slug>/feedback?s=qr`; the form itself is `app/(site)/events/[slug]/feedback/page.tsx` + `components/events/event-feedback-form.tsx`; it POSTs to `app/api/event-feedback/route.ts` → `lib/forms/event-feedback-service.ts`.
- **Short codes**: `lib/data/feedback-codes.ts` derives one per event from the slug (initials of the meaningful segments, short numbers kept intact, plus a two-digit year — `aotearoa-ai-hackathon-festival-2026` → `aahf26`). `FEEDBACK_CODE_OVERRIDES` exists for collisions; `deck.test.ts` fails the build on a duplicate. **When a collision fires, the override goes on the NEWER event** — moving an old code invalidates every exported PDF and every code someone has already scanned. `feedbackUrlForSlug()` builds from the compile-time `SITE_URL`, never `getBaseUrl()`/`BASE_URL`: a projected QR that encoded `localhost` would render perfectly and fail on every phone in the room. The redirect handler has the **opposite** rule and resolves against `request.url` so local testing stays local.
- **307, not 308.** A permanent redirect is cached by the phone forever; a code that ever has to be re-pointed would be unrecoverable on every device that already scanned it.
- **Table** `event_feedback_submissions` keys on `event_slug` (a plain varchar). The Postgres `events` table is unrelated to the public site's JSON source of truth, and `event_registrations` cannot hold this because its `userId` is `NOT NULL` and the form has no login. No unique constraint on `(event_slug, email)` — shared household addresses are real; de-dup is a 24-hour last-write-wins update in the service.
- **Rate limiting is per-device, not per-IP** — a hall of 100 people is one NAT address, so the newsletter route's `slidingWindow(5, "1 h")` would collect five responses and look exactly like "nobody cared". Two limiters: `300/h` keyed `IP:eventSlug` (venue flood guard, per-event so one busy night can't exhaust the next), and `3/h` keyed on the `x-ss-device` header (a UUID the client keeps in `localStorage`). Both **degrade open**. A 429 renders the *success* state client-side, or a double-tapping attendee concludes the form is broken.
- **`interestedInNewsletter` is not Resend consent.** The mailing list is governed by the four-way gate in `.claude/skills/update-mailing-list/references/consent-rules.md`; nothing may write to Resend from this public endpoint. Record the flag, surface it in Slack, let the skill import.
- **Slack**: `sendEventFeedbackSlackNotification()` posts to **`#event-feedback-notifications`** (`C0BNF213HR6`) via `SLACK_EVENT_FEEDBACK_WEBHOOK_URL`, falling back to `SLACK_CONTACT_WEBHOOK_URL`. Wired 2026-08-03 and verified end to end. The webhook belongs to its **own Slack app**, also called `event-feedback-notifications` (`A0BM5AQ09RV`) — this workspace runs one app per notification stream (`contact-form-notifications`, `mentorship-weekly-stats`, `funding-digest`, …) rather than hanging several webhooks off one app, so each stream can be revoked on its own and the sender name in Slack says which stream it is. The rating is in the message **header** so a week of feedback is scannable off the Slack message list without opening a card, and the `Feedback #<id>` context footer mirrors contact's `Submission #<id>` so tooling can join back to the row. Keep the two free-text answers in separate blocks clamped to 2,800 chars — Slack rejects the whole message above 3,000 per section, and the sender swallows the error, so the row would exist while the notification silently vanished.
- **SEO**: `noindex, follow` **plus its own canonical** — the parent `events/layout.tsx` canonicalises to `/events`, and the inherited pair would let Google apply the noindex to the hub. Stays out of `app/sitemap.ts` and must **not** go in `robots.ts` `DISALLOWED_PATHS`.
- **Name and email are required** (since 2026-08-03), enforced in the form and again in the zod schema. The cost is invisible in the data and worth remembering: everyone who would have answered anonymously now either identifies themselves or abandons, and the people most likely to abandon are the ones with something critical to say. If response volume drops, look here first.
- **De-dup window is 2 hours**, narrowed from 24 when email became required. A 24-hour overwrite silently destroys two real things: multi-day events (a festival's Day One and Day Two feedback arrive from the same person inside 24 hours) and shared household addresses. Two hours still covers a double-tapped submit and a quick correction.
- **The interest checkboxes subscribe nobody.** The live newsletter goes out through **Mailchimp**, not Resend, and a ticked box is not a subscription record under `.claude/skills/update-mailing-list/references/consent-rules.md`. The digest prints the counts and `npx tsx scripts/events/feedback-interests.ts <slug>` prints the list, so a human can act — without that prompt the boxes promise something nobody delivers.
- **Digest**: `app/api/cron/event-feedback-digest/route.ts` posts one aggregate per event **3 days after** it ran (daily cron `0 21 * * *`), computed by `lib/forms/event-feedback-summary.ts` — responses over attendees, mean rating, NPS with its own denominator, would-come-again, interest counts, and the free text. Idempotency is an `activity_logs` row (`SEND_EVENT_FEEDBACK_DIGEST`, `metadata->>'eventSlug'`); `action` is a text column so no migration was needed. `POST {eventSlug}` re-sends on demand. Zero responses posts a "nothing came in" note rather than staying silent — silence is indistinguishable from the job failing, and it usually means the QR never went up.
- **Retention: personal columns expire at 12 months, the answers never do.** `lib/forms/event-feedback-retention.ts` + `npx tsx scripts/events/purge-feedback-personal-data.ts [--apply]` null `name` and `email` past the window and leave everything else. Anonymise rather than delete: Privacy Act 2020 IPP 9 concerns the identity, while the ratings and free text are the organisation's own record of how its events went and feed the funder report. Dry run is the default because this cannot be undone.
- **The form names the private route for anything serious** — `conduct@shesharp.org.nz` and `/code-of-conduct`, placed under "What should we do differently" rather than in a footer, because that is the field where someone who had a bad experience starts typing and this form is the wrong channel for it: public team channel, attached to their name, nobody on duty.
- **`MAINTENANCE_MODE=true` takes the feedback form down too** — `proxy.ts`'s matcher covers `/f/*` and `/events/*/feedback`. Worth a line in the run-sheet.

## Funder Reports (Typst → PDF)

`report/` builds **`public/docs/she-sharp-half-year-report-2026-h1.pdf`** — a 30-page A4 sponsor/funder-facing report for Jan–Jun 2026, in the visual language of the prior editions (`public/docs/she-sharp-impact-report-{2024,2025}.pdf`). Shipped 2026-08-01 (PR #93). It is a **Typst** project, not part of the Next.js build; nothing imports it and `pnpm build` never touches it.

```powershell
pwsh report/build.ps1          # draft → report/out/  (-Png for page previews)
pwsh report/build.ps1 -Final   # the shipping PDF — BLOCKED while any metric is unverified
```

**Read `report/PITFALLS.md` before editing anything under `report/`.** Every rule in it is a bug the compiler does not catch, and its second half covers the failures that layout rules cannot catch at all. `report/README.md` is the how-to.

- **Every number carries its provenance.** Metrics are dicts `(value, src: "verified"|"placeholder"|"estimate", note)`. `data/report-data.typ` is the **single file to edit** when real data arrives. Unverified figures render with an amber marker in draft and `panic()` a `-Final` build. **64 are unverified today** — that is the honest state of H1 2026's measurement, not a defect. The gate also covers `sector-all-metrics`, which lives outside `D`.
- **Typst cannot read WebP usefully** — it decodes to raw Flate at 14–17× (a 73 KB WebP adds 1.26 MB). `scripts/prepare-assets.mjs` converts to JPEG via `sharp` first; the whole event archive and curated pool are WebP, so skipping this step yields a ~65 MB PDF instead of 3.9 MB. `report/assets/` is **committed** so the PDF rebuilds without `sharp` or a network.
- **Fonts are vendored** in `report/fonts/` with their OFL notices — Typst cannot read woff2. Verified axes: Bricolage Grotesque wght 200–800 (default **800**), wdth **75–100%**, opsz 12–96pt (default 96pt); Instrument Sans wght 400–700; Carattere static 400. `stretch: 75%, weight: 800` is what reproduces the 2025 report's condensed display type. Always set weight and size explicitly — the defaults are traps.
- **Page count is structural**: every section is a scoped `#page()` call, so a spacing change can only overflow the page it is on. Draft = 30 content pages + a draft-only placeholder register; final = 30.
- **Charts**: native Typst for ~85%, CeTZ 0.3.4 (in the local package cache, so offline) for donut/funnel only, each with a dependency-free fallback behind `USE-CETZ`. `cetz-plot` is deliberately unused.
- **Honesty rules that are load-bearing for this document**, all learned the hard way and documented in `PITFALLS.md`: no participant-feedback figures exist for H1 2026 (no survey ran, so the charts were removed rather than marked); no employment outcome is claimed for HER WAKA (nothing tracks it); the 25 March mentor records were a **batch import of offline-confirmed mentors** — copy says "onboarded", never "applied"; only two testimonials in `lib/data/testimonials.ts` are real people and even their employers there are fabricated; `lib/data/stats.ts` is marketing copy contradicted by the repo's own registers.
- **Still outstanding, and not fixable in code**: actual H1 finances and cost-per-participant (fields exist in `report-data.typ`, nothing populates them), participant demographics against MSD referral criteria, and a safeguarding statement for the youth workshops. Listing a half-year edition on `/resources` also needs a `period?: string` on `types/impact-report.ts`, which is keyed by `year` only.

## AI Chatbot Assistant

The visitor chatbot (bottom-right) is a knowledge-grounded **AI SDK 6 `ToolLoopAgent`** over **live data** — newly added events appear automatically with zero maintenance. Shipped to production 2026-06-23.

**Full docs**: `docs/development/CHATBOT_AI_AGENT.md` (architecture, model decision, deployment gotchas). Highlights:

- **Logic in `lib/chatbot/`**: `knowledge.ts` (per-request compact context: org + founder, stats, mentorship policy w/ live paused status, next 5 events, get-involved links), `tools.ts` (`findEvents` token-scored search incl. sponsors/city, `getEventDetails`, `getMentors`, `getTeamMembers` — all wrap `lib/data/*`), `agent.ts` (`createSheSharpAgent()` + `getChatModel()`), `redis.ts`/`rate-limit.ts`/`analytics.ts`.
- **Route** `app/api/chat/route.ts`: `maxDuration=60`, per-IP rate limit, `createAgentUIStreamResponse`, `after()` analytics.
- **Front-end** `components/chatbot/chatbot.tsx`: AI SDK 6 `useChat` (`@ai-sdk/react`, `DefaultChatTransport`, `sendMessage`/`status`/`message.parts`).
- **Model = direct OpenAI `gpt-4o-mini`** via `OPENAI_API_KEY` (NOT the Vercel AI Gateway). Gateway free tier is rate-limited and BYOK needs purchased AI Gateway credits (Pro's $20/mo does NOT count), so it's not worth it here. Dormant `CHATBOT_USE_GATEWAY=1` flag can switch to the Gateway later without code changes.
- **Rate limit + analytics**: Upstash Redis (`@upstash/ratelimit` 15/60s per IP; questions logged to `chatbot:questions`/`chatbot:recent`). Degrades gracefully if Redis env is absent.

**Deploy/build gotchas (also in the doc):** project has **no Vercel Git connection** — deploys are prebuilt via GitHub Actions on push to `main`, so new env vars need a fresh commit (dashboard "Redeploy" won't pick them up). **pnpm 10 is pinned** by `packageManager` in `package.json`, so plain `pnpm install` and `pnpm dev` use it whatever is installed globally, and CI reads the same field rather than declaring its own version. This replaced a manual `npx pnpm@10 install --lockfile-only` workaround: on pnpm 11 the `pnpm.overrides` block is ignored, so regenerating the lockfile silently dropped it and broke the deploy, and `pnpm dev` refused to start at all. **Do not add a `version:` back to the `pnpm/action-setup` steps** — two sources that agree today can disagree tomorrow, and the action fails outright when they do. Build locally with `CI=true npx next build`. AI SDK 6 needs **zod ≥ 3.25**.

## Monthly Newsletter

> **Reality check (2026-07-31): the newsletter that subscribers actually receive is still sent from Mailchimp**, from `She Sharp <newsletter@shesharp.org.nz>` (Mailchimp DKIM lives at `k2`/`k3._domainkey` → `dkim*.mcsv.net`). Everything below is the **Resend replacement**, which the founder wants to switch to *in order to improve deliverability*. It has been built and piloted but has not yet taken over a real send.
>
> **Mailchimp also still owns the subscribe funnel.** `MAILCHIMP_CONFIG` in `lib/data/newsletters.ts` (`subscribeUrl` + `archiveUrl`) is referenced in **16 places** across the site — footer, newsletters page, mentorship CTAs — so every new subscriber the website acquires goes into Mailchimp. Meanwhile `POST /api/newsletter/subscribe` writes to the Resend audience but **no component calls it**. Migrating the sending without the funnel leaves two lists drifting apart from day one.
>
> Before migrating, read the Mailchimp → Resend section of `docs/deployment/EMAIL_AUTHENTICATION.md` — list hygiene is the thing most likely to break it (Mailchimp's years of bounce/unsubscribe suppression are **not** in the subscriber CSV export), and the ESP switch must not happen in the same month as a DMARC policy change.

A monthly email newsletter built on **React Email** + **Resend broadcasts**, with an AI-drafted editorial pass. Each issue is a JSON file at `lib/data/json/newsletter-issues/<YYYY-MM>.json` split into two blocks (`lib/newsletter/schema.ts`): a machine-owned **`auto`** snapshot (events + stats, refreshed freely) and a human-owned **`editorial`** block (founder note, spotlight, photo of the month, subject/preview, CTA) that regeneration must never overwrite.

**Run the monthly loop with the `/monthly-newsletter` skill** (`.claude/skills/monthly-newsletter/SKILL.md`): fetch the staged draft → register the issue in `lib/newsletter/issues-registry.ts` (one import + one map line per month) → edit `editorial` → preview (`scripts/newsletter/preview.ts`) → test-send (`scripts/newsletter/send-test.ts`) → commit + deploy → approve (`scripts/newsletter/approve.ts`).

- **Logic in `lib/newsletter/`**: `assemble.ts` (builds `auto` from `lib/data/*`), `render.tsx` (React Email → HTML/text, `broadcast`/`preview` modes, 100KB Gmail-clip gate), `generate.ts` (OpenAI editorial draft), `drafts.ts` (Redis staging), `resend-api.ts` (typed REST wrapper — segments/topics/broadcasts, the pinned `resend@4.x` SDK predates the 2026 rename), `schedule.ts` (last-Thursday send slot), `notify.ts` (Slack + admin-email review alerts). Email template in `emails/`.
- **Routes**: `GET /api/admin/newsletter/draft/[month]` (pull staged draft), `POST /api/cron/newsletter-draft` (`{month,force}` manual trigger; GET is the Vercel cron), `POST /api/admin/newsletter/[issue]/approve` (create + schedule broadcast; reads the DEPLOYED fixture, never Redis), `GET /(site)/resources/newsletters/[issue]` (on-site "view in browser", `noindex` during pilot), `POST /api/newsletter/subscribe` (honeypot + rate-limited opt-in, unexposed).
- **Env** (see `.env.example`): `RESEND_NEWSLETTER_SEGMENT_ID`, `RESEND_NEWSLETTER_TOPIC_ID`, `NEWSLETTER_ADMIN_EMAIL`, `SLACK_NEWSLETTER_WEBHOOK_URL` (falls back to `SLACK_CONTACT_WEBHOOK_URL`), `CRON_SECRET` (bearer for cron/admin triggers; must match Vercel). Reuses `RESEND_API_KEY` + the chatbot's Upstash Redis.
- **Pilot status**: unlisted — the web version stays `noindex` and issues are NOT added to `lib/data/newsletters-manual.ts` (the public archive) until post-pilot.

## Outbound Email Skills

Four guided skills let non-technical teammates send email without writing code. All four share one pipeline — **repo scripts render, the Resend CLI sends** — so `lib/email/service.ts` (the single `resend.emails.send()` behind 25 template call sites across 6 files, module-level Resend singleton) stays untouched while `--reply-to`, `--cc`, `--tags`, `--scheduled-at`, batch and broadcasts all come from the CLI.

| Skill | Use it for | Audience |
|---|---|---|
| `/reply-to-contact-messages` | Answering the contact form backlog (DB authoritative, Slack `C0AGVRL0G5A` cross-checked, `reviewed_at` = handled) | Tier 1 — 1:1 only |
| `/update-mailing-list` | Roster reporting + consent-gated CSV import + hashed suppression list | manages Tier 0 |
| `/send-event-emails` | Four stage emails to one event's Humanitix registrants, chunked and resumable | Tier 2 — fulfilment only |
| `/email-the-community` | One-off announcement broadcast to a Resend segment | Tier 0 only |

- **Shared layer**: `lib/email/message.ts` (`MessageSpec` — 9 content blocks, no HTML for the author), `compose.tsx` (dual engine: `layout` reuses `lib/email/layout.ts` for transactional, `react` renders `emails/announcement.tsx` for broadcasts; also exports `withDraftBanner`), `gates.ts` (100KB / absolute-URL / JPEG-only / unsubscribe / merge-tag / secret-scan / **from-identity / reply-to-domain / tag-charset / no-reply-path**, plus an advisory `Redactions to confirm` list), `audience.ts` (`assertSendAllowed` — marketing to Tier ≥1 throws).
- **Shared CLI**: `scripts/email/` — `render-message.ts` (spec → `tmp/emails/*.html` + gates + a paste-able `resend` command), `normalize-recipients.ts` (any-shape CSV: detects headers, reads the guess back in plain English, never asks anyone to edit a CSV), `build-batch.ts` (per-person render, 100/chunk, idempotency keys), `audience-report.ts`, `mark-contact-replied.ts`, `suppression.ts`.
- **Consent is the load-bearing rule**: the database has **no** marketing opt-in column, so Resend segments/topics are the only subscription record. Registering, donating, applying or writing in is **not** subscribing — see `.claude/skills/update-mailing-list/references/consent-rules.md`, which the other three skills defer to.
- **Two-stage confirmation everywhere**: render + gate locally → `resend … --dry-run` prints the full request JSON without calling the API → only then the real send. `resend emails batch` has **no** `--dry-run`; its equivalent preflight is the local render plus `--batch-validation strict`.
- **Zero migrations**: `form_status` has no `replied` value, so contact replies are recorded with the existing `reviewed_at` / `status` / `review_notes` columns.
- **Onboarding a non-technical teammate**: `docs/development/AI_SKILLS_GUIDE.md` walks them from installing Cursor → cloning the repo → typing `/` → prompts for all six project skills. Cursor reads `.claude/skills/` as a compatibility path, so no per-tool porting is needed; frontmatter `name` must keep matching its folder name or Cursor drops the skill.

## Email Authentication & Sending Streams

Full DNS runbook: **`docs/deployment/EMAIL_AUTHENTICATION.md`** (current records, the `p=none → quarantine → reject` rollout with its evidence gates, the SPF lookup budget, the Mailchimp → Resend migration, the two traps, and the **Outstanding work** table). Read it before touching any From address or DNS record.

**Live status as of 2026-07-31** — DNS is on **Cloudflare** (`art`/`ashley.ns.cloudflare.com`), not the registrar the SPF `include:_spf.1stdomains.co.nz` might suggest (that include is a leftover from the old web host):

| | State |
|---|---|
| `_dmarc` | `p=none` **with `rua`** → Cloudflare DMARC Management (free, collects on `dmarc-reports.cloudflare.net`, does **not** touch MX) |
| Root SPF | `v=spf1 include:_spf.google.com include:_spf.1stdomains.co.nz ~all` — budget **4/10** (`_spf.google.com` is flat now, 1 lookup not 4) |
| Resend | DKIM `resend._domainkey` (1024-bit, rotation to 2048 still pending), Return-Path `send.shesharp.org.nz` — passes DMARC on **both** mechanisms |
| Mailchimp | DKIM `k2`/`k3._domainkey` — passes on DKIM only (Return-Path `rsgsv.net` does not align). **Leave these records in place** until the Resend migration is proven; they are the rollback path |
| Google Workspace | **No aligned DKIM** — Gmail signs with Google's default `d=*.gappssmtp.com`, which does not align and counts for nothing. Passes SPF only |
| Bounce/complaint webhook | Registered and verified end-to-end |

**The one blocker:** enabling Google DKIM needs **Google Workspace super-admin**, and `website@shesharp.org.nz` (the maintainer's account) **cannot open `admin.google.com`**. Without it, **do not go past `p=quarantine`** — at `p=reject` a forwarded message from `hello@` is destroyed rather than filed in Junk, with no bounce and no way to find out. Stopping permanently at quarantine is a defensible end state; the doc has the exact request to send an admin.

Note what does **not** need a mailbox login: sending *as* `hello@`/`newsletter@` (Resend signs at the domain level), Reply-To to team inboxes (the point is that replies reach the team, not the maintainer), and DMARC report collection (Cloudflare receives on its own domain).

**Sender identities live in `lib/email/senders.ts` — the single source of truth.** Never hard-code a From or Reply-To anywhere else. Four streams, and the stream decides everything downstream:

| Stream | Meaning | From | `List-Unsubscribe` | Honours opt-outs |
|---|---|---|---|---|
| `transactional` | Recipient-triggered, expected in minutes | `noreply@` (overridable by `EMAIL_FROM`) | No | **Never** |
| `notification` | Recurring, unrequested (reminders, announcements) | `noreply@` | Yes (RFC 8058) | Yes |
| `marketing` | Newsletter + one-off broadcasts | **`newsletter@`** | Resend attaches it | via Resend topics |
| `internal` | To She Sharp's own mailboxes | `noreply@` | No | No |

- `sendEmail()` (`lib/email/service.ts`) takes `stream`, defaulting to `transactional`. It resolves From/Reply-To, attaches one-click unsubscribe headers for `notification` only, tags every send `stream:<name>` for per-stream Resend analytics, and checks `email_optouts` **only** for `notification` — a suppressed address must still receive a password reset.
- `EMAIL_FROM` overrides the **transactional** From only. Letting it reach marketing is what previously sent the monthly newsletter from `noreply@` while its own footer said "just hit reply".
- **`newsletter@` is a continuity decision, not a preference.** The live newsletter still goes out via **Mailchimp** from `She Sharp <newsletter@shesharp.org.nz>` (DKIM `k2`/`k3._domainkey` → `dkim*.mcsv.net`). The founder wants to replace Mailchimp with Resend *to improve deliverability*, so the visible sender must not change across that move — see the Mailchimp → Resend section in the doc, especially the list-hygiene warning (Mailchimp's years of bounce/unsubscribe suppression are **not** in the subscriber CSV export) and the rule to do the ESP migration and the DMARC tightening in **separate months**.
- `hello@` remains an approved sender but is for **1:1** mail only (contact replies, event fulfilment). List mail uses `newsletter@`.
- **One-click unsubscribe**: `lib/email/unsubscribe-token.ts` (stateless HMAC over the email *hash*, never the address) → `app/api/email/unsubscribe/route.ts`. POST is unauthenticated and must return a bare 200 (providers treat 3xx as failure); **GET must never mutate** — link scanners prefetch it.
- **Bounces/complaints**: `app/api/webhooks/resend/route.ts` verifies Svix signatures by hand (`lib/email/webhook-verify.ts`, no `svix` dependency) and writes `email_optouts`; complaints also post to Slack. Needs `RESEND_WEBHOOK_SECRET`.
- **Two suppression stores, one join key**: `email_optouts` (runtime) and `lib/data/json/email-suppression-hashes.json` (committed, read by the offline scripts) both key on `hashEmail()` from `lib/email/hash.ts`. Reconcile monthly with `npx tsx scripts/email/suppression.ts sync`.
- **Checks**: `npx tsx lib/email/hardening.test.ts`.
- **One domain on purpose**: transactional and marketing share `shesharp.org.nz`. The pre-committed trigger to split marketing onto `news.` is complaint rate >0.10%, a single send >1,000 recipients, or hard bounces >2% — see the doc.

## Environment Configuration

Required environment variables (see `.env.example`):
```
# Database
DATABASE_URL=postgresql://...          # Neon PostgreSQL connection

# Authentication
AUTH_SECRET=...                        # JWT encryption key
AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET    # Google OAuth
AUTH_GITHUB_ID / AUTH_GITHUB_SECRET    # GitHub OAuth

# Services
OPENAI_API_KEY=...                     # OpenAI chatbot (GPT-4o-mini) + GPT-4 matching

# Chatbot rate limiting + analytics (optional; degrades gracefully if unset)
UPSTASH_REDIS_URL / UPSTASH_REDIS_TOKEN   # or KV_REST_API_URL / KV_REST_API_TOKEN (Vercel Upstash integration)
# CHATBOT_USE_GATEWAY=1                 # optional: route chat via Vercel AI Gateway (needs purchased AI Gateway credits)
RESEND_API_KEY=...                     # Email service (auth, mentorship, recruitment)
EMAIL_UNSUBSCRIBE_SECRET=...           # Signs one-click List-Unsubscribe tokens (RFC 8058)
RESEND_WEBHOOK_SECRET=whsec_...        # Verifies bounce/complaint webhooks (Svix)

# Slack Notifications
SLACK_VOLUNTEER_WEBHOOK_URL=...        # Volunteer/ambassador application alerts
SLACK_CONTACT_WEBHOOK_URL=...          # Contact form submission alerts
SLACK_EVENT_FEEDBACK_WEBHOOK_URL=...   # Post-event feedback (falls back to SLACK_CONTACT_WEBHOOK_URL)

# Payments
STRIPE_SECRET_KEY=...                  # Stripe API key
STRIPE_PUBLISHABLE_KEY=...             # Stripe public key
STRIPE_WEBHOOK_SECRET=...              # Webhook verification
STRIPE_ANNUAL_PRICE_ID=...             # Membership price ID

# Application
BASE_URL=http://localhost:3000         # Application URL
```

## Common Modifications

1. **Adding new database tables**:
   - Define schema in `/lib/db/schema.ts`
   - Run `pnpm db:generate` to create migration
   - Run `pnpm db:migrate` to apply to database
   - Consider creating a snapshot: `pnpm db:snapshot "description"`
   - See full guide: `docs/database/DATABASE_VERSION_CONTROL.md`

2. **Adding new public pages**:
   - Create under `/app/(site)/` following existing page structure
   - Use section components from `/components/sections/`
   - Follow layout patterns with Container and Section components

3. **Adding new protected/admin features**:
   - Create under `/app/(dashboard)/dashboard/`
   - Routes automatically protected by middleware
   - Check user roles with `checkUserRoles()` or `isUserAdmin()`
   - Use `PageWrapper` component for consistent layout

4. **Working with user roles**:
   - Check active roles: `await hasActiveRoles(userId)`
   - Verify specific role: `isMentor()`, `isMentee()`, `isAdmin()`
   - Role-based UI: conditionally render based on active roles

5. **Modifying authentication**:
   - NextAuth config in `/lib/auth/auth.config.ts`
   - Custom session logic in `/lib/auth/session.ts`
   - Role middleware in `/lib/auth/role-middleware.ts`
   - Update middleware for route protection rules

6. **Adding new UI components**:
   - Use shadcn/ui CLI: `npx shadcn@latest add [component]`
   - Or manually add to `/components/ui/`
   - Follow existing component patterns and brand colors

7. **Working with AI matching**:
   - Matching service in `/lib/matching/service.ts`
   - Queue management in `/lib/matching/queue-service.ts`
   - OpenAI integration in `/lib/matching/openai-service.ts`

8. **Adding new API endpoints**:
   - Create route file in `/app/api/[path]/route.ts`
   - Use `getUser()` for authentication
   - Use `checkUserRoles()` for role-based access

9. **Reading mentor/mentee data (CRITICAL)**:
   - **Dual-table architecture**: Mentor and mentee data is split across `*_form_submissions` (primary) and `*_profiles` (subset). See `docs/database/MENTOR_MENTEE_DATA_GUIDE.md` for full details.
   - **Mandatory fallback chain** for ALL queries: `form_submissions.field → profiles.field → users.field → null`
   - **Photo/image**: Always `formSubmissions.photoUrl → profiles.photoUrl → users.image`. Never use `users.image` alone — it is null for most form-imported users.
   - **Form-only fields** (no profile equivalent): `city`, `phone`, `gender`, `softSkillsExpert`, `industrySkillsExpert`, `preferredIndustries`, `preferredMeetingFormat`, `longTermGoals`, `shortTermGoals`, `whyMentor`, `currentJobTitle`, `currentIndustry`
   - **Profile-only fields**: `currentMenteesCount`, `isAcceptingMentees`, `verifiedAt`, `learningGoals`, `currentChallenge`
   - **When writing**: Profile edit endpoints must update BOTH `*_profiles` AND `*_form_submissions` tables simultaneously.
   - **Lesson learned**: Reading from `users.image` or `*_profiles` alone caused invisible avatars across 10 API endpoints (2026-03-20 incident).

## Working with site content and data

Rules distilled from a 2026 review of twelve years of the organisation's own
records. Every one of them was broken at least once; several were broken
repeatedly. Background on *why* the historical data is patchy is in
`docs/development/SITE_DATA_HISTORY.md`, and which published figures have a
source behind them is in `docs/development/PUBLIC_CLAIMS_PROVENANCE.md`.

### Counting and naming traps

- **`attendees` holds REGISTRATIONS, `checkedIn` holds attendance.** Decided
  April 2026; registrations are the number the site displays. The field name is
  misleading, the convention is not.
- **Expos and trade shows have no headcount by design** — the organisation has
  never counted people at a booth. They live on `/community`
  (`lib/data/community-appearances.ts`), not in the event data. Do not "fix"
  their missing numbers.
- **Humanitix only holds events from 2020 onward.** Nothing earlier has
  exportable registration data.
- **A ticket-code list is not a sponsor list.** Several organisations had their
  own discount codes without sponsoring anything.
- **Google has not been a sponsor since 2025** — it stopped running the
  Educator Conference and had no funding available. It appears in the
  cumulative logo wall as history, which is correct.
- **The two Fonterra event lines are different events** — "Harness the Power of
  Data and AI" (Aug 2024) and "Business and Technology Transformation" (Sep
  2025). Same partner, one continuing relationship, two events.
- **`lib/data/stats.ts` mixes two different metrics**: `members.current` is
  community members, `impact.workshopAttendees` is cumulative reach. Never
  present them as the same thing. The mailing list is a third number again.
- **`event-feedback-notifications` in Slack is entirely test data.** Every
  submitter is a computer-history figure — Ada Lovelace, Grace Hopper, Radia
  Perlman — on an `@example.com` address. **Never backfill it into the site as
  real feedback.**

### Things not to re-do or roll back

- **Metlifecare's speaker belongs on the site.** A request to remove him was
  overruled by the founder, who required Metlifecare as main sponsor on all
  material.
- **A declined judge is not a judge.** One 2025 hackathon candidate declined
  and must not be listed.
- **HCLTech Dunedin 2025**: the panel facilitator changed four days out, one
  speaker was never confirmed, and one confirmed she would not attend. Copy
  published before the change is out of date.
- **IWD 2025**: an announced speaker did not attend on the day. Three spoke,
  not four.
- **2024 Enviro Hackathon mentors**: the thank-you list was cut back
  deliberately, using unclaimed name badges to confirm who was actually there.
  The rule was "only name mentors you saw".

### Editorial rules

- **Event photos: Google Photos album links only.** Not Google Drive folders
  (they get cleaned out — one album's photos were deleted when the
  photographer freed up personal storage) and not Dropbox ("Dropbox is not
  ours, it is temporary"). One album per event, named
  `{Title of the Event} @ {Company} - {Month | Year}`.
- **Newsletter links must be the public `mailchi.mp/…` or
  `us3.campaign-archive.com/…` form**, never `us3.admin.mailchimp.com/…`,
  which only works for someone logged in. Never a link carrying a merge tag —
  one archive page ended up greeting every reader by one person's name.
- **She Sharp does not run a job board.** Recruitment placements are open to
  paying sponsors only; an outside request to circulate a role was refused as
  recently as 2025.
- **LinkedIn is for She Sharp's own brand only.** Other organisations' events
  go to Instagram or Facebook stories, not LinkedIn.
- **Share images carry no personal byline and should be square.**
- **Mentorship testimonials must be about She Sharp's own programme** — another
  organisation's testimonial was used once and had to be pulled.
- **`p22-mackinac-pro`, the old site's body font, is licensed for personal use
  only.** The current site does not use it. If anyone asks for type "exactly
  like the old site", the licence has to be bought first.
- **Distinguish arrival time from start time.** Publishing one `time` caused
  real confusion when 5pm was registration and 5:30 was the actual start.
- **Speakers are thanked with a gift, not a fee**, and travel is not covered.
- **Refunds**: Humanitix cannot refund after settlement. The practice is a free
  ticket to a future event instead.
- **Fiserv venue imagery and Fonterra demo material must not be published** —
  both were shared for internal reference only.
- **AUT branding**: the AUT logo must not be locked up beside the She Sharp
  logo; co-branded order is AUT → She Sharp → AI Forum; use the version
  without the word UNIVERSITY.
- **Contact routing**: `industry@` for sponsorship, `mentoring@` for the
  mentorship programme, `hello@` for general. See
  `lib/config/contact-addresses.ts` and `docs/development/EMAIL_ADDRESSES.md`.
- **A Google Form with a file-upload question always forces a Google sign-in**
  and cannot be embedded. This has caught the organisation twice.
- **Website requests belong in `#website-team`, not DMs** — restated twice in
  2026 — and test feedback should arrive as one Markdown document.

## Brand Guidelines

**Legal identity** (from the NZ Charities Register, verified 2026-08; held in
`lib/config/footer.ts` → `charityInfo`):
- Legal name **She Sharp** — two words. "She#" is the visual mark, not the name
- Registered charity **CC57025** since **4 June 2019**, status Registered
- NZBN 9429047458970
- **Not GST-registered**
- Founding year is **2014**; charity registration is 2019. Different things

**Colors** (defined in `/styles/colors.css`):
- Purple Dark: #9b2e83 (primary brand color)
- Purple Mid/Light: Various shades for gradients
- Periwinkle: Accent color
- Navy, Mint: Supporting colors
- The only explicit statement of the brand pair is **purple & navy blue**;
  merchandise standardised on Pantone 248 C. A 2020 rule still holds: outside
  the logo, don't use much pink

**Key Statistics**:
- 3500+ Members
- 50+ Sponsors
- 95+ Events Since 2014 (derived — `getEventsHeldCount()` in `lib/data/events.ts` feeds `globalStats.events.total`)
- Not all of these have a source. See `docs/development/PUBLIC_CLAIMS_PROVENANCE.md`
  before quoting any of them in a funding application or sponsorship deck

**Core Commitments**:
1. **Connection**: Building professional networks
2. **Inspiration**: Showcasing STEM careers
3. **Empowerment**: Career development support

**Values** (from a July 2018 team workshop; rendered on `/about`):
community · inspiring · inclusion

## Development Guidelines

### Language Requirements
- **All UI text must be in English**: No Chinese characters should appear in any page content, components, or user-facing strings
- **Code comments**: Write function-level comments following Google's open source style guide
- **Commit messages**: Use English following Angular commit convention (e.g., `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`)

### Version Control
- **Commit style**: Follow Conventional Commits specification
- **GitHub CLI**: Use `gh` command for GitHub operations (issues, PRs, etc.)
- **Pull requests**: Create descriptive PRs with clear test plans

### Testing Strategy
- **Milestone testing**: Create functional tests for each small milestone
- **Test frequently**: Ensure steady progress by testing after each implementation
- **Test location**: Place tests in project folder alongside related code
- **Minimal test approach**: Focus on essential validation without over-engineering
- **No test runner is configured.** Tests are plain `node:assert`-style scripts run directly with `npx tsx <file>`; each prints `ok - …` lines and exits non-zero on failure. Existing suites:
  ```bash
  npx tsx lib/email/hardening.test.ts     # unsubscribe tokens, sender identities, gates, Svix signatures
  npx tsx lib/deck/deck.test.ts           # slide schema, copy + rhythm rules, feedback-code collisions
  npx tsx .claude/skills/sync-event-from-slack/scripts/state-lib.test.ts     # Slack read-position + run-sheet parsing
  npx tsx .claude/skills/sync-event-from-slack/scripts/audit-read-state.ts   # nothing scored-but-unread (offline, in CI)
  npx tsx .claude/skills/sync-event-from-slack/scripts/verify-coverage.ts    # walks Slack itself; the definitive coverage check
  for f in lib/newsletter/*.test.ts; do npx tsx "$f"; done
  ```
- **CI** (`.github/workflows/verify.yml`, on PRs to `main`) runs `verify-image-paths` (which also carries `check-hackathon-facts` and the Slack read-position test), `typecheck-scripts`, and `deck-checks`. The email and newsletter suites are **not** in CI — run those locally before pushing.

### URL Construction Rules
- **Always use `getBaseUrl()`**: All user-facing URL construction (emails, redirects, Stripe callbacks) must use `getBaseUrl()` from `lib/email/service.ts`. Never inline `process.env.BASE_URL || 'http://localhost:3000'`.
- **Scripts run locally**: Any script under `scripts/` that sends emails or generates URLs must require the caller to pass `BASE_URL` explicitly (e.g., `BASE_URL=https://www.shesharp.org.nz npx tsx scripts/...`), and must guard against localhost values at startup (see `scripts/resend-mentor-invitations.ts` for the pattern).
- **Lesson learned**: Duplicated inline `BASE_URL` fallback logic caused 25 mentor invitation emails to contain `localhost:3000` URLs (2026-03-19 incident).

### Vercel Environment Variable Rules
- **Use `--value`, never stdin**: `vercel env add VAR production --value $v --no-sensitive --force --yes` (PowerShell). Piping — `printf 'x' |`, `< file`, even `cmd /c "... < file"` — can silently store an **empty string**, and `echo` additionally appends a trailing `\n` that becomes part of the value.
- **An empty `vercel env pull` does NOT prove an empty value**: CLI ≥54 defaults new vars to type **Sensitive**, and `pull` returns sensitive vars as `""` — indistinguishable from the corruption above. `--no-sensitive` makes the value readable and therefore verifiable, which matches every pre-existing secret here (`RESEND_API_KEY`, `AUTH_SECRET`, `CRON_SECRET` all read back fine). Anyone with project access can deploy code that prints a secret anyway, so verifiability is worth more than blocked readback.
- **Always verify**: `vercel env pull <tmp> --environment production --yes`, then compare byte-for-byte and check for a literal `\n`. Do this per-variable, not just after bulk uploads.
- **Strip quotes when copying from `.env` files**: values are often wrapped in double quotes (`KEY="value"`); strip them before upload.
- **A new variable needs a new commit**: this project has **no Vercel Git connection** — GitHub Actions prebuilds on push to `main`. The dashboard's "Redeploy" button reuses the previous build's environment and will **not** pick up a newly added variable.
- **Lessons learned**: `echo` piping stored 10 vars with a trailing `\n` (2026-03-24 migration incident), which then propagated when copied to the She Sharp project. On 2026-07-31, stdin redirection appeared to store empty values *and* the "verification" that seemed to confirm it was itself wrong — the pull was empty because the var was sensitive-typed, not because the value was. Two traps that produce the same symptom; `--value --no-sensitive` avoids both.

### Code Development Practices
- **Focused implementation**: Address only the requested task without extra features
- **Efficient coding**: Always seek the most token-efficient implementation
- **Minimal changes**: Control code modification scope to what's necessary
- **Direct problem solving**: Find optimal solutions without workarounds
- **No unnecessary documentation**: Don't create extra .md files unless explicitly requested

### Communication Guidelines
- **Dialog language**: Maintain conversations in Chinese
- **Code strings**: Keep all code strings and comments in English
- **Clear explanations**: Explain actions clearly within the conversation
- **Focused assistance**: Help with specific tasks without adding unrequested features

### Documentation Management
- **No proactive documentation**: Never generate new documentation files unless explicitly requested
- **Documentation location**: All documentation files must be stored in `/docs/` directory, organized in appropriate subdirectories:
  - `/docs/architecture/` - System architecture and design documents
  - `/docs/api/` - API documentation
  - `/docs/deployment/` - Deployment and environment configuration guides
  - `/docs/security/` - Security-related documentation
  - `/docs/development/` - Development guidelines and processes
  - `/docs/database/` - Database schema and migration guides
- **Never save in root**: Documentation files should never be saved directly in the project root directory
