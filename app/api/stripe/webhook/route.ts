// Temporarily disabled - Stripe not configured
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Stripe webhook temporarily disabled
  return NextResponse.json(
    { error: 'Stripe webhook is temporarily disabled. Please configure STRIPE_SECRET_KEY environment variable.' },
    { status: 503 }
  );
}

// import Stripe from 'stripe';
// import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
// import { NextRequest, NextResponse } from 'next/server';

// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// export async function POST(request: NextRequest) {
//   const payload = await request.text();
//   const signature = request.headers.get('stripe-signature') as string;

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
//   } catch (err) {
//     console.error('Webhook signature verification failed.', err);
//     return NextResponse.json(
//       { error: 'Webhook signature verification failed.' },
//       { status: 400 }
//     );
//   }

//   switch (event.type) {
//     case 'customer.subscription.updated':
//     case 'customer.subscription.deleted':
//       const subscription = event.data.object as Stripe.Subscription;
//       await handleSubscriptionChange(subscription);
//       break;
//     default:
//       console.log(`Unhandled event type ${event.type}`);
//   }

//   return NextResponse.json({ received: true });
// }
