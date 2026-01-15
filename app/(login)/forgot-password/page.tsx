'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setMessage('If an account exists with this email, we have sent password reset instructions.');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
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
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="space-y-3">
              <CardTitle className="text-3xl font-bold text-foreground">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-gray text-base leading-relaxed">
                We've sent password reset instructions to<br />
                <span className="font-semibold text-foreground">{email}</span>
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted border border-border rounded-xl">
              <p className="text-sm text-foreground leading-relaxed">
                Please check your email inbox and follow the instructions to reset your password.
                The link will expire in <span className="font-semibold">1 hour</span>.
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray mb-3">
                Didn't receive the email? Check your spam folder or
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="text-sm font-semibold text-foreground hover:text-foreground/80 underline transition-colors"
              >
                Try again
              </button>
            </div>

            <div className="space-y-3">
              <Button
                asChild
                size="lg"
                className="w-full"
              >
                <Link href="/sign-in">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
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
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-foreground">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-gray text-base">
              Enter your email address and we'll send you instructions to reset your password.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="text-red-700 text-sm font-medium">{error}</div>
              </div>
            )}
            {message && (
              <div className="p-4 bg-muted border border-border rounded-xl">
                <div className="text-foreground text-sm font-medium">{message}</div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 px-4 rounded-xl border-2 border-border glass-overlay text-foreground focus:border-border focus:ring-4 focus:ring-border/10 transition-all duration-200"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending Instructions...' : 'Send Reset Instructions'}
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Link href="/sign-in">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}