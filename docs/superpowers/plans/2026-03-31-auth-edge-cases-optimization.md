# Auth Edge Cases & UX Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 auth/UX edge cases discovered from the mentor dual-account incident — secure unverified OAuth dashboard access, improve invitation code error messages, add admin email verification, and add duplicate account warning.

**Architecture:** All changes are isolated modifications to existing files. No new tables, no new pages, no new API routes. The dashboard layout guard protects all sub-pages in one place. The invitation code error improvement and admin verify_email action each touch one file.

**Tech Stack:** Next.js 15 App Router, TypeScript, Drizzle ORM, PostgreSQL (Neon), lucide-react icons

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/auth/permissions.ts` | Modify | Add `ensureUserVerified()` guard function |
| `app/(dashboard)/dashboard/layout.tsx` | Modify | Call guard to protect all dashboard pages |
| `lib/utils.ts` | Modify | Add `maskEmail()` utility |
| `lib/invitations/apply-code.ts` | Modify | Improve email mismatch error with masked email |
| `app/(login)/actions.ts` | Modify | Add duplicate name warning in signUp |
| `app/(dashboard)/dashboard/DynamicDashboard.tsx` | Modify | Badge → clickable Link |
| `app/api/admin/users/[id]/route.ts` | Modify | Add `verify_email` action |
| `app/api/admin/users/route.ts` | Modify | Return `emailVerifiedAt` in user list |
| `components/admin/UserManagement.tsx` | Modify | Add "Verify Email" dropdown item + handler |

---

### Task 1: Dashboard Access Guard

**Files:**
- Modify: `lib/auth/permissions.ts` (append after line 51)
- Modify: `app/(dashboard)/dashboard/layout.tsx` (lines 1-14)

- [ ] **Step 1: Add `ensureUserVerified()` to permissions.ts**

Append to `lib/auth/permissions.ts`:

```typescript
import { redirect } from 'next/navigation';
import { User } from '@/lib/db/schema';

/**
 * Ensures OAuth users have completed invitation code verification.
 * Credential users (with passwordHash) pass through — they verified during signup.
 * Call this in dashboard layouts/pages after getUser().
 */
export function ensureUserVerified(user: User): void {
  if (user.passwordHash) return;
  if (user.inviteCodeVerifiedAt) return;
  redirect('/verify-invitation');
}
```

Note: Add the `redirect` import from `next/navigation` and `User` import from `@/lib/db/schema` at the top of the file. The existing imports only have `db` and `userRoles`.

- [ ] **Step 2: Add guard to dashboard layout**

Modify `app/(dashboard)/dashboard/layout.tsx` — add imports and guard call inside the layout function, before the return statement:

```typescript
import { getUser } from "@/lib/db/queries";
import { ensureUserVerified } from "@/lib/auth/permissions";
```

Inside `DashboardLayout`, before `return`:

```typescript
export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getUser();
  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect('/sign-in');
  }
  ensureUserVerified(user);

  const cookieStore = await cookies();
  // ... rest unchanged
```

- [ ] **Step 3: Build check**

Run: `pnpm build 2>&1 | head -50`
Expected: No type errors in modified files.

- [ ] **Step 4: Commit**

```bash
git add lib/auth/permissions.ts app/\(dashboard\)/dashboard/layout.tsx
git commit -m "fix(auth): add dashboard guard for unverified OAuth users

Unverified OAuth users (no passwordHash and no inviteCodeVerifiedAt)
are now redirected to /verify-invitation when accessing any dashboard page.
This closes the gap where users could bypass invitation verification
by navigating directly to /dashboard."
```

---

### Task 2: Invitation Code Email Mismatch Error Improvement

**Files:**
- Modify: `lib/utils.ts` (append after existing functions)
- Modify: `lib/invitations/apply-code.ts` (lines 46-54)
- Modify: `app/(login)/actions.ts` (lines 167-176)

- [ ] **Step 1: Add `maskEmail()` utility to `lib/utils.ts`**

Append to `lib/utils.ts`:

```typescript
/**
 * Masks an email address for display, showing only the first character
 * of the local part and the full domain.
 * Example: "nanthan.singaravel@myob.com" → "n***@myob.com"
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return '***';
  const local = email.substring(0, atIndex);
  const domain = email.substring(atIndex);
  return `${local.charAt(0)}***${domain}`;
}
```

- [ ] **Step 2: Update error message in `apply-code.ts`**

In `lib/invitations/apply-code.ts`, replace lines 46-54:

**Before:**
```typescript
  // Check if code is for specific email
  if (
    codeValidation.code.generatedFor &&
    codeValidation.code.generatedFor.toLowerCase() !== userEmail.toLowerCase()
  ) {
    return {
      success: false,
      error: 'This invitation code is not valid for your email address.',
    };
  }
```

**After:**
```typescript
  // Check if code is for specific email
  if (
    codeValidation.code.generatedFor &&
    codeValidation.code.generatedFor.toLowerCase() !== userEmail.toLowerCase()
  ) {
    const maskedTarget = maskEmail(codeValidation.code.generatedFor);
    return {
      success: false,
      error: `This invitation code was generated for ${maskedTarget}. Please sign in with that email address, or contact admin for assistance.`,
    };
  }
```

Add import at top of file: `import { maskEmail } from '@/lib/utils';`

- [ ] **Step 3: Update error message in `actions.ts` signUp function**

In `app/(login)/actions.ts`, replace lines 167-176:

**Before:**
```typescript
  // Check if invitation code is for specific email
  if (codeValidation.code?.generatedFor &&
      codeValidation.code.generatedFor.toLowerCase() !== email.toLowerCase()) {
    return {
      error: 'This invitation code is not valid for this email address.',
      email,
      password: '',
      invitationCode
    };
  }
```

**After:**
```typescript
  // Check if invitation code is for specific email
  if (codeValidation.code?.generatedFor &&
      codeValidation.code.generatedFor.toLowerCase() !== email.toLowerCase()) {
    const maskedTarget = maskEmail(codeValidation.code.generatedFor);
    return {
      error: `This invitation code was generated for ${maskedTarget}. Please sign in with that email address, or contact admin for assistance.`,
      email,
      password: '',
      invitationCode
    };
  }
```

Add import at top of file: `import { maskEmail } from '@/lib/utils';`

- [ ] **Step 4: Build check**

Run: `pnpm build 2>&1 | head -50`
Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts lib/invitations/apply-code.ts app/\(login\)/actions.ts
git commit -m "fix(auth): show masked target email in invitation code mismatch error

When a user tries to use an invitation code generated for a different
email, the error now shows the target email (partially masked for
privacy) so the user knows which email to sign in with."
```

---

### Task 3: Duplicate Account Name Warning

**Files:**
- Modify: `app/(login)/actions.ts` (after line 202, inside signUp function)

- [ ] **Step 1: Add duplicate name check after user creation**

In `app/(login)/actions.ts`, after the user creation block (after line 211 `}`), add the duplicate name check. This should go right before the `useInvitationCode` call (line 213):

Insert between line 211 and line 213:

```typescript
  // Check for existing users with same name (non-blocking warning)
  let duplicateNameWarning: string | undefined;
  if (createdUser.name || email) {
    const nameToCheck = createdUser.name || email.split('@')[0];
    const sameNameUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          ilike(users.name, nameToCheck),
          ne(users.id, createdUser.id),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (sameNameUsers.length > 0) {
      duplicateNameWarning = 'An account with a similar name already exists. If that\'s you, please sign in with your original email instead.';
    }
  }
```

Add imports at top: `import { and, eq, ne, ilike, isNull } from 'drizzle-orm';` — check which are already imported and only add missing ones (`ne`, `ilike`, `isNull`).

Then in the success return at line 396-399, include the warning:

**Before:**
```typescript
  return {
    success: true,
    redirectTo: '/dashboard'
  };
```

**After:**
```typescript
  return {
    success: true,
    redirectTo: '/dashboard',
    warning: duplicateNameWarning,
  };
```

Note: The signUp function creates the user with only `email` at this point — `name` is set later when the form submission is linked. Since the invitation code's linked form contains the name, the name check should use the form's `fullName` if available. However, at line 202 the user is created without a name, so at this point `createdUser.name` is null. The name gets set at line 340. So move the duplicate check to AFTER line 367 (after form data is applied) for accuracy:

Actually, let me reconsider. The name is set on lines 339-345 via `UPDATE users SET name = mentorForm.fullName`. So the duplicate check should go AFTER line 367 (after the linked form block closes). Insert before line 370 (before "Log activity"):

```typescript
  // Check for existing users with same name (non-blocking warning)
  let duplicateNameWarning: string | undefined;
  const [updatedUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, createdUser.id)).limit(1);
  if (updatedUser?.name) {
    const sameNameUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          ilike(users.name, updatedUser.name),
          ne(users.id, createdUser.id),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (sameNameUsers.length > 0) {
      duplicateNameWarning = 'An account with a similar name already exists. If that\'s you, please sign in with your original email instead.';
    }
  }
```

- [ ] **Step 2: Build check**

Run: `pnpm build 2>&1 | head -50`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(login\)/actions.ts
git commit -m "feat(auth): warn when registering with same name as existing user

Non-blocking warning displayed after registration if another account
with the same name exists, helping prevent duplicate accounts."
```

---

### Task 4: Dashboard Email Verification Badge Link

**Files:**
- Modify: `app/(dashboard)/dashboard/DynamicDashboard.tsx` (lines 211-216)

- [ ] **Step 1: Wrap badge in Link**

The file already imports `Link` from `next/link` (line 4). Replace lines 211-216:

**Before:**
```tsx
          {!user.emailVerified && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Email not verified
            </Badge>
          )}
```

**After:**
```tsx
          {!user.emailVerified && (
            <Link href="/dashboard/account">
              <Badge variant="destructive" className="cursor-pointer hover:bg-destructive/80 transition-colors">
                <AlertCircle className="h-3 w-3 mr-1" />
                Email not verified
              </Badge>
            </Link>
          )}
```

- [ ] **Step 2: Build check**

Run: `pnpm build 2>&1 | head -50`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/dashboard/DynamicDashboard.tsx
git commit -m "fix(dashboard): make email verification badge clickable

Badge now links to /dashboard/account where the user can trigger
email verification, providing clear navigation guidance."
```

---

### Task 5: Admin Manual Email Verification — API

**Files:**
- Modify: `app/api/admin/users/[id]/route.ts` (insert after line 178, before line 181)

- [ ] **Step 1: Add `verify_email` action**

Insert after line 178 (after the `toggle_test_user` block's closing `}`), before line 181 (`// General update`):

```typescript
      if (action === 'verify_email') {
        if (existingUser.emailVerifiedAt) {
          return NextResponse.json(
            { error: 'User email is already verified' },
            { status: 400 }
          );
        }

        await db
          .update(users)
          .set({
            emailVerifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        await db.insert(activityLogs).values({
          userId: adminUserId,
          action: 'admin_verify_email',
          entityType: 'user',
          entityId: userId,
          metadata: { verifiedByAdmin: true },
        });

        return NextResponse.json({
          success: true,
          message: 'User email verified successfully',
        });
      }
```

- [ ] **Step 2: Build check**

Run: `pnpm build 2>&1 | head -50`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/users/\[id\]/route.ts
git commit -m "feat(admin): add verify_email action to user management API

Admins with canEditUsers permission can now manually verify a user's
email, eliminating the need for direct database access."
```

---

### Task 6: Admin Manual Email Verification — UI

**Files:**
- Modify: `app/api/admin/users/route.ts` (add emailVerifiedAt to response)
- Modify: `components/admin/UserManagement.tsx` (add field to interface + dropdown item + handler)

- [ ] **Step 1: Add `emailVerifiedAt` to admin users API response**

In `app/api/admin/users/route.ts`, find where registered users are mapped into the response. Add `emailVerifiedAt` to the user data object. Search for the field mapping section and add:

```typescript
emailVerifiedAt: user.emailVerifiedAt,
```

alongside other user fields like `isTestUser`, `lastLoginAt`, etc.

- [ ] **Step 2: Add `emailVerifiedAt` to UnifiedUser interface**

In `components/admin/UserManagement.tsx`, add to the `UnifiedUser` interface (after line 168):

```typescript
emailVerifiedAt: string | null;
```

- [ ] **Step 3: Add state and handler for verify email**

After the `handleToggleTestUser` function (around line 351), add:

```typescript
  const [verifyingEmail, setVerifyingEmail] = useState<number | null>(null);
  const handleVerifyEmail = async (user: UnifiedUser) => {
    setVerifyingEmail(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_email' }),
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => {
          if (u.id === user.id) {
            return { ...u, emailVerifiedAt: new Date().toISOString() };
          }
          return u;
        }));
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to verify email:', error);
    } finally {
      setVerifyingEmail(null);
    }
  };
```

- [ ] **Step 4: Add "Verify Email" dropdown menu item**

Add `MailCheck` to the lucide-react import (line 5-37):

```typescript
import { ..., MailCheck } from 'lucide-react';
```

In the dropdown menu, insert BEFORE the `DropdownMenuSeparator` that precedes "Mark as Test User" (before line 1378). Insert inside the `user.recordType === 'registered_user'` block:

```tsx
                                      {!user.emailVerifiedAt && (
                                        <DropdownMenuItem
                                          onClick={() => handleVerifyEmail(user)}
                                          disabled={verifyingEmail === user.id}
                                        >
                                          <MailCheck className="w-4 h-4 mr-2" />
                                          Verify Email
                                        </DropdownMenuItem>
                                      )}
```

Insert this right after line 1376 (`<>`) and before line 1378 (`<DropdownMenuSeparator />`).

- [ ] **Step 5: Build check**

Run: `pnpm build 2>&1 | head -50`
Expected: No type errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/users/route.ts components/admin/UserManagement.tsx
git commit -m "feat(admin): add Verify Email button to user management UI

Admins can now verify unverified users' emails directly from the
user management dropdown menu, without database access."
```

---

### Task 7: Final Build Verification

- [ ] **Step 1: Full build**

Run: `pnpm build`
Expected: Build completes successfully with no errors.

- [ ] **Step 2: Commit if any fixes needed**

If the build revealed issues, fix them and commit.

- [ ] **Step 3: Verify the complete changeset**

Run: `git log --oneline -6`
Expected: 6 commits (Tasks 1-6), all with descriptive messages.
