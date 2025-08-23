'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-strength';
import { OAuthButtons } from '@/components/ui/oauth-buttons';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <div 
      className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: 'url(/img/bauhaus-1755865242427.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/60 backdrop-blur-sm"></div>

      <div className="w-full max-w-md relative z-10">
        <Card className="border-0 shadow-2xl shadow-purple-dark/10 bg-white/95 backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-navy-dark">
                {mode === 'signin' ? 'Welcome back' : 'Join She Sharp'}
              </CardTitle>
              <CardDescription className="text-gray text-base">
                {mode === 'signin'
                  ? 'Sign in to continue your journey'
                  : 'Create your account and start empowering your tech career'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form className="space-y-5" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-navy-dark"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={state.email}
                  required
                  maxLength={50}
                  className="h-11 px-4 rounded-xl border-2 border-periwinkle-light bg-white/80 backdrop-blur-sm text-navy-dark placeholder:text-gray focus:border-purple-dark focus:ring-4 focus:ring-purple-dark/10 transition-all duration-200"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-navy-dark"
                  >
                    Password
                  </Label>
                  {mode === 'signin' && (
                    <Link
                      href="/forgot-password"
                      className="text-sm text-purple-dark hover:text-purple-mid hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  defaultValue={state.password}
                  required
                  minLength={8}
                  maxLength={100}
                  className="h-11 px-4 rounded-xl border-2 border-periwinkle-light bg-white/80 backdrop-blur-sm text-navy-dark placeholder:text-gray focus:border-purple-dark focus:ring-4 focus:ring-purple-dark/10 transition-all duration-200"
                  placeholder="Enter your password"
                  showStrength={mode === 'signup'}
                  showToggle={true}
                />
              </div>

              {mode === 'signin' && (
                <div className="flex items-center space-x-3 p-4 bg-periwinkle-light/30 rounded-xl">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    value="on"
                    className="h-4 w-4 rounded border-2 border-purple-dark text-purple-dark focus:ring-purple-dark focus:ring-2 transition-all"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-medium text-navy-dark cursor-pointer select-none"
                  >
                    Remember me for 30 days
                  </Label>
                </div>
              )}

              {state?.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-red-700 text-sm font-medium">{state.error}</div>
                </div>
              )}

              <Button
                type="submit"
                variant="neumorphism"
                size="lg"
                className="w-full h-12 rounded-xl font-semibold text-lg transition-all duration-300"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Processing...
                  </>
                ) : mode === 'signin' ? (
                  'Sign in to your account'
                ) : (
                  'Create your account'
                )}
              </Button>
            </form>

            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-periwinkle-light/50" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              <OAuthButtons mode={mode} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-periwinkle-light/50" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray font-medium">
                    {mode === 'signin'
                      ? 'New to She Sharp?'
                      : 'Already have an account?'}
                  </span>
                </div>
              </div>

              <Button
                asChild
                variant="outline-thick"
                size="lg"
                className="w-full h-12 rounded-xl font-medium transition-all duration-300"
              >
                <Link
                  href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                    redirect ? `?redirect=${redirect}` : ''
                  }${priceId ? `&priceId=${priceId}` : ''}`}
                >
                  {mode === 'signin'
                    ? 'Create a new account'
                    : 'Sign in to existing account'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
