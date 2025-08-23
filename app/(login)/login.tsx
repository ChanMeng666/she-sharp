'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-strength';
import { OAuthButtons } from '@/components/ui/oauth-buttons';
import { CircleIcon, Loader2 } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-light/30 to-periwinkle-light/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-purple-dark" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-navy-dark">
          {mode === 'signin'
            ? 'Sign in to your account'
            : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />
          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-navy-dark"
            >
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-purple-light placeholder-gray text-navy-dark focus:outline-none focus:ring-purple-dark focus:border-purple-dark focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-navy-dark"
              >
                Password
              </Label>
              {mode === 'signin' && (
                <Link
                  href="/forgot-password"
                  className="text-sm text-purple-dark hover:text-purple-mid hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="mt-1">
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
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-purple-light placeholder-gray text-navy-dark focus:outline-none focus:ring-purple-dark focus:border-purple-dark focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                showStrength={mode === 'signup'}
                showToggle={true}
              />
            </div>
          </div>

          {mode === 'signin' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                value="on"
                className="h-4 w-4 rounded border-gray-300 text-purple-dark focus:ring-purple-dark"
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none cursor-pointer select-none"
              >
                Remember me for 30 days
              </Label>
            </div>
          )}

          {state?.error && (
            <div className="text-red-500 text-sm">{state.error}</div>
          )}

          <div>
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full rounded-full"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Sign up'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <OAuthButtons mode={mode} />
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray">
                {mode === 'signin'
                  ? 'New to our platform?'
                  : 'Already have an account?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-full"
            >
              <Link
                href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                  redirect ? `?redirect=${redirect}` : ''
                }${priceId ? `&priceId=${priceId}` : ''}`}
              >
                {mode === 'signin'
                  ? 'Create an account'
                  : 'Sign in to existing account'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
