import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth.config';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash, inviteCodeVerifiedAt: users.inviteCodeVerifiedAt })
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)))
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

  // Otherwise redirect to invitation verification page
  return NextResponse.redirect(new URL('/verify-invitation', request.url));
}
