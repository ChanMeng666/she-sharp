import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/config";
import { getBaseUrl } from "@/lib/email/service";
import { z } from "zod";
import { invalidBody } from "@/lib/api/validation";

const VALID_AMOUNTS = [10, 25, 50, 100] as const;

const donateSchema = z.object({
  amount: z.number().refine((v) => (VALID_AMOUNTS as readonly number[]).includes(v), {
    message: "Invalid donation amount. Please choose $10, $25, $50, or $100.",
  }),
});

/**
 * POST /api/stripe/donate
 * Creates a Stripe checkout session for one-time donation.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = donateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidBody(parsed.error);
    }
    const { amount } = parsed.data;

    const stripe = getStripeClient();
    const baseUrl = getBaseUrl();

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "nzd",
            product_data: {
              name: "Donation to She Sharp",
              description: `One-time donation of $${amount} NZD to support women in STEM`,
              images: [
                `${baseUrl}/img/legacy-site/misc/donate-banner.webp`,
              ],
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      // No `amount` param: the success page resolves the figure from Stripe using
      // session_id. It used to render this query value directly, which let anyone
      // forge a thank-you for any sum on the charity's own domain.
      success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      // Back to the page the donor came from. `/donate/checkout` was deleted in
      // 05bf4aeb when the multi-step flow collapsed into one page, and this URL
      // was left pointing at it — every cancelled checkout landed on a 404. No
      // `amount` param: `/donate` is a server component that reads none, and
      // `DonateForm` owns the selection in its own state.
      cancel_url: `${baseUrl}/donate`,
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
