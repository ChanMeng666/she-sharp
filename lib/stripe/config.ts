import Stripe from 'stripe';

// Stripe client - initialized lazily to avoid build errors
let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  return stripeClient;
}

// For backward compatibility
export const stripe = {
  get checkout() { return getStripeClient().checkout; },
  get customers() { return getStripeClient().customers; },
  get subscriptions() { return getStripeClient().subscriptions; },
  get billingPortal() { return getStripeClient().billingPortal; },
  get webhooks() { return getStripeClient().webhooks; },
};

// Membership pricing configuration
export const MEMBERSHIP_PRICES = {
  annual: {
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID || '',
    amount: 10000, // $100 NZD in cents
    currency: 'nzd',
    interval: 'year' as const,
    name: 'Annual Membership',
    description: 'She Sharp Annual Mentorship Programme Membership',
  },
} as const;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export type MembershipPriceKey = keyof typeof MEMBERSHIP_PRICES;
