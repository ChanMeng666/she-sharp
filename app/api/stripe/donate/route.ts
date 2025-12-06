import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/config";

const VALID_AMOUNTS = [10, 25, 50, 100];

/**
 * POST /api/stripe/donate
 * Creates a Stripe checkout session for one-time donation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, email } = body;

    // Validate amount
    if (!amount || !VALID_AMOUNTS.includes(amount)) {
      return NextResponse.json(
        { error: "Invalid donation amount. Please choose $10, $25, $50, or $100." },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "nzd",
            product_data: {
              name: "Donation to She Sharp",
              description: `One-time donation of $${amount} NZD to support women in STEM`,
              images: [
                "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/6493c44db056b3b104668a13_donate-banner.webp",
              ],
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}&amount=${amount}`,
      cancel_url: `${baseUrl}/donate/checkout?amount=${amount}`,
      metadata: {
        type: "donation",
        amount: amount.toString(),
      },
      submit_type: "donate",
      billing_address_collection: "auto",
      allow_promotion_codes: false,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating donation checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
