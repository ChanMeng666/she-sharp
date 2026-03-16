# Restoring Mentee Payment Flow

## Background

The mentee application originally required payment ($100 NZD/year via Stripe) before receiving an invitation code to register. In March 2026, the payment was temporarily disabled to offer free mentee registration with admin review. This document describes exactly how to restore the payment flow.

## Current Flow (Free Registration with Admin Review)

```
Mentee fills form → Redirect to success page (submitted=true)
→ Admin reviews in dashboard → Approves → Invitation code email sent → Register
```

## Target Flow (Payment Required)

```
Mentee fills form → Redirect to payment page → Stripe checkout
→ Payment succeeds → Webhook generates invitation code → Email sent → Register
```

## Changes Required

### 1. Mentee Apply Page — Restore Payment Redirect

**File:** `app/(site)/mentorship/mentee/apply/page.tsx`

Find (around line 419):
```ts
router.push(`/mentorship/mentee/success?submitted=true`);
```

Replace with:
```ts
router.push(`/mentorship/mentee/payment?id=${data.submissionId}`);
```

### 2. Mentee Success Page — No Code Change Needed

The success page at `app/(site)/mentorship/mentee/success/page.tsx` already handles both flows:
- `?submitted=true` — shows "Application Submitted" (admin review flow)
- `?session_id=xxx` or `?already_paid=true` — shows "Payment Successful" (payment flow)

Both states coexist. No changes needed here unless you want to remove the `submitted=true` state entirely.

### 3. Forms Service — Restore Auto-Approve for Paying Mentees

**File:** `lib/forms/service.ts`

The `submitMenteeForm()` function (for logged-in users submitting via dashboard) previously auto-approved and activated the mentee role. If you want to restore auto-approve for **paying** mentees, re-add the following block after the activity log in `submitMenteeForm()`:

```ts
// After the activityLogs insert, add:

// Auto-approve mentee forms and activate role
await db
  .update(menteeFormSubmissions)
  .set({
    status: 'approved',
    reviewedAt: new Date(),
    updatedAt: new Date(),
  })
  .where(eq(menteeFormSubmissions.userId, userId));

// Check if mentee role already exists
const [existingRole] = await db
  .select()
  .from(userRoles)
  .where(
    and(
      eq(userRoles.userId, userId),
      eq(userRoles.roleType, 'mentee')
    )
  )
  .limit(1);

if (!existingRole) {
  await db.insert(userRoles).values({
    userId,
    roleType: 'mentee',
    isActive: true,
  });
} else if (!existingRole.isActive) {
  await db
    .update(userRoles)
    .set({ isActive: true })
    .where(eq(userRoles.id, existingRole.id));
}

// Create or update mentee profile
const [existingProfile] = await db
  .select()
  .from(menteeProfiles)
  .where(eq(menteeProfiles.userId, userId))
  .limit(1);

const profileData = {
  bio: form.bio,
  careerStage: form.currentStage,
  learningGoals: [form.longTermGoals, form.shortTermGoals].filter(Boolean) as string[],
  preferredExpertiseAreas: form.preferredIndustries || [],
  preferredMeetingFrequency: form.preferredMeetingFrequency,
  currentChallenge: form.whyMentor,
  mbtiType: form.mbtiType,
  photoUrl: form.photoUrl,
  formSubmissionId: form.id,
  profileCompletedAt: new Date(),
};

if (!existingProfile) {
  await db.insert(menteeProfiles).values({
    userId,
    ...profileData,
  });
} else {
  await db
    .update(menteeProfiles)
    .set(profileData)
    .where(eq(menteeProfiles.userId, userId));
}
```

> **Note:** This auto-approve only applies to the `submitMenteeForm()` path (logged-in users). The public mentee form (`submitPublicMenteeForm()`) always goes through payment → webhook → invitation code, which is a separate path.

### 4. Decision: Keep or Remove Admin Review for Mentees

The admin review infrastructure added in the free registration update can coexist with payment:

- **Keep both** — Admin can still review mentee applications via the dashboard, useful for screening before or after payment
- **Remove admin review** — Delete `reviewMenteeForm()` from `lib/forms/service.ts` and the two API routes:
  - `app/api/admin/mentees/applications/route.ts`
  - `app/api/admin/mentees/applications/[id]/review/route.ts`

The `mentee_approved` invitation code type and `createMenteeApprovalCode()` can also stay — they don't conflict with the `payment` code type used by Stripe webhooks.

## Files Reference

### Payment Infrastructure (preserved, no changes needed)

| File | Purpose |
|------|---------|
| `app/(site)/mentorship/mentee/payment/page.tsx` | Payment page UI |
| `app/api/stripe/checkout/route.ts` | Creates Stripe checkout session |
| `app/api/stripe/webhook/route.ts` | Handles Stripe webhook → generates invitation code |
| `lib/stripe/service.ts` | Stripe utility functions |

### Files Modified During Free Registration Update

| File | What was changed |
|------|-----------------|
| `app/(site)/mentorship/mentee/apply/page.tsx` | Redirect target changed |
| `app/(site)/mentorship/mentee/success/page.tsx` | Added `submitted=true` state |
| `lib/forms/service.ts` | Removed auto-approve, added `reviewMenteeForm()` |
| `lib/invitations/service.ts` | Added `createMenteeApprovalCode()`, `mentee_approved` type |
| `lib/email/service.ts` | Added `mentee_approved` email template |
| `lib/db/schema.ts` | Added `mentee_approved` to `invitationCodeTypeEnum` |
| `components/admin/UserManagement.tsx` | Review routing by application type |
| `app/api/admin/users/route.ts` | Fetch public mentee applications |

### Files Added During Free Registration Update

| File | Purpose |
|------|---------|
| `app/api/admin/mentees/applications/route.ts` | List mentee applications |
| `app/api/admin/mentees/applications/[id]/review/route.ts` | Review mentee application |
| `lib/db/migrations/0023_left_galactus.sql` | Add `mentee_approved` enum value |

## Database Schema Notes

- The `mentee_approved` enum value was **added** to `invitation_code_type`. It does not conflict with the existing `payment` type.
- No payment-related fields were removed from any table. `menteeFormSubmissions.paymentCompleted`, `stripePaymentIntentId`, and all related columns remain intact.
- No migration is needed to restore payment — the schema already supports both flows.

## Verification After Restoring Payment

1. Submit mentee form → redirected to payment page (not success page)
2. Complete Stripe checkout → webhook fires → invitation code generated → email sent
3. Success page shows "Payment Successful" with invitation code instructions
4. Use invitation code to register → mentee role activated
5. `pnpm build` passes
