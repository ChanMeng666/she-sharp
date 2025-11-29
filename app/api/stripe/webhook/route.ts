import { NextRequest, NextResponse } from 'next/server';
import {
  constructWebhookEvent,
  handleSuccessfulPayment,
  handleSubscriptionCancelled,
  handleSubscriptionRenewed,
} from '@/lib/stripe/service';
import Stripe from 'stripe';

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          const result = await handleSuccessfulPayment(session);
          console.log('Payment processed:', result);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        console.log('Subscription cancelled:', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceData = invoice as unknown as { billing_reason: string; subscription: string | null };
        // Only handle renewal payments (not initial)
        if (invoiceData.billing_reason === 'subscription_cycle') {
          await handleSubscriptionRenewed(invoice);
          console.log('Subscription renewed:', invoiceData.subscription);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn('Payment failed for invoice:', invoice.id);
        // Could send notification email here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhook (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};
