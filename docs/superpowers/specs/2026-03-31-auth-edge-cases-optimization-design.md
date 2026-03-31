# Auth Edge Cases & User Experience Optimization

**Date:** 2026-03-31
**Triggered by:** Mentor Nanthan Singaravel dual-account incident — registered with two different emails, causing orphaned OAuth account without mentor role or email verification.

## Context

The current invitation-based registration system has several edge cases that allow users to end up in broken states:

1. OAuth sign-in creates accounts before invitation code validation, producing "ghost accounts"
2. Dashboard pages don't enforce invitation code verification, so unverified OAuth users can access protected pages
3. Invitation code email mismatch errors are opaque — users don't know which email to use
4. No admin tooling to manually verify emails or resolve account issues
5. Same person can create multiple accounts with different emails without any warning

## Scope

7 items across 3 priority tiers:

- **Tier A (Security):** Dashboard access guard, sign-in OAuth flow fix, ghost account mitigation
- **Tier B (UX):** Invitation code error messages, duplicate account warning, dashboard verification badge link
- **Tier C (Admin):** Manual email verification action

---

## Tier A: Security Fixes

### A1. Dashboard Access Guard for Unverified OAuth Users

**Problem:** Dashboard pages only check `getUser()` for a valid session. An OAuth user who skips `/verify-invitation` (by navigating directly to `/dashboard`) can access protected pages without having completed invitation code verification.

**Solution:** Create a shared guard function `ensureUserVerified(user)` in `lib/auth/permissions.ts`. All dashboard Server Components call this after `getUser()`. The function redirects to `/verify-invitation` if the user has no `passwordHash` (not a credential user) AND no `inviteCodeVerifiedAt` (invitation code not verified).

**Files to modify:**
- `lib/auth/permissions.ts` — add `ensureUserVerified()` function
- `app/(dashboard)/dashboard/page.tsx` — add guard call
- `app/(dashboard)/dashboard/account/page.tsx` — add guard call
- `app/(dashboard)/dashboard/mentor-profile/page.tsx` — add guard call
- `app/(dashboard)/dashboard/mentee-profile/page.tsx` — add guard call
- `app/(dashboard)/dashboard/mentorship/page.tsx` — add guard call
- `app/(dashboard)/dashboard/meetings/page.tsx` — add guard call
- `app/(dashboard)/dashboard/admin/page.tsx` — add guard call (admin users have passwordHash, so unaffected)
- All other dashboard sub-pages with Server Components

**Guard logic:**
```typescript
export async function ensureUserVerified(user: User): Promise<void> {
  // Credential users (have password) are verified through signup flow
  if (user.passwordHash) return;
  // OAuth users must have completed invitation code verification
  if (user.inviteCodeVerifiedAt) return;
  // Unverified OAuth user — redirect to verification
  redirect('/verify-invitation');
}
```

**Impact on existing users:** None. All legitimate users either (a) signed up with password (have `passwordHash`) or (b) completed OAuth + invitation code flow (have `inviteCodeVerifiedAt`). Only orphaned OAuth accounts are affected.

### A2. Sign-in Page OAuth Flow (Already Handled)

**Problem:** Sign-in page shows OAuth buttons without invitation code pre-validation, allowing new users to create accounts via `/sign-in`.

**Analysis:** The existing `verify-existing-user` route already handles this correctly — new OAuth users without `passwordHash` or `inviteCodeVerifiedAt` are redirected to `/verify-invitation`. The real gap was A1 (dashboard not enforcing the check). With A1 fixed, the sign-in OAuth flow is secure end-to-end.

**No code changes needed** — A1 closes the gap.

### A3. Ghost Account Mitigation

**Problem:** OAuth creates user records before invitation code validation. Failed validation leaves orphaned accounts with no role, no profile, and no verification.

**Solution:** Accept ghost accounts as a side effect of OAuth's account-creation-first pattern (blocking account creation would break the standard NextAuth flow). With A1's dashboard guard, ghost accounts cannot access protected features.

**No code changes needed** — A1 makes ghost accounts harmless.

---

## Tier B: User Experience Improvements

### B1. Invitation Code Email Mismatch — Improved Error Message

**Problem:** When `generatedFor` email doesn't match the user's email, the error message is generic: "This invitation code is not valid for your email address." Users don't know which email they should use.

**Solution:** Show the target email with partial masking in the error message.

**Files to modify:**
- `lib/invitations/apply-code.ts` — update error message with masked email
- `lib/utils.ts` — add `maskEmail()` utility function

**Masking logic:**
```typescript
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
}
```

**New error message:**
```
"This invitation code was generated for n***@myob.com. Please sign in with that email address, or contact admin for assistance."
```

### B2. Duplicate Account Warning on Registration

**Problem:** Same person can register with different emails, creating duplicate accounts without any warning.

**Solution:** After user creation in the `signUp` action, check for existing users with the same name (case-insensitive). If found, include a warning in the response (non-blocking).

**Files to modify:**
- `app/(login)/actions.ts` — add name-duplicate check in `signUp` function after user creation

**Check logic:**
```typescript
const sameName = await db.select({ id: users.id })
  .from(users)
  .where(and(
    ilike(users.name, newUser.name),
    ne(users.id, newUser.id)
  ))
  .limit(1);

if (sameName.length > 0) {
  // Log warning, include in response for UI display
}
```

**Scope:** Credential signup only. OAuth signup auto-creates users via NextAuth adapter — adding duplicate checks there would require modifying the custom adapter, which is higher risk for marginal benefit. The A1 dashboard guard already prevents ghost OAuth accounts from being problematic.

### B3. Dashboard "Email Not Verified" Badge — Add Navigation Link

**Problem:** Dashboard shows "Email not verified" badge but no actionable link. Users don't know where to go to verify.

**Solution:** Wrap the badge in a `Link` component pointing to `/dashboard/account`.

**Files to modify:**
- `app/(dashboard)/dashboard/DynamicDashboard.tsx` — wrap badge in `<Link>`

**Before:**
```tsx
<Badge variant="destructive">
  <AlertCircle className="h-3 w-3 mr-1" />
  Email not verified
</Badge>
```

**After:**
```tsx
<Link href="/dashboard/account">
  <Badge variant="destructive" className="cursor-pointer hover:bg-destructive/80">
    <AlertCircle className="h-3 w-3 mr-1" />
    Email not verified
  </Badge>
</Link>
```

---

## Tier C: Admin Tooling

### C1. Admin Manual Email Verification

**Problem:** Admins cannot manually verify a user's email. When issues arise (like the Nanthan incident), direct database access is required.

**Solution:** Add `verify_email` action to the existing admin user PATCH endpoint and corresponding UI button.

**Files to modify:**
- `app/api/admin/users/[id]/route.ts` — add `verify_email` case in PATCH handler
- `components/admin/UserManagement.tsx` — add "Verify Email" option in user action dropdown for unverified users

**API change:**
```typescript
case 'verify_email':
  await db.update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, userId));
  await logActivity(adminUserId, 'admin_verify_email', { targetUserId: userId });
  return NextResponse.json({ success: true, message: 'Email verified successfully' });
```

**UI:** In the user action dropdown menu, show "Verify Email" option only when user's `emailVerifiedAt` is null. Use a `MailCheck` icon from lucide-react.

---

## Files Summary

| File | Changes |
|------|---------|
| `lib/auth/permissions.ts` | Add `ensureUserVerified()` |
| `lib/invitations/apply-code.ts` | Update email mismatch error with masked email |
| `lib/utils.ts` | Add `maskEmail()` utility |
| `app/(dashboard)/dashboard/page.tsx` | Add verification guard |
| `app/(dashboard)/dashboard/account/page.tsx` | Add verification guard |
| `app/(dashboard)/dashboard/mentor-profile/page.tsx` | Add verification guard |
| `app/(dashboard)/dashboard/mentee-profile/page.tsx` | Add verification guard |
| `app/(dashboard)/dashboard/mentorship/page.tsx` | Add verification guard |
| `app/(dashboard)/dashboard/meetings/page.tsx` | Add verification guard |
| `app/(dashboard)/dashboard/admin/**` pages | Add verification guard |
| `app/(dashboard)/dashboard/DynamicDashboard.tsx` | Badge → Link |
| `app/(login)/actions.ts` | Duplicate name warning |
| `app/api/admin/users/[id]/route.ts` | Add `verify_email` action |
| `components/admin/UserManagement.tsx` | Add "Verify Email" UI |

## Verification Plan

1. **A1 test:** Create a test OAuth account without invitation code → confirm it redirects to `/verify-invitation` when accessing any `/dashboard/*` page
2. **B1 test:** Use an invitation code with mismatched email → confirm error shows masked target email
3. **B2 test:** Register with same name as existing user → confirm warning appears
4. **B3 test:** Log in as unverified user → confirm badge links to `/dashboard/account`
5. **C1 test:** As admin, verify an unverified user's email → confirm `emailVerifiedAt` is set and badge disappears
6. **Build verification:** `pnpm build` passes with no type errors
