'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationStatus('success');
        setMessage('Your email has been verified successfully!');
        setTimeout(() => {
          router.push('/sign-in?verified=true');
        }, 3000);
      } else {
        setVerificationStatus('error');
        setMessage(data.error || 'Failed to verify email. The link may be invalid or expired.');
      }
    } catch (err) {
      setVerificationStatus('error');
      setMessage('An error occurred while verifying your email.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setMessage('Email address not found. Please sign up again.');
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage('Failed to resend verification email. Please try again.');
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // If token is provided, show verification in progress or result
  if (token) {
    if (isVerifying) {
      return (
        <div 
          className="flex min-h-screen items-center justify-center p-4 relative"
          style={{
            backgroundImage: 'url(/img/bauhaus-1755865242427.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Background overlay for better readability */}
          <div className="absolute inset-0 glass-overlay"></div>
          <Card className="w-full max-w-md relative z-10 glass-card rounded-[50px]">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="flex justify-center">
                <RefreshCw className="h-12 w-12 text-foreground animate-spin" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">Verifying Your Email</CardTitle>
              <CardDescription className="mt-2">
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    return (
      <div 
        className="flex min-h-screen items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/img/bauhaus-1755865242427.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Background overlay for better readability */}
        <div className="absolute inset-0 glass-overlay"></div>
        <Card className="w-full max-w-md relative z-10 glass-card rounded-[50px]">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-3xl font-bold text-foreground">
              {verificationStatus === 'success' ? 'Email Verified!' : 'Verification Failed'}
            </CardTitle>
            <CardDescription className="mt-2">{message}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            {verificationStatus === 'success' ? (
              <p className="text-center text-sm text-gray-600">
                Redirecting to sign in page...
              </p>
            ) : (
              <>
                <Link href="/sign-up" className="w-full">
                  <Button variant="default" size="lg" className="w-full">
                    Sign Up Again
                  </Button>
                </Link>
                <Link href="/sign-in" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no token, show the email verification pending page
  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/img/bauhaus-1755865242427.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 glass-overlay"></div>
      <Card className="w-full max-w-md relative z-10 glass-card rounded-[50px]">
        <CardHeader className="text-center space-y-4 pb-8">
          <CardTitle className="text-3xl font-bold text-foreground">Verify Your Email</CardTitle>
          <CardDescription className="mt-2">
            We've sent a verification link to your email address
            {email && (
              <>
                <br />
                <strong className="text-gray-700">{email}</strong>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              Please check your email inbox and click the verification link to activate your account.
              The link will expire in 24 hours.
            </AlertDescription>
          </Alert>
          
          {message && (
            <Alert className={message.includes('sent') ? '' : 'border-red-200 bg-red-50'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the email? Check your spam folder or
            </p>
            <Button
              onClick={resendVerification}
              disabled={isResending || !email}
              variant="default"
              size="lg"
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          <Link href="/sign-in" className="w-full">
            <Button variant="outline" size="lg" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}