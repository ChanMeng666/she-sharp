import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth.config';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { applyInvitationCode } from '@/lib/invitations/apply-code';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const userId = parseInt(session.user.id);

  const [user] = await db
    .select({
      passwordHash: users.passwordHash,
      inviteCodeVerifiedAt: users.inviteCodeVerifiedAt,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // If user has password (credential signup) or already verified invitation code,
  // set oauth-verified cookie and redirect to dashboard
  if (user.passwordHash || user.inviteCodeVerifiedAt) {
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('oauth-verified', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    return response;
  }

  // Check for pending-invite-code cookie (set during sign-up pre-validation)
  const cookieStore = await cookies();
  const pendingCode = cookieStore.get('pending-invite-code')?.value;

  if (pendingCode) {
    // Try to auto-apply the invitation code
    const result = await applyInvitationCode(userId, pendingCode, user.email);

    // Always clear the pending cookie regardless of result
    const response = result.success
      ? NextResponse.redirect(new URL('/dashboard', request.url))
      : NextResponse.redirect(new URL('/verify-invitation', request.url));

    response.cookies.delete('pending-invite-code');

    if (result.success) {
      response.cookies.set('oauth-verified', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }

    return response;
  }

  // No pending code — fallback to manual invitation verification page
  return NextResponse.redirect(new URL('/verify-invitation', request.url));
}
