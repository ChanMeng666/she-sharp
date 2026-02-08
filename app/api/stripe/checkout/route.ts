import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/service';
import { getUser } from '@/lib/db/queries';

/**
 * POST /api/stripe/checkout
 * Creates a Stripe checkout session for membership purchase.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, formSubmissionId } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user is logged in
    const user = await getUser();

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({
      email,
      userId: user?.id,
      formSubmissionId,
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
