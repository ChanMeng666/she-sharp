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

## Key Features

### Public-Facing Features
- **About Pages**: Organization mission, team, and volunteer information
- **Mentorship Program**: Mentor profiles and mentee application system
- **Events Platform**: Upcoming events and special programs (e.g., THRIVE)
- **Media Hub**: Podcasts, newsletters, photo galleries, and press coverage
- **Support Options**: Donation and corporate sponsorship pages
- **Contact System**: Contact forms and social media integration

### Technology Stack
- **Framework**: Next.js 15.4.0 with App Router
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: NextAuth (OAuth) + Custom JWT using bcrypt
- **UI**: shadcn/ui components with custom Tailwind CSS v4 theme
- **Styling**: Tailwind CSS with PostCSS and custom brand colors
- **AI**: Google Gemini for intelligent chatbot assistant
- **Email**: Resend for transactional emails

### Core Architecture Patterns

1. **Authentication Flow** (`/lib/auth/`):
   - Session management via encrypted JWTs stored in httpOnly cookies
   - Middleware in `middleware.ts` protects routes and manages sessions
   - Sign up/sign in handled in `/app/api/auth/` routes

2. **Multi-tenancy Model**:
   - Users belong to teams through `teamMembers` relation
   - Teams have owners and members with role-based access
   - Activity logging tracks all team-related actions

3. **Database Schema** (`/lib/db/schema.ts`):
   - **Total**: 44 tables and 24 enums supporting comprehensive platform features
   - **User System** (5 tables): `users`, `user_roles`, `admin_permissions`, `user_memberships`, `user_mentorship_stats`
   - **Authentication** (6 tables): `account`, `session`, `verification_token`, `email_verifications`, `password_resets`, `password_history`
   - **Mentorship** (5 tables): `mentor_profiles`, `mentee_profiles`, `mentorship_relationships`, `meetings`, `mentee_waiting_queue`
   - **Form Submissions** (2 tables): `mentor_form_submissions`, `mentee_form_submissions`
   - **AI Matching** (2 tables): `ai_match_results`, `ai_matching_runs`
   - **Events** (3 tables): `events`, `event_registrations`, `event_role_assignments`
   - **Resources** (2 tables): `resources`, `resource_access_logs`
   - **Points & Gamification** (7 tables): `user_points`, `points_transactions`, `points_rules`, `milestones`, `user_milestones`, `rewards`, `reward_redemptions`, `experience_levels`
   - **Membership & Payments** (3 tables): `membership_features`, `membership_benefits`, `membership_purchases`
   - **Invitation System** (2 tables): `invitation_codes`, `invitation_code_usages`
   - **Configuration** (2 tables): `skill_options`, `industry_options`
   - **Activity Logging** (1 table): `activity_logs`
   - **Legacy** (4 tables): `teams`, `team_members`, `invitations` (kept for backward compatibility)
   - See detailed documentation: `docs/database/DATABASE_SCHEMA.md`

4. **Multi-Role System**:
   - Users can activate multiple roles independently (mentor, mentee, admin)
   - Role-specific profiles and permissions
   - Dynamic dashboard based on active roles

5. **Route Protection**:
   - Public routes: Most content pages (about, events, mentorship, media, support, contact)
   - Protected routes: Dashboard and admin areas under `/(dashboard)`
   - API routes use session validation from `getUser()` for protected operations

### Key Development Patterns

1. **Server Components by Default**: Use `'use client'` only when needed
2. **Data Fetching**: Direct database queries in Server Components
3. **Form Handling**: Server Actions for mutations (see `/lib/actions/`)
4. **Error Handling**: Consistent error boundaries and try-catch in Server Actions
5. **Type Safety**: Leverage TypeScript and Drizzle's type inference

### Environment Configuration

Required environment variables (see `.env.example`):
- `DATABASE_URL`: Neon PostgreSQL connection string
- `AUTH_SECRET`: For JWT encryption and NextAuth
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`: Google OAuth credentials
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`: GitHub OAuth credentials
- `GOOGLE_GENERATIVE_AI_API_KEY`: For AI chatbot
- `RESEND_API_KEY`: For email service
- `BASE_URL`: Application URL for redirects

### Common Modifications

1. **Adding new database tables**:
   - Define schema in `/lib/db/schema.ts`
   - Run `pnpm db:generate` to create migration
   - Run `pnpm db:migrate` to apply to database
   - Consider creating a snapshot: `pnpm db:snapshot "description"`
   - See full guide: `docs/database/DATABASE_VERSION_CONTROL.md`

2. **Adding new public pages**:
   - Create under `/app/` following existing page structure
   - Use consistent layout and component patterns

3. **Adding new protected/admin features**:
   - Create under `/app/(dashboard)/`
   - Routes automatically protected by middleware
   - Check user roles and permissions in Server Components

4. **Working with user roles**:
   - Check active roles: `await hasActiveRoles(userId)`
   - Verify specific role: check `user_roles` table
   - Role-based UI: conditionally render based on active roles

5. **Modifying authentication**:
   - NextAuth config in `/lib/auth/auth.config.ts`
   - Custom session logic in `/lib/auth/session.ts`
   - Update middleware for route protection rules

6. **Adding new UI components**:
   - Use shadcn/ui CLI or manually add to `/components/ui/`
   - Follow existing component patterns and brand colors

### Brand Guidelines

**Colors** (defined in Tailwind config):
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
- **Never save in root**: Documentation files should never be saved directly in the project root directory