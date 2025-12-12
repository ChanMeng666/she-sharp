import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth/auth.config';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { VerifyInvitationForm } from './verify-form';

export const metadata = {
  title: 'Verify Invitation - She Sharp',
  description: 'Enter your invitation code to complete registration',
};

async function VerifyInvitationContent() {
  // Check for OAuth session
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Get user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)))
    .limit(1);

  if (!user) {
    redirect('/sign-in');
  }

  // If user already verified invitation code or has password (credential signup),
  // set the oauth-verified cookie and redirect to dashboard
  if (user.inviteCodeVerifiedAt || user.passwordHash) {
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'oauth-verified',
      value: 'true',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    redirect('/dashboard');
  }

  return (
    <VerifyInvitationForm
      userEmail={user.email}
      userName={user.name || undefined}
    />
  );
}

export default function VerifyInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <VerifyInvitationContent />
    </Suspense>
  );
}
