'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength indicators
  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*]/.test(password) },
  ];

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setIsValidating(false);
      setError('No reset token provided');
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${token}`);
      const data = await response.json();
      
      if (data.valid) {
        setIsTokenValid(true);
      } else {
        setError('Invalid or expired reset link');
      }
    } catch (err) {
      setError('Failed to validate reset link');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/sign-in?reset=success');
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div 
        className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/img/bauhaus-1755865242427.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Background overlay for better readability */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
        <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl shadow-foreground/10 bg-background/95 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-3xl font-bold text-foreground">Invalid Reset Link</CardTitle>
            <CardDescription className="mt-2">
              {error || 'This password reset link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-2">
            <Link href="/forgot-password" className="w-full">
              <Button variant="default" size="lg" className="w-full h-12 rounded-xl font-semibold">
                Request New Reset Link
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full">
              <Button variant="outline" size="lg" className="w-full h-12 rounded-xl font-medium">
                Back to Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div 
        className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/img/bauhaus-1755865242427.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Background overlay for better readability */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
        <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl shadow-foreground/10 bg-background/95 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-3xl font-bold text-foreground">Password Reset Successful!</CardTitle>
            <CardDescription className="mt-2">
              Your password has been reset successfully. Redirecting to sign in...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/img/bauhaus-1755865242427.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl shadow-foreground/10 bg-background/95 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <CardTitle className="text-3xl font-bold text-foreground">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {password && (
              <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                <ul className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className={`mr-2 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        req.met ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {req.met && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={req.met ? 'text-green-700' : 'text-gray-500'}>
                        {req.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {confirmPassword && password !== confirmPassword && (
              <Alert variant="destructive">
                <AlertDescription>Passwords do not match</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full h-12 rounded-xl font-semibold text-lg"
              disabled={isLoading || !passwordRequirements.every(req => req.met) || password !== confirmPassword}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Link href="/sign-in" className="w-full">
              <Button type="button" variant="outline" size="lg" className="w-full h-12 rounded-xl font-medium">
                Cancel
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}