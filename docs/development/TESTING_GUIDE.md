# She Sharp Platform - Testing Guide

This guide provides comprehensive instructions for running and testing the She Sharp mentorship platform.

## Prerequisites

### Required Software
- Node.js 18.x or later
- pnpm (recommended package manager)
- PostgreSQL database (Neon recommended for development)

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Configure required environment variables in `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Authentication
AUTH_SECRET=your-secret-key-here
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
AUTH_GITHUB_ID=your-github-oauth-client-id
AUTH_GITHUB_SECRET=your-github-oauth-client-secret

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

# Email (Resend)
RESEND_API_KEY=re_xxx

# AI Chatbot
GOOGLE_GENERATIVE_AI_API_KEY=xxx

# App URL
BASE_URL=http://localhost:3000
```

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Database Setup
```bash
# Generate migrations from schema
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# (Optional) Seed with sample data
pnpm db:seed
```

### 3. Start Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## User Flow Testing

### Testing Mentee Registration Flow

1. **Visit Payment Page**
   - Navigate to `/mentorship/join`
   - Enter email address
   - Click "Get Started" to redirect to Stripe checkout

2. **Complete Payment** (Test Mode)
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date and any CVC
   - Complete payment

3. **Check Email for Invitation Code**
   - An invitation code (format: `SHP-XXXX-XXXX-XXXX`) will be sent to the email
   - For testing without email, check the database:
   ```sql
   SELECT code FROM invitation_codes WHERE email = 'test@example.com';
   ```

4. **Register Account**
   - Navigate to `/sign-up`
   - Enter email, password, and invitation code
   - Complete registration

5. **Fill Mentee Form**
   - After registration, navigate to Dashboard
   - Complete the mentee profile form
   - Submit for AI matching

### Testing Mentor Application Flow

1. **Submit Public Application**
   - Navigate to `/mentorship/become-a-mentor`
   - Complete the 4-step application form
   - Submit application

2. **Admin Review**
   - Login as admin user
   - Navigate to `/dashboard/admin/mentors/applications`
   - Review and approve/reject applications

3. **Receive Invitation Code**
   - Upon approval, applicant receives invitation code via email
   - Use code to register as mentor

### Testing Admin Features

1. **Access Admin Dashboard**
   - Login with admin credentials
   - Navigate to `/dashboard/admin`

2. **Manage Mentor Applications**
   - `/dashboard/admin/mentors/applications` - Review mentor applications
   - `/dashboard/admin/mentors/verified` - View verified mentors

3. **AI Matching Management**
   - `/dashboard/admin/matching` - Run AI matching algorithm
   - Review and approve/reject match suggestions

4. **User Management**
   - `/dashboard/admin/users` - View all users
   - `/dashboard/admin/users/roles` - Manage user roles

## API Testing

### Test with curl

#### Public Mentor Application
```bash
curl -X POST http://localhost:3000/api/forms/mentor/public \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Mentor",
    "email": "mentor@test.com",
    "phone": "+64211234567",
    "jobTitle": "Senior Engineer",
    "company": "Tech Corp",
    "yearsExperience": 10,
    "bio": "Experienced software engineer passionate about mentoring...",
    "softSkillsExpert": ["Communication", "Leadership"],
    "industrySkillsExpert": ["Software Development", "Cloud Computing"],
    "maxMentees": 3,
    "availabilityHoursPerMonth": 4,
    "expectedMenteeGoalsLongTerm": "Help mentees advance their tech careers"
  }'
```

#### Check Application Status
```bash
curl "http://localhost:3000/api/forms/mentor/public?email=mentor@test.com"
```

## Database Operations

### View Database with Drizzle Studio
```bash
pnpm db:studio
```
Opens a web interface at `https://local.drizzle.studio` to browse and edit data.

### Common SQL Queries

#### View pending mentor applications
```sql
SELECT id, full_name, email, status, submitted_at
FROM mentor_form_submissions
WHERE status = 'submitted';
```

#### View active mentorship relationships
```sql
SELECT
  mr.id,
  m.full_name as mentor_name,
  t.full_name as mentee_name,
  mr.status
FROM mentorship_relationships mr
JOIN mentor_profiles mp ON mr.mentor_profile_id = mp.id
JOIN mentee_profiles tp ON mr.mentee_profile_id = tp.id
JOIN users m ON mp.user_id = m.id
JOIN users t ON tp.user_id = t.id
WHERE mr.status = 'active';
```

#### Check invitation codes
```sql
SELECT code, code_type, email, is_used, expires_at
FROM invitation_codes
ORDER BY created_at DESC
LIMIT 10;
```

## Stripe Webhook Testing

For local development, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: scoop install stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret and add to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Test Payment Events
```bash
# Trigger a test checkout.session.completed event
stripe trigger checkout.session.completed
```

## Test Accounts

For development, you can create test accounts directly in the database:

### Create Admin User
```sql
-- Create user
INSERT INTO users (name, email, password_hash, email_verified, role)
VALUES ('Admin User', 'admin@test.com', 'hashed_password', NOW(), 'admin');

-- Add admin role
INSERT INTO user_roles (user_id, role_type, is_active)
SELECT id, 'admin', true FROM users WHERE email = 'admin@test.com';

-- Add admin permissions
INSERT INTO admin_permissions (user_id, can_verify_mentors, can_manage_events, can_manage_users)
SELECT id, true, true, true FROM users WHERE email = 'admin@test.com';
```

## Build Testing

### Production Build
```bash
pnpm build
```

### Type Checking
```bash
npx tsc --noEmit
```

### Lint
```bash
pnpm lint
```

## Common Issues

### Database Connection Errors
- Ensure `DATABASE_URL` is correctly configured
- Check if SSL is required (`?sslmode=require`)
- Verify the database is accessible from your network

### OAuth Errors
- Ensure redirect URIs are configured in Google/GitHub developer console
- For local development, add `http://localhost:3000` to allowed origins

### Stripe Webhook Issues
- Verify webhook signature with correct secret
- Ensure webhook endpoint is accessible
- Check Stripe dashboard for failed webhook deliveries

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check for TypeScript errors: `npx tsc --noEmit`

## Key Pages Reference

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page |
| Mentee Join | `/mentorship/join` | Payment and registration start |
| Mentor Apply | `/mentorship/become-a-mentor` | Public mentor application |
| Sign Up | `/sign-up` | Account registration (requires code) |
| Dashboard | `/dashboard` | User dashboard |
| Admin Dashboard | `/dashboard/admin` | Admin management |
| Mentor Applications | `/dashboard/admin/mentors/applications` | Review applications |
| AI Matching | `/dashboard/admin/matching` | Manage AI matching |
