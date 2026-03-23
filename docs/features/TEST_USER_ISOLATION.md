# Test User Isolation System

## Overview

The test user isolation system allows test users to coexist with real users in the production database without polluting real user data. Test users can access all platform features identically to real users, while being clearly distinguished in admin views, excluded from analytics, and isolated in mentor-mentee matching. After the testing period, all test user data can be removed with a single cleanup script.

## How It Works

### Marking Mechanism

Test users are identified by the `is_test_user` boolean column on the `users` table (default: `false`). This flag is set automatically during registration based on the invitation code type.

A new invitation code type `test` has been added to the `invitation_code_type` enum. Any user who registers with a `test` type invitation code is automatically marked as `isTestUser = true`.

### Two Entry Paths for Test Users

#### Path A: Direct Registration

For testing general features (dashboard, account settings, etc.):

1. An admin creates a test invitation code via the admin API or the `createTestInvitationCode()` function
2. The test invitation code supports multiple uses (default: 50) and a 30-day expiration
3. Test users register with this code through the normal sign-up flow
4. The system automatically sets `isTestUser = true` on the new user record

#### Path B: Form Application Flow

For testing the full mentor/mentee application pipeline:

1. A test user submits a public mentor or mentee application form (identical to real users)
2. An admin reviews the application and checks the "Test User" option (`isTestUser: true` in the API request body)
3. The system generates a `test` type invitation code (instead of `mentor_approved` or `mentee_approved`), while preserving the `targetRole` and `linkedFormId`
4. The test user receives the invitation email, registers with the code, and is automatically marked as a test user
5. Role assignment, profile creation, and form linking proceed exactly as for real users

## Feature Access

Test users have **unrestricted access** to all platform features:

- Sign up and sign in (email/password and OAuth)
- Fill out mentor/mentee application forms
- Receive role assignments (mentor, mentee, admin)
- Use the dashboard and all role-specific pages
- Participate in events and access resources
- Receive email notifications and Slack alerts (not suppressed)
- Make payments via Stripe (use Stripe test mode for test user payments)

The only behavioral difference is in **mentor-mentee matching**: test users are only matched with other test users, and real users are only matched with other real users.

## Admin Visibility

### User Management Page

The admin user management page (`/dashboard/admin/users`) includes:

- **User Type Filter**: A dropdown with options "All Users", "Real Users", and "Test Users" to filter the user list
- **TEST Badge**: An orange "TEST" badge displayed next to test user names in both mobile and desktop views
- **Stats**: The stats section includes a `testUsers` count showing how many test users exist

### API Parameters

The admin users API (`GET /api/admin/users`) supports:

- `userType=all` (default) — show all users
- `userType=real` — show only real users (`is_test_user = false`)
- `userType=test` — show only test users (`is_test_user = true`)

Each user record in the response includes `isTestUser: boolean`.

### Form Review API

When reviewing mentor/mentee applications, the admin can pass `isTestUser: true` in the request body:

```
POST /api/admin/mentors/applications/:id/review
POST /api/admin/mentees/applications/:id/review

Body: {
  "action": "approve",
  "notes": "Test user for QA",
  "isTestUser": true
}
```

## Analytics Exclusion

All analytics queries in `/api/analytics/dashboard` automatically exclude test users:

| Query | Filter Applied |
|-------|---------------|
| User Statistics (total, new, verified, active) | `WHERE is_test_user = false` |
| User Growth Trend (12 months) | `WHERE is_test_user = false` |
| Top Mentors | `JOIN users ON ... AND is_test_user = false` |
| Daily Active Users (system health) | `WHERE is_test_user = false` |
| User Report (export) | `WHERE is_test_user = false` |
| Mentorship Report (export) | `JOIN users ON ... AND is_test_user = false` |

Analytics data is never polluted by test user activity.

## Matching Isolation

The AI matching system (`lib/matching/service.ts`) enforces strict isolation:

- When generating matches for a mentee, the system checks the mentee's `isTestUser` status
- Only mentors with the **same** `isTestUser` status are considered as candidates
- Test mentors match only with test mentees; real mentors match only with real mentees
- This prevents cross-contamination of mentorship relationships

## Creating Test Invitation Codes

### Via Admin API

```
POST /api/admin/invitation-codes

Body: {
  "codeType": "test",
  "maxUses": 50,
  "expiresInDays": 30,
  "notes": "QA testing batch - March 2026"
}
```

### Via Service Function

```typescript
import { createTestInvitationCode } from '@/lib/invitations/service';

const code = await createTestInvitationCode(adminUserId, {
  maxUses: 50,
  expiresInDays: 30,
  targetRole: 'mentor',  // optional: auto-assign role on registration
  notes: 'Test mentors for QA',
});
```

### Function Signature

```typescript
createTestInvitationCode(
  adminUserId: number,
  options?: {
    maxUses?: number;          // default: 50
    expiresInDays?: number;    // default: 30
    recipientEmail?: string;   // optional: restrict to specific email
    targetRole?: 'mentor' | 'mentee' | 'admin';  // optional
    notes?: string;
  }
): Promise<InvitationCode>
```

## Cleanup Script

### Usage

```bash
# Preview what would be deleted (no changes made)
npx tsx scripts/cleanup-test-users.ts --dry-run

# Execute cleanup
npx tsx scripts/cleanup-test-users.ts
```

### What It Does

The cleanup script removes all test users and their associated data in the correct FK dependency order:

**Phase 1 — Manual deletion (tables without `onDelete: cascade`):**

| Table | Action |
|-------|--------|
| `meetings` | DELETE (via relationships) |
| `mentorship_relationships` | DELETE |
| `ai_match_results` | DELETE |
| `ai_matching_runs` | DELETE |
| `mentor_programme_assignments` | DELETE |
| `invitation_code_usages` | DELETE |
| `invitation_codes` | SET NULL (`generated_by`) |
| `events` (with real registrations) | REASSIGN `created_by` to a real admin |
| `events` (test-only) | DELETE |
| `resources` | REASSIGN `uploaded_by` |
| `activity_logs` | SET NULL (`user_id`) |
| `volunteer_form_submissions` | SET NULL (`reviewed_by`) |
| `contact_form_submissions` | SET NULL (`reviewed_by`) |

**Phase 2 — CASCADE deletion (automatic when user row is deleted):**

`userRoles`, `userMemberships`, `mentorProfiles`, `menteeProfiles`, `eventRegistrations`, `eventRoleAssignments`, `resourceAccessLogs`, `notifications`, `emailVerifications`, `passwordResets`, `passwordHistory`, `adminPermissions`, `mentorFormSubmissions`, `menteeFormSubmissions`, `menteeWaitingQueue`

### Safety Features

- **Dry run mode**: Use `--dry-run` to preview all deletions without making changes
- **Cross-type detection**: Warns if test users have mentorship relationships with real users
- **Event protection**: Events created by test users that have real user registrations are reassigned (not deleted)
- **Per-table summary**: Prints a detailed count of affected records per table

### External Data (Not Handled)

The cleanup script only handles database records. The following require manual cleanup:

- **Cloudinary**: Profile photos uploaded by test users remain in Cloudinary storage
- **Stripe**: Payment records in Stripe (use Stripe test mode to avoid this)
- **Resend**: Emails already sent to test users cannot be recalled

## Database Schema

### Users Table Change

```sql
ALTER TABLE users ADD COLUMN is_test_user BOOLEAN NOT NULL DEFAULT false;
```

All existing users automatically have `is_test_user = false`. No data backfill needed.

### Invitation Code Type Enum Change

```sql
ALTER TYPE invitation_code_type ADD VALUE 'test';
```

Added alongside existing values: `payment`, `mentor_approved`, `mentee_approved`, `admin_generated`.

## Files Modified

| File | Change |
|------|--------|
| `lib/db/schema.ts` | Added `isTestUser` column to users table; added `test` to invitation code type enum |
| `lib/db/migrations/0025_dark_magdalene.sql` | Auto-generated migration |
| `app/(login)/actions.ts` | Set `isTestUser` based on invitation code type during credential sign-up |
| `app/(login)/verify-invitation/actions.ts` | Set `isTestUser` during OAuth invitation code verification |
| `lib/invitations/service.ts` | Updated `CreateInvitationCodeParams` type; added `isTestUser` param to `createMentorApprovalCode` and `createMenteeApprovalCode`; added `createTestInvitationCode()` |
| `lib/forms/service.ts` | Added `isTestUser` param to `reviewMentorForm` and `reviewMenteeForm` |
| `app/api/admin/mentors/applications/[id]/review/route.ts` | Pass `isTestUser` from request body to review function |
| `app/api/admin/mentees/applications/[id]/review/route.ts` | Same as above |
| `app/api/admin/users/route.ts` | Added `isTestUser` to select/response; added `userType` filter; added `testUsers` stat |
| `components/admin/UserManagement.tsx` | Added User Type filter dropdown; added TEST badge; updated interfaces |
| `app/api/analytics/dashboard/route.ts` | Added `is_test_user = false` to all user-related analytics queries |
| `lib/matching/service.ts` | Added test/real user isolation in `generateMatchesForMentee` |
| `scripts/cleanup-test-users.ts` | New cleanup script with dry-run, cascade handling, and safety checks |
