import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/service';
import { getUser } from '@/lib/db/queries';
import { getBaseUrl } from '@/lib/email/service';
import { buildMenteeSubmissionToken } from '@/lib/forms/submission-token';
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

    // Cancelling drops the applicant back on the payment page, which reads a
    // signed handle rather than the raw submission id — that id is a small
    // sequential integer and the page behind it shows a name and an email
    // address with no session. If the token cannot be signed, send them to the
    // programme page instead of a URL the endpoint will refuse.
    const cancelToken = formSubmissionId ? buildMenteeSubmissionToken(formSubmissionId) : null;
    const session = await createCheckoutSession({
      email,
      userId: user?.id,
      formSubmissionId: formSubmissionId ?? undefined,
      successUrl: `${baseUrl}/mentorship/mentee/success`,
      cancelUrl: cancelToken
        ? `${baseUrl}/mentorship/mentee/payment?t=${encodeURIComponent(cancelToken)}`
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
