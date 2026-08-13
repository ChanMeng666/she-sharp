import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationCode } from '@/lib/invitations/service';
import { z } from 'zod';

const validateCodeSchema = z.object({
  code: z.string().min(1, 'Invitation code is required'),
  email: z.string().nullish(),
});

/**
 * POST /api/invitation-codes/validate
 * Validates an invitation code without using it.
 * Public endpoint for pre-registration validation.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = validateCodeSchema.safeParse(await request.json());
    if (!parsed.success) {
      // Keeps the `valid: false` envelope every caller of this endpoint reads.
      return NextResponse.json(
        {
          valid: false,
          error: parsed.error.errors.map((e) => e.message).join(', '),
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { code, email } = parsed.data;

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
