'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';
import { Suspense } from 'react';

function LogoHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6">
      <Link href="/" className="inline-block">
        <Image
          src="/logos/she-sharp-logo.svg"
          alt="She Sharp"
          width={120}
          height={40}
          className="h-8 md:h-10 w-auto"
        />
      </Link>
    </header>
  );
}

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please check that OAuth providers are properly configured.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'OAuthSignin':
        return 'Error occurred while trying to authenticate with OAuth provider.';
      case 'OAuthCallback':
        return 'Error occurred while handling the OAuth callback.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth provider account.';
      case 'EmailCreateAccount':
        return 'Could not create email provider account.';
      case 'Callback':
        return 'Error occurred in the OAuth callback handler.';
      case 'OAuthAccountNotLinked':
        return 'To confirm your identity, sign in with the same account you used originally.';
      case 'EmailSignin':
        return 'The email could not be sent.';
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LogoHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {getErrorMessage()}
          </p>
          {error === 'Configuration' && (
            <div className="mt-4 rounded-md bg-yellow-50 p-4">
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">For administrators:</p>
                <ul className="mt-2 list-disc pl-5 text-left">
                  <li>Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set</li>
                  <li>Verify GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set</li>
                  <li>Verify NEXTAUTH_URL is set to your deployment URL</li>
                  <li>Verify NEXTAUTH_SECRET is set</li>
                  <li>Check that callback URLs match your OAuth provider settings</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <Link
            href="/sign-in"
            className="inline-flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Sign In
          </Link>
          <Link
            href="/"
            className="inline-flex w-full justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Go to Homepage
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <AlertCircle className="h-6 w-6 text-gray-400" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}