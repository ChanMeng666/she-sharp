'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, Shield, CheckCircle } from 'lucide-react';

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
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-light/20 via-periwinkle-light/10 to-mint-light/15">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-mint-dark/5 to-periwinkle-dark/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-dark/5 to-mint-light/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl shadow-purple-dark/10 bg-white/95 backdrop-blur-xl">
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="flex justify-center">
              <div className="p-6 bg-gradient-to-br from-mint-dark to-mint-dark/80 rounded-3xl shadow-lg">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-2xl font-bold text-navy-dark">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-gray text-base leading-relaxed">
                We've sent password reset instructions to<br />
                <span className="font-semibold text-navy-dark">{email}</span>
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="p-4 bg-mint-light/50 border border-mint-dark/20 rounded-xl">
              <p className="text-sm text-navy-dark leading-relaxed">
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
                className="text-sm font-semibold text-purple-dark hover:text-purple-mid underline transition-colors"
              >
                Try again
              </button>
            </div>

            <div className="space-y-3">
              <Button
                asChild
                variant="gradient"
                size="lg"
                className="w-full h-12 rounded-xl shadow-lg shadow-purple-dark/25"
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
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-light/20 via-periwinkle-light/10 to-mint-light/15">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-dark/5 to-periwinkle-dark/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-mint-dark/5 to-purple-light/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl shadow-purple-dark/10 bg-white/95 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-purple-dark to-periwinkle-dark rounded-2xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-navy-dark">
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
              <div className="p-4 bg-mint-light/50 border border-mint-dark/20 rounded-xl">
                <div className="text-navy-dark text-sm font-medium">{message}</div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-navy-dark">
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
                className="h-11 px-4 rounded-xl border-2 border-periwinkle-light bg-white/80 backdrop-blur-sm text-navy-dark placeholder:text-gray focus:border-purple-dark focus:ring-4 focus:ring-purple-dark/10 transition-all duration-200"
              />
            </div>

            <Button 
              type="submit" 
              variant="gradient"
              size="lg"
              className="w-full h-12 rounded-xl shadow-lg shadow-purple-dark/25 hover:shadow-xl hover:shadow-purple-dark/30 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Sending Instructions...' : 'Send Reset Instructions'}
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-12 rounded-xl border-2 border-purple-dark/20 hover:border-purple-dark hover:bg-purple-light/30 transition-all duration-300"
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