import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/service';
import { getUser } from '@/lib/db/queries';
import { getBaseUrl } from '@/lib/email/service';
import { z } from 'zod';
import { invalidBody } from '@/lib/api/validation';

const checkoutSchema = z.object({
  email: z.string().email('Email is required'),
  formSubmissionId: z.coerce.number().int().positive().nullish(),
});

/**
 * POST /api/stripe/checkout
 * Creates a Stripe checkout session for membership purchase.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidBody(parsed.error);
    }
    const { email, formSubmissionId } = parsed.data;

    // Check if user is logged in
    const user = await getUser();

    const baseUrl = getBaseUrl();
    const session = await createCheckoutSession({
      email,
      userId: user?.id,
      formSubmissionId: formSubmissionId ?? undefined,
      successUrl: `${baseUrl}/mentorship/mentee/success`,
      cancelUrl: formSubmissionId
        ? `${baseUrl}/mentorship/mentee/payment?id=${formSubmissionId}`
        : `${baseUrl}/mentorship/mentee`,
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
