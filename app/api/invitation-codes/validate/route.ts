import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationCode } from '@/lib/invitations/service';

/**
 * POST /api/invitation-codes/validate
 * Validates an invitation code without using it.
 * Public endpoint for pre-registration validation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Invitation code is required' },
        { status: 400 }
      );
    }

    const result = await validateInvitationCode(code);

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.error,
      });
    }

    // Check if code is for specific email
    if (email && result.code?.generatedFor) {
      if (result.code.generatedFor.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json({
          valid: false,
          error: 'This invitation code is not valid for this email address',
        });
      }
    }

    // Return limited info about the code
    return NextResponse.json({
      valid: true,
      codeType: result.code?.codeType,
      expiresAt: result.code?.expiresAt,
      isEmailSpecific: !!result.code?.generatedFor,
    });
  } catch (error) {
    console.error('Error validating invitation code:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate code' },
      { status: 500 }
    );
  }
}
