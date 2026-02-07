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
│   ├── (site)/             # Public pages (home, about, events, etc.) - 15 pages
│   ├── (login)/            # Authentication pages (sign-in, sign-up, etc.) - 6 pages
│   ├── (dashboard)/        # Protected dashboard pages - 11 pages
│   └── api/                # API routes (71 endpoints)
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
│   ├── email/              # Email service (1 file)
│   ├── forms/              # Form management (1 file)
│   ├── points/             # Gamification system (1 file)
│   ├── invitations/        # Invitation code system (1 file)
│   ├── notifications/      # Notification service (1 file)
│   └── user/               # User management (1 file)
├── hooks/                  # Custom React hooks (6 files)
├── types/                  # TypeScript type definitions (7 files)
├── styles/                 # Global and component styles (4 files)
├── public/                 # Static assets (images, logos, icons)
├── docs/                   # Project documentation
└── scripts/                # Build and utility scripts
```

## Page Routes Structure

### Public Pages (`/(site)/`) - 15 pages
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
- **Contact System**: Contact forms and social media integration
- **AI Chatbot**: Google Gemini-powered assistant

### Technology Stack
- **Framework**: Next.js 15.4.0 with App Router
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: NextAuth 5.0 (OAuth) + Custom JWT using bcrypt
- **UI**: shadcn/ui components (63 components) with Tailwind CSS v4
- **Styling**: Tailwind CSS with PostCSS and custom brand colors
- **AI**: OpenAI GPT-4o-mini (chatbot) + OpenAI GPT-4 (mentor matching)
- **Email**: Resend for transactional emails
- **Payments**: Stripe for subscriptions and one-time payments
- **Charts**: Recharts for analytics dashboards
- **Tables**: TanStack Table with dnd-kit for drag-and-drop

### Core Architecture Patterns

1. **Authentication Flow** (`/lib/auth/`):
   - Session management via encrypted JWTs stored in httpOnly cookies
   - Middleware in `middleware.ts` protects routes and manages sessions
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
   - **Total**: 45 tables and 24 enums supporting comprehensive platform features
   - **User System** (5 tables): `users`, `user_roles`, `admin_permissions`, `user_memberships`, `user_mentorship_stats`
   - **Authentication** (6 tables): `account`, `session`, `verification_token`, `email_verifications`, `password_resets`, `password_history`
   - **Mentorship** (5 tables): `mentor_profiles`, `mentee_profiles`, `mentorship_relationships`, `meetings`, `mentee_waiting_queue`
   - **Form Submissions** (2 tables): `mentor_form_submissions`, `mentee_form_submissions`
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
- **Chatbot** (`/components/chatbot/`) (7 files) - AI assistant with preset questions, context management
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

## API Routes Summary (71 endpoints)

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

### Other Endpoints
- `/api/resources/` (3) - Resource management and downloads
- `/api/notifications/` (2) - Notification handling and preferences
- `/api/chat/` - AI chatbot (OpenAI GPT-4o-mini)
- `/api/invitation-codes/validate` - Code validation
- `/api/matching/suggestions` - AI match suggestions
- `/api/dashboard/overview` - Dashboard data
- `/api/analytics/dashboard` - Analytics data
- `/api/activity-logs` - Activity logging
- `/api/upload/photo` - Photo uploads
- `/api/cron/process-queue` - Background job processing
- `/api/team` - Team data

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
RESEND_API_KEY=...                     # Email service

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

## Brand Guidelines

**Colors** (defined in `/styles/colors.css`):
- Purple Dark: #9b2e83 (primary brand color)
- Purple Mid/Light: Various shades for gradients
- Periwinkle: Accent color
- Navy, Mint: Supporting colors

**Key Statistics**:
- 2200+ Members
- 50+ Sponsors
- 84+ Events Since 2014

**Core Commitments**:
1. **Connection**: Building professional networks
2. **Inspiration**: Showcasing STEM careers
3. **Empowerment**: Career development support

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
