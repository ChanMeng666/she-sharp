import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

const protectedRoutes = '/dashboard';
const verificationRoute = '/verify-invitation';

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>She Sharp - We'll Be Back Soon</title>
  <link rel="icon" href="/logos/she-sharp-logo-purple-dark-130x130.svg">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f4f4fa;
      padding: 1rem;
      position: relative;
      overflow: hidden;
    }
    .bg-circle {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .bg-circle-1 { top: 15%; right: -8rem; width: 16rem; height: 16rem; background: #f7e5f3; opacity: 0.6; }
    .bg-circle-2 { bottom: 15%; left: -8rem; width: 16rem; height: 16rem; background: #eaf2ff; opacity: 0.6; }
    .bg-circle-3 { top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24rem; height: 24rem; background: #effefb; opacity: 0.4; }
    .card {
      position: relative;
      z-index: 1;
      background: white;
      border: 1px solid #eaf2ff;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
      max-width: 28rem;
      width: 100%;
      padding: 3rem;
      text-align: center;
    }
    .logo { width: 80px; height: 80px; margin: 0 auto 2rem; }
    .title { font-size: 2rem; font-weight: 700; color: #1f1e44; margin-bottom: 1rem; }
    .description { font-size: 1.05rem; line-height: 1.7; color: rgba(31, 30, 68, 0.7); margin-bottom: 2rem; }
    .divider { border: none; border-top: 1px solid #eaf2ff; margin: 0 0 1.5rem; }
    .footer { font-size: 0.875rem; color: rgba(31, 30, 68, 0.5); }
    .brand { color: #9b2e83; }
  </style>
</head>
<body>
  <div class="bg-circle bg-circle-1"></div>
  <div class="bg-circle bg-circle-2"></div>
  <div class="bg-circle bg-circle-3"></div>
  <div class="card">
    <img src="/logos/she-sharp-logo-purple-dark-130x130.svg" alt="She Sharp" class="logo">
    <h1 class="title">We'll Be Back Soon</h1>
    <p class="description">
      Our website is currently undergoing scheduled maintenance.
      We're working to bring you a better experience and will be back online shortly.
    </p>
    <hr class="divider">
    <p class="footer">&copy; 2026 <span class="brand">She Sharp</span> &mdash; Connecting Women in Technology</p>
  </div>
</body>
</html>`;

export async function proxy(request: NextRequest) {
  // Maintenance mode: return 503 page when enabled via environment variable
  if (process.env.MAINTENANCE_MODE === 'true') {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Retry-After': '3600',
      },
    });
  }
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
  matcher: ['/((?!_next/static|_next/image|logos|favicon\\.ico).*)']
};
