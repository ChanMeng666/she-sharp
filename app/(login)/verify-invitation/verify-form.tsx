'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { verifyOAuthInvitationCode } from './actions';
import { ActionState } from '@/lib/auth/middleware';

interface VerifyInvitationFormProps {
  userEmail: string;
  userName?: string;
}

export function VerifyInvitationForm({ userEmail, userName }: VerifyInvitationFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    verifyOAuthInvitationCode,
    { error: '' }
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: 'url(/img/bauhaus-1755865025052.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="flex items-center space-x-2 transition-all duration-200 group hover:opacity-80"
          >
            <div className="relative w-32 h-10">
              <Image
                src="/logos/she-sharp-logo.svg"
                alt="She Sharp"
                fill
                sizes="128px"
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-2xl shadow-foreground/10 bg-background/95 backdrop-blur-xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Verify Your Invitation
              </h2>
              <p className="text-sm text-muted-foreground">
                Welcome{userName ? `, ${userName}` : ''}! To complete your registration, please enter your invitation code.
              </p>
            </div>

            {/* Signed in as */}
            <div className="mb-6 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="text-muted-foreground">Signed in as </span>
                <span className="font-medium text-foreground">{userEmail}</span>
              </div>
            </div>

            <form className="space-y-4" action={formAction}>
              <div className="space-y-2">
                <Label
                  htmlFor="invitationCode"
                  className="text-sm font-medium text-foreground"
                >
                  Invitation Code
                </Label>
                <Input
                  id="invitationCode"
                  name="invitationCode"
                  type="text"
                  required
                  maxLength={20}
                  className="uppercase"
                  placeholder="SHP-XXXX-XXXX-XXXX"
                  defaultValue={state.invitationCode || ''}
                />
              </div>

              {state?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-red-700 text-sm">{state.error}</div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>
            </form>

            {/* Help text */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an invitation code?
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/mentorship/join"
                  className="text-sm text-center text-primary hover:underline"
                >
                  Apply as a Mentee (requires payment)
                </Link>
                <Link
                  href="/mentorship/become-a-mentor"
                  className="text-sm text-center text-primary hover:underline"
                >
                  Apply as a Mentor (requires approval)
                </Link>
              </div>
            </div>

            {/* Sign out link */}
            <div className="mt-4 text-center">
              <Link
                href="/api/auth/signout"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Sign in with a different account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
