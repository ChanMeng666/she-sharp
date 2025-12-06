import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

const protectedRoutes = '/dashboard';
const verificationRoute = '/verify-invitation';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const nextAuthSessionToken = request.cookies.get('authjs.session-token') ||
                                request.cookies.get('__Secure-authjs.session-token');
  const oauthVerifiedCookie = request.cookies.get('oauth-verified');

  const isProtectedRoute = pathname.startsWith(protectedRoutes);
  const isVerificationRoute = pathname.startsWith(verificationRoute);

  // Check for either custom session or NextAuth session
  const hasCustomSession = !!sessionCookie;
  const hasNextAuthSession = !!nextAuthSessionToken;
  const hasValidSession = hasCustomSession || hasNextAuthSession;

  // If no session at all, redirect to sign-in for protected routes
  if (isProtectedRoute && !hasValidSession) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // For OAuth users (NextAuth session only, no custom session),
  // check if they need invitation verification
  if (isProtectedRoute && hasNextAuthSession && !hasCustomSession) {
    // Check for verification status cookie
    if (!oauthVerifiedCookie) {
      return NextResponse.redirect(new URL('/verify-invitation', request.url));
    }
  }

  // Handle verification route access
  if (isVerificationRoute) {
    // Only allow if user has NextAuth session (OAuth user)
    if (!hasNextAuthSession) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    // If user has custom session (credential login), redirect to dashboard
    if (hasCustomSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // If OAuth user already verified, redirect to dashboard
    if (oauthVerifiedCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
