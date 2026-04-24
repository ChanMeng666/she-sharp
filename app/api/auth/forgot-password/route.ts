import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/auth/password-reset';
import { sendPasswordResetEmail } from '@/lib/email/service';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Get IP and user agent for security logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const result = await createPasswordResetToken(
      email,
      ipAddress || undefined,
      userAgent || undefined
    );

    // Deliver the reset link if a token was issued. We intentionally swallow
    // email errors so the response does not reveal whether the account exists.
    if (result.success && result.token && result.email) {
      try {
        await sendPasswordResetEmail(result.email, result.token);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    // Always return success for security (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}