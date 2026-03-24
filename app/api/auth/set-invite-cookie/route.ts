import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationCode } from '@/lib/invitations/service';

/**
 * POST /api/auth/set-invite-cookie
 * Validates an invitation code and sets it as an httpOnly cookie
 * for automatic application after OAuth sign-up.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invitation code is required' },
        { status: 400 }
      );
    }

    // Validate the code (check only, don't consume)
    const result = await validateInvitationCode(code);

    if (!result.valid || !result.code) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Invalid invitation code',
      });
    }

    // Set the code as an httpOnly cookie for OAuth flow
    const response = NextResponse.json({
      success: true,
      codeType: result.code.codeType,
      expiresAt: result.code.expiresAt,
      isEmailSpecific: !!result.code.generatedFor,
    });

    response.cookies.set('pending-invite-code', code.toUpperCase().trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes — enough for OAuth round-trip
    });

    return response;
  } catch (error) {
    console.error('Error setting invite cookie:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process invitation code' },
      { status: 500 }
    );
  }
}
