import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBaseUrl } from '@/lib/email/service';

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Clear all auth-related cookies with various configurations
    const cookieNames = [
      'authjs.session-token',
      '__Secure-authjs.session-token',
      'authjs.callback-url', 
      '__Secure-authjs.callback-url',
      'authjs.csrf-token',
      '__Secure-authjs.csrf-token',
      'session',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token'
    ];
    
    // Delete all cookies
    for (const cookieName of cookieNames) {
      try {
        cookieStore.delete(cookieName);
        // Also try with path
        cookieStore.delete({
          name: cookieName,
          path: '/'
        });
      } catch (e) {
        // Ignore errors for non-existent cookies
      }
    }
    
    // Set cookies to expire with various domain configurations
    const isProduction = process.env.NODE_ENV === 'production';
    const baseOptions = {
      maxAge: 0,
      path: '/',
      expires: new Date(0),
    };
    
    // Try multiple cookie configurations to ensure clearing
    const configurations = [
      { ...baseOptions },
      { ...baseOptions, secure: true, sameSite: 'lax' as const },
      { ...baseOptions, secure: isProduction, sameSite: 'lax' as const, httpOnly: true },
    ];
    
    for (const cookieName of cookieNames) {
      for (const config of configurations) {
        try {
          cookieStore.set(cookieName, '', config);
        } catch (e) {
          // Ignore errors
        }
      }
    }
    
    // Return HTML that clears localStorage/sessionStorage and redirects
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Signing out...</title>
        </head>
        <body>
          <script>
            // Clear client-side storage but preserve cookie preferences
            try {
              // Save cookie preferences before clearing
              const cookieConsent = localStorage.getItem('cookie-consent');
              const cookieConsentDate = localStorage.getItem('cookie-consent-date');
              
              // Clear all localStorage except cookie preferences
              const keysToKeep = ['cookie-consent', 'cookie-consent-date'];
              const allKeys = Object.keys(localStorage);
              for (const key of allKeys) {
                if (!keysToKeep.includes(key)) {
                  localStorage.removeItem(key);
                }
              }
              
              // Clear sessionStorage completely (doesn't contain cookie preferences)
              sessionStorage.clear();
              
              // Restore cookie preferences if they existed
              if (cookieConsent) localStorage.setItem('cookie-consent', cookieConsent);
              if (cookieConsentDate) localStorage.setItem('cookie-consent-date', cookieConsentDate);
            } catch (e) {}
            
            // Clear NextAuth client-side session
            try {
              // Broadcast to other tabs
              const bc = new BroadcastChannel('nextauth.message');
              bc.postMessage({ event: 'session', data: { trigger: 'signout' }});
              bc.close();
            } catch (e) {}
            
            // Redirect to home page
            window.location.href = '/';
          </script>
          <p>Signing out...</p>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Complete signout error:', error);
    // Still redirect on error
    return NextResponse.redirect(new URL('/', getBaseUrl()));
  }
}