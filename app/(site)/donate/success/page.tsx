import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home } from "lucide-react";
import { getStripeClient } from "@/lib/stripe/config";

const impactMessages: Record<number, string> = {
  10: "Your $10 donation helps provide workshop materials for students and subsidize event tickets.",
  25: "Your $25 donation supports networking events and educator training materials.",
  50: "Your $50 donation helps bring STEM workshops to schools and supports students attending events.",
  100: "Your $100 donation funds complete workshop sessions and supports multiple accessibility initiatives.",
};

/**
 * Resolves the amount actually paid, from Stripe rather than from the URL.
 *
 * This page used to render `?amount` straight out of the query string, so
 * /donate/success?amount=1000000 produced a screenshot of She Sharp thanking
 * someone for a million dollars, with no payment involved at all. The money, the
 * database row and the receipt were never affected — but a forged thank-you on a
 * registered charity's domain is worth closing.
 *
 * `session_id` was already being passed by `success_url`; nothing read it.
 * Returns null when the session cannot be confirmed as paid, so the page falls
 * back to thanking the donor without naming a figure — never to trusting the URL.
 */
async function resolvePaidAmount(sessionId: string | undefined): Promise<number | null> {
  if (!sessionId) return null;
  try {
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" || !session.amount_total) return null;
    return Math.round(session.amount_total / 100);
  } catch {
    // An expired, unknown or wrong-mode session id is not an error worth showing
    // the donor — they have paid, and Stripe has emailed them a receipt.
    return null;
  }
}

export default async function DonateSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const amount = await resolvePaidAmount(sessionId);
  const impactMessage =
    amount !== null ? impactMessages[amount] ?? impactMessages[25] : impactMessages[25];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-24 pb-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          Thank You!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {amount !== null ? (
            <>
              Your generous donation of{" "}
              <span className="font-semibold text-brand">${amount} NZD</span> has
              been received.
            </>
          ) : (
            <>Your generous donation has been received.</>
          )}
        </p>

        <div className="mt-8 rounded-xl border border-border bg-muted/40 p-6 text-left">
          <p className="font-medium text-foreground">Your Impact</p>
          <p className="mt-1 text-sm text-muted-foreground">{impactMessage}</p>
        </div>

        <Button asChild variant="brand" className="mt-8">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <p className="mt-8 text-xs text-muted-foreground">
          A receipt has been sent to your email address. She Sharp is a
          registered non-profit organisation.
        </p>
      </div>
    </div>
  );
}
